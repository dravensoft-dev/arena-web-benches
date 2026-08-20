# CLAUDE.md

**This repository is a strict test bench for [Arena](https://github.com/dravensoft-dev/arena). It
is not a product, and nothing here is shipped.** Eight products are mocked twice each, once in
React and once in Angular, from the same `arena.config.json` and the same `design/` directory.
[`README.md`](./README.md) is the page that names them and says how one is run; it is not repeated
here, because two pages saying the same thing is how one of them goes stale.

**This file and [`AUDIT.md`](./AUDIT.md) are the only documentation written for an agent.** Add no
third. A note about one bench belongs in `AUDIT.md` as a finding or nowhere.

## The rule

**A defect you find here is Arena's, and you do not fix it here.** Record it in
[`AUDIT.md`](./AUDIT.md) and stop. That is the whole purpose of the bench: it is the one place
Arena is looked at from outside, and a bench edited to route around a defect is a bench that has
stopped reporting one. Working around it locally destroys the measurement and leaves the defect in
Arena, where every other project meets it.

This holds however small the fix looks. A one-line override in a bench's own CSS is the most
expensive thing you can write here, because it is invisible: the bench keeps building, the
screenshot keeps looking right, and the evidence is gone.

## What is a defect and what is not

The benches are faithful to real brands, so most of what a run reports is the brand and not Arena.
Read the report against this cut before writing anything down.

**Not a defect.** A palette of the bench's own that misses a contrast bar, a ramp outside the
lightness band, a level Arena raises for a palette that needs it, a weight the loaded face does not
carry, a component the bench draws nowhere. Each of these is Arena measuring the bench correctly
and saying so. They are the report working.

**A defect.** Arena renders one thing and its contract says another; the two layers of one pair
answer the same markup differently; an instrument reports the opposite of the truth, or reports
nothing where there is something; a decision the bench has to make by hand through a part hook,
repeatedly, because no role reaches it; a mark that names or points at the wrong thing on screen.

**The pair is the sharpest instrument in the repository.** Both halves of a product are written
from one config and one `design/` directory, so any difference between them is Arena answering two
layers differently. A divergence is a defect even when both halves look fine on their own.

## What may be edited here

Two things, and they are not fixes.

- **A bench answers every role the kernel declares.** A build that stops because a role is
  unanswered is the kernel asking a question, not a defect; answer it in that bench's
  `plugin.tokens.json`, and answer it the same way in both halves of the pair.
- **The two halves of a pair stay identical in config and in `design/`.** If they drift, the
  instrument is broken and nothing it reports can be trusted.

Anything else that makes a bench build or look better is a fix, and a fix belongs in Arena.

## Which Arena a bench is reading

A bench resolves Arena from its own `node_modules`, and what sits there decides what a run means.
Read the installed `package.json` before reading a finding into a report: a bench pointed at a
build assembled from an Arena working tree measures that tree, and a bench pointed at the registry
measures what is published. A finding names which one it came from.

## How this is written

**Everything here and in `AUDIT.md` is in the present tense, and describes what is true now.**
Nothing states what a value used to be, what a run reported before, which change moved it, or what
an upgrade costs. A finding is a claim about the tree as it stands, so it either holds today or it
is deleted; a paragraph explaining how something came to be is history, and the commit log already
holds that and holds it better, because it is dated.
