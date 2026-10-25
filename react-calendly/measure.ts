/* The Next.js part of this half's measuring. The Next.js page gives no recipe, so `recipe` is this build and `plain`
 * equals it; the rows record what Next.js does with Arena's JS, the package sheet and the sprite. `bun run measure`
 * builds each variant at a scratch copy of this half and writes `bundlers-result.json`. */

import { measureMain, recordJsApart, recordSheetApart, recordSprite, row } from '@benches/kit';
import type { Part } from '@benches/kit';

/** The Next.js page prints no config, so no snippet of it is in the half's. */
export const SNIPPETS = {};

export const part: Part = {
  bundler: 'next',
  pin: 'next',
  hardlinkModules: true,
  config: 'next.config.mjs',
  snippets: SNIPPETS,
  variants: {
    plain: (config) => config,
  },
  observations: [
    row({ id: 'next.js-apart', bundler: 'next', layers: ['react'], claim: 'Next.js picks its chunks itself', expect: 'record', needs: ['recipe'], check: recordJsApart }),
    row({ id: 'next.sheet-apart', bundler: 'next', layers: ['react'], claim: 'not exercised', expect: 'record', needs: ['recipe'], check: recordSheetApart }),
    row({ id: 'next.sprite-public', bundler: 'next', layers: ['react'], claim: 'a sprite copied into `public/` is served at the root under its own name', expect: 'record', needs: ['recipe'], check: recordSprite }),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
