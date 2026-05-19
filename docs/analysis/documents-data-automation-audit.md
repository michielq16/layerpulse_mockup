# Documents — data-automation audit

**Date:** 2026-05-19
**Trigger:** Operator question after C2d preview modal landed — "for owners and stewards, business glossary, metric glossary — we don't have this data automation. it's manual data we add via LP forms (like license-cost). Do an analysis: what's automated vs. manual."
**Scope:** Every data field rendered by `DocumentPreviewModal` (`src/NewPages.jsx`) across all 4 audience variants.
**Outcome:** Three classifications per field + a list of new LP forms/screens to build for the **MANUAL** bucket.

---

## Classification taxonomy

- **AUTO** — derivable directly from a Fabric API or LP collector arm. No human input.
- **DERIVED** — LP computes it from other AUTO data (joins, parsing, heuristics). No human input either, but cost lives in LP's compute, not in the source.
- **MANUAL** — no Fabric API surface; the field is a business judgement. Must be captured via an LP functional screen.

Some fields are **HYBRID** — Fabric exposes them *if the modeler chose to set them*, but in practice they're empty. LP either lets users fill the gaps or accepts blanks.

---

## Per-field audit

### Cover page

| Field | Class | Source |
|---|---|---|
| Brand line (`LayerPulse · {tenant}`) | AUTO | LP brand + workspace `tenant_name` |
| Model name | AUTO | Scanner `getInfo` |
| Workspace | AUTO | `admin/groups` |
| Environment (PROD/UAT/DEV) | DERIVED | Heuristic from workspace naming. CLAUDE.md anti-pattern says "don't let users label this" — inferred. |
| Generated timestamp | AUTO | LP doc-gen metadata |
| Doc version | AUTO | LP doc-gen metadata |
| **Owner (first)** | **MANUAL** | ⚠️ Not in Fabric metadata. See *Owners* section below. |
| Source label ("MS Fabric · PBI semantic model") | AUTO | Constant |

### Executive summary

| Field | Class | Source |
|---|---|---|
| Narrative paragraph | DERIVED | Template + variable injection |
| KPI · Tables count | AUTO | Scanner `getInfo` |
| KPI · Total rows | AUTO | Scanner `getInfo` (table-level row counts) OR Capacity Metrics App DMV |
| KPI · Measures count | AUTO | Scanner / TMDL `measures[]` |
| KPI · Active relationships | AUTO | Scanner / TMDL `relationships[]` w/ `isActive` |
| KPI · RLS rules | AUTO | Scanner `getInfo` → `roles[].tablePermissions[]` |
| KPI · Downstream reports | AUTO | Scanner reports endpoint joined to `datasetId` |

### Tables overview

| Field | Class | Source |
|---|---|---|
| Table name | AUTO | Scanner |
| Kind (fact/dim) | DERIVED | Heuristic from naming (`Fact*` / `Dim*` prefix) + cardinality. **NOT** a Fabric concept. Fallback: largest-table = fact, others = dim. |
| Row count | AUTO | Scanner / DMV |
| Column count | AUTO | Scanner |
| Partition spec | AUTO | Scanner `getInfo` `partitions[]` |

### Columns + data types

| Field | Class | Source |
|---|---|---|
| Column name | AUTO | Scanner |
| Data type | AUTO | Scanner |
| Role (PK / FK / attr / fact) | DERIVED | LP infers from relationship graph: column on the 1-side = PK, many-side endpoints = FK, columns with `summarizeBy ≠ none` = fact, residual = attr |
| **Description** | **HYBRID / MANUAL** | TOM `column.description` *if author set it in Tabular Editor / PBI Desktop*. In practice ~10-20% populated. LP form fills the gaps. |

### Relationships

| Field | Class | Source |
|---|---|---|
| From / To | AUTO | Scanner |
| Cardinality | AUTO | Scanner |
| Cross-filter direction | AUTO | Scanner |
| Active flag | AUTO | Scanner |

### Measures

| Field | Class | Source |
|---|---|---|
| Name | AUTO | Scanner / TMDL |
| Folder | AUTO | TMDL `displayFolder` |
| Format string | AUTO | TMDL `formatString` |
| **Description** | **HYBRID / MANUAL** | TOM `measure.description` if set. In practice ~5-15% populated. LP form fills the gaps. |
| DAX expression | AUTO | Scanner `getInfo` `expression` / TMDL `definition` |
| Depends-on (column + measure refs) | DERIVED | LP parses DAX AST (referenced columns + measures) |

### RLS rules

| Field | Class | Source |
|---|---|---|
| Rule name | AUTO | Scanner `roles[].name` |
| Table | AUTO | Scanner `roles[].tablePermissions[].name` |
| Filter (DAX) | AUTO | Scanner `roles[].tablePermissions[].filterExpression` |
| Members (AAD groups) | AUTO | Admin API (`/admin/groups/{id}/users` for direct, Graph API for group expansion) |

### Sensitivity labels

| Field | Class | Source |
|---|---|---|
| Table / column / label name | AUTO | Scanner exposes column-level `sensitivityLabel` |

### Governance findings

| Field | Class | Source |
|---|---|---|
| Severity / title / detail / recommendation | DERIVED | LP rules engine evaluates the model + tenant settings against best-practice checks. All 3 findings in the mockup (missing sensitivity, inactive rels, calc-col bloat) are computable from Scanner + tenant settings — no manual input. |

### Owners & stewards ⚠️ THIS IS THE OPERATOR'S MAIN POINT

| Field | Class | Source |
|---|---|---|
| Name | HYBRID | Scanner returns dataset `permissions[]` and workspace-role users. Names AUTO for those people. But which person is "the Data lead" vs "Backup owner" — that's the role assignment. |
| **Role label** ("Data lead", "BI steward", "Backup owner", "Source DBA") | **MANUAL** | Pure business mapping. LP needs an `/owners` form per model OR per workspace. |
| Email | AUTO | AAD / Graph (from the workspace member list) |
| Last-touched | AUTO | activity_events × user → MAX(timestamp) per user per model |

### Lineage — upstream

| Field | Class | Source |
|---|---|---|
| Source item name | AUTO | Scanner lineage / `admin/datasets/{id}/datasources` |
| Kind (Lakehouse / Dataflow Gen2 / SQL endpoint / CSV / Static) | AUTO | Scanner classifies source type |
| **Layer (Bronze / Silver / Gold)** | DERIVED | Medallion is not in Fabric metadata. LP heuristic: naming suffixes (`*_raw` → Bronze, `*_curated` → Silver, `*_gold` → Gold). **No LP form** — CLAUDE.md anti-pattern (env classification is the precedent). Misclassifications get reported and the heuristic improves. |
| Refresh cadence | AUTO | Refreshables endpoint + Capacity Metrics App |

### Lineage — downstream

| Field | Class | Source |
|---|---|---|
| Item name | AUTO | Scanner reports/apps endpoints joined on `datasetId` |
| Kind (Report / Paginated / App) | AUTO | Scanner |
| Workspace | AUTO | `admin/groups` |
| 30d viewers | AUTO | activity_events aggregated (`ViewReport`-class events) |
| Last view | AUTO | activity_events latest |

### Change log

| Field | Class | Source |
|---|---|---|
| Date | AUTO | activity_events timestamps (`UpdateDataset`, `EditDataset`, `EditModel`-class events) |
| By (user UPN) | AUTO | activity_events.user_principal_name |
| **Change description ("Added measure [Net Revenue Retention %]")** | **HYBRID** | LP can detect *what* changed by diffing consecutive Scanner snapshots (new measure / renamed / new column / new RLS rule). Output is auto-generated and terse. Optional MANUAL annotation overlay if the operator wants narrative context ("audit team asked for this"). |

### Business glossary ⚠️ FULLY MANUAL

| Field | Class | Source |
|---|---|---|
| Term | MANUAL | No Fabric API has a business-term store at the model level. (Microsoft Purview Glossary is a separate product — also manual entry — and not assumed.) |
| Definition | MANUAL | Same |
| Owner of term | MANUAL | Same (could default to model owner) |
| Scope (all models / specific models) | MANUAL | Same |

### ER diagram

| Field | Class | Source |
|---|---|---|
| Tables + positions | DERIVED | Auto-layout (force-directed or hierarchical) over the relationships graph |

### Calc columns (engineer page)

| Field | Class | Source |
|---|---|---|
| Table / Column / Type | AUTO | Scanner |
| **Approx storage** | AUTO | DMV `$SYSTEM.DISCOVER_STORAGE_TABLE_COLUMN_SEGMENTS` (LP already runs DMV queries against Metrics App workspace — this is a pattern extension, not a new arm) |

---

## Summary — what's MANUAL

Five surfaces need LP functional screens (forms) to capture data that no Fabric API exposes:

| # | Surface | Scope | Recommended form location | Storage shape |
|---|---|---|---|---|
| 1 | **Owners & stewards** — role labels | Per model OR per workspace (operator decision) | New tab `/models/[id]/ownership` (or sub-section of governance). Auto-populate name + email from AAD/workspace members; user assigns role. | `model_owners(model_id, user_email, role_label, assigned_at, assigned_by)` |
| 2 | **Business glossary** | Tenant-wide w/ optional model-scoping | New top-level route `/glossary` (sibling to `/governance`) | `business_terms(id, term, definition, owner_email, scope_model_ids[], updated_at)` |
| 3 | **Column descriptions** (gap-fill) | Per column | Inline-edit on `/models/[id]/overview` (table-by-table; only "fill the gaps" UX) | `column_annotations(model_id, table, column, description, edited_by, edited_at)` |
| 4 | **Measure descriptions** (gap-fill) | Per measure | Inline-edit on `/models/[id]/measures` | `measure_annotations(model_id, measure_name, description, edited_by, edited_at)` |
| 5 | **Change log narrative overlay** | Per change event | Inline annotation on `/models/[id]/changelog` (if we add the route) | `changelog_annotations(event_id, narrative, added_by, added_at)` |

License-cost pattern (already in LP at `/settings → Pricing → License pricing`) is the template — small form, stored centrally, joined into reports/exports.

## Things NOT to build a form for (despite tempting)

- **Medallion lineage layer (Bronze/Silver/Gold)** — heuristic from naming. CLAUDE.md anti-pattern: "Settings UIs for things LP infers." Same precedent as env classification (PROD/UAT/DEV).
- **Table kind (fact/dim)** — heuristic from naming + cardinality. Same anti-pattern.
- **Column roles (PK/FK)** — derived from relationship graph, not a user judgement.
- **Governance findings** — rules engine output, not human input.
- **DAX dependency map** — DAX AST parse, automated.

## Priority — what to build first

If we ship one manual surface, ship **#1 Owners & stewards**. Reasoning:
- Highest signal-to-effort: it's a 4-field form per model, ~30 min UX, immediate value
- Lights up every audience render (Auditor / Analyst — both surface Owners)
- Cleanly answers "who do I call when this model breaks" which is partner-portfolio value
- Sets the pattern for #2 (Glossary) which is more open-ended

Glossary (#2) is a Tier-1 follow-up — broader scope, higher payoff for analyst onboarding docs.

Descriptions gap-fill (#3, #4) are Tier-2 — high effort per-record, low engagement from busy data teams. May be better solved with LLM-suggest + user-approve than freeform forms.

Change-log narrative (#5) is Tier-3 — nice-to-have, ship after we see organic demand.

## Impact on the C2d Documents PR

The PR (#3) is fine as-is for the design-phase mockup. When the LP back-end implements rendering:

- Replace `DATA.documents.sample` body fixtures with a per-model API response.
- Sections backed by MANUAL data (Owners, Glossary) gracefully degrade to "Not yet documented — add via /ownership / /glossary →" copy when the LP DB has no rows. The mockup shows fully-populated state; production will show that empty state until the forms ship.
- Auditor render's "Owners + sign-off" page is the single highest-leverage section that depends on a manual surface. Owners form is therefore a prerequisite for the auditor variant feeling complete in production.

## Open questions for the operator

1. **Owners form scope:** per model (every model has its own owner list) or per workspace (one owner list scoped to all models in the workspace)? Recommend per workspace w/ per-model override — most teams own all models in their workspace.
2. **Glossary scope:** tenant-wide single dictionary, or per-workspace dictionaries, or per-model? Recommend tenant-wide w/ scope filters.
3. **Auto-suggest descriptions via LLM?** A "Generate description" button per column/measure that calls an LLM with the model + column/measure context. Faster than empty form, slower than full-auto. Off by default; opt-in feature.
