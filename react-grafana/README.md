# react-grafana

The React half of the Grafana bench, built with [Next.js](https://nextjs.org) 16.4.3 (Turbopack). It is an adopter of Next.js with an install of its own: `package.json` declares `next`, `typescript` and the types of React and Node at exact versions, `bun.lock` holds them, and the Arena package comes from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, next build (a static export), then the sprite into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the Next.js page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run dev            # the dev server on http://localhost:5107
```

The Next.js page prints no config, so `next.config.mjs` is what a static export that is served from a directory needs
(`output: 'export'`, `distDir: 'dist'`, relative asset URLs, no image optimizer). `app/layout.tsx` is the head of
`src/index.html` (the base, the title, the theme script) and `app/page.tsx` is the one client component, which mounts the
app on `#root` once the page is there: Arena ships no `use client` directive, so that boundary is the app's. `tsconfig.json`
is complete (strict, the Next.js plugin), so `next build` type-checks `src/Main.tsx` and rewrites nothing; `next-env.d.ts`
is ignored. `finish.mjs` copies the sprite into `dist/`, which `public/` would serve only if it were copied there.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Next.js part of the measuring: the Next.js page gives no recipe, so `recipe` is this build and `plain` equals it, and the rows record what Next.js does with Arena's JS, the package sheet and the sprite. Turbopack refuses a link that points out of its project root, so the scratch copies hold the whole install as hardlinks (`hardlinkModules`), Arena's package as a real copy. A snippet the config does not hold throws, naming it.
The shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-react-grafana-*` and are removed when it ends.
