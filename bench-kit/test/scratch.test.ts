import { afterAll, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PATCHED, fixture } from './fixture.ts';
import { sheetOrder } from '../src/static.ts';
import { hold, rebase, scratch, scratchPath } from '../src/scratch.ts';
import type { Mutation } from '../src/types.ts';

const made: string[] = [];
const fixtures = { react: fixture('react'), angular: fixture('angular') };
made.push(fixtures.react.root, fixtures.angular.root);
const make = (layer: 'react' | 'angular', tag: string, m: Mutation, copyArena = false) => {
  const { root, dir } = fixtures[layer];
  const path = scratch(dir, tag, m, root, copyArena);
  made.push(path);
  return path;
};
afterAll(() => made.forEach((p) => rmSync(p, { recursive: true, force: true })));

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
const entry = { react: 'src/Main.tsx', angular: 'src/main.ts' } as const;
const LAYERS = ['react', 'angular'] as const;

describe('scratch', () => {
  for (const layer of LAYERS) {
    const { root, dir } = fixtures[layer];
    for (const m of mutations) {
      test(`${layer} ${m}: the half stays as it was and the scratch differs only in the entry and the mutated file`, () => {
        const before = tree(join(root, dir), []);
        const path = make(layer, `t-${m}`, m);
        expect(tree(join(root, dir), [])).toEqual(before);
        expect(path).toBe(join(root, `.run-${dir}-t-${m}`));

        const a = tree(join(root, dir), SKIP);
        const b = tree(path, SKIP);
        const changed = Object.keys(b).filter((k) => a[k] !== b[k]);
        expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
        expect(changed.sort()).toEqual(m === 'app-sheet' ? ['src/app.css', entry[layer]].sort() : [entry[layer]]);

        const text = readFileSync(join(path, entry[layer]), 'utf8');
        expect(text).toContain(`__appMarker = '${dir}${m === 'app-text' ? ' ·' : ''}';`);
        if (m === 'app-sheet') expect(readFileSync(join(path, 'src/app.css'), 'utf8')).toContain('.__app-sheet{order:1}');
      });
    }
  }

  test('the scratch links each package of the half to where the install put it and leaves out dist, out, .next, .angular and .ngc', () => {
    const { root, dir } = fixtures.angular;
    mkdirSync(join(root, dir, '.ngc'), { recursive: true });
    mkdirSync(join(root, dir, 'dist'), { recursive: true });
    const path = make('angular', 't-links', 'none');
    const link = join(path, 'node_modules/@dravensoft/arena-angular');
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(realpathSync(link)).toBe(realpathSync(join(root, dir, 'node_modules/@dravensoft/arena-angular')));
    expect(realpathSync(join(path, 'node_modules/rollup'))).toBe(realpathSync(join(root, dir, 'node_modules/rollup')));
    expect(existsSync(join(link, 'package.json'))).toBe(true);
    expect(existsSync(join(path, 'node_modules/.bin/rollup'))).toBe(true);
    for (const left of ['.angular', '.ngc', 'dist']) expect(existsSync(join(path, left))).toBe(false);
  });

  test('with copyArena, Arena\'s package is a real directory below the scratch (an npm install\'s layout) and the other packages stay links', () => {
    const { root, dir } = fixtures.angular;
    const path = make('angular', 't-copy', 'none', true);
    const arena = join(path, 'node_modules/@dravensoft/arena-angular');
    expect(lstatSync(arena).isSymbolicLink()).toBe(false);
    expect(realpathSync(arena)).toBe(arena);
    expect(existsSync(join(arena, 'package.json'))).toBe(true);
    expect(lstatSync(join(path, 'node_modules/rollup')).isSymbolicLink()).toBe(true);
    expect(realpathSync(join(root, dir, 'node_modules/@dravensoft/arena-angular'))).not.toBe(arena);
  });

  for (const layer of LAYERS) {
    test(`${layer} arena-patch with copyArena patches the scratch's own directory and not the half's install`, () => {
      const { root, dir } = fixtures[layer];
      const installed = join(root, dir, 'node_modules/@dravensoft', `arena-${layer}`);
      const path = make(layer, 't-copy-patch', 'arena-patch', true);
      const copy = join(path, 'node_modules/@dravensoft', `arena-${layer}`);
      expect(readFileSync(join(copy, PATCHED[layer]), 'utf8')).toContain('__arenaPatch');
      expect(readFileSync(join(installed, PATCHED[layer]), 'utf8')).not.toContain('__arenaPatch');
    });

    test(`${layer} arena-patch: a real copy is patched, the half's install is not`, async () => {
      const { root, dir } = fixtures[layer];
      const installed = join(root, dir, 'node_modules/@dravensoft', `arena-${layer}`);
      const real = realpathSync(installed);
      const hashBefore = Bun.hash(await Bun.$`cd ${real} && find . -type f | sort | xargs cat`.arrayBuffer());
      const path = make(layer, 't-patch', 'arena-patch');
      const link = join(path, 'node_modules/@dravensoft', `arena-${layer}`);
      expect(lstatSync(link).isSymbolicLink()).toBe(false);
      const patchedText = readFileSync(join(link, PATCHED[layer]), 'utf8');
      expect(patchedText.endsWith('globalThis.__arenaPatch = (globalThis.__arenaPatch ?? 0) + 1;\n')).toBe(true);
      const original = readFileSync(join(installed, PATCHED[layer]), 'utf8');
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
    const { root, dir } = fixtures.react;
    const building = scratchPath(dir, 'm', root);
    made.push(building, scratchPath(dir, 't-hold-a', root), scratchPath(dir, 't-hold-b', root));
    expect(building).toBe(join(root, `.run-${dir}-m`));
    scratch(dir, 'm', 'none', root);
    writeFileSync(join(building, 'dist-marker.txt'), 'first');
    const a = hold(building, scratchPath(dir, 't-hold-a', root));
    expect(existsSync(building)).toBe(false);
    expect(rebase(join(building, 'dist-marker.txt'), building, a)).toBe(join(a, 'dist-marker.txt'));
    expect(readFileSync(join(a, 'dist-marker.txt'), 'utf8')).toBe('first');
    // the second scratch is made at the same path, with other content, and its holder is another path
    scratch(dir, 'm', 'app-text', root);
    expect(existsSync(join(building, 'dist-marker.txt'))).toBe(false);
    const b = hold(building, scratchPath(dir, 't-hold-b', root));
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
    for (const layer of LAYERS) expect(sheetOrder(join(fixtures[layer].root, fixtures[layer].dir), layer)).toEqual(order);
  });
});
