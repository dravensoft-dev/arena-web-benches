import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { BundlerId, Driver, Layer, Probe } from '../types.ts';
import { pathToFileURL } from 'node:url';
import { node, rootOf } from './common.ts';

/** What differs between the two Vite drivers: the package that runs, and the `build.rollupOptions.output` the page gives. */
export type ViteFlavour = {
  id: Extract<BundlerId, 'vite7' | 'vite8'>;
  /** The package under the root's `node_modules` whose `bin/vite.js` runs. */
  pkg: string;
  /** The `output` option as the page writes it, per variant that names Arena. */
  output: { recipe: string; 'js-only-test': string; 'js-recipe': string };
};

/**
 * The `plugins` entry of the page's sheet config (rollup.md, "How do I keep the package sheet in a file of its own?"),
 * Vite 7 and Vite 8 alike, verbatim. On Angular it takes the package sheet's `@import` out of `src/styles.css` and links
 * the sheet from the page; on React it does nothing (no `src/styles.css`, no `styles.css` in the page).
 */
export const ARENA_SHEET_PLUGIN = String.raw`{
  name: 'arena-sheet',
  enforce: 'pre',
  transform: (code, id) => (/[\\/]src[\\/]styles\.css$/.test(id)
    ? code.replace(/@import\s+'\.\/arena\.package\.generated\.css';\s*/, '') : null),
  transformIndexHtml: { order: 'pre', handler: (html) => (/styles\.css/.test(html)
    ? [{ tag: 'link', attrs: { rel: 'stylesheet', href: '/src/arena.package.generated.css' }, injectTo: 'head-prepend' }]
    : []) },
}`;

const configName = (id: string): string => `.bundler.${id}.config.mjs`;

/**
 * Analog imports `vite` and `@angular/compiler-cli` from where it is installed, in the root's `node_modules/.bun`,
 * where neither the half's Angular packages nor the Vite this driver names are. This resolve hook sends `vite`
 * to the Vite the driver runs, and `@angular/*` and `typescript` to the half, so one Vite and one Angular answer.
 */
const PRELOAD = `import { registerHooks } from 'node:module';
const { dir, vite } = JSON.parse(process.env.BENCH_HOOKS);
const said = new Set();
registerHooks({
  resolve(specifier, context, next) {
    if ((context.parentURL ?? '').includes('/@analogjs')) {
      if (specifier === 'vite' || specifier === 'typescript' || specifier.startsWith('@angular/')) {
        const found = next(specifier === 'vite' ? vite : specifier, { ...context, parentURL: dir + '/.bundler.mjs' });
        if (specifier === 'vite' && !said.has(found.url)) {
          said.add(found.url);
          console.log('bench: the Angular plugin imports vite from ' + found.url);
        }
        return found;
      }
    }
    return next(specifier, context);
  },
});
`;

/** `src/index.html` of an Angular half with the base, the styles and the entry, as `ng build --base-href ./` and Vite want them. */
function angularPage(dir: string): string {
  const html = readFileSync(join(dir, 'src', 'index.html'), 'utf8');
  return html
    .replace('<head>', () => '<head>\n    <base href="./" />')
    .replace('</head>', () => '  <link rel="stylesheet" href="../src/styles.css" />\n  </head>')
    .replace('</body>', () => '  <script type="module" src="../src/main.ts"></script>\n  </body>');
}

function config(flavour: ViteFlavour, layer: Layer, variant: 'plain' | 'recipe' | Probe, dir: string): string {
  const output = variant === 'recipe' ? flavour.output.recipe : variant === 'js-only-test' || variant === 'js-recipe' ? flavour.output[variant] : '';
  const recipePlugin = variant === 'recipe' ? ARENA_SHEET_PLUGIN : '';
  const rollupOptions = output ? `rollupOptions: { output: ${output} }, ` : '';
  if (layer === 'react') {
    return `export default {
  root: 'src',
  base: './',
  publicDir: false,
  plugins: [${recipePlugin}],
  build: { ${rollupOptions}outDir: '../dist', emptyOutDir: true },
};
`;
  }
  const here = JSON.stringify(resolve(dir));
  // Analog 2.9.2 starts @angular/build's hash only for an Angular that reports 22.2 or later, and the halves'
  // @angular/compiler-cli is 22.1.4 beside @angular/build 22.2.4, so the config starts it.
  return `import angular from '@analogjs/vite-plugin-angular';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const here = ${here};
const require = createRequire(here + '/package.json');
await require(join(dirname(require.resolve('@angular/build/package.json')), 'src/utils/hash.js')).initializeHash();
export default {
  root: here + '/.bundler.vite',
  base: './',
  publicDir: false,
  plugins: [angular({ tsconfig: here + '/tsconfig.json', workspaceRoot: here })${recipePlugin ? `, ${recipePlugin}` : ''}],
  build: { ${rollupOptions}outDir: '../dist', emptyOutDir: true, target: 'es2022' },
};
`;
}

export function viteDriver(flavour: ViteFlavour): Driver {
  return {
    id: flavour.id,
    layers: ['react', 'angular'],
    out: 'dist',
    probes: ['js-only-test', 'js-recipe'],
    linksSheets: false,
    bundle(dir: string, layer: Layer, variant) {
      const out = join(dir, 'dist');
      rmSync(out, { recursive: true, force: true });
      const name = configName(flavour.id);
      writeFileSync(join(dir, name), config(flavour, layer, variant, dir));
      const args = [join(rootOf(dir), 'node_modules', flavour.pkg, 'bin', 'vite.js'), 'build', '--config', name];
      let env: Record<string, string> = {};
      if (layer === 'angular') {
        mkdirSync(join(dir, '.bundler.vite'), { recursive: true });
        writeFileSync(join(dir, '.bundler.vite', 'index.html'), angularPage(dir));
        // Plumbing of this driver, not of the recipe: the page sits in the ignored `.bundler.vite/`, so the `/src/...` link the
        // recipe's plugin writes (an adopter's page sits at the project root) needs `src` beside it.
        rmSync(join(dir, '.bundler.vite', 'src'), { recursive: true, force: true });
        symlinkSync('../src', join(dir, '.bundler.vite', 'src'));
        writeFileSync(join(dir, '.bundler.preload.mjs'), PRELOAD);
        args.unshift('--import', './.bundler.preload.mjs');
        env = { BENCH_HOOKS: JSON.stringify({ dir: pathToFileURL(resolve(dir)).href, vite: flavour.pkg }) };
      }
      const run = node(resolve(dir), args, env);
      return { ok: run.ok, out, log: run.log };
    },
  };
}
