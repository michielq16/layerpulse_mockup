# Screen: Business glossary — tenant-wide single dictionary

**Pillar:** Governance & Compliance (also feeds Semantic Model Quality — Documents modal renders the glossary for Analyst/Executive audiences)
**Persona:** Both — partner (per-customer glossary), direct customer (their own)
**Value-loop quadrant:** Ingest (manual entry — stewards write, LP joins downstream)
**Decision the user makes:** "What does this term *officially* mean here? What measures use it? Who do I ask?"
**Data joins required:** None upstream. Glossary is the upstream, joined into Documents · Measures · Lineage downstream.
**Sample data:** `DATA.glossary` in `src/data.jsx` — 13 terms across 7 domains · 4 statuses · 4 sensitivities · 6 types.

## Why this exists

Fabric exposes column types, table names, and DAX expressions. It does NOT expose:
- What "AOV" means in *this* business (industry-specific)
- Whether the agreed definition is "approved", "proposed", or "deprecated"
- Who's accountable for the definition (steward) and who can answer questions (SME)
- Where the canonical policy doc lives (URL to wiki/runbook)

This is what every analyst onboarding doc and every QBR slide reuses. Today: scattered across Confluence, Notion, individual Power BI tooltips, Slack threads. LP centralizes it.

Shape follows **DAMA-DMBOK** conventions and matches the metadata that Atlan / Collibra / Alation provide — but tuned for the Fabric stack (links to semantic models, not arbitrary catalog entries).

## Happy path

1. User lands on `/glossary`. Header: title + sub + `+ Add term` CTA.
2. **5-KPI strip:** Total terms · Approved · Proposed · Review overdue · Orphan terms (no model linked).
3. **Two-pane layout:** left filter rail (sticky) + right term grid.
4. **Filter rail (sticky, 240px):**
   - Search box (full-width)
   - **Type** group — All · Business term · Metric · KPI · Dimension · Acronym · Process (each w/ count + tone-tinted active state)
   - **Domain** group — All · Finance · Sales · Marketing · Operations · HR · Product · Compliance
   - **Status** group — All · Approved · Proposed · Under review · Deprecated
   - **Sensitivity** group — All · Public · Internal · Confidential · Restricted
   - **Owner** group — `<select>` of all owner names
5. **Grid (right pane):**
   - Section head: result count + sort dropdown (Alphabetical / Recently reviewed / Review due first / Status)
   - Auto-fill grid of term cards (min 320px). Each card:
     - **Term name** (big, bold) + **type pill** (tone-tinted) — head row
     - **Status pill** (right of head)
     - 3-line clamped definition
     - Meta row: domain · sensitivity · owner · linked-count · **overdue flag** (if past next-review date)
   - Click anywhere on card → detail drawer.
6. **Add term CTA** opens drawer in form mode.

## Drawer — detail / edit / add

Right-side drawer (680px — wider than ownership drawer for the field grid). Sticky head + body + foot.

**Detail view (read-only):**
- Title block: term · type pill · status pill · sub-line (domain · sensitivity · last reviewed)
- Edit button (toggle) + Close
- **Definition** block (full text, line-height 1.55)
- **2-column meta grid:** Owner · SME · Source · Business process URL (clickable) · Last reviewed · Next review
- **Synonyms** chip row
- **Related terms** chip row — links navigate to that term's drawer (no close/reopen)
- **Linked to** block — model chips (emerald) + measure chips (violet, monospace name)

**Edit / Add view (form):**
- Term · Definition (textarea) · Type · Domain · Status (defaults to Proposed for new) · Sensitivity · Owner · SME · Source · Business process URL · Synonyms (CSV) · Related terms (CSV) · Review cadence

## Edge states

- **No matches:** "No terms match. Clear filters or add the first term."
- **Review overdue card:** rose `overdue` flag in meta row + tone applied to next-review field in drawer
- **Deprecated term:** slate status pill, definition typically starts with `[DEPRECATED YYYY-MM]` + redirect note
- **Orphan term (no linked models/measures):** drawer shows "No model or measure references this term yet. Map manually →" link
- **Related-term broken link:** when a related-term name doesn't match any glossary term, it renders as a plain chip (not a clickable link)
- **ESC / backdrop:** closes drawer

## Components used

- `StatCard` × 5 — KPI strip
- `lp-grid-5` — KPI grid
- `gloss-shell` (new) — 240px rail + main grid layout
- `gloss-rail` (new) — sticky filter rail
- `gloss-rail-search`, `gloss-rail-group`, `gloss-rail-chips`, `gloss-rail-chip` (new) — rail atoms
- `gloss-grid` (new) — responsive card grid (auto-fill, min 320px)
- `gloss-card` (new) — term card w/ hover lift
- `gloss-type-pill` (new) — type badge (6 tones: sky/violet/amber/emerald/rose/slate)
- `gloss-status` (new) — status pill (emerald/sky/amber/slate)
- `gloss-card-overdue` (new) — rose flag
- `own-drawer-backdrop` + `gloss-drawer` (reused/new) — wide drawer shell
- `gloss-field` + `gloss-field-label` + `gloss-field-body` (new) — drawer form atoms
- `gloss-drawer-grid` (new) — 2-column meta grid
- `gloss-person` (new) — avatar + name + email
- `gloss-chip-row` + `gloss-chip` (+ `chip-link`, `chip-model`, `chip-measure` variants — new) — for synonyms, related terms, linked models/measures

## Metrics surfaced

- Total terms · Approved · Proposed · Review overdue · Orphan terms (no model link)
- Per-card: linked-count · review-overdue flag

## Benefit hypothesis

- **Within 60 days:** analyst onboarding time drops by 50% — new hires read the glossary once instead of asking 20 stewards 20 questions over 4 weeks.
- **Documents modal** Analyst + Executive renders show a meaningful glossary section (not just LCY/AOV/NRR/FY/Segment) once stewards populate to ~50 terms.
- **Auditor preset** can cite the glossary as the canonical definition source for any measure → SOC 2 evidence pack becomes self-documenting.
- **Tertiary:** Slack #data-questions volume drops because the term has an authoritative URL.

## Open questions / future iterations

- **Purview import** — pull terms from Microsoft Purview Glossary if customer uses it. Tier 2.
- **Tagging** — folksonomy alongside the controlled domain vocabulary. Defer; controlled domains cover 90%.
- **Versioning** — keep N versions of a definition, with a "latest approved" pointer. Defer; the change-log audit pattern from Ownership might suffice for low-volume edits.
- **Bulk import (CSV)** — when migrating an existing glossary. Tier 2.
- **Review queue** — list of all overdue terms, batch-assign-reviewer action. Tier 2.
- **Inline suggest while typing in a measure description** — when an analyst writes a description on `/models/[id]/measures`, suggest a glossary term to link. Q3+ (touches LLM territory the operator parked).

## Notes for LP-side PRD authoring

- Storage shape: `business_terms(id, term, definition, type, domain, status, sensitivity, owner_email, sme_email, source, process_url, synonyms[], related[], last_reviewed_at, next_review_at, created_at, created_by)` + `term_model_links(term_id, model_id, link_kind)` + `term_measure_links(term_id, model_id, measure_name)`.
- `synonyms` and `related` are arrays of strings, not foreign keys. Strings allow loose-coupling to terms that don't exist yet; LP renders them as plain chips until the related term is created.
- Type, domain, status, sensitivity are controlled vocabularies — keep them in separate tables to allow append-only growth without code changes.
- The `next_review_at` field is the ops anchor — daily cron flags overdue terms and writes to `/alerts` if a steward has >3 overdue.
- Linking strategy: measures are referenced by `model_id + measure_name` (composite), not by surrogate key — measure names are stable in DAX and the auto-generated documentation can find them. Models referenced by surrogate `model_id`.
