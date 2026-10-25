import angular from '@analogjs/vite-plugin-angular';

export default {
  base: './',
  publicDir: false,
  plugins: [
    angular({ tsconfig: './tsconfig.json' }),
    {
      name: 'arena-sheet',
      enforce: 'pre',
      transform: (code, id) => (/[\\/]src[\\/]styles\.css$/.test(id)
        ? code.replace(/@import\s+'\.\/arena\.package\.generated\.css';\s*/, '') : null),
      transformIndexHtml: { order: 'pre', handler: (html) => (/styles\.css/.test(html)
        ? [{ tag: 'link', attrs: { rel: 'stylesheet', href: '/src/arena.package.generated.css' }, injectTo: 'head-prepend' }]
        : []) },
    }
  ],
  build: {
    rollupOptions: {
      output: {
        codeSplitting: { groups: [
          { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
          { name: 'arena', test: /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/, priority: 10 },
        ] },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
};
