#!/usr/bin/env node
// scripts/sync-impl-roadmap.mjs
//
// Regenerate public/review/implementation-roadmap.html from
// ../layerpulse/docs/BACKLOG.md. Rewrites only between AUTOGEN markers
// so hand-curated prose around them is preserved.
//
// Run:   node scripts/sync-impl-roadmap.mjs
// CI:    git diff --exit-code public/review/implementation-roadmap.html
//
// Marker convention (in implementation-roadmap.html):
//   <!-- AUTOGEN:TIER1:START --> ... <!-- AUTOGEN:TIER1:END -->
//   <!-- AUTOGEN:TIER2:START --> ... <!-- AUTOGEN:TIER2:END -->
//   <!-- AUTOGEN:TIER3:START --> ... <!-- AUTOGEN:TIER3:END -->
//   <!-- AUTOGEN:PILLARS:START --> ... <!-- AUTOGEN:PILLARS:END -->
//   <!-- AUTOGEN:INVENTORY:START --> ... <!-- AUTOGEN:INVENTORY:END -->
//   <!-- AUTOGEN:SHIPPED:START --> ... <!-- AUTOGEN:SHIPPED:END -->
//   <!-- AUTOGEN:COUNTS:TIER1 --> dynamic count chips (inline)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const HTML_PATH = join(ROOT, 'public/review/implementation-roadmap.html');

const BACKLOG_PATHS = [
  resolve(ROOT, '../layerpulse/docs/BACKLOG.md'),
  'C:/Users/michi/Downloads/layerpulse/docs/BACKLOG.md',
];

// Cross-link enrichments (T-id -> review page anchor)
const REVIEW_LINKS = {
  'T1.5':  { href: './documents.html',         label: 'See the design' },
  'T1.17': { href: './glossary.html',          label: 'See the design' },
  'T1.18': { href: './complete-document.html', label: 'See the design' },
  'T1.20': { href: './ownership.html',         label: 'See the design' },
  'T3.12': { href: './settings.html',          label: 'See the design' },
};

// Hand-curated business-friendly title + description + chips per T-id.
// Falls back to deriveTitle()/deriveDesc() for rows not in this map.
const ENRICHMENTS = {
  'T1.5b': {
    title: 'C2d Documents — generators 8-12',
    desc: 'The Generate flow is live; now the four per-audience generators become subsets of the Perfect Document (Auditor / Analyst / Executive / Engineer), plus multi-format + auto-regen + retention. Auto-burn-eligible per story.',
    chips: { effort: '~2-3 weeks', deps: 'depends on T1.18', validation: 'contract-test vs reference .docx' },
  },
  'T1.18': {
    title: 'The Perfect Document (C2d — T1.18)',
    desc: 'Two-part canonical model doc: <b>Model Scorecard</b> (KEEP/OPTIMIZE/RETIRE verdict + adoption/cost/quality/refresh RAG + per-report dead-weight) and <b>Technical Reference</b>. Deterministic, no AI. The next P1.',
    chips: { effort: '~1.5-2 weeks', validation: 'vitest + .docx contract', bundle: 'mockup bundle' },
  },
  'T1.12': {
    title: 'Audit & Compliance page',
    desc: 'New <code>/audit</code> route with three tabs — Export log, Off-hours access heatmap, RLS evaluation — plus a one-click SOC 2 evidence pack ZIP. Sales-motion test for Pro→Enterprise upsell.',
    chips: { effort: '~13d / 2-2.5 weeks', validation: 'compare-vs-rest' },
  },
  'T1.13': {
    title: 'Tenant Activity screen',
    desc: 'New <code>/activity</code> route — Bloomberg-terminal forensic search + filters + CSV export over the raw <code>activity_events</code> table. Sibling to the Users page.',
    chips: { effort: '~6-7d / 1-1.5 weeks', validation: 'compare-vs-rest' },
  },
  'T1.8': {
    title: 'Reports axis — fabric_reports',
    desc: 'Full Admin API ingest for reports + PBIR definitions. New table + collector + a minimal Reports list screen. Unlocks the Reports & Apps pillar UI and the Lineage Explorer reports column.',
    chips: { effort: '~1 week', validation: 'compare-vs-rest' },
  },
  'T1.9': {
    title: 'Dataflows axis — fabric_dataflows',
    desc: 'Gen1 + Gen2 dataflows from the Admin API. New table + collector + dataflows list screen.',
    chips: { effort: '~1 week', validation: 'compare-vs-rest' },
  },
  'T1.19': {
    title: 'BPA-driven Quality Engine overhaul',
    desc: 'Replaced the 6 stub quality dimensions with a ported BPA engine (~20 named rules with remediation). Spike-validated on 18 real models. Phase 2 = Scanner extensions (formatString / displayFolder) to unlock 4-7 more rules.',
  },
  'T1.17': {
    title: 'Business Glossary pillar — v1',
    desc: 'Tenant-wide dictionary (KPI / metric / dimension / business term / acronym / process) + many-to-many attachment to model objects + per-measure Vocabulary panel on model overview. v1 SHIPPED across 6 sub-PRs (#339-#345). P3 doc-binding deferred.',
    chips: { bundle: 'mockup bundle' },
  },
  'T1.16': {
    title: 'Telemetry rollup (foundational)',
    desc: 'Precomputed daily per-artifact aggregates (migration 0032). Unblocks the cost-vs-adoption matrix on Overview and the Perfect Documents adoption / cost / refresh RAG axes.',
  },
  'T1.5': {
    title: 'Documents Generate flow (Stories 1-7)',
    desc: 'The full document-generation surface: page shell, model picker (v3 with KPIs on real data), section selector, live preview, DOCX renderer, <code>documents</code> table.',
    chips: { bundle: 'mockup bundle' },
  },
  'T1.20': {
    title: 'Ownership & Stewardship pillar',
    desc: 'Tenant-wide accountability at two layers (Workspace = Owner + Primary contact / Semantic Model = Owner + SME + Steward). Risk-first cockpit with criticality chips, escalation timers, and a 0-100 health score. <b>Sequenced after T1.18</b> — T1.18 ships with the "No owner assigned — add via /ownership" empty-state pre-specified; once T1.20 lands, the empty-states collapse with zero T1.18 renderer change. <b>Supervised /build-feature, not auto-burn</b> (3 schema changes: <code>ownership_tags</code> + <code>ownership_audit_log</code> + <code>workspaces.criticality</code>). PRD authored (PR #368).',
    chips: { effort: '~1.5-2 weeks (supervised)', deps: 'after T1.18', validation: 'vitest + e2e-screenshot-diff', bundle: 'mockup bundle' },
  },
  'T2.4': {
    title: '/ship-it data-quality gate',
    desc: 'Ship-time check: when a PR touches a known KPI, the matching <code>pnpm validate:*</code> must pass before Gate 5. Closes the loop from definition sheet → live data parity.',
    chips: { effort: '~2h skill update' },
  },
  'T2.15': {
    title: 'FUAM column drop (H4 completion)',
    desc: 'The FUAM UI is gone; DB columns + collector + email refs remain. Pure code cleanup, no new screen value. Pull in when a pillar bumps into FUAM artifacts.',
    chips: { effort: '1-2 days' },
  },
  'T2.9': {
    title: 'Model Health tab — Stories 1-4',
    desc: 'New <code>/models/[id]/health</code> tab: Unused Objects + Duplicate DAX + Potential Savings + Top Cleanup Candidates. Pure UI on existing scan data; no schema.',
    chips: { effort: '~3-5 days', validation: 'vitest + e2e' },
  },
  'T2.10': {
    title: 'Model Health — Story 5 (mark resolved)',
    desc: 'The schema-touching follow-on after T2.9: a <code>resolved_at</code> / <code>resolved_by</code> migration on the recommendations table so users can mark health-tab items as done.',
    chips: { effort: '~1 day', deps: 'after T2.9' },
  },
  'T2.16': {
    title: 'PROD-shape DEV — Slices B + C',
    desc: 'The last two slices of dev-tenant parity: faker-generated sample data (B) + a sandbox Azure SP wired into the hotmail tenant (C). C needs operator-at-keyboard for <code>az login</code>.',
    chips: { effort: 'B: 30min · C: 2-4h' },
  },
  'T2.8': {
    title: '/kickoff layerpulse + R1 Sentry triage',
    desc: 'Loop close: the nightly Sentry routine writes a report; <code>/kickoff</code> should scan it at session-start and surface actionable items alongside the memory index. Framework-side skill change.',
    chips: { effort: '~1h skill update' },
  },
  'T2.3': {
    title: 'pnpm validate:* suite — canonical convention',
    desc: 'Five new validators (activity-events / refreshables / metrics-app / data-sources / reports-apps) + three pre-existing ones backfilled to a canonical pure-outcome-detection template.',
  },
  'T3.4': {
    title: 'Capacity Pulse — Daily Cost Trend label',
    desc: 'KPI label wraps three lines on narrower viewports. Auto-burn-eligible, ~30min, no PRD needed.',
    chips: { effort: '~30min' },
  },
  'T3.6': {
    title: 'Cost Attribution — share% drift',
    desc: '<code>topItem.sharePct</code> reads 16.8% vs <code>totalSpend</code> 10.1%. Investigation-first; potential overlap with the H2 share-of-bill math PRD.',
    chips: { effort: 'tbd' },
  },
  'T3.7': {
    title: 'Workload Mix — pre-cutover labelling',
    desc: 'The tenant-aggregate row is mis-labelled per-capacity in the pre-cutover state. ~30min auto-burn.',
    chips: { effort: '~30min' },
  },
  'T3.12': {
    title: 'Settings — V2 ingestion polish + cron-arm audit',
    desc: 'Dots instead of squares, planned-axes card removed, cron arms re-audited against the actual code (5 listed but 6 actually run). Mockup bundle ready, LP-side ~1h auto-burn.',
    chips: { effort: '~1h LP-side', bundle: 'mockup bundle' },
  },
};

// ───────────────────────── parsing helpers

function loadBacklog() {
  for (const p of BACKLOG_PATHS) {
    if (existsSync(p)) return { path: p, text: readFileSync(p, 'utf8') };
  }
  throw new Error('BACKLOG.md not found at any of:\n  ' + BACKLOG_PATHS.join('\n  '));
}

function sliceH2(text, headingRegex) {
  const lines = text.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ') && headingRegex.test(lines[i])) { start = i + 1; break; }
  }
  if (start === -1) return '';
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

function parseTierRows(block) {
  const rows = [];
  for (const line of block.split('\n')) {
    if (!line.startsWith('| ')) continue;
    if (/^\|\s*#\s*\|/.test(line)) continue;
    if (/^\|\s*-+\s*\|/.test(line)) continue;
    if (/^\|\s*Cluster\s*\|/i.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    const idRaw = cells[0];
    const id = idRaw.replace(/^~~|~~$/g, '').trim();
    if (!/^T\d/.test(id)) continue;
    const body = cells.slice(1).join(' | ');
    const titleCell = cells[1] || '';
    // Shipped detection: only consider the title cell.
    //  - id is ~~struck~~, OR
    //  - title is fully wrapped in ~~...~~, OR
    //  - title opens with "SHIPPED" / "DONE" as a standalone marker
    //    (after stripping leading ~~ ... ~~ and bold).
    const titleStripped = titleCell.replace(/^~~|~~$/g, '').replace(/^\*\*(.+?)\*\*/, '$1');
    const idStruck = /^~~.*~~$/.test(idRaw);
    const titleStruck = /^~~/.test(titleCell);
    const shippedByMarker = /\b(SHIPPED|DONE|✅)\b/.test(titleStripped.slice(0, 200));
    rows.push({
      id,
      raw: body,
      shipped: idStruck || titleStruck || shippedByMarker,
      striked: idStruck || titleStruck,
      inflight: /\bin\s*flight\b|\bin\s*progress\b|⏳/i.test(titleStripped.slice(0, 400)),
      blocked: /\bBLOCKED\b|⛔/i.test(titleCell),
    });
  }
  return rows;
}

function deriveTitle(rowRaw) {
  const bold = rowRaw.match(/\*\*(.+?)\*\*/);
  if (bold) return cleanInline(bold[1]);
  const firstCell = rowRaw.split('|')[0].trim();
  return cleanInline(firstCell);
}

function deriveDesc(rowRaw) {
  const cell = rowRaw.split('|')[0];
  const afterTitle = cell.replace(/^\s*~?~?\*\*.*?\*\*~?~?\s*[—–-]?\s*/, '').trim();
  const firstSent = afterTitle.split(/\.(?:\s|$)/)[0];
  const trimmed = firstSent.length > 240 ? firstSent.slice(0, 237) + '…' : firstSent;
  return cleanInline(trimmed) + (trimmed.endsWith('.') ? '' : '.');
}

function cleanInline(s) {
  // Two-pass: md tokens -> placeholders -> HTML-escape -> placeholders -> tags.
  const BO = 'BOLD0';
  const BC = 'BOLD1';
  const CO = 'CODE0';
  const CC = 'CODE1';
  return s
    .replace(/~~([^~]+)~~/g, '$1')   // paired inline strikethrough → text
    .replace(/~~/g, '')              // any remaining unpaired ~~ → drop
    .replace(/\*\*(.+?)\*\*/g, BO + '$1' + BC)
    .replace(/`([^`]+)`/g, CO + '$1' + CC)
    .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split(BO).join('<b>')
    .split(BC).join('</b>')
    .split(CO).join('<code>')
    .split(CC).join('</code>')
    .trim();
}

// ───────────────────────── tier card rendering

function statusClass(row) {
  if (row.shipped || row.striked) return { row: 'shipped', id: 'ship' };
  if (row.blocked) return { row: 'blocked', id: 'blk' };
  if (row.inflight) return { row: 'inflight', id: 'inf' };
  return { row: '', id: '' };
}

function renderRow(row) {
  const e = ENRICHMENTS[row.id] || {};
  const title = e.title || deriveTitle(row.raw);
  const desc = e.desc || deriveDesc(row.raw);
  const cls = statusClass(row);
  const chips = e.chips || {};
  const chipBits = [];
  if (row.shipped || row.striked) {
    // Shipped state from BACKLOG always wins over enrichment chips.
    // Keep bundle chip if present (signals "this came from a mockup bundle").
    chipBits.push('<span class="chip">shipped</span>');
    if (chips.bundle) chipBits.push('<span class="chip bun">' + chips.bundle + '</span>');
  } else {
    if (chips.effort)     chipBits.push('<span class="chip eff">' + chips.effort + '</span>');
    if (chips.deps)       chipBits.push('<span class="chip dep">' + chips.deps + '</span>');
    if (chips.validation) chipBits.push('<span class="chip val">' + chips.validation + '</span>');
    if (chips.bundle)     chipBits.push('<span class="chip bun">' + chips.bundle + '</span>');
  }

  const link = REVIEW_LINKS[row.id]
    ? '\n        <div class="link"><a href="' + REVIEW_LINKS[row.id].href + '">→ ' + REVIEW_LINKS[row.id].label + '</a></div>'
    : '';

  return '\n      <div class="row' + (cls.row ? ' ' + cls.row : '') + '">'
    + '\n        <div class="head"><h4>' + title + '</h4><span class="id' + (cls.id ? ' ' + cls.id : '') + '">' + row.id + '</span></div>'
    + '\n        <p>' + desc + '</p>'
    + '\n        <div class="foot">' + chipBits.join('') + '</div>' + link
    + '\n      </div>';
}

function isFoldedOrParked(row) {
  const t = row.raw.slice(0, 600);
  return /\bFOLDED\b|\bPARKED\b|\bSUPERSEDED\b|covered by|deferred to/i.test(t);
}

/**
 * Filter rule: keep all enriched rows; for unenriched, keep only forward-looking
 * (open and not folded/parked). The big "recently shipped" PR list at the bottom
 * of the page already covers historical shipped items.
 */
function visibleRows(rows) {
  return rows.filter(r => {
    if (ENRICHMENTS[r.id]) return true;
    if (r.shipped || r.striked) return false;
    if (isFoldedOrParked(r)) return false;
    const desc = deriveDesc(r.raw);
    if (desc.length < 50) return false; // skip stubby rows like "(T1.3a shipped)." / "(2-part, agreed …)"
    return true;
  });
}

function renderTier(rows) {
  const visible = visibleRows(rows);
  if (visible.length === 0) return '\n      <!-- (no visible rows) -->\n    ';
  return '\n    <div class="rows">' + visible.map(renderRow).join('') + '\n    </div>\n  ';
}

function tierCounts(rows) {
  // Counts reflect the TOTAL tier composition (so the count chip stays accurate),
  // even though some shipped rows are filtered from the cards.
  const shipped = rows.filter(r => r.shipped || r.striked).length;
  const open = rows.length - shipped - rows.filter(r => isFoldedOrParked(r) && !r.shipped).length;
  return open + ' open · ' + shipped + ' shipped';
}

// ───────────────────────── pillars

function renderPillars(text) {
  const idx = text.indexOf('### Per-pillar status');
  if (idx === -1) return '\n    <!-- pillar table not found -->\n  ';
  const slice = text.slice(idx).split(/\n## /)[0];
  const rows = [];
  for (const line of slice.split('\n')) {
    if (!line.startsWith('| **')) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 3) continue;
    rows.push({
      name: cleanInline(cells[0].replace(/^\*\*|\*\*$/g, '')),
      status: cleanInline(cells[1]),
      whatsLeft: cleanInline(cells[3] || cells[2] || ''),
    });
  }
  const groups = {
    'Capacity & cost (H1-H4)': rows.filter(r => /^H[1-4]\b/.test(r.name)),
    'Documents + Governance (P1 + P2)': rows.filter(r => /C2d|Governance|Glossary|Documents/i.test(r.name)),
    'Users + Activity (P4)': rows.filter(r => /Users|Activity|Graph|Tenant Activity/i.test(r.name)),
    'Reports / Lineage / Agentic (P3 + future)': rows.filter(r => /Reports|Lineage|Workspaces|Agentic|AI Agents|PERF/i.test(r.name)),
  };
  const seen = new Set();
  for (const k of Object.keys(groups)) {
    groups[k] = groups[k].filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
  }
  const blocks = [];
  let firstOpen = true;
  for (const [label, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    const openAttr = firstOpen ? ' open' : '';
    firstOpen = false;
    const rowsHtml = items.map(r =>
      '\n          <tr><td class="nm">' + r.name + '</td><td>' + r.status + '</td><td>' + r.whatsLeft + '</td></tr>'
    ).join('');
    blocks.push(
      '\n    <details class="pillars"' + openAttr + '>'
      + '\n      <summary>' + label + '</summary>'
      + '\n      <div>'
      + '\n        <table class="ptable">'
      + '\n          <tr><th>Pillar</th><th>Status</th><th>What\'s left</th></tr>'
      + rowsHtml
      + '\n        </table>'
      + '\n      </div>'
      + '\n    </details>'
    );
  }
  return blocks.join('\n') + '\n  ';
}

// ───────────────────────── inventory expansion

function renderInventory(text) {
  const idx = text.indexOf('## 🆕 Fabric inventory expansion');
  if (idx === -1) return '\n    <!-- inventory section not found -->\n  ';
  const slice = text.slice(idx).split(/\n## /)[0];
  const rows = [];
  for (const line of slice.split('\n')) {
    if (!line.startsWith('| **')) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 5) continue;
    // Inventory rows can be "**0. M code (Power Query)** — *Scanner-residual*"
    // -- nuke ALL **markers** AND *italics* before splitting num/name.
    const axisRaw = cells[0].replace(/\*\*/g, '').replace(/\*/g, '').replace(/—.*$/, '').trim();
    const m = axisRaw.match(/^(\d+)\.\s*(.+?)$/);
    const num = m ? m[1] : '?';
    const name = m ? m[2].trim() : axisRaw;
    rows.push({
      num,
      name: cleanInline(name),
      auth: cleanInline(cells[3]),
      unlocks: cleanInline(cells[5] || ''),
    });
  }
  const rowsHtml = rows.map(r =>
    '\n      <tr><td><code>' + r.num + '</code></td><td class="nm">' + r.name + '</td><td>' + r.auth + '</td><td>' + r.unlocks + '</td></tr>'
  ).join('');
  return (
    '\n    <table class="ptable">'
    + '\n      <tr><th>#</th><th>Axis</th><th>Auth needed</th><th>What it unlocks</th></tr>'
    + rowsHtml
    + '\n    </table>'
    + '\n  '
  );
}

// ───────────────────────── recently shipped

function renderShipped(text) {
  const start = text.indexOf('<!-- AUTOGEN:SHIPPED:START -->');
  const end = text.indexOf('<!-- AUTOGEN:SHIPPED:END -->');
  if (start === -1 || end === -1) return '\n    <!-- shipped block not found -->\n  ';
  const slice = text.slice(start, end);
  const items = [];
  for (const line of slice.split('\n')) {
    if (!line.startsWith('| #')) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 3) continue;
    const pr = cells[0];
    const title = cells[2];
    if (/^chore\(backlog\):\s*sync auto-managed/.test(title)) continue;
    items.push({ pr, title: cleanInline(title) });
    if (items.length >= 15) break;
  }
  const list = items.map(i =>
    '\n      <div class="si"><span class="pr">' + i.pr + '</span><span class="t">' + i.title + '</span></div>'
  ).join('');
  return '\n    <div class="ship-list">' + list + '\n    </div>\n  ';
}

// ───────────────────────── splicing

function spliceMarker(html, marker, body) {
  const startTag = '<!-- AUTOGEN:' + marker + ':START -->';
  const endTag = '<!-- AUTOGEN:' + marker + ':END -->';
  const start = html.indexOf(startTag);
  const end = html.indexOf(endTag);
  if (start === -1 || end === -1) {
    console.warn('  WARN: marker AUTOGEN:' + marker + ' not found - section skipped');
    return html;
  }
  return html.slice(0, start + startTag.length) + body + html.slice(end);
}

function spliceCount(html, marker, count) {
  const m = '<!-- AUTOGEN:COUNTS:' + marker + ' -->';
  const idx = html.indexOf(m);
  if (idx === -1) return html;
  const close = html.indexOf('</span>', idx);
  if (close === -1) return html;
  return html.slice(0, idx + m.length) + count + html.slice(close);
}

// ───────────────────────── main

function main() {
  const { path, text } = loadBacklog();
  console.log('reading ' + path);

  const tier1Text = sliceH2(text, /Tier 1/);
  const tier2Text = sliceH2(text, /Tier 2/);
  const tier3Text = sliceH2(text, /Tier 3/);

  const tier1Rows = parseTierRows(tier1Text);
  const tier2Rows = parseTierRows(tier2Text);
  const tier3Rows = parseTierRows(tier3Text);

  console.log('  tier1: ' + tier1Rows.length + ' rows (' + tierCounts(tier1Rows) + ')');
  console.log('  tier2: ' + tier2Rows.length + ' rows (' + tierCounts(tier2Rows) + ')');
  console.log('  tier3: ' + tier3Rows.length + ' rows (' + tierCounts(tier3Rows) + ')');

  let html = readFileSync(HTML_PATH, 'utf8');

  html = spliceMarker(html, 'TIER1', renderTier(tier1Rows));
  html = spliceMarker(html, 'TIER2', renderTier(tier2Rows));
  html = spliceMarker(html, 'TIER3', renderTier(tier3Rows));
  html = spliceMarker(html, 'PILLARS', renderPillars(text));
  html = spliceMarker(html, 'INVENTORY', renderInventory(text));
  html = spliceMarker(html, 'SHIPPED', renderShipped(text));

  html = spliceCount(html, 'TIER1', tierCounts(tier1Rows));
  html = spliceCount(html, 'TIER2', tierCounts(tier2Rows));
  html = spliceCount(html, 'TIER3', tier3Rows.length + ' polish items');

  writeFileSync(HTML_PATH, html);
  console.log('wrote ' + HTML_PATH);
}

main();
