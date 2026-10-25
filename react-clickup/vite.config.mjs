export default {
  root: 'src',
  base: './',
  publicDir: false,
  plugins: [
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
        manualChunks: (id) => (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id) ? 'react'
          : /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/.test(id) ? 'arena' : undefined),
      },
    },
    outDir: '../dist',
    emptyOutDir: true,
  },
};
