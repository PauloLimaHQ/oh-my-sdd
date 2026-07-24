---
number: NNNN
title: One-line title — what this spec builds
status: draft
created: YYYY-MM-DD
depends_on: ""
note: One-line summary for the index. Keep it on ONE line — the frontmatter parser is flat-only.
area: ""
---

<!--
Copy to specs/NNNN-short-slug.md (4-digit number, must match `number:` above).
Delete `depends_on:` / `note:` / `area:` if unused — they're optional.
depends_on is HARD BUILD ORDER only; anything softer goes in `note` as prose.
After saving: node specs/generate-index.mjs
-->

# NNNN — Title

## Why

The problem or opportunity, in the reader's terms. What breaks or stays
impossible if this isn't built? Cite evidence: a research doc
(`research/…-YYYY-MM-DD.md`), an incident, a user request.

## Design

The shape of the solution: data model, interfaces, behaviors, invariants.
Write it so someone could implement from this section alone. Prefer tables
and contracts over prose where it's denser.

## Out of scope

What this spec deliberately does NOT cover, and — for anything deferred —
the written trigger that would revive it ("revisit when X happens").

## Open questions

<!-- Itemize (numbered or bulleted) so the explorer can triage them.
     Resolve inline, in place, in this exact shape:
     ✅ **RESOLVED YYYY-MM-DD** — the answer. -->

1. **Q1 — First unresolved question?** Context on why it's open and what
   would settle it.
