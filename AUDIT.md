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

**Grafana's plugin carries no rule at all.** Every decision that console makes is a role it
answers, which is the strongest reading the bench has produced: a register can be a set of answers
rather than a sheet.

## Open findings

### 1. Two products set a component's own padding by hand, on two different parts

**Where** `app-bar.band` and `side-nav.item` with `side-nav.trigger`.

**What happens** No role reaches the padding a component gives its own contents. `pad-surface` is
the room a SURFACE gives what it carries and `pad-control-x` and `pad-control-y` are the room a
CONTROL gives its label, so a product that wants a bar taller than Arena draws it, or a navigation
row shorter, finds neither reaches the part and writes the padding into the slot itself.

**Which benches** Two of eight, in both halves of each pair, and not on the same part: Etsy on
`app-bar.band`, which carries the search field and is the tallest thing on its page, and Superhuman
on the two navigation rows, whose mailbox list is read down rather than pointed at. Each states the
limit in its own stylesheet, and the two sentences are the same sentence.

**What the benches do** They paint it. This is not a count asking for one role, because the two
parts want opposite things: one product spends the space and the other takes it back. It is two
products meeting the same wall, which is that the height of a component is not a question the
kernel asks. Density answers who is pointing at the screen and never what register a product
speaks in, and Superhuman says so outright: the compact class does not reach it either.

### 2. Four overlays publish a part in one layer while they draw nothing in either

**Where** `ArenaSheet`, `ArenaDialog`, `ArenaConfirmDialog` and `ArenaCommandPalette`, on the root
part each binds to its host: `sheet`, `dialog.scrim`, `confirm-dialog` and `command-palette`.

**What happens** Closed, the React half returns null and leaves no node. The Angular half cannot
remove its own host, so the element stays, and its host bindings keep running: it carries the class
that hides it, which is what the `open` variant is for, and it carries the part hook, which is the
public name a style plugin selects. A plugin rule therefore matches an element in one layer and
nothing in the other, and the two contracts that say `Closed renders nothing` say it of a layer
where a part is still published. Nothing measures it: `check:parts` reads both layers as text and
sees a hook in each, and the sinks `check:pixel-parity` compares draw the overlays open.

**Which benches** Four of eight, in the Angular half of each pair and never in the React half:
Etsy on `sheet`, and ClickUp, Notion and Superhuman on `command-palette`. Each pair agrees on every
other part it draws, so the whole difference between a pair is this one hook. Re-derive it by
building both halves and counting `[data-arena-part]` in each.

**What the benches do** Nothing. Both halves write the overlay the way its prompt says to, and the
divergence is entirely Arena's.

## Answered

Kept so the next reader does not raise them again. Each is a decision Arena has taken with its
reason, not an omission.

- **The colour of a card's eyebrow.** ClickUp and Duolingo both paint `card.eyebrow`, and both
  write the identical `color-mix(in oklab, var(--color-base-content) 62%, transparent)`. The count
  clears the bar and the decision is refused, because what the two rules change is how far the line
  is held back rather than which colour it takes, and a colour role names which colour and never
  how held back it is. `contracts/design/StylePlugins.md` carries the reasoning.
- **Nothing inside a chart's plot is reachable.** Grafana paints no part at all, and the reason is
  that its screens are mostly plots. Seven of the eight charts carry no manifest, so they carry
  no slot and no part hook, and a product's data visualisation is the one region of its
  screen a plugin cannot re-skin. It still wears the skin, because every value a chart paints is a
  token the palette moves. `frameworks/CHARTS.md` carries the reasoning.
