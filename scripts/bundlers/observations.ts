/* The observation catalogue: every claim the bundler pages make, as a check over built outputs (F6, F6b). A `holds`
 * row that fails is a contradiction; a `record` row records its outcome and can contradict nothing. A check that
 * cannot read what it needs throws, and `judge` turns the throw into a failed outcome carrying the message. */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { loaded, stem } from './weigh.ts';
import type { BundlerId, Layer, Probe } from './types.ts';

export type Built = { ok: boolean; out: string; log: string };

export type RunKey = 'plain' | 'recipe' | 'app-text' | 'app-sheet' | 'arena-patch' | Probe | 'js-recipe:app-text';

export type Context = {
  dir: string;
  layer: Layer;
  /** The first selector of the package sheet, and of the app sheet, as the sheets write them. */
  packageSelector: string;
  appSelector: string;
  runs: Partial<Record<RunKey, Built>>;
};

export type Verdict = { outcome: boolean; detail: string };

export type Observation = {
  id: string;
  bundler: BundlerId;
  layers: Layer[];
  claim: string;
  expect: 'holds' | 'record';
  /** Exactly the runs the check reads. */
  needs: RunKey[];
  check(ctx: Context): Verdict;
};

// ---------------------------------------------------------------------------------------------- what a file holds

const strip = (text: string): string => text.replace(/\s+/g, '');

/** `selector` as the start of a rule (or of a selector list) in whitespace-stripped CSS, not a word inside a value. */
const startsRule = (selector: string): RegExp =>
  new RegExp(`(^|[{},;/])${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[{,]`);

/** Arena's modules: the patch target's marker (F7) or the string `data-arena-part`. */
export const holdsArena = (text: string, _ctx: Context): boolean => text.includes('__arenaPatch') || text.includes('data-arena-part');

/** The app's code: the marker `scratch()` appends to the entry of every scratch copy. */
export const holdsApp = (text: string, _ctx: Context): boolean => text.includes('__appMarker');

export const holdsPackageSheet = (text: string, ctx: Context): boolean => startsRule(ctx.packageSelector).test(strip(text));

export const holdsAppSheet = (text: string, ctx: Context): boolean => startsRule(ctx.appSelector).test(strip(text));

/** A code of React DOM that survives minification. */
const holdsReactDom = (text: string): boolean => text.includes('__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE');

// ------------------------------------------------------------------------------------------------- reading runs

type File = { rel: string; name: string; text: string; bytes: Buffer };

/** The run `key`, or a throw naming it: a check never passes over a run it did not get. */
function run(ctx: Context, key: RunKey): Built {
  const built = ctx.runs[key];
  if (!built) throw new Error(`run '${key}' is missing from the context`);
  return built;
}

/** The run `key` when it built; a throw (with the log's tail) when it did not. */
function built(ctx: Context, key: RunKey): Built {
  const one = run(ctx, key);
  if (!one.ok) throw new Error(`run '${key}' did not build: ${one.log.trim().split('\n').slice(-3).join(' | ')}`);
  return one;
}

function files(out: string, ext: '.js' | '.css'): File[] {
  return loaded(out, ext).map((rel) => {
    const bytes = readFileSync(join(out, rel));
    return { rel, name: basename(rel), text: bytes.toString('utf8'), bytes };
  });
}

/** Every file under `out`, relative, `/`-separated. */
function everyFile(out: string): string[] {
  return readdirSync(out, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(out.length + 1).split('\\').join('/'));
}

/** `rel` is in `out` with the same bytes. */
const keeps = (out: string, file: File): boolean => {
  const at = join(out, file.rel);
  return existsSync(at) && readFileSync(at).equals(file.bytes);
};

const pass = (outcome: boolean, detail: string): Verdict => ({ outcome, detail });
const list = (names: string[]): string => (names.length ? names.join(', ') : 'none');

// ----------------------------------------------------------------------------------------------------- checks

/**
 * "Arena's JS sits in a chunk of its own": `from` emits a `.js` holding Arena's modules (named `arena-…` when
 * `byName`), and the same file, by name and bytes, is in `after`, the build with the app's text changed. Parcel names
 * its shared bundles after its stage directory, so it is found by content alone.
 */
function jsApart(from: RunKey, after: RunKey, byName: boolean): (ctx: Context) => Verdict {
  return (ctx) => {
    const first = built(ctx, from);
    const second = built(ctx, after);
    const found = files(first.out, '.js').filter((f) => holdsArena(f.text, ctx) && (!byName || f.name.startsWith('arena-')));
    if (found.length === 0) return pass(false, `no .js${byName ? ' named arena-…' : ''} holds Arena's modules in '${from}'`);
    const kept = found.filter((f) => keeps(second.out, f));
    return pass(kept.length > 0, kept.length > 0
      ? `${list(kept.map((f) => f.rel))} holds Arena's modules and keeps its name and bytes in '${after}'`
      : `${list(found.map((f) => f.rel))} holds Arena's modules but changes name or bytes in '${after}'`);
  };
}

/** The `.css` files of `out` holding the package sheet's rules and none of the app's. */
const sheetAlone = (out: string, ctx: Context): File[] =>
  files(out, '.css').filter((f) => holdsPackageSheet(f.text, ctx) && !holdsAppSheet(f.text, ctx));

function sheetApart(ctx: Context): Verdict {
  const first = built(ctx, 'recipe');
  const found = sheetAlone(first.out, ctx);
  if (found.length === 0) return pass(false, `no .css of 'recipe' holds the package sheet's rules without app.css`);
  const outs = (['app-text', 'app-sheet'] as const).map((key) => [key, built(ctx, key).out] as const);
  const kept = found.filter((f) => outs.every(([, out]) => keeps(out, f)));
  return pass(kept.length > 0, kept.length > 0
    ? `${list(kept.map((f) => f.rel))} holds the package sheet alone and keeps its name and bytes in app-text and app-sheet`
    : `${list(found.map((f) => f.rel))} holds the package sheet alone but changes name or bytes in app-text or app-sheet`);
}

/** "no `.css` holds the package sheet alone" in the run `key`. */
function noSheetAlone(key: RunKey): (ctx: Context) => Verdict {
  return (ctx) => {
    const found = sheetAlone(built(ctx, key).out, ctx);
    return pass(found.length === 0, `'${key}': .css holding the package sheet alone: ${list(found.map((f) => f.rel))}`);
  };
}

/** The run `key` exits non-zero. */
function fails(key: RunKey, text?: string): (ctx: Context) => Verdict {
  return (ctx) => {
    const one = run(ctx, key);
    if (one.ok) return pass(false, `'${key}' built`);
    if (text !== undefined && !one.log.includes(text)) return pass(false, `'${key}' failed without "${text}" in its output`);
    return pass(true, `'${key}' exits non-zero${text !== undefined ? ` with "${text}"` : ''}`);
  };
}

function noSprite(ctx: Context): Verdict {
  const sprites = everyFile(built(ctx, 'recipe').out).filter((f) => /(^|\/)icons-[^/]*\.svg$/.test(f));
  return pass(sprites.length === 0, `icons-*.svg in 'recipe': ${list(sprites)}`);
}

function oneCss(key: RunKey): (ctx: Context) => Verdict {
  return (ctx) => {
    const css = loaded(built(ctx, key).out, '.css');
    return pass(css.length === 1, `.css in '${key}': ${list(css)}`);
  };
}

/** The `.js` files holding Arena's modules in `recipe` all hold the app's code too, and there is one. */
function arenaWithApp(ctx: Context): Verdict {
  const arena = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsArena(f.text, ctx));
  if (arena.length === 0) return pass(false, `no .js holds Arena's modules in 'recipe'`);
  const apart = arena.filter((f) => !holdsApp(f.text, ctx));
  return pass(apart.length === 0, apart.length === 0
    ? `${list(arena.map((f) => f.rel))} holds Arena's modules and the app's code`
    : `${list(apart.map((f) => f.rel))} holds Arena's modules without the app's code`);
}

/** Record whether some `.js` of `recipe` holds Arena's modules and none of the app's. */
function recordJsApart(ctx: Context): Verdict {
  const apart = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsArena(f.text, ctx) && !holdsApp(f.text, ctx));
  return pass(apart.length > 0, apart.length > 0 ? `yes: ${list(apart.map((f) => f.rel))}` : 'no');
}

function recordSheetApart(ctx: Context): Verdict {
  const alone = sheetAlone(built(ctx, 'recipe').out, ctx);
  return pass(alone.length > 0, alone.length > 0 ? `yes: ${list(alone.map((f) => f.rel))}` : 'no');
}

function recordSprite(ctx: Context): Verdict {
  const sprites = everyFile(built(ctx, 'recipe').out).filter((f) => /(^|\/)icons-[^/]*\.svg$/.test(f));
  return pass(sprites.length > 0, sprites.length > 0 ? `yes: ${list(sprites)}` : 'no');
}

const PACKAGE_IMPORT = /^@import\s+(?:'([^']+)'|"([^"]+)");/gm;

/** F6b: the package sheet as written holds an `@import` of a package specifier, which no browser resolves. */
function linkedSheets(ctx: Context): Verdict {
  const text = readFileSync(join(ctx.dir, 'src', 'arena.package.generated.css'), 'utf8');
  const specs = [...text.matchAll(PACKAGE_IMPORT)].map((m) => m[1] ?? m[2]!).filter((s) => !/^(\.{1,2}\/|\/|[a-z]+:)/i.test(s));
  return pass(specs.length > 0, specs.length > 0
    ? `the package sheet as written holds ${specs.length} @import of a package specifier (first: ${specs[0]}); the page serves it only after linkSheets inlined them`
    : 'the package sheet as written holds no @import of a package specifier');
}

function arenaInMain(ctx: Context): Verdict {
  const arena = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsArena(f.text, ctx));
  const main = arena.filter((f) => f.name.startsWith('main-'));
  const alone = arena.filter((f) => !holdsApp(f.text, ctx));
  return pass(main.length === 1 && alone.length === 0,
    `main-*.js holding Arena's modules: ${list(main.map((f) => f.rel))}; .js holding them alone: ${list(alone.map((f) => f.rel))}`);
}

function oneStylesFile(ctx: Context): Verdict {
  const css = files(built(ctx, 'recipe').out, '.css');
  const holding = css.filter((f) => holdsPackageSheet(f.text, ctx));
  return pass(css.length === 1 && holding.length === 1, `.css in 'recipe': ${list(css.map((f) => f.rel))}; holding the package sheet's rules: ${holding.length}`);
}

function sideEffectsFalse(ctx: Context): Verdict {
  const path = join(ctx.dir, 'node_modules', '@dravensoft', `arena-${ctx.layer}`, 'package.json');
  const value = (JSON.parse(readFileSync(path, 'utf8')) as { sideEffects?: unknown }).sideEffects;
  return pass(value === false, `sideEffects is ${JSON.stringify(value)} in ${path}`);
}

function outdirKept(ctx: Context): Verdict {
  const entries = files(built(ctx, 'twice').out, '.js').filter((f) => holdsApp(f.text, ctx));
  return pass(entries.length === 2, `entry .js files after 'recipe' then 'app-text' into one outdir: ${list(entries.map((f) => f.rel))}`);
}

/** The entry bundle of a run: the largest `.js` holding the app's code. */
function entryBytes(ctx: Context, key: RunKey): number {
  const sizes = files(built(ctx, key).out, '.js').filter((f) => holdsApp(f.text, ctx)).map((f) => f.bytes.length);
  if (sizes.length === 0) throw new Error(`no .js holds the app's code in '${key}'`);
  return Math.max(...sizes);
}

function ngDevMode(ctx: Context): Verdict {
  const without = entryBytes(ctx, 'no-define');
  const recipe = entryBytes(ctx, 'recipe');
  return pass(without > recipe, `main .js: ${without} bytes in 'no-define', ${recipe} bytes in 'recipe'`);
}

function reactWithApp(ctx: Context): Verdict {
  const dom = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsReactDom(f.text));
  if (dom.length === 0) return pass(false, `no .js holds React DOM's code in 'recipe'`);
  const apart = dom.filter((f) => !holdsApp(f.text, ctx));
  return pass(apart.length === 0, apart.length === 0
    ? `${list(dom.map((f) => f.rel))} holds React DOM's code and the app's`
    : `${list(apart.map((f) => f.rel))} holds React DOM's code without the app's`);
}

/** Two shared bundles (every `.js` but the entry's `index-…`) share a stem. */
function sharedStem(ctx: Context): Verdict {
  const shared = loaded(built(ctx, 'recipe').out, '.js').filter((rel) => stem(basename(rel)) !== 'index');
  const stems = new Map<string, string[]>();
  for (const rel of shared) stems.set(stem(basename(rel)), [...(stems.get(stem(basename(rel))) ?? []), rel]);
  const same = [...stems.values()].find((group) => group.length >= 2);
  return pass(same !== undefined, same
    ? `${list(same)} share the stem '${stem(basename(same[0]!))}'`
    : `shared .js files: ${list(shared)}; stems: ${list([...stems.keys()])}`);
}

// ------------------------------------------------------------------------------------------------- the rows

const RA: Layer[] = ['react', 'angular'];

type Row = Omit<Observation, 'expect' | 'layers'> & { layers?: Layer[]; expect?: Observation['expect'] };

const row = (r: Row): Observation => ({ layers: RA, expect: 'holds', ...r });

const JS_CLAIM = (option: string) => `Arena's JS sits in a chunk of its own with ${option}`;
const SHEET_APART = 'as `vite7.sheet-apart`';

/** The runs a `*.js-apart` row reads: Vite 7, Vite 8, webpack and rspack give a JS-only config (R7-1). */
const jsRuns = (b: BundlerId): { from: RunKey; after: RunKey } =>
  ['vite7', 'vite8', 'webpack', 'rspack'].includes(b) ? { from: 'js-recipe', after: 'js-recipe:app-text' } : { from: 'recipe', after: 'app-text' };

function jsRow(bundler: BundlerId, claim: string, byName = true): Observation {
  const { from, after } = jsRuns(bundler);
  return row({ id: `${bundler}.js-apart`, bundler, claim, needs: [from, after], check: jsApart(from, after, byName) });
}

const sheetRow = (bundler: BundlerId, claim: string): Observation =>
  row({ id: `${bundler}.sheet-apart`, bundler, claim, needs: ['recipe', 'app-text', 'app-sheet'], check: sheetApart });

const noSprite_ = (bundler: BundlerId, claim: string): Observation =>
  row({ id: `${bundler}.sprite-not-copied`, bundler, claim, needs: ['recipe'], check: noSprite });

export const OBSERVATIONS: Observation[] = [
  jsRow('rollup', JS_CLAIM('`manualChunks`')),
  row({ id: 'rollup.no-css', bundler: 'rollup', claim: 'rollup imports no CSS by itself', needs: ['css-import'], check: fails('css-import') }),
  noSprite_('rollup', 'rollup moves no file it does not import'),

  jsRow('vite7', JS_CLAIM('`manualChunks`')),
  sheetRow('vite7', 'the package sheet sits in a CSS file of its own, which keeps its bytes and name when the app changes'),
  row({ id: 'vite7.sheet-by-name', bundler: 'vite7', claim: 'a test matching only `node_modules` leaves the sheet with the app\'s CSS', needs: ['js-only-test'], check: noSheetAlone('js-only-test') }),

  jsRow('vite8', JS_CLAIM('`codeSplitting.groups`')),
  sheetRow('vite8', SHEET_APART),
  row({ id: 'vite8.sheet-by-name', bundler: 'vite8', claim: 'as `vite7.sheet-by-name`', needs: ['js-only-test'], check: noSheetAlone('js-only-test') }),

  jsRow('rolldown', JS_CLAIM('`codeSplitting.groups`')),
  row({ id: 'rolldown.css-refused', bundler: 'rolldown', claim: 'the build stops on a CSS import with "bundling CSS is not supported"', needs: ['css-import'], check: fails('css-import', 'bundling CSS is not supported') }),
  noSprite_('rolldown', 'rolldown moves no file it does not import'),

  jsRow('webpack', JS_CLAIM('`splitChunks.cacheGroups`')),
  sheetRow('webpack', 'with `experiments: { css: true }` and the typed `arena` group, the package sheet sits in a file of its own that keeps its bytes and name'),
  row({ id: 'webpack.one-css-without', bundler: 'webpack', claim: 'without the sheet config, one CSS file for the entry', needs: ['plain'], check: oneCss('plain') }),
  row({ id: 'webpack.group-needs-type', bundler: 'webpack', claim: 'without `type`, the sheet stays with the app\'s CSS', needs: ['untyped-group'], check: noSheetAlone('untyped-group') }),

  jsRow('rspack', 'the webpack recipe keeps Arena\'s JS apart, unchanged'),
  sheetRow('rspack', 'with the webpack config and a `css/auto` rule, the package sheet sits in a file of its own'),
  row({
    id: 'rspack.needs-css-auto', bundler: 'rspack', claim: 'without the `css/auto` rule the sheet is not in a file of its own', needs: ['no-css-auto'],
    check: (ctx) => {
      const one = run(ctx, 'no-css-auto');
      return one.ok ? noSheetAlone('no-css-auto')(ctx) : pass(true, `'no-css-auto' exits non-zero`);
    },
  }),

  row({ id: 'parcel.needs-package-exports', bundler: 'parcel', claim: 'the first Arena import fails without `packageExports: true`', needs: ['no-package-exports'], check: fails('no-package-exports') }),
  jsRow('parcel', '`manualSharedBundles` keeps Arena\'s JS apart once `packageExports` is on', false),
  row({ id: 'parcel.sheet-stops', bundler: 'parcel', claim: 'the build stops on the package sheet\'s first `@import`', needs: ['css-import'], check: fails('css-import') }),
  row({ id: 'parcel.react-with-app', bundler: 'parcel', layers: ['react'], claim: 'React stays with the app', needs: ['recipe'], check: reactWithApp }),
  row({ id: 'parcel.shared-stem', bundler: 'parcel', claim: 'its two shared bundles share one name stem', needs: ['recipe'], check: sharedStem }),

  row({ id: 'angular.arena-in-main', bundler: 'angular', layers: ['angular'], claim: 'Arena lands in `main`', needs: ['recipe'], check: arenaInMain }),
  row({ id: 'angular.one-styles-file', bundler: 'angular', layers: ['angular'], claim: 'the `styles` option emits one file', needs: ['recipe'], check: oneStylesFile }),
  row({ id: 'angular.side-effects-false', bundler: 'angular', layers: ['angular'], claim: 'the Angular package declares `"sideEffects": false`', needs: [], check: sideEffectsFalse }),

  row({ id: 'bun.no-js-apart', bundler: 'bun', claim: 'no option keeps Arena in a file of its own', needs: ['recipe'], check: arenaWithApp }),
  row({ id: 'bun.one-css', bundler: 'bun', claim: 'one CSS file for the entry', needs: ['recipe'], check: oneCss('recipe') }),
  row({ id: 'bun.outdir-kept', bundler: 'bun', claim: '`bun build` does not empty its output directory', needs: ['twice'], check: outdirKept }),
  noSprite_('bun', 'no file the entry does not import reaches the output'),

  row({ id: 'esbuild.no-js-apart', bundler: 'esbuild', claim: 'splitting cannot pin a module to a chunk', needs: ['recipe'], check: arenaWithApp }),
  row({ id: 'esbuild.one-css', bundler: 'esbuild', claim: 'one CSS file for the entry, with splitting too', needs: ['recipe'], check: oneCss('recipe') }),
  row({ id: 'esbuild.ng-dev-mode', bundler: 'esbuild', layers: ['angular'], claim: 'an Angular bundle defines `ngDevMode` itself', needs: ['no-define', 'recipe'], check: ngDevMode }),

  row({ id: 'next.js-apart', bundler: 'next', layers: ['react'], claim: 'Next.js picks its chunks itself', expect: 'record', needs: ['recipe'], check: recordJsApart }),
  row({ id: 'next.sheet-apart', bundler: 'next', layers: ['react'], claim: 'not exercised', expect: 'record', needs: ['recipe'], check: recordSheetApart }),
  row({ id: 'next.sprite-public', bundler: 'next', layers: ['react'], claim: 'a sprite copied into `public/` is served at the root under its own name', expect: 'record', needs: ['recipe'], check: recordSprite }),

  row({ id: 'rollup.linked-sheets', bundler: 'rollup', claim: 'link the sheets `arena build` writes from your page', expect: 'record', needs: [], check: linkedSheets }),
  row({ id: 'rolldown.linked-sheets', bundler: 'rolldown', claim: 'as above', expect: 'record', needs: [], check: linkedSheets }),
  row({ id: 'parcel.linked-sheets', bundler: 'parcel', claim: 'as above', expect: 'record', needs: [], check: linkedSheets }),
];

export type Judgement = { id: string; claim: string; expect: Observation['expect']; outcome: boolean; holds: boolean; detail: string };

/** The verdict on one row: `holds` is the outcome for a `holds` row and true for a `record` row; a throw is a failed outcome. */
export function judge(o: Observation, ctx: Context): Judgement {
  let verdict: Verdict;
  try {
    verdict = o.check(ctx);
  } catch (error) {
    verdict = { outcome: false, detail: error instanceof Error ? error.message : String(error) };
  }
  return { id: o.id, claim: o.claim, expect: o.expect, outcome: verdict.outcome, holds: o.expect === 'record' ? true : verdict.outcome, detail: verdict.detail };
}
