# react-grafana

The React half of the Grafana bench, built with [rolldown](https://rolldown.rs) 1.2.15. It is an adopter of rolldown with an
install of its own: `package.json` declares rolldown at an exact version, `bun.lock` holds them, and the
Arena packages come from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, rolldown, then the sheets and the sprite into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the rolldown page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run dev            # the dev server on http://localhost:5107
```

`rolldown.config.mjs` is the page's recipe (`output.codeSplitting.groups`) and what rolldown needs to build this app:
the browser platform, `NODE_ENV`, minification, an empty module for every `.css` import (rolldown bundles no CSS), and
the page emitted with its script pointed at the entry chunk. `index.html` is `src/index.html` with a `<link>` per sheet,
in the order `Main.tsx` imports them. `finish.mjs` copies the sheets and the sprite into `dist/`, which rolldown does not
move.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds from. `measure.ts` is this half's rolldown part of the measuring: the page's snippets verbatim, the variants as rewrites of
`rolldown.config.mjs` (`plain` without the recipe, `css-import` without the empty module), and the rolldown rows. A snippet
the config does not hold throws, naming it. The shared machinery is [`../bench-kit`](../bench-kit), a `file:`
dependency: after changing it, `bun install` in this half copies it again. The scratch copies the measuring builds sit
at `../.run-react-grafana-*` and are removed when it ends.
