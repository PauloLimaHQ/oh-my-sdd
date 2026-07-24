---
title: Extraction of the spec system from its source repository
status: decomposed
created: 2026-07-24
spawned: "0001, 0002, 0003"
note: The origin story — what was lifted from the private repo where this system grew (110 specs, 12 ADRs, 10 research docs over ~7 weeks) and what was deliberately left behind.
---

# Extraction of the spec system from its source repository — 2026-07-24

> **Frozen snapshot.** True as of 2026-07-24; never updated after. Its
> conclusions live on in the spawned specs.

## Where this comes from

This template was not designed in the abstract. It was extracted from a
private product repository where the system carried real weight: **110
numbered specs, 12 ADRs, and 10 dated research docs written over roughly
seven weeks**, spanning two product families, dozens of integrations, and a
compliance domain where "why is the code shaped this way" is a question with
legal consequences. The conventions below survived that load; the ones that
didn't aren't here.

## What was extracted

1. **The three-tier filename contract** — numbered = maintained, dated =
   frozen, neither = raw. This single rule did the most work in the source
   repo: it ended every argument about whether an old doc was "still true".
   → spec 0001.
2. **Frontmatter as source of truth + a generated, CI-checked index** — the
   index never lied because it never had an opinion. Blocked status and
   reverse edges derived, never stored. → spec 0002.
3. **The local explorer** — browse/search/triage tooling that reads from disk
   on every request, with exactly one write: appending `✅ RESOLVED` to an
   open question. → spec 0003.
4. **Working practices** that lived in the source repo's `CLAUDE.md`: a spec
   ships in the same PR as its code; statuses flip when work lands; research
   decomposes into specs and is then spent. → distributed across 0001–0003
   and the root docs.

## What was deliberately left behind

- All domain content (the ERP families, connectors, compliance rules) — the
  110 specs themselves are the source repo's business, not the method.
- The source repo's family-specific tooling (a hardcoded spec-area
  classifier); genericized here into an optional `area:` frontmatter key.
- A hand-maintained "reserved numbers" habit that predated the
  `status: reserved` frontmatter — the template keeps only the frontmatter
  form.

## Verdict

The method generalizes: nothing in the contract, the generator, or the
explorer depends on the source domain. Decomposed into specs 0001–0003;
corrections and evolution happen there, never here.
