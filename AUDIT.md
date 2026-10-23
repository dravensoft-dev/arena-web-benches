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
and `arena usage` over `src` and `design`, against Arena 12.1.1 packed from the Arena working tree
on `develop` at `9237c5edf`, which carries that version number and is not what npm publishes under
it. The two halves of every pair agree on both figures below, which is the claim the paired mock
exists to test.

| Product | Components drawn | Parts the plugin paints |
|---|---|---|
| Calendly | 12 | 5 |
| ClickUp | 31 | 14 |
| Duolingo | 8 | 7 |
| Etsy | 23 | 2 |
| Grafana | 20 | 0 |
| Instagram | 11 | 8 |
| Notion | 24 | 12 |
| Superhuman | 13 | 0 |

Forty-one distinct parts are painted by hand across the six plugins that paint any. No bench
reports a raw colour, a bare length, a gradient outside a declared mark, a rule reaching into an
`arena-` class, or a declaration restating what the slot it selects already paints.

**Sixteen of the sixteen build.** `build` runs `arena audit --strict=audit` first, and it reports
nothing in any half.

**Every glyph is an `ArenaIcon`.** No half links Phosphor's web font, and every glyph a half draws
comes from the `icons-<hash>.svg` sprite `arena build` writes, handed over through
`ArenaIconsProvider` or `provideArenaIcons`. Both halves of every pair write the same sprite.

**Every half leaves 23 or 24 roles to Arena's default.** `arena build` names them; Etsy and
Superhuman answer one more than the others. None of them stops a build.

**Superhuman's plugin carries no rule.** Its side nav rows are answered by `pad-nav-row-y`
and Etsy's band by `pad-band-y`, so those two decisions are roles and not sheets.

**Grafana's plugin carries no rule at all.** Every decision that console makes is a role it
answers, which is the strongest reading the bench has produced: a register can be a set of answers
rather than a sheet.

## Open findings

- **`arena check` reports `ArenaIconsProvider` as a component Arena does not ship.** Where: the
  `[components]` check of the React package. What happens: it reads the provider's name as a
  component, finds no sheet for it, and reports `ArenaIconsProvider is not a component this package
  ships, so no sheet was added for it`. The provider is Arena's own export, and the install guide
  names it as the one way a React project hands `ArenaIcon` its sprite, so the report is false and
  every React project that follows the guide carries it. Which benches: every React half, and no
  Angular half, whose `provideArenaIcons` is a function and not a tag. So every pair disagrees by
  exactly one report: React counts one more than Angular in all eight. What the bench does:
  nothing; the report does not stop a build.
- **`raw-glyph` reads a glyph nested in a JSX prop as a class of the component that holds the
  prop.** Where: the `raw-glyph` rule of `arena audit`, React sources. What happens: the rule reads
  the classes of a tag's whole attribute text, and in JSX that text holds every element passed
  through a prop. `<ArenaAppBar brand={<a><i className="ph-fill ph-storefront" /></a>}>` is reported
  twice: once at the `<i>`, and once at `ArenaAppBar`, which carries no glyph. The same rule reads a
  `className` of a nested element as the outer tag's own whenever a prop holds markup. Which benches:
  the Etsy brand slot is the shape that shows it, and no half draws a raw glyph now, so none reports
  it; a two-component probe with the same shape reproduces it. Angular projects content as children
  rather than through an attribute, so its half of the same markup is reported once. What the bench
  does: nothing; it draws no raw glyph.
- **`raw-glyph` reports only a glyph whose class is written at the element.** Where: the `raw-glyph`
  rule of `arena audit`, both layers. What happens: an `<i>` whose class comes from a value, such as
  `className={tab.icon}`, `class="{{ entry.icon }} ptabs__icon"` or `[class]="themeIcon()"`, is not
  reported, although the value is a whole `ph-*` literal elsewhere in the same sources and
  `arena build` reads that literal into the sprite. That element paints nothing, and the audit
  says nothing about it. Which benches: one ClickUp glyph, four of Duolingo's, three of Instagram's
  and six of Notion's, each drawn from a data table, and both halves of each of those pairs agree.
  Instagram's theme toggle is one more in Angular only, because that half reads it from a computed
  where the React half writes the ternary inline; the rule answers the same way in both layers, and
  the markup is what differs. No half draws a raw glyph now, so none of them reports it. What the bench does: nothing; it draws every glyph through
  `ArenaIcon`.

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
