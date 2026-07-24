# 0001 — Frontmatter is the source of truth; the index is a build artifact

Status: accepted
Date: 2026-07-24

## Context

A specs folder needs an index, and an index can be maintained by hand or
generated. Hand-maintained indexes are a second copy of every spec's title and
status; the two copies drift, and once a reader catches the index lying they
stop trusting it entirely. Generated indexes have their own failure mode: the
author forgets to regenerate, and the committed index goes stale anyway.

## Decision

Each spec carries flat YAML frontmatter (`number`, `title`, `status`,
`created`, optional `depends_on` / `note` / `area`). That frontmatter is the
**only** source of truth. `specs/README.md` is generated from it by
`generate-index.mjs` and is never edited by hand. CI runs the generator in
`--check` mode, which fails when the committed index no longer matches the
frontmatter — closing the "forgot to regenerate" hole.

Derived facts are never stored: *blocked* status, reverse dependency edges,
and counts are computed at generation time. Anything you could hand-maintain
into staleness, the generator derives instead.

## Consequences

- Editing a spec's status is a one-line change; the index follows mechanically.
- The frontmatter parser is deliberately flat (`key: value`, single line) —
  nested YAML is silently dropped, so the contract documents flat-only.
- The index can carry rich derived views (⛔ markers, summaries) at zero
  maintenance cost, because they're recomputed every run.
