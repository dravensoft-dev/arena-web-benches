# angular-grafana

The Angular half of the Grafana bench, built with Angular's `application` builder (`@angular/build` 22.2.4). It is an adopter of the Angular CLI with an install of its own: `package.json` declares the Angular packages at exact versions, `bun.lock` holds them, and the Arena packages come from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, ng build --base-href ./, then the builder's bookkeeping out of dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the Angular page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run start          # ng serve on http://localhost:5207, the Angular CLI's own dev flow
```

The Angular page prints no config, so `angular.json` is the builder's own: `styles` names `src/styles.css`, `assets` the
sprite and `public/`, and `outputPath` writes the browser output straight into `dist/`. `ng build --base-href ./` is the
`bundle` script. `finish.mjs` removes `prerendered-routes.json` and `3rdpartylicenses.txt`, which the builder writes beside
the browser output.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Angular builder part of the measuring: the Angular page gives no recipe, so `recipe` is this build and `plain` equals it, and the rows are the claims the page makes about the builder. A snippet the config does not hold throws, naming it.
The shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-angular-grafana-*` and are removed when it ends.
