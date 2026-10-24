import { appendFileSync, cpSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import type { Layer, Mutation } from './types.ts';

const SKIPPED = new Set(['dist', 'out', '.next', '.angular']);

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
 * A fresh copy of the half `dir` at `<root>/.run-<dir>-<tag>/`, a direct child of the root so Bun's relative links
 * resolve (F3), with the app marker on the entry and the mutation applied. The half and the root's
 * `node_modules/.bun` are only read.
 */
export function scratch(dir: string, tag: string, mutation: Mutation, root = '.'): string {
  const layer = layerOf(dir);
  const from = join(root, dir);
  const to = join(root, `.run-${dir}-${tag}`);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (src) => !(SKIPPED.has(basename(src)) && relative(from, src) === basename(src)),
  });

  appendFileSync(join(to, entryOf(layer)), marker(mutation === 'app-text' ? `${dir} ·` : dir));
  if (mutation === 'app-sheet') appendFileSync(join(to, 'src/app.css'), '\n.__app-sheet{order:1}\n');
  if (mutation === 'arena-patch') {
    const link = join(to, 'node_modules', '@dravensoft', `arena-${layer}`);
    const real = realpathSync(link);
    rmSync(link, { force: true });
    cpSync(real, link, { recursive: true });
    appendFileSync(buttonModule(link, layer), `\n${ARENA_PATCH}`);
  }
  return to;
}
