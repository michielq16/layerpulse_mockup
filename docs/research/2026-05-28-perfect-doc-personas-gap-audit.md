# Perfect Document — Persona Series · Data Fit/Gap Audit

**Date:** 2026-05-28
**Companion to:** `public/review/perfect-doc/{index,bi-manager,engineer,governance,finops}.html`
**Purpose:** for every inline ⚠ Partial / ✗ Gap chip on the four prototype documents, name the underlying data gap and propose a backlog-ready Tier row for LP product planning.

---

## Summary

Across the four prototypes, **17 distinct data needs were touched**:

- ✅ **12 are live today** — read directly from existing LP collectors (Scanner introspection, Refreshables API, telemetry rollup, BPA engine v2, glossary, ownership tags, cost_observations_v2, activity_events, etc.)
- ⚠ **3 are partial** — signal exists but is heuristic or incomplete; producing the production-grade version needs minor extension
- ✗ **2 are full gaps** — need a new collector arm OR a new curated metadata table; not in scope today

The four documents are renderable today against current LP data **with caveats** noted inline. Production-grade renders require closing the 5 partial+gap items below. None are blocking; all are tractable.

---

## ✅ What we already have (no action needed)

| Signal | Source | Used in |
|---|---|---|
| Quality score (BPA-driven, ~20 rules) | T1.19 quality engine | BI Manager · Engineer · Governance · FinOps |
| Refresh SLA + failure history | Refreshables API + telemetry_rollup #330 | All four docs |
| Adoption (active users, queries/day) | activity_events + telemetry_rollup | All four docs |
| Per-capacity / workspace / model cost attribution | cost_observations_v2 (#357) | FinOps · BI Manager |
| Dormancy detection (90d / 180d windows) | telemetry_rollup #330 | FinOps · BI Manager |
| Ownership tags (Owner / SME / Steward / Domain) | T1.20 Ownership pillar | Governance · BI Manager |
| Glossary term coverage | T1.17 Business Glossary | Governance |
| Sensitivity labels (Power BI + Scanner-extracted) | Scanner getInfo | Governance |
| RLS evaluation results | T1.12 Audit pillar | Governance |
| Tenant settings + Export log + Off-hours access | T1.12 Audit pillar | Governance |
| Scanner full metadata (tables / columns / measures / relationships / DAX via TMDL) | Scanner getInfo + getDefinition (PR #300) | Engineer |
| VertiPaq per-column compressed memory | DMV `DISCOVER_STORAGE_TABLE_COLUMN_SEGMENTS` | Engineer |

All twelve signals above are production-grade and continuous. The four prototypes use them directly with no extension required.

---

## ⚠ Partial — needs minor extension (Tier 3 candidates)

### Gap-1 · Autoscale event correlation

**Today:** LP logs autoscale start/end via Metrics App DAX. **Cannot correlate to root cause** (was it a gateway recovery? a peak-load event? a stuck query?).

**Where it surfaces:** FinOps doc §06 — the "Justified?" column on the autoscale event table is currently heuristic. The doc surfaces the gap explicitly in a warn-callout.

**Proposed Tier row (T3.13 candidate):**

```
| T3.13 | **Autoscale event log + root-cause correlation**
        — extend Metrics App DAX ingestion with autoscale event metadata
        (trigger, source workspace, query backlog snapshot at event time).
        Joins to refresh_history + activity_events for root-cause inference.
        Unlocks: "Was this autoscale event justified?" answer on FinOps doc + Capacity Pulse.
        | docs/prd/autoscale-event-log.md *(to author)*
        | ~2-3 days
        | compare-vs-rest (autoscale events vs Metrics App raw)
        | None hard |
```

**Severity:** Medium · **Effort:** 2-3 days · **Auto-burn:** Yes, single collector extension

---

### Gap-2 · SKU efficiency + reserved-pricing comparator

**Today:** LP knows the customer's current SKU and CU usage. The "vs reserved-pricing comparator" — is the customer on the optimal commitment level? — is currently heuristic (33% default Azure discount assumption).

**Where it surfaces:** FinOps doc §07 — the partial chip on the SKU Efficiency section. The doc surfaces this in the "Heuristic" inline note.

**Proposed Tier row (T3.14 candidate):**

```
| T3.14 | **Azure Pricing API ingest for SKU efficiency**
        — daily snapshot of Fabric SKU pricing (PAYG vs 1yr-reserved vs 3yr-reserved
        per region) into LP DB. Joins with customer's current SKU + reserved-commit
        metadata (from billing) to compute defensible savings/loss against alternatives.
        Unlocks: precise "you'd save €X by moving to a 3-year reservation" answer.
        | docs/prd/azure-pricing-api-ingest.md *(to author)*
        | ~3 days
        | compare-vs-fixture (snapshot vs Azure Pricing API)
        | None hard |
```

**Severity:** Medium · **Effort:** 3 days · **Auto-burn:** Yes

---

### Gap-3 · Business-unit tag per workspace

**Today:** LP has workspace metadata (name, env, environment classification). Does NOT have a `business_unit` tag — used in the BI Manager doc to show "business impact" rollups.

**Where it surfaces:** BI Manager doc §05 — partial chip; doc currently maps workspace → business unit via heuristic on workspace name.

**Proposed Tier row (T3.15 candidate):**

```
| T3.15 | **Business-unit tag on workspaces**
        — manually-curatable tag layer on the workspaces table.
        Defaults heuristically from naming convention; operator can override
        in Settings page. Used by BI Manager doc + future portfolio rollup views.
        | docs/prd/workspace-business-unit-tag.md *(to author)*
        | ~1.5 days (schema + UI + Settings page hook)
        | vitest + e2e-screenshot-diff
        | None hard |
```

**Severity:** Low · **Effort:** 1.5 days · **Auto-burn:** Yes (no schema risk)

---

## ✗ Gap — needs a new collector / curated table (Tier 2 candidates)

### Gap-4 · Per-measure DAX query-cost ranking

**Today:** Engineer doc §06 ranks measures by "inferred query cost" using heuristics (BPA rule violations + measure complexity score). The actual per-measure compute cost requires query-trace capture.

**Where it surfaces:** Engineer doc §06 — the partial chip ("Per-measure query-cost ranking heuristic until query-trace ingestion").

**Proposed Tier row (T2.17 candidate):**

```
| T2.17 | **DAX query-trace ingestion arm**
        — add a Profiler/DAX-Studio-equivalent query trace collector
        (via DiagnosticEvents or Reading XEvents) to capture per-query
        Storage Engine time + Formula Engine time + measure-level
        attribution. Aggregated into per-measure cost ranking.
        Unlocks production-grade Engineer doc DAX optimization ranking.
        | docs/prd/dax-query-trace-ingestion.md *(to author)*
        | ~7-10 days (collector + storage + aggregation pipeline)
        | compare-vs-fixture (captured traces vs known measure latencies)
        | Tabular Editor / DAX-Studio query-trace patterns |
```

**Severity:** High (Engineer doc claims become defensible) · **Effort:** 7-10 days · **Auto-burn:** No — schema_change hard-stop (supervised /build-feature)

---

### Gap-5 · Regulatory framework clause mapping

**Today:** Governance doc §09 maps Acme's internal policies (POL-001 to POL-018) to ISO 27001 / SOC 2 / GDPR clauses. This mapping is **hand-curated** — no source-of-truth table exists in LP.

**Where it surfaces:** Governance doc §09 — gap chip ("Curated mapping table — pending T1.20 + a new regulatory_clause_map table").

**Proposed Tier row (T2.18 candidate):**

```
| T2.18 | **Regulatory clause mapping registry**
        — new `regulatory_clause_map` table + curated content for the major
        frameworks (ISO 27001, SOC 2 Type I+II, GDPR, HIPAA-light, NIS2).
        Each LP policy rule (and external customer-defined policy) maps to N
        regulatory clauses. Unlocks Governance doc §09 ("how do you prove
        control X is enforced?" answers) and audit pull-through.
        | docs/prd/regulatory-clause-mapping.md *(to author)*
        | ~5 days (schema + curation + UI for customer-defined policies)
        | vitest (mapping integrity tests) + e2e (Governance doc render)
        | None hard (LP DB + curated content) |
```

**Severity:** Medium · **Effort:** 5 days · **Auto-burn:** No — content curation requires Data Office review

---

## Summary table

| ID | Title | Tier | Effort | Severity | Auto-burn? |
|---|---|---|---|---|---|
| T3.13 | Autoscale event log + correlation | T3 | 2-3d | Medium | ✅ Yes |
| T3.14 | Azure Pricing API ingest (SKU efficiency) | T3 | 3d | Medium | ✅ Yes |
| T3.15 | Business-unit tag on workspaces | T3 | 1.5d | Low | ✅ Yes |
| T2.17 | DAX query-trace ingestion arm | T2 | 7-10d | **High** | ❌ Supervised |
| T2.18 | Regulatory clause mapping registry | T2 | 5d | Medium | ❌ Supervised |

**Total to close all gaps:** ~18-22 days of LP engineering effort. Three of the five are auto-burn-eligible polish; two are supervised /build-feature cycles (schema or content-curation hard-stops).

---

## Where this lands in the value roadmap

The four prototypes demonstrate that the **Perfect Document persona series is structurally achievable today**. The five gaps above are refinements, not blockers — even with all five open, the documents render as production deliverables with the inline ⚠/✗ chips making the data caveats explicit.

**Recommended sequencing:**

1. **Ship the persona-series engine** as an evolution of T1.18 Perfect Document (architecture: one engine, four renderers vs. one render with audience filters). Prototypes already shipped to the review hub validate the design language; the engine swap is the next step.
2. **Close Gap-1, Gap-3** (T3.13, T3.15) in the next polish-budget window — both are auto-burnable, ~3.5 days combined.
3. **Slot Gap-4** (T2.17 DAX query-trace) into Tier 2 — biggest unlock for the Engineer document, but requires supervised /build-feature for the new collector.
4. **Defer Gap-2, Gap-5** (T3.14, T2.18) to FY27 polish — useful but not load-bearing for the prototype's defensibility.

---

## Companion artifacts

- Hub: https://layerpulze-mockup.vercel.app/review/perfect-doc/
- BI Manager doc: https://layerpulze-mockup.vercel.app/review/perfect-doc/bi-manager.html
- Engineer doc: https://layerpulze-mockup.vercel.app/review/perfect-doc/engineer.html
- Governance doc: https://layerpulze-mockup.vercel.app/review/perfect-doc/governance.html
- FinOps doc: https://layerpulze-mockup.vercel.app/review/perfect-doc/finops.html
