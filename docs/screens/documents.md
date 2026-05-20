# Screen: Documents — auto-generated semantic-model documentation

**Pillar:** Semantic Model Quality (FinOps cross-sell at QBR · Governance evidence for Auditor preset)
**Persona:** Both — partner (primary; generates for customer audits + QBRs + analyst handoffs) + direct customer (secondary; self-serve)
**Value-loop quadrant:** Render — joins `models × tables × columns × measures × DAX × power_query_M × relationships × lineage × rls × sensitivity_labels × refresh_history × access × adoption × quality_score` (automated) **with** `owners × business_glossary` (manual) and renders to a Word-shaped document in one click.
**Decision the user makes:** "Ship this auto-generated doc to my auditor / new analyst / executive / engineer — right now."
**Surfaces:** `/documents` (library + generator) · the **DocumentPreviewModal** (rendered preview) · `/models/[id]` → Documentation tab (per-model entry point).

**Data joins required:**
- **Automated (Fabric API + LP collectors):** `semantic_models × tables × columns × measures × relationships` · `partition_M_expressions` (Power Query) · `model_lineage` (upstream + downstream) · `rls_rules × sensitivity_labels` · `model_changelog` (from activity_events) · `quality_score` (LP rules engine) · `refresh_history` (Refreshables endpoint) · `dataset_permissions × aad_groups` (Access) · `report_consumption` (Adoption)
- **Manual (LP-side foundation):** `model_owners` (Owner/SME/Stewards/Domain — see [[ownership]]) · `business_glossary` attachments (see [[glossary]])

## Why this exists

Generating documentation for a semantic model today means: open Tabular Editor → export schema → manually format → write the narrative → email the .docx. 1–3 hours per model, rots on the next model change. Microsoft's surfaces (Fabric admin portal, DAX Studio, Tabular Editor, Power BI Desktop) **render** metadata but never produce an audience-shaped artifact. There is no "give me the doc" button in the Microsoft stack.

LayerPulse already joins `model_metadata × workspace × tenant_settings × activity_events × lineage` for every monitored tenant. The document **is** the deliverable — the single biggest differentiator screen per `productvision.md` §12.

**The complete-document thesis:** a great model doc combines two knowledge layers that live in different places —
- **Automated technical knowledge** LP extracts from Fabric (schema, DAX, M, lineage, refresh, access, maturity, adoption)
- **Manual business knowledge** humans capture in LP (ownership accountability + business-glossary definitions)

Neither layer alone is a usable doc. LP is the only tool that holds both and joins them.

## Happy path

The page is **library-first** (the vault is the daily door; the generator is one tab away).

1. **`/documents` · Library tab (default):**
   1. Header: title + 4-KPI strip (coverage / generated-30d / outdated / median-gen-time) + `[+ Generate new]` CTA.
   2. Outdated banner (amber) when any doc's source model changed since last gen — `[Set up auto-regen]` + `[Regenerate all]`.
   3. Filter row: search · status chips (All / Current / Outdated / Scheduled) · workspace · audience · sort.
   4. Each row: tone icon · model name · **audience pill** (Auditor / Analyst / Executive / Engineer) · status pill · workspace · format · last-gen (relative; absolute-UTC tooltip) · size · **schedule chip** (Off / Daily / Weekly / Monthly / On-change). **The whole row is clickable → opens the DocumentPreviewModal.**
2. **Generate tab:** 3-step flow (Pick model → Choose sections → Preview). Step-3 "Generate .{format}" CTA → opens the modal with the just-built doc.
3. **`/models/[id]` → Documentation tab:** per-model entry — 4 audience preset cards + a versions list filtered to that model. Clicking a preset or a version opens the modal.

## DocumentPreviewModal — the rendered preview

Fullscreen drawer (≈92vw / 92vh), **portaled to `document.body`** so it overlays the full viewport regardless of any transformed ancestor (the `.fade-in` tab wrapper was trapping it before). 4-region grid: header · optional outdated-banner · scrollable Word-shaped page strip · footer.

- **Header (sticky):** file-text icon · model name · audience pill · format badge · sub-line (workspace · env · "Generated {time}" · section count). Toolbar: **4-way audience seg-switch** (Auditor / Analyst / Executive / Engineer — re-renders the body in place so all 4 variants are reachable without reopening) · format select (`.docx` / `.pdf` / `.md`) · Regenerate · Download · Close (Esc).
- **Body:** scrollable strip of 816×1056 (US-Letter @ 96dpi) pages. Serif body (Cambria/Georgia), DM Sans headings (navy `#0D3159`), JetBrains Mono for numbers/DAX/M/identifiers. Running head + foot + page-number gutter.
- **Footer (sticky):** scroll-tracked page nav (Page X of Y) + meta strip.

### Audience renders — the section matrix

Each preset assembles automated + manual sections differently. ✓ = present.

| Section (source) | Auditor | Analyst | Executive | Engineer |
|---|:-:|:-:|:-:|:-:|
| Cover (auto + Owner/Domain from LP) | ✓ | ✓ | ✓ | ✓ |
| Executive summary KPIs (auto) | ✓ | ✓ | ✓ big | ✓ |
| TOC (auto) | — | ✓ | — | ✓ |
| **Model maturity / quality score** (auto) | ✓ | ✓ | — | ✓ |
| Scope & method (auto) | ✓ | — | — | — |
| Tables + columns (auto schema · **glossary-driven descriptions**) | ✓ | ✓ | — | ✓ full |
| Relationships (auto) | ✓ | ✓ | — | ✓ |
| ER diagram (derived) | — | — | — | ✓ |
| **Power Query (M)** (auto · ingestion layer) | — | — | — | ✓ |
| Measures (auto DAX · **glossary-driven descriptions**) | ✓ named | ✓ no-DAX | ✓ top-4 | ✓ + DAX |
| Calculated columns (auto) | — | — | — | ✓ |
| RLS + sensitivity (auto) | ✓ | — | — | — |
| **Access** (auto · RLS-scope mapping) | ✓ | — | — | ✓ |
| **Refresh history** (auto) | ✓ | ✓ | — | ✓ |
| **Adoption** (auto · downstream reach) | — | ✓ | ✓ | ✓ |
| Lineage up/down (auto) | ✓ | ✓ | — | ✓ |
| Change log (auto) | ✓ last-8 | — | — | ✓ full |
| **Business glossary** (manual, see [[glossary]]) | compliance terms (Process+Acronym) | full · grouped by type | KPIs+Metrics only | technical (Acronym+Dimension) |
| **Owners + sign-off** (manual, see [[ownership]]) | ✓ Owner + Stewards sign-off | contact card (SME) | cover credit | — |

### The Owner/SME/Stewards binding (manual → doc)

- **Cover Owner field** = `resolveModelOwner(model, ws)` with an `(inherited from workspace)` indicator when not overridden. Red "— Not yet assigned —" when absent.
- **Auditor sign-off page** = real Owner cell + up to 2 Steward cells (+N overflow) + external-auditor row. Empty-state when no stewards: "No stewards assigned in LP. Add via /ownership."
- **Analyst contact card** = SME if assigned, else fallback to Owner with explicit `(SME not assigned — uses Owner)` hint.
- **Domain** appears on the cover when tagged.

### The glossary binding (manual → doc) — the "no random descriptions" rule

Operator rule: a measure/column/table description **only** comes from an attached business-glossary term — never invented prose.
- **Measure description** = first sentence of the attached Metric/KPI term + a tone-coded tag badge (`METRIC · AOV`). **No attachment → no description.**
- **Column / table description** = same, via `linkedTo.columns` / `linkedTo.tables`. Blank ("—") when nothing attached.
- The glossary section per audience reads the terms attached to *this* model (`getModelGlossaryAttachments`), falling back to the canonical fixture only so a doc never ships an empty glossary.

## Edge states

- **Library, no outdated docs:** outdated banner hidden.
- **Library, no docs match filters:** "No documents match. Adjust the filters above, or generate a new document" (link to Generate tab).
- **Brand-new tenant (zero docs):** CTA card "No documents yet. Generate your first one."
- **Model with no doc versions** (Documentation tab): empty state under "Versions" + the 4 preset cards still clickable to render.
- **Outdated doc opened in modal:** amber banner under the header + "Regenerate now."
- **Audience swap mid-modal:** body re-renders, scroll resets to page 1, format persists.
- **No Owner / no SME / no Stewards:** rendered as explicit red/grey empty-states (deliberate signal to populate `/ownership`), never fabricated.
- **Measure with no glossary term:** renders without a description (deliberate signal to attach).
- **Permission-denied** (partner-of-record, read-only seat): all mutating CTAs disabled with tooltip.
- **ESC / backdrop click:** closes modal.

## Components used

**`/documents` shell:** `StatCard` ×4 · `model-tabs` (Library / Generate) · `doc-gen-cta`.
**Library:** `doc-banner` · `doc-lib-filters` · `doc-row` (+ `doc-row-click`, `doc-row-outdated`) · `doc-aud-pill` · `doc-status` · `doc-sched-chip` + `doc-sched-pop` · `doc-empty`.
**Generate:** `doc-gen-grid` · `doc-pick-row` · `doc-aud-tab` · `doc-section-grp` / `doc-section-row` · `doc-toggle` · `doc-preview-card` (schematic) · `doc-est-strip` · `doc-gen-hint`.
**DocumentPreviewModal:** `doc-modal-backdrop` (portaled) + `doc-modal` · `doc-modal-header` + audience seg-switch · `doc-modal-banner` · `doc-modal-page` (816×1056) · `doc-page-running-head/foot` · paper typography (`doc-h1/h2/h3`, `doc-p`, `doc-table`, `doc-measure` + `doc-dax`, `doc-mquery` + `doc-mcode`, `doc-finding`, `doc-glossary`, `doc-quality`, `doc-access-role`, `doc-kpi-grid`, `doc-cover`, `doc-signoff`) · `doc-modal-footer` page nav.
**Per-model Documentation tab:** `model-docs-presets` (4 audience cards) + versions list reusing `doc-row` + the modal.
**Section components:** `DocCover` · `ExecKpiGrid` · `TocList` · `QualityScoreSection` · `TablesOverview` · `ColumnsForTable` · `RelationshipsTable` · `ErDiagram` · `PowerQuerySection` · `MeasuresList` · `RlsTable` · `SensLabelsTable` · `AccessSection` · `RefreshHistorySection` · `AdoptionSection` · `LineageBlocks` · `ChangelogTable` · `GlossaryList` · `OwnersTable` · `ContactCard`.

## Metrics surfaced

Coverage % · generated/30d · outdated count · median gen time · per-model last-gen · live page/size/gen estimate (Generate tab) · per-doc page count.

## Benefit hypothesis

Within 90 days, partners cite Documents as the "wow moment" in 60% of QBRs. Auto-docs replace ≥80% of manual model documentation (1–3 hr → ~24 s). Doc Coverage % on Overview climbs 78% → 92%. Auditor preset becomes the default SOC 2 evidence pull. The Owner sign-off + glossary binding make the doc operationally trustworthy (real signatures, canonical definitions) rather than cosmetic.

## Open questions / future iterations

- **Diff view** ("what changed since last gen") — defer to v2; today we flag `outdated`.
- **Power Query M for non-Engineer audiences** — condensed provenance summary for Auditor? (operator considering)
- **Embedded sparkline charts** in KPI sections — backend renderer dependency.
- **Multi-model batch generation** — strong Tier-1 follow-up.
- **LLM-suggested glossary attachment** — Q3+, off by default (humans-in-the-loop).

## Notes for LP-side PRD authoring

- Audience-preset list is **the contract**. Adding a preset = a column on `documents.audiences` + each section's `audiences[]` mapping.
- Section catalogue is **append-only** from a backend perspective (renaming breaks doc-template diffing).
- The preview Word styling is a **hint** — the real `.docx` renderer (server-side OOXML) is source of truth and must match font/spacing/numbering.
- The automated/manual split is the architectural spine: automated sections render even with zero manual data (degrading to explicit empty-states); manual sections (Owner sign-off, glossary descriptions) are what make the doc trustworthy.
- See companion PRD: `docs/prds/documents.md`.
