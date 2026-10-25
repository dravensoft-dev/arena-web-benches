/* The rspack part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of
 * `rspack.config.mjs`, and the claims the webpack page makes about rspack. `bun run measure` builds each variant at a
 * scratch copy of this half and writes `bundlers-result.json`. */

import { JS_CLAIM, SHEET_APART, fails, jsRow, measureMain, recordSheetAlone, removeSnippet, replaceSnippet, row, sheetRow } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The snippets of the webpack page, verbatim: each is in the config exactly once. */
export const SNIPPETS = {
  // webpack.md, "How do I keep Arena's JS in a chunk of its own?": the file names.
  files: String.raw`output: { filename: '[name]-[contenthash:8].js', chunkFilename: '[name]-[contenthash:8].js' },`,
  // The same page, "How do I keep the package sheet in a file of its own?".
  sheet: String.raw`experiments: { css: true },
output: { cssFilename: '[name]-[contenthash:8].css', cssChunkFilename: '[name]-[contenthash:8].css' },
optimization: { splitChunks: { chunks: 'all', cacheGroups: {
  default: false,
  defaultVendors: false,
  react: { test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, name: 'react', enforce: true, priority: 20 },
  arena: { test: /node_modules[\\/]@dravensoft[\\/]arena-/, name: 'arena', enforce: true, priority: 10, type: /^javascript/ },
  arenaSheet: { test: /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/, name: 'arena-sheet', enforce: true, priority: 10, type: /^css/ },
} } },`,
  // rspack's one added rule.
  'css-auto': String.raw`module: { rules: [{ test: /\.css$/, type: 'css/auto' }] },`,
};

/** The page's JS-only config (`js-recipe`), whose `arena` group names its `type` (D13). */
const JS_APART = String.raw`    ${SNIPPETS.files}
    optimization: { splitChunks: { chunks: 'all', cacheGroups: {
      arena: { test: /node_modules[\\/]@dravensoft[\\/]arena-/, name: 'arena', enforce: true, type: /^javascript/ },
    } } },
`;

export const part: Part = {
  bundler: 'rspack',
  pin: '@rspack/core',
  config: 'rspack.config.mjs',
  snippets: SNIPPETS,
  variants: {
    // The rule stays in every variant but `no-css-auto`: rspack takes no CSS without it.
    plain: (config) => removeSnippet(removeSnippet(config, 'sheet', SNIPPETS.sheet), 'files', SNIPPETS.files),
    'js-recipe': (config) => replaceSnippet(config, 'sheet', SNIPPETS.sheet, JS_APART),
    'no-css-auto': (config) => replaceSnippet(config, 'css-auto', SNIPPETS['css-auto'], '  module: { rules: [] },\n'),
  },
  observations: [
    jsRow('rspack', 'the webpack recipe keeps Arena\'s JS apart, unchanged'),
    sheetRow('rspack', `${SHEET_APART}, with the \`css/auto\` rule and, on Angular, the sheet as its own \`styles\` entry`),
    row({ id: 'rspack.needs-css-auto', bundler: 'rspack', layers: ['react'], claim: 'on React, without the `css/auto` rule the build stops on the package sheet\'s `@layer properties;`', needs: ['no-css-auto'], check: fails('no-css-auto', '@layer properties') }),
    row({ id: 'rspack.css-auto-angular', bundler: 'rspack', layers: ['angular'], claim: 'on Angular through @nx/angular-rspack the `styles` entry places the sheet without `css/auto`', expect: 'record', needs: ['no-css-auto'], check: recordSheetAlone('no-css-auto') }),
    row({ id: 'rspack.extension-alias', bundler: 'rspack', layers: ['angular'], claim: 'without `resolve.extensionAlias`, the build cannot resolve `main.ts`\'s import of `./arena.icons.generated.js`', needs: ['no-extension-alias'], check: fails('no-extension-alias', "Can't resolve './arena.icons.generated.js'") }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
