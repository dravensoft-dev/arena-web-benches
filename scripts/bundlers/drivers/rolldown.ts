import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Driver, Layer } from '../types.ts';
import { compileAot } from '../angular-link.ts';
import { HOOKS_URL } from './angular-hooks.ts';
import { angularEntry, angularPage, COMMON_URL, node } from './common.ts';

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

/**
 * The Angular half: `ngc` compiled it (AOT), the linker runs in a `transform` hook (F5), every `.css` is an empty
 * module and the caller links the sheets.
 */
function angularConfig(dir: string, output: string, css: boolean): string {
  return `import { rolldown } from 'rolldown';
import { emptyCss } from ${JSON.stringify(COMMON_URL)};
import { rollupLinker } from ${JSON.stringify(HOOKS_URL)};

const bundle = await rolldown({
  input: { main: ${JSON.stringify(angularEntry(dir))} },
  platform: 'browser',
  transform: { define: { 'process.env.NODE_ENV': '"production"' } },
  plugins: [${css ? 'emptyCss(), ' : ''}rollupLinker(process.cwd())],
});
await bundle.write({ dir: 'dist', format: 'es', minify: true, ...${output} });
await bundle.close();
`;
}

const driver: Driver = {
  id: 'rolldown',
  layers: ['react', 'angular'],
  out: 'dist',
  probes: ['css-import'],
  linksSheets: true,
  bundle(dir: string, layer: Layer, variant) {
    const out = join(dir, 'dist');
    rmSync(out, { recursive: true, force: true });
    const recipe = variant === 'recipe' ? RECIPE_OUTPUT : '{}';
    if (layer === 'angular') {
      const aot = compileAot(dir);
      if (!aot.ok) return { ok: false, out, log: aot.log };
      writeFileSync(join(dir, CONFIG), angularConfig(dir, recipe, variant !== 'css-import'));
      const built = node(resolve(dir), [CONFIG]);
      if (!built.ok) return { ok: false, out, log: `${aot.log}${built.log}` };
      // Rolldown writes no page: the half's own, with the entry chunk.
      const script = readdirSync(out).find((name) => /^main(-.*)?\.js$/.test(name));
      if (!script) return { ok: false, out, log: `${built.log}\nno main*.js in ${out}` };
      writeFileSync(join(out, 'index.html'), angularPage(dir, script));
      return { ok: true, out, log: `${aot.log}${built.log}` };
    }
    writeFileSync(join(dir, CONFIG), reactConfig(recipe, variant !== 'css-import'));
    const run = node(resolve(dir), [CONFIG]);
    return { ok: run.ok, out, log: run.log };
  },
};

export default driver;
