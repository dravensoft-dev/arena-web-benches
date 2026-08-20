# arena-web-benches

Test benches for [Arena](https://github.com/dravensoft-dev/arena). Eight products, each mocked
twice: once in React and once in Angular, from the same `arena.config.json` and the same
`design/` directory, so a difference between a pair is Arena answering the two layers
differently rather than the app being written twice.

Every bench installs Arena from npm. None of them reads the Arena tree.

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
| Calendly | `react-calendly` on 5108 | `angular-calendly` on 5208 |
| ClickUp | `react-clickup` on 5102 | `angular-clickup` on 5202 |
| Duolingo | `react-duolingo` on 5104 | `angular-duolingo` on 5204 |
| Etsy | `react-etsy` on 5105 | `angular-etsy` on 5205 |
| Grafana | `react-grafana` on 5107 | `angular-grafana` on 5207 |
| Instagram | `react-instagram` on 5103 | `angular-instagram` on 5203 |
| Notion | `react-notion` on 5101 | `angular-notion` on 5201 |
| Superhuman | `react-superhuman` on 5106 | `angular-superhuman` on 5206 |

Each bench is a mock written to exercise Arena. The product names say which interface a bench
was drawn after; the marks and the artwork are its own.

## Measuring one

```bash
cd react-etsy && bun run measure
```

`arena-to-prod --audit --undrawn`, which is where every figure in [`AUDIT.md`](./AUDIT.md) comes
from. A `dev` or a `build` runs it first anyway, so a bench cannot be served or shipped without
being measured.

## Packing them

`bun run pack vX.Y.Z` writes one `dist/arena-web-benches-<product>-vX.Y.Z.tar.gz` per pair, from
`git archive`, so a tarball holds what the commit holds and nothing a build left behind. The
working tree has to be clean: a tarball that matches no commit cannot be produced again.
