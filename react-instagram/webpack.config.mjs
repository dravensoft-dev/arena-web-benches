import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

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
};

export default {
  mode: 'production',
  target: 'web',
  devtool: false,
  entry: { main: ['./src/Main.tsx'] },
  resolve: { extensions: ['.tsx', '.ts', '.js', '.mjs', '.json'] },
  module: { rules: [
    { test: /\.tsx?$/, loader: 'esbuild-loader', options: { loader: 'tsx', jsx: 'automatic', target: 'es2022' } },
  ] },
  plugins: [
    // The page: `index.html` takes the script and the sheets the build emits.
    new HtmlWebpackPlugin({ template: './index.html', scriptLoading: 'defer', inject: 'head', minify: false }),
    // The sprite sits at the root of the output under the name `arena build` gave it.
    new CopyWebpackPlugin({ patterns: [{ from: 'src/icons-*.svg', to: '[name][ext]' }] }),
  ],
  // webpack 5.112 reads a template that ends in .html itself (`experiments.html` is `auto`) and minifies the page; the HTML plugin writes it here.
  experiments: { ...sheet.experiments, html: false },
  optimization: sheet.optimization,
  output: { publicPath: './', ...js.output, ...sheet.output },
};
