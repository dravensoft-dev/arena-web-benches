# angular-instagram

The Angular half of the Instagram bench, built with [webpack](https://webpack.js.org) 5.112.2 through `@ngtools/webpack`. It is an adopter of webpack with an install of its own: `package.json` declares webpack, its CLI, its plugins and the Angular packages at exact versions, `bun.lock` holds them, and the Arena packages come from the registry at the version `package.json` names.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, webpack (the sprite and public/ copied by the config), into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the webpack page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run start          # ng serve on http://localhost:5203, the Angular CLI's own dev flow
```

`webpack.config.mjs` is the page's recipe, in the two pieces the page prints (the file names of its JS config, and its
sheet config with the two cache groups, each naming its `type`), and what webpack needs to build an Angular app:
`@ngtools/webpack` compiles it ahead of time (no `ngc` step of its own), `linker-loader.mjs` runs the Angular linker over the
partially compiled packages of `node_modules`, `main.ts` and `styles.css` are the two entries, the resolver reads the
`es2020` fields first, and `extensionAlias` lets `main.ts`'s import of the icon list `arena build` writes (a `.ts` module,
imported as `.js`) find it. `index.html` is `src/index.html` with a `<base>`, which `html-webpack-plugin` takes as its
template, and `copy-webpack-plugin` puts the sprite and `public/` at the root of `dist/`. webpack 5.112 reads a template
that ends in `.html` itself and minifies the page, so the config turns `experiments.html` off.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's webpack part of the measuring: the page's snippets verbatim, the variants as rewrites of `webpack.config.mjs` (`plain` without the recipe, `js-recipe` with the page's JS-only config, `untyped-group` without the `type` of both groups), and the webpack rows. A snippet the config does not hold throws, naming it.
The shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-angular-instagram-*` and are removed when it ends.
