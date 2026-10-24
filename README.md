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
bun install
bun run build      # dist/<product>/<layer>/, and arena-adopter.json beside them
bun run compare    # the eight pairs, each as two frames, on http://localhost:5100
```

`build` runs each half's own build and stops on the first that fails, so its exit code is the
whole of the claim that a published gallery holds sixteen halves or none. It normalises the two
output paths into one shape, asserts the `./` base every half needs to be served from a
subdirectory, and asserts that every raster a half asks for is a raster it carries. That directory
is the only thing [Arena](https://github.com/dravensoft-dev/arena) reads, and it publishes it at
the addresses in the table above.

`compare` is the two halves of a pair open at once, which is the whole reason there are two. The
published site lists the addresses and embeds none of them.

## Measuring one

```bash
cd react-etsy && bun run measure
```

`arena build`, then `arena check`, `arena audit` and `arena usage`, which is where every figure
in [`AUDIT.md`](./AUDIT.md) comes from. A `dev` builds and audits first anyway, so a bench cannot
be served without being measured, and a `build` runs the audit under `--strict=audit`, so a half
that reports a finding does not build and cannot be published. `measure` itself stays lenient,
because it is the command this file's figures are read from and one that exits on the first report
reports less.

## Packing them

`bun run pack vX.Y.Z` writes one `dist/arena-web-benches-<product>-vX.Y.Z.tar.gz` per pair, from
`git archive`, so a tarball holds what the commit holds and nothing a build left behind. The
working tree has to be clean: a tarball that matches no commit cannot be produced again. It reads
its pairs from `bundlers.json` and clears the tarballs rather than the directory, because `build`
writes the published halves into that same `dist/`.
