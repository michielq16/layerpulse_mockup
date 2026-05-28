# Handover — fix SBM capacity attribution: `workspaces.capacity_id` is NULL + 3 disjoint capacity-ID spaces

**To:** an engineering agent working in the **LayerPulse product repo** (`../layerpulse`, the real Next.js/Drizzle app — *not* the mockup).
**From:** mockup-designer session, 2026-05-28, during a read-only audit of the production DB (env SBM Production).
**Type:** data-integrity / collector bug investigation. Likely a supervised schema-or-collector change → must go through `/build-feature` (multi-file, touches collectors + possibly a migration; do **not** commit to main directly).
**Priority:** unblocks the entire FinOps pillar for the one real production tenant. Today cost cannot be attributed to a workspace, business unit, or report.

---

## TL;DR

Cost attribution **is** computed for SBM (3,150 `cost_observations_v2` rows, $5,000/mo × 2 capacities, USD). It resolves to **item** and — confirmed — to **workspace** (via `item_metadata.workspace_name`, **99.7% coverage**: 3,140/3,150 rows). So a **cost-per-workspace rollup already works today**.

The remaining gap is narrower than first thought: cost cannot be attributed to a **capacity SKU / the `capacities` dimension**, because:

1. **`workspaces.capacity_id` is NULL for all 511 SBM workspaces.** The scanner has each workspace's `capacityId` in hand but drops it on insert (`introspection.ts:160`).
2. **There are three disjoint capacity-ID spaces** that nothing reconciles. Cost lives in one (Metrics-App GUID); the `capacities` dimension lives in another; workspaces (once fixed) would link to a third.

**Scope note:** the per-workspace FinOps rollup is NOT blocked (use `item_metadata`). This task is about restoring **capacity/SKU-level** attribution and a clean `capacities`↔cost join — lower urgency than originally framed, but still the right fix for capacity-level views and data hygiene.

---

## Context — what this feature is

LayerPulse's FinOps pillar attributes Fabric capacity spend down to individual artifacts (share-of-bill). The chain:

```
Capacity Metrics App (DAX) ──► item_metrics_hourly + telemetry_rollup  (per env, capacity, item, hour/day; CU-seconds)
                                          │
            capacity_pricing (operator-entered €/$ per capacity) ──► cost-observations-collector.ts
                                          │
                                          ▼
                              cost_observations_v2  (per env, capacity, day, item: cost_amount, cu_share)
```

The Cost Attribution page (`src/components/customer/cost-attribution-content.tsx`) then renders treemaps / top-spenders. For the rollup to mean anything to a customer, each cost row must trace back to a **workspace** (so you can say "Operations — Financial workspace burned $X").

## The symptom (what I observed in the audit)

For env **SBM Production** (`a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3`):

| Check | Result | Implication |
|---|---|---|
| `cost_observations_v2` rows | **3,150** (5 days, ~990 items, $5k/mo × 2 caps, USD) | ✅ cost IS computed |
| `item_metrics_hourly` rows | **362,983** (2026-05-06 → 05-28, hourly) | ✅ rich raw substrate |
| `capacity_pricing` rows | 4 (2 caps × 2 validity windows, $5,000/mo) | ✅ pricing entered |
| `capacity_snapshots` | 2 caps | ✅ snapshots present |
| **`workspaces.capacity_id`** | **NULL × 511 (0 populated)** | ❌ no workspace→capacity link |
| `capacities` table rows for SBM | 4 (SKUs **FTL64**, **PP3** — trial + PPU) | ⚠ different GUIDs than cost rows |

So the data exists, but the join graph is severed between cost and workspace.

## Root cause — TWO layers

### Problem A — the scanner drops `capacityId` on workspace insert

`src/lib/fabric/introspection.ts:157-166` upserts workspaces from the Admin Groups API but only maps four fields:

```ts
.insert(workspaces)
.values(
  batch.map((g) => ({
    customerEnvId,
    clerkOrgId,
    fabricWorkspaceId: g.id,
    name: g.name,
    // capacityId: g.capacityId  ← NOT mapped, even though g.capacityId exists
  }))
)
```

`g.capacityId` is available — the Admin Groups type carries it (`src/lib/fabric/api.ts:779` and `:810`, `capacityId?: string`). It's simply never written. Also check the **per-workspace fallback path** `discoverPerWorkspace()` (same file) and the other workspace write site `src/app/api/customers/route.ts:166` — fix all insert paths, not just this one.

### Problem B — three disjoint capacity-ID spaces (the deeper issue)

Even after Problem A, the join to cost still won't close, because there are **three different identifiers** for SBM's capacities and nothing maps between them:

| # | ID space | Where used | SBM values | Source |
|---|---|---|---|---|
| 1 | `capacities.id` (LP-internal UUID) | `capacities` PK | `dc0fb904…`, `513089f3…`, `a5611a53…`, `0fae8af4…` | LP-generated |
| 2 | `capacities.fabric_capacity_id` (Fabric Admin GUID) | Admin API | `e5a04a26…`, `d1487b3e…`, `a7fea0b3…`, `808ed300…` (FTL64 / PP3) | Fabric Admin `groups` |
| 3 | **Metrics-App capacity GUID** | `cost_observations_v2.capacity_id`, `telemetry_rollup.capacity_id`, `item_metrics_hourly.capacity_id`, `capacity_pricing.capacity_id`, `capacity_snapshots.capacity_id` | **`53a62df1…`, `a1a0bdfd…`** | Capacity Metrics App (DAX) |

The **cost chain is entirely in space 3**. The **`capacities` dimension enumerated 4 trial/PPU capacities in space 1/2** that the Metrics App never reports usage for. The two production capacities that actually carry cost (`53a62df1`, `a1a0bdfd`) **don't exist in the `capacities` table at all**. When the scanner writes `g.capacityId` (a space-2 Fabric GUID) onto a workspace, it still won't match `cost_observations_v2.capacity_id` (space 3).

> Confirmed in `cost-observations-collector.ts:108-151`: cost rows inherit `capacity_id` straight from `telemetry_rollup` (space 3). So workspace↔cost can only join if workspaces carry a space-3 ID, OR a mapping table reconciles space 2 ↔ space 3.

## What "fixed" looks like (acceptance criteria)

1. **A1** — `workspaces.capacity_id` is populated for SBM's 511 workspaces after a scanner run (verify: `select count(*) from workspaces where customer_env_id='a4bd4bda-…' and capacity_id is not null;` → 511, or as many as the Admin API returns a capacity for).
2. **A2** — the chosen `workspaces.capacity_id` value can be joined to a cost source. Decide and document the canonical capacity identity:
   - either backfill `capacities` with the space-3 Metrics-App capacities and FK workspaces → `capacities.id`,
   - or store the Metrics-App capacity GUID on the workspace,
   - or add an explicit `capacity_id_map(fabric_capacity_id ↔ metrics_app_capacity_id)` reconciliation.
3. **A3 — ✅ ALREADY MET via `item_metadata`** (confirmed: `cost_observations_v2.item_id::uuid = item_metadata.item_id` joins at 99.7%, `workspace_name` populated). Cost-per-workspace works today. The outstanding criterion is **A3b: cost grouped by capacity SKU** — which needs the id-space reconciliation below.
4. **A4** — no regression to the working cost chain (cost_observations_v2 still populates on cron).

## Investigation starting points / open questions

- **Why does the Metrics App report capacities `53a62df1`/`a1a0bdfd` while the Admin API enumerated `e5a04a26`/etc (trial/PPU)?** Are the production capacities paused/excluded from the Admin enumeration, or is the Admin scanner filtering to trial SKUs? Start: `src/lib/fabric/api.ts` (`adminListGroups`, capacity enumeration) + `src/lib/fabric/metrics-app/collect.ts` + `dax-queries.ts` (what `CapacityId` the DAX returns).
- **`item_metadata.item_id → workspace_name` is confirmed sufficient for the per-workspace rollup** (99.7%). Use it for workspace-level cost; the capacity-id reconciliation below is only needed for capacity/SKU-level views.
- **Cost history depth:** `cost_observations_v2` has only 5 days for SBM while `item_metrics_hourly`/`telemetry_rollup` span ~22 days. Secondary: consider a backfill so cost trend/MoM becomes possible. (`upsertCostObservationsV2` accepts a `fromInclusive` window — a one-off wider backfill run would populate it.)
- SBM's real capacities are **FTL64 (Fabric Trial)** and **PP3 (Premium-Per-User)** in the `capacities` table — neither is a billable F-SKU. Confirm whether the $5,000/mo `capacity_pricing` figures are real contracted costs or test values, since trial capacities have no CU billing and PPU is per-user, not per-capacity.

## Key files

| File | Role |
|---|---|
| `src/lib/fabric/introspection.ts` (~L157) | **Problem A** — workspace upsert that drops `capacityId`. Also `discoverPerWorkspace()` fallback. |
| `src/lib/fabric/api.ts` (L779, L810) | Admin Groups type carries `capacityId?` — the source that's available but unused. |
| `src/app/api/customers/route.ts` (~L166) | Second workspace insert path — fix here too. |
| `src/lib/cost/cost-observations-collector.ts` | The cost chain (space-3 capacity). Read-only understanding; **don't break it**. |
| `src/lib/fabric/metrics-app/collect.ts`, `dax-queries.ts` | Where the space-3 Metrics-App capacity GUID originates. |
| `src/lib/db/schema.ts` | `workspaces`, `capacities`, `cost_observations_v2`, `telemetry_rollup`, `item_metadata`, `capacity_pricing`. |

## Read-only verification harness

```bash
cd ../layerpulse   # the product repo (sibling checkout)
export PGSSLMODE=require
export DBURL=$(grep -E "^DATABASE_URL_DIRECT=" .env.local | sed -E 's/^DATABASE_URL_DIRECT=//; s/^"//; s/"$//')
export SBM='a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3'
psql "$DBURL" -P pager=off -c "<query>"   # psql at ~/scoop/apps/postgresql/current/bin/psql
```

Diagnostic queries (all read-only):
```sql
-- the NULL link
select capacity_id, count(*) from workspaces where customer_env_id='a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3' group by 1;
-- the three id spaces
select id, fabric_capacity_id, display_name, sku from capacities where customer_env_id='a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3';
select distinct capacity_id from cost_observations_v2 where customer_env_id='a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3';
-- the item_metadata bridge (candidate for A3)
select item_kind, count(*) from item_metadata where customer_env_id='a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3' group by 1;
```

## Constraints

- **Production DB.** Verify read-only; any write/migration goes through a reviewed migration + the env's normal cron path, never an ad-hoc `UPDATE` against prod. Per the product repo's hard rules: feature branch, `/build-feature`, security/quality gates — schema changes are a supervised surface.
- **Do not break the working cost chain** (`cost_observations_v2` populates correctly today). The fix is additive — make workspace→cost joinable; don't refactor the collector.
- The mockup audit that surfaced this is at (mockup repo) `docs/research/2026-05-28-production-db-content-map.md`.

## Out of scope

RLS evaluation, ownership data, billing/subscriptions backfill — separate gaps noted in the content map; not part of this task.
