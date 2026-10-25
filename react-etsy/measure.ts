/* The Vite 7 part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of
 * `vite.config.mjs`, and the claims the rollup page makes about Vite 7. `bun run measure` builds each variant at a
 * scratch copy of this half and writes `bundlers-result.json`. */

import { JS_CLAIM, SHEET_APART, jsRow, measureMain, noSheetAlone, removeSnippet, replaceSnippet, row, sheetRow } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The snippets of the rollup page for Vite 7, verbatim: each is in the config exactly once. */
export const SNIPPETS = {
  // rollup.md, "How do I keep the package sheet in a file of its own?": the `plugins` entry that links the package sheet from the page.
  plugin: String.raw`{
  name: 'arena-sheet',
  enforce: 'pre',
  transform: (code, id) => (/[\\/]src[\\/]styles\.css$/.test(id)
    ? code.replace(/@import\s+'\.\/arena\.package\.generated\.css';\s*/, '') : null),
  transformIndexHtml: { order: 'pre', handler: (html) => (/styles\.css/.test(html)
    ? [{ tag: 'link', attrs: { rel: 'stylesheet', href: '/src/arena.package.generated.css' }, injectTo: 'head-prepend' }]
    : []) },
}`,
  // The same section: `build.rollupOptions.output`, with React apart as well.
  output: String.raw`manualChunks: (id) => (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id) ? 'react'
  : /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/.test(id) ? 'arena' : undefined),`,
};

/** "How do I keep Arena's JS in a chunk of its own?": the function that tests `node_modules` only, which is the page's `js-recipe`. */
const JS_ONLY = `        manualChunks: (id) => (id.includes('/node_modules/@dravensoft/arena-') ? 'arena' : undefined),\n`;

const jsOnly = (config: string): string => replaceSnippet(removeSnippet(config, 'plugin', SNIPPETS.plugin), 'output', SNIPPETS.output, JS_ONLY);

export const part: Part = {
  bundler: 'vite7',
  pin: 'vite',
  config: 'vite.config.mjs',
  snippets: SNIPPETS,
  variants: {
    plain: (config) => removeSnippet(removeSnippet(config, 'plugin', SNIPPETS.plugin), 'output', SNIPPETS.output),
    'js-recipe': jsOnly,
    'js-only-test': jsOnly,
  },
  observations: [
    jsRow('vite7', JS_CLAIM('`manualChunks`')),
    sheetRow('vite7', SHEET_APART),
    row({ id: 'vite7.sheet-by-name', bundler: 'vite7', claim: 'a test matching only `node_modules` leaves the sheet with the app\'s CSS', needs: ['js-only-test'], check: noSheetAlone('js-only-test') }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
