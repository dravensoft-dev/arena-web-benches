/* The esbuild part of a half's measuring, and the template of an esbuild half, for the draw that gives a half to esbuild.
 * `bun run rotate` installs `template()` (config, entry, scripts, devDependencies,
 * `measure.ts`, README, `.gitignore`) into the half it assigns. The page's
 * recipe (bun-esbuild.md) is one entry with splitting on, "one CSS file for the entry, with splitting too", and on the
 * Angular layer `define: { ngDevMode: 'false' }`; `recipe` is that build and `plain` equals it. */

import { arenaWithApp, ngDevMode, oneCss, removeSnippet, row } from '../src/index.ts';
import type { Layer, Part } from '../src/index.ts';
import { COMPILE, ENTRY, MEASURE, PREBUILD, TSCONFIG_APP, finish, gitignore, readme } from './template.ts';
import type { Template } from './template.ts';

/** What a half of this bundler carries, by layer: one config over the entry (`src/Main.tsx`, or `ngc`'s output through `entry.js`), and for Angular the linker plugin an adopter writes. */
export const REFERENCE: Record<Layer, { file: string; text: string }> = {
  react: {
    file: 'esbuild.config.mjs',
    text: `import { build } from 'esbuild';

await build({
  entryPoints: { main: 'src/Main.tsx' },
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: 'dist',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[hash]',
  assetNames: '[name]-[hash]',
  minify: true,
  target: 'es2022',
  jsx: 'automatic',
  logLevel: 'warning',
});
`,
  },
  angular: {
    file: 'esbuild.config.mjs',
    text: `import linker from '@angular/compiler-cli/linker/babel';
import { transformSync } from '@babel/core';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

// The Angular packages are partially compiled (\`ɵɵngDeclare\`): the linker finishes them, as \`ng build\` does.
const angularLinker = {
  name: 'angular-linker',
  setup(build) {
    build.onLoad({ filter: /[\\\\/]node_modules[\\\\/].*\\.[cm]?js$/ }, (args) => {
      const code = readFileSync(args.path, 'utf8');
      if (!code.includes('ɵɵngDeclare')) return undefined;
      const out = transformSync(code, { filename: args.path, babelrc: false, configFile: false, compact: false, sourceMaps: false, plugins: [linker] });
      return { contents: out.code, loader: 'js' };
    });
  },
};

await build({
  entryPoints: { main: './entry.js' },
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: 'dist',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunk-[hash]',
  assetNames: '[name]-[hash]',
  minify: true,
  target: 'es2022',
  plugins: [angularLinker],
  define: { ngDevMode: 'false' },
  logLevel: 'warning',
});
`,
  },
};

/** The snippets of the esbuild page, verbatim, by layer: each is in the layer's config exactly once. */
export const SNIPPETS: Record<Layer, Record<string, string>> = {
  react: { splitting: 'splitting: true,' },
  angular: { splitting: 'splitting: true,', define: "define: { ngDevMode: 'false' }," },
};

export function esbuildPart(layer: Layer): Part {
  return {
    bundler: 'esbuild',
    pin: 'esbuild',
    config: REFERENCE[layer].file,
    snippets: SNIPPETS[layer],
    ...(layer === 'angular' ? { compile: true } : {}),
    variants: {
      plain: (config) => config,
      ...(layer === 'angular' ? { 'no-define': (config: string) => removeSnippet(config, 'define', SNIPPETS.angular['define']!) } : {}),
    },
    observations: [
      row({ id: 'esbuild.no-js-apart', bundler: 'esbuild', claim: 'splitting cannot pin a module to a chunk', needs: ['recipe'], check: arenaWithApp }),
      row({ id: 'esbuild.one-css', bundler: 'esbuild', claim: 'one CSS file for the entry, with splitting too', needs: ['recipe'], check: oneCss('recipe') }),
      row({ id: 'esbuild.ng-dev-mode', bundler: 'esbuild', layers: ['angular'], claim: 'an Angular bundle defines `ngDevMode` itself', needs: ['no-define', 'recipe'], check: ngDevMode }),
    ],
  };
}

/** The `measure.ts` of an esbuild half: the part above as the source every half carries. */
export const measureText = (layer: Layer): string => `/* The esbuild part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of the
 * config, and the claims the esbuild page makes. \`bun run measure\` builds each variant at a scratch copy of this half and
 * writes \`bundlers-result.json\`. */

import { arenaWithApp, measureMain, ngDevMode, oneCss, removeSnippet, row } from '@benches/kit';
import type { Part } from '@benches/kit';

export const SNIPPETS = ${JSON.stringify(SNIPPETS[layer], null, 2)};

export const part: Part = {
  bundler: 'esbuild',
  pin: 'esbuild',
  config: ${JSON.stringify(REFERENCE[layer].file)},
  snippets: SNIPPETS,${layer === 'angular' ? '\n  compile: true,' : ''}
  variants: {
    plain: (config) => config,${layer === 'angular' ? "\n    'no-define': (config) => removeSnippet(config, 'define', SNIPPETS.define)," : ''}
  },
  observations: [
    row({ id: 'esbuild.no-js-apart', bundler: 'esbuild', claim: 'splitting cannot pin a module to a chunk', needs: ['recipe'], check: arenaWithApp }),
    row({ id: 'esbuild.one-css', bundler: 'esbuild', claim: 'one CSS file for the entry, with splitting too', needs: ['recipe'], check: oneCss('recipe') }),${layer === 'angular' ? "\n    row({ id: 'esbuild.ng-dev-mode', bundler: 'esbuild', layers: ['angular'], claim: 'an Angular bundle defines \\`ngDevMode\\` itself', needs: ['no-define', 'recipe'], check: ngDevMode })," : ''}
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
`;

/** What an esbuild half carries: one config over the entry, a `finish` that writes the page esbuild does not. */
export function template(layer: Layer, pins: Record<string, string>): Template {
  const react = layer === 'react';
  return {
    files: {
      [REFERENCE[layer].file]: REFERENCE[layer].text,
      ...(react ? {} : { 'entry.js': ENTRY, 'tsconfig.app.json': TSCONFIG_APP }),
      'finish.mjs': finish(layer, true),
      'measure.ts': measureText(layer),
      'README.md': readme(layer, '[esbuild](https://esbuild.github.io)'),
      '.gitignore': gitignore(layer, !react),
    },
    scripts: {
      prebuild: PREBUILD,
      ...(react ? {} : { compile: COMPILE }),
      bundle: `node ${REFERENCE[layer].file}`,
      finish: 'node finish.mjs',
      build: react ? 'bun run bundle && bun run finish' : 'bun run compile && bun run bundle && bun run finish',
      measure: MEASURE,
    },
    devDependencies: { esbuild: pins['esbuild']!, ...(react ? {} : { '@babel/core': pins['@babel/core']! }) },
    keep: react ? [] : ['tsconfig.json'],
  };
}
