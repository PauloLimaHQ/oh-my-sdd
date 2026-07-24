# Specs index

Single source of truth for **what this project is and what's actually built**.
Every durable decision lives here as a numbered spec or an ADR; every frozen
investigation is dated in `research/`; every raw input is kept in
`attachments/`. Start with the contract table below, then read the specs your
work touches.

## What lives where

**The filename tells you the contract.** One question — is it numbered, dated, or
neither — decides how much you owe it:

| Filename | Contract | Home |
|---|---|---|
| **Numbered** (`0088-…`, `adr/0011-…`) | Durable and **maintained**. Indexed, CI-validated, ships in the same PR as its code, stays after merge. | this folder · [`adr/`](adr/) |
| **Dated** (`…-2026-07-16`) | **Frozen snapshot.** True as of that date, never updated after — the date *is* the disclaimer. Feeds specs, then it's spent. | [`research/`](research/) |
| Neither | Raw input kept for provenance. | [`attachments/`](attachments/) |

So: **numbered = maintained · dated = frozen · neither = raw.** A doc that must
stay current has to be numbered; if you can't maintain it, date it and freeze it.
Research deliberately **never consumes a spec number** — it's addressed by date.

## How tracking works

1. **Each spec carries YAML frontmatter** — `number`, `title`, `status`,
   `created` (optional `note`, optional `depends_on`). That frontmatter is the
   source of truth.
2. **This index is generated** from that frontmatter. After you add a spec or
   change a `status:`, run:
   ```bash
   node specs/generate-index.mjs
   ```
3. **A spec ships in the same PR as its code** and stays after merge. When work
   lands, flip its `status` to `implemented` (or `partial`) — don't leave it
   `draft`. To retire a spec, set `status: superseded` and link the replacement.

**Status vocabulary:** `draft` (written, not started) · `in-progress` ·
`partial` (some shipped, rest deferred — see note) · `implemented` (in code &
verified) · `superseded` · `reserved` (number held, spec not written yet).

## Dependencies (`depends_on`)

A spec may declare `depends_on: "0085, 0086"` — **hard build order only**: this
spec cannot be built until those exist. Anything softer (siblings, "refines",
same theme) stays prose in `note`; a `depends_on` that means "vaguely related"
is noise and makes the ⛔ below wrong.

Record the **dependency**, never the blockage. `depends_on` is a permanent fact
(a spec is built on its dependency's foundation whether or not that dependency
has shipped), so it never goes stale. **Blocked is derived, not stored** — the generator marks ⛔ when a
pending spec depends on one that hasn't landed, and the mark disappears by
itself when the dependency flips to `implemented`/`partial`. There is no
`blocked_by` field to hand-maintain, and no reverse `blocks:` edge — the
generator derives that too, so each edge is written exactly once. Unknown
targets and cycles fail the generator.

**Current state:** 3 specs — implemented 3 · 1 research doc.

## Specs

⛔ = blocked: a dependency hasn't landed yet.

| # | Title | Status | Created | Depends on | Notes |
|---|-------|--------|---------|------------|-------|
| [0001](0001-three-tier-document-contract.md) | The three-tier document contract (numbered · dated · raw) | ✅ implemented | 2026-07-24 | — | The founding spec — defines the filename contract, the frontmatter schema, and the lifecycle every other document in this repository follows. |
| [0002](0002-generated-index-and-ci-check.md) | Generated index + CI validation (generate-index.mjs) | ✅ implemented | 2026-07-24 | [0001](0001-three-tier-document-contract.md) | The index is a build artifact of the specs' frontmatter, never hand-edited; CI fails when it's stale or the graph is broken. |
| [0003](0003-local-specs-explorer.md) | Local specs explorer (browse, search, triage open questions) | ✅ implemented | 2026-07-24 | [0001](0001-three-tier-document-contract.md), [0002](0002-generated-index-and-ci-check.md) | A zero-dependency local web UI over the sequence — reads from disk on every request, so it is never stale; its one write is appending a RESOLVED line to an open question. |

## Reserved / planned

Numbers held for specs not yet written, so the sequence stays legible.

| # | Title | Status | Created | Notes |
|---|-------|--------|---------|-------|


## Research

Dated, **frozen** pre-spec investigation in [`research/`](research/) — analyses,
domain research, coverage reviews. A research doc is never revised after its date;
what changes is whether it still owes work:

🟠 **open** = still an input, nothing decomposed out of it yet · ✅ **decomposed**
= it became the specs listed · ⚪ **spent** = its findings landed in existing specs.

The pipeline: [`attachments/`](attachments/) → a dated research doc → numbered
specs. Research **never consumes a spec number** — that's what keeps the sequence
a record of what gets built.

| Doc | Title | Status | Date | Spawned | Notes |
|-----|-------|--------|------|---------|-------|
| [sdd-system-extraction-2026-07-24](research/sdd-system-extraction-2026-07-24.md) | Extraction of the spec system from its source repository | ✅ decomposed | 2026-07-24 | [0001](0001-three-tier-document-contract.md), [0002](0002-generated-index-and-ci-check.md), [0003](0003-local-specs-explorer.md) | The origin story — what was lifted from the private repo where this system grew (110 specs, 12 ADRs, 10 research docs over ~7 weeks) and what was deliberately left behind. |

## ADRs

Architecture decisions — see [`adr/`](adr/).

| # | Decision |
|---|----------|
| [0001](adr/0001-frontmatter-is-the-source-of-truth.md) | Frontmatter is the source of truth; the index is a build artifact |
| [0002](adr/0002-research-is-dated-and-frozen.md) | Research is dated and frozen, never numbered |
| [0003](adr/0003-zero-dependency-tooling.md) | Tooling is zero-dependency, copy-paste-portable Node |

---

_Generated by `specs/generate-index.mjs` — do not edit this file by hand; edit spec frontmatter and regenerate._
