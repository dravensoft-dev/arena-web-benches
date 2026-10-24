import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { node, pointedPage } from './common.ts';

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

const driver: Driver = {
  id: 'esbuild',
  layers: ['react'],
  out: 'dist',
  probes: [],
  bundle(dir: string, layer: Layer) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    if (layer !== 'react') return { ok: false, out, log: `esbuild builds no ${layer} half yet` };
    writeFileSync(join(dir, CONFIG), reactConfig);
    const run = node(resolve(dir), [CONFIG]);
    if (!run.ok) return { ok: false, out, log: run.log };
    // esbuild writes no page: the entry's `.js` and its one `.css` go into the half's own `index.html`.
    const files = readdirSync(out);
    const script = files.find((name) => /^main-.*\.js$/.test(name));
    if (!script) return { ok: false, out, log: `${run.log}\nno main-*.js in ${out}` };
    writeFileSync(join(out, 'index.html'), pointedPage(dir, script, files.filter((name) => name.endsWith('.css'))));
    return { ok: true, out, log: run.log };
  },
};

export default driver;
