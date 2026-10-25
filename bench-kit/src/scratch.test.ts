import { afterAll, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sheetOrder } from './static.ts';
import { hold, rebase, scratch, scratchPath } from './scratch.ts';
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

const SKIP = ['dist', 'out', '.next', '.angular', '.ngc', 'node_modules', 'bundlers-result.json'];
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

  test('the scratch links each package of the half to where the install put it and leaves out dist, out, .next, .angular and .ngc', () => {
    const path = make('angular-etsy', 't-links', 'none');
    expect(lstatSync(join(path, 'node_modules/@dravensoft/arena-angular')).isSymbolicLink()).toBe(true);
    expect(realpathSync(join(path, 'node_modules/@dravensoft/arena-angular'))).toBe(realpathSync('angular-etsy/node_modules/@dravensoft/arena-angular'));
    expect(realpathSync(join(path, 'node_modules/rollup'))).toBe(realpathSync('angular-etsy/node_modules/rollup'));
    expect(existsSync(join(path, 'node_modules/@dravensoft/arena-angular/package.json'))).toBe(true);
    expect(existsSync(join(path, 'node_modules/.bin/rollup'))).toBe(true);
    for (const left of ['.angular', '.ngc', 'dist']) expect(existsSync(join(path, left))).toBe(false);
  });

  for (const half of ['react-etsy', 'angular-etsy'] as const) {
    test(`${half} arena-patch: a real copy is patched, the half's install is not`, async () => {
      const layer = half.split('-')[0]!;
      const installed = `${half}/node_modules/@dravensoft/arena-${layer}`;
      const real = realpathSync(installed);
      const hashBefore = Bun.hash(await Bun.$`cd ${real} && find . -type f | sort | xargs cat`.arrayBuffer());
      const path = make(half, 't-patch', 'arena-patch');
      const link = join(path, 'node_modules/@dravensoft', `arena-${layer}`);
      expect(lstatSync(link).isSymbolicLink()).toBe(false);
      const patchedText = readFileSync(join(link, patched[half]), 'utf8');
      expect(patchedText.endsWith('globalThis.__arenaPatch = (globalThis.__arenaPatch ?? 0) + 1;\n')).toBe(true);
      const original = readFileSync(join(installed, patched[half]), 'utf8');
      expect(original).not.toContain('__arenaPatch');
      expect(patchedText.startsWith(original)).toBe(true);
      expect(realpathSync(installed)).toBe(real);
      const hashAfter = Bun.hash(await Bun.$`cd ${real} && find . -type f | sort | xargs cat`.arrayBuffer());
      expect(hashAfter).toBe(hashBefore);
    });
  }
});

describe('hold', () => {
  test('a scratch moves to a path of its own and the next one is built at the first path again (D11)', () => {
    const building = scratchPath('react-etsy', 'm');
    made.push(building, scratchPath('react-etsy', 't-hold-a'), scratchPath('react-etsy', 't-hold-b'));
    expect(building).toBe('.run-react-etsy-m');
    scratch('react-etsy', 'm', 'none');
    writeFileSync(join(building, 'dist-marker.txt'), 'first');
    const a = hold(building, scratchPath('react-etsy', 't-hold-a'));
    expect(existsSync(building)).toBe(false);
    expect(rebase(join(building, 'dist-marker.txt'), building, a)).toBe(join(a, 'dist-marker.txt'));
    expect(readFileSync(join(a, 'dist-marker.txt'), 'utf8')).toBe('first');
    // the second scratch is made at the same path, with other content, and its holder is another path
    scratch('react-etsy', 'm', 'app-text');
    expect(existsSync(join(building, 'dist-marker.txt'))).toBe(false);
    const b = hold(building, scratchPath('react-etsy', 't-hold-b'));
    expect(b).not.toBe(a);
    expect(readFileSync(join(a, 'src/Main.tsx'), 'utf8')).not.toBe(readFileSync(join(b, 'src/Main.tsx'), 'utf8'));
    // the packages are links to the half's install, which does not move
    expect(lstatSync(join(b, 'node_modules/@dravensoft/arena-react')).isSymbolicLink()).toBe(true);
    expect(existsSync(join(b, 'node_modules/@dravensoft/arena-react/package.json'))).toBe(true);
  });
});

describe('static steps', () => {
  const order = ['arena.package.generated.css', 'arena.generated.css', 'plugin.generated.css', 'app.css'];

  test('sheetOrder is the entry\'s import order in both layers', () => {
    expect(sheetOrder('react-etsy', 'react')).toEqual(order);
    expect(sheetOrder('angular-etsy', 'angular')).toEqual(order);
  });
});
