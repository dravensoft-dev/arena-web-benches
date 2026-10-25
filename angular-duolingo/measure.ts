/* The Bun part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of the
 * config, and the claims the Bun page makes. `bun run measure` builds each variant at a scratch copy of this half and
 * writes `bundlers-result.json`. */

import { arenaWithApp, measureMain, noSprite_, oneCss, outdirKept, row } from '@benches/kit';
import type { Part } from '@benches/kit';

export const SNIPPETS = {
  "minify": "minify: true,"
};

export const part: Part = {
  bundler: 'bun',
  pin: 'bun',
  config: "bun.config.mjs",
  snippets: SNIPPETS,
  compile: true,
  variants: {
    plain: (config) => config,
    twice: (config) => config,
  },
  observations: [
    row({ id: 'bun.no-js-apart', bundler: 'bun', claim: 'no option keeps Arena in a file of its own', needs: ['recipe'], check: arenaWithApp }),
    row({ id: 'bun.one-css', bundler: 'bun', claim: 'one CSS file for the entry', needs: ['recipe'], check: oneCss('recipe') }),
    row({ id: 'bun.outdir-kept', bundler: 'bun', claim: '`bun build` does not empty its output directory', needs: ['twice'], check: outdirKept }),
    noSprite_('bun', 'no file the entry does not import reaches the output'),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
