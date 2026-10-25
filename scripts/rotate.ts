/* The rotation: `bun run rotate <r>` moves each half to the bundler `bundlers.json` assigns it in rotation `r`. A half that
 * changes bundler takes everything that is the bundler's from a source: a half of the same layer that holds the target
 * bundler now (its donor), or, where no half holds it, the bundler's template in `bench-kit/parts/` (Bun and esbuild in
 * rotation 0). Both make one `Source`, and one `swap` installs it: the config files, page and entry wrapper, `measure.ts`
 * (the bundler's part), the scripts and the bundler's devDependencies of `package.json`, `.gitignore` and `README.md`. The
 * half keeps its name, its dev scripts, its sources, its Arena configuration and the packages it shares with every
 * bundler (`@benches/kit`, TypeScript, the Angular packages); its old bundler's files go, its lockfile is made again by
 * `bun install`, and `bundlers.json` records the rotation. */

import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { halves, TABLE } from './build.ts';
import { assignment, table } from './bundlers/rotation.ts';
import type { BundlerId, Layer, Table } from './bundlers/types.ts';
import { template as bunTemplate } from '../bench-kit/parts/bun.ts';
import { template as esbuildTemplate } from '../bench-kit/parts/esbuild.ts';
import type { Template } from '../bench-kit/parts/template.ts';

export type Move = { dir: string; product: string; layer: Layer; from: BundlerId; to: BundlerId; donor: string | null };

/** What a half keeps whatever its bundler: its sources, its Arena configuration, its dev flow and its install. */
export const KEPT = ['.git', 'arena.config.json', 'bun.lock', 'design', 'node_modules', 'public', 'Server.ts', 'src', 'dist', 'bundlers-result.json'];

/** The scripts that are the half's own dev flow, not its bundler's. */
export const OWN_SCRIPTS = ['predev', 'dev', 'prestart', 'start', 'report'];

/** The devDependencies every bundler's half of a layer shares: they stay with the half, the rest are the bundler's. */
export const SHARED_DEV: Record<Layer, string[]> = {
  react: ['@benches/kit'],
  angular: ['@benches/kit', 'typescript', '@angular/build', '@angular/cli', '@angular/compiler-cli'],
};

/** What a build leaves at the root of a half: never a bundler's file to hand on. */
export const GENERATED = ['.next', '.angular', '.nx', '.ngc', '.parcel-cache', 'next-env.d.ts', 'tsconfig.tsbuildinfo'];

/** The templates of the bundlers no half holds in rotation 0. */
export const TEMPLATES: Partial<Record<BundlerId, (layer: Layer, pins: Record<string, string>) => Template>> = { bun: bunTemplate, esbuild: esbuildTemplate };

/** What a bundler brings to a half, from wherever it comes. */
export type Source = {
  files: Record<string, string | Buffer>;
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
  keep: string[];
  /** Made from a template, not read from a half. */
  template: boolean;
  /** The README for the half `dir` of the product `label`, whose dev flow is on `port`. */
  readme: (dir: string, label: string, port: string | null) => string | null;
};

/** The moves from the table's rotation to `rotation`: one per half whose bundler differs, with its donor (null when no half holds the target). */
export function plan(t: Table, rotation: number): Move[] {
  const now = assignment(t);
  const next = assignment(t, rotation);
  const moves: Move[] = [];
  for (const { product, layer, dir } of halves(t.products)) {
    const from = now.get(product)![layer];
    const to = next.get(product)![layer];
    if (from === to) continue;
    const donor = halves(t.products).find((one) => one.layer === layer && now.get(one.product)![layer] === to)?.dir ?? null;
    moves.push({ dir, product, layer, from, to, donor });
  }
  return moves;
}

/** `angular.json` belongs to the half, except where the builder is the bundler: its `outputPath` is the build. */
const kept = (name: string, bundlers: BundlerId[], keep: string[]): boolean => KEPT.includes(name) || keep.includes(name) || (name === 'angular.json' && !bundlers.includes('angular'));

/** The names at the root of `dir` that are the bundler's, given the bundlers involved. */
export const bundlerFiles = (root: string, dir: string, bundlers: BundlerId[], keep: string[] = []): string[] =>
  readdirSync(join(root, dir)).filter((name) => !kept(name, bundlers, keep));

type Manifest = { name: string; scripts: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; [key: string]: unknown };

const readManifest = (root: string, dir: string): Manifest => JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as Manifest;

/** The port a half's dev flow names, which its README repeats: the digits after `--port ` or `PORT ?? `, else null. */
function portOf(root: string, dir: string): string | null {
  const fromScript = readManifest(root, dir).scripts['start']?.match(/--port (\d+)/)?.[1];
  if (fromScript) return fromScript;
  const server = join(root, dir, 'Server.ts');
  return existsSync(server) ? readFileSync(server, 'utf8').match(/PORT \?\? (\d+)/)?.[1] ?? null : null;
}

/** Every file under `path` (a file, or a directory), as `<rel>` -> bytes. */
function readTree(base: string, rel: string, into: Record<string, Buffer>): void {
  const full = join(base, rel);
  if (statSync(full).isDirectory()) for (const name of readdirSync(full)) readTree(base, join(rel, name), into);
  else into[rel] = readFileSync(full);
}

/** A donor half as a source: its bundler files, its bundler scripts and its bundler's devDependencies, read under `donorRoot`. */
export function donorSource(donorRoot: string, donor: string, layer: Layer, involved: BundlerId[], donorLabel: string): Source {
  const taken = readManifest(donorRoot, donor);
  const files: Record<string, Buffer> = {};
  for (const name of bundlerFiles(donorRoot, donor, involved)) if (name !== 'package.json' && !GENERATED.includes(name)) readTree(join(donorRoot, donor), name, files);
  const donorPort = portOf(donorRoot, donor);
  return {
    files,
    scripts: Object.fromEntries(Object.entries(taken.scripts).filter(([name]) => !OWN_SCRIPTS.includes(name))),
    devDependencies: Object.fromEntries(Object.entries(taken.devDependencies ?? {}).filter(([name]) => !SHARED_DEV[layer].includes(name))),
    keep: [],
    template: false,
    readme: (dir, label, port) => {
      const text = files['README.md']?.toString('utf8');
      if (text === undefined) return null;
      const swapped = text.split(donor).join(dir).split(donorLabel).join(label);
      return donorPort && port ? swapped.split(donorPort).join(port) : swapped;
    },
  };
}

/** A bundler's template as a source. */
export function templateSource(to: BundlerId, layer: Layer, pins: Record<string, string>): Source {
  const make = TEMPLATES[to];
  if (!make) throw new Error(`no half holds ${to} and bench-kit/parts has no template for it`);
  const made = make(layer, pins);
  const { 'README.md': readme, ...files } = made.files;
  return {
    files,
    scripts: made.scripts,
    devDependencies: made.devDependencies,
    keep: made.keep,
    template: true,
    readme: (dir, label, port) => readme!.split('{{dir}}').join(dir).split('{{label}}').join(label).split('{{port}}').join(port ?? ''),
  };
}

/** Installs `source` into the half `move.dir` of `root`, whatever the source came from. */
export function swap(root: string, move: Move, label: string, source: Source): void {
  const involved = [move.from, move.to];
  const manifest = readManifest(root, move.dir);
  const port = portOf(root, move.dir);
  const own = Object.fromEntries(OWN_SCRIPTS.filter((name) => manifest.scripts[name] !== undefined).map((name) => [name, manifest.scripts[name]!]));
  // A template does not know the builder's `angular.json`: the half's own stays, as a half of any other bundler keeps it.
  const bundlers = source.template ? involved.filter((id) => id !== 'angular') : involved;
  const devDependencies = {
    ...Object.fromEntries(Object.entries(manifest.devDependencies ?? {}).filter(([name]) => SHARED_DEV[move.layer].includes(name))),
    ...source.devDependencies,
  };

  for (const name of bundlerFiles(root, move.dir, bundlers, source.keep)) rmSync(join(root, move.dir, name), { recursive: true, force: true });
  const readme = source.readme(move.dir, label, port);
  for (const [name, bytes] of Object.entries(source.files)) {
    if (name === 'README.md') continue;
    mkdirSync(dirname(join(root, move.dir, name)), { recursive: true });
    writeFileSync(join(root, move.dir, name), bytes);
  }
  if (readme !== null) writeFileSync(join(root, move.dir, 'README.md'), readme);
  const next: Manifest = {
    ...manifest,
    scripts: { ...source.scripts, ...own },
    devDependencies: Object.fromEntries(Object.entries(devDependencies).sort(([a], [b]) => a.localeCompare(b))),
  };
  writeFileSync(join(root, move.dir, 'package.json'), `${JSON.stringify(next, null, 2)}\n`);
  rmSync(join(root, move.dir, 'bun.lock'), { force: true });
}

/** Rotation `rotation`: every move, then the lockfile of each moved half (`install`), then the table's rotation. */
export function rotate(root: string, rotation: number, install = true): Move[] {
  const t = table(root);
  const moves = plan(t, rotation);
  const label = (dir: string): string => t.products.find((one) => one.react === dir || one.angular === dir)!.label;
  // Read every source before the first write: a donor may be a half that moves too.
  const staged = mkdtempSync(join(root, '.rotate-'));
  try {
    for (const dir of new Set(moves.map((move) => move.donor).filter((dir): dir is string => dir !== null))) {
      cpSync(join(root, dir), join(staged, dir), { recursive: true, filter: (from) => !/(^|[\\/])(node_modules|dist)$/.test(from) });
    }
    const sources = moves.map((move) => move.donor
      ? donorSource(staged, move.donor, move.layer, [move.from, move.to], label(move.donor))
      : templateSource(move.to, move.layer, t.pins));
    moves.forEach((move, at) => swap(root, move, label(move.dir), sources[at]!));
  } finally {
    rmSync(staged, { recursive: true, force: true });
  }
  writeFileSync(join(root, TABLE), readFileSync(join(root, TABLE), 'utf8').replace(/"rotation": \d+/, `"rotation": ${rotation}`));
  if (install) {
    for (const move of moves) {
      const done = Bun.spawnSync(['bun', 'install', '--cwd', join(root, move.dir)], { stdout: 'inherit', stderr: 'inherit' });
      if (done.exitCode !== 0) throw new Error(`${move.dir}: bun install exited ${done.exitCode}`);
    }
  }
  return moves;
}

if (import.meta.main) {
  const r = Number(process.argv[2]);
  if (!Number.isInteger(r) || r < 0) {
    console.error('usage: bun run rotate <rotation>');
    process.exit(1);
  }
  const moves = rotate('.', r);
  for (const move of moves) console.log(`rotate: ${move.dir}: ${move.from} -> ${move.to}, from ${move.donor ?? 'its template'}`);
  console.log(`rotate: rotation ${r}, ${moves.length} half(s) moved; run bun run build and bun run bundlers`);
}
