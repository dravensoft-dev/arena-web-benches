/* The esbuild part of a half's measuring, for the rotation that gives a half to esbuild. No half carries it in rotation 0:
 * a rotation installs it into the half it assigns (`bun run rotate`), with `REFERENCE`'s config beside it. The page's
 * recipe (bun-esbuild.md) is one entry with splitting on, "one CSS file for the entry, with splitting too", and on the
 * Angular layer `define: { ngDevMode: 'false' }`; `recipe` is that build and `plain` equals it. */

import { arenaWithApp, ngDevMode, oneCss, removeSnippet, row } from '../src/index.ts';
import type { Layer, Part } from '../src/index.ts';

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
