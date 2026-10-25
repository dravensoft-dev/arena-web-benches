import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { compileAot } from '../../../bench-kit/src/angular-link.ts';
import { HOOKS_URL } from './angular-hooks.ts';
import { angularEntry, angularPage, node, pointedPage } from './common.ts';

const CONFIG = '.bundler.esbuild.mjs';

/**
 * The React half through esbuild's API: one entry, splitting on (the page's "with splitting too"), CSS imported from
 * the entry, so the sheets land in one `.css`. The page gives no config of its own: `recipe` is this build and `plain`
 * equals it (F7).
 */
const reactConfig = `import { build } from 'esbuild';

await build({
  entryPoints: { main: 'src/Main.tsx' },
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: 'dist',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[hash]',
  assetNames: '[name]-[hash]',
  minify: true,
  target: 'es2022',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
});
`;

/**
 * The Angular half: the same build over what `ngc` compiled (AOT), the linker in an `onLoad` plugin. `recipe` defines
 * `ngDevMode` as `false` (esbuild.md: an Angular bundle defines it itself); probe `no-define` leaves it out.
 */
function angularConfig(dir: string, defineDevMode: boolean): string {
  return `import { build } from 'esbuild';
import { buildLinker } from ${JSON.stringify(HOOKS_URL)};

await build({
  entryPoints: { main: ${JSON.stringify(angularEntry(dir))} },
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: 'dist',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[hash]',
  assetNames: '[name]-[hash]',
  minify: true,
  target: 'es2022',
  plugins: [buildLinker(process.cwd())],
  define: { 'process.env.NODE_ENV': '"production"'${defineDevMode ? ", ngDevMode: 'false'" : ''} },
  logLevel: 'warning',
});
`;
}

const driver: Driver = {
  id: 'esbuild',
  layers: ['react', 'angular'],
  out: 'dist',
  probes: ['no-define'],
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    if (layer === 'react' && variant === 'no-define') return { ok: false, out, log: 'no-define is an Angular probe: a React bundle has no ngDevMode' };
    let compiled = '';
    if (layer === 'angular') {
      const aot = compileAot(dir);
      if (!aot.ok) return { ok: false, out, log: aot.log };
      compiled = aot.log;
    }
    writeFileSync(join(dir, CONFIG), layer === 'react' ? reactConfig : angularConfig(dir, variant !== 'no-define'));
    const done = node(resolve(dir), [CONFIG]);
    const run = { ok: done.ok, log: compiled + done.log };
    if (!run.ok) return { ok: false, out, log: run.log };
    // esbuild writes no page: the entry's `.js` and its one `.css` go into the half's own `index.html`.
    const files = readdirSync(out);
    const script = files.find((name) => /^main-.*\.js$/.test(name));
    if (!script) return { ok: false, out, log: `${run.log}\nno main-*.js in ${out}` };
    const sheets = files.filter((name) => name.endsWith('.css'));
    writeFileSync(join(out, 'index.html'), layer === 'react' ? pointedPage(dir, script, sheets) : angularPage(dir, script, sheets));
    return { ok: true, out, log: run.log };
  },
};

export default driver;
