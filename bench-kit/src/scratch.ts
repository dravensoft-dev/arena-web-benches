import { appendFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import type { Layer, Mutation } from './types.ts';

/** What a build or a run leaves at the top of a half: a scratch starts without it. `node_modules` is linked, not copied. */
const SKIPPED = new Set(['dist', 'out', '.next', '.angular', '.ngc', '.parcel-cache', 'node_modules', 'bundlers-result.json']);

/** The statement `arena-patch` appends to the module that defines `ArenaButton` (F7); `__arenaPatch` is its marker. */
export const ARENA_PATCH = 'globalThis.__arenaPatch = (globalThis.__arenaPatch ?? 0) + 1;\n';

/** The layer a half directory belongs to: `react-etsy` is react, `angular-etsy` is angular. */
export function layerOf(dir: string): Layer {
  return basename(dir).startsWith('angular-') ? 'angular' : 'react';
}

/** The entry file the app marker is appended to. */
export const entryOf = (layer: Layer): string => (layer === 'react' ? 'src/Main.tsx' : 'src/main.ts');

// The cast keeps the marker legal under a strict type check (Angular, Next); the bundle reads the property name.
const marker = (value: string): string => `\n(globalThis as any).__appMarker = '${value}';\n`;

function findFile(root: string, name: string): string {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(path, name);
      if (found) return found;
    } else if (entry.name === name) return path;
  }
  return '';
}

/** The module of the installed Arena package that defines `ArenaButton`, under the scratch's own real copy. */
function buttonModule(pkgDir: string, layer: Layer): string {
  if (layer === 'angular') return join(pkgDir, 'fesm2022', 'dravensoft-arena-angular.mjs');
  return findFile(join(pkgDir, 'components'), 'ArenaButton.js');
}

/**
 * `to` as a directory holding a link to the real path of each package of `from`, one level below a scope (`@scope/*`),
 * and `.bin` as it is (its links are relative to `node_modules`, so they resolve through the new links). The packages
 * stay where the install put them, so a scratch resolves what the half resolves, whatever the install's layout. With
 * `copyArena`, Arena's own packages (`@dravensoft/*`) are real directories below the scratch, as an npm install makes
 * them: a bundler that matches paths below its project root (Parcel's `manualSharedBundles`) finds no link's target there.
 */
function linkModules(from: string, to: string, copyArena: boolean): void {
  mkdirSync(to, { recursive: true });
  if (!existsSync(from)) return;
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = join(from, entry.name);
    if (entry.name === '.bin') {
      cpSync(source, join(to, entry.name), { recursive: true, verbatimSymlinks: true });
    } else if (entry.name.startsWith('@') && !entry.isSymbolicLink()) {
      mkdirSync(join(to, entry.name), { recursive: true });
      for (const inner of readdirSync(source)) {
        const real = realpathSync(join(source, inner));
        if (copyArena && entry.name === '@dravensoft') cpSync(real, join(to, entry.name, inner), { recursive: true });
        else symlinkSync(real, join(to, entry.name, inner));
      }
    } else {
      symlinkSync(realpathSync(source), join(to, entry.name));
    }
  }
}

/**
 * A fresh copy of the half `dir` at `<root>/.run-<dir>-<tag>/`, a direct child of the root so the half's `file:../`
 * paths resolve, with the app marker on the entry and the mutation applied. The scratch's `node_modules` holds one link
 * per package of the half's, pointing at the half's own tree (the half and its install are only read).
 */
export function scratch(dir: string, tag: string, mutation: Mutation, root = '.', copyArena = false): string {
  const layer = layerOf(dir);
  const from = join(root, dir);
  const to = join(root, `.run-${dir}-${tag}`);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (src) => !(SKIPPED.has(basename(src)) && relative(from, src) === basename(src)),
  });
  linkModules(join(from, 'node_modules'), join(to, 'node_modules'), copyArena);

  appendFileSync(join(to, entryOf(layer)), marker(mutation === 'app-text' ? `${dir} ·` : dir));
  if (mutation === 'app-sheet') {
    // An Angular half without `app.css` carries the app's rules in `styles.css`; the sheet to change is that one.
    const sheet = layer === 'angular' && !existsSync(join(to, 'src/app.css')) ? 'src/styles.css' : 'src/app.css';
    appendFileSync(join(to, sheet), '\n.__app-sheet{order:1}\n');
  }
  if (mutation === 'arena-patch') {
    const link = join(to, 'node_modules', '@dravensoft', `arena-${layer}`);
    if (lstatSync(link).isSymbolicLink()) {
      const real = realpathSync(link);
      rmSync(link, { force: true });
      cpSync(real, link, { recursive: true });
    }
    appendFileSync(buttonModule(link, layer), `\n${ARENA_PATCH}`);
  }
  return to;
}

/** The scratch path `scratch(dir, tag, …)` makes, under `root`. */
export const scratchPath = (dir: string, tag: string, root = '.'): string => join(root, `.run-${dir}-${tag}`);

/**
 * Moves the scratch `from` to `to` (replacing what is there), so the next scratch can be built at `from` again: a
 * directory name enters webpack's deterministic module ids, so builds compared with each other share one. The
 * scratch's links are relative to its parent, which does not change.
 */
export function hold(from: string, to: string): string {
  rmSync(to, { recursive: true, force: true });
  renameSync(from, to);
  return to;
}

/** `file`, a path under the scratch `from`, as the same file under `to`. */
export const rebase = (file: string, from: string, to: string): string => join(to, relative(from, file));
