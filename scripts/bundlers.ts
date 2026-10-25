/* The runner: every claim a bundler page makes, checked on the half the rotation assigns that bundler. Each half
 * measures itself (`bun run --cwd <half> measure`, halves in parallel, each at scratch paths of its own) and this gathers
 * what each wrote into `bundlers-results.json`. It writes the file even when a claim is contradicted, prints each
 * contradiction and exits 1. */

import { availableParallelism } from 'node:os';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { halves, RESULTS } from './build.ts';
import { installedVersion, pinProblems } from './bundlers/pins.ts';
import { table } from './bundlers/rotation.ts';
import type { Table } from './bundlers/types.ts';
import { RESULT, contradictionsOf } from '../bench-kit/src/runner.ts';
import type { HalfResult } from '../bench-kit/src/runner.ts';

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

/**
 * `bun run --cwd <half> measure` of each half, at most `width` at once, each at the scratch paths of its own (D16). A
 * half that exits non-zero is accepted only when the result file it wrote holds at least one contradiction, and what it
 * wrote is gathered; any other non-zero exit, or no file, did not measure, and that is a throw naming the half with the tail
 * of its output.
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
      const result = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as HalfResult) : null;
      if (result && (child.exitCode === 0 || contradictionsOf(result).length > 0)) done.set(dir, result);
      else failed.push(`${dir}: measure exited ${child.exitCode}${result ? ' with no contradiction in' : ' and wrote no'} ${RESULT}:\n${`${out}${err}`.trim().split('\n').slice(-12).join('\n')}`);
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
  const problems = pinProblems(t, root);
  if (problems.length > 0) throw new Error(`the installed trees are not the pinned ones, nothing is measured:\n  ${problems.join('\n  ')}`);

  const measured = await measureHalves(all.map((one) => one.dir), root);
  const commit = Bun.spawnSync(['git', 'rev-parse', '--short', 'HEAD'], { cwd: root }).stdout.toString().trim();
  return {
    arena, arenaSource: t.arenaSource, rotation: t.rotation, date: new Date().toISOString().slice(0, 10), commit,
    pins: t.pins, halves: all.map((one) => measured.get(one.dir)!),
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
