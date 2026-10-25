import { describe, expect, test } from 'bun:test';
import { assigned, assignment, current, draw, drawFor, leftOutOf, table } from './rotation.ts';
import type { Assignment } from './types.ts';

const t = table();
const names = t.entries.map((entry) => entry.name);

describe('draw', () => {
  test('the table holds ten entries for eight products: the nine shared bundlers and the mixed pair', () => {
    expect(names).toEqual(['vite7', 'vite8', 'rollup', 'rolldown', 'webpack', 'rspack', 'parcel', 'bun', 'esbuild', 'next+angular']);
    expect(t.products).toHaveLength(8);
    expect(t.entries.find((entry) => entry.name === 'next+angular')).toEqual({ name: 'next+angular', react: 'next', angular: 'angular' });
  });

  test('the same seed gives the same assignment, and another seed another', () => {
    expect(draw(t, 7, ['bun', 'esbuild'])).toEqual(draw(t, 7, ['bun', 'esbuild']));
    const seen = new Set(Array.from({ length: 20 }, (_, seed) => JSON.stringify(draw(t, seed).entries)));
    expect(seen.size).toBeGreaterThan(15);
  });

  test.each(Array.from({ length: 40 }, (_, seed) => seed))('seed %i: eight distinct entries on the eight products, and the two others left out', (seed) => {
    const drawn = draw(t, seed);
    expect(Object.keys(drawn.entries).sort()).toEqual(t.products.map((one) => one.product).sort());
    const placed = Object.values(drawn.entries);
    expect(new Set(placed).size).toBe(8);
    for (const name of placed) expect(names).toContain(name);
    expect(drawn.leftOut).toHaveLength(2);
    expect([...placed, ...drawn.leftOut].sort()).toEqual([...names].sort());
    expect(drawn.seed).toBe(seed);
  });

  test.each(Array.from({ length: 40 }, (_, seed) => seed))('seed %i: the entries the previous run left out are among the eight', (seed) => {
    const previous = draw(t, seed + 1000);
    const next = draw(t, seed, previous.leftOut);
    for (const name of previous.leftOut) expect(Object.values(next.entries)).toContain(name);
  });

  test('two consecutive runs cover all ten entries, over many seeds', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const first = draw(t, seed);
      const second = draw(t, seed + 7, first.leftOut);
      expect(new Set([...Object.values(first.entries), ...Object.values(second.entries)]).size, `seed ${seed}`).toBe(10);
    }
  });

  test('an entry the table does not hold is a throw naming it', () => {
    expect(() => draw(t, 1, ['nope'])).toThrow("'nope'");
  });
});

describe('assignment', () => {
  test.each(Array.from({ length: 40 }, (_, seed) => seed))('seed %i: Next.js sits only on a React half and the Angular builder only on an Angular half', (seed) => {
    const found = assignment(t, draw(t, seed));
    for (const [, layers] of found) {
      if (layers.react === 'next' || layers.angular === 'angular') expect(layers).toEqual({ react: 'next', angular: 'angular' });
      else expect(layers.react).toBe(layers.angular);
    }
  });

  test('an assignment naming an entry the table lacks is a throw naming it', () => {
    const bad: Assignment = { seed: 1, entries: { ...draw(t, 1).entries, etsy: 'nope' }, leftOut: [] };
    expect(() => assignment(t, bad)).toThrow("etsy the entry 'nope'");
  });
});

describe('drawFor', () => {
  test('is the committed draw for the seed the results were drawn with, and a fresh draw with the previous left-outs for any other', () => {
    const first = draw(t, 5);
    const previous = { seed: 5, assignment: first.entries, leftOut: first.leftOut, halves: [] };
    expect(drawFor(t, 5, previous)).toEqual(first);
    expect(drawFor(t, 6, previous)).toEqual(draw(t, 6, first.leftOut));
    expect(drawFor(t, 6, null)).toEqual(draw(t, 6));
  });
});

describe('leftOutOf', () => {
  test('is nothing before any run, the recorded entries after one, and the entries no half measured for a result that recorded none', () => {
    expect(leftOutOf(t, null)).toEqual([]);
    expect(leftOutOf(t, { leftOut: ['rollup', 'bun'], halves: [] })).toEqual(['rollup', 'bun']);
    const halves = t.entries.filter((entry) => !['bun', 'esbuild', 'next+angular'].includes(entry.name)).flatMap((entry) => [{ layer: 'react' as const, bundler: entry.react }, { layer: 'angular' as const, bundler: entry.angular }])
      .concat([{ layer: 'react', bundler: 'next' }, { layer: 'angular', bundler: 'angular' }]);
    expect(leftOutOf(t, { halves })).toEqual(['bun', 'esbuild']);
  });
});

describe('the committed halves', () => {
  test('hold a bundler each, and the results record the assignment they were drawn as', () => {
    const now = current(t);
    expect([...now.keys()].sort()).toEqual(t.products.map((one) => one.product).sort());
    for (const one of t.products) for (const layer of ['react', 'angular'] as const) expect(assigned(t, one[layer]).bundler, one[layer]).toBe(now.get(one.product)![layer]);
  });

  test('assigned names a directory no product holds', () => {
    expect(() => assigned(t, 'react-nope')).toThrow('react-nope');
  });
});
