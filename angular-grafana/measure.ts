/* The rolldown part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of
 * `rolldown.config.mjs`, and the claims the rollup page makes about rolldown. `bun run measure` builds each variant at a
 * scratch copy of this half and writes `bundlers-result.json`. */

import { JS_CLAIM, fails, jsRow, linkedSheets, measureMain, noSprite_, removeSnippet, row } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The snippets of the rollup page for rolldown, verbatim: each is in the config exactly once. */
export const SNIPPETS = {
  // rollup.md, "How do I keep Arena's JS in a chunk of its own?": `output.codeSplitting.groups`.
  output: String.raw`codeSplitting: { groups: [
  { name: 'arena', test: /node_modules[\\/]@dravensoft[\\/]arena-/, priority: 10 },
] },`,
  // The empty module every `.css` import resolves to.
  'empty-css': 'emptyCss(),',
};

export const part: Part = {
  bundler: 'rolldown',
  compile: true,
  pin: 'rolldown',
  config: 'rolldown.config.mjs',
  snippets: SNIPPETS,
  variants: {
    plain: (config) => removeSnippet(config, 'output', SNIPPETS.output),
    'css-import': (config) => removeSnippet(config, 'empty-css', SNIPPETS['empty-css']),
  },
  observations: [
    jsRow('rolldown', JS_CLAIM('`codeSplitting.groups`')),
    row({ id: 'rolldown.css-refused', bundler: 'rolldown', claim: 'the build stops on a CSS import with "Bundling CSS is no longer supported (experimental support has been removed)"', needs: ['css-import'], check: fails('css-import', 'Bundling CSS is no longer supported (experimental support has been removed)') }),
    noSprite_('rolldown', 'rolldown moves no file it does not import'),
    row({ id: 'rolldown.linked-sheets', bundler: 'rolldown', claim: 'the package sheet `arena build` writes holds no `@import` of a package specifier, so a page links it as written', expect: 'record', needs: [], check: linkedSheets }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
