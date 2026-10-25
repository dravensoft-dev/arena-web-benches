import linker from '@angular/compiler-cli/linker/babel';
import { transformSync } from '@babel/core';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

// The Angular packages are partially compiled (`ɵɵngDeclare`): the linker finishes them, as `ng build` does.
const angularLinker = {
  name: 'angular-linker',
  setup(build) {
    build.onLoad({ filter: /[\\/]node_modules[\\/].*\.[cm]?js$/ }, (args) => {
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
