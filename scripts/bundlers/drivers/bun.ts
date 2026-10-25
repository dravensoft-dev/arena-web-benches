import { readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { compileAot } from '../../../bench-kit/src/angular-link.ts';
import { HOOKS_URL } from './angular-hooks.ts';
import { angularEntry, angularPage, run } from './common.ts';

const CONFIG = '.bundler.bun.mjs';

/**
 * `bun build` over the half's own page, as the page describes it (bun-esbuild.md): one entry, one CSS file for it, no
 * option that keeps Arena apart. `recipe` is that build and `plain` equals it (F7). Probe `twice` is the same build into
 * an outdir that is not emptied first: the caller builds `recipe`, changes the app, then calls `twice` on the same
 * directory, and `bun build` leaves both entry files there (`bun.outdir-kept`).
 */
/**
 * The Angular half through `Bun.build`: `ngc` compiled it (AOT), the linker runs in an `onLoad` plugin over every
 * `node_modules` module that carries a declaration, and the CSS the entry imports lands in one `.css` as for React.
 */
function angularConfig(dir: string): string {
  return `import { buildLinker } from ${JSON.stringify(HOOKS_URL)};

const built = await Bun.build({
  entrypoints: [${JSON.stringify(angularEntry(dir))}],
  outdir: 'dist',
  naming: '[name]-[hash].[ext]',
  minify: true,
  plugins: [buildLinker(process.cwd())],
  throw: false,
});
for (const message of built.logs) console.log(String(message));
if (!built.success) process.exit(1);
`;
}

const driver: Driver = {
  id: 'bun',
  layers: ['react', 'angular'],
  out: 'dist',
  probes: ['twice'],
  linksSheets: false,
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    if (variant !== 'twice') rmSync(out, { recursive: true, force: true });
    if (layer === 'angular') {
      const aot = compileAot(dir);
      if (!aot.ok) return { ok: false, out, log: aot.log };
      writeFileSync(join(dir, CONFIG), angularConfig(dir));
      const done = run(resolve(dir), 'bun', [CONFIG], { NODE_ENV: 'production' });
      if (!done.ok) return { ok: false, out, log: `${aot.log}${done.log}` };
      // `Bun.build` of a JS entry writes no page: the half's own, with the entry's `.js` (the newest, where `twice` left two) and its `.css`.
      const newest = (suffix: string): string[] => readdirSync(out)
        .filter((name) => name.startsWith('main-') && name.endsWith(suffix))
        .sort((a, b) => statSync(join(out, b)).mtimeMs - statSync(join(out, a)).mtimeMs)
        .slice(0, 1);
      const [script] = newest('.js');
      if (!script) return { ok: false, out, log: `${done.log}\nno main-*.js in ${out}` };
      writeFileSync(join(out, 'index.html'), angularPage(dir, script, newest('.css')));
      return { ok: true, out, log: `${aot.log}${done.log}` };
    }
    const built = run(resolve(dir), 'bun', ['build', './src/index.html', '--outdir', 'dist', '--minify'], { NODE_ENV: 'production' });
    return { ok: built.ok, out, log: built.log };
  },
};

export default driver;
