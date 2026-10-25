/* The rotation: `bun run rotate <r>` moves each half to the bundler `bundlers.json` assigns it in rotation `r`. A half that
 * changes bundler takes, from a half of the same layer that holds the target bundler now (its donor), everything that is
 * the bundler's: the config files, the page and entry wrapper it carries, `measure.ts` (the bundler's part), the
 * scripts and the devDependencies of `package.json`, `.gitignore` and `README.md`; it keeps its name, its dev scripts, its
 * sources and its Arena configuration. Its own files of the old bundler go, its lockfile is made again by `bun install`,
 * and `bundlers.json` records the rotation. A bundler no half holds now (Bun and esbuild in rotation 0) has no donor: its
 * part is `bench-kit/parts/<id>.ts`, and a rotation that needs it stops, naming it, before it touches anything. */

import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { halves, TABLE } from './build.ts';
import { assignment, table } from './bundlers/rotation.ts';
import type { BundlerId, Layer, Table } from './bundlers/types.ts';

export type Move = { dir: string; product: string; layer: Layer; from: BundlerId; to: BundlerId; donor: string | null };

/** What a half keeps whatever its bundler: its sources, its Arena configuration, its dev flow and its install. */
export const KEPT = ['.git', 'arena.config.json', 'bun.lock', 'design', 'node_modules', 'public', 'Server.ts', 'src', 'dist', 'bundlers-result.json'];

/** The scripts that are the half's own dev flow, not its bundler's. */
export const OWN_SCRIPTS = ['predev', 'dev', 'prestart', 'start', 'report'];

/** `angular.json` belongs to the half, except where the builder is the bundler: its `outputPath` is the build. */
const kept = (name: string, bundlers: BundlerId[]): boolean => KEPT.includes(name) || (name === 'angular.json' && !bundlers.includes('angular'));

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

/** The names at the root of `dir` that are the bundler's, given the bundlers involved. */
export const bundlerFiles = (root: string, dir: string, bundlers: BundlerId[]): string[] =>
  readdirSync(join(root, dir)).filter((name) => !kept(name, bundlers));

type Manifest = { name: string; scripts: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; [key: string]: unknown };

const readManifest = (root: string, dir: string): Manifest => JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as Manifest;

/** The port a half's dev flow names, which its README repeats: the digits after `--port ` or `PORT ?? `, else null. */
function portOf(root: string, dir: string): string | null {
  const manifest = readManifest(root, dir);
  const fromScript = manifest.scripts['start']?.match(/--port (\d+)/)?.[1];
  if (fromScript) return fromScript;
  const server = join(root, dir, 'Server.ts');
  return existsSync(server) ? readFileSync(server, 'utf8').match(/PORT \?\? (\d+)/)?.[1] ?? null : null;
}

/** Moves one half onto its donor's bundler; the donor is read under `donorRoot` (a copy made before any half moved, by default `root`). */
export function swap(root: string, move: Move, label: string, donorLabel: string, donorRoot = root): void {
  if (!move.donor) throw new Error(`${move.dir}: no half holds ${move.to}; its part is bench-kit/parts/${move.to}.ts and has no donor`);
  const involved = [move.from, move.to];
  const donor = move.donor;
  const manifest = readManifest(root, move.dir);
  const taken = readManifest(donorRoot, donor);
  const files = bundlerFiles(donorRoot, donor, involved);
  const donorPort = portOf(donorRoot, donor);
  const port = portOf(root, move.dir);
  const own = Object.fromEntries(OWN_SCRIPTS.filter((name) => manifest.scripts[name] !== undefined).map((name) => [name, manifest.scripts[name]!]));
  const scripts = { ...Object.fromEntries(Object.entries(taken.scripts).filter(([name]) => !OWN_SCRIPTS.includes(name))), ...own };

  for (const name of bundlerFiles(root, move.dir, involved)) rmSync(join(root, move.dir, name), { recursive: true, force: true });
  for (const name of files) {
    if (name === 'package.json') continue;
    cpSync(join(donorRoot, donor, name), join(root, move.dir, name), { recursive: true });
  }
  const readme = join(root, move.dir, 'README.md');
  if (existsSync(readme)) {
    let text = readFileSync(readme, 'utf8').split(donor).join(move.dir).split(donorLabel).join(label);
    if (donorPort && port) text = text.split(donorPort).join(port);
    writeFileSync(readme, text);
  }
  const next: Manifest = { ...taken, name: manifest.name, scripts };
  writeFileSync(join(root, move.dir, 'package.json'), `${JSON.stringify(next, null, 2)}\n`);
  rmSync(join(root, move.dir, 'bun.lock'), { force: true });
}

/** Rotation `rotation`: every move, then the lockfile of each moved half (`install`), then the table's rotation. */
export function rotate(root: string, rotation: number, install = true): Move[] {
  const t = table(root);
  const moves = plan(t, rotation);
  const missing = moves.filter((move) => move.donor === null);
  if (missing.length > 0) throw new Error(`rotation ${rotation} needs a half for ${[...new Set(missing.map((move) => move.to))].join(', ')}, and no half holds it now: ${missing.map((move) => move.dir).join(', ')}`);
  const label = (product: string): string => t.products.find((one) => one.product === product)!.label;
  // Read every donor before the first write: a donor may be a half that moves too.
  const staged = mkdtempSync(join(root, '.rotate-'));
  try {
    for (const dir of new Set(moves.map((move) => move.donor!))) cpSync(join(root, dir), join(staged, dir), { recursive: true, filter: (from) => !/(^|[\\/])(node_modules|dist)$/.test(from) });
    for (const move of moves) {
      const donorProduct = t.products.find((one) => one.react === move.donor || one.angular === move.donor)!.product;
      swap(root, move, label(move.product), label(donorProduct), staged);
    }
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
  for (const move of moves) console.log(`rotate: ${move.dir}: ${move.from} -> ${move.to}, from ${move.donor}`);
  console.log(`rotate: rotation ${r}, ${moves.length} half(s) moved; run bun run build and bun run bundlers`);
}
