# angular-superhuman

The Angular half of the Superhuman bench, built with [Parcel](https://parceljs.org) 2.16.4 after `ngc`. It is an adopter of Parcel
with an install of its own: `package.json` declares `parcel` at an exact version, `bun.lock` holds it, and the Arena
package comes from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, ngc, parcel build, then the sprite and public/ into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the Parcel page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run start          # ng serve on http://localhost:5206, the Angular CLI's own dev flow
```

`compile` is `ngc -p tsconfig.app.json` (ahead of time), its output in `.ngc/`. Parcel reads its options from
`package.json`, and those fields are the page's recipe: two `manualSharedBundles` entries (Arena's JS and the package
sheet, each in a bundle of its own) and `packageExports`. `.parcelrc` extends Parcel's default config with one transformer
of the half's own, `parcel-transformer-angular-linker.cjs`, which runs the Angular linker over every module that carries a
partial declaration (the Angular packages are partially compiled, and `ngc` does not link `node_modules`). `index.html`
is `src/index.html` with a relative `<base>`, the link to `src/styles.css` and the module script of the compiled
`main.js`, which Parcel takes as its entry; it bundles the JS and the CSS itself, and the page it writes links the bundles.
`finish.mjs` copies the sprite and `public/` into `dist/`, which Parcel does not move.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Parcel part of the measuring: the page's snippets verbatim, the variants as rewrites of
`package.json` (`plain` without the shared bundles, `no-package-exports` without the resolver option), and the Parcel
rows. A snippet `package.json` does not hold throws, naming it; `ngc` runs once per distinct `main.ts`. Parcel matches the shared bundles' globs against paths
below its project root, so the scratch copies hold Arena's package as a real directory, as an npm install does (`arenaCopy`). Only the Parcel halves set it: the Next.js half takes the whole install as hardlinks instead, and every other bundler resolves the package through a link, which the scratch copies keep. The
shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-angular-superhuman-*` and are removed when it ends.
