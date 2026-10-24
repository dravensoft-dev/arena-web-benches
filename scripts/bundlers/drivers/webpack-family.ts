import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { BundlerId, Driver, Layer, Probe } from '../types.ts';
import { pathToFileURL } from 'node:url';
import { node } from './common.ts';

/** The `file:` URL of angular-link.ts, which the loader written into a half imports. */
const LINK_URL = pathToFileURL(resolve(import.meta.dirname, '..', 'angular-link.ts')).href;

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
 * The config of webpack.md ("How do I keep the package sheet in a file of its own?"), verbatim as an object body;
 * rspack takes it unchanged. Its `arena` group matches by name and takes the JS and the sheet alike, so it is a
 * different config from `jsApart`, not a superset of it. `untyped` drops the `type` line, the one the page says
 * the group needs.
 */
const sheetApart = (untyped: boolean): string => `experiments: { css: true },
  output: { cssFilename: '[name]-[contenthash:8].css', cssChunkFilename: '[name]-[contenthash:8].css' },
  optimization: { splitChunks: { chunks: 'all', cacheGroups: {
    default: false,
    defaultVendors: false,
    react: { test: /node_modules[\\\\/](react|react-dom|scheduler)[\\\\/]/, name: 'react', enforce: true, priority: 20 },
    arena: { test: /arena-react|arena\\.package\\.generated\\.css/, name: 'arena', enforce: true, priority: 10,${untyped ? '' : `
      type: /^(javascript|css)/,`} },
  } } },`;

/** The JS config of the same page ("How do I keep Arena's JS in a chunk of its own?"), verbatim: probe `js-recipe`; rspack takes it unchanged. */
const JS_FILES = `output: { filename: '[name]-[contenthash:8].js', chunkFilename: '[name]-[contenthash:8].js' },`;
const jsApart = `${JS_FILES}
  optimization: { splitChunks: { chunks: 'all', cacheGroups: {
    arena: { test: /node_modules[\\\\/]@dravensoft[\\\\/]arena-/, name: 'arena', enforce: true },
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
  const overrides = variant === 'plain'
    ? '{}'
    : variant === 'js-recipe'
    ? `{
  ${jsApart}
  module: { rules: [${CSS_AUTO}] },
}`
    : `{
  ${sheetApart(false)}
  ${JS_FILES}
  module: { rules: [${variant === 'no-css-auto' ? '' : CSS_AUTO}] },
}`;
  return `import { createConfig } from '@nx/angular-rspack';
import { rspack } from '@rspack/core';
import { resolve } from 'node:path';

const root = process.cwd();
const [config] = await createConfig({
  options: {
    root,
    name: 'bench',
    browser: './src/main.ts',
    index: 'src/index.html',
    baseHref: './',
    tsConfig: resolve(root, 'tsconfig.json'),
    polyfills: [],
    styles: ['src/styles.css'],
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
    resolveOptions = `extensions: ['.ts', '.mjs', '.js', '.json'], mainFields: ['es2020', 'es2015', 'browser', 'module', 'main'], conditionNames: ['es2020', 'es2015', '...']`;
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
      return { ok: run.ok, out, log: run.log };
    },
  };
}

export default webpackDriver({ id: 'webpack', probe: 'untyped-group' });
