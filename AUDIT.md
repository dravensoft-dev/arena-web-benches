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
and `arena usage` over `src` and `design`, against a build assembled from an Arena working tree at
12.0.0 (the two tarballs in `vendor/`). The two halves of every pair agree on both figures below,
which is the claim the paired mock exists to test.

| Product | Components drawn | Parts the plugin paints |
|---|---|---|
| Calendly | 11 | 5 |
| ClickUp | 30 | 14 |
| Duolingo | 7 | 7 |
| Etsy | 22 | 3 |
| Grafana | 19 | 0 |
| Instagram | 9 | 8 |
| Notion | 23 | 12 |
| Superhuman | 12 | 2 |

Forty-two distinct parts are painted by hand across the eight plugins. No bench reports a raw
colour, a bare length, a gradient outside a declared mark, a rule reaching into an `arena-` class,
or a declaration restating what the slot it selects already paints.

**Ten of the sixteen build.** `build` runs `arena audit --strict=audit` first, and both halves of
Duolingo, Instagram and Superhuman report one audit finding each, so neither half of those three
pairs builds: findings 3 and 4 below, and the second primary under Answered.

**Grafana's plugin carries no rule at all.** Every decision that console makes is a role it
answers, which is the strongest reading the bench has produced: a register can be a set of answers
rather than a sheet.

## Open findings

Every finding below is read from a build assembled from an Arena working tree at 12.0.0.

### 1. A row's padding is one role for every row, and a band's padding is no role at all

**Where** `pad-row-y` on `side-nav.item` and `side-nav.trigger`, and `app-bar.band`.

**What happens** `pad-row-y` is the block padding of every slot of the `row` kind, so one answer
moves the side nav's rows, `tabs.tab` and `command-palette.row` together. The compact class reaches
the same rows through `--dz-row-scale-y`, and it reaches every component on the screen with them.
`app-bar.band` is a slot of the `none` kind that spends the numeric step `py-3`, so no role
reaches it.

**Which benches** Two of eight, in both halves of each pair, and not on the same part. Superhuman
wants its mailbox list read down rather than pointed at, with rows at `--sp-1`, and it also draws
`ArenaCommandPalette`, whose rows read the same role, so answering `pad-row-y` would tighten the
palette with the list. Etsy wants the bar that carries its search field to be the tallest thing on
the page, and no role reaches the band.

**What the benches do** They paint it. Superhuman answers `pad-row-y` with the default `10px` and
writes `padding-block: var(--sp-1)` on `side-nav.item` and `side-nav.trigger` in its plugin
stylesheet; Etsy writes `padding-block: var(--sp-5)` on `app-bar.band`. The two parts want opposite
things, one product spending the space and the other taking it back, so this is two products
meeting one wall rather than a count asking for one role: a row's padding is answered for every row
at once, and a band's is not asked.

### 2. ArenaFigure crops a picture taller than its frame from the top, so `fit-media` never applies

**Where** `figure.frame` and `figure.media`, with the `fit-media` role.

**What happens** The frame is a grid holding the ratio, and the media slot is `h-full` with
`[&>img]:h-full` and `object-fit: var(--fit-media)`. A picture whose own ratio is taller than the
frame's sizes the grid row to its own height, so the media slot and the image grow past the frame
and the frame's `overflow: hidden` clips them at the foot. The image is drawn at its own ratio,
anchored to the top, and `object-fit: cover` has nothing to fit. Measured on Notion's document
cover, a 1200×700 picture in `arena-ratio-video`: the frame's content box is 785×441, the grid row
and the image are 785×458, and the image's top sits on the frame's top, so its foot is cut rather
than both edges.

**Which benches** Notion, in both halves alike. A picture whose ratio matches its frame, as Etsy's
4:5 pictures do, shows none of it.

**What the bench does** Nothing.

### 3. `audit danger-fill` reports a danger tint as a filled danger surface

**Where** The `danger-fill` rule of `arena audit`.

**What happens** The rule reports any `background` declaration that reads `var(--color-error)`,
`var(--danger)` or their fills, whatever the declaration does with it. A tint,
`color-mix(in oklab, var(--color-error) 16%, transparent)`, is reported as "a filled danger
surface", and the message names `var(--danger-soft)` as the tint a surface of one's own may carry,
which is `color-mix(in oklab, var(--color-error) 14%, transparent)`: the same construction two
points lighter. The instrument reports the opposite of what the line paints.

**Which benches** Duolingo, in both halves alike, on `.lesson__foot` in the wrong-answer phase,
whose right-answer twin tints with `--color-success` and is not reported. Both halves fail
`--strict=audit` and do not build.

**What the bench does** Nothing.

### 4. `audit danger-fill` reports a status mark as a destructive fill, and no component draws a filled mark in a hue

**Where** The `danger-fill` rule of `arena audit`, and `ArenaBadge`'s `tone`.

**What happens** `contracts/design/AGENTS.md` states that "Danger is outline" governs controls and
surfaces, not presence or identity marks, and fills the avatar's presence dot and the tag's dot for
that reason. The audit rule cannot tell a mark from a surface, so a small filled marker in
`--color-error` is reported as a destructive fill. The bench has no member to ask instead:
`ArenaBadge tone="danger"` paints a soft tint under body ink, `hue-danger-fill-strong` is closed to
`transparent`, and no accent or hue gives a marker a solid fill.

**Which benches** Instagram, in both halves alike, on the LIVE marker under a story ring, a solid
`--color-error` chip carrying `--color-error-content`. Both halves fail `--strict=audit` and do not
build.

**What the bench does** Nothing. The marker is drawn in the bench's own markup because no member
draws it.

### 5. Audit messages name Arena's own palette to every project

**Where** The messages of `arena audit`'s `one-primary` and `raw-value` rules.

**What happens** The `one-primary` message says "Crimson is the voice, so at most one
arena-emphasis-primary action stands in a view", the raw-hex message asks for "var(--crimson)",
and the gradient message says depth comes from "the warm shadow". Crimson and the warm shadow are
Dravensoft's skin, which a project with a palette of its own does not carry, so the message names a
colour that is not on the screen it is about.

**Which benches** Superhuman, in both halves alike, whose primary is a violet (`#4b32c3` light,
`#a396ff` dark) and whose audit says "Crimson is the voice".

**What the bench does** Nothing.

### 6. An Angular template drops a visual attribute that matches no input, and nothing reports it

**Where** Every Angular component whose visual choice is a vocabulary class rather than an input,
such as the size of `arena-icon-button` or the emphasis of `arena-button`, and `arena audit`.

**What happens** `ngc` under `strictTemplates` accepts a static attribute that matches no input,
such as `size="sm"` or `variant="secondary"`, and the attribute is dropped: the icon button draws
at `md`, and the button draws primary. React's types reject the same prop (`Property 'size' does
not exist on type 'ArenaIconButtonProps'`), so the two layers of one pair disagree on whether the
line is wrong. `arena audit` reports neither, in either layer. Measured on Calendly's templates
written with `size` and `variant`: `ngc` exits 0 and the audit reports no finding.

**Which benches** Every Angular half is exposed. Their templates carry no such attribute, which a
search finds and nothing else does.

**What the bench does** Nothing.

### 7. `edge-axis`'s default answer draws the axis lighter than the grid it is meant to outweigh

**Where** The `edge-axis` role, answered `{color.neutral}` by the style store and by
`style-plugin-default.css`.

**What happens** `roles.json` says the axis is heavier than `edge-separator`, which draws the grid
rules behind the marks at `{color.base-300}`. `neutral` clears that against Arena's own palette,
and nothing makes it clear it in another: no check compares the two. Against `base-100`, `neutral`
is lighter than `base-300` in fourteen of the sixteen bench palettes (Etsy light 1.18:1 against
1.42:1, Notion dark 1.31:1 against 1.48:1) and equal to it in both of Duolingo's, so every axis,
zero line and crosshair is drawn fainter than the grid, or as faint, which is the reverse of what
the role states.

**Which benches** All eight, in both halves alike. Grafana and ClickUp draw axes.

**What the benches do** Nothing. Each answers `edge-axis` with the store's `{color.neutral}`.

### 8. ArenaMenu's `align` lands on the Angular host as an HTML attribute, and the pair computes different alignments

**Where** `ArenaMenu`'s `align` input, and the `menu` part.

**What happens** The Angular host is the `menu` part, and a static `align="end"` stays on it as an
attribute, which Chromium maps to `text-align: end` the way it maps the legacy presentational
attribute. React's root is a `div` that carries no attribute. The `menu` part computes
`text-align: end` in Angular and `start` in React, and everything inside it that sets no alignment
of its own inherits the difference, the menu's header among them; the items set `text-left`. Arena
already removes the `title` its Angular hosts would otherwise carry, so a native tooltip does not
appear over a card, and `align` is not removed the same way.

**Which benches** ClickUp and Notion, measured on builds of both halves, and Instagram, whose
template carries the same attribute. The pair disagrees.

**What the benches do** Nothing.

### 9. The vocabulary sheets carry a selector Angular's CSS optimiser rejects

**Where** `css/vocabulary/*.css`, whose rules write `&[data-arena-part=…]` inside
`@scope (.arena-…)`.

**What happens** `ng build` prints `130 rules skipped due to selector errors`, listing each
`&[data-arena-part=…] -> Empty sub-selector`, and ships those rules unminified, as written. Bun's
bundler rewrites the same branches to `:scope[data-arena-part=…]` with no warning. One class
therefore compiles to different selectors in the two layers of every pair. Chromium matches both
forms on the element the class is written on: computed sizes, fills and edges of every part agree
between the halves of the five pairs that build, apart from finding 8. What differs is that every
Angular consumer's build reports an error in Arena's sheet that it can neither fix nor silence.

**Which benches** Every Angular half that builds.

**What the benches do** Nothing.

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
- **Two primary actions on Superhuman's screen.** Compose in the sidebar and Reply in the reading
  pane are both filled primaries in one view, and `arena audit` reports the second as
  `one-primary`, so neither half builds. The report is true: Arena keeps the solid fill for the one
  action a view is for, and the brand the bench is drawn after spends it twice.
  `contracts/design/AGENTS.md` and `contracts/design/Scales.md` carry the reasoning; the wording of
  the message is finding 5.
