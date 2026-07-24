# Working contract: the specs system

This repository tracks all durable knowledge under `specs/` using the
oh-my-sdd contract. This file tells you — human or agent — how to maintain
it. It is written to be copied as-is into any repo that adopts the `specs/`
folder.

## The contract in one line

**Numbered = maintained · dated = frozen · neither = raw.**

- `specs/NNNN-slug.md` — numbered specs: durable, maintained, CI-validated.
- `specs/adr/NNNN-slug.md` — architecture decision records (own number
  sequence, independent of specs).
- `specs/research/slug-YYYY-MM-DD.md` — frozen snapshots, addressed by date,
  **never edited after their date**.
- `specs/attachments/` — raw input kept for provenance; owed nothing.

## Hard rules

1. **Never edit `specs/README.md` by hand.** It is generated. After adding a
   spec or changing any frontmatter, run:
   ```bash
   node specs/generate-index.mjs
   ```
   and commit the result. CI runs `--check` and fails on a stale index.
2. **Frontmatter is flat YAML only** — single-line `key: value`. No nested
   maps, no lists, no `>` block scalars (the parser silently drops them).
   Long notes go on one long line.
3. **A spec ships in the same PR as its code.** When work lands, flip
   `status:` to `implemented` (or `partial` — and say what's missing in
   `note:`). Never leave a shipped spec `draft`.
4. **`depends_on` records hard build order only** — "this cannot be built
   until that exists". Softer relationships (siblings, refines, same theme)
   are prose in `note:`. Never write down "blocked": it is derived by the
   generator and disappears by itself when the dependency lands.
5. **Research is frozen.** To correct a decomposed research doc, edit the
   specs it spawned — never the doc. A research doc never gets a `number:`;
   its filename must end with its `created` date.
6. **Never delete a numbered file.** Numbers are permanent addresses. Retire
   with `status: superseded` and link the replacement in `note:`.
7. **Resolve open questions inline**, under the item, in exactly this shape:
   ```
   ✅ **RESOLVED YYYY-MM-DD** — the answer, with its source.
   ```

## Frontmatter reference

Spec (`specs/NNNN-slug.md` — `number` must match the filename prefix):

```yaml
---
number: 0042
title: One-line title
status: draft            # draft · in-progress · partial · implemented · superseded · reserved
created: 2026-07-24
depends_on: "0007, 0031" # optional — hard build order only
note: One-line summary for the index.        # optional
area: billing            # optional — grouping axis for the explorer
---
```

Research (`specs/research/slug-YYYY-MM-DD.md` — no `number`, ever):

```yaml
---
title: What was investigated
status: open             # open · decomposed · spent · superseded
created: 2026-07-24      # must appear in the filename
spawned: "0043, 0044"    # required once status is decomposed
note: One-line summary.  # optional
---
```

ADR (`specs/adr/NNNN-slug.md` — no frontmatter; the tooling reads the
heading and the Status line):

```markdown
# 0007 — Decision stated as a fact

Status: accepted
```

## When to create what

- **Spec** — you're about to build, change, or retire something durable.
  Copy `specs/templates/spec-template.md`, claim the next free number.
- **ADR** — a decision constrains future work beyond any single spec
  (a technology choice, an invariant, a rejected alternative worth
  remembering). Copy `specs/templates/adr-template.md`.
- **Research doc** — you investigated something and the findings deserve
  provenance before any build is committed. Copy
  `specs/templates/research-template.md`; mark claims CONFIRMED / INFERRED /
  NOT VERIFIED.
- **Attachment** — raw material arrived (email, PDF, transcript, prompt).
  Drop it in `specs/attachments/` under its natural name.

## Definition of done for any change

- [ ] Spec frontmatter reflects reality (`status`, `note`).
- [ ] `node specs/generate-index.mjs --check` passes locally.
- [ ] The spec and its code are in the same PR.
- [ ] Open questions touched by the work are resolved inline, not deleted.
