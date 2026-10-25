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

/** A code of React DOM that survives minification: React 18.3.1 carries the first string, React 19 the second. */
const holdsReactDom = (text: string): boolean =>
  text.includes('__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED') || text.includes('__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE');

// ------------------------------------------------------------------------------------------------- reading runs

type File = { rel: string; name: string; text: string; bytes: Buffer };

/** The run `key`, or a throw naming it: a check never passes over a run it did not get. */
export function run(ctx: Context, key: RunKey): Built {
  const built = ctx.runs[key];
  if (!built) throw new Error(`run '${key}' is missing from the context`);
  return built;
}

/** The run `key` when it built; a throw (with the log's tail) when it did not. */
export function built(ctx: Context, key: RunKey): Built {
  const one = run(ctx, key);
  if (!one.ok) throw new Error(`run '${key}' did not build: ${one.log.trim().split('\n').slice(-3).join(' | ')}`);
  return one;
}

export function files(out: string, ext: '.js' | '.css'): File[] {
  return loaded(out, ext).map((rel) => {
    const bytes = readFileSync(join(out, rel));
    return { rel, name: basename(rel), text: bytes.toString('utf8'), bytes };
  });
}

/** Every file under `out`, relative, `/`-separated. */
export function everyFile(out: string): string[] {
  return readdirSync(out, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(out.length + 1).split('\\').join('/'));
}

/** `rel` is in `out` with the same bytes. */
export const keeps = (out: string, file: File): boolean => {
  const at = join(out, file.rel);
  return existsSync(at) && readFileSync(at).equals(file.bytes);
};

export const pass = (outcome: boolean, detail: string): Verdict => ({ outcome, detail });
export const list = (names: string[]): string => (names.length ? names.join(', ') : 'none');

// ----------------------------------------------------------------------------------------------------- checks

/**
 * "Arena's JS sits in a chunk of its own": `from` emits a `.js` holding Arena's modules (named `arena-…` when
 * `byName`), and the same file, by name and bytes, is in `after`, the build with the app's text changed. Parcel names
 * its shared bundles after its stage directory, so it is found by content alone.
 */
export function jsApart(from: RunKey, after: RunKey, byName: boolean): (ctx: Context) => Verdict {
  return (ctx) => {
    const first = built(ctx, from);
    const second = built(ctx, after);
    const found = files(first.out, '.js').filter((f) => holdsArena(f.text, ctx) && !holdsApp(f.text, ctx) && (!byName || f.name.startsWith('arena-')));
    if (found.length === 0) return pass(false, `no .js${byName ? ' named arena-…' : ''} holds Arena's modules without the app's code in '${from}'`);
    const kept = found.filter((f) => keeps(second.out, f));
    return pass(kept.length > 0, kept.length > 0
      ? `${list(kept.map((f) => f.rel))} holds Arena's modules and keeps its name and bytes in '${after}'`
      : `${list(found.map((f) => f.rel))} holds Arena's modules but changes name or bytes in '${after}'`);
  };
}

/** The `.css` files of `out` holding the package sheet's rules and none of the app's. */
export const sheetAlone = (out: string, ctx: Context): File[] =>
  files(out, '.css').filter((f) => holdsPackageSheet(f.text, ctx) && !holdsAppSheet(f.text, ctx));

export function sheetApart(ctx: Context): Verdict {
  const first = built(ctx, 'recipe');
  const found = sheetAlone(first.out, ctx);
  if (found.length === 0) return pass(false, `no .css of 'recipe' holds the package sheet's rules without app.css`);
  const outs = (['app-text', 'app-sheet'] as const).map((key) => [key, built(ctx, key).out] as const);
  const kept = found.filter((f) => outs.every(([, out]) => keeps(out, f)));
  return pass(kept.length > 0, kept.length > 0
    ? `${list(kept.map((f) => f.rel))} holds the package sheet alone and keeps its name and bytes in app-text and app-sheet`
    : `${list(found.map((f) => f.rel))} holds the package sheet alone but changes name or bytes in app-text or app-sheet`);
}

/**
 * "no `.css` holds the package sheet alone" in the run `key`. A probe that does not build throws (strict on purpose):
 * a build that fails measures nothing about where the sheet goes, so it surfaces as a contradiction with its detail.
 */
export function noSheetAlone(key: RunKey): (ctx: Context) => Verdict {
  return (ctx) => {
    const found = sheetAlone(built(ctx, key).out, ctx);
    return pass(found.length === 0, `'${key}': .css holding the package sheet alone: ${list(found.map((f) => f.rel))}`);
  };
}

/** The run `key` exits non-zero. */
export function fails(key: RunKey, text?: string): (ctx: Context) => Verdict {
  return (ctx) => {
    const one = run(ctx, key);
    if (one.ok) return pass(false, `'${key}' built`);
    if (text !== undefined && !one.log.includes(text)) return pass(false, `'${key}' failed without "${text}" in its output`);
    return pass(true, `'${key}' exits non-zero${text !== undefined ? ` with "${text}"` : ''}`);
  };
}

/** The run `key` builds. */
export function builds(key: RunKey): (ctx: Context) => Verdict {
  return (ctx) => {
    const one = run(ctx, key);
    return pass(one.ok, one.ok ? `'${key}' built` : `'${key}' failed: ${one.log.trim().split('\n').slice(-3).join(' | ')}`);
  };
}

/** Record whether a `.css` of the run `key` holds the package sheet's rules without the app's; a probe that fails to build is recorded as that. */
export function recordSheetAlone(key: RunKey): (ctx: Context) => Verdict {
  return (ctx) => {
    const one = run(ctx, key);
    if (!one.ok) return pass(false, `'${key}' did not build: ${one.log.trim().split('\n').slice(-3).join(' | ')}`);
    const found = sheetAlone(one.out, ctx);
    return pass(found.length > 0, found.length > 0 ? `the package sheet is alone in ${list(found.map((f) => f.rel))}` : `no .css holds the package sheet without the app's rules: ${list(files(one.out, '.css').map((f) => f.rel))}`);
  };
}

export function noSprite(ctx: Context): Verdict {
  const sprites = everyFile(built(ctx, 'recipe').out).filter((f) => /(^|\/)icons-[^/]*\.svg$/.test(f));
  return pass(sprites.length === 0, `icons-*.svg in 'recipe': ${list(sprites)}`);
}

export function oneCss(key: RunKey): (ctx: Context) => Verdict {
  return (ctx) => {
    const css = loaded(built(ctx, key).out, '.css');
    return pass(css.length === 1, `.css in '${key}': ${list(css)}`);
  };
}

/** The `.js` files holding Arena's modules in `recipe` all hold the app's code too, and there is one. */
export function arenaWithApp(ctx: Context): Verdict {
  const arena = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsArena(f.text, ctx));
  if (arena.length === 0) return pass(false, `no .js holds Arena's modules in 'recipe'`);
  const apart = arena.filter((f) => !holdsApp(f.text, ctx));
  return pass(apart.length === 0, apart.length === 0
    ? `${list(arena.map((f) => f.rel))} holds Arena's modules and the app's code`
    : `${list(apart.map((f) => f.rel))} holds Arena's modules without the app's code`);
}

/** Record whether some `.js` of `recipe` holds Arena's modules and none of the app's. */
export function recordJsApart(ctx: Context): Verdict {
  const apart = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsArena(f.text, ctx) && !holdsApp(f.text, ctx));
  return pass(apart.length > 0, apart.length > 0 ? `yes: ${list(apart.map((f) => f.rel))}` : 'no');
}

export function recordSheetApart(ctx: Context): Verdict {
  const alone = sheetAlone(built(ctx, 'recipe').out, ctx);
  return pass(alone.length > 0, alone.length > 0 ? `yes: ${list(alone.map((f) => f.rel))}` : 'no');
}

export function recordSprite(ctx: Context): Verdict {
  const sprites = everyFile(built(ctx, 'recipe').out).filter((f) => /(^|\/)icons-[^/]*\.svg$/.test(f));
  return pass(sprites.length > 0, sprites.length > 0 ? `yes: ${list(sprites)}` : 'no');
}

const PACKAGE_IMPORT = /^@import\s+(?:'([^']+)'|"([^"]+)");/gm;

/** The package sheet as `arena build` writes it holds no `@import` of a package specifier, so a page can link it as it is. */
export function linkedSheets(ctx: Context): Verdict {
  const text = readFileSync(join(ctx.dir, 'src', 'arena.package.generated.css'), 'utf8');
  const specs = [...text.matchAll(PACKAGE_IMPORT)].map((m) => m[1] ?? m[2]!).filter((s) => !/^(\.{1,2}\/|\/|[a-z]+:)/i.test(s));
  return pass(specs.length === 0, specs.length === 0
    ? 'the package sheet as written holds no @import of a package specifier, so a page links it as it is'
    : `the package sheet as written holds ${specs.length} @import of a package specifier (first: ${specs[0]}), which no browser resolves from a page`);
}

export function arenaInMain(ctx: Context): Verdict {
  const arena = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsArena(f.text, ctx));
  const main = arena.filter((f) => f.name.startsWith('main-'));
  const alone = arena.filter((f) => !holdsApp(f.text, ctx));
  return pass(main.length === 1 && alone.length === 0,
    `main-*.js holding Arena's modules: ${list(main.map((f) => f.rel))}; .js holding them alone: ${list(alone.map((f) => f.rel))}`);
}

export function oneStylesFile(ctx: Context): Verdict {
  const css = files(built(ctx, 'recipe').out, '.css');
  const holding = css.filter((f) => holdsPackageSheet(f.text, ctx));
  return pass(css.length === 1 && holding.length === 1, `.css in 'recipe': ${list(css.map((f) => f.rel))}; holding the package sheet's rules: ${holding.length}`);
}

export function sideEffectsFalse(ctx: Context): Verdict {
  const path = join(ctx.dir, 'node_modules', '@dravensoft', `arena-${ctx.layer}`, 'package.json');
  const value = (JSON.parse(readFileSync(path, 'utf8')) as { sideEffects?: unknown }).sideEffects;
  return pass(value === false, `sideEffects is ${JSON.stringify(value)} in ${path}`);
}

export function outdirKept(ctx: Context): Verdict {
  const entries = files(built(ctx, 'twice').out, '.js').filter((f) => holdsApp(f.text, ctx));
  return pass(entries.length === 2, `entry .js files after 'recipe' then 'app-text' into one outdir: ${list(entries.map((f) => f.rel))}`);
}

/** The entry bundle of a run: the largest `.js` holding the app's code. */
export function entryBytes(ctx: Context, key: RunKey): number {
  const sizes = files(built(ctx, key).out, '.js').filter((f) => holdsApp(f.text, ctx)).map((f) => f.bytes.length);
  if (sizes.length === 0) throw new Error(`no .js holds the app's code in '${key}'`);
  return Math.max(...sizes);
}

export function ngDevMode(ctx: Context): Verdict {
  const without = entryBytes(ctx, 'no-define');
  const recipe = entryBytes(ctx, 'recipe');
  return pass(without > recipe, `main .js: ${without} bytes in 'no-define', ${recipe} bytes in 'recipe'`);
}

export function reactWithApp(ctx: Context): Verdict {
  const dom = files(built(ctx, 'recipe').out, '.js').filter((f) => holdsReactDom(f.text));
  if (dom.length === 0) return pass(false, `no .js holds React DOM's code in 'recipe'`);
  const apart = dom.filter((f) => !holdsApp(f.text, ctx));
  return pass(apart.length === 0, apart.length === 0
    ? `${list(dom.map((f) => f.rel))} holds React DOM's code and the app's`
    : `${list(apart.map((f) => f.rel))} holds React DOM's code without the app's`);
}

/** Two shared bundles (every `.js` but the entry's `index-…`) share a stem. */
export function sharedStem(ctx: Context): Verdict {
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

export const row = (r: Row): Observation => ({ layers: RA, expect: 'holds', ...r });

export const JS_CLAIM = (option: string) => `Arena's JS sits in a chunk of its own with ${option}`;
export const SHEET_APART = 'the package sheet sits in a CSS file of its own on both layers, which keeps its bytes and name when the app changes';

/** The runs a `*.js-apart` row reads: Vite 7, Vite 8, webpack and rspack give a JS-only config (R7-1). */
export const jsRuns = (b: BundlerId): { from: RunKey; after: RunKey } =>
  ['vite7', 'vite8', 'webpack', 'rspack'].includes(b) ? { from: 'js-recipe', after: 'js-recipe:app-text' } : { from: 'recipe', after: 'app-text' };

export function jsRow(bundler: BundlerId, claim: string, byName = true): Observation {
  const { from, after } = jsRuns(bundler);
  return row({ id: `${bundler}.js-apart`, bundler, claim, needs: [from, after], check: jsApart(from, after, byName) });
}

export const sheetRow = (bundler: BundlerId, claim: string): Observation =>
  row({ id: `${bundler}.sheet-apart`, bundler, claim, needs: ['recipe', 'app-text', 'app-sheet'], check: sheetApart });

export const noSprite_ = (bundler: BundlerId, claim: string): Observation =>
  row({ id: `${bundler}.sprite-not-copied`, bundler, claim, needs: ['recipe'], check: noSprite });


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
