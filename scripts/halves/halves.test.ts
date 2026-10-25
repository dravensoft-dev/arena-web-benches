import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assigned, table } from '../bundlers/rotation.ts';
import { layerOf } from '../../bench-kit/src/scratch.ts';
import { checkSnippets, configOf } from '../../bench-kit/src/runner.ts';
import { sheetOrder } from '../../bench-kit/src/static.ts';
import { ownHalves, partOf } from './halves.ts';

const COMMON = ['.gitignore', 'arena.config.json', 'bun.lock', 'measure.ts', 'package.json', 'README.md'];
const REACT = [...COMMON, 'Server.ts'];
const ANGULAR = [...COMMON, 'angular.json', 'tsconfig.json'];

/** The halves whose bundler writes everything itself, or whose bundler copies the sprite in its config: they have no `finish`. */
const NO_FINISH = ['react-instagram', 'angular-instagram', 'react-notion'];

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
  'react-instagram': [...REACT, 'index.html', 'webpack.config.mjs'],
  'angular-instagram': [...ANGULAR, 'index.html', 'linker-loader.mjs', 'webpack.config.mjs'],
  'react-notion': [...REACT, 'index.html', 'rspack.config.mjs'],
  'angular-notion': [...ANGULAR, 'rspack.config.mjs'],
  'react-calendly': [...REACT, 'next.config.mjs', 'tsconfig.json'],
  'angular-calendly': [...ANGULAR, 'tsconfig.app.json'],
  'angular-superhuman': [...ANGULAR, '.parcelrc', 'index.html', 'parcel-transformer-angular-linker.cjs', 'tsconfig.app.json'],
};

for (const dir of Object.keys(FILES)) if (!NO_FINISH.includes(dir)) FILES[dir]!.push('finish.mjs');

/** The bundlers whose page links the four sheets (they bundle no CSS); the rest take the sheets through the entry. */
const LINKS_SHEETS = ['rollup', 'rolldown'];

/** The bundlers that run `ngc` on the Angular layer (`compile`); Vite compiles it through Analog. */
const COMPILES = ['rollup', 'rolldown', 'parcel'];

const DIRECTORIES = ['app', 'design', 'public', 'src'];


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

  test('runs build as prebuild, then the bundler, then finish where it has one, and measure as its own script', async () => {
    const part = await partOf(dir);
    const { scripts } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(scripts['prebuild']).toContain('arena build');
    expect(scripts['measure']).toBe('bun run prebuild && bun measure.ts');
    const steps = [...(part.compile ? ['compile'] : []), 'bundle', ...(NO_FINISH.includes(dir) ? [] : ['finish'])];
    expect(scripts['build']).toBe(steps.map((step) => `bun run ${step}`).join(' && '));
    expect(scripts['finish'] !== undefined).toBe(!NO_FINISH.includes(dir));
    if (part.compile) expect(scripts['compile']).toContain('ngc -p tsconfig.app.json');
    else expect(scripts['compile']).toBeUndefined();
  });

  test('ignores what its scripts write: its install, outputs, result and, where it runs ngc, the ngc output', async () => {
    const part = await partOf(dir);
    const ignored = readFileSync(join(dir, '.gitignore'), 'utf8').split('\n').map((line) => line.replace(/\/$/, ''));
    for (const name of ['node_modules', 'dist', 'bundlers-result.json', ...(layer === 'angular' ? ['.angular'] : []), ...(part.compile ? ['.ngc'] : []), ...(part.bundler === 'parcel' ? ['.parcel-cache'] : []), ...(part.bundler === 'rspack' && layer === 'angular' ? ['.nx'] : []), ...(part.bundler === 'next' ? ['.next', 'next-env.d.ts'] : [])]) {
      expect(ignored).toContain(name);
    }
  });

  test('holds every snippet of its part exactly once, and each variant rewrites its config', async () => {
    const part = await partOf(dir);
    const config = readFileSync(join(dir, part.config), 'utf8');
    checkSnippets(part, config);
    // A bundler whose page prints no config has nothing to remove: `plain` is `recipe` (Next.js, the Angular builder).
    for (const variant of Object.keys(part.variants) as (keyof typeof part.variants)[]) {
      if (Object.keys(part.snippets).length > 0) expect(configOf(part, variant, config)).not.toBe(config);
      else expect(configOf(part, variant, config)).toBe(config);
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

test('the Next.js half carries the layout and the page of its app, as TypeScript, and a complete tsconfig.json', () => {
  expect(Bun.spawnSync(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '--', 'react-calendly/app']).stdout.toString().trim().split('\n').sort()).toEqual(['react-calendly/app/layout.tsx', 'react-calendly/app/page.tsx']);
  const manifest = JSON.parse(readFileSync('react-calendly/package.json', 'utf8')) as { devDependencies: Record<string, string> };
  for (const name of ['typescript', '@types/react', '@types/react-dom', '@types/node', 'next']) expect(manifest.devDependencies[name], name).toMatch(/^\d+\.\d+\.\d+$/);
  const tsconfig = JSON.parse(readFileSync('react-calendly/tsconfig.json', 'utf8')) as { compilerOptions: { strict: boolean; jsx: string; plugins: { name: string }[] }; include: string[] };
  expect(tsconfig.compilerOptions.strict).toBe(true);
  expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
  expect(tsconfig.compilerOptions.plugins).toEqual([{ name: 'next' }]);
  expect(tsconfig.include).toContain('src/**/*.tsx');
});

describe('the halves of one bundler', () => {
  const rows: Record<string, string[]> = {
    rollup: ['rollup.js-apart', 'rollup.no-css', 'rollup.sprite-not-copied', 'rollup.linked-sheets'],
    vite7: ['vite7.js-apart', 'vite7.sheet-apart', 'vite7.sheet-by-name'],
    vite8: ['vite8.js-apart', 'vite8.sheet-apart', 'vite8.sheet-by-name'],
    rolldown: ['rolldown.js-apart', 'rolldown.css-refused', 'rolldown.sprite-not-copied', 'rolldown.linked-sheets'],
    parcel: ['parcel.needs-package-exports', 'parcel.first-import-resolves', 'parcel.js-apart', 'parcel.sheet-apart', 'parcel.react-with-app', 'parcel.shared-stem'],
    webpack: ['webpack.js-apart', 'webpack.sheet-apart', 'webpack.one-css-without', 'webpack.group-needs-type', 'webpack.extension-alias'],
    rspack: ['rspack.js-apart', 'rspack.sheet-apart', 'rspack.needs-css-auto', 'rspack.css-auto-angular', 'rspack.extension-alias'],
  };

  /** Next.js builds the React layer only, the Angular builder the Angular layer only (the mixed product). */
  const single: Record<string, string[]> = {
    next: ['next.js-apart', 'next.sheet-apart', 'next.sprite-public'],
    angular: ['angular.arena-in-main', 'angular.one-styles-file', 'angular.side-effects-false'],
  };

  test('both carry the rows of the bundler\'s page, as one part', async () => {
    for (const [bundler, ids] of Object.entries(rows)) {
      const halves = own.filter((dir) => assigned(t, dir).bundler === bundler);
      expect(halves, bundler).toHaveLength(2);
      for (const dir of halves) expect((await partOf(dir)).observations.map((o) => o.id), dir).toEqual(ids);
    }
  });

  test('the mixed product carries the rows of its page on the one layer each builds', async () => {
    for (const [bundler, ids] of Object.entries(single)) {
      const halves = own.filter((dir) => assigned(t, dir).bundler === bundler);
      expect(halves, bundler).toHaveLength(1);
      expect(halves[0]!.startsWith(bundler === 'next' ? 'react-' : 'angular-')).toBe(true);
      expect((await partOf(halves[0]!)).observations.map((o) => o.id)).toEqual(ids);
    }
  });

  test('both carry the same variants and the same snippet names', async () => {
    for (const bundler of Object.keys(rows)) {
      const dirs = own.filter((dir) => assigned(t, dir).bundler === bundler);
      const [react, angular] = await Promise.all(['react-', 'angular-'].map((prefix) => partOf(dirs.find((dir) => dir.startsWith(prefix))!)));
      // `extensionAlias` and rspack's `styles` option are what only an Angular half's config carries (`main.ts` imports the icon list `arena build` writes, as `.js`).
      const alias = ['webpack', 'rspack'].includes(bundler);
      expect(Object.keys(react!.variants).sort(), bundler).toEqual(Object.keys(angular!.variants).filter((name) => !(alias && name === 'no-extension-alias')).sort());
      expect(Object.keys(react!.snippets).sort(), bundler).toEqual(Object.keys(angular!.snippets).filter((name) => !(alias && name === 'extension-alias') && !(bundler === 'rspack' && name === 'styles')).sort());
    }
  });
});
