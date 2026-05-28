# Proposed LP BACKLOG.md Tier rows — from the 2026-05-28 SBM production-DB audit

**Status:** PROPOSAL. The mockup offers; the PO accepts into `../layerpulse/docs/BACKLOG.md`. Do **not** write the LP backlog directly.
**Origin:** read-only audit of the SBM production tenant while grounding the Perfect-Document persona series. Each candidate is a real product gap that blocks a persona doc from being production-grade. Full evidence: `docs/research/2026-05-28-production-db-content-map.md`. Dedup-checked against BACKLOG.md (559 lines) on 2026-05-28.
**Row format** (Tier 1): `| # | Title | Source | Estimate | Validation plan | Dependency |`

---

## Candidate 1 — Capacity-identity bridge (`workspaces.capacity_id` + 3-space reconciliation)

- **Pillar:** FinOps (cost attribution / H2).
- **Recommended tier:** **Tier 1** (data-integrity bug + unblocks capacity/SKU cost views). Has a quick-win Phase A.
- **Dedup:** no existing row covers this. Related but distinct: T1.16 telemetry rollup (shipped), H2 cost-attribution.
- **Why it matters:** cost is computed and attributable to *workspace* today (via `item_metadata`, 99.7%), but **not to a capacity SKU** — `workspaces.capacity_id` is NULL ×511 and three disjoint capacity-ID spaces aren't reconciled. Blocks the capacity-level cost view + clean `capacities`↔cost join.
- **Detailed handover already written:** `docs/handover/2026-05-28-sbm-capacity-link-fix.md`.

> **Proposed row:**
> `| T1.x | **Capacity-identity bridge — populate `workspaces.capacity_id` + reconcile 3 capacity-ID spaces** — scanner drops `g.capacityId` at `introspection.ts:160` (0/511 populated); cost tables key on Metrics-App capacity GUID, disjoint from the `capacities` dimension (Admin GUID) and LP-internal id. **Phase A** (quick win): map `g.capacityId` on all workspace insert paths. **Phase B**: reconcile Metrics-App ↔ Admin capacity identity for capacity/SKU cost rollups. Per-workspace cost already works via `item_metadata` (not blocked). **Supervised — touches collectors, likely a migration.** | docs/handover/2026-05-28-sbm-capacity-link-fix.md (mockup audit) | Phase A ~0.5d · Phase B ~2–3d | `compare-vs-rest` (workspace capacity_id matches Admin `/admin/groups`) + cost-by-capacity query returns rows | T1.16 (shipped) |`

---

## Candidate 2 — Refresh error capture (`serviceExceptionJson` → why refreshes fail)

- **Pillar:** Semantic Model Quality / reliability.
- **Recommended tier:** **Tier 2** (enhancement to the existing refreshables collector; turns the reliability diagnostic from symptom to work-order).
- **Dedup:** no existing row. `T2.3.b validate:refreshables` (shipped) is a validator, not error capture — distinct.
- **Why it matters:** LP records *which* dataset failed and *how often* (`refreshables`), but **not why** — no error field on the real table, and `refresh_events.error_message` is a dev fixture (104 rows, all "credentials expired (dev fixture)", 17 models). SBM has a chronic 32.7% refresh-fail rate with no captured root cause. The Fabric Refreshables API returns a `serviceExceptionJson` / error payload on failures.

> **Proposed row:**
> `| T2.x | **Capture refresh failure reason (`serviceExceptionJson`)** — persist the error payload from the Fabric Refreshables API onto `refreshables` (new column) or populate `refresh_events` from real data (currently a dev fixture). Turns the Refresh Reliability diagnostic from "674 datasets failing" into "failing for these N error classes". | docs/perfect-doc/engineer-reliability-v1.html §05 (mockup audit) | ~1–2d (collector + 1 migration) | `vitest` (error-payload parse) + spot-check error_class distribution on SBM | refreshables collector (shipped) |`

---

## Candidate 3 — Dataflow consumer graph (orphan-ETL detection) — **FOLD into existing lineage work, not a new row**

- **Pillar:** Lineage + FinOps (orphan detection).
- **Recommended action:** **scope addition** to the existing **`lineage-explorer-pillar`** PRD (referenced by T1.3b) and/or the Pillar-roadmap **Axis-3 orphan-detection / `fabric_items`** plan (BACKLOG.md lines 281, 299) — **not** a duplicate new Tier row.
- **Dedup:** partially covered. T1.9 (`fabric_dataflows` axis) catalogs dataflows; the Axis-3 plan targets never-run/orphan *item* detection via the Admin/Scanner API; `lineage-explorer-pillar` owns the graph. The **specific gap** is the `dataflow → dataset → report` *consumer edge* needed to call a dataflow orphaned.
- **Why it matters:** the FinOps wasted-spend doc found ~$1.25K/mo on 142 dataflows with no observable consumer — but dataflows emit no view events by design, so "orphan vs feeding-an-active-model" is undecidable without the consumer edge. Highest-leverage FinOps unlock, but only if it lands inside the lineage graph rather than as a standalone.

> **Proposed scope note (append to `lineage-explorer-pillar` PRD or the Axis-3 design note):**
> "Add a `dataflow → dataset → report` consumer-edge derivation (from M-code / `data_sources` already parsed) so FinOps can confirm orphan ETL. Evidence: ~$1.25K/mo on 142 unconsumed-looking dataflows at SBM (mockup audit `docs/perfect-doc/finops-wasted-spend-v1.html` §04). Without the edge, dataflow waste is unmeasurable."

---

## Candidate 4 — Capacity Pulse KPI fidelity (latest-hour artifacts + uncaptured throttling + utilization-scaled cost + SKU label)

- **Pillar:** FinOps (capacity).
- **Recommended tier:** **Tier 2** — correctness on a *shipped* screen (Capacity Pulse). Sub-items 2 + 3 are higher severity (false "healthy" + overstated cost = trust risk for the Pro→Enterprise sales motion).
- **Dedup:** no existing row. Capacity Pulse is shipped; these are fidelity bugs, not new scope.
- **Why it matters:** for SBM `SBM Offshore Power BI - SND`, the page's four headline KPIs contradict its own chart and/or misreport. Grounded against `time_points` (read-only, 2026-05-29): 147 hourly readings, avg **349%** CU, peak **1,043%**, 132/147 over 100%.

Four distinct issues:
1. **CU% headline reads the latest single hour, not the period.** Shows "0% healthy" — that's the `2026-05-28 02:00` partial/empty hour (`cu_total=0`) — while the chart right above shows avg 349% / peak 1,043%. Fix: headline = period avg or peak (`computeDailyMaxSeries`/avg already exist in `capacity-pulse-helpers.ts`).
2. **Throttling = 0 and Overage = 0 min because the data is never captured.** `time_points.throttle_state` is **NULL** and `overage_minutes` **NULL** across all 1,135 SND rows. At sustained 349% on a P1, real throttling/overage is near-certain — so "0 / none" reads as false health. Capture both from the Metrics-App DAX (Throttling/Overages timepoint measures).
3. **Daily cost is utilization-scaled, overstating a fixed bill.** `latestDailyCost = (avg_cu_pct/100) × (monthly_cost / days_in_month)` (`capacity-pulse-helpers.ts:132`). For SND: 197.03% × ($5,000/31) = **$317.79** — but Premium P1 is a **fixed $5,000/mo = $161.29/day**; cost does not scale with utilization. Overstates whenever CU%>100% (≈always here; up to ~10× at peak), contradicts the `cost_observations_v2` share-of-bill model, and is keyed on the latest *partial* day (3 hours incl. a 0). Fix: fixed daily = `monthly_cost / days_in_month`, or relabel explicitly as a utilization-weighted estimate.
4. **SKU badge wrong.** Page shows **F8**; `capacity_snapshots` says **P1** (8 v-cores, 25 GB). Both have base_cu 8 → likely a CU→F-SKU mislabel.

> **Proposed row:**
> `| T2.x | **Capacity Pulse KPI fidelity** — (1) CU% headline reads the latest (often empty) hour, not period avg/peak (shows 0% over a 349%-avg week); (2) Throttling/Overage KPIs read 0 because `time_points.throttle_state` + `overage_minutes` are NULL — uncaptured from the Metrics App → false "healthy"; (3) daily cost is utilization-scaled (`avg_cu_pct × monthly/days`) → overstates the fixed Premium bill (P1 $5k/mo = $161/day rendered as $317.79); (4) SKU badge "F8" but capacity is P1. | mockup grounding 2026-05-29 + `time_points` spike | ~2–3d (Metrics-App DAX capture is the bulk) | `compare-vs-rest` vs Metrics-App Throttling/Overages page + cu_pct shape match | capacity-pulse collector + `capacity-pulse-helpers.ts` |`

---

## Summary for the PO

| # | Candidate | Pillar | Proposed placement | Blocks which persona doc |
|---|---|---|---|---|
| 1 | Capacity-identity bridge | FinOps | **New Tier 1 row** (Phase A quick win) | BI Manager §04 capacity-SKU view; FinOps capacity view |
| 2 | Refresh error capture | Quality | **New Tier 2 row** | Engineer reliability §05 (root cause) |
| 3 | Dataflow consumer graph | Lineage/FinOps | **Fold into `lineage-explorer-pillar` / Axis-3** (not a new row) | FinOps wasted-spend §04 |
| 4 | Capacity Pulse KPI fidelity | FinOps | **New Tier 2 row** | Capacity Pulse trust (CU% / throttle / cost / SKU) |

Accept = paste the proposed rows (1, 2) into the relevant Tier tables and append the scope note (3); assign final T-numbers (avoid colliding with the prior gap-audit candidates T2.17/T2.18/T3.13–15 from the 2026-05-28 session log). `/prd` can then author the implementation PRDs.
