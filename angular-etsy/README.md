# angular-etsy

The Angular half of the Etsy bench, built with [Vite](https://vite.dev) 7.3.7. It is an adopter of Vite 7 with an
install of its own: `package.json` declares `vite` at an exact version, `bun.lock` holds it, and the Arena package comes
from the registry at the version `package.json` names.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, vite build, then the sprite into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the rollup page makes about Vite 7 and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run start          # ng serve on http://localhost:5205, the Angular CLI's own dev flow
```

`vite.config.mjs` is the page's recipe (the `arena-sheet` plugin and the `manualChunks` that keep Arena, JS and sheet,
in chunks of their own) and what Vite needs to build an Angular app: `@analogjs/vite-plugin-angular` compiles it, a
relative `base`, and `target: 'es2022'`. `@analogjs/vite-plugin-angular`, `@angular/build` and Angular's own packages sit
at one minor, so the plugin starts the build's hash itself. `index.html` is `src/index.html` with a `<base>`, the link to
`src/styles.css` and the module script of `src/main.ts`, which Vite takes as its entry. `finish.mjs` copies the sprite
and `public/` into `dist/`, which Vite does not move.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Vite 7 part of the measuring: the page's snippets verbatim, the variants as rewrites of
`vite.config.mjs` (`plain` without the recipe, `js-recipe` and `js-only-test` with the page's JS-only function), and the
Vite 7 rows. A snippet the config does not hold throws, naming it. The shared machinery is [`../bench-kit`](../bench-kit),
a `file:` dependency: after changing it, `bun install` in this half copies it again. The scratch copies the measuring
builds sit at `../.run-angular-etsy-*` and are removed when it ends.
