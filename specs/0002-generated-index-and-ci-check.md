---
number: 0002
title: Generated index + CI validation (generate-index.mjs)
status: implemented
created: 2026-07-24
depends_on: "0001"
note: The index is a build artifact of the specs' frontmatter, never hand-edited; CI fails when it's stale or the graph is broken.
---

# 0002 — Generated index + CI validation

## Why

A hand-maintained index is a second copy of the truth, and second copies
drift. The moment `specs/README.md` can disagree with a spec's frontmatter,
readers stop trusting both. So the index is **generated**: frontmatter is the
single source of truth, `specs/README.md` is a build artifact, and CI refuses
the "forgot to regenerate" case.

## Behavior

`node specs/generate-index.mjs` reads every `NNNN-*.md` in `specs/`, every doc
in `specs/research/`, and every `NNNN-*.md` in `specs/adr/`, then rewrites
`specs/README.md`. With `--check` it writes nothing and exits non-zero on any
problem — that's the CI mode.

Problems **accumulate** instead of throwing on the first one, so a single run
reports every broken spec rather than making you fix them one at a time.

## Validations

- Required frontmatter (`number`, `title`, `status`, `created` on specs;
  `title`, `status`, `created` on research), known status values.
- `number` must agree with the filename prefix; duplicates fail.
- `depends_on`: 4-digit targets only, target must exist, no self-reference,
  no cycles.
- Research: must **not** have a `number`; the filename must carry the
  `created` date; `spawned` targets must exist; `decomposed` requires a
  non-empty `spawned`.
- Links: every relative `.md` link, and every backticked repo path of the
  form `specs/<path>.md`, in every spec, ADR, and research doc must resolve.
  Dead references rot silently without this pass.

## Derived, never stored

- **Blocked (⛔):** a pending spec (`draft` / `in-progress` / `reserved`)
  whose `depends_on` includes a spec that hasn't landed
  (`implemented`/`partial`). There is no `blocked_by:` field to hand-maintain;
  the mark disappears by itself when the dependency flips.
- **Reverse edges:** there is no `blocks:` field either — each edge is
  written exactly once, on the dependent side.
- **Counts:** the status summary line is computed at generation time.

## CI

`.github/workflows/specs.yml` runs `node specs/generate-index.mjs --check` on
every push and pull request. A stale index or a broken graph fails the build.

## Out of scope

- Rendering or browsing (spec 0003 — the explorer is a tool, not a record).
- Enforcing anything about spec *bodies*.
