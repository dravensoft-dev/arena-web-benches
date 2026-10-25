import { afterAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { halves } from './build.ts';
import { assigned, assignment, table } from './bundlers/rotation.ts';
import { pinFor } from './bundlers/pins.ts';
import { ownHalves, partOf } from './halves/halves.ts';
import { cpSync } from 'node:fs';
import { bundlerFiles, donorSource, installMoved, plan, rotate, swap, templateSource } from './rotate.ts';

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

});

/** The package whose installed version is a bundler's own, as each half's part names it. */
const PIN: Partial<Record<string, string>> = { angular: '@angular/build', rspack: '@rspack/core', vite7: 'vite', vite8: 'vite' };

describe('rotation 1 on a copy of the benches', () => {
  const root = mkdtempSync(join(tmpdir(), 'rotate-1-'));
  made.push(root);
  cpSync('.', root, { recursive: true, filter: (from) => !/(^|[\\/])(node_modules|dist|\.git|vendor|\.run-[^\\/]*)$/.test(from) });
  const moves = rotate(root, 1, false);
  const next = table(root);

  test('moves every half, from a donor or from the template of Bun and esbuild, and records the rotation', () => {
    expect(moves.length).toBe(16);
    expect(next.rotation).toBe(1);
    expect(moves.filter((move) => move.donor === null).map((move) => `${move.dir}:${move.to}`).sort()).toEqual(['angular-calendly:bun', 'angular-duolingo:esbuild', 'react-calendly:bun', 'react-duolingo:esbuild']);
  });

  test.each(ownHalves())('%s agrees with assigned() of rotation 1: its part, its declared pin, its scripts and no file of another bundler', (dir) => {
    const { bundler } = assigned(next, dir);
    const measure = readFileSync(join(root, dir, 'measure.ts'), 'utf8');
    expect(measure, `${dir} measure.ts`).toContain(`bundler: '${bundler}'`);
    const manifest = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as { packageManager: string; scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> };
    if (bundler === 'bun') expect(manifest.packageManager).toBe(`bun@${next.pins['bun']}`);
    else {
      const pin = PIN[bundler] ?? bundler;
      expect(manifest.devDependencies[pin], `${dir} declares ${pin}`).toBe(pinFor(next, bundler, pin));
    }
    expect(manifest.scripts['bundle'], `${dir} bundle`).toBeString();
    expect(manifest.scripts['build']).toContain('bun run bundle');
    expect(manifest.dependencies[`@dravensoft/arena-${dir.startsWith('react') ? 'react' : 'angular'}`]).toMatch(/^file:\.\.\/vendor\//);
    const part = /config: ['"]([^'"]+)['"]/.exec(measure)![1]!;
    expect(existsSync(join(root, dir, part)) || part === 'package.json', `${dir} carries ${part}`).toBe(true);
    // no config of a bundler it does not hold
    const configs = readdirSync(join(root, dir)).filter((name) => /^(vite|rollup|rolldown|webpack|rspack|esbuild|next)\.config\.mjs$/.test(name));
    expect(configs.length <= 1, `${dir}: ${configs}`).toBe(true);
    if (configs[0]) expect(configs[0].startsWith(bundler.replace(/\d$/, '')) || bundler === 'angular', `${dir}: ${configs[0]}`).toBe(true);
  });

  test('a half moved from a template carries the pin of the table in its package.json and the files of its layer', () => {
    expect(JSON.parse(readFileSync(join(root, 'react-duolingo', 'package.json'), 'utf8')).devDependencies.esbuild).toBe(next.pins['esbuild']);
    expect(existsSync(join(root, 'angular-duolingo', 'entry.js'))).toBe(true);
    expect(existsSync(join(root, 'angular-calendly', 'bun.config.mjs'))).toBe(true);
    expect(readFileSync(join(root, 'react-calendly', 'README.md'), 'utf8')).toContain('react-calendly');
    expect(existsSync(join(root, 'react-calendly', 'tsconfig.json'))).toBe(false);
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
    swap(root, { dir: 'react-a', product: 'a', layer: 'react', from: 'rollup', to: 'vite7', donor: 'react-b' }, 'A', donorSource(root, 'react-b', 'react', ['rollup', 'vite7'], 'B'));
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

  test('the lockfile is made again after a swap by a real `bun install`: it names the donor\'s devDependency and none of the old half\'s', () => {
    const root = fixture();
    const donor = join(root, 'react-b', 'package.json');
    writeFileSync(donor, JSON.stringify({ ...JSON.parse(readFileSync(donor, 'utf8')), devDependencies: { 'is-number': '7.0.0' } }));
    writeFileSync(join(root, 'react-a', 'package.json'), JSON.stringify({ name: 'react-a-bench', scripts: { dev: 'bun --hot ./Server.ts', bundle: 'old', build: 'old' }, devDependencies: { 'is-odd': '3.0.1' } }));
    const move = { dir: 'react-a', product: 'a', layer: 'react' as const, from: 'rollup' as const, to: 'vite7' as const, donor: 'react-b' };
    swap(root, move, 'A', donorSource(root, 'react-b', 'react', ['rollup', 'vite7'], 'B'));
    expect(existsSync(join(root, 'react-a', 'bun.lock'))).toBe(false);
    installMoved(root, [move]);
    const lock = readFileSync(join(root, 'react-a', 'bun.lock'), 'utf8');
    expect(lock).toContain('is-number');
    expect(lock).not.toContain('is-odd');
  }, 120000);

  test('a bundler with no donor and no template is a throw naming it', () => {
    expect(() => templateSource('vite7', 'react', t.pins)).toThrow('no half holds vite7 and bench-kit/parts has no template for it');
  });

  test('the bundler\'s files leave out the half\'s sources, Arena configuration, dev server and install, and keep angular.json unless the builder is involved', () => {
    const root = fixture();
    writeFileSync(join(root, 'react-a', 'angular.json'), '{}');
    expect(bundlerFiles(root, 'react-a', ['rollup', 'vite7']).sort()).toEqual(['README.md', 'old.config.mjs', 'package.json']);
    expect(bundlerFiles(root, 'react-a', ['rollup', 'angular']).sort()).toEqual(['README.md', 'angular.json', 'old.config.mjs', 'package.json']);
  });
});
