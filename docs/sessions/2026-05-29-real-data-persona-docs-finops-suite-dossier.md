---
title: Real-data persona docs + FinOps cockpit suite + single-model dossier + persona deck
date: 2026-05-29
milestone: persona system grounded in production data
---

## What we accomplished

- **Production-DB audit** (read-only, 4 parallel domain agents) → `docs/research/2026-05-28-production-db-content-map.md`. One deep tenant (SBM Offshore): 511 ws · 4,796 reports (70% dormant) · 1,699 models · 1,001 measures (6.7% documented) · 3,800 active users · refresh 67.9% · 2×P1 caps ≈ $10k/mo · capacity 349% avg / 1043% peak.
- **4 persona docs** (`docs/perfect-doc/`, A4, internal real-SBM, PII masked, deterministic + honest gap chips): `bi-manager-v3` · `governance-soc2-v1` · `engineer-reliability-v1` · `finops-wasted-spend-v1`. (PR #34)
- **FinOps v2 cockpit suite** (`docs/screen-mocks/`, shared `finops.css` + hub): `capacity-v2` (fixes 4 KPI bugs) · `workload-mix-v2` · `cost-usage-v2`. (PR #36)
- **Single-model dossier archetype** `model-dossier-retailoperations-v1.html` — whole-model deep-dive (metadata · DAX · M-code · refresh · ownership · glossary · CU/cost · quality). Render-checked in Chrome. (PR #36)
- **FabricLab persona sales deck** `docs/decks/LayerPulse-Personas-2026-05-29.pptx` (14 slides) + `scripts/build-layerpulse-personas-deck.mjs`. (PR #36)
- **2 handover docs**: `2026-05-28-sbm-capacity-link-fix.md` (corrected diagnosis) + `2026-05-28-backlog-candidates.md` (4 candidates). (PRs #34/#35)
- PRs **#34, #35, #36** merged to main.

## Decisions made

- **Ground every persona doc in real DB magnitudes, deterministically, with honest ✓/⚠/✗ chips** — operator: "this is the correct way for the personas." Captured as feedback memory + vault pattern `[[patterns/web/ground-design-docs-in-real-data]]`.
- **Internal real-SBM (PII masked), kept OUT of `public/review/`** — repo is shareable; pseudonymize only public surfaces.
- **FinOps honesty over a flashy headline** — dropped the $1,280/mo "wasted spend" number once data showed 98% was dataflows (no view events by design); reframed as "$1.25K/mo orphan-suspect dataflows, needs lineage."
- **Cost model = share-of-bill** (fixed capacity bill × CU-share, volume-weighted), not consumption-priced.

## Gotchas

- Browser `navigate` tool force-prepends `https://` to `file://` URLs → serve over `python -m http.server` from repo root for render checks. (vault gotcha promoted)
- Power BI refresh fails 100% when M-code reads a local `C:\…` path the Fabric service can't reach — visible in `tables.m_code` (RetailOperations: 56/56 failed, stale 89d). (vault gotcha promoted)
- npm on Windows corporate proxy → `UNABLE_TO_VERIFY_LEAF_SIGNATURE` → `NODE_OPTIONS=--use-system-ca`.

## Next session

- All 4 backlog candidates accepted into LP backlog; 3 shipped (T2.15 #402 · T2.19 #408 · T2.20 #407); dataflow consumer-graph folded into Axis-3. **Do not re-propose.**
- Remaining doc-completion ingestion: T2.19 Part 2 (serviceExceptionJson) + T2.20 Part 2 (throttle/overage DAX) + two operational runs (deeper introspection, cost-history backfill 5d→30d).
- Optional follow-ups: healthy-PROD-model dossier (contrast piece); real-SBM-named internal deck cut; deck render-check; correct the "F8 SKU" flag in mocks (it's an intentional P1→F8 relabel, not a bug).

> Vault ref: [[../../obsidian-vault/development_workflow/sessions/2026-05-29-layerpulse-mockup-real-data-personas]]
