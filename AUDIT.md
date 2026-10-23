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
on `develop` at `9237c5edf`. The two halves of every pair agree on both figures below, which is the
claim the paired mock exists to test.

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

**Every half answers every role the kernel declares.** `arena build` names no role left to Arena's
default in any half. Grafana sets its links in its secondary, which holds 4.5:1 at the body level.
Every other half keeps its links in the body ink: Calendly's, ClickUp's and Instagram's primary does
not hold 4.5:1 there, and Notion, Etsy, Duolingo and Superhuman set links as prose. Calendly,
ClickUp, Instagram and Superhuman colour the text action of a toast in their primary and Grafana in
its secondary.

**Every glyph is an `ArenaIcon`.** No half links Phosphor's web font, and every glyph a half draws
comes from the `icons-<hash>.svg` sprite `arena build` writes, handed over through
`ArenaIconsProvider` or `provideArenaIcons`. Both halves of every pair write the same sprite.

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
  while `develop` holds 454 commits past the `v12.1.1` tag. Among them, Arena ships no icon font, so
  a `<i class="ph-…">` that painted under the published 12.1.1 paints nothing, and `ArenaTabs` emits
  `valueChange` (`onValueChange` in React) where it emitted `change`.
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
- **The bench**: draws every glyph through `ArenaIcon` and binds `valueChange`, which is how it asks
  for what it already draws.

### 2. `arena check` reports `ArenaIconsProvider` as a component Arena does not ship

- **In Arena**: `resolveComponents` in `scripts/generate/core/arena-cli/components.ts`, whose
  `unplaced` list becomes the `[components]` report in `scripts/generate/core/arena-cli/steps.ts`.
- **What it does**: a React name imported from the package and opened as a JSX tag, which the
  component map does not hold, is reported. `ArenaIconsProvider` is both, so every React project
  that follows the install guide prints
  `[components] ArenaIconsProvider is not a component this package ships, so no sheet was added for it`.
- **What it should do**: the report exists to separate a typo from a component whose sheet is
  missing, as `unplacedProblems` in `scripts/check/arena/check-consumer.ts` states. A provider Arena
  exports and its install guide (`skills/design/references/install.md`) tells the project to render
  is neither, so it is not reported.
- **Reproduce**: `cd react-etsy && bun run measure`. `arena check` prints the line above;
  `cd angular-etsy && bun run measure` prints no `[components]` line.
- **Benches**: every React half, and no Angular half, whose `provideArenaIcons` is a function and
  not a tag. So every pair disagrees by exactly one report: React counts one more than Angular in
  all eight.
- **Correction**: the component map the package carries names the package's non-component exports
  that a consumer renders as a tag (`ArenaIconsProvider`, and any other provider or context
  component the index exports), and `resolveComponents` places them as drawing no sheet, the way a
  chart already resolves to none. Generating that list from the package index minus the components
  keeps it from drifting.
- **Closed when**: `arena check` reports the same count in both halves of every pair, and prints no
  `[components]` line for any React half.
- **The bench**: nothing; the report does not stop a build.

### 3. `raw-glyph` reads a glyph nested in a JSX prop as a class of the component holding the prop

- **In Arena**: the `raw-glyph` rule of `arena audit`, in the tag loop of
  `scripts/generate/core/arena-cli/audit.ts`, which tests `classValues(raw)` over a tag's whole
  attribute text.
- **What it does**: in JSX a tag's attribute text holds every element passed through a prop, so a
  glyph inside a prop is reported twice: once at its own `<i>`, and once at the tag that holds the
  prop, which carries no glyph. `<ArenaAppBar brand={<a><i className="ph-fill ph-storefront" /></a>}>`
  is reported at the `<i>` and at `ArenaAppBar`. Every rule that reads `classValues(raw)` reads a
  nested element's `className` as the outer tag's own in the same way.
- **What it should do**: report an element for the classes on that element only, which is how the
  Angular half of the same markup is read, since Angular projects the brand as a child.
- **Reproduce**: a `.tsx` file holding the line above, under `arena audit --src <dir>`, prints two
  `raw-glyph` lines whose line numbers are the `ArenaAppBar` line and the `<i>` line.
- **Benches**: the Etsy brand slot is the shape that shows it. No half draws a raw glyph, so none
  reports it today; the probe above reproduces it from the React package of this tree.
- **Correction**: `classValues` reads only the tag's own attributes, skipping any `{…}` expression
  whose content opens a JSX element, so a nested element is read when the loop reaches its own tag.
  Every rule that reads `classValues(raw)` takes the corrected reading at once.
- **Closed when**: the probe prints one `raw-glyph` line, at the `<i>`.
- **The bench**: nothing; it draws no raw glyph.

### 4. `raw-glyph` misses a glyph whose class comes from a value, which `arena build` reads

- **In Arena**: the `raw-glyph` rule of `arena audit` in `scripts/generate/core/arena-cli/audit.ts`,
  against the glyph scan of `scripts/generate/core/arena-cli/icon-css.ts` that `arena build` reads
  the sprite from.
- **What it does**: an `<i>` whose class is a value, such as `className={tab.icon}`,
  `class="{{ entry.icon }} ptabs__icon"` or `[class]="themeIcon()"`, is not reported, although the
  value is a whole `ph-*` literal elsewhere in the same sources and `arena build` writes that glyph
  into the sprite. The element paints nothing and the audit says nothing.
- **What it should do**: `arena build` and `arena audit` read the same sources, so a glyph the build
  finds and that no `ArenaIcon` draws is one the audit can name: the rule's own description in
  `audit.ts` is an element that holds a Phosphor class, and this element holds one at runtime.
- **Reproduce**: a source holding `const TABS = [{ icon: 'ph-bold ph-kanban' }]` and
  `<i className={TABS[0].icon} />`, under `arena build` then `arena audit`: the sprite holds
  `ph-bold-kanban` and the audit prints no finding.
- **Benches**: one ClickUp glyph, four of Duolingo's, three of Instagram's and six of Notion's, each
  drawn from a data table, and both halves of each of those pairs agree. Instagram's theme toggle is
  one more in Angular only, because that half reads it from a computed where the React half writes
  the ternary inline; the rule answers the same way in both layers, and the markup is what differs.
  No half draws a raw glyph today, so none reports it.
- **Correction**: two, and the first is the one the benches would take. (a) The audit reports an
  element other than `ArenaIcon` whose class is bound to an expression, in a file whose sources the
  glyph scan found a `ph-*` literal in, as `raw-glyph` with the wording "may hold a Phosphor class",
  since the binding cannot be resolved statically. (b) `arena build` reports a glyph it wrote into the
  sprite that no `ArenaIcon`, `arena-icon` or `icon` member draws, which catches the same element
  from the other end at the cost of a report per data table.
- **Closed when**: the reproduction above prints one `raw-glyph` finding.
- **The bench**: nothing; it draws every glyph through `ArenaIcon`.

### 5. Four role defaults are written in a form a style plugin is refused for writing

- **In Arena**: the defaults in `contracts/design/roles.json`, against `pluginTokenProblems` in
  `scripts/generate/core/arena-cli/theme-css.ts`.
- **What it does**: `tt-key` defaults to `{case.none}`, and a plugin that writes that value is
  refused with `"tt-key" is "{case.none}", not one of none, uppercase, lowercase, capitalize.`
  `ink-key` defaults to `{ink-muted}`, `ink-link` to `{ink-body}`, and a plugin that writes either is
  refused with `a colour role takes a {color.*} alias only`. `arena build` prints these roles as
  "take Arena's default", so a project that answers one by copying its default from the contract is
  stopped. A plugin cannot say "a key follows the muted ink" at all, although that is what the
  kernel does.
- **What it should do**: a role's default is an answer, so a plugin may write it. That is the claim
  of `contracts/design/StylePlugins.md`, where every role is a question the plugin answers.
- **Reproduce**: in any bench, set `"tt-key": { "$type": "keyword", "$value": "{case.none}" }` or
  `"ink-key": { "$type": "color", "$value": "{ink-muted}" }` in `plugin.tokens.json` and run
  `arena build`.
- **Benches**: every half, in both layers alike. Each answers `tt-key` with `none` and the three ink
  roles with `{color.base-content}`, which the kernel holds back at each role's own level.
- **Correction**: `pluginTokenProblems` accepts a keyword role's alias when it resolves to one of
  the role's values, and a colour role's alias when it names another colour role; both resolve
  through the catalogue the build already holds. Rewriting the defaults into plugin grammar instead
  costs the meaning of `{ink-muted}`, which follows a plugin that moves the muted ink.
- **Closed when**: the reproduction builds, and `arena build` writes `--tt-key: none` and
  `--ink-key: var(--ink-muted)`.
- **The bench**: answers each role in the grammar the build accepts, which is the answer it would
  give anyway.

### 6. The five heat steps are roles a style plugin can answer only one way

- **In Arena**: `heat-step-1` to `heat-step-5` in `contracts/design/roles.json`, against the
  colour-role rule of `pluginTokenProblems` in `scripts/generate/core/arena-cli/theme-css.ts` and
  `heatLadder` in `scripts/generate/core/arena-cli/oklab.ts`.
- **What it does**: a colour role takes a `{color.*}` alias only, and a palette holds exactly one
  ladder that keeps the order and the 0.06 OKLab L gap the roles demand, `heat-1` to `heat-5`, which
  `heatLadder` derives from `cat-4` unless the palette pins all five. Every other colour of a palette
  is a category or a tone, chosen for identity rather than magnitude, so an alias to one breaks the
  order in one theme or the other, and the answer a plugin can give in practice is the default. The
  decision the roles present as a style plugin's is the palette's.
- **What it should do**: a role is a question with more than one honest answer
  (`contracts/design/StylePlugins.md`). A decision with one answer is either not a role or a role
  that takes something a plugin can vary.
- **Reproduce**: in Etsy, answer `heat-step-1` with `{color.cat-2}` and `heat-step-2` with
  `{color.primary}`, then run `arena check`: it prints `[heat] light: heat, steps 2 and 3: step 3 is
  no further from the surface than step 2, and roles.json orders the steps by magnitude`, and the
  same for dark.
- **Benches**: every half, which answers `heat-step-N` with `{color.heat-N}`. No bench draws a
  heatmap.
- **Correction**: two. (a) The roles go, and the ladder stays the palette's, pinned in
  `arena.config.json` or derived. (b) One role replaces the five and names the slot the ladder is
  grown from, `heat-source`, defaulting to `{color.cat-4}`, so a plugin chooses the hue and
  `heatLadder` keeps the order and the gap.
- **Closed when**: no role a style plugin answers has only its default as a valid answer, which a
  `check:role-contract` case can hold.
- **The bench**: answers with the default, which is the one valid answer.

### 7. A side nav badge given as a string is drawn in React and refused in Angular

- **In Arena**: the `badge` member of `ArenaSideNavItem` in both layers, and `arenaBadgeCount` in
  `frameworks/react/components/navigation/NavRow` and its Angular twin.
- **What it does**: the contract types `badge` as a number. React draws a string without a word:
  `arenaBadgeCount('2')` returns `"2"` and `arenaBadgeCount('120')` returns `"99+"`, since the
  comparisons coerce, and a non-numeric string draws nothing. Angular's strict template check refuses
  a string at compile time. So the same data in both halves of a pair is drawn by one layer and
  refused by the other, and React holds the contract only where a project type-checks its JSX, which
  a project built by a bundler that strips types does not.
- **What it should do**: both layers answer the same value the same way, which is the claim the
  paired layers make.
- **Reproduce**: `<ArenaSideNavItem id="a" label="A" badge={'120' as unknown as number} />` in React
  draws `99+`; `<arena-side-nav-item id="a" label="A" [badge]="'120'" />` in Angular fails `ng build`.
- **Benches**: Grafana and Superhuman, whose nav data holds the count as a string. The React half
  passes it through as it is; the Angular half converts it with a `badge()` helper of its own, so
  the two halves are written differently to draw the same row.
- **Correction**: two. (a) Both layers accept a numeric string: Angular's input takes
  `transform: numberAttribute`, React's prop is typed `number | \`${number}\`` and normalised with
  `Number()` before `arenaBadgeCount`, so a count read from data needs no helper. (b) Both refuse
  it: React warns once through `arenaWarnOnce` when `badge` is not a number, and draws nothing, as
  Angular's build refuses it.
- **Closed when**: Angular Grafana and Angular Superhuman build with `[badge]="one.badge"` and no
  helper under (a), or React Grafana warns in the console under (b).
- **The bench**: nothing; each half stays as written, which is what makes the divergence visible.

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
