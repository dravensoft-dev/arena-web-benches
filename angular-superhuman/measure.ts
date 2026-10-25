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
  // The Angular half's resolver setting (inside `rspackConfigOverrides`): `main.ts` imports the icon list `arena build` writes, a `.ts` module, as `.js`.
  'extension-alias': String.raw`resolve: { extensionAlias: { '.js': ['.ts', '.js'] } },`,
  // rspack's one added rule.
  'css-auto': String.raw`module: { rules: [{ test: /\.css$/, type: 'css/auto' }] },`,
  // The same page, on `@nx/angular-rspack`: the sheet's chunk is an entry the builder links.
  styles: String.raw`styles: [{ input: 'src/arena.package.generated.css', bundleName: 'arena-sheet' }, 'src/styles.css'],`,
};

/** The `styles` option without the sheet's entry. */
const PLAIN_STYLES = "      styles: ['src/styles.css'],\n";

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
    // On Angular the rule is part of the sheet config, and nx's own CSS pipeline takes the sheets without it.
    plain: (config) => replaceSnippet(removeSnippet(removeSnippet(removeSnippet(config, 'sheet', SNIPPETS.sheet), 'css-auto', SNIPPETS['css-auto']), 'files', SNIPPETS.files), 'styles', SNIPPETS.styles, PLAIN_STYLES),
    'js-recipe': (config) => replaceSnippet(removeSnippet(replaceSnippet(config, 'sheet', SNIPPETS.sheet, JS_APART), 'css-auto', SNIPPETS['css-auto']), 'styles', SNIPPETS.styles, PLAIN_STYLES),
    'no-css-auto': (config) => removeSnippet(config, 'css-auto', SNIPPETS['css-auto']),
    'no-extension-alias': (config) => removeSnippet(config, 'extension-alias', SNIPPETS['extension-alias']),
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
