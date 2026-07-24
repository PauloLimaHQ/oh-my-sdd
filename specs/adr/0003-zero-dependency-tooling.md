# 0003 — Tooling is zero-dependency, copy-paste-portable Node

Status: accepted
Date: 2026-07-24

## Context

This system is meant to be dropped into any repository — a Node monorepo, a
Python service, a Go CLI, a docs-only repo. If the tooling needed an `npm
install`, a lockfile, or a build step, adopting it would mean adopting a
JavaScript toolchain; that's a real cost in repos that aren't JavaScript, and
a supply-chain surface everywhere.

## Decision

All tooling (`generate-index.mjs`, `spec-data.mjs`, `explorer.mjs`,
`explorer.html`) uses only Node's standard library (`node:fs`, `node:path`,
`node:http`, `node:crypto`). No `package.json` is required to run it —
`node specs/generate-index.mjs` works in a bare checkout with Node ≥ 18. The
explorer UI is a single HTML file with inline CSS/JS, including its own tiny
markdown renderer, so it works offline with no CDN.

The frontmatter parser is the visible cost of this choice: it is deliberately
**not** a YAML parser — flat single-line `key: value` only. That constraint is
promoted into the document contract (spec 0001) rather than hidden.

## Consequences

- Adoption is `cp -r specs/` plus a CI line; removal is `rm -rf`. No
  dependency updates, ever.
- Multi-line frontmatter values are unsupported by design; long notes live on
  one (long) line, and anything richer belongs in the spec body.
- The explorer's markdown rendering is approximate, which is acceptable for a
  local reading tool — the files themselves stay canonical.
