import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contradictions, run } from './bundlers.ts';
import type { Results } from './bundlers.ts';
import { table } from './bundlers/rotation.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

const FIGURES = { firstVisit: { plain: 0, recipe: 0 }, appRelease: { plain: 0, recipe: 0 }, patch: 0, dictionary: 0, total: { js: 0, css: 0, sprite: 0, fonts: 0 } };

const row = (id: string, expectation: 'holds' | 'record', outcome: boolean) =>
  ({ id, claim: `claim of ${id}`, expect: expectation, outcome, holds: expectation === 'record' ? true : outcome, detail: `detail of ${id}` });

const results = (observations: ReturnType<typeof row>[]): Results => ({
  arena: '12.1.1', arenaSource: 's', rotation: 0, date: '2026-10-24', commit: 'abc', pins: {},
  halves: [{ product: 'etsy', layer: 'react', dir: 'react-etsy', bundler: 'rollup', version: '4.65.0', observations, figures: FIGURES }],
});

describe('contradictions', () => {
  test('lists exactly the holds row that is false, as `<id> (<dir>): <claim>: <detail>`', () => {
    const found = contradictions(results([row('a.one', 'holds', true), row('a.two', 'holds', false), row('a.three', 'record', false)]));
    expect(found).toEqual(['a.two (react-etsy): claim of a.two: detail of a.two']);
  });

  test('lists nothing when only record rows are false', () => {
    expect(contradictions(results([row('a.one', 'holds', true), row('a.three', 'record', false)]))).toEqual([]);
  });
});

describe('run', () => {
  test('a wrong pin stops the run before any build, naming the pin', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bundlers-run-'));
    made.push(root);
    const t = { ...table(), pins: { rollup: '0.0.0' } };
    // the root holds no tree, so `rollup` is installed as nothing
    mkdirTree(root, t.products[0]!.react);
    await expect(run(t, root, t.products[0]!.react)).rejects.toThrow(/rollup: pinned 0\.0\.0, installed nothing/);
    expect(readdirSync(root).filter((name) => name.startsWith('.run-'))).toEqual([]);
    expect(existsSync(join(root, 'dist'))).toBe(false);
  });
});

function mkdirTree(root: string, half: string): void {
  const dir = join(root, half, 'node_modules', '@dravensoft', 'arena-react');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@dravensoft/arena-react', version: '12.1.1' }));
}
