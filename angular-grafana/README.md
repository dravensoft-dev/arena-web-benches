# angular-grafana

The Angular half of the Grafana bench, built with [rolldown](https://rolldown.rs) 1.2.15 after `ngc`. It is an adopter of
rolldown with an install of its own: `package.json` declares rolldown and the Angular packages at exact
versions, `bun.lock` holds them, and the Arena packages come from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, ngc, rolldown, then the sheets, the sprite and public/ into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the rolldown page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run start          # ng serve on http://localhost:5207, the Angular CLI's own dev flow
```

`compile` is `ngc -p tsconfig.app.json` (ahead of time), its output in `.ngc/`. `entry.js` imports the compiled
`main.js` and `src/styles.css`. `rolldown.config.mjs` is the page's recipe (`output.codeSplitting.groups`) and what rolldown needs for this app: the
browser platform, `NODE_ENV`, minification, the Angular linker in a `transform` hook (the Angular packages are partially
compiled, and `ngc` does not link `node_modules`), an empty module for every `.css` import (rolldown bundles no CSS), and
the page emitted with its script pointed at the entry chunk. `index.html` is `src/index.html` with a relative `<base>`, a
`<link>` per sheet in the order `styles.css` imports them, and the entry script. `finish.mjs` copies the sheets, the
sprite and `public/` into `dist/`, which rolldown does not move.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds from. `measure.ts` is this half's rolldown part of the measuring: the page's snippets verbatim, the variants as rewrites of
`rolldown.config.mjs` (`plain` without the recipe, `css-import` without the empty module), and the rolldown rows; `ngc` runs
once per distinct `main.ts`. A snippet the config does not hold throws, naming it. The shared machinery is
[`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half copies it again. The
scratch copies the measuring builds sit at `../.run-angular-grafana-*` and are removed when it ends.
