# Handover — SBM capacity attribution: the `capacities` dimension is built from the wrong source

**To:** an engineering agent in the **LayerPulse product repo** (`../layerpulse`, the real Next.js/Drizzle app — *not* the mockup).
**From:** mockup-designer session; **corrected + evidenced 2026-05-29** after a read-only prod spike (env SBM Production).
**Type:** data-integrity / collector + dimension-sourcing bug. Supervised → `/build-feature` (multi-file, migration-likely; never commit to main directly).
**Status:** ⚠️ **This supersedes the original 2026-05-28 diagnosis.** The original headline ("scanner drops `g.capacityId` — just map it") is a **dead end** — see "Why the original fix is wrong" below. Spike the evidence section against the live Metrics App before writing code.

---

## TL;DR (corrected)

For **SBM Production** (`a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3`, managed by QaaS Consultancy B.V.):

- The customer runs **2 paid Power BI Premium P1 capacities** — `SBM Offshore Power BI - SND` and `SBM Offshore Power BI - PRD` — at **$5,000/mo EACH ($10,000/mo total)**, plus trial + PPU licenses that carry no CU cost.
- **The cost chain is correct and reconciles to ground truth:** `cost_observations_v2` = exactly **$10,000/day run-rate** across the 2 capacities (verified). Per-workspace rollup works today via `item_metadata.workspace_name`.
- **The break is the `capacities`/`workspaces` dimension.** It is populated from the **Power BI Admin API**, which — under the enumerating identity — sees **only the trial (3× FTL64) + PPU (PP3) capacities**, and **NOT the two billable P1 capacities at all**. So:
  1. `workspaces.capacity_id` is **NULL for all 511** workspaces → the Workspaces "Capacity" filter returns **0** (the visible bug).
  2. The 2 P1 capacities that carry 100% of the cost **don't exist in the `capacities` table** — they live only in the Metrics-App lineage.

**Principle for the fix (operator directive):** the **Fabric Capacity Metrics App is ground truth.** The `capacities` dimension, `workspaces.capacity_id`, and all $/CU figures must be derived from / reconciled against it — not the Admin API, for anything billable.

---

## Ground-truth dataflow (ASCII)

```
                  ╔═══════════════════════════════════════════════╗
                  ║   GROUND TRUTH: Fabric Capacity Metrics App    ║
                  ║   (DAX, scoped to installing admin's caps)     ║
                  ║   sees ONLY the 2 billable P1 caps: SND, PRD   ║
                  ╚═══════════════════════════════════════════════╝
                                      │ space-3 capacity GUIDs (53a6…, a1a0…)
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
 capacity_snapshots           item_metadata               item_metrics_hourly
 GUID + NAME + SKU(P1)        item→workspace→cap GUID       CU-seconds / item / hr
 = billable catalog ✓        = ws↔cap mapping ✓ (223 ws)
        │                             │                             │
        │                             │                             ▼
        │                             │                    telemetry_rollup ──┐
        │                             │                + capacity_pricing      │ $5k×2
        │                             │                  ($10k/mo) ────────────┤
        │                             │                                        ▼
        │                             │                          cost_observations_v2
        │                             │                          cap_id = space-3 GUID
        │                             │                          $10k/day run-rate ✓
        └──────── all in SPACE-3, already joinable ───────┐                    │
                                                          │                    ▼  Cost UI ✓
   ╔═══════════════════════════════════════════════╗     │
   ║   Power BI ADMIN API  (different identity)      ║    │
   ║   sees trial + PPU ONLY — NOT the P1 caps       ║    │
   ╚═══════════════════════════════════════════════╝     │
        │ space-1/2 GUIDs (e5a0…, d148…)                  │
        ▼                                   ▼             │
 capacities = 3×Trial(FTL64)+1×PPU(PP3)    workspaces=511 │
 ✗ MISSING both P1 caps                    ✗ cap_id NULL  │
                                                   │      │
                                                   ▼      │
                              Workspaces capacity filter ─┘
                              joins workspaces.capacity_id = NULL
                              → SND filter returns 0   ◄── THE BUG
```

The billable truth is entirely in the **Metrics-App lineage** (top). The dimension (`capacities`, `workspaces`) is built from the **Admin lineage** (bottom), which cannot see the P1 capacities. The two lineages never connect — the fix is to source the dimension + workspace link from the Metrics-App lineage.

---

## Evidence (read-only spike, prod, 2026-05-29)

**Capacities dimension (Admin API) — missing the billable caps:**
| display_name | sku | source |
|---|---|---|
| Premium Per User - Reserved | PP3 | Admin |
| Trial-20260309… | FTL64 | Admin |
| Trial-20260430T082049… | FTL64 | Admin |
| Trial-20260430T094246… | FTL64 | Admin |

→ 3 trial + 1 PPU. **Zero P1.** (Note: 3 trial, not 2 — a 3rd was spun up 2026-04-30.)

**Metrics-App catalog (`capacity_snapshots`) — the billable truth:**
| capacity_id (space-3) | capacity_name | sku |
|---|---|---|
| `53a62df1-…` | SBM Offshore Power BI - SND | P1 |
| `a1a0bdfd-…` | SBM Offshore Power BI - PRD | P1 |

**Cost reconciliation (`cost_observations_v2`):** every day = **$10,000** (2 caps × $5k), USD, even the partial latest day → `cost_amount` is a **monthly run-rate replicated per day**. Single-day reads are correct; **a `SUM(cost_amount)` across days overstates ~30×** (guardrail needed).

**The 511 workspaces, classified (join `workspaces.fabric_workspace_id = item_metadata.workspace_id`):**
| Bucket | Count | Notes |
|---|---|---|
| On a billable P1 capacity | **223** | 119 SND + 105 PRD (via `item_metadata`). Should appear under the capacity filter. |
| No Metrics-App items (Pro/PPU/personal/shared) | **288** | `[DEV]`/`[UAT]` + personal workspaces. No CU, no cost → correctly no dedicated capacity. Needs Pro+PPU licensing backlog for full FinOps. |
| (discrepancy) | 1 | 224 distinct ws in `item_metadata` vs 223 matched → one Metrics-App workspace has no `workspaces` row. Spike flag. |

**`workspaces.capacity_id`:** NULL × 511 (0 populated).

---

## Corrected root cause

**Primary (was framed as "the deeper issue"):** the `capacities` dimension is **sourced from the wrong API**. Admin enumeration (under the current identity) returns trial+PPU; the Metrics App returns the billable P1 caps. They are **disjoint sets of physical capacities**, not the same caps wearing different ID badges. There is nothing to "reconcile" between space-2 and space-3 for the P1 caps — they were **never in space-2**.

**Why the Admin API can't see them:** almost certainly **capacity-admin permission scope** — the Metrics App was installed by an admin with rights to the P1 capacities; the Admin-Groups SP enumeration runs under an identity that only sees trial+PPU. (Cf. existing gotcha: *Metrics App bounded by installing admin's capacity-admin permissions.*)

**Secondary:** the scanner *also* drops `g.capacityId` on workspace insert (`introspection.ts:160`, `customers/route.ts:166`, plus `discoverPerWorkspace()`). Real, but **moot for the P1 caps** — even if mapped, `g.capacityId` is a space-2 GUID and the P1 caps aren't in space-2.

### Why the original "Problem A" fix is wrong
`workspaces.capacity_id` is `uuid REFERENCES capacities.id` (schema:171) — **not** a free GUID field. You cannot write `g.capacityId` (a Fabric Admin GUID) into it. And the P1 caps aren't in Admin enumeration anyway. The correct link is **`item_metadata` (space-3) → `capacities.id`**, after the dimension is backfilled from `capacity_snapshots`.

---

## API capability (researched 2026-05-29, Microsoft Learn)

**Yes — you can get every workspace + its capacity (GUID + name) tenant-wide, and a capacity has ONE global GUID** (so the "3 disjoint ID spaces" framing was partly an artifact of comparing *different* capacities' GUIDs):
- **Power BI Admin:** `GET /v1.0/myorg/admin/groups` (*GetGroupsAsAdmin*) → every workspace with a `capacityId` field. `GET /v1.0/myorg/admin/capacities` (*GetCapacitiesAsAdmin*) → every capacity with `id`+`displayName`+`sku`. Join on `capacityId`. ($top≤5000, paginate $skip; 50 req/hr.)
- **Fabric Admin (newer):** `GET /v1/admin/workspaces` → all workspaces with `capacityId`, filterable `?capacityId=…` (10k/page).
- Both "As Admin" calls are **tenant-wide** and require **Fabric-admin OR an SP enabled for read-only admin APIs**. The `capacityId` they return is the *same* global GUID the Metrics App uses.

**The actual code gap:** `FabricClient.listCapacities()` calls the **non-admin** `/capacities` (returns only caps the SP can *admin* → trial+PPU). There is **no `adminListCapacities()`**. And `adminListGroups()` (admin, tenant-wide, carries `capacityId`) *is* called but the field is dropped. That's why the dimension is missing the P1 caps.

## The fix — TWO paths; the spike's API probe decides which

**FIX-A (preferred — simplest, if the SP can see the caps via admin):**
1. **Add `adminListCapacities()` → `/admin/capacities`** (GetCapacitiesAsAdmin) and source the `capacities` dimension from it. Returns ALL tenant caps incl. the P1 pair, at the global GUID that **equals the cost-chain GUID** — so cost joins natively. Add a `billable`/`source` flag so views can split trial/PPU from billable.
2. **Keep `adminListGroups().capacityId`** (stop dropping it). Resolve `g.capacityId → capacities.id` on workspace insert (it's a `uuid REFERENCES capacities.id` FK, so resolve, don't write the raw GUID). Fixes the filter. Apply to all write paths (`introspection.ts`, `customers/route.ts`, `discoverPerWorkspace()`).

**FIX-B (fallback — only if the SP genuinely can't see the P1 caps even via admin):**
- Source the billable dimension from `capacity_snapshots` (Metrics App) instead, and link `workspaces.capacity_id` from `item_metadata`. Same end state, different source. Also: grant the SP Fabric-admin / enable the "service principals can use read-only admin APIs" tenant setting so FIX-A becomes possible.

**Both paths also need:**
3. **288 off-capacity workspaces:** `capacity_id` stays NULL; UI buckets them "Pro / Shared / no dedicated capacity" rather than hiding. Full $-attribution awaits the **Pro + PPU licensing** backlog item.
4. **Cost-sum guardrail:** assert no read path `SUM`s `cost_amount` across days (it's a monthly run-rate; verified $10k/day). Single-day or documented period model only.
5. **Reconciliation guardrail:** keep the spike script (below) as a `validate:`-style parity check — our catalog + per-capacity CU/$ must match Metrics-App ground truth.

**Which path? → FIX-A, CONFIRMED (live probe, 2026-05-29).** `GetCapacitiesAsAdmin` returned all 5 caps including both P1 caps at the exact cost GUIDs (`53A62DF1…` SND, `A1A0BDFD…` PRD); `GetGroupsAsAdmin.capacityId` carries them too. The SP already has the rights — LayerPulse just calls the non-admin `/capacities`. No FIX-B, no Metrics-App-sourced dimension, no mapping table.

**⚠ Secondary bug found by the probe:** `adminListGroups()` uses `?$top=5000` with **no `$skip` pagination** — `GetGroupsAsAdmin` returned exactly 5000 (the cap), so any tenant with >5000 workspaces is **silently truncated**. Doesn't bite SBM's 511, but fix it as part of this work — either add `$skip` paging or move to Fabric `GET /v1/admin/workspaces` (continuationToken, 10k/page, filterable by `capacityId`).

---

## Spike-FIRST verification plan (run before any code)

Run the harness below, then **eyeball-match the numbers against the actual Fabric Capacity Metrics App UI** (you have access) — confirm OUR figures == the App's figures before trusting/fixing:

1. ✅ Done: capacities dim vs Metrics-App catalog gap (2 P1 missing).
2. ✅ Done: 511 workspace classification (223 billable / 288 off-capacity / 1 discrepancy).
3. ✅ Done: cost = $10k/day run-rate, reconciles to 2 × $5k.
4. **TODO — CU parity:** per-capacity CU-seconds from `item_metrics_hourly`/`telemetry_rollup` vs the Metrics App's own per-capacity CU for the same window. Must match within rounding.
5. **TODO — the 1-workspace discrepancy:** which Metrics-App `workspace_id` has no `workspaces` row? (scanner missed it, or a deleted/personal ws.)
6. **TODO — confirm the permission-scope hypothesis:** run `adminListGroups` / capacity enumeration under the env's SP and confirm it returns only trial+PPU (i.e. the P1 caps are genuinely invisible to that identity).

### Runnable script (one command — covers TODOs 1-6)
A read-only spike script exists in the product repo: **`scripts/spike-sbm-capacity-reconcile.ts`**. It runs the full DB reconciliation AND the live Admin API probe (§6 — the FIX-A/FIX-B decider), then writes a JSON report to `validation-reports/`.
```bash
cd ../layerpulse
pnpm tsx scripts/spike-sbm-capacity-reconcile.ts            # DB + live Admin API probe (needs ENCRYPTION_KEY + SP creds)
pnpm tsx scripts/spike-sbm-capacity-reconcile.ts --no-api   # DB-only (no creds; validated 2026-05-29)
# On Windows, prefix NODE_OPTIONS=--use-system-ca if token acquisition hits a TLS error.
```
Full run (2026-05-29, incl. live API probe) confirmed: 2 P1 caps missing from the dimension · $10k/day run-rate · 223 billable / 288 off-capacity · 1-ws discrepancy · **`/admin/capacities` returns both P1 caps at the cost GUIDs → FIX-A** · `GetGroupsAsAdmin` truncated at 5000 (pagination bug).

### Raw SQL harness (if you prefer manual queries)
```bash
cd ../layerpulse
export PGSSLMODE=require
DBURL=$(grep -E "^DATABASE_URL_DIRECT=" .env.local | sed -E 's/^DATABASE_URL_DIRECT=//; s/^"//; s/"$//')
PSQL=~/scoop/apps/postgresql/current/bin/psql
SBM='a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3'
```
```sql
-- catalog gap: dimension vs Metrics-App ground truth
select 'dimension' src, display_name, sku from capacities where customer_env_id='<SBM>'
union all
select 'metrics-app', capacity_name, sku from (select distinct capacity_id, capacity_name, sku from capacity_snapshots where customer_env_id='<SBM>') x;

-- 511 workspace classification
select case when im.wsid is null then 'off-capacity (Pro/PPU/personal)' else 'billable P1' end bucket, count(*)
from workspaces w
left join (select distinct workspace_id::text wsid from item_metadata where customer_env_id='<SBM>') im
  on im.wsid = w.fabric_workspace_id
where w.customer_env_id='<SBM>' group by 1;

-- per-capacity workspace + cost (named)
select cs.capacity_name, count(distinct im.workspace_id) ws
from item_metadata im join capacity_snapshots cs on cs.capacity_id=im.capacity_id and cs.customer_env_id=im.customer_env_id
where im.customer_env_id='<SBM>' group by 1;

-- cost run-rate (must be 2×$5k=$10k/day; do NOT sum across days)
select day, round(sum(cost_amount)::numeric,0) day_cost, count(distinct capacity_id) caps
from cost_observations_v2 where customer_env_id='<SBM>' group by day order by day;

-- CU parity candidate (compare to Metrics App UI per capacity)
select capacity_id, round(sum(cu_seconds)::numeric,0) cu_sec
from telemetry_rollup where customer_env_id='<SBM>' group by 1;
```

---

## Acceptance criteria (corrected)

- **A1** — `capacities` contains the 2 billable P1 caps sourced from `capacity_snapshots`, with the space-3 GUID as the join identity to cost.
- **A2** — `workspaces.capacity_id` populated from `item_metadata` for the 223 billable workspaces; the 288 off-capacity ones remain NULL and are bucketed (not hidden) in the UI.
- **A3** — Workspaces "Capacity = SND" filter returns 119 (PRD 105). The screenshot bug is gone.
- **A4** — `validate:capacity-reconcile` passes: our catalog + per-capacity CU/$ match the Metrics App ground truth.
- **A5** — no `SUM(cost_amount)`-across-days anywhere; no regression to the working cost chain.

## Key files
| File | Role |
|---|---|
| `src/lib/fabric/metrics-app/collect.ts`, `dax-queries.ts` | Ground-truth source (`capacity_snapshots`, `item_metadata`, space-3). |
| `src/lib/db/schema.ts` | `capacities` (add `metrics_app_capacity_id`/`billable`?), `workspaces.capacity_id` (FK→capacities.id, schema:171), `capacity_snapshots:1051`, `item_metadata:1074`. |
| `src/lib/fabric/introspection.ts` (~L160), `src/app/api/customers/route.ts` (~L166), `discoverPerWorkspace()` | Dimension/workspace write paths — re-source from Metrics App, NOT Admin `g.capacityId`. |
| `src/lib/cost/cost-observations-collector.ts` | Cost chain (space-3). Read-only understanding; don't break it. |
| Workspaces page + capacity filter | Consumes `workspaces.capacity_id`; also needs the "off-capacity" bucket. |

## Constraints / out of scope
- **Production DB.** Read-only verify; writes/migrations via reviewed migration + the env's cron path, never ad-hoc `UPDATE`. `/build-feature`, feature branch, gates.
- **Don't break the working cost chain.** Fix is additive.
- **Out of scope:** Pro/PPU per-license FinOps (separate backlog — it's what the 288 off-capacity workspaces need); RLS; ownership; billing backfill.
- Originating audit: (mockup repo) `docs/research/2026-05-28-production-db-content-map.md`.
