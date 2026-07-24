# oh-my-sdd

**A spec-driven development system you can drop into any repository.**
One folder, zero dependencies, three rules — extracted from a production
repo where it carried 110 specs, 12 ADRs, and 10 research docs without an
index ever going stale.

Documentation rots for one reason: nobody agreed, at write time, on who owes
it maintenance. oh-my-sdd fixes that with a **contract encoded in the
filename**, so a reader knows how much to trust a document before opening it —
and a writer knows what they're signing up for before creating it.

## The whole system in one table

| Filename | Contract | Home |
|---|---|---|
| **Numbered** (`0007-…`, `adr/0002-…`) | Durable and **maintained**. Indexed, CI-validated, ships in the same PR as its code, stays after merge. | [`specs/`](specs/) · [`specs/adr/`](specs/adr/) |
| **Dated** (`…-2026-07-24`) | **Frozen snapshot.** True as of that date, never updated after — the date *is* the disclaimer. Feeds specs, then it's spent. | [`specs/research/`](specs/research/) |
| Neither | Raw input kept for provenance. | [`specs/attachments/`](specs/attachments/) |

**Numbered = maintained · dated = frozen · neither = raw.** A doc that must
stay current has to be numbered; if you can't maintain it, date it and freeze
it. The pipeline runs one way: `attachments/` → a dated research doc →
numbered specs. Research never consumes a spec number — that keeps the
sequence a record of *what actually gets built*.

## How it stays honest

Every spec opens with flat YAML frontmatter — `number`, `title`, `status`,
`created`, optionally `depends_on` (hard build order only), `note`, `area`.
**That frontmatter is the only source of truth.** Everything else is derived:

- **`specs/README.md` is generated** (`node specs/generate-index.mjs`) and
  never edited by hand.
- **Blocked is derived, not stored** — the generator marks ⛔ when a pending
  spec depends on one that hasn't landed, and the mark disappears by itself
  when the dependency flips to `implemented`. No `blocked_by:` field to
  hand-maintain, no reverse `blocks:` edges — each edge is written exactly
  once.
- **CI refuses the "forgot to regenerate" case** — `--check` mode fails on a
  stale index, a broken dependency graph (unknown targets, cycles), missing
  frontmatter, undated research docs, and dead links between documents.

**Status vocabulary:** `draft` → `in-progress` → `implemented` (or `partial`,
with the remainder named in `note`) · `superseded` (retired, replacement
linked) · `reserved` (number held). A spec flips to `implemented` in the same
PR where its code lands — never later.

## Quickstart

Requires Node ≥ 18. No install, no lockfile, no build step
([ADR 0003](specs/adr/0003-zero-dependency-tooling.md)).

```bash
# 1. Take the folder (degit strips git history; cp -r works too)
npx degit PauloLimaHQ/oh-my-sdd/specs specs

# 2. Make it yours
rm specs/00*.md specs/adr/00*.md specs/research/*.md   # drop the examples
#    …edit the INTRO constant at the top of specs/generate-index.mjs

# 3. Write your first spec
cp specs/templates/spec-template.md specs/0001-my-first-spec.md
#    …fill in the frontmatter and body

# 4. Generate the index
node specs/generate-index.mjs

# 5. Keep it honest in CI
node specs/generate-index.mjs --check
```

For GitHub, copy [`.github/workflows/specs.yml`](.github/workflows/specs.yml)
— it's the one `--check` line.

## Daily workflow

1. **Something arrives** — an idea, a customer email, a vendor doc. Park the
   raw material in `specs/attachments/`.
2. **Investigate** (when needed) in a dated research doc:
   `specs/research/topic-YYYY-MM-DD.md`, status `open`. Findings marked
   CONFIRMED / INFERRED / NOT VERIFIED.
3. **Decompose** into numbered specs (`status: draft`), flip the research doc
   to `decomposed` with `spawned: "00NN, 00NN"` — and never edit it again.
4. **Build.** The spec ships in the same PR as its code; the PR flips
   `status:` to `implemented` or `partial` and regenerates the index.
5. **Questions** live in each spec's `## Open questions` and get resolved
   inline: `✅ **RESOLVED YYYY-MM-DD** — answer.`
6. **Decisions** that outlive any one spec become ADRs in `specs/adr/`.

## Tooling

| Command | What it does |
|---|---|
| `node specs/generate-index.mjs` | Regenerate `specs/README.md` from frontmatter |
| `node specs/generate-index.mjs --check` | CI mode — validate everything, write nothing |
| `node specs/explorer.mjs` | Local web UI: browse, filter, full-text search, and triage open questions ([spec 0003](specs/0003-local-specs-explorer.md)) |

The explorer reads from disk on every request (never stale) and performs
exactly one kind of write: appending a `✅ RESOLVED` line under an open
question, with a conflict check if the file changed on disk.

## Working with AI agents

This system is a natural fit for agentic coding: the frontmatter contract is
machine-checkable, the index is regenerable, and "spec ships with its code"
gives an agent an unambiguous definition of done. [`CLAUDE.md`](CLAUDE.md)
contains the working contract — copy it (or fold it into your existing
`CLAUDE.md` / `AGENTS.md`) so your agent maintains the system for you:
it's written to work as-is for any repo that adopts the `specs/` folder.

## This repo eats its own dog food

The `specs/` folder here is not a mock — it's the live system documenting
itself:

- [Specs index](specs/README.md) — generated, CI-checked
- [0001 — The three-tier document contract](specs/0001-three-tier-document-contract.md)
- [0002 — Generated index + CI validation](specs/0002-generated-index-and-ci-check.md)
- [0003 — Local specs explorer](specs/0003-local-specs-explorer.md)
- [ADRs](specs/adr/) · [Research](specs/research/) (including the
  [extraction story](specs/research/sdd-system-extraction-2026-07-24.md) of
  how this template came to be)

## FAQ

**Why 4-digit numbers?** They sort lexicographically, read as stable
addresses ("see 0042"), and 9,999 specs is plenty. The generator enforces
filename ↔ frontmatter agreement.

**What if two branches claim the same number?** CI fails on the duplicate at
merge time; one branch renumbers. In practice this is rare and cheap —
numbers are claimed at spec-writing time, not build time.

**Can I change the section structure of a spec body?** Yes — the tooling only
understands frontmatter and (optionally) `## Open questions`. Body structure
is convention, and the templates are a starting point, not a schema.

**Why not just use GitHub issues / Notion / a wiki?** Those live outside the
repo, so they can't ship in the same PR as the code, can't be validated by
CI, and don't survive tool migrations. Markdown in-tree is greppable,
reviewable, and permanent.

**Does `partial` mean "abandoned"?** No — it means "some shipped, the rest
deferred, and the `note` says which part". Abandoned work is `superseded`.

## License

[MIT](LICENSE) — take it, adapt it, ship it.
