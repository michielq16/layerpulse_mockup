# Screen: Business glossary — tenant-wide single dictionary

**Pillar:** Governance & Compliance (also feeds Semantic Model Quality — the Documents modal renders attached glossary terms per audience)
**Persona:** Both — partner (per-customer glossary), direct customer (their own)
**Value-loop quadrant:** Ingest (manual entry — stewards write; LP joins downstream into model objects + documents)
**Decision the user makes:** "What does this term *officially* mean here? What model objects use it? Who do I ask?"
**Surfaces:** `/glossary` (the dictionary) · `VocabularyPanel` on `/models/[id]/overview` · "Business glossary" subsection on the Measures-tab drawer · the Documents modal (per-audience glossary sections).

**Data joins required:** None upstream — the glossary **is** the upstream. Joined downstream into: semantic-model objects (measures/columns/tables/model-level via `linkedTo`), the Documents modal, and (future) lineage.
**Sample data:** `DATA.glossary` in `src/data.jsx` — 53 terms across 7 domains · 6 types · 4 statuses · 4 sensitivities, covering A–Z.

## Why this exists

Fabric exposes column types, table names, and DAX expressions. It does NOT expose:
- What "AOV" means in *this* business (industry-specific)
- Whether the agreed definition is approved / proposed / deprecated
- Who's accountable for the definition (steward) and who can answer questions (SME)
- Where the canonical policy doc lives (business-process URL)

Today this lives scattered across Confluence, Notion, individual Power BI tooltips, and Slack threads. LP centralizes it into one tenant-wide dictionary, then **attaches terms to the actual model objects** so the business meaning travels with the technical asset — and lands in every auto-generated document.

Shape follows **DAMA-DMBOK** conventions, matched to the metadata Atlan / Collibra / Alation expose, tuned for the Fabric stack (links to semantic-model objects, not arbitrary catalog entries).

## Happy path

1. User lands on `/glossary`. Header: title + sub + `+ Add term` CTA.
2. **5-KPI strip:** Total terms · Approved · Proposed · Review overdue · Orphan terms (no model linked).
3. **Two-pane layout:** left filter rail (sticky) + right term view.
4. **Filter rail (sticky, 240px):** search box + 4 chip-groups (Type / Domain / Status / Sensitivity, each tone-tinted w/ counts) + Owner select. *(`.lp-search` is constrained to the rail width — it has a global 320px default that previously overflowed.)*
5. **View toggle (default = A–Z):** `[A–Z] [Cards]` segmented control next to the sort dropdown.
   - **A–Z (default):** dictionary view. Letter thumb-index strip (only letters with terms) → click to scroll. Alphabetical groups with a big sticky letter on the left and term rows on the right: `Term [TYPE] [status] — first-sentence definition`. The one-liner is context-sensitive because the data leads with the canonical sentence (acronym expansion / metric name / process scope).
   - **Cards:** grid of term cards (name · type pill · status pill · 3-line clamped definition · meta row: domain · sensitivity · owner · linked-count · overdue flag). Sort dropdown (Alphabetical / Recently reviewed / Review-due first / Status) shows only in Cards view.
6. **Click a term (either view) → detail drawer** (680px): full definition · 2-col meta grid (Owner · SME · Source · Business-process URL · Last reviewed · Next review) · synonyms chips · related-terms chips (navigable in-drawer) · **Linked-to** block (model chips + measure chips).
7. **`+ Add term`** opens the drawer in form mode (Term · Definition · Type · Domain · Status · Sensitivity · Owner · SME · Source · URL · Synonyms · Related · Review cadence).

## Attachment — the bridge to semantic-model objects

The glossary's payoff is **attachment**: terms link to model objects via `linkedTo`:

```js
linkedTo: {
  models:   ['Sales Analytics'],          // model-level (business terms, acronyms, processes)
  measures: ['[AOV (LCY)]', 'Avg Order Value'],  // accepts bracketed + bare names
  columns:  ['DimDate[FiscalYear]'],      // Table[Column] notation
  tables:   ['DimCustomer'],              // table-level (dimensions)
}
```

Attachment surfaces (read + add):
- **VocabularyPanel** on `/models/[id]/overview` (below the RolePanel) — sectioned chips by type (Metrics · KPIs · Dimensions · Business terms · Acronyms · Processes) for every term attached to the model. "+ Attach term" opens a search/filter drawer.
- **Measures-tab drawer** — when a measure is selected, a "Business glossary" subsection shows attached Metric/KPI/Business-term cards (term · type pill · 1-line def · owner · domain). "+ Attach term" scoped to that measure.
- **Documents modal** — per audience: Analyst (full, grouped by type) · Executive (Metrics+KPIs) · Auditor (Compliance terminology: Process+Acronym) · Engineer (Technical glossary: Acronym+Dimension). Measure/column/table descriptions in the doc are **glossary-driven** (the attached term's definition, or blank).

**Type → home mapping** (per the [[fabric-artifact-ownership-conventions]] analysis):

| Glossary type | Primary attachment home |
|---|---|
| Metric · KPI | Measure |
| Dimension | Table (+ Column for specific attributes) |
| Business term | Anywhere — Model · Column · Measure |
| Acronym | Anywhere — typically Model-level vocabulary |
| Process | Model-level (the workflow that governs the model — NOT the workspace) |

## Edge states

- **No matches (Cards):** "No terms match. Clear filters or add the first term."
- **No matches (A–Z):** "No terms match. Adjust filters above."
- **Review overdue card:** rose `overdue` flag in the meta row + tone on next-review in the drawer.
- **Deprecated term:** slate status pill; definition typically opens with `[DEPRECATED YYYY-MM]` + redirect.
- **Orphan term (no linked objects):** drawer shows "No model or measure references this term yet. Map manually →."
- **Broken related-term link:** renders as a plain (non-clickable) chip when the target term doesn't exist.
- **Attach drawer, no term picked:** mockup-only — selecting a term opens its detail drawer (no real mutation).
- **ESC / backdrop:** closes any drawer.

## Components used

`StatCard` ×5 · `lp-grid-5` · `gloss-shell` (rail + main) · `gloss-rail` + `gloss-rail-chip` · view toggle (`seg-tabs`) · **A–Z:** `gloss-az` · `gloss-az-index` · `gloss-az-group` + `gloss-az-letter` · `gloss-az-row` · **Cards:** `gloss-grid` · `gloss-card` · `gloss-type-pill` (6 tones) · `gloss-status` (4 tones) · **Drawer:** `gloss-drawer` · `gloss-field` · `gloss-chip` family · **Attach:** `AttachTermDrawer` (`vocab-attach-row`) · **Model surfaces:** `VocabularyPanel` (`vocab-panel` / `vocab-section` / `vocab-chip`) · `measure-glossary-card`.

## Metrics surfaced

Total terms · Approved · Proposed · Review overdue · Orphan terms · per-term linked-count · review-overdue flag.

## Benefit hypothesis

Within 60 days, analyst onboarding time drops 50% (read the glossary once vs. asking 20 stewards). The Documents modal's Analyst/Executive renders show meaningful, business-canonical definitions instead of invented prose. Auditor preset cites the glossary as the definition source → SOC 2 evidence becomes self-documenting. Slack #data-questions volume drops because each term has an authoritative URL.

## Open questions / future iterations

- **Auto-suggest attachment** — naming/synonym/DAX-scan match (e.g. `[AOV (LCY)]` → suggest `AOV`). Deferred; manual-first per operator.
- **Bulk-apply** a process/term to all models in a workspace (e.g. "Governance review" → all models). Deferred.
- **Purview import** if the customer maintains a Purview glossary. Tier 2.
- **Versioning** of definitions over time. Defer; the ownership audit-log pattern may suffice.
- **Per-attachment domain/sensitivity override** (one model's "AOV" more sensitive than another's). Likely overkill for v1.

## Notes for LP-side PRD authoring

- Storage: `business_terms(id, term, definition, type, domain, status, sensitivity, owner_email, sme_email, source, process_url, synonyms[], related[], last_reviewed_at, next_review_at, ...)` + junction tables `term_model_links` / `term_measure_links` / `term_column_links` / `term_table_links` (or a single polymorphic `term_attachments(term_id, object_type, object_ref)`).
- `synonyms` / `related` are arrays of strings, not FKs — allows soft-linking to terms that don't exist yet.
- Type/domain/status/sensitivity are controlled vocabularies; keep in separate tables, append-only.
- `next_review_at` is the ops anchor — a daily cron flags overdue terms (writes to `/alerts` if a steward has >3 overdue).
- Measures referenced by `model_id + measure_name` (composite), accepting both bracketed and bare forms; models by surrogate `model_id`.
- See companion PRD: `docs/prds/glossary.md`.
