# react-superhuman

The React half of the Superhuman bench, built with [Parcel](https://parceljs.org) 2.16.4. It is an adopter of Parcel
with an install of its own: `package.json` declares `parcel` at an exact version, `bun.lock` holds it, and the Arena
package comes from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, parcel build, then the sprite into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the Parcel page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run dev            # the dev server on http://localhost:5106
```

Parcel reads its options from `package.json`, and those fields are the page's recipe: two `manualSharedBundles` entries
(Arena's JS and the package sheet, each in a bundle of its own) and `packageExports`. `src/index.html` is the entry, which
Parcel takes as it stands: it bundles the JS and the CSS the entry imports itself, and the page it writes links the
bundles. `finish.mjs` copies the sprite into `dist/`, which Parcel does not move.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Parcel part of the measuring: the page's snippets verbatim, the variants as rewrites of
`package.json` (`plain` without the shared bundles, `no-package-exports` without the resolver option), and the Parcel
rows. A snippet `package.json` does not hold throws, naming it. Parcel matches the shared bundles' globs against paths
below its project root, so the scratch copies hold Arena's package as a real directory, as an npm install does. The
shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-react-superhuman-*` and are removed when it ends.
