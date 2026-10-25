/* The sixteen halves built into one shape, or none of them. bundlers.json names the pairs; each half is an adopter of its
 * bundler, installs its own frozen lockfile, builds with its own `build` script into its own `dist`, and the exit code
 * is the whole of the claim: the first half that fails stops the run and leaves nothing behind. Three things are asserted
 * rather than trusted. The `./` base, since the flag that sets it is in each half's own config and a half published
 * against the domain root answers 200 at every href under a subdirectory and loads none of its own code. That every
 * raster is asked for relative to the half, since a root-absolute one is the domain root wherever the half sits and
 * nothing downstream reads a bundle. That only the browser output travels. A half's own output is cleared first: some
 * bundlers do not empty the directory they write into, so every earlier hashed bundle would stay there, published and
 * loaded by nothing. */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Layer, Product } from './bundlers/types.ts';

export const ADOPTER = 'arena-adopter.json';

export const TABLE = 'bundlers.json';

export const RESULTS = 'bundlers-results.json';

export const REPOSITORY = 'https://github.com/dravensoft-dev/arena-web-benches';

export const ARENA = '12.1.1';

export const OUT = 'dist';

/** The directory a half's `build` writes its browser output into. */
export const DIST = 'dist';

export const LAYERS = ['react', 'angular'] as const satisfies readonly Layer[];

export const LABELS: Record<Layer, string> = { react: 'React', angular: 'Angular' };

/** The relative base every page carries: `<base href="./">`, or `<base href=./>` where a bundler minifies the page and drops the quotes. */
export const BASE = /<base\s+href=(?:"\.\/"|'\.\/'|\.\/(?=[\s/>]))/;

export const NOT_BROWSER_OUTPUT = ['prerendered-routes.json', '3rdpartylicenses.txt'];

export const RASTERS = 'img';

export const READABLE = ['.html', '.css', '.js'];

export const ROOTED = /['"]\/img\//g;

export const ASKED = /['"]img\/([^'"]+)['"]/g;

export type { Product };

export type AdopterManifest = {
  arena: string;
  name: string;
  title: string;
  description: string;
  repository: string;
  sections: { heading: string; links: { label: string; href: string }[] }[];
};

export function products(root = '.'): Product[] {
  return (JSON.parse(readFileSync(join(root, TABLE), 'utf8')) as { products: Product[] }).products;
}

export function halves(all: Product[]) {
  return all.flatMap((one) => LAYERS.map((layer) => ({
    product: one.product, layer, dir: one[layer],
  })));
}

export function adopterManifest(all: Product[], arena: string): AdopterManifest {
  return {
    arena,
    name: 'web-benches',
    title: 'Web benches',
    description: 'Eight products, each mocked twice, once in React and once in Angular, from the '
      + 'same arena.config.json and the same design directory, so a difference between a pair is '
      + 'Arena answering the two layers differently.',
    repository: REPOSITORY,
    sections: all.map(({ product, label }) => ({
      heading: label,
      links: LAYERS.map((layer) => ({ label: LABELS[layer], href: `${product}/${layer}/` })),
    })),
  };
}

export function baseProblems(rel: string, html: string) {
  return BASE.test(html) ? [] : [`${rel} carries no <base href="./">. Every href in it then resolves `
    + 'against the domain root rather than against the directory the half is served from, so the '
    + 'page answers 200 and loads none of its own code'];
}

export function rootedProblems(rel: string, text: string) {
  return [...text.matchAll(ROOTED)].length === 0 ? [] : [`${rel} asks for a raster under /img/, `
    + 'which is the domain root wherever the half is served from and not the directory it sits '
    + 'in. A base href does not reach a root-absolute URL, so the picture 404s everywhere but the '
    + 'root and no gate reading .html would see it, since this is in the bundle'];
}

export function rasterProblems(rel: string, text: string, carries: (name: string) => boolean) {
  return [...new Set([...text.matchAll(ASKED)].map((match) => match[1] ?? ''))]
    .filter((name) => !carries(name))
    .sort()
    .map((name) => `${rel} asks for ${RASTERS}/${name} and the half carries no such file`);
}

export function strayProblems(rel: string, names: string[]) {
  return names
    .filter((name) => NOT_BROWSER_OUTPUT.includes(name))
    .map((name) => `${rel} carries ${name}, which the builder writes beside the browser output `
      + 'rather than inside it, so the wrong directory was copied');
}

/** Copies `bundlers-results.json` of `root` into `<root>/<out>` beside the adopter manifest; false when there is none. */
export function copyResults(root: string, out: string): boolean {
  const from = join(root, RESULTS);
  if (!existsSync(from)) return false;
  writeFileSync(join(root, out, RESULTS), readFileSync(from, 'utf8'));
  return true;
}

function run(command: string[]) {
  const done = Bun.spawnSync(command, { stdout: 'inherit', stderr: 'inherit' });
  return done.exitCode === 0;
}

async function main() {
  const pairs = products();
  const all = halves(pairs);

  rmSync(join(OUT, ADOPTER), { force: true });
  rmSync(join(OUT, RESULTS), { force: true });
  for (const { product } of pairs) rmSync(join(OUT, product), { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const { product, layer, dir } of all) {
    console.log(`\nbuild: ${dir}`);
    rmSync(join(dir, DIST), { recursive: true, force: true });
    // A half installs its own frozen lockfile first (D15): what it declares is what it builds with.
    if (!run(['bun', 'install', '--frozen-lockfile', '--cwd', dir]) || !run(['bun', 'run', '--cwd', dir, 'build'])) {
      for (const one of pairs) rmSync(join(OUT, one.product), { recursive: true, force: true });
      console.error(`\nbuild: ${dir} did not build, and a site carrying fifteen halves is never `
        + 'published, so nothing is left under ' + OUT + '/');
      process.exit(1);
    }
    const from = join(dir, DIST);
    if (!existsSync(from)) {
      console.error(`\nbuild: ${dir} built and wrote no ${DIST}, which is the path every half writes into`);
      process.exit(1);
    }
    const into = join(OUT, product, layer);
    cpSync(from, into, { recursive: true });
    const rasters = join(dir, 'public');
    if (layer === 'react' && existsSync(rasters)) {
      cpSync(rasters, join(into, RASTERS), { recursive: true });
    }
  }

  const problems: string[] = [];
  for (const { product, layer } of all) {
    const rel = `${OUT}/${product}/${layer}`;
    const page = join(rel, 'index.html');
    if (!existsSync(page)) {
      problems.push(`${rel} holds no index.html, so nothing is served at the address it takes`);
      continue;
    }
    problems.push(...baseProblems(`${rel}/index.html`, readFileSync(page, 'utf8')));
    problems.push(...strayProblems(rel, [...new Bun.Glob('*').scanSync({ cwd: rel, onlyFiles: false })]));
    for (const name of new Bun.Glob('**/*').scanSync({ cwd: rel })) {
      if (!READABLE.some((suffix) => name.endsWith(suffix))) continue;
      const text = readFileSync(join(rel, name), 'utf8');
      problems.push(...rootedProblems(`${rel}/${name}`, text));
      problems.push(...rasterProblems(`${rel}/${name}`, text,
        (raster) => existsSync(join(rel, RASTERS, raster))));
    }
  }

  if (problems.length > 0) {
    for (const { product } of pairs) rmSync(join(OUT, product), { recursive: true, force: true });
    console.error(`\nbuild: ${problems.length} problem(s), and nothing is left under ${OUT}/\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  writeFileSync(join(OUT, ADOPTER), readFileSync(ADOPTER, 'utf8'));
  const results = copyResults('.', OUT);
  console.log(`\nbuild: ${pairs.length} pair(s) and ${all.length} half(s) under ${OUT}/, with `
    + `${ADOPTER} beside them`);
  console.log(results ? `build: ${RESULTS} copied into ${OUT}/` : `build: no ${RESULTS} to copy, so ${OUT}/ carries none`);
}

if (import.meta.main) await main();
