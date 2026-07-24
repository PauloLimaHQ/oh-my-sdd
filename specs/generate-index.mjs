#!/usr/bin/env node
// Regenerates specs/README.md from each spec's YAML frontmatter.
// Run after adding a spec or changing a `status:`  ->  `node specs/generate-index.mjs`
//
// `--check` validates and writes nothing (CI runs this): it reports every
// problem it can find in one pass, including a README that no longer matches
// the frontmatter — the "forgot to regenerate" case.
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  STATUS,
  RESEARCH_STATUS,
  LANDED,
  PENDING,
  parseFrontmatter,
  parseNumberList,
} from './spec-data.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');

// ── EDIT ME ──────────────────────────────────────────────────────────────────
// The index's opening paragraph — the only project-specific text in this file.
// Replace it with two or three sentences that orient a new reader: what the
// project is, what its main axes are, where the governing principles live.
const INTRO = `Single source of truth for **what this project is and what's actually built**.
Every durable decision lives here as a numbered spec or an ADR; every frozen
investigation is dated in \`research/\`; every raw input is kept in
\`attachments/\`. Start with the contract table below, then read the specs your
work touches.`;
// ─────────────────────────────────────────────────────────────────────────────

// Problems accumulate instead of throwing on the first one, so a single run
// reports every broken spec rather than making you fix them one at a time.
// Either mode refuses to write when the list is non-empty.
const problems = [];
const problem = (msg) => problems.push(msg);

// Numbers reserved for specs not yet written (so the sequence stays legible).
const RESERVED = [];

// `depends_on: "0085, 0086"` -> ['0085', '0086'], with the spec-side rule applied.
// Record only a hard build-order edge: this spec cannot be built until that one exists.
// Anything softer (siblings, "refines", shared theme) belongs in `note`, not here.
function parseDependsOn(raw, file) {
  const nums = parseNumberList(raw);
  const ok = [];
  for (const n of nums) {
    if (!/^\d{4}$/.test(n)) {
      problem(`${file}: depends_on has "${n}" — expected 4-digit spec numbers, e.g. depends_on: "0085, 0086"`);
      continue;
    }
    ok.push(n);
  }
  return ok;
}

const specs = [];
for (const f of readdirSync(DIR).filter((f) => /^\d{4}-.*\.md$/.test(f))) {
  const fm = parseFrontmatter(readFileSync(join(DIR, f), 'utf8'));
  if (!fm) {
    problem(`${f}: missing frontmatter — add it before regenerating`);
    continue;
  }
  specs.push({ file: f, ...fm, dependsOn: parseDependsOn(fm.depends_on, f) });
}
specs.sort((a, b) => (a.number || '').localeCompare(b.number || ''));

// Required fields, known status, and a `number` that agrees with the filename —
// the frontmatter is the source of truth, so a typo here silently corrupts the
// index rather than failing loudly.
const seen = new Map(); // number -> first file that claimed it
for (const s of specs) {
  for (const field of ['number', 'title', 'status', 'created']) {
    if (!s[field]) problem(`${s.file}: missing "${field}:" — required frontmatter`);
  }
  if (s.status && !STATUS[s.status]) {
    problem(`${s.file}: unknown status "${s.status}" — expected one of ${Object.keys(STATUS).join(', ')}`);
  }
  if (!s.number) continue;
  const prefix = s.file.slice(0, 4);
  if (s.number !== prefix) {
    problem(`${s.file}: number "${s.number}" disagrees with the filename prefix "${prefix}"`);
  }
  if (seen.has(s.number)) {
    problem(`duplicate number ${s.number}: ${seen.get(s.number)} and ${s.file}`);
  } else {
    seen.set(s.number, s.file);
  }
}

const byNumber = new Map();
for (const s of specs) if (s.number && !byNumber.has(s.number)) byNumber.set(s.number, s);

// Validate the dependency graph: unknown target, self-reference, cycle. A dep
// that fails is dropped from the graph so the later passes (cycle walk, blocked
// derivation) can't trip over it — the problem is already recorded.
for (const s of specs) {
  s.dependsOn = s.dependsOn.filter((dep) => {
    if (dep === s.number) {
      problem(`${s.file}: depends_on lists itself`);
      return false;
    }
    if (!byNumber.has(dep)) {
      problem(`${s.file}: depends_on "${dep}" — no such spec (reserved numbers can't be depended on until written)`);
      return false;
    }
    return true;
  });
}
(function assertAcyclic() {
  const state = new Map(); // number -> 'visiting' | 'done'
  const walk = (num, trail) => {
    if (state.get(num) === 'done') return;
    if (state.get(num) === 'visiting') {
      problem(`depends_on cycle: ${[...trail, num].join(' -> ')}`);
      return;
    }
    state.set(num, 'visiting');
    for (const dep of byNumber.get(num).dependsOn) walk(dep, [...trail, num]);
    state.set(num, 'done');
  };
  for (const s of specs) if (s.number) walk(s.number, []);
})();

// ── research/ ────────────────────────────────────────────────────────────────
// Dated, frozen, pre-spec docs. No `number` (they deliberately don't consume one)
// and no `depends_on` — a research doc has no build order. `spawned` is the edge
// that matters: which specs came out of it. Written once here, like depends_on.
const RESEARCH_DIR = join(DIR, 'research');
const research = [];
if (existsSync(RESEARCH_DIR)) {
  for (const f of readdirSync(RESEARCH_DIR).filter((f) => f.endsWith('.md')).sort()) {
    const fm = parseFrontmatter(readFileSync(join(RESEARCH_DIR, f), 'utf8'));
    if (!fm) {
      problem(`research/${f}: missing frontmatter — add it before regenerating`);
      continue;
    }
    research.push({ file: f, ...fm });
  }
}
for (const r of research) {
  for (const field of ['title', 'created', 'status']) {
    if (!r[field]) problem(`research/${r.file}: missing "${field}:" — required frontmatter`);
  }
  if (r.status && !RESEARCH_STATUS[r.status]) {
    problem(`research/${r.file}: unknown status "${r.status}" — expected one of ${Object.keys(RESEARCH_STATUS).join(', ')}`);
  }
  if (r.number) {
    problem(`research/${r.file}: has "number:" — research is dated, not numbered; it must not consume a spec number`);
  }
  // The date is the doc's contract, so the filename has to carry it.
  if (r.created && !r.file.includes(r.created)) {
    problem(`research/${r.file}: filename doesn't carry its \`created\` date (${r.created}) — a frozen doc is addressed by date`);
  }
  r.spawnedList = parseNumberList(r.spawned);
  for (const n of r.spawnedList) {
    if (!/^\d{4}$/.test(n)) {
      problem(`research/${r.file}: spawned has "${n}" — expected 4-digit spec numbers, e.g. spawned: "0085, 0086"`);
    } else if (!byNumber.has(n)) {
      problem(`research/${r.file}: spawned "${n}" — no such spec`);
    }
  }
  if (r.status === 'decomposed' && !r.spawnedList.length) {
    problem(`research/${r.file}: status "decomposed" but no \`spawned:\` — name the specs it produced, or use "spent"`);
  }
}

// ── links ────────────────────────────────────────────────────────────────────
// Every relative .md link under specs/ must resolve. Nothing validated this
// tier before, so it rotted silently (a spec renumbered under a research doc's
// feet, and the link sat dead). Cheap to check, so check it everywhere.
const mdFiles = [];
for (const [sub, files] of [
  ['', readdirSync(DIR).filter((f) => f.endsWith('.md'))],
  ['adr', existsSync(join(DIR, 'adr')) ? readdirSync(join(DIR, 'adr')).filter((f) => f.endsWith('.md')) : []],
  ['research', existsSync(RESEARCH_DIR) ? readdirSync(RESEARCH_DIR).filter((f) => f.endsWith('.md')) : []],
]) {
  for (const f of files) mdFiles.push(sub ? `${sub}/${f}` : f);
}
const REPO = dirname(DIR);
for (const rel of mdFiles) {
  if (rel === 'README.md') continue; // generated; its links are derived below
  const text = readFileSync(join(DIR, rel), 'utf8');
  const from = dirname(join(DIR, rel));
  const seenLink = new Set();

  // markdown links: [text](0084-foo.md) / (../0084-foo.md) / (adr/0011-x.md#anchor)
  for (const m of text.matchAll(/\]\(([^)\s]+\.md)(#[^)\s]*)?\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:)/.test(target) || seenLink.has(`l:${target}`)) continue;
    seenLink.add(`l:${target}`);
    if (!existsSync(resolve(from, target))) problem(`${rel}: dead link -> ${target}`);
  }

  // backticked repo paths: `specs/research/foo-2026-07-16.md`. Specs cite each
  // other this way far more often than with real links, and nothing catches it
  // when a target moves — dead paths rot silently without this pass.
  for (const m of text.matchAll(/`(specs\/[^`\s]+\.md)`/g)) {
    const target = m[1];
    // `specs/00xx-<name>.md` is a template in prose, not a path.
    if (target.includes('<') || target.includes('>')) continue;
    // The index is what this script writes — citing it must not fail the
    // bootstrap run, before it exists.
    if (target === 'specs/README.md') continue;
    if (seenLink.has(`p:${target}`)) continue;
    seenLink.add(`p:${target}`);
    if (!existsSync(resolve(REPO, target))) problem(`${rel}: dead path -> \`${target}\``);
  }
}

// Nothing below can be trusted once the frontmatter is wrong, and neither mode
// should write a half-correct index from it.
if (problems.length) {
  // A cycle is reachable from every spec on it, so the walk can report it more
  // than once — dedupe rather than make the reader diff identical lines.
  const unique = [...new Set(problems)];
  console.error(`specs: ${unique.length} problem${unique.length > 1 ? 's' : ''} found\n`);
  for (const p of unique) console.error(`  ✗ ${p}`);
  console.error('\nNothing written.');
  process.exit(1);
}

// Blocked is DERIVED, never stored: a pending spec whose dependencies haven't landed.
for (const s of specs) {
  s.blockedBy = PENDING.has(s.status)
    ? s.dependsOn.filter((d) => !LANDED.has(byNumber.get(d).status))
    : [];
}

// counts
const counts = {};
for (const s of specs) counts[s.status] = (counts[s.status] || 0) + 1;
const order = ['implemented', 'partial', 'in-progress', 'draft', 'superseded'];
const summary = order
  .filter((k) => counts[k])
  .map((k) => `${STATUS[k].label.replace(/^\S+ /, '')} ${counts[k]}`)
  .join(' · ');

const blockedCount = specs.filter((s) => s.blockedBy.length).length;

const rows = specs
  .map((s) => {
    const st = STATUS[s.status] || { label: s.status };
    const link = `[${s.number}](${s.file})`;
    const note = s.note ? s.note : '';
    const status = s.blockedBy.length ? `${st.label} ⛔` : st.label;
    const deps = s.dependsOn
      .map((d) => `[${d}](${byNumber.get(d).file})${s.blockedBy.includes(d) ? ' ⛔' : ''}`)
      .join(', ');
    return `| ${link} | ${s.title} | ${status} | ${s.created || ''} | ${deps || '—'} | ${note} |`;
  })
  .join('\n');

const reservedRows = RESERVED.map(
  ([num, title, note]) => `| ${num} | ${title} | 🔒 reserved | — | ${note} |`,
).join('\n');

const researchRows = research
  .map((r) => {
    const label = RESEARCH_STATUS[r.status] || r.status;
    const spawned = r.spawnedList.length
      ? r.spawnedList.map((n) => `[${n}](${byNumber.get(n).file})`).join(', ')
      : '—';
    return `| [${r.file.replace(/\.md$/, '')}](research/${r.file}) | ${r.title} | ${label} | ${r.created} | ${spawned} | ${r.note || ''} |`;
  })
  .join('\n');

const researchOpen = research.filter((r) => r.status === 'open').length;

// ADRs
const adrDir = join(DIR, 'adr');
let adrRows = '';
try {
  adrRows = readdirSync(adrDir)
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .sort()
    .map((f) => {
      const body = readFileSync(join(adrDir, f), 'utf8');
      const h = body.match(/^#\s+(.*)$/m);
      const num = f.slice(0, 4);
      const title = (h ? h[1] : f).replace(/^(ADR\s+)?\d{4}\s*[—-]\s*/i, '');
      return `| [${num}](adr/${f}) | ${title} |`;
    })
    .join('\n');
} catch {}

const out = `# Specs index

${INTRO}

## What lives where

**The filename tells you the contract.** One question — is it numbered, dated, or
neither — decides how much you owe it:

| Filename | Contract | Home |
|---|---|---|
| **Numbered** (\`0088-…\`, \`adr/0011-…\`) | Durable and **maintained**. Indexed, CI-validated, ships in the same PR as its code, stays after merge. | this folder · [\`adr/\`](adr/) |
| **Dated** (\`…-2026-07-16\`) | **Frozen snapshot.** True as of that date, never updated after — the date *is* the disclaimer. Feeds specs, then it's spent. | [\`research/\`](research/) |
| Neither | Raw input kept for provenance. | [\`attachments/\`](attachments/) |

So: **numbered = maintained · dated = frozen · neither = raw.** A doc that must
stay current has to be numbered; if you can't maintain it, date it and freeze it.
Research deliberately **never consumes a spec number** — it's addressed by date.

## How tracking works

1. **Each spec carries YAML frontmatter** — \`number\`, \`title\`, \`status\`,
   \`created\` (optional \`note\`, optional \`depends_on\`). That frontmatter is the
   source of truth.
2. **This index is generated** from that frontmatter. After you add a spec or
   change a \`status:\`, run:
   \`\`\`bash
   node specs/generate-index.mjs
   \`\`\`
3. **A spec ships in the same PR as its code** and stays after merge. When work
   lands, flip its \`status\` to \`implemented\` (or \`partial\`) — don't leave it
   \`draft\`. To retire a spec, set \`status: superseded\` and link the replacement.

**Status vocabulary:** \`draft\` (written, not started) · \`in-progress\` ·
\`partial\` (some shipped, rest deferred — see note) · \`implemented\` (in code &
verified) · \`superseded\` · \`reserved\` (number held, spec not written yet).

## Dependencies (\`depends_on\`)

A spec may declare \`depends_on: "0085, 0086"\` — **hard build order only**: this
spec cannot be built until those exist. Anything softer (siblings, "refines",
same theme) stays prose in \`note\`; a \`depends_on\` that means "vaguely related"
is noise and makes the ⛔ below wrong.

Record the **dependency**, never the blockage. \`depends_on\` is a permanent fact
(a spec is built on its dependency's foundation whether or not that dependency
has shipped), so it never goes stale. **Blocked is derived, not stored** — the generator marks ⛔ when a
pending spec depends on one that hasn't landed, and the mark disappears by
itself when the dependency flips to \`implemented\`/\`partial\`. There is no
\`blocked_by\` field to hand-maintain, and no reverse \`blocks:\` edge — the
generator derives that too, so each edge is written exactly once. Unknown
targets and cycles fail the generator.

**Current state:** ${specs.length} spec${specs.length === 1 ? '' : 's'} — ${summary}${blockedCount ? ` · ⛔ ${blockedCount} blocked` : ''}${research.length ? ` · ${research.length} research doc${research.length === 1 ? '' : 's'}${researchOpen ? `, 🟠 ${researchOpen} still open` : ''}` : ''}.

## Specs

⛔ = blocked: a dependency hasn't landed yet.

| # | Title | Status | Created | Depends on | Notes |
|---|-------|--------|---------|------------|-------|
${rows}

## Reserved / planned

Numbers held for specs not yet written, so the sequence stays legible.

| # | Title | Status | Created | Notes |
|---|-------|--------|---------|-------|
${reservedRows}

## Research

Dated, **frozen** pre-spec investigation in [\`research/\`](research/) — analyses,
domain research, coverage reviews. A research doc is never revised after its date;
what changes is whether it still owes work:

🟠 **open** = still an input, nothing decomposed out of it yet · ✅ **decomposed**
= it became the specs listed · ⚪ **spent** = its findings landed in existing specs.

The pipeline: [\`attachments/\`](attachments/) → a dated research doc → numbered
specs. Research **never consumes a spec number** — that's what keeps the sequence
a record of what gets built.

| Doc | Title | Status | Date | Spawned | Notes |
|-----|-------|--------|------|---------|-------|
${researchRows}

## ADRs

Architecture decisions — see [\`adr/\`](adr/).

| # | Decision |
|---|----------|
${adrRows}

---

_Generated by \`specs/generate-index.mjs\` — do not edit this file by hand; edit spec frontmatter and regenerate._
`;

const README = join(DIR, 'README.md');

if (!CHECK) {
  writeFileSync(README, out);
  console.log(`Wrote specs/README.md (${specs.length} specs, ${RESERVED.length} reserved).`);
} else {
  let current = null;
  try {
    current = readFileSync(README, 'utf8');
  } catch {}
  if (current !== out) {
    console.error(
      current === null
        ? 'specs/README.md is missing — run `node specs/generate-index.mjs`'
        : 'specs/README.md is stale (it no longer matches the specs\' frontmatter)\n  → run `node specs/generate-index.mjs` and commit the result',
    );
    process.exit(1);
  }
  console.log(`specs OK — ${specs.length} specs, README.md current.`);
}
