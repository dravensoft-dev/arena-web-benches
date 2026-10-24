import { viteDriver } from './vite.ts';

// rollup.md, "How do I keep the package sheet in a file of its own?", Vite 8, verbatim; the probe is the group of
// "How do I keep Arena's JS in a chunk of its own?", which tests `node_modules` only.
export default viteDriver({
  id: 'vite8',
  pkg: 'vite',
  output: {
    recipe: `{ codeSplitting: { groups: [
  { name: 'react', test: /node_modules[\\\\/](react|react-dom|scheduler)[\\\\/]/, priority: 20 },
  { name: 'arena', test: /arena-react|arena\\.package\\.generated\\.css/, priority: 10 },
] } }`,
    'js-only-test': `{ codeSplitting: { groups: [
  { name: 'arena', test: /node_modules[\\\\/]@dravensoft[\\\\/]arena-/, priority: 10 },
] } }`,
  },
});
