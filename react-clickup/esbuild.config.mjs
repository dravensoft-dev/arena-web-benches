import { build } from 'esbuild';

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
