---
number: 0001
title: The three-tier document contract (numbered · dated · raw)
status: implemented
created: 2026-07-24
note: The founding spec — defines the filename contract, the frontmatter schema, and the lifecycle every other document in this repository follows.
---

# 0001 — The three-tier document contract

## Why

Documentation rots for one reason: nobody agreed, at write time, on who owes it
maintenance. A design doc written in March is read in November as if it were
still true; a one-off analysis gets cited as policy; a planning artifact
outlives the plan. The fix is not more discipline — it's a **contract encoded
in the filename**, so a reader knows how much to trust a document before
opening it, and a writer knows what they're signing up for before creating it.

## The contract

One question — is the filename numbered, dated, or neither — decides
everything:

| Filename | Contract | Home |
|---|---|---|
| **Numbered** (`0007-…`, `adr/0002-…`) | Durable and **maintained**. Indexed, CI-validated, ships in the same PR as its code, stays after merge. | `specs/` · `specs/adr/` |
| **Dated** (`…-2026-07-24`) | **Frozen snapshot.** True as of that date, never updated after — the date *is* the disclaimer. Feeds specs, then it's spent. | `specs/research/` |
| Neither | Raw input kept for provenance. | `specs/attachments/` |

Corollaries:

- A doc that must stay current **has to be numbered**. If you can't commit to
  maintaining it, date it and freeze it.
- Research **never consumes a spec number** — it's addressed by date. That
  keeps the numbered sequence a record of *what gets built*, not of everything
  ever thought about.
- The pipeline runs one way: `attachments/` → a dated research doc → numbered
  specs. Never backwards.

## Frontmatter schema

Every numbered spec opens with **flat** YAML frontmatter (the parser is
deliberately not a full YAML parser — single-line `key: value` only):

```yaml
---
number: 0042
title: One-line title of the spec
status: draft
created: 2026-07-24
depends_on: "0007, 0031"   # optional — hard build order ONLY
note: One-line summary shown in the index.   # optional
area: billing               # optional — grouping axis for the explorer
---
```

**Status vocabulary:** `draft` (written, not started) · `in-progress` ·
`partial` (some shipped, rest deferred — say what in `note`) · `implemented`
(in code & verified) · `superseded` (retired — link the replacement) ·
`reserved` (number held, spec not written yet).

Research docs carry `title`, `status` (`open` · `decomposed` · `spent` ·
`superseded`), `created` (which must appear in the filename), optional
`spawned` (the specs it produced) and `note` — and, by rule, **no `number`**.

## Lifecycle

1. A spec is born `draft`, usually decomposed out of a research doc or written
   directly from a known requirement.
2. It ships **in the same PR as its code**. When the work lands, its status
   flips to `implemented` (or `partial` — with the remainder named in `note`).
3. It stays after merge: the spec is the durable explanation of why the code
   is shaped the way it is.
4. To retire it, set `status: superseded` and link the replacement in `note`.
   Never delete — the number is a permanent address.

Dependencies are recorded once, as `depends_on`, and only for **hard build
order**. "Blocked" is never written down — it is derived by the generator
(spec 0002) and disappears by itself when the dependency lands.

## Out of scope

- Tooling (the generator and CI check are spec 0002; the explorer is 0003).
- Any prescription about the *body* of a spec beyond the frontmatter — teams
  keep their own section conventions. The one section the tooling understands
  is `## Open questions` (see 0003).
