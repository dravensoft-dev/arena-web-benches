# arena-web-benches

Test benches for [Arena](https://github.com/dravensoft-dev/arena). Eight products, each mocked
twice: once in React and once in Angular, from the same `arena.config.json` and the same
`design/` directory, so a difference between a pair is Arena answering the two layers
differently rather than the app being written twice.

Every bench installs Arena from npm. None of them reads the Arena tree. To rehearse a version the
registry does not carry yet, `bun scripts/vendor.ts <arena>` packs the two packages from a built
Arena tree into `vendor/`, and each half names its tarball as `file:../vendor/<name>.tgz` until
the publish; `vendor/` is not committed, so those pins never reach `main`.

## Running one

```bash
cd react-etsy   && bun install && bun run dev      # http://localhost:5105
cd angular-etsy && bun install && bun run start    # http://localhost:5205
```

**Open both halves of a pair at once**, which is the whole reason there are two: the two windows
answer the same markup from the same `design/` directory, so anything that differs between them
is Arena's and not the app's. Every half holds a port of its own, listed below, so the sixteen
run side by side without colliding. A React half reads `PORT` if you want it somewhere else.

| Product | React | Angular |
|---|---|---|
| Calendly | `react-calendly` on 5108, [published](https://arena.dravensoft.org/web-benches/calendly/react/) | `angular-calendly` on 5208, [published](https://arena.dravensoft.org/web-benches/calendly/angular/) |
| ClickUp | `react-clickup` on 5102, [published](https://arena.dravensoft.org/web-benches/clickup/react/) | `angular-clickup` on 5202, [published](https://arena.dravensoft.org/web-benches/clickup/angular/) |
| Duolingo | `react-duolingo` on 5104, [published](https://arena.dravensoft.org/web-benches/duolingo/react/) | `angular-duolingo` on 5204, [published](https://arena.dravensoft.org/web-benches/duolingo/angular/) |
| Etsy | `react-etsy` on 5105, [published](https://arena.dravensoft.org/web-benches/etsy/react/) | `angular-etsy` on 5205, [published](https://arena.dravensoft.org/web-benches/etsy/angular/) |
| Grafana | `react-grafana` on 5107, [published](https://arena.dravensoft.org/web-benches/grafana/react/) | `angular-grafana` on 5207, [published](https://arena.dravensoft.org/web-benches/grafana/angular/) |
| Instagram | `react-instagram` on 5103, [published](https://arena.dravensoft.org/web-benches/instagram/react/) | `angular-instagram` on 5203, [published](https://arena.dravensoft.org/web-benches/instagram/angular/) |
| Notion | `react-notion` on 5101, [published](https://arena.dravensoft.org/web-benches/notion/react/) | `angular-notion` on 5201, [published](https://arena.dravensoft.org/web-benches/notion/angular/) |
| Superhuman | `react-superhuman` on 5106, [published](https://arena.dravensoft.org/web-benches/superhuman/react/) | `angular-superhuman` on 5206, [published](https://arena.dravensoft.org/web-benches/superhuman/angular/) |

Each bench is a mock written to exercise Arena. The product names say which interface a bench
was drawn after; the marks and the artwork are its own.

## Building all of them

```bash
bun run build      # dist/<product>/<layer>/, and arena-adopter.json beside them
bun run bundlers   # every bundler page's claim, checked; writes bundlers-results.json
bun run compare    # the eight pairs, each as two frames, on http://localhost:5100
```

`build` runs each half's build, which is the bundler its product is assigned (see
[Measuring the bundlers](#measuring-the-bundlers)): every half is an adopter of its bundler, with a
config, a lockfile and an install of its own, so `build` runs `bun install --frozen-lockfile` in the
half and then its own `build`. The root installs nothing and carries no bundler, so a fresh clone runs
`bun run build` with nothing installed. It stops on the
first that fails, so its exit code is the whole of the claim that a published gallery holds sixteen halves or none. It normalises the two
output paths into one shape, asserts the `./` base every half needs to be served from a
subdirectory, and asserts that every raster a half asks for is a raster it carries. That directory
is the only thing [Arena](https://github.com/dravensoft-dev/arena) reads, and it publishes it at
the addresses in the table above. When `bundlers-results.json` exists it is copied into `dist/`
beside `arena-adopter.json`, and when it does not `build` says so and copies nothing.

`compare` is the two halves of a pair open at once, which is the whole reason there are two. The
published site lists the addresses and embeds none of them.

## Measuring the bundlers

Every bench is built by one of eleven bundlers: Vite 7, Vite 8, Rollup, Rolldown, webpack, Rspack,
Parcel, Bun, esbuild, Next.js and Angular's `application` builder. [`bundlers.json`](./bundlers.json)
holds the ten entries a run draws from (the nine bundlers both layers share, and the mixed pair: Next.js on the
React half and the `application` builder on the Angular half, which build one product), the eight products and the pins.

Every run draws its assignment at random and measures eight entries, one on each product. The previous run's two
left-out entries are among the eight and the other six are drawn from the remaining eight, so two consecutive runs
measure every bundler. The eight are then shuffled onto the products: a product's two halves both build with its
entry's bundler, except the mixed pair, whose React half builds with Next.js and whose Angular half with the
`application` builder. The draw is a function of its seed: `--seed <n>` reproduces it, and a run told no seed draws
one. The halves commit the assignment (config, devDependencies, bundler part and lockfile move together), and
[`bundlers-results.json`](./bundlers-results.json) records the seed, the assignment, the entries the draw left out,
and one entry per measured half with the seconds its measuring took, so the next run starts the slowest halves first.

```bash
bun run build                  # installs each half's lockfile first
bun run bundlers               # draws, moves the halves to the draw, measures them
bun run bundlers --seed 123    # the same draw again
bun run rotate --seed 123      # only the move: the draw's halves, no measuring
```

`bundlers` moves the halves to the draw, then measures what is installed, so on a fresh clone `bun run build` (or
`bun install` in each half) comes first; it stops with that hint when a half has no install. It runs the `measure` of
each half, halves in parallel and slowest first, and gathers what each wrote into `bundlers-results.json`. A half
carries its own config, install, lockfile, README and the part of [`bench-kit/`](./bench-kit) its bundler needs: the
page's snippets, the variants (the half's config with a snippet removed or swapped, in a scratch copy) and the
observation rows. For each half, the runs its bundler's claims need (the page's recipe, the app's text changed, the
app's sheet changed, one Arena module patched, and each probe) are built at a scratch copy of the half, every claim is
checked against what the bundler wrote, and the outputs are weighed. webpack builds with a persistent filesystem cache
shared by the runs of one half, since its outputs are byte-identical with and without it (`bun run test:contract`
checks that); Rspack builds without one. A scratch holds the half's install as links, except where the bundler cannot
resolve through one: Parcel matches its globs against paths below its project root, so the Parcel halves ask for
Arena's package as a real directory (`arenaCopy`), and Turbopack refuses a link that points out of its root, so the
Next.js half asks for the whole install as hardlinks (`hardlinkModules`). `bun run bundlers` exits 1 after printing
each claim a build contradicts. `bun scripts/bundlers.ts --only react-etsy` runs one half as it stands and prints its
result without drawing and without writing the file.

Bun and esbuild keep no half between runs: their part (the page's snippets, the variants and the rows) and their
template (the config, the entry, the scripts, the devDependencies at the pins, `measure.ts`, README and `.gitignore`
of a half of each) are in [`bench-kit/parts/`](./bench-kit/parts). Any other bundler an earlier run left out is read
from the half of its layer that last held it, in the history of this repository.

## Testing the plumbing

```bash
bun test scripts           # the build, the draw and the move, the runner, the rows of every half (fast, builds nothing)
bun test bench-kit         # the shared machinery: snippets, scratch copies, weigher, runner
bun run test:contract      # what a build of each half holds, and of a Bun and an esbuild template, and webpack's cache (slow: it builds)
```

`bun run test`, `bun run test:kit` and `bun run test:contract` are the same three lines. The contract test
needs every half installed (`bun run build` first) and takes a few minutes.

## Measuring one

```bash
cd react-etsy && bun run report
```

`arena build`, then `arena check`, `arena audit` and `arena usage`, which is where every figure
in [`AUDIT.md`](./AUDIT.md) comes from. A `dev` builds and audits first anyway, so a bench cannot
be served without being measured, and a `build` runs the audit under `--strict=audit`, so a half
that reports a finding does not build and cannot be published. `report` itself stays lenient,
because it is the command this file's figures are read from and one that exits on the first report
reports less.

## Packing them

`bun run pack vX.Y.Z` writes one `dist/arena-web-benches-<product>-vX.Y.Z.tar.gz` per pair, from
`git archive`, so a tarball holds what the commit holds and nothing a build left behind. The
working tree has to be clean: a tarball that matches no commit cannot be produced again. It reads
its pairs from `bundlers.json` and clears the tarballs rather than the directory, because `build`
writes the published halves into that same `dist/`.
