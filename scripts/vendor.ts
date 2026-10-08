/* The two component packages packed from an Arena working tree, for the sixteen to read before the
 * registry carries that version. Each half names its tarball as file:../vendor/<name>.tgz, so this
 * writes into the one directory those paths resolve to and nowhere else. The tree is read as it
 * stands: its dist/ is whatever was last built there, so build it first (bun run build:release)
 * and this packs what that build wrote. vendor/ is ignored, because pages.yml installs main with a
 * frozen lockfile and a path to a tarball no clone holds is an install that fails. A tarball
 * repacked under the same version carries a new integrity, so reinstall with bun install --force. */

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const VENDOR = 'vendor';

export const PACKAGES = ['react', 'angular'].map((layer) => join('frameworks', layer, 'dist'));

function run(command: string[], cwd: string) {
  const done = Bun.spawnSync(command, { cwd, stdout: 'pipe', stderr: 'pipe' });
  if (done.exitCode !== 0) {
    throw new Error(`${command.join(' ')} in ${cwd} failed: ${done.stderr.toString().trim()}`);
  }
  return done.stdout.toString();
}

function main(argv: string[]) {
  const arena = argv[0] ? resolve(argv[0]) : '';
  const missing = PACKAGES.filter((at) => !existsSync(join(arena, at, 'package.json')));
  if (!arena || missing.length) {
    console.error(`vendor: ${arena || '(nothing)'} is not an Arena tree with built packages; `
      + `missing ${missing.join(', ') || 'the path'}. Pass the tree, and build it first.`);
    process.exit(2);
  }

  mkdirSync(VENDOR, { recursive: true });
  for (const one of readdirSync(VENDOR)) {
    if (one.endsWith('.tgz')) unlinkSync(join(VENDOR, one));
  }

  for (const at of PACKAGES) {
    const from = join(arena, at);
    const { name, version } = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8'));
    const [written] = JSON.parse(run(['npm', 'pack', '--json', '--pack-destination', resolve(VENDOR)], from));
    const tgz = join(VENDOR, written.filename);
    const integrity = `sha512-${createHash('sha512').update(readFileSync(tgz)).digest('base64')}`;
    console.log(`${name}@${version} -> ${tgz}\n  ${integrity}`);
  }
}

if (import.meta.main) main(Bun.argv.slice(2));
