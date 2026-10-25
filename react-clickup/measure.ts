/* The esbuild part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of the
 * config, and the claims the esbuild page makes. `bun run measure` builds each variant at a scratch copy of this half and
 * writes `bundlers-result.json`. */

import { arenaWithApp, measureMain, ngDevMode, oneCss, removeSnippet, row } from '@benches/kit';
import type { Part } from '@benches/kit';

export const SNIPPETS = {
  "splitting": "splitting: true,"
};

export const part: Part = {
  bundler: 'esbuild',
  pin: 'esbuild',
  config: "esbuild.config.mjs",
  snippets: SNIPPETS,
  variants: {
    plain: (config) => config,
  },
  observations: [
    row({ id: 'esbuild.no-js-apart', bundler: 'esbuild', claim: 'splitting cannot pin a module to a chunk', needs: ['recipe'], check: arenaWithApp }),
    row({ id: 'esbuild.one-css', bundler: 'esbuild', claim: 'one CSS file for the entry, with splitting too', needs: ['recipe'], check: oneCss('recipe') }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
