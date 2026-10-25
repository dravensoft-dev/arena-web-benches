/* What a half runs to measure itself (`bun run measure` of the half): every claim its bundler's page makes, checked on
 * the half's own build, plus the figures. The half supplies its bundler's part (the recipe's snippets, its variants as
 * rewrites of its own config, its observation rows); the kit makes the scratch copies, builds each run with the half's
 * own scripts (`compile` once per distinct source, `bundle` per run), judges, runs the half's `finish` over the runs the
 * figures read, and weighs. `bundlers-result.json` of the half is what it writes. */

import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { judge } from './observations.ts';
import type { Built, Context, Observation, RunKey } from './observations.ts';
import { script } from './run.ts';
import { entryOf, hold, layerOf, rebase, scratch, scratchPath } from './scratch.ts';
import { requireSnippet } from './snippets.ts';
import { firstSelectors } from './static.ts';
import type { BundlerId, Layer, Mutation, Variant } from './types.ts';
import { brotliKB, changedKB, loaded } from './weigh.ts';
import type { Figures } from './weigh.ts';

export const RESULT = 'bundlers-result.json';

export type HalfResult = {
  product: string;
  layer: Layer;
  dir: string;
  bundler: BundlerId;
  version: string;
  observations: ReturnType<typeof judge>[];
  /** Null when a run the figures read did not build; `figuresError` says which. */
  figures: Figures | null;
  figuresError?: string;
};

/** A half's bundler part. */
export type Part = {
  bundler: BundlerId;
  /** The package whose installed version is the bundler's own; the half declares it exactly. */
  pin: string;
  /** The half's config file, at its root. */
  config: string;
  /** The page's recipe, verbatim: each is in the config exactly once. */
  snippets: Record<string, string>;
  /** The config of a variant as a rewrite of the half's committed config (`recipe`, which is it as it stands). */
  variants: Partial<Record<Exclude<Variant, 'recipe'>, (config: string) => string>>;
  observations: Observation[];
  /** The half runs `ngc` first (`compile`): once per distinct source, its output is reused by the runs that do not change `main.ts`. */
  compile?: boolean;
  /** The output directory of `bundle`, relative to the half. */
  out?: string;
  /** The bundler matches paths below its project root, so a scratch holds Arena's packages as real directories, as an npm install does. */
  arenaCopy?: boolean;
  /** The bundler refuses a link that points out of its project root, so a scratch holds the whole install as hardlinks (Arena's packages as copies). */
  hardlinkModules?: boolean;
};

/** The runs every half builds for the figures, whatever its observations ask. */
export const FIGURE_RUNS: RunKey[] = ['plain', 'recipe', 'app-text', 'app-sheet', 'arena-patch'];

/** The app-text scratch built with the page's no-sheet config `plain`, for the app-release figure of the plain column. */
export const PLAIN_TEXT = 'plain:app-text';

export type Key = RunKey | typeof PLAIN_TEXT;

/** The mutation a run's scratch takes and the variant its config is. */
export function spec(key: Key): { mutation: Mutation; variant: Variant } {
  switch (key) {
    case 'plain': return { mutation: 'none', variant: 'plain' };
    case 'recipe': return { mutation: 'none', variant: 'recipe' };
    case 'app-text': return { mutation: 'app-text', variant: 'recipe' };
    case 'app-sheet': return { mutation: 'app-sheet', variant: 'recipe' };
    case 'arena-patch': return { mutation: 'arena-patch', variant: 'recipe' };
    case 'js-recipe:app-text': return { mutation: 'app-text', variant: 'js-recipe' };
    case PLAIN_TEXT: return { mutation: 'app-text', variant: 'plain' };
    default: return { mutation: 'none', variant: key };
  }
}

const round = (n: number): number => Math.round(n * 100) / 100;

/** Brotli KB summed over every file of `out` whose name matches `pattern`. */
function weigh(out: string, pattern: RegExp): number {
  let sum = 0;
  for (const rel of new Bun.Glob('**/*').scanSync({ cwd: out })) {
    if (pattern.test(rel)) sum += brotliKB(readFileSync(join(out, rel)));
  }
  return round(sum);
}

const sumLoaded = (out: string, ext: '.js' | '.css'): number =>
  round(loaded(out, ext).reduce((sum, rel) => sum + brotliKB(readFileSync(join(out, rel))), 0));

export function figures(out: Record<string, string>): Figures {
  const patch = changedKB(out['recipe']!, out['arena-patch']!);
  return {
    firstVisit: { plain: sumLoaded(out['plain']!, '.js'), recipe: sumLoaded(out['recipe']!, '.js') },
    appRelease: {
      plain: changedKB(out['plain']!, out[PLAIN_TEXT]!).plain,
      recipe: changedKB(out['recipe']!, out['app-text']!).plain,
    },
    patch: patch.plain,
    dictionary: patch.dictionary,
    // Google Fonts are remote, so the fonts the output carries are the ones it holds, none for these pages.
    total: {
      js: sumLoaded(out['recipe']!, '.js'),
      css: sumLoaded(out['recipe']!, '.css'),
      sprite: weigh(out['recipe']!, /(^|\/)icons-[^/]*\.svg$/),
      fonts: weigh(out['recipe']!, /\.(woff2?|ttf|otf|eot)$/i),
    },
  };
}

/** The version of `pkg` the half's install holds; `bun` is the running binary. */
export function installed(half: string, pkg: string): string | null {
  if (pkg === 'bun') return Bun.version;
  const file = join(half, 'node_modules', pkg, 'package.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { version: string }).version : null;
}

/** The version the half declares for `pkg`, which must be exact, and the one its install holds; `bun` is declared by `packageManager`. */
export function pinProblem(half: string, pkg: string): string | null {
  const declared = (JSON.parse(readFileSync(join(half, 'package.json'), 'utf8')) as { packageManager?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> });
  const wanted = pkg === 'bun' ? declared.packageManager?.match(/^bun@(.+)$/)?.[1] : declared.devDependencies?.[pkg] ?? declared.dependencies?.[pkg];
  const found = installed(half, pkg);
  if (wanted === undefined || wanted !== found) return `${pkg}: declared ${wanted ?? 'nothing'}, installed ${found ?? 'nothing'}`;
  return null;
}

/** The package at `dir` has a script `name`: a half whose bundler makes its own copies has no `finish`. */
export function hasScript(dir: string, name: string): boolean {
  const { scripts } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  return scripts?.[name] !== undefined;
}

/** Every snippet of the part is in the half's config exactly once: a throw names the first that is not. */
export function checkSnippets(part: Part, config: string): void {
  for (const [name, snippet] of Object.entries(part.snippets)) requireSnippet(config, name, snippet, part.config);
}

/** The text of `variant` for the half's config: a variant the part does not carry is a throw naming it. */
export function configOf(part: Part, variant: Variant, config: string): string {
  if (variant === 'recipe') return config;
  const rewrite = part.variants[variant];
  if (!rewrite) throw new Error(`the ${part.bundler} part carries no variant '${variant}'`);
  return rewrite(config);
}

export async function runMeasure(half: string, part: Part): Promise<HalfResult> {
  const abs = resolve(half);
  const dir = basename(abs);
  const root = dirname(abs);
  const layer = layerOf(dir);
  const out = part.out ?? 'dist';

  // A snippet the config lacks is not checked here: the run that rewrites it fails by name (`attempt`), the rows that
  // read that run are contradicted with the message, and the half still writes its result. `checkSnippets` is a test.
  const config = readFileSync(join(abs, part.config), 'utf8');
  const problem = pinProblem(abs, part.pin);
  if (problem) throw new Error(`${dir}: the installed tree is not the declared one, nothing is built: ${problem}`);

  const mine = part.observations.filter((o) => o.bundler === part.bundler && o.layers.includes(layer));
  const keys = [...new Set<Key>([...FIGURE_RUNS, PLAIN_TEXT, ...mine.flatMap((o) => o.needs)])];

  const made: string[] = [];
  const compiled = new Map<string, string>();
  try {
    const runs: Partial<Record<Key, Built>> = {};
    const roots: Partial<Record<Key, string>> = {};
    // Every run is built at one path, `.run-<dir>-m`, then moved to a path of its own: the directory name enters
    // webpack's module ids, so runs compared by name and bytes must share it (D11).
    const building = scratchPath(dir, 'm', root);
    made.push(building);

    /** `bundle` at the building path, with the config of `variant`, after `compile` (once per distinct source). */
    const attempt = (mutation: Mutation, variant: Variant): Built => {
      const built = (log: string, ok = false): Built => ({ ok, out: ok ? join(building, out) : '', log });
      try {
        writeFileSync(join(building, part.config), configOf(part, variant, config));
        let log = '';
        if (part.compile) {
          // The source `ngc` reads differs only in the app marker: one compile per marker.
          const source = mutation === 'app-text' ? 'text' : 'plain';
          const cache = compiled.get(source);
          if (cache) {
            cpSync(join(cache, '.ngc'), join(building, '.ngc'), { recursive: true });
          } else {
            const done = script(building, 'compile');
            if (!done.ok) return built(done.log);
            log = done.log;
            const keep = scratchPath(dir, `ngc-${source}`, root);
            made.push(keep);
            rmSync(keep, { recursive: true, force: true });
            cpSync(join(building, '.ngc'), join(keep, '.ngc'), { recursive: true });
            compiled.set(source, keep);
          }
        }
        const done = script(building, 'bundle');
        return built(`${log}${done.log}`, done.ok);
      } catch (error) {
        return built(error instanceof Error ? error.message : String(error));
      }
    };

    for (const key of keys) {
      const { mutation, variant } = spec(key);
      scratch(dir, 'm', mutation, root, part.arenaCopy === true, part.hardlinkModules === true);
      let built: Built;
      if (key === 'twice') {
        // One outdir, built twice: `recipe`, then the app's text changed in place, as `app-text` does, then `twice`.
        const first = attempt('none', 'recipe');
        const entry = join(building, entryOf(layer));
        writeFileSync(entry, readFileSync(entry, 'utf8').replace(`__appMarker = '${dir}'`, `__appMarker = '${dir} ·'`));
        built = first.ok ? attempt('app-text', 'twice') : first;
      } else {
        built = attempt(mutation, variant);
      }
      const kept = hold(building, scratchPath(dir, key.replace(/:/g, '-'), root));
      made.push(kept);
      roots[key] = kept;
      runs[key] = built.out ? { ...built, out: rebase(built.out, building, kept) } : built;
    }

    const ctx: Context = { dir: abs, layer, ...firstSelectors(abs, layer), runs: runs as Partial<Record<RunKey, Built>> };
    const observations = mine.map((o) => judge(o, ctx));

    // Only now: the half's own `finish` (the sheets its page links, the sprite, its statics), when it has one, over the runs the figures read.
    const outs: Record<string, string> = {};
    let figuresError: string | undefined;
    for (const key of FIGURE_RUNS.concat(PLAIN_TEXT)) {
      const built = runs[key]!;
      if (!built.ok) {
        figuresError = `run '${key}' did not build, so no figure is measured: ${built.log.trim().split('\n').slice(-5).join(' | ')}`;
        break;
      }
      const done = hasScript(roots[key]!, 'finish') ? script(roots[key]!, 'finish') : { ok: true, log: '' };
      if (!done.ok) {
        figuresError = `run '${key}' built and its finish did not: ${done.log.trim().split('\n').slice(-5).join(' | ')}`;
        break;
      }
      outs[key] = built.out;
    }

    const version = installed(abs, part.pin)!;
    const result: HalfResult = { product: dir.replace(/^(react|angular)-/, ''), layer, dir, bundler: part.bundler, version, observations, figures: figuresError ? null : figures(outs), ...(figuresError ? { figuresError } : {}) };
    writeFileSync(join(abs, RESULT), `${JSON.stringify(result, null, 2)}\n`);
    return result;
  } finally {
    for (const path of made) rmSync(path, { recursive: true, force: true });
  }
}

/** One line per `holds` observation that failed: `<id> (<dir>): <claim>: <detail>`. */
export function contradictionsOf(result: HalfResult): string[] {
  return result.observations.filter((o) => !o.holds).map((o) => `${o.id} (${result.dir}): ${o.claim}: ${o.detail}`);
}

/** What a half's `measure.ts` calls: runs, prints each contradiction, exits 1 when there is one. */
export async function measureMain(half: string, part: Part): Promise<void> {
  const result = await runMeasure(half, part);
  const bad = contradictionsOf(result);
  for (const line of bad) console.error(line);
  if (result.figuresError) console.error(`${result.dir}: ${result.figuresError}`);
  console.log(`${result.dir}: ${result.observations.length} observation(s), ${bad.length} contradiction(s), ${RESULT} written`);
  if (bad.length > 0 || result.figuresError) process.exit(1);
}
