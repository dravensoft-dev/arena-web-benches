/* The observation catalogue of the bundlers no half carries its own part for: every claim the bundler pages make, as a
 * row over built outputs (F6, F6b). A half that carries its own measuring (`measure.ts`) holds its bundler's rows itself.
 * The row factories and the checks come from the kit. */

import {
  arenaInMain, arenaWithApp, fails, jsRow, ngDevMode, noSprite_, oneCss, oneStylesFile, outdirKept,
  recordJsApart, recordSheetAlone, recordSheetApart, recordSprite, row, sheetRow, sideEffectsFalse, JS_CLAIM, SHEET_APART,
} from '../../bench-kit/src/observations.ts';
export { judge } from '../../bench-kit/src/observations.ts';
export type { Built, Context, Judgement, Observation, RunKey, Verdict } from '../../bench-kit/src/observations.ts';
import type { Observation } from '../../bench-kit/src/observations.ts';

export const OBSERVATIONS: Observation[] = [

  jsRow('webpack', JS_CLAIM('`splitChunks.cacheGroups`')),
  sheetRow('webpack', SHEET_APART),
  row({ id: 'webpack.one-css-without', bundler: 'webpack', claim: 'without the sheet config, one CSS file for the entry', needs: ['plain'], check: oneCss('plain') }),
  row({ id: 'webpack.group-needs-type', bundler: 'webpack', claim: 'without `type`, where the sheet goes', expect: 'record', needs: ['untyped-group'], check: recordSheetAlone('untyped-group') }),

  jsRow('rspack', 'the webpack recipe keeps Arena\'s JS apart, unchanged'),
  sheetRow('rspack', `${SHEET_APART}, with the \`css/auto\` rule and, on Angular, the sheet as its own \`styles\` entry`),
  row({ id: 'rspack.needs-css-auto', bundler: 'rspack', layers: ['react'], claim: 'on React, without the `css/auto` rule the build stops on the package sheet\'s `@layer properties;`', needs: ['no-css-auto'], check: fails('no-css-auto', '@layer properties') }),
  row({ id: 'rspack.css-auto-angular', bundler: 'rspack', layers: ['angular'], claim: 'on Angular through @nx/angular-rspack the `styles` entry places the sheet without `css/auto`', expect: 'record', needs: ['no-css-auto'], check: recordSheetAlone('no-css-auto') }),

  row({ id: 'angular.arena-in-main', bundler: 'angular', layers: ['angular'], claim: 'Arena lands in `main`', needs: ['recipe'], check: arenaInMain }),
  row({ id: 'angular.one-styles-file', bundler: 'angular', layers: ['angular'], claim: 'the `styles` option emits one file', needs: ['recipe'], check: oneStylesFile }),
  row({ id: 'angular.side-effects-false', bundler: 'angular', layers: ['angular'], claim: 'the Angular package declares `"sideEffects": false`', needs: [], check: sideEffectsFalse }),

  row({ id: 'bun.no-js-apart', bundler: 'bun', claim: 'no option keeps Arena in a file of its own', needs: ['recipe'], check: arenaWithApp }),
  row({ id: 'bun.one-css', bundler: 'bun', claim: 'one CSS file for the entry', needs: ['recipe'], check: oneCss('recipe') }),
  row({ id: 'bun.outdir-kept', bundler: 'bun', claim: '`bun build` does not empty its output directory', needs: ['twice'], check: outdirKept }),
  noSprite_('bun', 'no file the entry does not import reaches the output'),

  row({ id: 'esbuild.no-js-apart', bundler: 'esbuild', claim: 'splitting cannot pin a module to a chunk', needs: ['recipe'], check: arenaWithApp }),
  row({ id: 'esbuild.one-css', bundler: 'esbuild', claim: 'one CSS file for the entry, with splitting too', needs: ['recipe'], check: oneCss('recipe') }),
  row({ id: 'esbuild.ng-dev-mode', bundler: 'esbuild', layers: ['angular'], claim: 'an Angular bundle defines `ngDevMode` itself', needs: ['no-define', 'recipe'], check: ngDevMode }),

  row({ id: 'next.js-apart', bundler: 'next', layers: ['react'], claim: 'Next.js picks its chunks itself', expect: 'record', needs: ['recipe'], check: recordJsApart }),
  row({ id: 'next.sheet-apart', bundler: 'next', layers: ['react'], claim: 'not exercised', expect: 'record', needs: ['recipe'], check: recordSheetApart }),
  row({ id: 'next.sprite-public', bundler: 'next', layers: ['react'], claim: 'a sprite copied into `public/` is served at the root under its own name', expect: 'record', needs: ['recipe'], check: recordSprite }),
];

