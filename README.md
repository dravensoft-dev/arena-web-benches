# arena-web-benches

Test benches for [Arena](https://github.com/dravensoft-dev/arena). Eight products, each mocked
twice: once in React and once in Angular, from the same `arena.config.json` and the same
`design/` directory, so a difference between a pair is Arena answering the two layers
differently rather than the app being written twice.

Every bench installs Arena from npm. None of them reads the Arena tree.

| Product | React | Angular |
|---|---|---|
| Calendly | `react-calendly` | `angular-calendly` |
| ClickUp | `react-clickup` | `angular-clickup` |
| Duolingo | `react-duolingo` | `angular-duolingo` |
| Etsy | `react-etsy` | `angular-etsy` |
| Grafana | `react-grafana` | `angular-grafana` |
| Instagram | `react-instagram` | `angular-instagram` |
| Notion | `react-notion` | `angular-notion` |
| Superhuman | `react-superhuman` | `angular-superhuman` |

Each bench is a mock written to exercise Arena. The product names say which interface a bench
was drawn after; the marks and the artwork are its own.

## Running one

```bash
cd react-etsy && bun install && bun run dev          # React
cd angular-etsy && bun install && bunx ng serve      # Angular
```

## Packing them

`bun run pack vX.Y.Z` writes one `dist/arena-web-benches-<product>-vX.Y.Z.tar.gz` per pair, from
`git archive`, so a tarball holds what the commit holds and nothing a build left behind. The
working tree has to be clean: a tarball that matches no commit cannot be produced again.
