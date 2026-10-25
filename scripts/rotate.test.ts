import { afterAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { halves } from './build.ts';
import { assigned, assignment, table } from './bundlers/rotation.ts';
import { pinFor } from './bundlers/pins.ts';
import { ownHalves, partOf } from './halves/halves.ts';
import { bundlerFiles, plan, rotate, swap } from './rotate.ts';

const t = table();
const made: string[] = [];
afterAll(() => made.forEach((path) => rmSync(path, { recursive: true, force: true })));

describe('every half agrees with the table\'s rotation', () => {
  test.each(ownHalves())('%s holds the bundler `assigned()` gives it: its part, its pin, and the config file of its part', async (dir) => {
    const part = await partOf(dir);
    expect(part.bundler).toBe(assigned(t, dir).bundler);
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { packageManager: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };
    expect(declared[part.pin], `${dir} declares ${part.pin}`).toBe(pinFor(t, part.bundler, part.pin));
    expect(existsSync(join(dir, part.config)), `${dir} carries ${part.config}`).toBe(true);
    expect(manifest.packageManager).toBe(`bun@${t.pins['bun']}`);
  });

  test('the halves of the table are the sixteen directories on disk, one per product and layer', () => {
    expect(halves(t.products).map((one) => one.dir).sort()).toEqual(ownHalves().sort());
    for (const dir of ownHalves()) expect(existsSync(dir), dir).toBe(true);
  });
});

describe('plan', () => {
  test('the table\'s own rotation moves nothing', () => {
    expect(plan(t, t.rotation)).toEqual([]);
  });

  test('rotation 1 moves every half but the mixed pair of the old rotation, each to the bundler of the F4 column, with a donor where a half holds it now', () => {
    const moves = plan(t, 1);
    const next = assignment(t, 1);
    expect(moves.length).toBe(16);
    for (const move of moves) {
      expect(move.to).toBe(next.get(move.product)![move.layer]);
      expect(move.from).toBe(assigned(t, move.dir).bundler);
      const needs = ['bun', 'esbuild'].includes(move.to);
      expect(move.donor === null, `${move.dir} -> ${move.to}`).toBe(needs);
      if (move.donor) expect(assigned(t, move.donor).bundler).toBe(move.to);
    }
    expect(moves.filter((move) => move.donor === null).map((move) => move.dir).sort()).toEqual(['angular-calendly', 'angular-duolingo', 'react-calendly', 'react-duolingo']);
  });

  test('a rotation that needs a bundler no half holds stops before it writes anything, naming it', () => {
    expect(() => rotate('.', 1, false)).toThrow(/needs a half for bun, esbuild, and no half holds it now/);
  });
});

/** A root with two Vite-like halves and a rollup-like donor, the files a swap moves. */
function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'rotate-'));
  made.push(root);
  const put = (rel: string, text: string) => {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), text);
  };
  put('react-a/package.json', JSON.stringify({ name: 'react-a-bench', scripts: { dev: 'bun --hot ./Server.ts', bundle: 'old', build: 'old' }, devDependencies: { old: '1.0.0' } }));
  put('react-a/old.config.mjs', 'old\n');
  put('react-a/Server.ts', 'const port = process.env.PORT ?? 5101;\n');
  put('react-a/src/Main.tsx', 'a\n');
  put('react-a/README.md', 'react-a is the A bench on 5101 with old\n');
  put('react-a/bun.lock', 'lock a\n');
  put('react-b/package.json', JSON.stringify({ name: 'react-b-bench', scripts: { dev: 'bun --hot ./Server.ts', bundle: 'new', build: 'new && finish', finish: 'node finish.mjs' }, devDependencies: { fresh: '2.0.0' } }));
  put('react-b/new.config.mjs', 'new\n');
  put('react-b/finish.mjs', 'finish\n');
  put('react-b/Server.ts', 'const port = process.env.PORT ?? 5102;\n');
  put('react-b/src/Main.tsx', 'b\n');
  put('react-b/README.md', 'react-b is the B bench on 5102 with new\n');
  return root;
}

describe('swap', () => {
  test('a half takes its donor\'s config, scripts, devDependencies and README with its own name, dev flow and sources, and loses its old files and lockfile', () => {
    const root = fixture();
    swap(root, { dir: 'react-a', product: 'a', layer: 'react', from: 'rollup', to: 'vite7', donor: 'react-b' }, 'A', 'B');
    expect(readdirSync(join(root, 'react-a')).sort()).toEqual(['README.md', 'Server.ts', 'finish.mjs', 'new.config.mjs', 'package.json', 'src']);
    const manifest = JSON.parse(readFileSync(join(root, 'react-a', 'package.json'), 'utf8')) as { name: string; scripts: Record<string, string>; devDependencies: Record<string, string> };
    expect(manifest.name).toBe('react-a-bench');
    expect(manifest.scripts).toEqual({ bundle: 'new', build: 'new && finish', finish: 'node finish.mjs', dev: 'bun --hot ./Server.ts' });
    expect(manifest.devDependencies).toEqual({ fresh: '2.0.0' });
    expect(readFileSync(join(root, 'react-a', 'src/Main.tsx'), 'utf8')).toBe('a\n');
    expect(readFileSync(join(root, 'react-a', 'Server.ts'), 'utf8')).toContain('5101');
    expect(readFileSync(join(root, 'react-a', 'README.md'), 'utf8')).toBe('react-a is the A bench on 5101 with new\n');
    // the donor is as it was
    expect(readFileSync(join(root, 'react-b', 'README.md'), 'utf8')).toBe('react-b is the B bench on 5102 with new\n');
  });

  test('a target with no donor is a throw naming the half, the bundler and its part', () => {
    const root = fixture();
    expect(() => swap(root, { dir: 'react-a', product: 'a', layer: 'react', from: 'rollup', to: 'bun', donor: null }, 'A', 'B')).toThrow('react-a: no half holds bun; its part is bench-kit/parts/bun.ts');
    expect(readFileSync(join(root, 'react-a', 'old.config.mjs'), 'utf8')).toBe('old\n');
  });

  test('the bundler\'s files leave out the half\'s sources, Arena configuration, dev server and install, and keep angular.json unless the builder is involved', () => {
    const root = fixture();
    writeFileSync(join(root, 'react-a', 'angular.json'), '{}');
    expect(bundlerFiles(root, 'react-a', ['rollup', 'vite7']).sort()).toEqual(['README.md', 'old.config.mjs', 'package.json']);
    expect(bundlerFiles(root, 'react-a', ['rollup', 'angular']).sort()).toEqual(['README.md', 'angular.json', 'old.config.mjs', 'package.json']);
  });
});
