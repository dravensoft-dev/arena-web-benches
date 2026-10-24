import { afterAll, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { finish, linkSheets, sheetOrder } from './static.ts';
import { scratch } from './scratch.ts';
import type { Mutation } from './types.ts';

const made: string[] = [];
const make = (dir: string, tag: string, m: Mutation) => {
  const path = scratch(dir, tag, m);
  made.push(path);
  return path;
};
afterAll(() => made.forEach((p) => rmSync(p, { recursive: true, force: true })));

const status = async () => (await Bun.$`git status --porcelain`.text());

/** relative path -> content hash (or link target) of every file, skipping the top-level names and `node_modules`. */
function tree(root: string, skip: string[], base = root, out: Record<string, string> = {}): Record<string, string> {
  for (const e of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, e.name);
    const rel = path.slice(base.length + 1);
    if (skip.includes(rel)) continue;
    if (e.isSymbolicLink()) out[rel] = `-> ${readlinkSync(path)}`;
    else if (e.isDirectory()) tree(path, skip, base, out);
    else out[rel] = createHash('sha1').update(readFileSync(path)).digest('hex');
  }
  return out;
}

const SKIP = ['dist', 'out', '.next', '.angular', 'node_modules'];
const mutations: Mutation[] = ['none', 'app-text', 'app-sheet', 'arena-patch'];
const entry = { 'react-etsy': 'src/Main.tsx', 'angular-etsy': 'src/main.ts' } as const;
const patched = {
  'react-etsy': 'components/forms/arena-button/ArenaButton.js',
  'angular-etsy': 'fesm2022/dravensoft-arena-angular.mjs',
} as const;

describe('scratch', () => {
  for (const half of ['react-etsy', 'angular-etsy'] as const) {
    for (const m of mutations) {
      test(`${half} ${m}: B stays as it was and the scratch differs only in the entry and the mutated file`, async () => {
        const before = await status();
        const path = make(half, `t-${m}`, m);
        expect(await status()).toBe(before);
        expect(path).toBe(`.run-${half}-t-${m}`);

        const a = tree(half, SKIP);
        const b = tree(path, SKIP);
        const changed = Object.keys(b).filter((k) => a[k] !== b[k]);
        expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
        expect(changed.sort()).toEqual(m === 'app-sheet' ? ['src/app.css', entry[half]].sort() : [entry[half]]);

        const text = readFileSync(join(path, entry[half]), 'utf8');
        expect(text).toContain(`__appMarker = '${half}${m === 'app-text' ? ' ·' : ''}';`);
        if (m === 'app-sheet') expect(readFileSync(join(path, 'src/app.css'), 'utf8')).toContain('.__app-sheet{order:1}');
      });
    }
  }

  test('the scratch keeps the half\'s links and leaves out dist, out, .next and .angular', () => {
    const path = make('angular-etsy', 't-links', 'none');
    expect(lstatSync(join(path, 'node_modules/@dravensoft/arena-angular')).isSymbolicLink()).toBe(true);
    expect(existsSync(join(path, '.angular'))).toBe(false);
    expect(existsSync(join(path, 'dist'))).toBe(false);
    expect(existsSync(join(path, 'node_modules/.bin'))).toBe(existsSync('angular-etsy/node_modules/.bin'));
  });

  for (const half of ['react-etsy', 'angular-etsy'] as const) {
    test(`${half} arena-patch: a real copy is patched, the root's copy is not`, async () => {
      const layer = half.split('-')[0]!;
      const root = readlinkSync(`${half}/node_modules/@dravensoft/arena-${layer}`);
      const hashBefore = Bun.hash(await Bun.$`cd node_modules/.bun && find . -path '*arena-${layer}*' -type f | sort | xargs cat`.arrayBuffer());
      const path = make(half, 't-patch', 'arena-patch');
      const link = join(path, 'node_modules/@dravensoft', `arena-${layer}`);
      expect(lstatSync(link).isSymbolicLink()).toBe(false);
      const patchedText = readFileSync(join(link, patched[half]), 'utf8');
      expect(patchedText.endsWith('globalThis.__arenaPatch = (globalThis.__arenaPatch ?? 0) + 1;\n')).toBe(true);
      const original = readFileSync(join(`${half}/node_modules/@dravensoft/arena-${layer}`, patched[half]), 'utf8');
      expect(original).not.toContain('__arenaPatch');
      expect(patchedText.startsWith(original)).toBe(true);
      expect(readlinkSync(`${half}/node_modules/@dravensoft/arena-${layer}`)).toBe(root);
      const hashAfter = Bun.hash(await Bun.$`cd node_modules/.bun && find . -path '*arena-${layer}*' -type f | sort | xargs cat`.arrayBuffer());
      expect(hashAfter).toBe(hashBefore);
    });
  }
});

describe('static steps', () => {
  test('a half whose styles.css carries the app rules gets them as a fourth sheet, linked last', () => {
    const half = 'angular-clickup';
    const dir = make(half, 't-link-rules', 'none');
    const out = join(dir, 'out-test');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'index.html'), '<!doctype html><html><head></head><body></body></html>');
    expect(sheetOrder(dir, 'angular')).toEqual(['arena.package.generated.css', 'arena.generated.css', 'plugin.generated.css', 'app.css']);
    linkSheets(dir, 'angular', out);
    const styles = readFileSync(`${half}/src/styles.css`, 'utf8');
    const rules = readFileSync(join(out, 'app.css'), 'utf8');
    expect(rules).not.toMatch(/^@import/m);
    expect(rules).toBe(styles.replace(/^@import[^\n]*\n/gm, ''));
    expect(rules).toContain('.app {');
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    expect([...html.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((m) => m[1]).at(-1)).toBe('app.css');
  });

  const order = ['arena.package.generated.css', 'arena.generated.css', 'plugin.generated.css', 'app.css'];

  test('sheetOrder is the entry\'s import order in both layers', () => {
    expect(sheetOrder('react-etsy', 'react')).toEqual(order);
    expect(sheetOrder('angular-etsy', 'angular')).toEqual(order);
  });

  for (const [half, layer] of [['react-etsy', 'react'], ['angular-etsy', 'angular']] as const) {
    test(`${half}: linkSheets inlines the package specifiers and links the four sheets in order`, () => {
      const dir = make(half, 't-link', 'none');
      const out = join(dir, 'out-test');
      mkdirSync(out, { recursive: true });
      writeFileSync(join(out, 'index.html'), '<!doctype html><html><head><title>x</title></head><body></body></html>');
      linkSheets(dir, layer, out);

      const pkg = readFileSync(join(out, 'arena.package.generated.css'), 'utf8');
      expect(pkg).not.toMatch(/@import\s+['"]@dravensoft\//);
      expect(pkg).not.toMatch(/@import\s+['"]\.\.?\//);
      const reset = readFileSync(`${half}/node_modules/@dravensoft/arena-${layer}/css/reset.css`, 'utf8');
      const firstRule = reset.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}@;]+\{/)![0].trim();
      expect(pkg).toContain(firstRule);
      expect(readFileSync(join(out, 'app.css'), 'utf8')).toBe(readFileSync(`${half}/src/app.css`, 'utf8'));
      expect(readFileSync(join(out, 'arena.generated.css'), 'utf8')).toContain('@import url(');

      const html = readFileSync(join(out, 'index.html'), 'utf8');
      const hrefs = [...html.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)">/g)].map((m) => m[1]);
      expect(hrefs).toEqual(order);
      expect(html.indexOf(`./${order[3]}`)).toBeLessThan(html.indexOf('</head>'));
    });

    test(`${half}: finish copies the sprite${layer === 'angular' ? ' and public/**' : ''}`, () => {
      const dir = make(half, 't-finish', 'none');
      const out = join(dir, 'out-test');
      finish(dir, layer, out);
      const sprite = readdirSync(join(dir, 'src')).filter((n) => /^icons-.*\.svg$/.test(n));
      expect(sprite.length).toBeGreaterThan(0);
      for (const s of sprite) expect(existsSync(join(out, s))).toBe(true);
      expect(existsSync(join(out, 'img'))).toBe(layer === 'angular');
      expect(existsSync(join(out, 'p1.jpg'))).toBe(false);
    });
  }
});
