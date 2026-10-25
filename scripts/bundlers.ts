/* The runner: every claim a bundler page makes, checked on the half the run's draw gives that bundler. Each half
 * measures itself (`bun run --cwd <half> measure`, halves in parallel, each at scratch paths of its own) and this gathers
 * what each wrote into `bundlers-results.json`. It writes the file even when a claim is contradicted, prints each
 * contradiction and exits 1. */

import { availableParallelism } from 'node:os';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { halves, RESULTS } from './build.ts';
import { installedVersion, pinProblems } from './bundlers/pins.ts';
import { draw, freshSeed, held, leftOutOf, previousResults, table } from './bundlers/rotation.ts';
import type { Previous } from './bundlers/rotation.ts';
import type { Assignment, BundlerId, Layer, Table } from './bundlers/types.ts';
import { rotate } from './rotate.ts';
import { RESULT, contradictionsOf } from '../bench-kit/src/runner.ts';
import type { HalfResult } from '../bench-kit/src/runner.ts';

/** A half's result, with the seconds its `measure` took. */
export type TimedResult = HalfResult & { seconds?: number };

export type { HalfResult };

export type Results = {
  arena: string;
  arenaSource: string;
  /** Null on a dry run of one half, which draws nothing. */
  seed: number | null;
  assignment: Record<string, string> | null;
  leftOut: string[];
  /** The halves of the entries this run left out, as the previous run measured them: a bundler's row keeps the date of the run that measured it, and has its entry here. */
  carried: { date: string; commit: string; seed: number | null; halves: TimedResult[] } | null;
  date: string;
  commit: string;
  pins: Record<string, string>;
  halves: TimedResult[];
};

/**
 * `bun run --cwd <half> measure` of each half, at most `width` at once, each at the scratch paths of its own (D16). A
 * half that exits non-zero is accepted only when the result file it wrote holds at least one contradiction, and what it
 * wrote is gathered; any other non-zero exit, or no file, did not measure, and that is a throw naming the half with the tail
 * of its output.
 */
export async function measureHalves(dirs: string[], root = '.', width = Math.max(1, Math.floor(availableParallelism() / 2))): Promise<Map<string, TimedResult>> {
  const done = new Map<string, TimedResult>();
  const queue = [...dirs];
  const failed: string[] = [];
  const worker = async () => {
    for (let dir = queue.shift(); dir !== undefined; dir = queue.shift()) {
      const file = join(root, dir, RESULT);
      rmSync(file, { force: true });
      console.log(`bundlers: ${dir}`);
      const started = performance.now();
      const child = Bun.spawn(['bun', 'run', '--cwd', join(root, dir), 'measure'], { stdout: 'pipe', stderr: 'pipe' });
      const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      const result = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as TimedResult) : null;
      if (result) result.seconds = Math.round((performance.now() - started) / 100) / 10;
      if (result && (child.exitCode === 0 || contradictionsOf(result).length > 0)) done.set(dir, result);
      else failed.push(`${dir}: measure exited ${child.exitCode}${result ? ' with no contradiction in' : ' and wrote no'} ${RESULT}:\n${`${out}${err}`.trim().split('\n').slice(-12).join('\n')}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(width, dirs.length) }, worker));
  if (failed.length > 0) throw new Error(failed.join('\n'));
  return done;
}

/** Seconds a half of this layer and bundler takes when no earlier run recorded it: the slow ones are Angular on webpack, rspack, Parcel and rolldown. */
const DEFAULT_SECONDS: Record<Layer, Partial<Record<BundlerId, number>>> = {
  angular: { webpack: 400, rspack: 380, parcel: 350, rolldown: 300, rollup: 250, vite7: 200, vite8: 200, esbuild: 150, bun: 150, angular: 150 },
  react: { webpack: 120, rspack: 120, parcel: 120, next: 150 },
};

/**
 * `dirs` slowest first, so no half runs alone at the end: by the seconds an earlier run recorded for the half's layer and
 * bundler, else by `DEFAULT_SECONDS`.
 */
export function schedule(dirs: { dir: string; layer: Layer }[], root: string, previous: Previous | null = null): string[] {
  const estimate = ({ dir, layer }: { dir: string; layer: Layer }): number => {
    const bundler = held(root, dir);
    const before = previous?.halves.find((half) => half.layer === layer && half.bundler === bundler)?.seconds;
    return before ?? (bundler ? DEFAULT_SECONDS[layer][bundler] : undefined) ?? 100;
  };
  return dirs.map((one) => ({ dir: one.dir, seconds: estimate(one) })).sort((a, b) => b.seconds - a.seconds).map((one) => one.dir);
}

/**
 * The short commit of `root`, with `-dirty` after it when the tree holds anything the commit does not: a figure read from a
 * tree that differs from its commit names a commit that cannot reproduce it. The results file itself does not count, since
 * the run is about to write it.
 */
export function commitOf(root = '.'): string {
  const head = Bun.spawnSync(['git', 'rev-parse', '--short', 'HEAD'], { cwd: root }).stdout.toString().trim();
  const changed = Bun.spawnSync(['git', 'status', '--porcelain'], { cwd: root }).stdout.toString().split('\n')
    .filter((line) => line.trim() !== '' && line.slice(3) !== RESULTS);
  return changed.length > 0 ? `${head}-dirty` : head;
}

export async function run(t: Table, root = '.', only?: string, drawn?: Assignment, previous: Previous | null = null): Promise<Results> {
  const all = halves(t.products).filter((one) => only === undefined || one.dir === only);
  if (all.length === 0) throw new Error(`--only ${only}: no such half; the halves are ${halves(t.products).map((one) => one.dir).join(', ')}`);
  const first = t.products[0]!.react;
  const arena = installedVersion('@dravensoft/arena-react', join(root, first));
  if (!arena) throw new Error(`@dravensoft/arena-react is not installed under ${first}: install the halves first, which \`bun run build\` does (\`bun install --frozen-lockfile\` in each half), or \`bun install\` in each`);
  const problems = pinProblems(t, root);
  if (problems.length > 0) throw new Error(`the installed trees are not the pinned ones, nothing is measured:\n  ${problems.join('\n  ')}`);

  const measured = await measureHalves(schedule(all, root, previous), root);
  const commit = commitOf(root);
  return {
    arena, arenaSource: t.arenaSource, seed: drawn?.seed ?? null, assignment: drawn?.entries ?? null, leftOut: drawn?.leftOut ?? [], carried: drawn ? carry(t, previous, drawn.leftOut) : null, date: new Date().toISOString().slice(0, 10), commit,
    pins: t.pins, halves: all.map((one) => measured.get(one.dir)!),
  };
}

/** The halves of the entries `leftOut` names, as `previous` holds them: null when there are none to carry. */
export function carry(t: Table, previous: Previous | null, leftOut: string[]): Results['carried'] {
  if (previous === null || leftOut.length === 0) return null;
  const left = t.entries.filter((entry) => leftOut.includes(entry.name));
  const halves = previous.halves.filter((half) => left.some((entry) => entry[half.layer] === half.bundler));
  if (halves.length === 0) return null;
  return { date: previous.date ?? '', commit: previous.commit ?? '', seed: previous.seed ?? null, halves };
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
  const seedAt = process.argv.indexOf('--seed');
  const t = table();
  const previous = previousResults();
  let drawn: Assignment | undefined;
  // A full run draws and moves the halves; a run over one half is a dry check of what is installed.
  if (only === undefined) {
    const seed = seedAt < 0 ? freshSeed() : Number(process.argv[seedAt + 1]);
    if (!Number.isInteger(seed) || seed < 0) throw new Error('usage: bun run bundlers [--seed <n>] [--only <half>]');
    drawn = draw(t, seed, leftOutOf(t, previous));
    console.log(`bundlers: seed ${seed}, left out ${drawn.leftOut.join(', ')}`);
    for (const move of rotate('.', drawn)) console.log(`bundlers: ${move.dir}: ${move.from} -> ${move.to}`);
  }
  const results = await run(t, '.', only, drawn, previous);
  const text = `${JSON.stringify(results, null, 2)}\n`;
  if (only === undefined) writeFileSync(RESULTS, text);
  else console.log(text);
  const bad = contradictions(results);
  for (const line of bad) console.error(line);
  console.log(`bundlers: ${results.halves.length} half(s), ${bad.length} contradiction(s)${only === undefined ? `, ${RESULTS} written` : ''}`);
  if (bad.length > 0) process.exit(1);
}

if (import.meta.main) await main();
