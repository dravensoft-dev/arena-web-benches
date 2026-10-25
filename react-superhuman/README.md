# react-superhuman

The React half of the Superhuman bench, built with [Rspack](https://rspack.rs) 2.2.9. It is an adopter of Rspack with an install of its own: `package.json` declares `@rspack/core` and `@rspack/cli` at exact versions, `bun.lock` holds them, and the Arena package comes from the registry at the version `package.json` names.

```bash
bun install            # this half's own install, from its own bun.lock
bun run build          # arena build, arena audit, rspack (the sprite copied by the config), into dist/
bun run measure        # prebuild (arena build, audit, usage) first, then every claim the webpack page makes about Rspack and the figures, into bundlers-result.json
bun run report         # arena build, check, audit and usage: where the figures of AUDIT.md come from
bun run dev            # the dev server on http://localhost:5106
```

`rspack.config.mjs` is the webpack page's recipe (the file names of its JS config, its sheet config with the two cache
groups, each naming its `type`) with the `css/auto` rule Rspack adds, and what Rspack needs to build this app: the
`builtin:swc-loader` for TSX, `HtmlRspackPlugin` writing the page from `index.html` (`src/index.html` without its module
script), and `CopyRspackPlugin` putting the sprite at the root of `dist/`.

`measure` runs `prebuild` itself, so the files `arena build` writes under `src/` exist for the scratch copies it builds
from. `measure.ts` is this half's Rspack part of the measuring: the page's snippets verbatim, the variants as rewrites of `rspack.config.mjs` (`plain` without the recipe, `js-recipe` with the page's JS-only config, `no-css-auto` without the rule), and the rspack rows. A snippet the config does not hold throws, naming it.
The shared machinery is [`../bench-kit`](../bench-kit), a `file:` dependency: after changing it, `bun install` in this half
copies it again. The scratch copies the measuring builds sit at `../.run-react-superhuman-*` and are removed when it ends.
