/* The webpack part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of
 * `webpack.config.mjs`, and the claims the webpack page makes. `bun run measure` builds each variant at a scratch copy
 * of this half and writes `bundlers-result.json`. */

import { JS_CLAIM, SHEET_APART, fails, jsRow, measureMain, oneCss, recordSheetAlone, removeSnippet, replaceSnippet, row, sheetRow, spriteAtRoot_ } from '@benches/kit';
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
  // The two groups, each of which names its `type`.
  'arena-group': String.raw`arena: { test: /node_modules[\\/]@dravensoft[\\/]arena-/, name: 'arena', enforce: true, priority: 10, type: /^javascript/ },`,
  // The Angular half's resolver setting: `main.ts` imports the icon list `arena build` writes, a `.ts` module, as `.js`.
  'extension-alias': String.raw`extensionAlias: { '.js': ['.ts', '.js'] },`,
  'sheet-group': String.raw`arenaSheet: { test: /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/, name: 'arena-sheet', enforce: true, priority: 10, type: /^css/ },`,
};

/** What webpack needs to take CSS at all, which the page's JS config does not carry. */
const CSS = '    experiments: { css: true },\n';

/** The page's JS-only config (`js-recipe`), whose `arena` group names its `type` (D13). */
const JS_APART = String.raw`    ${SNIPPETS.files}
    optimization: { splitChunks: { chunks: 'all', cacheGroups: {
      arena: { test: /node_modules[\\/]@dravensoft[\\/]arena-/, name: 'arena', enforce: true, type: /^javascript/ },
    } } },
`;

const untyped = (config: string): string => replaceSnippet(
  replaceSnippet(config, 'arena-group', SNIPPETS['arena-group'], `    ${SNIPPETS['arena-group'].replace(', type: /^javascript/', '')}\n`),
  'sheet-group', SNIPPETS['sheet-group'], `    ${SNIPPETS['sheet-group'].replace(', type: /^css/', '')}\n`);

export const part: Part = {
  bundler: 'webpack',
  pin: 'webpack',
  config: 'webpack.config.mjs',
  snippets: SNIPPETS,
  variants: {
    plain: (config) => removeSnippet(replaceSnippet(config, 'sheet', SNIPPETS.sheet, CSS), 'files', SNIPPETS.files),
    'js-recipe': (config) => replaceSnippet(config, 'sheet', SNIPPETS.sheet, `${CSS}${JS_APART}`),
    'untyped-group': untyped,
    'no-extension-alias': (config) => removeSnippet(config, 'extension-alias', SNIPPETS['extension-alias']),
  },
  observations: [
    jsRow('webpack', JS_CLAIM('`splitChunks.cacheGroups`')),
    spriteAtRoot_('webpack', 'after the recipe the root of the output holds `icons-*.svg`, copied by the config'),
    sheetRow('webpack', SHEET_APART),
    row({ id: 'webpack.one-css-without', bundler: 'webpack', claim: 'without the sheet config, one CSS file for the entry', needs: ['plain'], check: oneCss('plain') }),
    row({ id: 'webpack.group-needs-type', bundler: 'webpack', claim: 'without `type`, where the sheet goes', expect: 'record', needs: ['untyped-group'], check: recordSheetAlone('untyped-group') }),
    row({ id: 'webpack.extension-alias', bundler: 'webpack', layers: ['angular'], claim: 'without `resolve.extensionAlias`, the build cannot resolve `main.ts`\'s import of `./arena.icons.generated.js`', needs: ['no-extension-alias'], check: fails('no-extension-alias', "Can't resolve './arena.icons.generated.js'") }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
