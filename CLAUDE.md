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

Three things, and none of them is a fix.

- **A bench answers every role the kernel declares.** A build that stops because a role is
  unanswered is the kernel asking a question, not a defect; answer it in that bench's
  `plugin.tokens.json`, and answer it the same way in both halves of the pair.
- **The two halves of a pair stay identical in config and in `design/`.** If they drift, the
  instrument is broken and nothing it reports can be trusted.

- **The repository's own plumbing.** How the sixteen are installed, built and published, and
  which version of Arena they read. That is this repository being a repository rather than being a
  bench, and it reaches no `arena.config.json` and no `design/`. A change that moves what a bench
  DRAWS is not plumbing, whatever it is filed as; how a bench ASKS for something it already draws
  is, which is why every raster is named relative to the half rather than to a domain root.

  **The pair is declared in `bundlers.json`, and the published site is declared in
  `arena-adopter.json`**, the manifest in the shape Arena reads. `bun run build` reads the first and
  writes the one directory Arena consumes, with the second beside the halves. A pair the manifests do
  not name is a pair the published site does not carry, and Arena's own gate refuses an output that
  declares a half it does not hold or holds one it does not declare. Nothing else crosses between the
  two repositories.

Anything else that makes a bench build or look better is a fix, and a fix belongs in Arena.

## Which Arena a bench is reading

Six halves are workspaces of the root package, so one `bun install` resolves them together and
what sits in the root `node_modules` decides what those runs mean. The other ten (Etsy, ClickUp,
Duolingo, Grafana and Superhuman) are adopters of their bundler with an install, a lockfile and a
`README.md` of their own: what sits in their own `node_modules` decides what they mean. Each half keeps a `node_modules` of its own holding what it
resolves, which is what makes a React half measure with `@dravensoft/arena-react`'s CLI and an
Angular half with the other's; the two packages ship a byte-identical CLI, so either is the same
program.

Read the installed `package.json` before reading a finding into a report: a bench pointed at a
build assembled from an Arena working tree measures that tree, and a bench pointed at the registry
measures what is published. A finding names which one it came from.

## Git

**One branch exists, and it is `main`.** Nothing is developed in this repository: a bench is a
mock written to exercise Arena, and the only changes it takes are the version of Arena it reads
and the answer it gives a role the kernel declares. Neither of those is work that outlives the
commit that makes it, so a `develop` branch has nothing to hold and a feature branch has nothing
to isolate. **Commit to `main`, and open no second branch**, whatever a habit or a harness default
suggests. A defect found here is not developed here either; it is written into
[`AUDIT.md`](./AUDIT.md) and fixed in Arena, which is where the branches are.

## How this is written

**Everything here and in `AUDIT.md` is in the present tense, and describes what is true now.**
Nothing states what a value used to be, what a run reported before, which change moved it, or what
an upgrade costs. A finding is a claim about the tree as it stands, so it either holds today or it
is deleted; a paragraph explaining how something came to be is history, and the commit log already
holds that and holds it better, because it is dated.
