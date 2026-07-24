---
number: 0003
title: Local specs explorer (browse, search, triage open questions)
status: implemented
created: 2026-07-24
depends_on: "0001, 0002"
note: A zero-dependency local web UI over the sequence — reads from disk on every request, so it is never stale; its one write is appending a RESOLVED line to an open question.
---

# 0003 — Local specs explorer

## Why

Past a few dozen specs, `ls` and grep stop being a reading experience. The
index (0002) is the durable *record*; the explorer is the ephemeral *tool* —
browse, filter by status and area, full-text search the whole tier, and triage
every spec's `## Open questions` in one place.

## Behavior

```bash
node specs/explorer.mjs           # serves http://localhost:4321 and opens it
node specs/explorer.mjs --port 5000 --no-open
```

- Zero dependencies (`node:http` + `node:fs`), like the generator.
- Reads the `.md` files on **every request** — nothing generated, nothing to
  keep in sync.
- Tabs: Specs · Research · ADRs · Open questions. Filters: status, `area:`
  frontmatter (shown only when more than one area exists), free-text search
  over full bodies.

## Triage workflow

The explorer pivots every spec's `## Open questions` section into addressable
items (numbered or bulleted). Its **one write** is answering one: a surgical
append of

```
✅ **RESOLVED <date>** — <your answer>
```

under the item, in the shape the specs already use. It refuses to write if the
file changed on disk since the page loaded (hash check), and it never rewrites
the hand-written item text — it only adds a line under it.

## Out of scope

- Editing spec bodies or frontmatter — that's your editor's job.
- Serving beyond localhost; this is a personal tool, not a deployment.

## Open questions

1. **Q1 — Should the explorer render `depends_on` as a graph?** A visual DAG
   would make long chains legible, but adds real complexity to a
   zero-dependency file. Deferred until a sequence in the wild actually needs
   it.
   ✅ **RESOLVED 2026-07-24** — Deferred with a written trigger: revisit when
   an adopting repo reports a chain deeper than 4 specs. The table's
   depends-on column covers today's cases.
2. **Q2 — Should answering an open question also flip a status or touch the
   index?** Today answering is body-only, so the index never needs
   regeneration after triage. Keeping the write surgical seems right, but a
   session that resolves the *last* open question of a `partial` spec might
   want a nudge.
