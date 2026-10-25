import { afterAll, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { jsRow, noSprite_, spriteAtRoot_ } from '../../bench-kit/src/observations.ts';
import { ownHalves, partFromHistory, partOf } from '../halves/halves.ts';
import type { BundlerId, Layer } from './types.ts';
import { judge } from '../../bench-kit/src/observations.ts';
import type { Built, Context, Observation } from '../../bench-kit/src/observations.ts';
import { bunPart } from '../../bench-kit/parts/bun.ts';
import { esbuildPart } from '../../bench-kit/parts/esbuild.ts';

const roots: string[] = [];
afterAll(() => roots.forEach((path) => rmSync(path, { recursive: true, force: true })));

/** The rows of every bundler, the sixteen halves' (read from one half of each) and the parts of the two no half carries in rotation 0. */
const ROWS = [
  'vite7.js-apart', 'vite7.sheet-apart', 'vite7.sheet-by-name',
  'vite8.js-apart', 'vite8.sheet-apart', 'vite8.sheet-by-name',
  'rolldown.js-apart', 'rolldown.css-refused', 'rolldown.sprite-not-copied', 'rolldown.linked-sheets',
  'parcel.needs-package-exports', 'parcel.first-import-resolves', 'parcel.js-apart', 'parcel.sheet-apart', 'parcel.react-with-app', 'parcel.shared-stem',
  'rollup.js-apart', 'rollup.no-css', 'rollup.sprite-not-copied', 'rollup.linked-sheets',
  'webpack.js-apart', 'webpack.sheet-apart', 'webpack.one-css-without', 'webpack.group-needs-type', 'webpack.sprite-at-root', 'webpack.extension-alias',
  'rspack.js-apart', 'rspack.sheet-apart', 'rspack.needs-css-auto', 'rspack.css-auto-angular', 'rspack.sprite-at-root', 'rspack.extension-alias',
  'angular.arena-in-main', 'angular.one-styles-file', 'angular.side-effects-false',
  'bun.no-js-apart', 'bun.one-css', 'bun.outdir-kept', 'bun.sprite-not-copied',
  'esbuild.no-js-apart', 'esbuild.one-css', 'esbuild.ng-dev-mode',
  'next.js-apart', 'next.sheet-apart', 'next.sprite-public',
];
// Every half's part, and the part of each bundler no half holds now (an entry the run left out) from the history of the repository.
const own = await Promise.all(ownHalves().map((dir) => partOf(dir)));
const present = new Set(own.map((part) => part.bundler));
const old: (Awaited<ReturnType<typeof partFromHistory>>)[] = [];
for (const [id, layers] of [['vite7', ['react', 'angular']], ['vite8', ['react', 'angular']], ['rollup', ['react', 'angular']], ['rolldown', ['react', 'angular']], ['webpack', ['react', 'angular']], ['rspack', ['react', 'angular']], ['parcel', ['react', 'angular']], ['next', ['react']], ['angular', ['angular']]] as [BundlerId, Layer[]][]) {
  if (present.has(id)) continue;
  for (const layer of layers) old.push(await partFromHistory(id, layer));
}
const halves = [...own, ...old.filter((part) => part !== null)].flatMap((part) => part.observations);
const parts = (['react', 'angular'] as const).flatMap((layer) => [...bunPart(layer).observations, ...esbuildPart(layer).observations]);
const moved = [...halves, ...parts].filter((o, at, all) => all.findIndex((p) => p.id === o.id) === at);

const one = (id: string): Observation => moved.find((o) => o.id === id)!;

/** The rollup rows are the etsy halves' (`measure.ts`); the factories they are made with are the kit's. */
const rollupJs = jsRow('rollup', 'x');

/** An output directory holding `files`, as a `Built`. */
function output(files: Record<string, string>, ok = true, log = ''): Built {
  const root = mkdtempSync(join(tmpdir(), 'obs-'));
  roots.push(root);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), text);
  }
  return { ok, out: root, log };
}

const ctx = (runs: Context['runs'], dir = '.'): Context => ({ dir, layer: 'react', packageSelector: '.arena-pkg', appSelector: '.app-own', runs });

const ARENA = 'x({"data-arena-part":1});';
const APP = "globalThis.__appMarker='a';";
const PKG = '.arena-pkg{color:red}';
const APPCSS = '.app-own{color:blue}';

test('the ids are the rows of F6 and F6b, each prefixed by its bundler and a dot: the halves hold the rows of their bundlers, the parts those of bun and esbuild', () => {
  expect(moved.map((o) => o.id).sort()).toEqual([...ROWS].sort());
  for (const o of moved) expect(o.id.startsWith(`${o.bundler}.`)).toBe(true);
  expect(moved.filter((o) => o.expect === 'record').map((o) => o.id).sort()).toEqual(
    ['next.js-apart', 'next.sheet-apart', 'next.sprite-public', 'webpack.group-needs-type', 'rspack.css-auto-angular', 'rolldown.linked-sheets', 'rollup.linked-sheets'].sort(),
  );
});

test('the js-apart check holds when arena-*.js keeps its bytes, and fails when the app change moves it', () => {
  const plain = output({ 'arena-AAAA1111.js': ARENA, 'index-BBBB2222.js': APP });
  const same = output({ 'arena-AAAA1111.js': ARENA, 'index-CCCC3333.js': APP + ' ' });
  const moved = output({ 'arena-ZZZZ9999.js': ARENA + ' ', 'index-CCCC3333.js': APP });
  const o = rollupJs;
  expect(judge(o, ctx({ recipe: plain, 'app-text': same })).holds).toBe(true);
  expect(judge(o, ctx({ recipe: plain, 'app-text': moved })).holds).toBe(false);
});

test('vite7.js-apart reads js-recipe and js-recipe:app-text (R7-1)', () => {
  const a = output({ 'assets/arena-AAAA1111.js': ARENA });
  const b = output({ 'assets/arena-AAAA1111.js': ARENA });
  const o = one('vite7.js-apart');
  expect(o.needs).toEqual(['js-recipe', 'js-recipe:app-text']);
  expect(judge(o, ctx({ 'js-recipe': a, 'js-recipe:app-text': b })).holds).toBe(true);
  expect(judge(o, ctx({ recipe: a, 'app-text': b })).detail).toContain("run 'js-recipe' is missing");
});

test('parcel.js-apart finds Arena by content, whatever the stem', () => {
  const a = output({ 'bundler.parcel-AAAA1111.js': ARENA, 'index-BBBB2222.js': APP });
  const b = output({ 'bundler.parcel-AAAA1111.js': ARENA, 'index-CCCC3333.js': APP + ' ' });
  expect(judge(one('parcel.js-apart'), ctx({ recipe: a, 'app-text': b })).holds).toBe(true);
  expect(judge(rollupJs, ctx({ recipe: a, 'app-text': b })).holds).toBe(false);
});

test('vite7.sheet-apart holds on a sheet of its own that survives both app changes, fails when the sheet moves', () => {
  const recipe = output({ 'pkg-AAAA1111.css': PKG, 'app-BBBB2222.css': APPCSS });
  const kept = output({ 'pkg-AAAA1111.css': PKG, 'app-CCCC3333.css': APPCSS + ' ' });
  const merged = output({ 'one-DDDD4444.css': PKG + APPCSS });
  const o = one('vite7.sheet-apart');
  expect(judge(o, ctx({ recipe, 'app-text': kept, 'app-sheet': kept })).holds).toBe(true);
  expect(judge(o, ctx({ recipe: merged, 'app-text': kept, 'app-sheet': kept })).holds).toBe(false);
  expect(judge(o, ctx({ recipe, 'app-text': kept, 'app-sheet': merged })).holds).toBe(false);
});

test('webpack.one-css-without counts the css of plain', () => {
  const o = one('webpack.one-css-without');
  expect(judge(o, ctx({ plain: output({ 'main.css': PKG }) })).holds).toBe(true);
  expect(judge(o, ctx({ plain: output({ 'a.css': PKG, 'b.css': APPCSS }) })).holds).toBe(false);
});

test('rolldown.css-refused holds on a failed probe whose output carries the message', () => {
  const o = one('rolldown.css-refused');
  expect(judge(o, ctx({ 'css-import': output({}, false, '[UNSUPPORTED_FEATURE] Bundling CSS is no longer supported (experimental support has been removed). See x') })).holds).toBe(true);
  expect(judge(o, ctx({ 'css-import': output({}, false, 'Error: other') })).holds).toBe(false);
  expect(judge(o, ctx({ 'css-import': output({}, true, '') })).holds).toBe(false);
});

test('bun.outdir-kept holds on two entry files after the twice probe', () => {
  const o = one('bun.outdir-kept');
  expect(judge(o, ctx({ twice: output({ 'a.js': APP, 'b.js': APP.replace("'a'", "'b'") }) })).holds).toBe(true);
  expect(judge(o, ctx({ twice: output({ 'b.js': APP }) })).holds).toBe(false);
});

test('parcel.shared-stem holds on two shared bundles of one stem and not on two stems', () => {
  const o = one('parcel.shared-stem');
  const same = output({ 'index-AAAA1111.js': APP, 'bundler.parcel-BBBB2222.js': ARENA, 'bundler.parcel-CCCC3333.js': 'x' });
  const apart = output({ 'index-AAAA1111.js': APP, 'bundler.parcel-BBBB2222.js': ARENA, 'other.parcel-CCCC3333.js': 'x' });
  expect(judge(o, ctx({ recipe: same })).holds).toBe(true);
  expect(judge(o, ctx({ recipe: apart })).holds).toBe(false);
});

test('the sprite-not-copied check fails when the recipe output holds a sprite', () => {
  const o = noSprite_('rollup', 'x');
  expect(judge(o, ctx({ recipe: output({ 'index.js': APP }) })).holds).toBe(true);
  expect(judge(o, ctx({ recipe: output({ 'index.js': APP, 'icons-abc123.svg': '<svg/>' }) })).holds).toBe(false);
});

test('the sprite-at-root check holds when the root of the recipe output holds a sprite and fails for one in a folder or none', () => {
  const o = spriteAtRoot_('webpack', 'x');
  expect(judge(o, ctx({ recipe: output({ 'icons-abc123.svg': '<svg/>' }) })).holds).toBe(true);
  expect(judge(o, ctx({ recipe: output({ 'img/icons-abc123.svg': '<svg/>' }) })).holds).toBe(false);
  expect(judge(o, ctx({ recipe: output({ 'index.js': APP }) })).holds).toBe(false);
});

test('a record row never contradicts and says its outcome', () => {
  const o = one('next.sprite-public');
  const yes = judge(o, ctx({ recipe: output({ 'icons-abc123.svg': '<svg/>' }) }));
  const no = judge(o, ctx({ recipe: output({ 'index.html': '' }) }));
  expect([yes.outcome, yes.holds, no.outcome, no.holds]).toEqual([true, true, false, true]);
  expect(yes.detail).toContain('yes');
  expect(no.detail).toBe('no');
});

test('the linked-sheets rows record whether the package sheet is flat, with no @import of a package specifier', () => {
  const dir = mkdtempSync(join(tmpdir(), 'obs-dir-'));
  roots.push(dir);
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src', 'arena.package.generated.css'), "/* GENERATED */\n@import '@dravensoft/arena-react/css/reset.css';\n");
  const result = judge(one('rolldown.linked-sheets'), ctx({}, dir));
  expect(result.outcome).toBe(false);
  expect(result.holds).toBe(true);
  writeFileSync(join(dir, 'src', 'arena.package.generated.css'), "@import './reset.css';\n");
  expect(judge(one('rolldown.linked-sheets'), ctx({}, dir)).outcome).toBe(true);
});

test('a missing run, an unreadable output and a throwing check are failed outcomes with the message, never a crash', () => {
  const o = one('bun.one-css');
  const missing = judge(o, ctx({}));
  expect([missing.outcome, missing.holds]).toEqual([false, false]);
  expect(missing.detail).toContain("'recipe'");
  const gone = judge(o, ctx({ recipe: { ok: true, out: join(tmpdir(), 'obs-does-not-exist'), log: '' } }));
  expect(gone.holds).toBe(false);
  expect(gone.detail.length).toBeGreaterThan(0);
  const boom: Observation = { ...o, check: () => { throw new Error('boom'); } };
  expect(judge(boom, ctx({}))).toMatchObject({ outcome: false, holds: false, detail: 'boom' });
  const record: Observation = { ...boom, expect: 'record' };
  expect(judge(record, ctx({}))).toMatchObject({ outcome: false, holds: true, detail: 'boom' });
});

test('a failed build is not read as a pass for a claim about its output', () => {
  const judged = judge(one('vite7.sheet-by-name'), ctx({ 'js-only-test': output({}, false, 'Error: x') }));
  expect(judged.holds).toBe(false);
  expect(judged.detail).toContain("'js-only-test' did not build");
});

test('js-apart fails when the file holding Arena also holds the app, even unchanged between runs', () => {
  const both = () => output({ 'arena-AAAA1111.js': ARENA + APP });
  expect(judge(rollupJs, ctx({ recipe: both(), 'app-text': both() })).holds).toBe(false);
  const parcel = () => output({ 'bundler.parcel-AAAA1111.js': ARENA + APP });
  expect(judge(one('parcel.js-apart'), ctx({ recipe: parcel(), 'app-text': parcel() })).holds).toBe(false);
});

test('parcel.react-with-app finds React DOM by the marker of React 18.3.1 and of React 19', () => {
  const o = one('parcel.react-with-app');
  const with18 = output({ 'a.js': `x.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;${APP}` });
  const apart19 = output({ 'a.js': 'x.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;', 'b.js': APP });
  const none = output({ 'a.js': APP });
  expect(judge(o, ctx({ recipe: with18 })).holds).toBe(true);
  expect(judge(o, ctx({ recipe: apart19 })).holds).toBe(false);
  expect(judge(o, ctx({ recipe: none })).detail).toContain('no .js holds React DOM');
});

test('webpack.group-needs-type records where the sheet goes and never contradicts', () => {
  const o = one('webpack.group-needs-type');
  expect(o.expect).toBe('record');
  expect(o.claim).toBe('without `type`, where the sheet goes');
  const alone = judge(o, ctx({ 'untyped-group': output({ 'a.css': PKG, 'b.css': APPCSS }) }));
  const merged = judge(o, ctx({ 'untyped-group': output({ 'a.css': PKG + APPCSS }) }));
  const failed = judge(o, ctx({ 'untyped-group': output({}, false, 'Error: x') }));
  expect([alone.outcome, merged.outcome, failed.outcome]).toEqual([true, false, false]);
  expect([alone.holds, merged.holds, failed.holds]).toEqual([true, true, true]);
  expect(alone.detail).toContain('a.css');
  expect(failed.detail).toContain('did not build');
});

test('the parcel probe reads Angular as a failure to build and React as a build (D10)', () => {
  const needs = one('parcel.needs-package-exports');
  const first = one('parcel.first-import-resolves');
  expect(needs.layers).toEqual(['angular']);
  expect(first.layers).toEqual(['react']);
  expect(judge(needs, ctx({ 'no-package-exports': output({}, false, "Failed to resolve '@angular/common/http'") })).holds).toBe(true);
  expect(judge(needs, ctx({ 'no-package-exports': output({}, false, 'Error: other') })).holds).toBe(false);
  expect(judge(needs, ctx({ 'no-package-exports': output({}) })).holds).toBe(false);
  expect(judge(first, ctx({ 'no-package-exports': output({}) })).holds).toBe(true);
  expect(judge(first, ctx({ 'no-package-exports': output({}, false, 'Failed to resolve') })).holds).toBe(false);
});

test('the five sheet-apart rows say the sheet is apart on both layers', () => {
  for (const id of ['vite7', 'vite8', 'webpack', 'rspack', 'parcel']) {
    expect(one(`${id}.sheet-apart`).claim).toContain('the package sheet sits in a CSS file of its own on both layers, which keeps its bytes and name when the app changes');
  }
  expect(one('rspack.sheet-apart').claim).toContain('with the `css/auto` rule and, on Angular, the sheet as its own `styles` entry');
});

test('rspack.needs-css-auto holds on React when the probe stops on `@layer properties`, and css-auto-angular records the sheet (D14)', () => {
  const o = one('rspack.needs-css-auto');
  expect(o.layers).toEqual(['react']);
  expect(judge(o, ctx({ 'no-css-auto': output({}, false, 'parse error\n @layer properties;') })).holds).toBe(true);
  expect(judge(o, ctx({ 'no-css-auto': output({}, false, 'Error: other') })).holds).toBe(false);
  expect(judge(o, ctx({ 'no-css-auto': output({ 'a.css': PKG }) })).holds).toBe(false);
  const a = one('rspack.css-auto-angular');
  expect([a.layers, a.expect]).toEqual([['angular'], 'record']);
  const yes = judge(a, ctx({ 'no-css-auto': output({ 'arena-sheet.css': PKG, 'styles.css': APPCSS }) }));
  expect([yes.outcome, yes.holds]).toEqual([true, true]);
});

test('rollup.no-css holds only when rollup stops on the CSS it cannot import, and the extension-alias rows only on the resolve error of the icon list', () => {
  const css = one('rollup.no-css');
  expect(judge(css, ctx({ 'css-import': output({}, false, 'Note that you need plugins to import files that are not JavaScript') })).holds).toBe(true);
  expect(judge(css, ctx({ 'css-import': output({}, false, 'Error: other') })).holds).toBe(false);
  for (const id of ['webpack.extension-alias', 'rspack.extension-alias']) {
    const o = one(id);
    expect(o.layers).toEqual(['angular']);
    expect(judge(o, ctx({ 'no-extension-alias': output({}, false, "Can't resolve './arena.icons.generated.js'") })).holds).toBe(true);
    expect(judge(o, ctx({ 'no-extension-alias': output({}, false, 'Error: other') })).holds).toBe(false);
    expect(judge(o, ctx({ 'no-extension-alias': output({}) })).holds).toBe(false);
  }
});
