# AUDIT

**The work list the benches hand to Arena.** [`CLAUDE.md`](./CLAUDE.md) states the rule this file
exists to serve: a defect found in a bench is Arena's, it is not fixed here, and it is written down
here. Each open entry is written to be picked up in the Arena repository and corrected there
without reopening this one: it names the Arena source to change, what that source does, what it
should do, how to reproduce it, and which check closes it.

Every entry is a claim about Arena as it stands. One that stops being true is deleted rather than
amended, and nothing here records what a value was, which change moved it, or what a run reported
before.

## How an entry is written

An open entry carries every one of these, in this order, and an entry missing one is not yet a
finding:

- **In Arena**: the source file and the exported function, rule, role or member to change. A file
  and a name, never a line number, because a line moves with every commit and a name does not.
- **What it does**: what Arena does, with the exact text it prints where it prints one.
- **What it should do**: what the contract says, and which contract file says it.
- **Reproduce**: the smallest input and command that shows it, runnable from an Arena checkout or
  from a bench.
- **Benches**: which benches show it, and whether both halves of each pair do. A pair that
  disagrees is a different and sharper finding than a pair that agrees.
- **Correction**: the change to make in Arena. Where there is more than one honest correction, each
  is named with what it costs, and the first is the one the benches would take.
- **Closed when**: the check that shows the correction landed, read from a bench rebuilt against it.
- **The bench**: what the bench does about it, which is normally nothing. A bench that works around
  a defect has stopped measuring it, so a workaround is part of the finding and not a footnote.

An entry naming a bench's own palette, ramp, level or unused component is not a finding; that cut
is in [`CLAUDE.md`](./CLAUDE.md).

## The measurement

Every half is read with `bun run measure`, which runs `arena build`, `arena check`, `arena audit`
and `arena usage` over `src` and `design`, against Arena 12.1.1 packed from the Arena working tree
on `develop` at `08d6ea51b`. The two halves of every pair agree on both figures below, which is the
claim the paired mock exists to test.

| Product | Components drawn | Parts the plugin paints |
|---|---|---|
| Calendly | 21 | 5 |
| ClickUp | 37 | 14 |
| Duolingo | 10 | 4 |
| Etsy | 27 | 2 |
| Grafana | 29 | 0 |
| Instagram | 17 | 7 |
| Notion | 28 | 12 |
| Superhuman | 20 | 0 |

**Every one of the hundred components Arena ships is drawn by at least one pair**, in both of its
halves, so no component reaches a release without a bench having asked for it in each layer.

Thirty-nine distinct parts are painted by hand across the six plugins that paint any. No bench
reports a raw colour, a bare length, a gradient outside a declared mark, a rule reaching into an
`arena-` class, or a declaration restating what the slot it selects already paints. Four plugin
rules reach nothing the half draws: Duolingo's `input.field`, `input.label` and `menu.item`, which
`arena usage` names, and Instagram's `menu.item-destructive`, a part no component declares, which
`arena audit` reports as `unknown-part`.

**Twelve of the sixteen build.** `build` runs `arena audit --strict=audit` first. Both ClickUp
halves stop on two `unknown-property` findings, the `--arena-tag-cat` and `--arena-board-column-cat`
their plugin reads and nothing defines. Both Instagram halves stop on `menu.item-destructive`. Each
of those is a rule of the bench's own design, and both halves of each pair stop alike. Every other
half reports nothing.

**Every half answers every role the kernel declares.** `arena build` names no role left to Arena's
default in any half. Grafana sets its links in its secondary, which holds 4.5:1 at the body level.
Every other half keeps its links in the body ink: Calendly's, ClickUp's and Instagram's primary does
not hold 4.5:1 there, and Notion, Etsy, Duolingo and Superhuman set links as prose. Calendly,
ClickUp, Instagram and Superhuman colour the text action of a toast in their primary and Grafana in
its secondary. Notion marks its selected tab in the heading ink through `edge-tab-selected`, and
every other half keeps the primary.

**Every glyph is an `ArenaIcon`.** No half links Phosphor's web font, and every glyph a half draws
comes from the `icons-<hash>.svg` sprite `arena build` writes, handed over through
`ArenaIconsProvider` or `provideArenaIcons`. Both halves of every pair write the same sprite,
and `arena check` prints no `[glyph]` line in any half.

**A native click reaches the page alike in both layers.** Every half binds an Arena component's
activation as `activate` (`onActivate`) and its value as `valueChange` (`onValueChange`), and binds
`click` and `change` only on native elements. In a scene drawn with the same pack, one click on the
body of a card that is not interactive reaches a `document` listener once in each layer, and a click
on an `ArenaButton`, an `ArenaCheckbox`'s label or an interactive card reports the same document
clicks, `change` events and component events in React as in Angular.

**Superhuman's plugin carries no rule.** Its side nav rows are answered by `pad-nav-row-y`
and Etsy's band by `pad-band-y`, so those two decisions are roles and not sheets.

**Grafana's plugin carries no rule at all.** Every decision that console makes is a role it
answers, which is the strongest reading the bench has produced: a register can be a set of answers
rather than a sheet.

## Open findings

### 1. The `develop` tree carries breaking changes under the version npm already publishes

- **In Arena**: the version the release build stamps into `frameworks/react/dist/package.json` and
  `frameworks/angular/dist/package.json`.
- **What it does**: both packages assembled from `develop` say `12.1.1`, the version npm serves,
  while `develop` holds 643 commits past the `v12.1.1` tag. Among them, Arena ships no icon font, so
  a `<i class="ph-…">` that painted under the published 12.1.1 paints nothing; `ArenaTabs` and every
  component that reports a value emit `valueChange` (`onValueChange` in React) where they emitted
  `change`, and every component that reports an activation emits `activate` (`onActivate`) where it
  emitted `click`; `ArenaCheckbox` requires `label`; and a plugin that answers `heat-step-1` is refused, since the role is gone.
- **What it should do**: a release that removes the icon font and renames an output is a major
  version, so the tree that holds them says 13.0.0, or a pre-release of it, before anything is
  packed from it.
- **Reproduce**: in Arena, `git log --oneline v12.1.1..HEAD` lists the commits, and
  `jq .version frameworks/react/dist/package.json` after `bun run build:release` prints `12.1.1`.
- **Benches**: every half, since each reads the packed tarballs. A bench half written against the
  published 12.1.1 fails `--strict=audit` on its first raw glyph, and Angular Notion fails to
  compile on `(change)`.
- **Correction**: bump the version on `develop` to the next major when the first breaking change
  lands, so a pack of the tree never carries a published number.
- **Closed when**: a pack of `develop` names a version npm has not published, and `benches.json`
  declares it.
- **The bench**: draws every glyph through `ArenaIcon`, binds `activate` and `valueChange`, names
  its row checkboxes and answers no heat step, which is how it asks for what it already draws.

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
- **An `ArenaIcon` carries no class of the project's own.** A bench that coloured one glyph apart
  from its neighbours, such as Instagram's pressed heart, wraps it in an element of its own and
  colours that, because the glyph takes the colour and size of the text around it. The contract on
  `ArenaIcon` says so, and a rule matching the sprite reference inside the svg would read markup
  the contract does not promise.
- **`unknown-input` reads Angular templates only.** Neither layer reports a binding to an output a
  component lacks, such as `(change)` or `onChange` on `ArenaTabs`. The rule is written for a static
  attribute on an `arena-` element in an Angular template, which is what its description in
  `scripts/generate/core/arena-cli/audit.ts` says; a React project reads a prop it lacks through its
  type check.
- **The sprite is served by a step the toolchain adds.** `arena.icons.generated.js` exports the
  sprite's file name, not a URL a bundler wrote, so every React half copies `icons-<hash>.svg` in its
  `build` and serves it from `Server.ts`, and every Angular half adds an `assets` entry. Importing
  the `.svg` as an asset is refused because Vite inlines a small one as a `data:` URL an
  `<svg><use>` does not load; each bundler family page under `skills/design/references/bundlers/`
  carries the step instead, Bun's beside the others.
- **The focus ring takes no role.** Fifteen manifests read `var(--focus-ring)`, which
  `contracts/design/colors.css` maps to the secondary and `COMPAT_ALIASES` refuses a plugin. The
  ring is one of the floors `contracts/design/StylePlugins.md` keeps out of a plugin's reach with the
  3:1 it carries, so its colour moves with the palette and no plugin answers it.
