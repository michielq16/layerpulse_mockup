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

## Summary for the PO

| # | Candidate | Pillar | Proposed placement | Blocks which persona doc |
|---|---|---|---|---|
| 1 | Capacity-identity bridge | FinOps | **New Tier 1 row** (Phase A quick win) | BI Manager §04 capacity-SKU view; FinOps capacity view |
| 2 | Refresh error capture | Quality | **New Tier 2 row** | Engineer reliability §05 (root cause) |
| 3 | Dataflow consumer graph | Lineage/FinOps | **Fold into `lineage-explorer-pillar` / Axis-3** (not a new row) | FinOps wasted-spend §04 |

Accept = paste the proposed rows (1, 2) into the relevant Tier tables and append the scope note (3); assign final T-numbers (avoid colliding with the prior gap-audit candidates T2.17/T2.18/T3.13–15 from the 2026-05-28 session log). `/prd` can then author the implementation PRDs.
