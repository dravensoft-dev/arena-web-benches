/* The Vite 8 part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of
 * `vite.config.mjs`, and the claims the rollup page makes about Vite 8. `bun run measure` builds each variant at a
 * scratch copy of this half and writes `bundlers-result.json`. */

import { JS_CLAIM, SHEET_APART, jsRow, measureMain, noSheetAlone, removeSnippet, replaceSnippet, row, sheetRow } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The snippets of the rollup page for Vite 8, verbatim: each is in the config exactly once. */
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
  output: String.raw`codeSplitting: { groups: [
  { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
  { name: 'arena', test: /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/, priority: 10 },
] },`,
};

/** "How do I keep Arena's JS in a chunk of its own?": the group that tests `node_modules` only, which is the page's `js-recipe`. */
const JS_ONLY = String.raw`        codeSplitting: { groups: [
          { name: 'arena', test: /node_modules[\\/]@dravensoft[\\/]arena-/, priority: 10 },
        ] },
`;

const jsOnly = (config: string): string => replaceSnippet(removeSnippet(config, 'plugin', SNIPPETS.plugin), 'output', SNIPPETS.output, JS_ONLY);

export const part: Part = {
  bundler: 'vite8',
  pin: 'vite',
  config: 'vite.config.mjs',
  snippets: SNIPPETS,
  variants: {
    plain: (config) => removeSnippet(removeSnippet(config, 'plugin', SNIPPETS.plugin), 'output', SNIPPETS.output),
    'js-recipe': jsOnly,
    'js-only-test': jsOnly,
  },
  observations: [
    jsRow('vite8', JS_CLAIM('`codeSplitting.groups`')),
    sheetRow('vite8', SHEET_APART),
    row({ id: 'vite8.sheet-by-name', bundler: 'vite8', claim: 'as `vite7.sheet-by-name`', needs: ['js-only-test'], check: noSheetAlone('js-only-test') }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
