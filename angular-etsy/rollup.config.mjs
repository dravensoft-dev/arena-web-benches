import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import linker from '@angular/compiler-cli/linker/babel';
import { transformSync } from '@babel/core';
import { readFileSync } from 'node:fs';

// Rollup imports no CSS: every `.css` import is an empty module, and the page links the sheets `arena build` writes.
function emptyCss() {
  return {
    name: 'empty-css',
    async resolveId(source, importer, options) {
      if (!source.split('?')[0].endsWith('.css') || source.startsWith('\0')) return null;
      const found = await this.resolve(source, importer, { ...options, skipSelf: true });
      return found ? `\0empty-css:${found.id}.js` : null;
    },
    load(id) {
      return id.startsWith('\0empty-css:') ? { code: 'export default "";', map: null } : null;
    },
  };
}

// The Angular packages are partially compiled (`ɵɵngDeclare`): the linker finishes them, as `ng build` does.
const angularLinker = {
  name: 'angular-linker',
  transform(code, id) {
    if (!/[\\/]node_modules[\\/].*\.[cm]?js$/.test(id.split('?')[0]) || !code.includes('ɵɵngDeclare')) return null;
    const out = transformSync(code, { filename: id, babelrc: false, configFile: false, compact: false, sourceMaps: false, plugins: [linker] });
    return { code: out.code, map: null };
  },
};

// Rollup writes no page: `index.html` is emitted with its module script pointed at the entry chunk.
function page(entryName) {
  const script = /<script\s+type="module"\s+src="[^"]*"\s*><\/script>/;
  return {
    name: 'page',
    generateBundle(_options, bundle) {
      const entry = Object.values(bundle).find((chunk) => chunk.type === 'chunk' && chunk.isEntry && chunk.name === entryName);
      if (!entry) throw new Error(`no entry chunk named ${entryName}`);
      const html = readFileSync('index.html', 'utf8');
      if (!script.test(html)) throw new Error('index.html has no module script to point at the entry chunk');
      this.emitFile({ type: 'asset', fileName: 'index.html', source: html.replace(script, () => `<script type="module" src="./${entry.fileName}"></script>`) });
    },
  };
}

export default {
  input: { main: 'entry.js' },
  plugins: [
    emptyCss(),
    nodeResolve({ browser: true, extensions: ['.js', '.mjs', '.json'] }),
    commonjs(),
    replace({ preventAssignment: true, values: { 'process.env.NODE_ENV': '"production"' } }),
    angularLinker,
    terser(),
    page('main'),
  ],
  output: {
    dir: 'dist',
    format: 'es',
    manualChunks: (id) => (id.includes('/node_modules/@dravensoft/arena-') ? 'arena' : undefined),
    entryFileNames: '[name]-[hash].js',
    chunkFileNames: '[name]-[hash].js',
  },
};
