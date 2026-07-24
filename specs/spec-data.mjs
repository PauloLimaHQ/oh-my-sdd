// Shared vocabulary for the specs folder. Two consumers, so it lives here
// instead of being duplicated:
//   generate-index.mjs  — validates + regenerates README.md (CI runs --check)
//   explorer.mjs        — the local browse/triage/answer UI
// Pure reads, no side effects: importing this must never write anything.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const STATUS = {
  draft:        { label: '📝 draft',        rank: 3 },
  'in-progress':{ label: '🔨 in-progress',  rank: 2 },
  partial:      { label: '🟡 partial',      rank: 1 },
  implemented:  { label: '✅ implemented',  rank: 0 },
  superseded:   { label: '⚪ superseded',   rank: 4 },
  reserved:     { label: '🔒 reserved',     rank: 5 },
};

// `research/` holds dated, frozen, pre-spec investigation. A research doc is
// never updated after its date — the date is its disclaimer. What changes is
// whether it still owes work:
//   open        — still an input; nothing has been decomposed out of it yet
//   decomposed  — it became the specs in `spawned`; it's spent as a plan
//   spent       — its findings landed in existing specs; nothing further owed
//   superseded  — replaced by a later doc
export const RESEARCH_STATUS = {
  open:        '🟠 open',
  decomposed:  '✅ decomposed',
  spent:       '⚪ spent',
  superseded:  '⚪ superseded',
};

// A spec is buildable once every spec it depends on has landed.
export const LANDED = new Set(['implemented', 'partial']);
// Statuses where being blocked is still a live fact (a shipped spec can't be blocked).
export const PENDING = new Set(['draft', 'in-progress', 'reserved']);

export const SPEC_RE = /^\d{4}-.*\.md$/;

// Deliberately not a YAML parser — flat `key: value` only. Anything nested or
// list-shaped is silently dropped, which is why the frontmatter contract in
// CLAUDE.md says flat-only.
export function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end === -1) return null;
  const fm = {};
  for (const line of text.slice(4, end).split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) { try { v = JSON.parse(v); } catch {} }
    fm[m[1]] = v;
  }
  return fm;
}

// `"0085, 0086"` (also tolerates `[0085, 0086]`) -> ['0085', '0086'].
export function parseNumberList(raw) {
  if (!raw) return [];
  return raw.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean);
}

export const listSpecs = (dir) => readdirSync(dir).filter((f) => SPEC_RE.test(f)).sort();
export const listIn = (dir, sub) => {
  const p = join(dir, sub);
  return existsSync(p) ? readdirSync(p).filter((f) => f.endsWith('.md')).sort() : [];
};

export const readDoc = (dir, rel) => readFileSync(join(dir, rel), 'utf8');

// ── Open questions ───────────────────────────────────────────────────────────
// Every spec's `## Open questions` section, pivoted into addressable items. The
// heading tends to get written many different ways across a sequence, so match
// loosely. Items are numbered or bulleted; a free-prose section yields a
// section with no addressable items, which is fine.
const OQ_HEAD = /^(#{2,3})\s+.*open\s+quest/i;
const ITEM_RE = /^(\d+\.|[-*])\s+\S/;

// A settled item is marked inline, e.g.
//   ✅ **RESOLVED 2026-07-02** — Values trace to the vendor's v2 API docs.
// Answering appends in exactly that shape rather than inventing a format.
export const RESOLVED_RE = /(✅|❌)\s*\*\*(RESOLVED|RESOLVIDO|DROPPED)\b/i;

export function findOpenQuestions(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => OQ_HEAD.test(l));
  if (start === -1) return null;

  const depth = lines[start].match(/^(#{1,6})/)[1].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s/);
    if (m && m[1].length <= depth) { end = i; break; }
  }

  const starts = [];
  for (let i = start + 1; i < end; i++) if (ITEM_RE.test(lines[i])) starts.push(i);

  const items = starts.map((s, k) => {
    const last = (k + 1 < starts.length ? starts[k + 1] : end) - 1;
    const body = lines.slice(s, last + 1);
    const raw = body.join('\n');
    const idM = lines[s].match(/^(?:\d+\.|[-*])\s+\*\*([A-Z]{1,3}\d+)/);
    // first sentence-ish, for the triage list
    const titleM = lines[s].match(/^(?:\d+\.|[-*])\s+\*\*(.+?)\*\*/);
    return {
      id: idM ? idM[1] : null,
      title: (titleM ? titleM[1] : lines[s].replace(ITEM_RE, '').trim()).replace(/\s+/g, ' '),
      startLine: s,           // 0-based, inclusive
      endLine: last,          // 0-based, inclusive (may include trailing blanks)
      raw,
      resolved: RESOLVED_RE.test(raw),
      indent: (lines[s].match(/^(\s*)/) || ['', ''])[1] + '  ',
    };
  });

  return { headingLine: start, heading: lines[start].replace(/^#+\s*/, ''), items, prose: !items.length };
}
