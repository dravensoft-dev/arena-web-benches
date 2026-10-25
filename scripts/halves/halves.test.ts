import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assigned, table } from '../bundlers/rotation.ts';
import { layerOf } from '../../bench-kit/src/scratch.ts';
import { checkSnippets, configOf } from '../../bench-kit/src/runner.ts';
import { sheetOrder } from '../../bench-kit/src/static.ts';
import { ownHalves, partOf } from './halves.ts';

/** The files each half commits at its root, besides `design/`, `src/` and `public/`: a half carries nothing else. */
const FILES: Record<string, string[]> = {
  'react-etsy': ['.gitignore', 'Server.ts', 'arena.config.json', 'bun.lock', 'finish.mjs', 'index.html', 'measure.ts', 'package.json', 'README.md', 'rollup.config.mjs'],
  'angular-etsy': ['.gitignore', 'angular.json', 'arena.config.json', 'bun.lock', 'entry.js', 'finish.mjs', 'index.html', 'measure.ts', 'package.json', 'README.md', 'rollup.config.mjs', 'tsconfig.app.json', 'tsconfig.json'],
};

const DIRECTORIES = ['design', 'public', 'src'];

const t = table();
const own = ownHalves();

/** The top-level names of the half's tracked and untracked-but-not-ignored files. */
function committed(dir: string): string[] {
  const listed = Bun.spawnSync(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '--', dir]).stdout.toString().trim().split('\n');
  return [...new Set(listed.map((path) => path.slice(dir.length + 1).split('/')[0]!))].filter((name) => !DIRECTORIES.includes(name)).sort();
}

test('the converted halves are the ones this test lists', () => {
  expect(own.sort()).toEqual(Object.keys(FILES).sort());
});

describe.each(own)('%s', (dir) => {
  const layer = layerOf(dir);

  test('carries the files its list names and no other at its root', () => {
    expect(committed(dir)).toEqual([...FILES[dir]!].sort());
  });

  test('declares its bundler at the pin, every package of the table at its pin, every package its config and part import, and an install that holds them', async () => {
    const part = await partOf(dir);
    expect(part.bundler).toBe(assigned(t, dir).bundler);
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };
    expect(declared[part.pin]).toBe(t.pins[part.pin]!);
    for (const [name, version] of Object.entries(declared)) {
      if (name in t.pins) expect(`${name}@${version}`).toBe(`${name}@${t.pins[name]}`);
    }
    expect(declared['@benches/kit']).toBe('file:../bench-kit/src');
    const imported = [part.config, 'measure.ts'].flatMap((file) => [...readFileSync(join(dir, file), 'utf8').matchAll(/(?:from|import)\s+'([^'.][^']*)'/g)].map((match) => match[1]!))
      .filter((specifier) => !specifier.startsWith('node:'))
      .map((specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/'));
    for (const name of new Set(imported)) expect(declared[name], `${dir} imports ${name} and does not declare it`).toBeDefined();
    expect(declared[`@dravensoft/arena-${layer}`]).toMatch(/^file:\.\.\/vendor\/dravensoft-arena-/);
    for (const name of Object.keys(declared).filter((one) => one in t.pins)) {
      const installed = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { version: string };
      expect(`${name}@${installed.version}`).toBe(`${name}@${declared[name]}`);
    }
    expect(existsSync(join(dir, 'bun.lock'))).toBe(true);
  });

  test('runs build as prebuild, then the bundler, then finish, and measure as its own script', () => {
    const { scripts } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(scripts['prebuild']).toContain('arena build');
    expect(scripts['measure']).toBe('bun run prebuild && bun measure.ts');
    expect(scripts['build']).toBe(layer === 'angular' ? 'bun run compile && bun run bundle && bun run finish' : 'bun run bundle && bun run finish');
    if (layer === 'angular') expect(scripts['compile']).toContain('ngc -p tsconfig.app.json');
  });

  test('ignores what its scripts write: its install, outputs, result and, on Angular, the ngc output', () => {
    const ignored = readFileSync(join(dir, '.gitignore'), 'utf8').split('\n').map((line) => line.replace(/\/$/, ''));
    for (const name of ['node_modules', 'dist', 'bundlers-result.json', ...(layer === 'angular' ? ['.ngc', '.angular'] : [])]) expect(ignored).toContain(name);
  });

  test('holds every snippet of its part exactly once, and each variant rewrites its config', async () => {
    const part = await partOf(dir);
    const config = readFileSync(join(dir, part.config), 'utf8');
    checkSnippets(part, config);
    for (const variant of Object.keys(part.variants) as (keyof typeof part.variants)[]) {
      expect(configOf(part, variant, config)).not.toBe(config);
    }
    expect(part.compile === true).toBe(layer === 'angular');
  });

  test('carries a page that differs from src/index.html only in its script and link tags (and the base an Angular page makes relative)', () => {
    const plain = (html: string) => html
      .replace(/^[ \t]*<link rel="stylesheet" href="[^"]*">\n/gm, '')
      .replace(/^[ \t]*<script type="module" src="[^"]*"><\/script>\n/gm, '')
      .replace(/<base href="[^"]*" ?\/?>/, '<base href="./" />');
    const page = readFileSync(join(dir, 'index.html'), 'utf8');
    expect(plain(page)).toBe(plain(readFileSync(join(dir, 'src', 'index.html'), 'utf8')));
    const linked = [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((match) => match[1]);
    expect(linked).toEqual(sheetOrder(dir, layer));
  });
});

describe('the rollup halves', () => {
  test('both carry the rollup rows of the page, as one part', async () => {
    const ids = (await Promise.all(own.map(async (dir) => (await partOf(dir)).observations.map((o) => o.id))));
    expect(ids[0]).toEqual(['rollup.js-apart', 'rollup.no-css', 'rollup.sprite-not-copied', 'rollup.linked-sheets']);
    expect(ids[1]).toEqual(ids[0]!);
  });
});
