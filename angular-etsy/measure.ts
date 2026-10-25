/* The rollup part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of
 * `rollup.config.mjs`, and the claims the rollup page makes. `bun run measure` builds each variant at a scratch copy of
 * this half and writes `bundlers-result.json`. */

import { JS_CLAIM, fails, jsRow, linkedSheets, measureMain, noSprite_, removeSnippet, row } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The snippets of the rollup page, verbatim: each is in the config exactly once. */
export const SNIPPETS = {
  // rollup.md, "How do I keep Arena's JS in a chunk of its own?"
  output: `manualChunks: (id) => (id.includes('/node_modules/@dravensoft/arena-') ? 'arena' : undefined),
entryFileNames: '[name]-[hash].js',
chunkFileNames: '[name]-[hash].js',`,
  // The empty module every `.css` import resolves to.
  'empty-css': 'emptyCss(),',
};

export const part: Part = {
  bundler: 'rollup',
  compile: true,
  pin: 'rollup',
  config: 'rollup.config.mjs',
  snippets: SNIPPETS,
  variants: {
    plain: (config) => removeSnippet(config, 'output', SNIPPETS.output),
    'css-import': (config) => removeSnippet(config, 'empty-css', SNIPPETS['empty-css']),
  },
  observations: [
    jsRow('rollup', JS_CLAIM('`manualChunks`')),
    row({ id: 'rollup.no-css', bundler: 'rollup', claim: 'rollup imports no CSS by itself', needs: ['css-import'], check: fails('css-import') }),
    noSprite_('rollup', 'rollup moves no file it does not import'),
    row({ id: 'rollup.linked-sheets', bundler: 'rollup', claim: 'link the sheets `arena build` writes from your page', expect: 'record', needs: [], check: linkedSheets }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
