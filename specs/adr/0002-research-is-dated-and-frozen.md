# 0002 — Research is dated and frozen, never numbered

Status: accepted
Date: 2026-07-24

## Context

Pre-spec investigation (feasibility analyses, domain research, coverage
audits) is valuable but perishable. Two failure modes appear when it mixes
with maintained docs: an old analysis gets read as current policy, or the
sequence of spec numbers fills up with documents that never produced a build.

## Decision

Research lives in `specs/research/`, addressed by **date, not number** — the
filename must carry its `created` date (the generator enforces this), and a
research doc is **never revised after its date**. The date is the disclaimer.

What changes over time is not the content but the doc's *debt*: `open` (still
an input, nothing decomposed yet) → `decomposed` (it became the specs in
`spawned:`) or `spent` (its findings landed in existing specs). The
`spawned:` edge is the research doc's product; `decomposed` without it fails
validation.

The pipeline runs one way: raw material in `attachments/` → a dated research
doc → numbered specs. Research never consumes a spec number, so the numbered
sequence stays a record of what actually gets built.

## Consequences

- Readers can cite research fearlessly: the date tells them exactly how much
  to trust it.
- Corrections to a decomposed research doc go into its spawned specs, never
  back into the frozen doc.
- The index shows at a glance which research still owes work (🟠 open).
