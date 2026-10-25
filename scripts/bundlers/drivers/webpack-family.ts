import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { BundlerId, Driver, Layer, Probe } from '../types.ts';
import { pathToFileURL } from 'node:url';
import { node } from './common.ts';

/** The `file:` URL of angular-link.ts, which the loader written into a half imports. */
const LINK_URL = pathToFileURL(resolve(import.meta.dirname, '..', '..', '..', 'bench-kit', 'src', 'angular-link.ts')).href;

/** What differs between the webpack and rspack drivers. */
export type WebpackFlavour = {
  id: Extract<BundlerId, 'webpack' | 'rspack'>;
  /** The probe that drops the one thing the sheet apart needs from this bundler. */
  probe: Extract<Probe, 'untyped-group' | 'no-css-auto'>;
};

const configName = (id: string): string => `.bundler.${id}.config.mjs`;
const linkerName = (id: string): string => `.bundler.${id}.linker.mjs`;
const pageName = (id: string): string => `.bundler.${id}.html`;

/**
 * The sheet config of the page ("How do I keep the package sheet in a file of its own?"), verbatim as an object body,
 * for webpack and rspack alike, on both halves: two groups, `arena` for the JS and `arenaSheet` for the sheet.
 * rspack adds the `css/auto` rule and, on `@nx/angular-rspack`, the `styles` entry (`ARENA_STYLES`). `untyped` drops
 * the `type` line of both groups, the probe of `webpack.group-needs-type`.
 */
const sheetApart = (untyped: boolean): string => String.raw`experiments: { css: true },
  output: { cssFilename: '[name]-[contenthash:8].css', cssChunkFilename: '[name]-[contenthash:8].css' },
  optimization: { splitChunks: { chunks: 'all', cacheGroups: {
    default: false,
    defaultVendors: false,
    react: { test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, name: 'react', enforce: true, priority: 20 },
    arena: { test: /node_modules[\\/]@dravensoft[\\/]arena-/, name: 'arena', enforce: true, priority: 10${untyped ? '' : ', type: /^javascript/'} },
    arenaSheet: { test: /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/, name: 'arena-sheet', enforce: true, priority: 10${untyped ? '' : ', type: /^css/'} },
  } } },`;

/** The `styles` option of the page's rspack config on `@nx/angular-rspack`, verbatim: the sheet's chunk is an entry the builder links. */
const ARENA_STYLES = String.raw`[{ input: 'src/arena.package.generated.css', bundleName: 'arena-sheet' }, 'src/styles.css']`;

/** The JS config of the same page ("How do I keep Arena's JS in a chunk of its own?"), verbatim: probe `js-recipe`; rspack takes it unchanged. */
const JS_FILE_NAMES = `{ filename: '[name]-[contenthash:8].js', chunkFilename: '[name]-[contenthash:8].js' }`;
const JS_FILES = `output: ${JS_FILE_NAMES},`;
const jsApart = String.raw`${JS_FILES}
  optimization: { splitChunks: { chunks: 'all', cacheGroups: {
    arena: { test: /node_modules[\\/]@dravensoft[\\/]arena-/, name: 'arena', enforce: true, type: /^javascript/ },
  } } },`;

/** rspack's one added rule, verbatim from the page. */
const CSS_AUTO = `{ test: /\\.css$/, type: 'css/auto' }`;

/** The Angular linker over a partially compiled package, as `ng build` runs it, through the benches' one Babel call (`linkPartial`, angular-link.ts); a file without a declaration is returned as it is. */
const LINKER = `import { linkPartial } from ${JSON.stringify(LINK_URL)};
export default function (source, map) {
  const done = this.async();
  try {
    done(null, linkPartial(source, this.resourcePath) ?? source, map);
  } catch (error) {
    done(error);
  }
}
`;

/** `src/index.html` with its module script out: the bundler's HTML plugin writes the script and the sheet links. */
function page(dir: string, layer: Layer): string {
  const html = readFileSync(join(dir, 'src', 'index.html'), 'utf8');
  // `ng build --base-href ./` writes the base an Angular page has none of.
  const based = layer === 'angular' ? html.replace('<head>', () => '<head>\n    <base href="./" />') : html;
  return based.replace(/\s*<script\s+type="module"\s+src="[^"]*"\s*><\/script>/, '');
}

/**
 * The Angular half on rspack: `@nx/angular-rspack` (D1) makes the config from the options `angular.json` gives
 * `@angular/build:application`, and the page's rspack config is its `rspackConfigOverrides`, merged over its own.
 */
function angularRspackConfig(variant: 'plain' | 'recipe' | Probe): string {
  // The page's config is `recipe`; the bench adds the JS file names to its `output`, which already names the CSS files.
  const recipe = variant === 'plain' ? '{}' : `{
  ${variant === 'js-recipe' ? jsApart : sheetApart(false)}
}`;
  // `js-recipe` is the page's JS config, which carries no CSS rule; the sheet config carries `css/auto` (the probe drops it).
  const rules = variant === 'plain' || variant === 'js-recipe' || variant === 'no-css-auto' ? [] : [CSS_AUTO];
  const sheet = variant !== 'plain' && variant !== 'js-recipe';
  // The icon list `arena build` writes is a `.ts` module that `main.ts` imports as `.js`.
  const alias = `resolve: { extensionAlias: { '.js': ['.ts', '.js'] } },`;
  const overrides = variant === 'plain' ? `{ ${alias} }` : `{
  ${alias}
  ...recipe,
  output: { ...${JS_FILE_NAMES}, ...recipe.output },${rules.length > 0 ? `
  module: { rules: [${rules.join(', ')}] },` : ''}
}`;
  return `import { createConfig } from '@nx/angular-rspack';
import { rspack } from '@rspack/core';
import { resolve } from 'node:path';

const root = process.cwd();
const recipe = ${recipe};
const [config] = await createConfig({
  options: {
    root,
    name: 'bench',
    browser: './src/main.ts',
    index: 'src/index.html',
    baseHref: './',
    tsConfig: resolve(root, 'tsconfig.json'),
    polyfills: [],
    styles: ${sheet ? ARENA_STYLES : "['src/styles.css']"},
    assets: [{ glob: '**/*', input: 'public' }, { glob: 'icons-*.svg', input: 'src' }],
    outputPath: { base: 'dist', browser: '.' },
    outputHashing: 'all',
    optimization: true,
    aot: true,
    sourceMap: false,
    extractLicenses: false,
    progress: false,
  },
  rspackConfigOverrides: ${overrides},
});

const compiler = rspack(config);
compiler.run((error, stats) => {
  if (error) {
    console.error(error.stack ?? error);
    process.exit(1);
  }
  console.log(stats.toString({ colors: false, all: false, assets: true, errors: true, errorDetails: true, warnings: true }));
  compiler.close(() => process.exit(stats.hasErrors() ? 1 : 0));
});
`;
}

function config(flavour: WebpackFlavour, layer: Layer, variant: 'plain' | 'recipe' | Probe): string {
  const web = flavour.id === 'webpack';
  if (layer === 'angular' && !web) return angularRspackConfig(variant);
  const rules: string[] = [];
  const plugins: string[] = [];
  let resolveOptions = `extensions: ['.tsx', '.ts', '.js', '.mjs', '.json']`;
  let entry = `['./src/Main.tsx']`;
  if (layer === 'react') {
    rules.push(web
      ? `{ test: /\\.tsx?$/, loader: 'esbuild-loader', options: { loader: 'tsx', jsx: 'automatic', target: 'es2022' } }`
      : `{ test: /\\.tsx?$/, loader: 'builtin:swc-loader', type: 'javascript/auto', options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' } } }`);
  }
  // The recipe is the page's config; `plain` is the bundler's defaults, with only what it needs to take CSS at all.
  let recipe = '';
  let base = '';
  if (variant === 'plain') {
    if (web) base = `experiments: { css: true },`;
    else rules.push(CSS_AUTO);
  } else if (variant === 'js-recipe') {
    recipe = jsApart;
    if (web) base = `experiments: { css: true },`;
    else rules.push(CSS_AUTO);
  } else {
    recipe = sheetApart(variant === 'untyped-group');
    if (!web && variant !== 'no-css-auto') rules.push(CSS_AUTO);
  }
  if (layer === 'angular') {
    entry = `['./src/styles.css', './src/main.ts']`;
    resolveOptions = `extensions: ['.ts', '.mjs', '.js', '.json'], mainFields: ['es2020', 'es2015', 'browser', 'module', 'main'], conditionNames: ['es2020', 'es2015', '...'], extensionAlias: { '.js': ['.ts', '.js'] }`;
    if (web) {
      rules.push(`{ test: /\\.[cm]?ts$/, loader: '@ngtools/webpack' }`);
      rules.push(`{ test: /\\.[cm]?js$/, include: /node_modules/, resolve: { fullySpecified: false }, loader: resolve(${JSON.stringify(linkerName(flavour.id))}) }`);
      plugins.push(`new AngularWebpackPlugin({ tsconfig: resolve('tsconfig.json'), jitMode: false })`);
    }
  }
  const html = `templateContent: readFileSync(${JSON.stringify(pageName(flavour.id))}, 'utf8'), scriptLoading: 'defer', inject: 'head', minify: false`;
  plugins.push(web ? `new HtmlWebpackPlugin({ ${html} })` : `new rspack.HtmlRspackPlugin({ ${html} })`);
  return `import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
${web ? `import webpack from 'webpack';\nimport HtmlWebpackPlugin from 'html-webpack-plugin';${layer === 'angular' ? `\nimport { AngularWebpackPlugin } from '@ngtools/webpack';` : ''}` : `import { rspack } from '@rspack/core';`}

// The page's config (or nothing, for \`plain\`), then what this bench adds to make the half a bundle.
const recipe = {
  ${recipe}
};
// What the bundler needs to take CSS at all, which a page's JS config does not carry.
const base = {
  ${base}
};
const files = {
  ${variant === 'plain' || variant === 'js-recipe' ? '' : JS_FILES}
};

const config = {
  mode: 'production',
  context: process.cwd(),
  target: 'web',
  devtool: false,
  entry: { main: ${entry} },
  resolve: { ${resolveOptions} },
  module: { rules: [
    ${rules.join(',\n    ')}
  ] },
  plugins: [${plugins.join(', ')}],
  // webpack 5.112 reads a template ending in .html itself (experiments.html 'auto') and minifies the page; the HTML plugin writes it here.
  experiments: { ...base.experiments, ...recipe.experiments${web ? ', html: false' : ''} },
  optimization: recipe.optimization,
  output: { path: resolve('dist'), publicPath: './', ...files.output, ...recipe.output },
};

const compiler = ${web ? 'webpack' : 'rspack'}(config);
compiler.run((error, stats) => {
  if (error) {
    console.error(error.stack ?? error);
    process.exit(1);
  }
  console.log(stats.toString({ colors: false, all: false, assets: true, errors: true, errorDetails: true, warnings: true }));
  compiler.close(() => process.exit(stats.hasErrors() ? 1 : 0));
});
`;
}

export function webpackDriver(flavour: WebpackFlavour): Driver {
  return {
    id: flavour.id,
    layers: ['react', 'angular'],
    out: 'dist',
    probes: ['js-recipe', flavour.probe],
    bundle(dir: string, layer: Layer, variant) {
      const out = join(dir, 'dist');
      rmSync(out, { recursive: true, force: true });
      writeFileSync(join(dir, configName(flavour.id)), config(flavour, layer, variant));
      writeFileSync(join(dir, pageName(flavour.id)), page(dir, layer));
      if (layer === 'angular') writeFileSync(join(dir, linkerName(flavour.id)), LINKER);
      const run = node(resolve(dir), [configName(flavour.id)], { NODE_ENV: 'production' });
      // The Angular plugin of rspack writes the builder's bookkeeping beside the page; none of it is browser output.
      for (const name of ['prerendered-routes.json', '3rdpartylicenses.txt']) rmSync(join(out, name), { force: true });
      return { ok: run.ok, out, log: run.log };
    },
  };
}

export default webpackDriver({ id: 'webpack', probe: 'untyped-group' });
