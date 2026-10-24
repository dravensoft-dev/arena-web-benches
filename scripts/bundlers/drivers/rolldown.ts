import { rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { COMMON_URL, node } from './common.ts';

const CONFIG = '.bundler.rolldown.mjs';

/** The `output` the page gives rolldown (rollup.md, "How do I keep Arena's JS in a chunk of its own?"), verbatim. */
const RECIPE_OUTPUT = `{ codeSplitting: { groups: [
  { name: 'arena', test: /node_modules[\\\\/]@dravensoft[\\\\/]arena-/, priority: 10 },
] } }`;

/** The React half's config: rolldown reads TS and TSX itself; every `.css` import is an empty module (unless the probe keeps it). */
function reactConfig(output: string, css: boolean): string {
  return `import { rolldown } from 'rolldown';
import { emptyCss, htmlPage } from ${JSON.stringify(COMMON_URL)};

const bundle = await rolldown({
  input: { main: 'src/Main.tsx' },
  platform: 'browser',
  transform: { define: { 'process.env.NODE_ENV': '"production"' } },
  plugins: [${css ? 'emptyCss(), ' : ''}htmlPage(process.cwd(), 'main')],
});
await bundle.write({ dir: 'dist', format: 'es', minify: true, ...${output} });
await bundle.close();
`;
}

const driver: Driver = {
  id: 'rolldown',
  layers: ['react'],
  out: 'dist',
  probes: ['css-import'],
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    if (layer !== 'react') return { ok: false, out, log: `rolldown builds no ${layer} half yet` };
    writeFileSync(join(dir, CONFIG), reactConfig(variant === 'recipe' ? RECIPE_OUTPUT : '{}', variant !== 'css-import'));
    const run = node(resolve(dir), [CONFIG]);
    return { ok: run.ok, out, log: run.log };
  },
};

export default driver;
