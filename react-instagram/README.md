# react-instagram

The React half of the Instagram bench, built with [webpack](https://webpack.js.org) 5.112.2. It is an adopter of webpack with an install of its own: `package.json` declares webpack, its CLI and its plugins at exact versions, `bun.lock` holds them, and the Arena package comes from the registry at the version `package.json` names.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, webpack (the sprite copied by the config), into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the webpack page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run dev            # the dev server on http://localhost:5103
```

`webpack.config.mjs` is the page's recipe, in the two pieces the page prints (the file names of its JS config, and its
sheet config with the two cache groups, each naming its `type`), and what webpack needs to build this app: `esbuild-loader`
for TSX, `html-webpack-plugin` writing the page from `index.html` (`src/index.html` without its module script), and
`copy-webpack-plugin` putting the sprite at the root of `dist/`. webpack 5.112 reads a template that ends in `.html` itself
and minifies the page, so the config turns `experiments.html` off.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's webpack part of the measuring: the page's snippets verbatim, the variants as rewrites of `webpack.config.mjs` (`plain` without the recipe, `js-recipe` with the page's JS-only config, `untyped-group` without the `type` of both groups), and the webpack rows. A snippet the config does not hold throws, naming it.
The shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-react-instagram-*` and are removed when it ends.
