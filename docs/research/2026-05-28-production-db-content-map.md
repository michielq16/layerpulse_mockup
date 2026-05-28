---
title: LayerPulse production DB — content map & document-feasibility audit
date: 2026-05-28
source: live read-only profiling of pg-layerpulse-dev.postgres.database.azure.com (db `layerpulse`, PG 17.9)
method: 4 parallel domain agents, read-only SELECT sampling + headline figures verified by hand
purpose: ground the Perfect-Document persona series in real, queryable data instead of invented fixtures
---

# Why this doc exists

The persona docs (BI Manager / Engineer / Governance / FinOps) must be **deterministic-generatable** — every visible value a slot-fill, computed value, rule output, or templated string (session 2026-05-28 decision #5). This audit establishes **what the production DB can actually back today**, so the renders use real magnitudes, not invented narrative.

**Read this before grounding any persona render.** All figures below are as-of **2026-05-28**.

## ⚠ Confidentiality rule for public review pages

`public/review/**` is served on the public Vercel URL. The DB contains **real customer data (SBM Offshore)** — real UPNs, IPs, workspace/report names. **Pseudonymize the tenant name and any identifying report/user strings** in anything under `public/review/`. Keep the real *magnitudes and shape* (counts, rates, distributions) — those are the value. Internal `docs/**` may reference the real env id for traceability.

## Tenant topology — there is one deep tenant

7 `customer_environments` under 5 `partners`. **Only one has production depth:**

| Env | Partner | Status | Fidelity | Workspaces | Reports | Apps | Notes |
|---|---|---|---|---|---|---|---|
| **SBM Production** (`a4bd4bda-…-728c1b0369c3`) | QaaS Consultancy B.V. | ready | silver | **511** | **4,796** | **171** | Real tenant (SBM Offshore). Metrics App `connected`. The ONLY deep env. |
| Contoso Retail Group | Contoso Partners | ready | gold | 3 | 10 | 1 | demo fixture |
| Northwind Traders | Contoso Partners | ready | gold | 3 | 10 | 1 | demo fixture |
| Adventure Works Stores | Contoso Partners | ready | gold | 3 | 10 | 1 | demo fixture |
| Michiel Demo | — | ready | gold | 3 | 4 | 1 | demo fixture |
| Acme Corp | Kasparov | not_started | bronze | 0 | 0 | 0 | never connected |
| LayerPulse E2E Test | — | not_started | bronze | 0 | 0 | 0 | E2E placeholder |

**Implication:** per-model / per-report / forensic documents are **✓ Live for SBM only**. The multi-tenant partner-portfolio story is currently carried by *demo fixtures* (Contoso Partners' 3 tenants), not real depth — design around this honestly.

## Authoritative SBM figures (verified, reproducible)

| Metric | Value | Source |
|---|---|---|
| Workspaces | 511 | `workspaces` |
| Reports (catalog) | 4,796 | `fabric_reports` |
| Reports **viewed in 30d** | 1,881 | `activity_events.report_id` distinct |
| Reports **dormant (30d)** | **3,342 (≈70%)** | catalog − viewed |
| Published apps | 171 | `fabric_apps` |
| Semantic models | 1,699 | `semantic_models` |
| Measures (total) | 1,001 | `measures` |
| Measures **documented** | **67 (6.7%)** | `description` non-empty |
| Active users (30d) | 3,800 | distinct `user_id` |
| Refresh **Completed** | 77,683 | `refreshables.last_refresh_status` |
| Refresh **Failed** | 36,736 | → **≈67.9% success** (of completed+failed) |
| Tenant settings captured | 166 switches | `tenant_settings` (env_id) |
| Activity-events window | 2026-04-19 → 05-28 (~30d rolling) | `activity_events.timestamp` |

**Export-class ops, last 30d (SBM):** ExportReport 5,649 · ExportArtifactDownload 584 · ItemDefinitionExported 462 · ShareReport 400 · DownloadReport 319 · ShareDataset 19. (System/pipeline ops ExportDataflow 44,688 + ExportActivityEvents 19,251 are *not* user data-exfil — separate them in any SOC2 export-log doc.)

**Worst refresh offenders (latest snapshot):** "R2R - Dashboard GUYANA" and "R2R - Dashboard ASIA" — 60 refreshes, **100% Failed**; plus a cluster of Operations-Financial / Command-Center datasets all failing. Strong, real "reliability incident" material.

## Domain richness heat map

| Domain | Production-grade now | Thin / single-env | Empty (schema only) |
|---|---|---|---|
| **FinOps** | `item_metrics_hourly` (400K, 30d hourly), `telemetry_rollup` (40d: cost×adoption×refresh), `workload_metrics` (30d) | `cost_observations_v2` (**only 5 days deep**); `time_points`/`workload_metrics` (**2 capacities**) | `cost_observations`, `capacity_metrics` |
| **Quality** | `refreshables` (131K, status mix, hist to 2023), `measures` (753 real DAX), `columns` (20.6K) | per-model depth = **SBM only**; `health_scores` (65; semantic_quality pinned at 50 = placeholder) | `columns.expression`, `shared_expressions` |
| **Governance** | `activity_events` (1.2M; `details` JSONB: ClientIP 84% / UserAgent 60% / real UPNs / 93 IPs-per-day), `tenant_settings` (166), `business_terms` (159) | `tenant_settings` deep on 1 env only; ownership_tags/audit_log/term_attachments (4–11 seed rows) | `governance_finding_overrides`, `documentation_assets` |
| **Platform/Partner** | `fabric_reports` (4,796, 273 editors, dates 2020→2026), `fabric_apps` (171, audiences→744), `workspaces` (511) | demo tenants (10 reports each); `documents` (53), `recommendations` (22), `alerts` (28) | `subscriptions`, `user_preferences`, `workspaces.criticality` (100% NULL); **SBM has no capacity_id** |

## Document menu — ranked by defensibility

| # | Document | Persona | Backing | Confidence |
|---|---|---|---|---|
| 1 | Data Export & Download Activity Log (SOC2 CC6.x) | Governance | `activity_events.details` | ✓ Live — most defensible artifact |
| 2 | Report Catalog & Dormancy Audit (70% dormant) | Partner / BI Mgr | `fabric_reports × activity_events × workspaces` | ✓ Live (SBM) |
| 3 | Refresh Reliability Report (67.9% success) | BI Mgr / Engineer | `refreshables` (+ `refresh_events`) | ✓ Live |
| 4 | Cost-vs-Adoption / Wasted-Spend | FinOps | `telemetry_rollup × item_metadata` | ✓ Live (40d) |
| 5 | Off-Hours & Anomalous-Access | Governance | `activity_events` (ts × ClientIP × UPN) | ✓ Live |
| 6 | Tenant Configuration Evidence Pack (166 switches) | Governance | `tenant_settings` | ✓ Live (PRD) / ⚠ multi-env |
| 7 | Capacity Cost Attribution (share-of-bill) | FinOps | `cost_observations_v2 × item_metadata × capacity_pricing` | ⚠ Partial — 5-day window only |
| 8 | Auto-generated Model Documentation (C2d) | Engineer | `tables × columns × measures × data_sources` | ⚠ Partial — prose layer thin (6.7% documented) |
| 9 | Throttling / Over-Capacity (peak CU% 4360%) | FinOps | `time_points × workload_metrics` | ⚠ Partial — throttle_state NULL; infer from cu_pct |
| 10 | Partner Portfolio QBR | Partner | `partners → customer_environments → *` | ⚠ Partial — only demo fixtures make multi-tenant |
| — | Ownership Statement / Accepted-Risk Register / Billing | — | ownership / overrides / subscriptions | ✗ Gap — 0–4 rows |

## Structural gotchas (carry into every render)

1. **Single-tenant depth.** "1,716 models / 4,796 reports" is real *for SBM*; near-zero elsewhere. Per-model docs ✗ Gap outside SBM.
2. **Capacity identity is split across THREE disjoint ID spaces** (corrected 2026-05-28 after deeper dig) — (1) `capacities.id` LP-internal, (2) `capacities.fabric_capacity_id` Fabric Admin GUID (SBM: 4 trial/PPU caps), (3) Metrics-App capacity GUID (SBM: `53a62df1`/`a1a0bdfd`, the 2 caps that carry cost+usage). **Cost IS computed for SBM** — `cost_observations_v2` has **3,150 SBM rows** ($5k/mo × 2 caps, USD) and `item_metrics_hourly` has 362,983 SBM rows. The real gap is the **workspace rollup**: `workspaces.capacity_id` is NULL for all 511 SBM workspaces (scanner drops `g.capacityId` at `introspection.ts:160`), and the cost capacity space (3) doesn't reconcile with the `capacities` dimension (1/2). So cost resolves to an **item GUID** (via `item_metadata`) but not to a **workspace/business-unit/capacity-SKU**. Full handover + fix plan: `docs/handover/2026-05-28-sbm-capacity-link-fix.md`.
3. **`throttle_state` and `overage_minutes` are NULL/0 across all `time_points`** → throttle classification must be inferred from `cu_pct`, not read.
4. **`health_scores.semantic_quality` & `documentation_completeness` pinned at 50** for silver tier = placeholder, not computed. Don't quote as a real score yet.
5. **activity_events `status` column is misleading** (mirrors `operation`); the true success flag + audit substrate (ClientIP/UserAgent/UPN/IsSuccess) live in `details` JSONB.
6. **Two cost populations in `cost_observations_v2`:** synthetic EUR demo fixtures vs live USD Metrics-App rows. Currency is genuinely mixed.

## Connection (read-only, for future sessions)

```bash
cd <layerpulse-product-repo> && export PGSSLMODE=require \
  && export DBURL=$(grep -E "^DATABASE_URL_DIRECT=" .env.local | sed -E 's/^DATABASE_URL_DIRECT=//; s/^"//; s/"$//') \
  && psql "$DBURL" -P pager=off -c "<SELECT ... LIMIT n>"
```
SBM env id: `a4bd4bda-a1cf-45bc-bbc9-728c1b0369c3`. **READ-ONLY only.** `psql` available at `~/scoop/apps/postgresql/current/bin/psql`.
