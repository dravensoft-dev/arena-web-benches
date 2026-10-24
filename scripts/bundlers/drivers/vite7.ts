import { viteDriver } from './vite.ts';

// rollup.md, "How do I keep the package sheet in a file of its own?", Vite 7, verbatim; the probe is the first
// function of "How do I keep Arena's JS in a chunk of its own?", which tests `node_modules` only.
export default viteDriver({
  id: 'vite7',
  pkg: 'vite7',
  output: {
    recipe: `{
  manualChunks: (id) => (/node_modules[\\\\/](react|react-dom|scheduler)[\\\\/]/.test(id) ? 'react'
    : /arena-react|arena\\.package\\.generated\\.css/.test(id) ? 'arena' : undefined),
}`,
    'js-only-test': `{
  manualChunks: (id) => (id.includes('/node_modules/@dravensoft/arena-') ? 'arena' : undefined),
}`,
  },
});
