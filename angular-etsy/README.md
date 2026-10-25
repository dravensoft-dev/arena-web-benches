# angular-etsy

The Angular half of the Etsy bench, built with [rollup](https://rollupjs.org) 4.65.0 after `ngc`. It is an adopter of
rollup with an install of its own: `package.json` declares rollup, its plugins and the Angular packages at exact
versions, `bun.lock` holds them, and the Arena packages come from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, ngc, rollup, then the sheets, the sprite and public/ into dist/
bun run measure        # every claim the rollup page makes, and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run start          # ng serve on http://localhost:5205, the Angular CLI's own dev flow
```

`compile` is `ngc -p tsconfig.app.json` (ahead of time), its output in `.ngc/`. `entry.js` imports the compiled
`main.js` and `src/styles.css`. `rollup.config.mjs` is the page's recipe (`manualChunks` and content-hashed names) and
what rollup needs for this app: Node resolution, CommonJS, `NODE_ENV`, the Angular linker in a `transform` hook (the
Angular packages are partially compiled, and `ngc` does not link `node_modules`), Terser, an empty module for every
`.css` import, and the page emitted with its script pointed at the entry chunk. `index.html` is `src/index.html` with a
relative `<base>`, a `<link>` per sheet in the order `styles.css` imports them, and the entry script. `finish.mjs`
copies the sheets, the sprite and `public/` into `dist/`, which rollup does not move.

`measure.ts` is this half's rollup part of the measuring: the page's snippets verbatim, the variants as rewrites of
`rollup.config.mjs` (`plain` without the recipe, `css-import` without the empty module), and the rollup rows; `ngc` runs
once per distinct `main.ts`. A snippet the config does not hold throws, naming it. The shared machinery is
[`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half copies it again. The
scratch copies the measuring builds sit at `../.run-angular-etsy-*` and are removed when it ends.
