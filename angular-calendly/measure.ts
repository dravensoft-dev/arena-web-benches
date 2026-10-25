/* The Angular builder part of this half's measuring. The Angular page gives no config of its own, so `recipe` is
 * `ng build --base-href ./` and `plain` equals it; the rows are the claims the page makes about the builder. `bun run
 * measure` builds each variant at a scratch copy of this half and writes `bundlers-result.json`. */

import { arenaInMain, measureMain, oneStylesFile, row, sideEffectsFalse } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The Angular page prints no config, so no snippet of it is in the half's. */
export const SNIPPETS = {};

export const part: Part = {
  bundler: 'angular',
  pin: '@angular/build',
  config: 'angular.json',
  snippets: SNIPPETS,
  variants: {
    plain: (config) => config,
  },
  observations: [
    row({ id: 'angular.arena-in-main', bundler: 'angular', layers: ['angular'], claim: 'Arena lands in `main`', needs: ['recipe'], check: arenaInMain }),
    row({ id: 'angular.one-styles-file', bundler: 'angular', layers: ['angular'], claim: 'the `styles` option emits one file', needs: ['recipe'], check: oneStylesFile }),
    row({ id: 'angular.side-effects-false', bundler: 'angular', layers: ['angular'], claim: 'the Angular package declares `"sideEffects": false`', needs: [], check: sideEffectsFalse }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
