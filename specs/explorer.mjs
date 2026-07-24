#!/usr/bin/env node
// Local specs explorer — browse / filter / full-text search the sequence, the
// research tier and the ADRs, and triage every spec's Open questions in one
// place. Read `node specs/explorer.mjs`, open the URL it prints.
//
//   node specs/explorer.mjs [--port 4321] [--no-open]
//
// It reads the .md files on every request, so it is never stale and there is
// nothing generated to keep in sync — unlike README.md, this is a tool, not a
// record. Zero dependencies (node:http + node:fs), like generate-index.mjs.
//
// The one write it performs is answering an Open question: a surgical append of
//   ✅ **RESOLVED <date>** — <your answer>
// to that item, in the shape the specs already use. It refuses to write if the
// file changed on disk since the UI read it (another session, or your editor).
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import {
  STATUS,
  RESEARCH_STATUS,
  LANDED,
  PENDING,
  parseFrontmatter,
  parseNumberList,
  findOpenQuestions,
  listSpecs,
  listIn,
} from './spec-data.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : dflt;
};
const PORT = Number(argOf('--port', 4321));
const OPEN = !argv.includes('--no-open');

const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// A spec's area is an optional `area:` frontmatter key — the grouping axis you
// filter on once the sequence grows past what one list can hold (e.g. a product
// line, a subsystem). Specs that don't declare one are 'core'.
const areaOf = (fm) => fm.area || 'core';

function loadAll() {
  const specs = [];
  for (const file of listSpecs(DIR)) {
    const text = readFileSync(join(DIR, file), 'utf8');
    const fm = parseFrontmatter(text) || {};
    const oq = findOpenQuestions(text);
    specs.push({
      file,
      number: fm.number || file.slice(0, 4),
      title: fm.title || file,
      status: fm.status || '?',
      created: fm.created || '',
      note: fm.note || '',
      dependsOn: parseNumberList(fm.depends_on),
      area: areaOf(fm),
      lines: text.split('\n').length,
      body: text,
      fileHash: hash(text),
      oq: oq
        ? {
            heading: oq.heading,
            prose: oq.prose,
            items: oq.items.map((i) => ({
              id: i.id,
              title: i.title,
              raw: i.raw,
              resolved: i.resolved,
              startLine: i.startLine,
              endLine: i.endLine,
            })),
          }
        : null,
    });
  }

  const byNumber = new Map(specs.map((s) => [s.number, s]));
  for (const s of specs) {
    s.blockedBy = PENDING.has(s.status)
      ? s.dependsOn.filter((d) => byNumber.has(d) && !LANDED.has(byNumber.get(d).status))
      : [];
    s.statusLabel = (STATUS[s.status] || { label: s.status }).label;
  }

  const research = listIn(DIR, 'research').map((file) => {
    const text = readFileSync(join(DIR, 'research', file), 'utf8');
    const fm = parseFrontmatter(text) || {};
    return {
      file,
      title: fm.title || file,
      status: fm.status || '?',
      statusLabel: RESEARCH_STATUS[fm.status] || fm.status || '?',
      created: fm.created || '',
      note: fm.note || '',
      spawned: parseNumberList(fm.spawned),
      lines: text.split('\n').length,
      body: text,
    };
  });

  const adrs = listIn(DIR, 'adr').map((file) => {
    const text = readFileSync(join(DIR, 'adr', file), 'utf8');
    const h = text.match(/^#\s+(.*)$/m);
    const st = text.match(/^Status:\s*(\w+)/m);
    return {
      file,
      number: file.slice(0, 4),
      title: (h ? h[1] : file).replace(/^(ADR\s+)?\d{4}\s*[—-]\s*/i, ''),
      status: st ? st[1] : '',
      lines: text.split('\n').length,
      body: text,
    };
  });

  return { specs, research, adrs, generatedAt: new Date().toISOString() };
}

// ── write-back ───────────────────────────────────────────────────────────────
// Append a resolution to one Open-questions item. Never rewrites the item — the
// prose is hand-written and precious; this only adds a line under it.
function answerQuestion({ file, startLine, endLine, answer, fileHash, date }) {
  if (!/^\d{4}-[A-Za-z0-9._-]+\.md$/.test(file)) throw new Error(`refusing to write outside the sequence: ${file}`);
  const path = join(DIR, file);
  if (relative(DIR, resolve(path)).startsWith('..')) throw new Error('path escape');

  const text = readFileSync(path, 'utf8');
  if (hash(text) !== fileHash) {
    const e = new Error(`${file} changed on disk since the page loaded — reload before answering (nothing written)`);
    e.status = 409;
    throw e;
  }

  const lines = text.split('\n');
  // re-verify the item is still where the UI thinks it is
  if (!/^(\d+\.|[-*])\s+\S/.test(lines[startLine] || '')) {
    const e = new Error(`the item is no longer at line ${startLine + 1} of ${file} — reload (nothing written)`);
    e.status = 409;
    throw e;
  }

  // trailing blank lines belong to the gap between items, not to the item
  let at = Math.min(endLine, lines.length - 1);
  while (at > startLine && lines[at].trim() === '') at--;

  const indent = (lines[startLine].match(/^(\s*)/) || ['', ''])[1] + '  ';
  const clean = String(answer).replace(/\r/g, '').trim();
  if (!clean) throw new Error('empty answer');

  // wrap the answer onto continuation lines at the item's indent, so the file
  // keeps its ~85-col hand-wrapped shape instead of one runaway line
  const first = `${indent}✅ **RESOLVED ${date}** — `;
  const wrapped = [];
  let line = first;
  for (const word of clean.split(/\s+/)) {
    if (line.length + word.length + 1 > 88 && line.trim() !== first.trim()) {
      wrapped.push(line.replace(/\s+$/, ''));
      line = indent + word + ' ';
    } else line += word + ' ';
  }
  wrapped.push(line.replace(/\s+$/, ''));

  lines.splice(at + 1, 0, ...wrapped);
  const next = lines.join('\n');
  writeFileSync(path, next);
  return { file, inserted: wrapped.length, at: at + 2, fileHash: hash(next) };
}

// ── server ───────────────────────────────────────────────────────────────────
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'content-type': type + '; charset=utf-8', 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/') {
      return send(res, 200, readFileSync(join(DIR, 'explorer.html'), 'utf8'), 'text/html');
    }
    if (url.pathname === '/api/data') return send(res, 200, loadAll());

    if (url.pathname === '/api/answer' && req.method === 'POST') {
      let raw = '';
      req.on('data', (c) => {
        raw += c;
        if (raw.length > 1e6) req.destroy();
      });
      req.on('end', () => {
        try {
          send(res, 200, answerQuestion(JSON.parse(raw)));
        } catch (e) {
          send(res, e.status || 400, { error: e.message });
        }
      });
      return;
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  const { specs, research } = loadAll();
  const oqOpen = specs.reduce(
    (n, s) => n + (s.oq ? s.oq.items.filter((i) => !i.resolved).length : 0),
    0,
  );
  console.log(`specs explorer  ->  ${url}`);
  console.log(`  ${specs.length} specs · ${research.length} research docs · ${oqOpen} unanswered open questions`);
  console.log(`  reads from disk on every request · ctrl-c to stop`);
  if (OPEN && process.platform === 'darwin') execFile('open', [url], () => {});
});
