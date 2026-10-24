import { viteDriver } from './vite.ts';

// rollup.md, "How do I keep the package sheet in a file of its own?", Vite 8, verbatim (with `ARENA_SHEET_PLUGIN`, vite.ts); the probe is the group of
// "How do I keep Arena's JS in a chunk of its own?", which tests `node_modules` only. That group is the page's
// Vite 8 config byte for byte, so `js-recipe` is the same text.
const jsApart = `{ codeSplitting: { groups: [
  { name: 'arena', test: /node_modules[\\\\/]@dravensoft[\\\\/]arena-/, priority: 10 },
] } }`;

export default viteDriver({
  id: 'vite8',
  pkg: 'vite',
  output: {
    recipe: String.raw`{ codeSplitting: { groups: [
  { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
  { name: 'arena', test: /node_modules[\\/]@dravensoft[\\/]arena-|arena\.package\.generated\.css/, priority: 10 },
] } }`,
    'js-only-test': jsApart,
    'js-recipe': jsApart,
  },
});
