/* The runner: every claim a bundler page makes, checked on the half the rotation assigns that bundler. A half that
 * carries its own measuring (`measure.ts`, run as `bun run --cwd <half> measure`) measures itself, halves in parallel,
 * and this gathers what each wrote; the others are built here, through the driver the rotation assigns, serially. Per
 * half the runs its observations ask for are built, plus the five the figures need, the bare outputs are read for the
 * observations, and only then are the sheets linked and the sprite copied before weighing. `bun run bundlers` writes
 * `bundlers-results.json` even when a claim is contradicted, prints each contradiction and exits 1. */

import { availableParallelism } from 'node:os';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { halves, RESULTS } from './build.ts';
import { OBSERVATIONS, judge } from './bundlers/observations.ts';
import type { Built, RunKey } from './bundlers/observations.ts';
import { installedVersion, pinProblems } from './bundlers/pins.ts';
import { assigned, table } from './bundlers/rotation.ts';
import { entryOf, hold, rebase, scratch, scratchPath } from '../bench-kit/src/scratch.ts';
import { finish, linkSheets } from './bundlers/static.ts';
import { firstSelectors } from '../bench-kit/src/static.ts';
import type { BundlerId, Driver, Layer, Probe, Table } from './bundlers/types.ts';
import { FIGURE_RUNS, PLAIN_TEXT, RESULT, figures, spec } from '../bench-kit/src/runner.ts';
import type { HalfResult, Key } from '../bench-kit/src/runner.ts';

export type { HalfResult };

export type Results = {
  arena: string;
  arenaSource: string;
  rotation: number;
  date: string;
  commit: string;
  pins: Record<string, string>;
  halves: HalfResult[];
};

/** The pin whose version is the bundler's own. */
const PIN: Partial<Record<BundlerId, string>> = { angular: '@angular/build', rspack: '@rspack/core', vite8: 'vite' };

const pinOf = (bundler: BundlerId): string => PIN[bundler] ?? bundler;

function attempt(driver: Driver, dir: string, layer: Layer, variant: 'plain' | 'recipe' | Probe): Built {
  try {
    return driver.bundle(dir, layer, variant);
  } catch (error) {
    return { ok: false, out: '', log: error instanceof Error ? error.message : String(error) };
  }
}

async function runHalf(t: Table, root: string, half: { product: string; layer: Layer; dir: string }): Promise<HalfResult> {
  const { product, layer, dir } = half;
  const problems = pinProblems(t, root);
  if (problems.length > 0) throw new Error(`${dir}: the installed tree is not the pinned one, nothing is built:\n  ${problems.join('\n  ')}`);

  const { bundler } = assigned(t, dir);
  const driver = (await import(`./bundlers/drivers/${bundler}.ts`)).default as Driver;
  const mine = OBSERVATIONS.filter((o) => o.bundler === bundler && o.layers.includes(layer));
  const keys = [...new Set<Key>([...FIGURE_RUNS, PLAIN_TEXT, ...mine.flatMap((o) => o.needs)])];

  const made: string[] = [];
  try {
    const runs: Partial<Record<Key, Built>> = {};
    const roots: Partial<Record<Key, string>> = {};
    // Every run is built at one path, `.run-<dir>-m`, then moved to a path of its own: the directory name enters
    // webpack's module ids, so runs compared by name and bytes must share it (D11).
    const building = scratchPath(dir, 'm', root);
    made.push(building);
    for (const key of keys) {
      const { mutation, variant } = spec(key);
      scratch(dir, 'm', mutation, root);
      let built: Built;
      if (key === 'twice') {
        // One outdir, built twice: `recipe`, then the app's text changed in place, as `app-text` does, then `twice`.
        const first = attempt(driver, building, layer, 'recipe');
        const entry = join(building, entryOf(layer));
        writeFileSync(entry, readFileSync(entry, 'utf8').replace(`__appMarker = '${dir}'`, `__appMarker = '${dir} ·'`));
        built = first.ok ? attempt(driver, building, layer, 'twice') : first;
      } else {
        built = attempt(driver, building, layer, variant);
      }
      const kept = hold(building, scratchPath(dir, key.replace(/:/g, '-'), root));
      made.push(kept);
      roots[key] = kept;
      runs[key] = built.out ? { ...built, out: rebase(built.out, building, kept) } : built;
    }

    const ctx = { dir: join(root, dir), layer, ...firstSelectors(join(root, dir), layer), runs: runs as Partial<Record<RunKey, Built>> };
    const observations = mine.map((o) => judge(o, ctx));

    // Only now: the sheets the driver maps away are linked and the sprite copied, as the half's own build does.
    const out: Record<string, string> = {};
    for (const key of FIGURE_RUNS.concat(PLAIN_TEXT)) {
      const built = runs[key]!;
      if (!built.ok) throw new Error(`${dir}: run '${key}' did not build, so no figure is measured:\n${built.log.trim().split('\n').slice(-5).join('\n')}`);
      if (driver.linksSheets) linkSheets(roots[key]!, layer, built.out);
      finish(roots[key]!, layer, built.out);
      out[key] = built.out;
    }

    const version = t.pins[pinOf(bundler)];
    if (!version) throw new Error(`${dir}: no pin '${pinOf(bundler)}' for ${bundler}`);
    return { product, layer, dir, bundler, version, observations, figures: figures(out) };
  } finally {
    for (const path of made) rmSync(path, { recursive: true, force: true });
  }
}

/** The half carries its own measuring: `measure.ts` at its root. */
export const converted = (dir: string, root = '.'): boolean => existsSync(join(root, dir, 'measure.ts'));

/**
 * `bun run --cwd <half> measure` of each half, at most `width` at once, each at the scratch paths of its own (D16). A
 * half that exits 1 with a result file has contradicted a claim, and what it wrote is gathered; a half that exits 1
 * without one did not measure, and that is a throw naming it with the tail of its output.
 */
export async function measureHalves(dirs: string[], root = '.', width = Math.max(1, Math.floor(availableParallelism() / 2))): Promise<Map<string, HalfResult>> {
  const done = new Map<string, HalfResult>();
  const queue = [...dirs];
  const failed: string[] = [];
  const worker = async () => {
    for (let dir = queue.shift(); dir !== undefined; dir = queue.shift()) {
      const file = join(root, dir, RESULT);
      rmSync(file, { force: true });
      console.log(`bundlers: ${dir}`);
      const child = Bun.spawn(['bun', 'run', '--cwd', join(root, dir), 'measure'], { stdout: 'pipe', stderr: 'pipe' });
      const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      if (existsSync(file)) done.set(dir, JSON.parse(readFileSync(file, 'utf8')) as HalfResult);
      else failed.push(`${dir}: measure exited ${child.exitCode} and wrote no ${RESULT}:\n${`${out}${err}`.trim().split('\n').slice(-12).join('\n')}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(width, dirs.length) }, worker));
  if (failed.length > 0) throw new Error(failed.join('\n'));
  return done;
}

export async function run(t: Table, root = '.', only?: string): Promise<Results> {
  const all = halves(t.products).filter((one) => only === undefined || one.dir === only);
  const first = t.products[0]!.react;
  const arena = installedVersion('@dravensoft/arena-react', join(root, first));
  if (!arena) throw new Error(`@dravensoft/arena-react is not installed under ${first}`);

  const own = await measureHalves(all.filter((one) => converted(one.dir, root)).map((one) => one.dir), root);
  const result: HalfResult[] = [];
  for (const one of all) {
    const measured = own.get(one.dir);
    if (measured) {
      result.push(measured);
      continue;
    }
    console.log(`bundlers: ${one.dir}`);
    result.push(await runHalf(t, root, one));
  }
  const commit = Bun.spawnSync(['git', 'rev-parse', '--short', 'HEAD'], { cwd: root }).stdout.toString().trim();
  return {
    arena, arenaSource: t.arenaSource, rotation: t.rotation, date: new Date().toISOString().slice(0, 10), commit,
    pins: t.pins, halves: result,
  };
}

/** One line per `holds` observation that failed: `<id> (<dir>): <claim>: <detail>`. */
export function contradictions(r: Results): string[] {
  return r.halves.flatMap((half) => half.observations
    .filter((o) => !o.holds)
    .map((o) => `${o.id} (${half.dir}): ${o.claim}: ${o.detail}`));
}

async function main() {
  const at = process.argv.indexOf('--only');
  const only = at < 0 ? undefined : process.argv[at + 1];
  const t = table();
  const results = await run(t, '.', only);
  const text = `${JSON.stringify(results, null, 2)}\n`;
  // A run over one half is a dry check: it prints and leaves the results file alone.
  if (only === undefined) writeFileSync(RESULTS, text);
  else console.log(text);
  const bad = contradictions(results);
  for (const line of bad) console.error(line);
  console.log(`bundlers: ${results.halves.length} half(s), ${bad.length} contradiction(s)${only === undefined ? `, ${RESULTS} written` : ''}`);
  if (bad.length > 0) process.exit(1);
}

if (import.meta.main) await main();
