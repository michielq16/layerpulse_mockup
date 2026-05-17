# Screen: Documents — auto-Word generation flow

**Pillar:** Semantic Model Quality (FinOps cross-sell at QBR)
**Persona:** Both — partner (primary, generates for customer audits + QBRs) + direct customer (secondary, self-serve handoff docs)
**Value-loop quadrant:** Render — joins `models × tables × measures × DAX_dependencies × lineage × tenant_settings × glossary_terms` from the existing graph and renders to .docx in one click
**Decision the user makes:** "Ship this auto-generated doc to my auditor / new analyst / executive — right now."
**Data joins required:**
- `semantic_models × tables × columns × measures × relationships` (Quality pillar core)
- `model_lineage` (upstream sources + downstream reports + impact list)
- `tenant_settings × sensitivity_labels × rls_rules` (Governance pillar overlay for the Auditor preset)
- `business_glossary × owners` (Context overlay)
- `model_changelog` (drives the "outdated" status)

## Why this exists

Generating documentation for a semantic model today means: open Tabular Editor → export schema → manually format → write the narrative → email the .docx. 1–3 hours per model. The data needed is already in LP's joined graph; LP can produce the same artifact in ~24 seconds with a click. **This is the single biggest differentiator screen** per `productvision.md` §12.

## Happy path

The page is **library-first** (vault is the daily door; generator is a tab away).

1. User lands on `/documents`. Header: title + `[+ Generate new]` primary CTA. 4 KPI strip (coverage, gen/30d, outdated, median gen time). Tab bar: `[Library (default)] [Generate]`.
2. **Library tab (default):**
   1. If any documents are outdated, an **amber banner** at the top surfaces *"N documents are outdated — model changed since last gen"* with `[Set up auto-regen]` + `[Regenerate all]` actions. Banner hides itself when no outdated docs remain.
   2. Filter row: search (model + workspace) · status chips (All / Current / Outdated / Scheduled with counts) · workspace dropdown · audience dropdown · sort dropdown (Recently generated default / Name A–Z / Outdated first).
   3. Doc rows show: tone-colored icon, model name, **audience pill** (Auditor / Analyst / Executive / Engineer), **status pill** (Current / Outdated), workspace · format · last-gen relative time (tooltip with absolute UTC) · size, **schedule chip** (Off / Daily / Weekly / Monthly / On change with next-fire time), row actions (View / Regenerate / Download).
   4. Outdated rows get a left-edge amber accent.
   5. Schedule chip click → small popover with the 5 frequency options + checkmark on current; pick one to set/cancel schedule.
3. **Generate tab:** the 3-step flow (Pick model → Choose sections → Preview & download) — unchanged from v1 of this screen.
   - Step 1 — Pick a model: search, filter chips (All / Outdated / Never), scrollable list with status pills.
   - Step 2 — Choose sections: audience preset (auto-toggles section bundles), section catalogue grouped by Cover & summary / Schema / Logic / Lineage / Governance / Context, format toggle, cover-logo switch.
   - Step 3 — Preview & download: Word-shaped paginated preview, estimate strip (pages / size / gen time), Share link / Schedule weekly / Generate .docx actions, status-aware hint card.
   - Clicking the gradient `Generate` CTA navigates back to the Library tab where the new doc is now top of the list.
4. The `[+ Generate new]` header CTA jumps to the Generate tab from anywhere on the page.

## Edge states

- **Library, no outdated docs:** outdated banner hidden entirely.
- **Library, no docs match filters:** empty state with copy *"No documents match. Adjust the filters above, or generate a new document"* — second clause is a link to the Generate tab.
- **Library, brand new tenant (zero docs ever generated):** instead of an empty list, show a CTA card *"No documents yet. Generate your first one"* that opens the Generate tab. (Implementation note: trigger when `d.items.length === 0`.)
- **Schedule popover, click outside:** popover closes; selection persists.
- **Generate tab, no sections selected:** preview shows italic copy *"No sections selected. Pick at least one section in step 2 to see the document take shape."* CTA disabled.
- **Generate tab, first-time model:** info-tone hint card: *"No prior document for this model. First generation will become the baseline."*
- **Generate tab, outdated model:** amber-tone hint card: *"Last generated {N}d ago. Model has changed since — regenerate to refresh."*
- **Permission-denied** (partner-of-record on customer with read-only seat): all mutating CTAs disabled (`[+ Generate new]`, `Regenerate`, `Regenerate all`, `Set up auto-regen`, schedule chip popover) with tooltip *"Read-only access — ask {customer admin} to generate this doc."*
- **Generation failure:** banner above the preview with the failure reason + retry button. (Out of scope for the mockup; real backend behavior.)

## Components used

**Shell:**
- `StatCard` × 4 — emerald / sky / amber / violet KPI strip
- `seg-tabs` + `doc-tabs` (new) — top-level Library / Generate tab bar
- `doc-gen-cta` — gradient `+ Generate new` primary CTA in header (also used by the Generate action in step 3)

**Library tab:**
- `doc-banner` (new) — amber-tinted outdated-doc surface with title + sub + action cluster
- `lp-card-flush` + `doc-lib-filters` — filter row with search, status chips, workspace + audience + sort dropdowns
- `chip` — status filter (All / Current / Outdated / Scheduled with counts)
- `doc-row` + `doc-row-outdated` (existing + new modifier) — row with left-edge amber accent for outdated
- `doc-aud-pill` (new) — colored audience badge per row (rose=auditor / sky=analyst / amber=executive / violet=engineer / slate=other)
- `doc-status` (existing) — Current / Outdated pill
- `doc-sched-chip` + `doc-sched-pop` (new) — schedule frequency chip with popover (Off / Daily / Weekly / Monthly / On change)
- `doc-empty` (new) — empty-state with link back to Generate tab

**Generate tab:**
- `doc-gen-grid` — 3-column layout
- `doc-gen-step` + `doc-gen-step-n` — numbered step headers
- `doc-pick-row` — model picker rows with selection highlight
- `doc-aud-tab` — 2×2 audience preset grid with active state
- `doc-section-grp` + `doc-section-row` — checkbox rows grouped by section family
- `doc-toggle` — iOS-style switch for partner logo
- `doc-preview-card` + `doc-preview-page` — Word-shaped paginated preview
- `doc-est-strip` — pages / size / gen-time estimate
- `doc-gen-hint` — inline status hint (amber for outdated, info-blue for never)

## Metrics surfaced on the screen

- **Models documented / 34** + coverage % (header KPI)
- **Generated / 30d** (header KPI)
- **Outdated** count (header KPI; links to picker filter)
- **Median generation time** (header KPI; sets expectation in seconds)
- **Per-model `last generated` time** (picker rows)
- **Section item counts** (in real time as user toggles — tables: 12, measures: 42, etc.)
- **Live page count / size estimate / generation-time estimate** (right-rail strip, updates with selection)

## Benefit hypothesis

Within 90 days of shipping, partners cite Documents as the "wow moment" in 60% of QBRs. Auto-generated docs replace ≥80% of manual model documentation (currently 1–3 hr per model). Doc Coverage % on Overview climbs from 78% to 92% across active tenants because regeneration is a single click; Auditor preset becomes the default download for SOC 2 evidence pulls. Tertiary effect: "Generate report" on Overview converts to a Documents shortcut, increasing engagement with the pillar 3×.

## Open questions / future iterations

- **Diff view** ("what changed since last gen") — defer to v2; today we just flag `outdated`.
- **Section reordering** (drag-handles within a group) — defer; audience presets cover 90% of layouts.
- **Multi-model batch generation** ("generate docs for every outdated model in Finance-Prod") — strong Tier 1 follow-up, slots after this ships.
- **Embedded charts in preview** (sparklines next to KPI sections) — depends on backend doc renderer; design later.
- **Brand customization** beyond the logo toggle (color, font choice) — out of scope; LayerPulse brand on cover, not customer's.

## Notes for LP-side PRD authoring

- The audience-preset list is **the contract**. Adding a preset = adding a column to `documents.audiences` + mapping each section's `audiences` array. No bespoke logic per audience.
- The section catalogue (`documents.sections`) is **append-only** from a backend perspective. Renaming a section breaks doc-template diffing.
- The preview-pane Word styling is a hint only — the real `.docx` renderer (likely server-side via OOXML library) is the source of truth. The mockup preview should match its output font / spacing / numbering once that lands.
- `Schedule weekly` button parks the recurrence as a `documents.subscriptions` row keyed on (`model_id`, `audience`, `format`, `recipients`). Wire up after one-shot generation ships.
