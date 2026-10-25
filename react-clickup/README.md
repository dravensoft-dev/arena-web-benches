# react-clickup

The React half of the ClickUp bench, built with [Vite](https://vite.dev) 7.3.7. It is an adopter of Vite 7 with an
install of its own: `package.json` declares `vite` at an exact version, `bun.lock` holds it, and the Arena package comes
from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, vite build, then the sprite into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the rollup page makes about Vite 7 and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run dev            # the dev server on http://localhost:5102
```

`vite.config.mjs` is the page's recipe (the `arena-sheet` plugin and the `manualChunks` that keep React and Arena, JS
and sheet, in chunks of their own) and what Vite needs to build this app from a subdirectory: `root: 'src'` (the page
is `src/index.html`), a relative `base`, and `outDir` one level up. `finish.mjs` copies the sprite into `dist/`, which
Vite does not move.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Vite 7 part of the measuring: the page's snippets verbatim, the variants as rewrites of
`vite.config.mjs` (`plain` without the recipe, `js-recipe` and `js-only-test` with the page's JS-only function), and the
Vite 7 rows. A snippet the config does not hold throws, naming it. The shared machinery is [`../bench-kit`](../bench-kit),
a `file:` dependency: after changing it, `bun install` in this half copies it again. The scratch copies the measuring
builds sit at `../.run-react-clickup-*` and are removed when it ends.
