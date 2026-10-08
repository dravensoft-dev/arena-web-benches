# AUDIT

**What the benches say about Arena.** [`CLAUDE.md`](./CLAUDE.md) states the rule this file exists
to serve: a defect found in a bench is Arena's, it is not fixed here, and it is written down here.

Every entry is a claim about Arena as it stands. One that stops being true is deleted rather than
amended, and nothing here records what a value was, which change moved it, or what a run reported
before.

## How an entry is written

Four things, and an entry missing any of them is not yet a finding:

- **Where**, as the Arena member, part or token it is about, never as a line number.
- **What happens**, as what Arena does rather than as what the bench wanted.
- **Which benches show it**, and whether both halves of each pair do. A pair that disagrees is a
  different and sharper finding than a pair that agrees.
- **What the bench does about it**, which is normally nothing. A bench that works around a defect
  has stopped measuring it, so the workaround is part of the finding and not a footnote.

An entry naming a bench's own palette, ramp, level or unused component is not a finding; that cut
is in [`CLAUDE.md`](./CLAUDE.md).

## The measurement

Every half is read with `bun run measure`, which runs `arena build`, `arena check`, `arena audit`
and `arena usage` over `src` and `design`, against Arena 12.0.0 from npm. The two halves of every pair agree on both figures below,
which is the claim the paired mock exists to test.

| Product | Components drawn | Parts the plugin paints |
|---|---|---|
| Calendly | 11 | 5 |
| ClickUp | 30 | 14 |
| Duolingo | 7 | 7 |
| Etsy | 22 | 2 |
| Grafana | 19 | 0 |
| Instagram | 10 | 8 |
| Notion | 23 | 12 |
| Superhuman | 12 | 0 |

Forty-one distinct parts are painted by hand across the six plugins that paint any. No bench
reports a raw colour, a bare length, a gradient outside a declared mark, a rule reaching into an
`arena-` class, or a declaration restating what the slot it selects already paints.

**Sixteen of the sixteen build.** `build` runs `arena audit --strict=audit` first, and it reports
nothing in any half.

**Superhuman's plugin carries no rule.** Its side nav rows are answered by `pad-nav-row-y`
and Etsy's band by `pad-band-y`, so those two decisions are roles and not sheets.

**Grafana's plugin carries no rule at all.** Every decision that console makes is a role it
answers, which is the strongest reading the bench has produced: a register can be a set of answers
rather than a sheet.

## Open findings

None. Every figure on this page is read from a build assembled from an Arena working tree at
12.0.0.

## Answered

Kept so the next reader does not raise them again. Each is a decision Arena has taken with its
reason, not an omission.

- **The colour of a card's eyebrow.** ClickUp and Duolingo both paint `card.eyebrow`, and both
  write the identical `color-mix(in oklab, var(--color-base-content) 62%, transparent)`. The count
  clears the bar and the decision is refused, because what the two rules change is how far the line
  is held back rather than which colour it takes, and a colour role names which colour and never
  how held back it is. `contracts/design/StylePlugins.md` carries the reasoning.
- **Nothing inside a chart's plot is reachable.** Grafana paints no part at all, and its screens are
  mostly plots. Every chart carries a manifest, so its frame, legend and tooltip each carry a part
  hook, and the plot does not: a mark's position is arithmetic that produces an SVG attribute, so
  the plot carries no slot and a product's data visualisation is the one region of its screen a
  plugin cannot re-skin. It still wears the skin, because every value a chart paints is a token the
  palette moves. `frameworks/CHARTS.md` carries the reasoning.
- **Two primary actions on Superhuman's screen.** Compose in the sidebar is the filled primary and
  Reply in the reading pane takes `arena-emphasis-secondary`, in both halves. `arena audit` reports
  a second primary as `one-primary`, and the report is true: Arena keeps the solid fill for the one
  action a view is for. `contracts/design/AGENTS.md` and `contracts/design/Scales.md` carry the
  reasoning.
- **Instagram's LIVE marker.** It is an `ArenaBadge` with `tone="danger"`, `arena-mark-solid` and
  `arena-size-sm`, inside a wrapper that holds only its position. Against a hand-painted marker the
  size is 15px tall in both, the fill is `rgb(198, 35, 48)` and the label `rgb(255, 255, 255)` in
  both, and the offset from the foot of the ring is the same 8px. The two differ in the label face:
  the badge sets it in the skin's label face and a hand-painted marker inherits the system stack,
  which makes the badge 29.2px wide against 29.6px. The face is the skin's, so the difference is
  accepted.
