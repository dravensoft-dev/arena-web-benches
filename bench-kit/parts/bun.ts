/* The Bun part of a half's measuring, and the template of a Bun half, for the rotation that gives a half to `bun build`. No
 * half carries it in rotation 0: `bun run rotate` installs `template()` (config, entry, scripts, devDependencies,
 * `measure.ts`, README, `.gitignore`) into the half it assigns. The page's
 * recipe is the one command (bun-esbuild.md): `bun build ./src/index.html --outdir dist --minify`, no option that keeps
 * Arena apart, so `recipe` is that build and `plain` equals it. `bun build` does not empty its output directory: `bundle`
 * does not either, and the `twice` run builds into the directory `recipe` left. */

import { arenaWithApp, noSprite_, oneCss, outdirKept, row } from '../src/index.ts';
import type { Layer, Part } from '../src/index.ts';
import { COMPILE, ENTRY, MEASURE, PREBUILD, TSCONFIG_APP, finish, gitignore, readme } from './template.ts';
import type { Template } from './template.ts';

/** What a half of this bundler carries, by layer: React's `bundle` script, Angular's `Bun.build` call over `ngc`'s output. */
export const REFERENCE: Record<Layer, { file: string; text: string }> = {
  react: {
    file: 'package.json',
    text: `{
  "scripts": {
    "bundle": "bun build ./src/index.html --outdir dist --minify",
    "build": "bun run bundle"
  }
}
`,
  },
  angular: {
    file: 'bun.config.mjs',
    text: `import linker from '@angular/compiler-cli/linker/babel';
import { transformSync } from '@babel/core';
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

const built = await Bun.build({
  entrypoints: ['./entry.js'],
  outdir: 'dist',
  naming: '[name]-[hash].[ext]',
  minify: true,
  plugins: [angularLinker],
  throw: false,
});
for (const message of built.logs) console.log(String(message));
if (!built.success) process.exit(1);
`,
  },
};

/** The snippets of the bun page, verbatim, by layer: each is in the layer's config exactly once. */
export const SNIPPETS: Record<Layer, Record<string, string>> = {
  react: { bundle: '"bundle": "bun build ./src/index.html --outdir dist --minify",' },
  angular: { minify: 'minify: true,' },
};

export function bunPart(layer: Layer): Part {
  return {
    bundler: 'bun',
    pin: 'bun',
    config: REFERENCE[layer].file,
    snippets: SNIPPETS[layer],
    ...(layer === 'angular' ? { compile: true } : {}),
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
}

/** The `measure.ts` of a Bun half: the part above as the source every half carries. */
export const measureText = (layer: Layer): string => `/* The Bun part of this half's measuring: the page's recipe as verbatim snippets, the variants as rewrites of the
 * config, and the claims the Bun page makes. \`bun run measure\` builds each variant at a scratch copy of this half and
 * writes \`bundlers-result.json\`. */

import { arenaWithApp, measureMain, noSprite_, oneCss, outdirKept, row } from '@benches/kit';
import type { Part } from '@benches/kit';

export const SNIPPETS = ${JSON.stringify(SNIPPETS[layer], null, 2)};

export const part: Part = {
  bundler: 'bun',
  pin: 'bun',
  config: ${JSON.stringify(REFERENCE[layer].file)},
  snippets: SNIPPETS,${layer === 'angular' ? '\n  compile: true,' : ''}
  variants: {
    plain: (config) => config,
    twice: (config) => config,
  },
  observations: [
    row({ id: 'bun.no-js-apart', bundler: 'bun', claim: 'no option keeps Arena in a file of its own', needs: ['recipe'], check: arenaWithApp }),
    row({ id: 'bun.one-css', bundler: 'bun', claim: 'one CSS file for the entry', needs: ['recipe'], check: oneCss('recipe') }),
    row({ id: 'bun.outdir-kept', bundler: 'bun', claim: '\`bun build\` does not empty its output directory', needs: ['twice'], check: outdirKept }),
    noSprite_('bun', 'no file the entry does not import reaches the output'),
  ],
};

if (import.meta.main) await measureMain(import.meta.dir, part);
`;

/** What a Bun half carries: React's `bundle` script is the one command, Angular's is a `Bun.build` call over `ngc`'s output. */
export function template(layer: Layer, pins: Record<string, string>): Template {
  const react = layer === 'react';
  return {
    files: {
      ...(react ? {} : { [REFERENCE.angular.file]: REFERENCE.angular.text, 'entry.js': ENTRY, 'tsconfig.app.json': TSCONFIG_APP }),
      'finish.mjs': finish(layer, !react),
      'measure.ts': measureText(layer),
      'README.md': readme(layer, '[Bun](https://bun.sh) (`bun build`)'),
      '.gitignore': gitignore(layer, !react),
    },
    scripts: {
      prebuild: PREBUILD,
      ...(react ? { bundle: 'bun build ./src/index.html --outdir dist --minify' } : { compile: COMPILE, bundle: `bun ${REFERENCE.angular.file}` }),
      finish: 'node finish.mjs',
      build: react ? 'bun run bundle && bun run finish' : 'bun run compile && bun run bundle && bun run finish',
      measure: MEASURE,
    },
    devDependencies: react ? {} : { '@babel/core': pins['@babel/core']! },
    keep: react ? [] : ['tsconfig.json'],
  };
}
