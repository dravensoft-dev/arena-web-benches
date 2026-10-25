import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assigned, table } from '../bundlers/rotation.ts';
import { layerOf } from '../../bench-kit/src/scratch.ts';
import { checkSnippets, configOf } from '../../bench-kit/src/runner.ts';
import { sheetOrder } from '../../bench-kit/src/static.ts';
import { ownHalves, partOf } from './halves.ts';

const COMMON = ['.gitignore', 'arena.config.json', 'bun.lock', 'finish.mjs', 'measure.ts', 'package.json', 'README.md'];
const REACT = [...COMMON, 'Server.ts'];
const ANGULAR = [...COMMON, 'angular.json', 'tsconfig.json'];

/** The files each half commits at its root, besides `design/`, `src/` and `public/`: a half carries nothing else. */
const FILES: Record<string, string[]> = {
  'react-etsy': [...REACT, 'index.html', 'rollup.config.mjs'],
  'angular-etsy': [...ANGULAR, 'entry.js', 'index.html', 'rollup.config.mjs', 'tsconfig.app.json'],
  'react-clickup': [...REACT, 'vite.config.mjs'],
  'angular-clickup': [...ANGULAR, 'index.html', 'vite.config.mjs'],
  'react-duolingo': [...REACT, 'vite.config.mjs'],
  'angular-duolingo': [...ANGULAR, 'index.html', 'vite.config.mjs'],
  'react-grafana': [...REACT, 'index.html', 'rolldown.config.mjs'],
  'angular-grafana': [...ANGULAR, 'entry.js', 'index.html', 'rolldown.config.mjs', 'tsconfig.app.json'],
  'react-superhuman': [...REACT],
  'angular-superhuman': [...ANGULAR, '.parcelrc', 'index.html', 'parcel-transformer-angular-linker.cjs', 'tsconfig.app.json'],
};

/** The bundlers whose page links the four sheets (they bundle no CSS); the rest take the sheets through the entry. */
const LINKS_SHEETS = ['rollup', 'rolldown'];

/** The bundlers that run `ngc` on the Angular layer (`compile`); Vite compiles it through Analog. */
const COMPILES = ['rollup', 'rolldown', 'parcel'];

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

  test('declares its bundler at the pin, every package of the table at its pin, every package its files import, and an install that holds them', async () => {
    const part = await partOf(dir);
    expect(part.bundler).toBe(assigned(t, dir).bundler);
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };
    // The Vite 7 half declares `vite` itself, at the pin the table keeps under `vite7`.
    const pinOf = (name: string): string | undefined => (name === 'vite' && part.bundler === 'vite7' ? t.pins['vite7'] : t.pins[name]);
    expect(declared[part.pin]).toBe(pinOf(part.pin)!);
    for (const [name, version] of Object.entries(declared)) {
      if (pinOf(name) !== undefined) expect(`${name}@${version}`).toBe(`${name}@${pinOf(name)}`);
    }
    expect(declared['@benches/kit']).toBe('file:../bench-kit/src');
    const files = [part.config, 'measure.ts', ...FILES[dir]!.filter((name) => /\.(cjs|mjs)$/.test(name) && name !== part.config && name !== 'finish.mjs')];
    const imported = files.flatMap((file) => [...readFileSync(join(dir, file), 'utf8').matchAll(/(?:\b(?:from|import)\s+|\brequire\()'([^'.][^']*)'/g)].map((match) => match[1]!))
      .filter((specifier) => !specifier.startsWith('node:'))
      .map((specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/'));
    for (const name of new Set(imported)) expect(declared[name], `${dir} imports ${name} and does not declare it`).toBeDefined();
    expect(declared[`@dravensoft/arena-${layer}`]).toMatch(/^file:\.\.\/vendor\/dravensoft-arena-/);
    for (const name of Object.keys(declared).filter((one) => pinOf(one) !== undefined)) {
      const installed = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')) as { version: string };
      expect(`${name}@${installed.version}`).toBe(`${name}@${declared[name]}`);
    }
    expect(existsSync(join(dir, 'bun.lock'))).toBe(true);
  });

  test('runs build as prebuild, then the bundler, then finish, and measure as its own script', async () => {
    const part = await partOf(dir);
    const { scripts } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(scripts['prebuild']).toContain('arena build');
    expect(scripts['measure']).toBe('bun run prebuild && bun measure.ts');
    expect(scripts['build']).toBe(part.compile ? 'bun run compile && bun run bundle && bun run finish' : 'bun run bundle && bun run finish');
    if (part.compile) expect(scripts['compile']).toContain('ngc -p tsconfig.app.json');
    else expect(scripts['compile']).toBeUndefined();
  });

  test('ignores what its scripts write: its install, outputs, result and, where it runs ngc, the ngc output', async () => {
    const part = await partOf(dir);
    const ignored = readFileSync(join(dir, '.gitignore'), 'utf8').split('\n').map((line) => line.replace(/\/$/, ''));
    for (const name of ['node_modules', 'dist', 'bundlers-result.json', ...(layer === 'angular' ? ['.angular'] : []), ...(part.compile ? ['.ngc'] : []), ...(part.bundler === 'parcel' ? ['.parcel-cache'] : [])]) {
      expect(ignored).toContain(name);
    }
  });

  test('holds every snippet of its part exactly once, and each variant rewrites its config', async () => {
    const part = await partOf(dir);
    const config = readFileSync(join(dir, part.config), 'utf8');
    checkSnippets(part, config);
    for (const variant of Object.keys(part.variants) as (keyof typeof part.variants)[]) {
      expect(configOf(part, variant, config)).not.toBe(config);
    }
    expect(part.compile === true).toBe(layer === 'angular' && COMPILES.includes(part.bundler));
  });

  test('a variant of a JSON config is JSON', async () => {
    const part = await partOf(dir);
    if (!part.config.endsWith('.json')) return;
    const config = readFileSync(join(dir, part.config), 'utf8');
    for (const variant of Object.keys(part.variants) as (keyof typeof part.variants)[]) JSON.parse(configOf(part, variant, config));
  });

  if (existsSync(join(dir, 'index.html'))) {
    test('carries a page that differs from src/index.html only in its base, script and link tags', async () => {
      const part = await partOf(dir);
      const plain = (html: string) => html
        .replace(/^[ \t]*<base href="[^"]*" ?\/?>\n/gm, '')
        .replace(/^[ \t]*<link rel="stylesheet" href="[^"]*">\n/gm, '')
        .replace(/^[ \t]*<script type="module" src="[^"]*"><\/script>\n/gm, '');
      const page = readFileSync(join(dir, 'index.html'), 'utf8');
      expect(plain(page)).toBe(plain(readFileSync(join(dir, 'src', 'index.html'), 'utf8')));
      expect(page).toContain('<base href="./"');
      const linked = [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((match) => match[1]);
      if (LINKS_SHEETS.includes(part.bundler)) expect(linked).toEqual(sheetOrder(dir, layer));
      else expect(page).not.toContain('generated.css');
    });
  }
});

describe('the halves of one bundler', () => {
  const rows: Record<string, string[]> = {
    rollup: ['rollup.js-apart', 'rollup.no-css', 'rollup.sprite-not-copied', 'rollup.linked-sheets'],
    vite7: ['vite7.js-apart', 'vite7.sheet-apart', 'vite7.sheet-by-name'],
    vite8: ['vite8.js-apart', 'vite8.sheet-apart', 'vite8.sheet-by-name'],
    rolldown: ['rolldown.js-apart', 'rolldown.css-refused', 'rolldown.sprite-not-copied', 'rolldown.linked-sheets'],
    parcel: ['parcel.needs-package-exports', 'parcel.first-import-resolves', 'parcel.js-apart', 'parcel.sheet-apart', 'parcel.react-with-app', 'parcel.shared-stem'],
  };

  test('both carry the rows of the bundler\'s page, as one part', async () => {
    for (const [bundler, ids] of Object.entries(rows)) {
      const halves = own.filter((dir) => assigned(t, dir).bundler === bundler);
      expect(halves, bundler).toHaveLength(2);
      for (const dir of halves) expect((await partOf(dir)).observations.map((o) => o.id), dir).toEqual(ids);
    }
  });

  test('both carry the same variants and the same snippet names', async () => {
    for (const bundler of Object.keys(rows)) {
      const [react, angular] = await Promise.all(own.filter((dir) => assigned(t, dir).bundler === bundler).map((dir) => partOf(dir)));
      expect(Object.keys(react!.variants).sort(), bundler).toEqual(Object.keys(angular!.variants).sort());
      expect(Object.keys(react!.snippets).sort(), bundler).toEqual(Object.keys(angular!.snippets).sort());
    }
  });
});
