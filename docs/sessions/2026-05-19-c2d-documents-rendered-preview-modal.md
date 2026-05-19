# Session log — 2026-05-19 · C2d Documents · rendered-preview modal

**Operator:** Michiel
**Branch:** `claude/c2d-preview-modal`
**Production:** https://layerpulze-mockup.vercel.app (tracks `main` — PR pending)
**Prior session:** [[2026-05-18-mockup-overhaul]]

This session upgraded the `/documents` Generate-tab step-3 preview from a section-schematic (grey lines representing text) into a fully-rendered, Word-shaped modal showing the actual generated document with Fabric-plausible content. Coverage = all 4 audience presets (Auditor / Analyst / Executive / Engineer).

---

## Decision: "document types" = the 4 audience presets

Pushback at the start of the session: the operator's "all document types" could mean (a) the 4 audience presets of a semantic-model doc, or (b) different deliverable categories (SOC 2 evidence pack, partner QBR, capacity cost report, governance snapshot). Confirmed **(a)**. Reasoning:

- The /documents screen is scoped to semantic-model documentation
- The 4 audience presets are *the* document types from the reader's perspective
- SOC 2 pack is priority #4 (lives at `/audit`)
- QBR superdocument belongs to partner workflow, not Documents
- Cross-pillar deliverables would expand scope past one PR

Future work for other doc *categories* should land in their own screens/PRs.

---

## Gates verdict — all 5 strong

| Gate | Verdict |
|---|---|
| G1 Pillar | Semantic Model Quality (auto-Word) ✓ |
| G2 JOIN | `models × tables × measures × DAX × lineage × tenant_settings × glossary × rls` — no other tool ships this artifact ✓ |
| G3 Persona | Both partner (QBR ammo + auditor handoff) + customer (self-serve handoff) ✓ |
| G4 Differentiator | Microsoft has nothing; closest is Tabular Editor + manual scripts. LP renders in seconds w/ partner brand ✓ |
| G5 Decision | "Is this doc good enough to send to my auditor / new analyst / exec — right now?" ✓ |

---

## What shipped

### 1. Sample-data fixture — `DATA.documents.sample`

Added a canonical content block in `src/data.jsx`. Sales Analytics (Finance-Prod) is the only model w/ full content; all renders reuse it (model name in heading swaps with operator's selection, body content stays the same — mockup-only convention).

Contents:
- **execSummary** — 6 KPIs + narrative
- **tables** — 5 tables (FactSales, DimDate, DimCustomer, DimProduct, DimGeography) w/ per-column types + roles + descriptions
- **measures** — 8 measures w/ real DAX (CALCULATE / DATESYTD / SAMEPERIODLASTYEAR / TOPN / KEEPFILTERS), folder, format, dependencies
- **relationships** — 4 active relationships
- **rls** — 6 RLS rules w/ DAX filter + AAD group members
- **sensLabels** — 4 column-level MIP labels
- **findings** — 3 governance findings (critical / warning / info)
- **owners** — 4 owners w/ role + email + last-touched date
- **lineage** — 8 upstream sources (Bronze/Silver/Gold layers) + 11 downstream consumers (reports, paginated, app)
- **changelog** — 12 entries spanning Feb–May
- **glossary** — 5 business terms (LCY, AOV, NRR, Fiscal Year, Segment)
- **erd** — 5-table star-schema coordinates for SVG render

### 2. DocumentPreviewModal component — `src/NewPages.jsx`

New fullscreen drawer (≈92vw / 92vh) with 4-region grid:
- Header (sticky): title block + 4-way audience seg-switch + format select + Regenerate + Download + Close
- Optional outdated banner
- Body: scrollable strip of Word-shaped pages (816×1056 each, US Letter @ 96dpi), serif body + DM Sans headings + JetBrains Mono identifiers/DAX, running head + foot, page-number gutter
- Footer (sticky): scroll-tracked page nav + meta strip

Side-channel: audience seg-switch in the header re-renders body w/o closing modal — clicking through Auditor → Analyst → Executive → Engineer shows all 4 variants in seconds. Operator-asked behavior, big demo win.

ESC key + backdrop click both close. Body scroll lock on `<body>` while open. Mobile <900px: modal fills viewport.

### 3. Audience-specific page sequences

Each audience renders a distinct page count and section order:

| Audience | Pages | Distinguishing sections |
|---|---:|---|
| **Auditor** | 8 | RLS rules · sensitivity labels · governance findings · sign-off block |
| **Analyst** | 6 | Measures (no DAX) · glossary · owners |
| **Executive** | 3 | Big KPI tiles · top-5 downstream surfaces · short glossary |
| **Engineer** | 10 | ER diagram · measures w/ raw DAX (paginated 4+4) · calc columns · lineage tables · 12-row changelog |

Atom components are shared across audiences (`<TablesOverview>`, `<ColumnsForTable>`, `<MeasuresList withDax={…}>`, `<RlsTable>`, `<FindingsList>`, `<OwnersTable>`, `<ChangelogTable>`, `<GlossaryList>`, `<ErDiagram>`, `<LineageBlocks>`, `<DocCover>`, `<ExecKpiGrid>`, `<TocList>`).

### 4. Triggers — both Library and Generate

- **Library tab:** entire row is clickable (`role="button"` + Enter/Space keyboard handler). View icon and Download button also call the same handler. Audience+format come from the row.
- **Generate tab:** step-3 "Generate .{format}" CTA opens the modal with current model + audience + format + selected sections + `includeLogo`. Replaces the prior `onBackToLibrary` behavior (commit moves user back to library only on Download).

Schedule chip popover + Regenerate icon do NOT trigger the modal (kept as separate affordances).

### 5. CSS — `src/styles/app.css` (+~480 lines appended)

Word-shaped paper feel:
- `.doc-modal-page` — 816×1056 white card w/ shadow, serif 11pt body
- `.doc-h1/h2/h3` — DM Sans, navy `#0D3159`, underline rule on H2
- `.doc-table` — navy header, striped rows, 0.5pt borders, mono numbers
- `.doc-measure` — left-violet accent block, mono name, monospace DAX block on `#0D1B2A` w/ gold `#ffd166` text
- `.doc-finding-{critical|warning|info}` — semantic-toned callout boxes
- `.doc-cover-eyebrow[data-tone=…]` — audience-toned pill on cover (rose / sky / amber / violet)
- `.doc-erd` — SVG container w/ dashed dim→fact lines, navy fact card w/ gold name
- `.doc-signoff` — auditor sign-off block w/ underline placeholders
- Dark mode: modal shell adapts, page itself stays paper-white (intentional — readable preview always)
- Print-feel typography all over (Cambria/Georgia stack, 11pt, 0.75pt borders)

---

## Operator preferences locked this session

- **"Document types" in the C2d/`/documents` context = the 4 audience presets.** Other doc categories (SOC 2 pack, QBR, capacity report, governance snapshot) belong to other surfaces / future sessions.
- **Audience seg-switch inside the modal is intentional.** Lets the operator see all 4 variants without reopening — easier QBR demo and faster cross-check.
- **Single sample-data fixture is fine for mockup.** Operator confirmed Sales Analytics as canonical sample; model-name swap from picker/library row is enough fidelity for the design phase. Per-model content lives on the LP-product side.
- **Don't run a real .docx renderer in the mockup.** HTML/CSS Word-shaped fidelity is the right design surface. Server-side OOXML renderer is out of scope here.

---

## Open threads (not done this session)

| Item | Notes |
|---|---|
| Per-model content swap (not just heading) | Mockup uses one canonical block. Real renderer joins per `model_id`; mockup could fake more sample blocks per model if operator wants a richer demo. |
| Diff view ("what changed since last gen") | Still parked from prior `documents.md`. Out of scope this PR. |
| Embedded charts (sparklines next to KPIs) | Backend renderer dependency; design later. |
| Section-reordering in modal | Out of scope; audience presets cover 90%. |
| Real-Word/PDF render parity check | When the back-end OOXML renderer lands, run a fidelity pass: do the same fonts/spacing show up in Word? See [[CLAUDE.md#Cross-Tool Verification]]. |
| Multi-model batch generation | Tier 1 follow-up; would live in Library tab. |

---

## Files changed

- `src/data.jsx` — added `documents.sample` block (~180 LOC of fixture data)
- `src/NewPages.jsx` — `Documents()` lifted modal state · `DocumentsLibrary` row clickable · `DocumentsGenerate` CTA wired to modal · new `DocumentPreviewModal` + `buildDocPages` + 4 audience builders + 13 atom components (~470 LOC)
- `src/styles/app.css` — appended ~480 LOC of modal + paper styles
- `docs/screens/documents.md` — updated narrative to describe rendered modal + components used
- `docs/sessions/2026-05-19-c2d-documents-rendered-preview-modal.md` — this file

## Verification

- `npm run build` → clean (1.21s, 54 modules, no errors)
- `npm run dev` → up on `http://localhost:5173`
- Visual verification in browser: **operator-side only this session** (Chrome extension not connected to this CLI). Operator browse `/documents`, click any library row OR step-3 Generate CTA, and verify the modal renders.
- Vercel preview will be the durable verification surface; PR opens after this commit.
