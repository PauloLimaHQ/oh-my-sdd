---
title: What was investigated, in one line
status: open
created: YYYY-MM-DD
spawned: ""
note: One-line summary for the index — what this doc found, or what it still owes.
---

<!--
Copy to specs/research/short-slug-YYYY-MM-DD.md — the filename MUST end with
the `created:` date (the generator enforces it). Research is dated, not
numbered: never give it a `number:`.

Lifecycle (only the frontmatter changes; the body is FROZEN after its date):
  open       → still an input; nothing decomposed out of it yet
  decomposed → it became the specs in `spawned:` (required then)
  spent      → its findings landed in existing specs; nothing further owed
Corrections after freezing go into the spawned specs, never back here.
-->

# Title — YYYY-MM-DD

> **Frozen snapshot.** True as of YYYY-MM-DD; never updated after.

## Question

What this investigation set out to answer, and for whom.

## Findings

What was learned, with sources. Mark confidence honestly — CONFIRMED (primary
source seen) vs INFERRED (consistent with evidence) vs NOT VERIFIED — so the
specs that build on this know how much weight each claim bears.

## Verdict

What should happen next: which specs this should decompose into, or where
its findings should land. When that happens, flip `status:` and fill
`spawned:` — and stop editing this file.
