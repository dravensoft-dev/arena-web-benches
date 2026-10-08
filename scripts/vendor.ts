/* The two component packages packed from an Arena working tree, for the sixteen to read before the
 * registry carries that version. Each half names its tarball as file:../vendor/<name>.tgz, so this
 * writes into the one directory those paths resolve to and nowhere else. The tree is read as it
 * stands: its dist/ is whatever was last built there, so build it first (bun run build:release)
 * and this packs what that build wrote. vendor/ is ignored, because pages.yml installs main with a
 * frozen lockfile and a path to a tarball no clone holds is an install that fails. Bun keys a
 * local tarball's cached extraction by its path and not by its content, so a repack under the same
 * version is installed as the old one unless the cache entry, the extraction under node_modules and
 * the lockfile's integrity are all dropped. This does that after packing, so bun scripts/vendor.ts
 * <arena> && bun install --force reads the tarballs just written. */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const VENDOR = 'vendor';

const NAMES = ['@dravensoft/arena-react', '@dravensoft/arena-angular'];

/* Forget what bun holds of the previous pack of each package: its cached extraction (and the link
 * to it), its extraction under the root node_modules, and the integrity the lockfile records. */
function forget(done: Map<string, string>) {
  const cache = run(['bun', 'pm', 'cache'], '.').trim();
  if (cache && existsSync(cache)) {
    for (const entry of readdirSync(cache).filter((one) => one.startsWith('@T@'))) {
      const at = join(cache, entry, 'package.json');
      if (existsSync(at) && NAMES.includes(JSON.parse(readFileSync(at, 'utf8')).name)) {
        rmSync(join(cache, entry), { recursive: true, force: true });
      }
    }
    for (const name of NAMES) {
      const folder = join(cache, name);
      if (!existsSync(folder)) continue;
      for (const one of readdirSync(folder).filter((link) => link.startsWith('@T@'))) rmSync(join(folder, one), { force: true });
    }
  }
  const store = join('node_modules', '.bun');
  if (existsSync(store)) {
    for (const one of readdirSync(store).filter((dir) => dir.includes('+vendor+'))) {
      rmSync(join(store, one), { recursive: true, force: true });
    }
  }
  if (existsSync('bun.lock')) {
    const lines = readFileSync('bun.lock', 'utf8').split('\n').map((line) => {
      const name = NAMES.find((one) => line.includes(`"${one}": ["${one}@../vendor/`));
      return name && done.has(name) ? line.replace(/sha512-[A-Za-z0-9+/=]+/, done.get(name)!) : line;
    });
    writeFileSync('bun.lock', lines.join('\n'));
  }
}

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

  const done = new Map<string, string>();
  for (const at of PACKAGES) {
    const from = join(arena, at);
    const { name, version } = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8'));
    const [written] = JSON.parse(run(['npm', 'pack', '--json', '--pack-destination', resolve(VENDOR)], from));
    const tgz = join(VENDOR, written.filename);
    const integrity = `sha512-${createHash('sha512').update(readFileSync(tgz)).digest('base64')}`;
    console.log(`${name}@${version} -> ${tgz}\n  ${integrity}`);
    done.set(name, integrity);
  }
  forget(done);
}

if (import.meta.main) main(Bun.argv.slice(2));
