# react-clickup

The React half of the ClickUp bench, built with [esbuild](https://esbuild.github.io). It is an adopter of its bundler with an install of its own: `package.json` declares the bundler at an exact version, `bun.lock` holds it, and the Arena package comes from `../vendor/` until the registry carries the version.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, the bundler, then the sprite and the page into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the page makes and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run dev            # the dev server on http://localhost:5102
```

`measure.ts` is this half's part of the measuring: the page's snippets verbatim, the variants as rewrites of the config, and the page's rows. A snippet the config does not hold throws, naming it. The shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half copies it again. The scratch copies the measuring builds sit at `../.run-react-clickup-*` and are removed when it ends.
