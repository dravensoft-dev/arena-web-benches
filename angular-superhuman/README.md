# angular-superhuman

The Angular half of the Superhuman bench, built with [Rspack](https://rspack.rs) 2.2.9 through `@nx/angular-rspack`. It is an adopter of Rspack with an install of its own: `package.json` declares `@rspack/core`, `@rspack/cli`, `@nx/angular-rspack` and the Angular packages at exact versions, `bun.lock` holds them, and the Arena packages come from the registry at the version `package.json` names.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, rspack, then the builder's bookkeeping out of dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the webpack page makes about Rspack and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run start          # ng serve on http://localhost:5206, the Angular CLI's own dev flow
```

`rspack.config.mjs` makes the config with `createConfig` from `@nx/angular-rspack`, from the options of Angular's
`application` builder, and the webpack page's recipe is its `rspackConfigOverrides` (the file names of the JS config, the
sheet config with the two cache groups, each naming its `type`, and the `css/auto` rule); the sheet's chunk is also a
`styles` entry, which is what makes the builder link it ahead of `styles.css`. `extensionAlias` lets `main.ts`'s import of
the icon list `arena build` writes (a `.ts` module, imported as `.js`) find it. The builder writes the page itself from
`src/index.html` with `baseHref: './'`, and copies the sprite and `public/` through its `assets`. `finish.mjs` removes
`prerendered-routes.json` and `3rdpartylicenses.txt`, which the builder writes beside the browser output.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Rspack part of the measuring: the page's snippets verbatim, the variants as rewrites of `rspack.config.mjs` (`plain` without the recipe and the `styles` entry, `js-recipe` with the page's JS-only config, `no-css-auto` without the rule), and the rspack rows. A snippet the config does not hold throws, naming it.
The shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-angular-superhuman-*` and are removed when it ends.
