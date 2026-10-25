import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { carry, commitOf, contradictions, measureHalves, run, schedule } from './bundlers.ts';
import type { Results } from './bundlers.ts';
import { table } from './bundlers/rotation.ts';

const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

const FIGURES = { firstVisit: { plain: 0, recipe: 0 }, appRelease: { plain: 0, recipe: 0 }, patch: 0, dictionary: 0, total: { js: 0, css: 0, sprite: 0, fonts: 0 } };

const row = (id: string, expectation: 'holds' | 'record', outcome: boolean) =>
  ({ id, claim: `claim of ${id}`, expect: expectation, outcome, holds: expectation === 'record' ? true : outcome, detail: `detail of ${id}` });

const results = (observations: ReturnType<typeof row>[]): Results => ({
  arena: '12.1.1', arenaSource: 's', seed: 1, assignment: {}, leftOut: [], carried: null, date: '2026-10-24', commit: 'abc', pins: {},
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

describe('commitOf', () => {
  const git = (root: string, ...args: string[]) => Bun.spawnSync(['git', '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root });

  test('is the short commit on a clean tree, with -dirty after it when anything else changed, and the results file alone does not count', () => {
    const root = mkdtempSync(join(tmpdir(), 'bundlers-git-'));
    made.push(root);
    git(root, 'init', '-q');
    writeFileSync(join(root, 'a.txt'), 'a');
    writeFileSync(join(root, 'bundlers-results.json'), '{}');
    git(root, 'add', '.');
    git(root, 'commit', '-q', '-m', 'one');
    const head = git(root, 'rev-parse', '--short', 'HEAD').stdout.toString().trim();
    expect(commitOf(root)).toBe(head);
    writeFileSync(join(root, 'bundlers-results.json'), '{"a":1}');
    expect(commitOf(root)).toBe(head);
    writeFileSync(join(root, 'a.txt'), 'b');
    expect(commitOf(root)).toBe(`${head}-dirty`);
  });
});

describe('run', () => {
  test('--only a half that is not there throws naming it and the halves', async () => {
    await expect(run(table(), '.', 'react-nope')).rejects.toThrow(/--only react-nope: no such half; the halves are react-calendly, angular-calendly/);
  });

  test('a wrong pin stops the run before any half measures, naming the half and the pin', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bundlers-run-'));
    made.push(root);
    const t = table();
    const first = t.products[0]!.react;
    mkdirTree(root, first);
    // the half declares rollup at its pin and its install holds nothing of it
    writeFileSync(join(root, first, 'package.json'), JSON.stringify({ devDependencies: { rollup: t.pins['rollup'] } }));
    await expect(run(t, root, first)).rejects.toThrow(new RegExp(`${first}: rollup: pinned ${t.pins['rollup']!.replace(/\./g, '\\.')}, installed nothing`));
    expect(readdirSync(root).filter((name) => name.startsWith('.run-'))).toEqual([]);
    expect(existsSync(join(root, 'dist'))).toBe(false);
  });
});

describe('measureHalves', () => {
  const half = (root: string, name: string, measure: string) => {
    mkdirSync(join(root, name), { recursive: true });
    writeFileSync(join(root, name, 'package.json'), JSON.stringify({ name, scripts: { measure } }));
  };

  test('gathers the result each half wrote, also from a half that exits 1 on a contradiction', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bundlers-own-'));
    made.push(root);
    half(root, 'react-a', `echo '{"dir":"react-a","observations":[]}' > bundlers-result.json`);
    half(root, 'react-b', `echo '{"dir":"react-b","observations":[{"id":"x","claim":"c","detail":"d","holds":false}]}' > bundlers-result.json; exit 1`);
    const found = await measureHalves(['react-a', 'react-b'], root, 2);
    expect([...found.keys()].sort()).toEqual(['react-a', 'react-b']);
    expect(found.get('react-b')?.dir).toBe('react-b');
  });

  test('a half that wrote no result did not measure: a throw naming it, with what it printed', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bundlers-own-'));
    made.push(root);
    half(root, 'react-a', 'echo nothing built; exit 3');
    await expect(measureHalves(['react-a'], root, 1)).rejects.toThrow(/react-a: measure exited 3 and wrote no bundlers-result\.json:\n.*nothing built/);
  });

  test('a half that exits non-zero with a result holding no contradiction did not measure: a throw naming it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bundlers-own-'));
    made.push(root);
    half(root, 'react-a', `echo '{"dir":"react-a","observations":[{"holds":true}]}' > bundlers-result.json; exit 1`);
    await expect(measureHalves(['react-a'], root, 1)).rejects.toThrow(/react-a: measure exited 1 with no contradiction in bundlers-result\.json/);
  });
});

function mkdirTree(root: string, half: string): void {
  const dir = join(root, half, 'node_modules', '@dravensoft', 'arena-react');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@dravensoft/arena-react', version: '12.1.1' }));
}

describe('carry', () => {
  const t = table();
  const half = (layer: 'react' | 'angular', bundler: string) => ({ ...results([]).halves[0]!, layer, bundler, dir: `${layer}-x` }) as Results['halves'][number];
  const previous = { date: '2026-10-25', commit: 'abc', seed: 3, halves: [half('react', 'rolldown'), half('angular', 'rolldown'), half('react', 'vite7'), half('react', 'next'), half('angular', 'angular')] } as never;

  test('holds the halves of the entries left out as the previous run measured them, with its date, commit and seed', () => {
    const carried = carry(t, previous, ['rolldown', 'next+angular'])!;
    expect(carried.halves.map((one) => `${one.layer}:${one.bundler}`)).toEqual(['react:rolldown', 'angular:rolldown', 'react:next', 'angular:angular']);
    expect([carried.date, carried.commit, carried.seed]).toEqual(['2026-10-25', 'abc', 3]);
  });

  test('is null when nothing was left out, there is no previous run, or the previous run measured none of them', () => {
    expect(carry(t, previous, [])).toBeNull();
    expect(carry(t, null, ['rolldown'])).toBeNull();
    expect(carry(t, previous, ['parcel'])).toBeNull();
  });
});

describe('schedule', () => {
  test('puts the half a previous run recorded as slowest first, and the slow Angular halves first when none recorded anything', () => {
    const dirs = [{ dir: 'react-calendly', layer: 'react' as const }, { dir: 'angular-calendly', layer: 'angular' as const }, { dir: 'react-etsy', layer: 'react' as const }];
    const root = mkdtempSync(join(tmpdir(), 'bundlers-schedule-'));
    made.push(root);
    for (const [dir, bundler] of [['react-calendly', 'rollup'], ['angular-calendly', 'rollup'], ['react-etsy', 'webpack']]) {
      mkdirSync(join(root, dir), { recursive: true });
      writeFileSync(join(root, dir, 'measure.ts'), `export const part = { bundler: '${bundler}' };\n`);
    }
    expect(schedule(dirs, root)).toEqual(['angular-calendly', 'react-etsy', 'react-calendly']);
    const previous = { halves: [{ layer: 'react', bundler: 'rollup', seconds: 900 }, { layer: 'angular', bundler: 'rollup', seconds: 10 }] } as never;
    expect(schedule(dirs, root, previous)).toEqual(['react-calendly', 'react-etsy', 'angular-calendly']);
  });
});
