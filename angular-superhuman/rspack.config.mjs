import { createConfig } from '@nx/angular-rspack';
import { resolve } from 'node:path';

// The page's JS config: hashed names for every JS file.
const js = {
  output: { filename: '[name]-[contenthash:8].js', chunkFilename: '[name]-[contenthash:8].js' },
};

// The page's sheet config: Arena's JS and the package sheet each in a chunk of their own.
const sheet = {
  experiments: { css: true },
  output: { cssFilename: '[name]-[contenthash:8].css', cssChunkFilename: '[name]-[contenthash:8].css' },
  optimization: { splitChunks: { chunks: 'all', cacheGroups: {
    default: false,
    defaultVendors: false,
    react: { test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, name: 'react', enforce: true, priority: 20 },
    arena: { test: /node_modules[\\/]@dravensoft[\\/]arena-/, name: 'arena', enforce: true, priority: 10, type: /^javascript/ },
    arenaSheet: { test: /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/, name: 'arena-sheet', enforce: true, priority: 10, type: /^css/ },
  } } },
  module: { rules: [{ test: /\.css$/, type: 'css/auto' }] },
};

// `@nx/angular-rspack` makes the config from the options of `@angular/build:application`; the page's config is `rspackConfigOverrides`.
export default async () => {
  const [config] = await createConfig({
    options: {
      root: process.cwd(),
      name: 'bench',
      browser: './src/main.ts',
      index: 'src/index.html',
      baseHref: './',
      tsConfig: resolve('tsconfig.json'),
      polyfills: [],
      // The sheet's chunk is an entry the builder links, ahead of `styles.css`.
      styles: [{ input: 'src/arena.package.generated.css', bundleName: 'arena-sheet' }, 'src/styles.css'],
      assets: [{ glob: '**/*', input: 'public' }, { glob: 'icons-*.svg', input: 'src' }],
      outputPath: { base: 'dist', browser: '.' },
      outputHashing: 'all',
      optimization: true,
      aot: true,
      sourceMap: false,
      extractLicenses: false,
      progress: false,
    },
    rspackConfigOverrides: {
      // `main.ts` imports the icon list `arena build` writes, a `.ts` module, as `.js`.
      resolve: { extensionAlias: { '.js': ['.ts', '.js'] } },
      ...sheet,
      output: { ...js.output, ...sheet.output },
    },
  });
  return config;
};
