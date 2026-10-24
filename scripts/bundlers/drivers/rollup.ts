import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { compileAot } from '../angular-link.ts';
import { HOOKS_URL } from './angular-hooks.ts';
import { angularEntry, angularPage, COMMON_URL, node } from './common.ts';

const CONFIG = '.bundler.rollup.mjs';

/** The `output` the page gives rollup (rollup.md, "How do I keep Arena's JS in a chunk of its own?"), verbatim. */
const RECIPE_OUTPUT = `{
  manualChunks: (id) => (id.includes('/node_modules/@dravensoft/arena-') ? 'arena' : undefined),
  entryFileNames: '[name]-[hash].js',
  chunkFileNames: '[name]-[hash].js',
}`;

/** The React half's config: esbuild turns TS and TSX into JS, every `.css` import is an empty module (unless the probe keeps it). */
function reactConfig(output: string, css: boolean): string {
  return `import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { transform } from 'esbuild';
import { emptyCss, htmlPage } from ${JSON.stringify(COMMON_URL)};

const tsx = {
  name: 'bench-tsx',
  async transform(code, id) {
    if (!/\\.tsx?$/.test(id)) return null;
    const out = await transform(code, { loader: id.endsWith('x') ? 'tsx' : 'ts', jsx: 'automatic', format: 'esm', target: 'es2022', sourcefile: id });
    return { code: out.code, map: null };
  },
};

const bundle = await rollup({
  input: { main: 'src/Main.tsx' },
  plugins: [
    ${css ? 'emptyCss(),' : ''}
    nodeResolve({ browser: true, extensions: ['.tsx', '.ts', '.js', '.mjs', '.json'] }),
    commonjs(),
    replace({ preventAssignment: true, values: { 'process.env.NODE_ENV': '"production"' } }),
    tsx,
    terser(),
    htmlPage(process.cwd(), 'main'),
  ],
});
await bundle.write({ dir: 'dist', format: 'es', ...${output} });
await bundle.close();
`;
}

/**
 * The Angular half: `ngc` compiled it (AOT), so the entry is the JS `compileAot` wrote, and the linker runs in a
 * `transform` hook (F5 allows it where `@rollup/plugin-babel` is not wanted: one Babel call for the five drivers).
 * Every `.css` is an empty module, as for React, and the caller links the sheets.
 */
function angularConfig(dir: string, output: string, css: boolean): string {
  return `import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { emptyCss } from ${JSON.stringify(COMMON_URL)};
import { rollupLinker } from ${JSON.stringify(HOOKS_URL)};

const bundle = await rollup({
  input: { main: ${JSON.stringify(angularEntry(dir))} },
  plugins: [
    ${css ? 'emptyCss(),' : ''}
    nodeResolve({ browser: true, extensions: ['.js', '.mjs', '.json'] }),
    commonjs(),
    replace({ preventAssignment: true, values: { 'process.env.NODE_ENV': '"production"' } }),
    rollupLinker(process.cwd()),
    terser(),
  ],
});
await bundle.write({ dir: 'dist', format: 'es', ...${output} });
await bundle.close();
`;
}

const driver: Driver = {
  id: 'rollup',
  layers: ['react', 'angular'],
  out: 'dist',
  probes: ['css-import'],
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    const recipe = variant === 'recipe';
    if (layer === 'angular') {
      const aot = compileAot(dir);
      if (!aot.ok) return { ok: false, out, log: aot.log };
      writeFileSync(join(dir, CONFIG), angularConfig(dir, recipe ? RECIPE_OUTPUT : '{}', variant !== 'css-import'));
      const built = node(resolve(dir), [CONFIG]);
      if (!built.ok) return { ok: false, out, log: `${aot.log}${built.log}` };
      // Rollup writes no page: the half's own, with the entry chunk.
      const script = readdirSync(out).find((name) => /^main(-.*)?\.js$/.test(name));
      if (!script) return { ok: false, out, log: `${built.log}\nno main*.js in ${out}` };
      writeFileSync(join(out, 'index.html'), angularPage(dir, script));
      return { ok: true, out, log: `${aot.log}${built.log}` };
    }
    writeFileSync(join(dir, CONFIG), reactConfig(recipe ? RECIPE_OUTPUT : '{}', variant !== 'css-import'));
    const run = node(resolve(dir), [CONFIG]);
    return { ok: run.ok, out, log: run.log };
  },
};

export default driver;
