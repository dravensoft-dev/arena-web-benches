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

Every pair is read with `arena-to-prod --audit --undrawn` and built. All sixteen build, and the two
halves of every pair agree on both figures below, which is the claim the paired mock exists to
test.

| Product | Components drawn | Parts the plugin paints |
|---|---|---|
| Calendly | 11 | 5 |
| ClickUp | 30 | 19 |
| Duolingo | 7 | 7 |
| Etsy | 22 | 5 |
| Grafana | 19 | 2 |
| Instagram | 9 | 9 |
| Notion | 23 | 12 |
| Superhuman | 12 | 3 |

Forty-five distinct parts are painted by hand across the eight plugins. No bench reports a raw
colour, a bare length, a gradient outside a declared mark, or a rule reaching into an `arena-`
class.

## Open findings

### 1. Four products bind the label register's tracking by hand, each on a different slot

**Where** `track-label`, the role, against `tracking-label`, the scale step. `frameworks/tailwind/Theme.css`
holds both and says of the pair that "the awkward half is the one a manifest should stop reaching
for"; `ArenaChartCard.title` and `ArenaStatCard.label` reach it anyway, and
`scripts/check/tailwind/check-role-tokens.ts` excuses them "until a role names the difference".

**What happens** Which slots belong to the label register is Arena's to decide, and a plugin cannot
add one. A product that reads a tag, a button, a breadcrumb or a panel title as label-register text
finds its answer to `track-label` does not reach there, and writes the role into the slot itself
through the part hook.

**Which benches** Four of eight, in both halves of each pair, and no two of them on the same part:
Grafana on `chart-card.title`, Notion on the three `breadcrumbs` slots, ClickUp on `tag` and
`board.title`, Duolingo on `button`. Every one of them writes the same declaration,
`letter-spacing: var(--track-label)`.

**What the benches do** They paint it, and Grafana states the reason in its own stylesheet: a
console whose panel titles track differently from every other label is a console with two kinds of
small text. This is not a count asking for a new role, because no two of them name the same part.
It is four products disagreeing with the register's membership, which is the decision none of them
can express.

### 2. Three products set the size of a breadcrumb by hand

**Where** `breadcrumbs.crumb`, `breadcrumbs.current` and `breadcrumbs.separator`.

**What happens** The breadcrumb trail carries no size role, so a project that wants it quieter or
louder than the slot compiles to writes `font-size` on each of the three slots.

**Which benches** ClickUp, Etsy and Notion, in both halves of each pair. All three write `font-size`
and a tracking on all three slots; ClickUp adds `text-transform` and Notion adds a held-back colour.

**What the benches do** They paint it. Three plugins writing the same decision through the same
three parts is the count Arena's own rule for growing the role tier asks for.

### 3. Two products draw the head of a chart card identically by hand

**Where** `chart-card.head`.

**What happens** The rule between a chart card's head and its plot is not a decision any role
carries, so a product that wants one writes the border and the padding itself.

**Which benches** ClickUp and Grafana, in both halves. The two rules are the same pair of
declarations, `border-block-end` and `padding-block-end`, and both resolve them from the separator
and spacing tokens rather than from values of their own.

**What the benches do** They paint it. Two dashboards reaching for the same separator is a narrower
count than finding 2 and it is the same shape.

### 4. Two products weight a navigation row by hand

**Where** `side-nav.item` and `side-nav.trigger`.

**What happens** How heavy a navigation row sits is not a role, so a product that wants its sidebar
to read heavier than the slot writes `font-weight` on both parts.

**Which benches** ClickUp and Notion, in both halves. Notion also writes a colour, which is a level
rather than a weight and is answered elsewhere.

**What the benches do** They paint it.

### 5. A restatement written through an alias is invisible to the check that looks for one

**Where** The `restated` report of `arena-to-prod`, and `side-nav.section-label`.

**What happens** The check compares the text of a plugin declaration against the text the slot
compiles to, so a declaration naming a token that resolves to the value the slot already paints
raises the count of parts a plugin paints without changing a pixel, and nothing says so. That count
is what Arena grows a role from, so a restatement it cannot see is evidence for a question nobody
asked.

**Which benches** ClickUp and Notion, in both halves, on `side-nav.section-label`: both write the
label step by its scale name where the slot names the role that resolves to it.

**What the benches do** Nothing. Arena records the limit itself, in
`contracts/design/StylePlugins.md`, so the finding is the cost rather than the discovery: two of
eight plugins carry a declaration that changes nothing, and the instrument reads both as evidence.

## Answered

Kept so the next reader does not raise them again. Each is a decision Arena has taken with its
reason, not an omission.

- **The colour of a card's eyebrow.** ClickUp and Duolingo both paint `card.eyebrow`, and both
  write the identical `color-mix(in oklab, var(--color-base-content) 62%, transparent)`. The count
  clears the bar and the decision is refused, because what the two rules change is how far the line
  is held back rather than which colour it takes, and a colour role names which colour and never
  how held back it is. `contracts/design/StylePlugins.md` carries the reasoning.
- **Nothing inside a chart's plot is reachable.** Grafana paints the fewest parts of the eight, and
  the reason is that its screens are mostly plots. Seven of the eight charts carry no manifest, so
  they carry no slot and no part hook, and a product's data visualisation is the one region of its
  screen a plugin cannot re-skin. It still wears the skin, because every value a chart paints is a
  token the palette moves. `frameworks/CHARTS.md` carries the reasoning.
