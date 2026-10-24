import { rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { COMMON_URL, node } from './common.ts';

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

const driver: Driver = {
  id: 'rollup',
  layers: ['react'],
  out: 'dist',
  probes: ['css-import'],
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    if (layer !== 'react') return { ok: false, out, log: `rollup builds no ${layer} half yet` };
    const text = reactConfig(variant === 'recipe' ? RECIPE_OUTPUT : '{}', variant !== 'css-import');
    writeFileSync(join(dir, CONFIG), text);
    const run = node(resolve(dir), [CONFIG]);
    return { ok: run.ok, out, log: run.log };
  },
};

export default driver;
