import linker from '@angular/compiler-cli/linker/babel';
import { transformSync } from '@babel/core';
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
