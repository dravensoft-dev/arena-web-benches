/* The runner: every claim a bundler page makes, checked on the half the rotation assigns that bundler. Per half it
 * builds the runs its observations ask for, plus the five the figures need, reads the bare outputs for the
 * observations, and only then links the sheets and copies the sprite before weighing. `bun run bundlers` writes
 * `bundlers-results.json` even when a claim is contradicted, prints each contradiction and exits 1. */

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { halves, RESULTS } from './build.ts';
import { judge, OBSERVATIONS } from './bundlers/observations.ts';
import type { Built, RunKey } from './bundlers/observations.ts';
import { installedVersion, pinProblems } from './bundlers/pins.ts';
import { assigned, table } from './bundlers/rotation.ts';
import { entryOf, hold, rebase, scratch, scratchPath } from './bundlers/scratch.ts';
import { finish, firstSelectors, linkSheets } from './bundlers/static.ts';
import type { BundlerId, Driver, Layer, Mutation, Probe, Table } from './bundlers/types.ts';
import { brotliKB, changedKB, loaded } from './bundlers/weigh.ts';
import type { Figures } from './bundlers/weigh.ts';

export type HalfResult = {
  product: string;
  layer: Layer;
  dir: string;
  bundler: BundlerId;
  version: string;
  observations: ReturnType<typeof judge>[];
  figures: Figures;
};

export type Results = {
  arena: string;
  arenaSource: string;
  rotation: number;
  date: string;
  commit: string;
  pins: Record<string, string>;
  halves: HalfResult[];
};

/** The runs every half builds for the figures, whatever its observations ask. */
const FIGURE_RUNS: RunKey[] = ['plain', 'recipe', 'app-text', 'app-sheet', 'arena-patch'];

/** The app-text scratch built with the page's no-sheet config `plain`, for the app-release figure of the plain column. */
const PLAIN_TEXT = 'plain:app-text';

type Key = RunKey | typeof PLAIN_TEXT;

/** The mutation a run's scratch takes and the variant the driver builds. */
function spec(key: Key): { mutation: Mutation; variant: 'plain' | 'recipe' | Probe } {
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

/** The pin whose version is the bundler's own. */
const PIN: Partial<Record<BundlerId, string>> = { angular: '@angular/build', rspack: '@rspack/core', vite8: 'vite' };

const pinOf = (bundler: BundlerId): string => PIN[bundler] ?? bundler;

function attempt(driver: Driver, dir: string, layer: Layer, variant: 'plain' | 'recipe' | Probe): Built {
  try {
    return driver.bundle(dir, layer, variant);
  } catch (error) {
    return { ok: false, out: '', log: error instanceof Error ? error.message : String(error) };
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

function figures(out: Record<string, string>): Figures {
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

async function runHalf(t: Table, root: string, half: { product: string; layer: Layer; dir: string }): Promise<HalfResult> {
  const { product, layer, dir } = half;
  const problems = pinProblems(t, root);
  if (problems.length > 0) throw new Error(`${dir}: the installed tree is not the pinned one, nothing is built:\n  ${problems.join('\n  ')}`);

  const { bundler } = assigned(t, dir);
  const driver = (await import(`./bundlers/drivers/${bundler}.ts`)).default as Driver;
  const mine = OBSERVATIONS.filter((o) => o.bundler === bundler && o.layers.includes(layer));
  const keys = [...new Set<Key>([...FIGURE_RUNS, PLAIN_TEXT, ...mine.flatMap((o) => o.needs)])];

  const made: string[] = [];
  try {
    const runs: Partial<Record<Key, Built>> = {};
    const roots: Partial<Record<Key, string>> = {};
    // Every run is built at one path, `.run-<dir>-m`, then moved to a path of its own: the directory name enters
    // webpack's module ids, so runs compared by name and bytes must share it (D11).
    const building = scratchPath(dir, 'm', root);
    made.push(building);
    for (const key of keys) {
      const { mutation, variant } = spec(key);
      scratch(dir, 'm', mutation, root);
      let built: Built;
      if (key === 'twice') {
        // One outdir, built twice: `recipe`, then the app's text changed in place, as `app-text` does, then `twice`.
        const first = attempt(driver, building, layer, 'recipe');
        const entry = join(building, entryOf(layer));
        writeFileSync(entry, readFileSync(entry, 'utf8').replace(`__appMarker = '${dir}'`, `__appMarker = '${dir} ·'`));
        built = first.ok ? attempt(driver, building, layer, 'twice') : first;
      } else {
        built = attempt(driver, building, layer, variant);
      }
      const kept = hold(building, scratchPath(dir, key.replace(/:/g, '-'), root));
      made.push(kept);
      roots[key] = kept;
      runs[key] = built.out ? { ...built, out: rebase(built.out, building, kept) } : built;
    }

    const ctx = { dir: join(root, dir), layer, ...firstSelectors(join(root, dir), layer), runs: runs as Partial<Record<RunKey, Built>> };
    const observations = mine.map((o) => judge(o, ctx));

    // Only now: the sheets the driver maps away are linked and the sprite copied, as the half's own build does.
    const out: Record<string, string> = {};
    for (const key of FIGURE_RUNS.concat(PLAIN_TEXT)) {
      const built = runs[key]!;
      if (!built.ok) throw new Error(`${dir}: run '${key}' did not build, so no figure is measured:\n${built.log.trim().split('\n').slice(-5).join('\n')}`);
      if (driver.linksSheets) linkSheets(roots[key]!, layer, built.out);
      finish(roots[key]!, layer, built.out);
      out[key] = built.out;
    }

    const version = t.pins[pinOf(bundler)];
    if (!version) throw new Error(`${dir}: no pin '${pinOf(bundler)}' for ${bundler}`);
    return { product, layer, dir, bundler, version, observations, figures: figures(out) };
  } finally {
    for (const path of made) rmSync(path, { recursive: true, force: true });
  }
}

export async function run(t: Table, root = '.', only?: string): Promise<Results> {
  const all = halves(t.products).filter((one) => only === undefined || one.dir === only);
  const first = t.products[0]!.react;
  const arena = installedVersion('@dravensoft/arena-react', join(root, first));
  if (!arena) throw new Error(`@dravensoft/arena-react is not installed under ${first}`);

  const result: HalfResult[] = [];
  for (const one of all) {
    console.log(`bundlers: ${one.dir}`);
    result.push(await runHalf(t, root, one));
  }
  const commit = Bun.spawnSync(['git', 'rev-parse', '--short', 'HEAD'], { cwd: root }).stdout.toString().trim();
  return {
    arena, arenaSource: t.arenaSource, rotation: t.rotation, date: new Date().toISOString().slice(0, 10), commit,
    pins: t.pins, halves: result,
  };
}

/** One line per `holds` observation that failed: `<id> (<dir>): <claim>: <detail>`. */
export function contradictions(r: Results): string[] {
  return r.halves.flatMap((half) => half.observations
    .filter((o) => !o.holds)
    .map((o) => `${o.id} (${half.dir}): ${o.claim}: ${o.detail}`));
}

async function main() {
  const at = process.argv.indexOf('--only');
  const only = at < 0 ? undefined : process.argv[at + 1];
  const t = table();
  const results = await run(t, '.', only);
  const text = `${JSON.stringify(results, null, 2)}\n`;
  // A run over one half is a dry check: it prints and leaves the results file alone.
  if (only === undefined) writeFileSync(RESULTS, text);
  else console.log(text);
  const bad = contradictions(results);
  for (const line of bad) console.error(line);
  console.log(`bundlers: ${results.halves.length} half(s), ${bad.length} contradiction(s)${only === undefined ? `, ${RESULTS} written` : ''}`);
  if (bad.length > 0) process.exit(1);
}

if (import.meta.main) await main();
