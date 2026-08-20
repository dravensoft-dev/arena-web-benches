/* One tarball per twin pair, for a release page to carry. git archive is what makes it clean:
 * it holds what the commit holds, so each bench's own .gitignore is the whole definition of
 * what a packed bench is, and no second list of exclusions exists to go stale. A dirty tree is
 * refused rather than packed, because a tarball that matches no commit cannot be produced again. */

import { existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const PRODUCTS = [
  'calendly', 'clickup', 'duolingo', 'etsy', 'grafana', 'instagram', 'notion', 'superhuman',
];

export const LAYERS = ['react', 'angular'];

export const OUT = 'dist';

export const TAG = /^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

export function nameFor(product: string, tag: string) {
  return `arena-web-benches-${product}-${tag}`;
}

export function pairProblems(product: string, exists: (path: string) => boolean) {
  return LAYERS
    .filter((layer) => !exists(`${layer}-${product}`))
    .map((layer) => `${product}: ${layer}-${product} is not here, so the pair is half a pair and `
      + 'the tarball would ship one layer of a comparison that only means anything as two');
}

function run(command: string[]) {
  const done = Bun.spawnSync(command, { stdout: 'pipe', stderr: 'pipe' });
  if (done.exitCode !== 0) {
    throw new Error(`${command.join(' ')} failed: ${done.stderr.toString().trim()}`);
  }
  return done.stdout.toString();
}

function main(argv: string[]) {
  const tag = argv[0] ?? '';
  if (!TAG.test(tag)) {
    console.error(`pack: ${tag || '(nothing)'} is not a tag. Write it as vX.Y.Z, the same string the `
      + 'Arena release carries, because the tarball is named for the release it is attached to.');
    process.exit(2);
  }

  const dirty = run(['git', 'status', '--porcelain']).trim();
  if (dirty) {
    console.error('pack: the working tree is not clean, and a tarball packed from an uncommitted '
      + `tree matches no commit, so it cannot be produced again:\n${dirty}`);
    process.exit(1);
  }

  const problems = PRODUCTS.flatMap((product) => pairProblems(product, existsSync));
  if (problems.length) {
    console.error(`pack: ${problems.length} problem(s)\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const product of PRODUCTS) {
    const name = nameFor(product, tag);
    const at = join(OUT, `${name}.tar.gz`);
    run(['git', 'archive', '--format=tar.gz', `--prefix=${name}/`, '-o', at, 'HEAD',
      ...LAYERS.map((layer) => `${layer}-${product}`)]);
    console.log(`wrote ${at}`);
  }

  const written = readdirSync(OUT).filter((one) => one.endsWith('.tar.gz'));
  if (written.length !== PRODUCTS.length) {
    console.error(`pack: ${PRODUCTS.length} pair(s) and ${written.length} tarball(s)`);
    process.exit(1);
  }
  console.log(`pack: ${written.length} tarball(s) for ${tag}, one per pair`);
}

if (import.meta.main) main(Bun.argv.slice(2));
