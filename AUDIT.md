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
on `develop` at `e1275b850`. The two halves of every pair agree on both figures below, which is the
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

**Eleven of the sixteen build.** `build` runs `arena audit --strict=audit` first. Both ClickUp
halves stop on two `unknown-property` findings, the `--arena-tag-cat` and `--arena-board-column-cat`
their plugin reads and nothing defines. Both Instagram halves stop on `menu.item-destructive`. React
Instagram and React Notion stop as well on a `raw-glyph` their Angular halves do not report, which
is entry 50. Every other half reports nothing.

**Every half answers every role the kernel declares.** `arena build` names no role left to Arena's
default in any half. Grafana sets its links in its secondary, which holds 4.5:1 at the body level.
Every other half keeps its links in the body ink: Calendly's, ClickUp's and Instagram's primary does
not hold 4.5:1 there, and Notion, Etsy, Duolingo and Superhuman set links as prose. Calendly,
ClickUp, Instagram and Superhuman colour the text action of a toast in their primary and Grafana in
its secondary. Notion marks its selected tab in the heading ink through `edge-tab-selected`, and
every other half keeps the primary.

**Every glyph is an `ArenaIcon`.** No half links Phosphor's web font, and every glyph a half draws
comes from the `icons-<hash>.svg` sprite `arena build` writes, handed over through
`ArenaIconsProvider` or `provideArenaIcons`. Both halves of every pair write the same sprite.
`arena check` still names glyphs in ClickUp, Duolingo, Notion and React Etsy as drawn by nothing,
which entries 49 and 51 record.

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
  while `develop` holds 605 commits past the `v12.1.1` tag. Among them, Arena ships no icon font, so
  a `<i class="ph-…">` that painted under the published 12.1.1 paints nothing; `ArenaTabs` emits
  `valueChange` (`onValueChange` in React) where it emitted `change`; `ArenaCheckbox` requires
  `label`; and a plugin that answers `heat-step-1` is refused, since the role is gone.
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
- **The bench**: draws every glyph through `ArenaIcon`, binds `valueChange`, names its row
  checkboxes and answers no heat step, which is how it asks for what it already draws.

### 49. `iconMemberGlyphs` loses an `ArenaIcon`'s `icon` when a braced attribute comes before it

- **In Arena**: `ANY_ATTRIBUTE` and `iconMemberGlyphs` in `scripts/generate/core/arena-cli/audit.ts`,
  read by the `glyph` report of `spriteFiles` in `scripts/generate/core/arena-cli/plan.ts`.
- **What it does**: `iconMemberGlyphs` runs `ANY_ATTRIBUTE`, `(?:^|\s)[[(]?[\w.:@-]+[\])]?\s*=\s*`,
  over the tag's attributes with every `{…}` blanked to spaces. After a braced attribute such as
  `key={n}`, the trailing `\s*` of that match swallows the blanked value and the space after it, so
  the `(?:^|\s)` the next attribute needs is gone and `icon` is never read. React Etsy's stars are
  `<ArenaIcon key={n} icon={n < whole ? 'ph-fill ph-star' : 'ph-bold ph-star'} />`, and `arena check`
  prints `[glyph] ph-star is in the sprite, and no ArenaIcon, arena-icon or icon attribute in your
  sources draws it`. Angular Etsy writes `<arena-icon [icon]="…">` with no attribute before it and
  reports nothing, so the pair disagrees on a report count.
- **What it should do**: a literal in an `ArenaIcon`'s `icon` is drawn, which is what the `glyph`
  report counts as drawn, whatever attributes stand before it.
- **Reproduce**: two files, `<ArenaIcon key="k" icon="ph-bold ph-star" />` and
  `<ArenaIcon key={n} icon="ph-bold ph-star" />`; `iconMemberGlyphs` returns `ph-star` for the first
  and nothing for the second. In a bench, `cd react-etsy && bun run measure`.
- **Benches**: Etsy, React only; Angular binds its attributes in brackets and quotes.
- **Correction**: match an attribute start without consuming the separator, a lookbehind or a
  lookahead for the space, so each attribute is found whatever precedes it. `ownAttributeStarts`
  reads `from` off the match end, so its callers are read with the same case.
- **Closed when**: the reproduction returns `ph-star` for both files, and React Etsy's `measure`
  prints no `[glyph]` line.
- **The bench**: nothing.

### 50. `raw-glyph` reports a React `className` that toggles an `arena-` class, which Angular's `[class.x]` does not

- **In Arena**: `bindsClass` and the `raw-glyph` branch of `lineFindings` in
  `scripts/generate/core/arena-cli/audit.ts`.
- **What it does**: in a file that names a Phosphor glyph anywhere, `bindsClass` treats any
  `className` whose value starts with `{` as a class bound to a value, and `arena audit` prints
  `an element whose class is bound to a value, in a file that names a Phosphor glyph, so it may hold
  a Phosphor class, which paints nothing because Arena ships no icon font (raw-glyph)`. React Notion
  writes `<ArenaTag … className={task.status === 'In progress' ? 'arena-accent-primary' : undefined}>`
  and React Instagram `<ArenaAvatar … className={size === 'lg' ? 'arena-size-lg' : undefined} />`:
  each value is one fixed `arena-` class or nothing, and neither can hold a glyph. Their Angular halves
  write the same toggle as `[class.arena-accent-primary]="…"` and `[class.arena-size-lg]="…"`, which
  `bindsClass` does not read, so the audit reports nothing there. Under `--strict=audit` the React
  half does not build and the Angular half does.
- **What it should do**: the same markup gets the same verdict in both layers, and an instrument
  reports a class that can hold a glyph, not one whose every possible value is a fixed `arena-` class.
- **Reproduce**: a `.tsx` holding `const I = 'ph-bold ph-star';` and
  `<ArenaTag className={on ? 'arena-accent-primary' : undefined}>x</ArenaTag>`, under
  `arena audit`: one `raw-glyph` finding. In a bench, `cd react-notion && bun run build`.
- **Benches**: Notion and Instagram, React only; both Angular halves build.
- **Correction**: two. (a) A braced value whose every string literal is a class that is not a
  Phosphor class, and that holds no identifier read from elsewhere, is not a bound class. (b) Read
  Angular's `[class.ph-…]` toggles as React's are, so both layers report alike; this keeps the false
  report and makes it agree.
- **Closed when**: the reproduction prints no finding, and React Notion and React Instagram build.
- **The bench**: nothing; both halves stay as written, and React Notion and React Instagram do not
  build.

### 51. The `glyph` report says no `ArenaIcon` draws a glyph that an `ArenaIcon` draws from a value

- **In Arena**: the `glyph` loop of `spriteFiles` in `scripts/generate/core/arena-cli/plan.ts`, which
  takes drawn glyphs from `iconMemberGlyphs` in `scripts/generate/core/arena-cli/audit.ts`.
- **What it does**: the report counts a glyph as drawn only when a literal stands in an
  `ArenaIcon` or `arena-icon` attribute, an `icon` attribute of an Arena tag, or a `#ph-` symbol
  reference. Every other glyph a source names is reported as `[glyph] ph-link is in the sprite, and
  no ArenaIcon, arena-icon or icon attribute in your sources draws it; an element that draws it
  through a class of its own paints nothing, so hand it to ArenaIcon as icon`. Duolingo's path,
  lesson and profile glyphs sit in data tables drawn as `<ArenaIcon icon={item.icon}>`; ClickUp's
  and Notion's sit in the `items` handed to `ArenaMenu` and `ArenaCommandPalette`, which draw each
  item's `icon`. Every one is on screen, drawn by `ArenaIcon`, and no element draws one through a
  class, so the report's cause is false and its advice is already followed. The exception taken for
  a fill-swapping component bound to an expression covers Grafana's and Superhuman's side nav and
  no other half. The theme toggle splits the pairs further: React writes
  `icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}` in the attribute, Angular binds
  `[icon]="themeIcon()"` to a `computed` holding the literals, so ClickUp, Duolingo and Notion report
  `ph-sun` and `ph-moon` in Angular only.
- **What it should do**: an instrument reports nothing where there is nothing and says what is
  true where it reports (the bench's `CLAUDE.md`); the report's own text names a class as the cause.
- **Reproduce**: `cd react-duolingo && bun run measure`: seventeen `[glyph]` lines, nineteen in
  Angular, each a glyph the path or profile screen draws.
- **Benches**: ClickUp, Duolingo and Notion, both halves, Angular two lines longer.
- **Correction**: two. (a) A glyph a source names is drawn when that source hands an `icon`
  attribute or member an expression, the rule already taken for the fill-swapping components,
  which costs the report on a project that both binds and draws by class. (b) The report says what
  it measured, "no literal in an ArenaIcon, arena-icon or icon attribute names it", and drops the
  cause it cannot know.
- **Closed when**: under (a), the three products' `measure` prints no `[glyph]` line; under (b), no
  `[glyph]` line names a cause no source has.
- **The bench**: nothing; it reads its glyphs from its tables, which is how the members say to pass
  them.

### 52. A click inside an Angular `ArenaCard` stops at the card, and in React it reaches the document

- **In Arena**: `onClick` and `onAnchorClick` in
  `frameworks/angular/components/display/arena-card/ArenaCard.ts`, against `ArenaCard.tsx`.
- **What it does**: the Angular card calls `event.stopPropagation()` on every click that starts in
  it, interactive or not, before it tests `interactive()`, so the host's `(click)` is not run on a
  card that is not a control. The React card leaves the native event alone, so it bubbles to the
  document. A listener the host holds on `document` or on an ancestor hears a click inside a React
  card and never one inside an Angular card.
- **What it should do**: the two layers answer the same markup alike (the bench's `CLAUDE.md`);
  `ArenaCard.json` describes `click` as reporting an activation and says nothing of what it stops.
- **Reproduce**: a non-interactive card and `document.addEventListener('click', () => n++)`; a click
  on the body leaves `n` at `0` in Angular and `1` in React, and the host's own click handler runs in
  neither.
- **Benches**: none depends on it on screen; read in a scratch scene against the same pack.
- **Correction**: two. (a) The React card stops propagation as the Angular card does, which is the
  shape `ArenaTableRow` takes, and the contract says a click inside a card stops there. (b) The
  Angular card stops propagation only on the activations it reports, and keeps a host `(click)` off
  a non-interactive card by naming its output apart from the native event.
- **Closed when**: the reproduction reads the same `n` in both layers, and `ArenaCard.json` says
  which.
- **The bench**: nothing.

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
