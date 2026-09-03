/* The sixteen halves built into one shape, or none of them. benches.json names the path each
 * half writes into because a React half writes dist and an Angular one dist/browser, and a
 * convention that holds for sixteen directories is a convention until it does not. The exit code
 * is the whole claim: the first half that fails stops the run. The `./` base is asserted rather
 * than trusted, since the flag that sets it lives in each half's own build script and a half
 * published with the default base answers 200 at every href under a subdirectory and loads
 * nothing. Only the browser output travels, so what a builder writes beside it stays behind. */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const MANIFEST = 'benches.json';

export const OUT = 'dist';

export const LAYERS = ['react', 'angular'] as const;

export const BASE = '<base href="./"';

export const NOT_BROWSER_OUTPUT = ['prerendered-routes.json', '3rdpartylicenses.txt'];

export type Half = { dir: string; out: string };

export type Pair = { product: string; skin: string; react: Half; angular: Half };

export type Manifest = { arena: string; pairs: Pair[] };

export function manifest(root = '.'): Manifest {
  return JSON.parse(readFileSync(join(root, MANIFEST), 'utf8')) as Manifest;
}

export function halves(pairs: Pair[]) {
  return pairs.flatMap((pair) => LAYERS.map((layer) => ({
    product: pair.product, layer, ...pair[layer],
  })));
}

export function baseProblems(rel: string, html: string) {
  return html.includes(BASE) ? [] : [`${rel} carries no ${BASE}>. Every href in it then resolves `
    + 'against the domain root rather than against the directory the half is served from, so the '
    + 'page answers 200 and loads none of its own code'];
}

export function strayProblems(rel: string, names: string[]) {
  return names
    .filter((name) => NOT_BROWSER_OUTPUT.includes(name))
    .map((name) => `${rel} carries ${name}, which the builder writes beside the browser output `
      + 'rather than inside it, so the wrong directory was copied');
}

function run(command: string[]) {
  const done = Bun.spawnSync(command, { stdout: 'inherit', stderr: 'inherit' });
  return done.exitCode === 0;
}

function main() {
  const { pairs } = manifest();
  const all = halves(pairs);

  rmSync(join(OUT, MANIFEST), { force: true });
  for (const { product } of pairs) rmSync(join(OUT, product), { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const { product, layer, dir, out } of all) {
    console.log(`\nbuild: ${dir}`);
    if (!run(['bun', 'run', '--cwd', dir, 'build'])) {
      for (const one of pairs) rmSync(join(OUT, one.product), { recursive: true, force: true });
      console.error(`\nbuild: ${dir} did not build, and a site carrying fifteen halves is never `
        + 'published, so nothing is left under ' + OUT + '/');
      process.exit(1);
    }
    const from = join(dir, out);
    if (!existsSync(from)) {
      console.error(`\nbuild: ${dir} built and wrote no ${out}, which is the path ${MANIFEST} says `
        + 'it writes into');
      process.exit(1);
    }
    cpSync(from, join(OUT, product, layer), { recursive: true });
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
  }

  if (problems.length > 0) {
    for (const { product } of pairs) rmSync(join(OUT, product), { recursive: true, force: true });
    console.error(`\nbuild: ${problems.length} problem(s), and nothing is left under ${OUT}/\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  writeFileSync(join(OUT, MANIFEST), readFileSync(MANIFEST, 'utf8'));
  console.log(`\nbuild: ${pairs.length} pair(s) and ${all.length} half(s) under ${OUT}/, with `
    + `${MANIFEST} beside them`);
}

if (import.meta.main) main();
