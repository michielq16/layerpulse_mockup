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

1. User lands on `/documents`. Top: 4 KPI cards (coverage, gen/30d, outdated, median gen time). Below: a 3-column generator with the most-recently-active model preselected.
2. **Step 1 — Pick a model** (left rail, 280px): user scans the model list, sees status pills (Current / Outdated / Never), clicks the target model. Filter chips at top (All / Outdated / Never) let them jump to "what needs regenerating?"
3. **Step 2 — Choose sections** (middle, flex): user picks an Audience preset (Auditor / New analyst / Executive / Engineer) — section toggles update automatically. They can adjust toggles; the preset banner flips to "Custom selection — N sections" with a "Reset to {audience}" affordance. Sections are grouped: Cover & summary / Schema / Logic / Lineage / Governance / Context. Counts beside each section show how many items will appear (e.g. "Measures · 42"). Below: format toggle (.docx default / .pdf / Markdown) + "Include partner logo" cover switch.
4. **Step 3 — Preview & download** (right, slightly wider): a Word-shaped paginated preview updates live with each toggle — cover band, title, audience subline, brand rule, numbered sections with item counts and visual content placeholders. Estimate strip below shows page count / size / generation time. Action row: `Share link` / `Schedule weekly` / `Generate .docx` (primary CTA, gradient).
5. If the selected model's status is `outdated` or `never`, an inline hint surfaces the reason ("Last generated 9d ago; model has changed — regenerate to refresh").
6. Below the generator: **Recently generated** library — the existing doc-list pattern, searchable, with View / Regenerate / Download row actions.

## Edge states

- **Empty state — no sections selected:** preview shows italic copy *"No sections selected. Pick at least one section in step 2 to see the document take shape."* CTA buttons go to `disabled` state. Estimate strip stays visible at 0/0.
- **First-time model (never generated):** info-tone hint card below the CTA: *"No prior document for this model. First generation will become the baseline."*
- **Outdated:** amber-tone hint: *"Last generated {N}d ago. Model has changed since — regenerate to refresh."*
- **No models match picker filter:** *"No models match."* in the picker list (small, italicized).
- **No library matches search:** *"No documents match. Generate one above to see it appear here."* — always actionable per the tone rules.
- **Permission-denied** (partner-of-record on customer with read-only seat): CTA disabled with tooltip *"Read-only access — ask {customer admin} to generate this doc."* (Wire-up depth: backend enforcement.)
- **Generation failure:** banner above the preview with the failure reason + retry button. (Out of scope for the mockup; real backend behavior.)

## Components used

- `StatCard` × 4 — emerald / sky / amber / violet, in the top KPI strip
- `lp-search` — picker search + library search (reuses pattern)
- `chip` / `chip-sm` — picker filter (All / Outdated / Never) with counts
- `doc-aud-tab` (new) — 2×2 grid of audience presets with active state
- `doc-section-grp` + `doc-section-row` (new) — checkbox rows grouped by section family
- `seg-tabs` — format selector (.docx / .pdf / Markdown)
- `doc-toggle` (new) — iOS-style switch for "Include partner logo"
- `doc-preview-card` + `doc-preview-page` (new) — Word-shaped preview chrome with paginated tabs + page chrome
- `btn-sm` + `doc-gen-cta` (new gradient) — Generate action
- `doc-list` + `doc-row` (existing) — recently-generated library row
- `doc-gen-hint` (new) — inline status hint (amber for outdated, info-blue for never)

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
