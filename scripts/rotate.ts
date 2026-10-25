/* The move: `bun run bundlers` draws the run's assignment (`scripts/bundlers/rotation.ts`) and `rotate` moves each half to
 * the bundler it gives it. A half that changes bundler takes everything that is the bundler's from a source: a half of
 * the same layer that holds the target bundler now (its donor), the bundler's template in `bench-kit/parts/` (Bun and
 * esbuild), or, for a bundler no half holds now (an entry the previous run left out), the half of the same layer that
 * last held it, read from git history. All make one `Source`, and one `swap` installs it: the config files, page and
 * entry wrapper, `measure.ts` (the bundler's part), the scripts and the bundler's devDependencies of `package.json`,
 * `.gitignore` and `README.md`. The half keeps its name, its dev scripts, its sources, its Arena configuration and the
 * packages it shares with every bundler (`@benches/kit`, TypeScript, the Angular packages); its old bundler's files go,
 * and its lockfile is made again by `bun install`. */

import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { halves } from './build.ts';
import { assignment, current, draw, freshSeed, leftOutOf, previousResults, table } from './bundlers/rotation.ts';
import type { Assignment, BundlerId, Layer, Table } from './bundlers/types.ts';
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

/** The templates of the bundlers that have one: a half moved to Bun or esbuild takes its files from the kit. */
export const TEMPLATES: Partial<Record<BundlerId, (layer: Layer, pins: Record<string, string>) => Template>> = { bun: bunTemplate, esbuild: esbuildTemplate };

/** What a bundler brings to a half, from wherever it comes. */
export type Source = {
  files: Record<string, string | Buffer>;
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
  keep: string[];
  /** The root-level page for a half whose own `src/index.html` is the argument; absent when the bundler has no page of its own. */
  page?: (own: string) => string;
  /** Made from a template, not read from a half. */
  template: boolean;
  /** The README for the half `dir` of the product `label`, whose dev flow is on `port`. */
  readme: (dir: string, label: string, port: string | null) => string | null;
};

/** The moves from what the halves hold now to `next`: one per half whose bundler differs, with its donor (null when no half holds the target). */
export function plan(t: Table, now: Map<string, Record<Layer, BundlerId>>, next: Map<string, Record<Layer, BundlerId>>): Move[] {
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

/** The lines of a page that are the bundler's: the base, the sheets it links and the module script (the lines a half's page adds to `src/index.html`). */
const PAGE_TAG = /^[ \t]*(?:<base href="[^"]*" ?\/?>|<link rel="stylesheet" href="[^"]*">|<script type="module" src="[^"]*"><\/script>)$/;

/**
 * A donor's root-level page for the half whose own `src/index.html` is `own`: the page differs from the donor's
 * `src/index.html` only in the tag lines above, so each tag line goes after the same line of `own` it follows in the
 * donor's page (the k-th line of that text), and the base, links and scripts `own` carries itself are dropped. A line
 * the donor's tags follow that `own` lacks is a throw naming it: the two pages do not share the structure the move relies on.
 */
export function transplantPage(page: string, donorSource: string, own: string): string {
  const plain = (text: string): string[] => text.split('\n').filter((line) => !PAGE_TAG.test(line));
  if (plain(page).join('\n') !== plain(donorSource).join('\n')) throw new Error('the donor page differs from its src/index.html in more than its base, links and scripts');
  const placed: { after: string; nth: number; line: string }[] = [];
  const seen = new Map<string, number>();
  let before = '';
  for (const line of page.split('\n')) {
    if (PAGE_TAG.test(line)) {
      placed.push({ after: before, nth: seen.get(before) ?? 0, line });
      continue;
    }
    seen.set(line, (seen.get(line) ?? 0) + 1);
    before = line;
  }
  // `nth` is the occurrence of `after` the tag follows.
  const out: string[] = [];
  const count = new Map<string, number>();
  const flush = (line: string) => {
    for (const tag of placed.filter((one) => one.after === line && one.nth === count.get(line))) out.push(tag.line);
  };
  for (const line of plain(own)) {
    out.push(line);
    count.set(line, (count.get(line) ?? 0) + 1);
    flush(line);
  }
  for (const tag of placed) if (!count.get(tag.after) || tag.nth > count.get(tag.after)!) throw new Error(`the page's own src/index.html has no line \`${tag.after.trim()}\` to put ${tag.line.trim()} after`);
  return out.join('\n');
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
    ...(files['index.html'] && existsSync(join(donorRoot, donor, 'src', 'index.html'))
      ? { page: (own: string) => transplantPage(files['index.html']!.toString('utf8'), readFileSync(join(donorRoot, donor, 'src', 'index.html'), 'utf8'), own) }
      : {}),
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
  // The donor's page is the donor product's: this half's own is its `src/index.html` with the bundler's tags.
  if (source.page && source.files['index.html']) writeFileSync(join(root, move.dir, 'index.html'), source.page(readFileSync(join(root, move.dir, 'src', 'index.html'), 'utf8')));
  const next: Manifest = {
    ...manifest,
    scripts: { ...source.scripts, ...own },
    devDependencies: Object.fromEntries(Object.entries(devDependencies).sort(([a], [b]) => a.localeCompare(b))),
  };
  writeFileSync(join(root, move.dir, 'package.json'), `${JSON.stringify(next, null, 2)}\n`);
  rmSync(join(root, move.dir, 'bun.lock'), { force: true });
}

/** The lockfile of each moved half, made by `bun install` in it: what the swap removed, the install writes again from the half's new devDependencies. */
export function installMoved(root: string, moves: Move[]): void {
  for (const move of moves) {
    const done = Bun.spawnSync(['bun', 'install', '--cwd', join(root, move.dir)], { stdout: 'inherit', stderr: 'inherit' });
    if (done.exitCode !== 0) throw new Error(`${move.dir}: bun install exited ${done.exitCode}`);
  }
}

/**
 * The half of `layer` that last held `bundler`, extracted from the history of `gitRoot` into `into` (as `<into>/<dir>`),
 * newest commit first; its directory, or null when no commit held it.
 */
export function historyDonor(gitRoot: string, t: Table, bundler: BundlerId, layer: Layer, into: string): string | null {
  const git = (...args: string[]) => Bun.spawnSync(['git', ...args], { cwd: gitRoot });
  const wanted = new RegExp(`\\bbundler: '${bundler}'`);
  for (const one of halves(t.products).filter((each) => each.layer === layer)) {
    const commits = git('log', '--format=%H', '-n', '80', '--', `${one.dir}/measure.ts`).stdout.toString().split('\n').filter(Boolean);
    for (const commit of commits) {
      const shown = git('show', `${commit}:${one.dir}/measure.ts`);
      if (shown.exitCode !== 0 || !wanted.test(shown.stdout.toString())) continue;
      mkdirSync(into, { recursive: true });
      const archive = Bun.spawnSync(['sh', '-c', `git archive ${commit} ${one.dir} | tar -x -C "${into}"`], { cwd: gitRoot });
      if (archive.exitCode !== 0) throw new Error(`git archive ${commit} ${one.dir} failed: ${archive.stderr}`);
      return one.dir;
    }
  }
  return null;
}

/** Moves every half to the bundler of `next`, then (`install`) makes the lockfile of each moved half. `gitRoot` is where history donors are read. */
export function rotate(root: string, next: Assignment, install = true, gitRoot = root): Move[] {
  const t = table(root);
  const moves = plan(t, current(t, root), assignment(t, next));
  const label = (dir: string): string => t.products.find((one) => one.react === dir || one.angular === dir)!.label;
  // Read every source before the first write: a donor may be a half that moves too.
  const staged = mkdtempSync(join(root, '.rotate-'));
  try {
    for (const dir of new Set(moves.map((move) => move.donor).filter((dir): dir is string => dir !== null))) {
      cpSync(join(root, dir), join(staged, dir), { recursive: true, filter: (from) => !/(^|[\\/])(node_modules|dist)$/.test(from) });
    }
    const sources = moves.map((move) => {
      if (move.donor) return donorSource(staged, move.donor, move.layer, [move.from, move.to], label(move.donor));
      if (TEMPLATES[move.to]) return templateSource(move.to, move.layer, t.pins);
      const into = join(staged, 'history', `${move.to}-${move.layer}`);
      const dir = historyDonor(gitRoot, t, move.to, move.layer, into);
      if (!dir) throw new Error(`${move.dir}: no half holds ${move.to}, bench-kit/parts has no template for it and no commit of ${gitRoot} held it`);
      return donorSource(into, dir, move.layer, [move.from, move.to], label(dir));
    });
    moves.forEach((move, at) => swap(root, move, label(move.dir), sources[at]!));
  } finally {
    rmSync(staged, { recursive: true, force: true });
  }
  if (install) installMoved(root, moves);
  return moves;
}

if (import.meta.main) {
  const at = process.argv.indexOf('--seed');
  const seed = at < 0 ? freshSeed() : Number(process.argv[at + 1]);
  if (!Number.isInteger(seed) || seed < 0) {
    console.error('usage: bun run rotate [--seed <n>]');
    process.exit(1);
  }
  const t = table();
  const next = draw(t, seed, leftOutOf(t, previousResults()));
  const moves = rotate('.', next);
  for (const move of moves) console.log(`rotate: ${move.dir}: ${move.from} -> ${move.to}, from ${move.donor ?? 'its template or history'}`);
  console.log(`rotate: seed ${seed}, ${moves.length} half(s) moved; run bun run build and bun run bundlers`);
}
