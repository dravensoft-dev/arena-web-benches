import { describe, expect, test } from 'bun:test';
import { assigned, assignment, table } from './rotation.ts';
import type { BundlerId } from './types.ts';

const t = table();
const rows = (m: ReturnType<typeof assignment>) => Object.fromEntries([...m].map(([k, v]) => [k, v]));
const both = (id: BundlerId) => ({ react: id, angular: id });
const mixed = { react: 'next', angular: 'angular' } as const;

describe('assignment', () => {
  test('rotation 0 is the F4 column', () => {
    expect(rows(assignment(t, 0))).toEqual({
      calendly: mixed,
      clickup: both('vite7'),
      duolingo: both('vite8'),
      etsy: both('rollup'),
      grafana: both('rolldown'),
      instagram: both('webpack'),
      notion: both('rspack'),
      superhuman: both('parcel'),
    });
  });

  test('rotation 1 is the F4 column', () => {
    expect(rows(assignment(t, 1))).toEqual({
      calendly: both('bun'),
      clickup: mixed,
      duolingo: both('esbuild'),
      etsy: both('vite7'),
      grafana: both('vite8'),
      instagram: both('rollup'),
      notion: both('rolldown'),
      superhuman: both('webpack'),
    });
  });

  test('the default rotation is the table rotation', () => {
    expect(assignment(t)).toEqual(assignment(t, t.rotation));
  });

  for (let r = 0; r <= 17; r += 1) {
    test(`rotation ${r}: seven distinct shared bundlers, same on both layers`, () => {
      const m = assignment(t, r);
      const shared = [...m.values()].filter((v) => v.react === v.angular).map((v) => v.react);
      expect(shared.length).toBe(7);
      expect(new Set(shared).size).toBe(7);
      expect([...m.values()].filter((v) => v.react !== v.angular).length).toBe(1);
    });

    test(`rotations ${r} and ${r + 1} build all eleven bundlers`, () => {
      const ids = new Set<BundlerId>();
      for (const n of [r, r + 1]) for (const v of assignment(t, n).values()) ids.add(v.react).add(v.angular);
      expect(ids.size).toBe(11);
    });
  }
});

describe('assigned', () => {
  test('finds the product, layer and bundler of a half', () => {
    expect(assigned(t, 'angular-etsy')).toEqual({ product: 'etsy', layer: 'angular', bundler: 'rollup' });
  });

  test('names a directory no product holds', () => {
    expect(() => assigned(t, 'react-nope')).toThrow('react-nope');
  });
});
