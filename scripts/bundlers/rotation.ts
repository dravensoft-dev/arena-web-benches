/* The draw: every run puts eight of the ten entries on the eight products, one entry each, and two consecutive runs
 * build all ten because the two entries a run leaves out are among the next run's eight. `draw` is a pure function of
 * the seed and of the entries to force in; `current` reads what the halves hold; `assigned` reads what the committed
 * results say the halves were drawn as. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { halves, RESULTS, TABLE } from '../build.ts';
import type { HalfResult } from '../../bench-kit/src/runner.ts';
import type { Assignment, BundlerId, Layer, Table } from './types.ts';

/** The committed results as an earlier run left them; a file from before the draw records no seed, assignment or left-out entries. */
export type Previous = { seed?: number | null; assignment?: Record<string, string> | null; leftOut?: string[]; date?: string; commit?: string; halves: (HalfResult & { seconds?: number })[] };

export function table(root = '.'): Table {
  return JSON.parse(readFileSync(join(root, TABLE), 'utf8')) as Table;
}

/** mulberry32: a small seeded generator, the same sequence on every machine. */
export function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A Fisher-Yates shuffle of a copy, drawn from `random`. */
function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let at = out.length - 1; at > 0; at -= 1) {
    const to = Math.floor(random() * (at + 1));
    [out[at], out[to]] = [out[to]!, out[at]!];
  }
  return out;
}

/** The new seed of a run that is not told one. */
export const freshSeed = (): number => Math.floor(Math.random() * 2 ** 32);

/**
 * Eight of the entries on the products, one each: the entries of `forced` (the previous run's left-outs) are among the
 * eight, the rest drawn at random, and the eight are then shuffled onto the products. The same seed and the same
 * `forced` give the same assignment.
 */
export function draw(t: Table, seed: number, forced: string[] = []): Assignment {
  const random = generator(seed);
  const names = t.entries.map((entry) => entry.name);
  for (const name of forced) if (!names.includes(name)) throw new Error(`the previous run left out '${name}', which is not an entry of ${TABLE}`);
  const free = shuffle(names.filter((name) => !forced.includes(name)), random);
  const chosen = shuffle([...forced, ...free.slice(0, t.products.length - forced.length)], random);
  const entries = Object.fromEntries(t.products.map((one, at) => [one.product, chosen[at]!]));
  return { seed, entries, leftOut: names.filter((name) => !chosen.includes(name)) };
}

/** Product to the bundler of each layer, for an assignment. */
export function assignment(t: Table, assigned: Assignment): Map<string, Record<Layer, BundlerId>> {
  const result = new Map<string, Record<Layer, BundlerId>>();
  for (const one of t.products) {
    const name = assigned.entries[one.product];
    const entry = t.entries.find((each) => each.name === name);
    if (!entry) throw new Error(`the assignment gives ${one.product} the entry '${name}', which ${TABLE} does not hold`);
    result.set(one.product, { react: entry.react, angular: entry.angular });
  }
  return result;
}

/** The bundler the half `dir` of `root` holds, read from the bundler its `measure.ts` names; null when it names none. */
export function held(root: string, dir: string): BundlerId | null {
  const file = join(root, dir, 'measure.ts');
  return existsSync(file) ? ((/\bbundler: '(\w+)'/.exec(readFileSync(file, 'utf8'))?.[1] as BundlerId | undefined) ?? null) : null;
}

/** What the halves under `root` hold now. */
export function current(t: Table, root = '.'): Map<string, Record<Layer, BundlerId>> {
  const result = new Map<string, Record<Layer, BundlerId>>();
  for (const one of t.products) {
    const now = {} as Record<Layer, BundlerId>;
    for (const layer of ['react', 'angular'] as const) {
      const found = held(root, one[layer]);
      if (!found) throw new Error(`${one[layer]}: measure.ts names no bundler`);
      now[layer] = found;
    }
    result.set(one.product, now);
  }
  return result;
}

/** The entries whose bundlers no half of a result measured: what a run that did not record `leftOut` left out. */
export function leftOutOf(t: Table, previous: { leftOut?: string[]; halves: { layer: Layer; bundler: BundlerId }[] } | null): string[] {
  if (previous === null) return [];
  if (previous.leftOut) return previous.leftOut;
  return t.entries.filter((entry) => !previous.halves.some((half) => half.bundler === entry[half.layer])).map((entry) => entry.name);
}

/** The committed results, or null when there are none. */
export function previousResults(root = '.'): Previous | null {
  const file = join(root, RESULTS);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

/** The product, layer and bundler a half was drawn as, from the committed results. */
export function assigned(t: Table, dir: string, root = '.'): { product: string; layer: Layer; bundler: BundlerId } {
  const results = previousResults(root);
  if (!results?.assignment) throw new Error(`${RESULTS} records no assignment`);
  const found = assignment(t, { seed: results.seed ?? 0, entries: results.assignment, leftOut: [] });
  for (const one of halves(t.products)) {
    if (one.dir === dir) return { product: one.product, layer: one.layer, bundler: found.get(one.product)![one.layer] };
  }
  throw new Error(`no product holds the half ${dir}`);
}
