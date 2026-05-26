# PRD — Ownership & Stewardship (governance cockpit, V2)

| | |
|---|---|
| **Status** | Draft · ready for operator review |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (manual-accountability foundation) |
| **Pillar** | Governance & Compliance (P3) |
| **Persona** | Both — partner + direct customer |
| **Mockup source** | `docs/screens/ownership.md` · live at `/ownership` + model `Ownership` tab |
| **Real-product surface** | `app.layerpulse.com/ownership` (new route) + model-detail tab |
| **Depends on** | LP DB · AAD user directory · model inventory |
| **Blocks** | Documents cover credit + sign-off · partner Team & Seats coverage |

---

## 1. Problem

Fabric exposes permissions, not accountability. The page must answer **"what governance risk needs attention right now?"** — not "who owns what." V1 conflated two ownership layers (workspace + model) into one role schema; V2 splits them because their responsibilities differ.

## 2. Goals · non-goals

### Goals (V1)
- **G1.** Capture accountability at two layers — Workspace (Owner + Primary contact) and Semantic Model (Owner + SME + Steward) — by **simple tagging**.
- **G2.** Surface **governance risk** as the page's organising principle: criticality, escalation timers (no-owner days / overdue days), at-risk filter, risk-first default sort.
- **G3.** **Ownership health score** (0–100) with 60-day trend — single executive-grade signal.
- **G4.** **Tabbed IA** — `Workspaces` and `Semantic models` separate the layers cleanly; each row is one accountability unit.
- **G5.** Cross-layer signal — workspace rows carry **Model coverage X / Y** that drills into the Models tab pre-filtered.
- **G6.** Bulk shortcut — "tag all models in this workspace" writes individual tags (not a relationship).

### Non-goals (V1)
- **NG1.** Workspace-default inheritance / per-model overrides / "why" required field. Cut.
- **NG2.** Per-report, per-dataflow, per-dashboard ownership. Deferred to **V4** (avoid governance fragmentation).
- **NG3.** SME / Steward on workspaces — semantically weak on a container.
- **NG4.** Approval workflow / notifications — defer to V2/V3.
- **NG5.** Editing Fabric permissions — LP captures accountability; never mutates ACLs.

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **Governance lead** | "Where are the gaps before next audit?" → /ownership → at-risk filter. |
| **Workspace admin** | "Tag accountability for all my workspace's models in one go." → ⚙ → bulk tag. |
| **Partner consultant** | "Which customer workspaces have no owner?" → Workspaces tab, risk-sorted. |
| **Auditor-facing partner** | "Ship the doc with a real sign-off." → Owner + Stewards from /ownership flow into the doc. |

## 4. 5-gate scorecard

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Governance — the accountability layer that makes Quality docs trustworthy + Compliance shippable |
| **G2 · JOIN** | `ownership_tags × workspaces × semantic_models × aad_users` — no Fabric API exposes this |
| **G3 · Persona** | Governance lead resolves gaps; partner sees coverage per customer; doc flows ship with real sign-off |
| **G4 · Differentiator** | Operational + business governance unified, **risk-first**, joined into auto-docs and the partner portfolio view |
| **G5 · Decision** | "Where do I assign / review next?" — one click of the At-risk pill answers it |

## 5. Information architecture

```
/ownership
├── 5 KPIs (Workspaces · Health score+trend · At-risk · Review overdue · Stewards)
├── Tabs: [ Workspaces ]  [ Semantic models ]
├── Filter bar (search · All / At-risk / Overdue / Critical / Mine · Sort)
└── Rows (card-table hybrid, sorted by risk desc)
       workspace row:  name · criticality · escalation · env · X models · Y reports
                       Owner chip · Primary contact chip · Model coverage X/Y
       model row:      name · workspace · env · criticality · escalation
                       Owner chip · SME chip · Steward chip

drawer (light) — tag roles per model OR bulk-per-workspace
activity log — append-only

/models/[id]/ownership   (ModelOwnership tab — per-model role view)
```

## 6. Functional requirements

### 6.1 Stat strip (5 cards)
- **FR-OW-1** Workspaces · Ownership health score (0–100 + 60d delta) · At-risk · Review overdue · Stewards active. Health = `ownerWs×0.30 + ownerModel×0.30 + smeModel×0.25 + freshWs×0.15` × 100.

### 6.2 Tabs + filter bar
- **FR-OW-2** Two tabs (`Workspaces` / `Semantic models`) with counts. Default `Workspaces`.
- **FR-OW-3** Filter chips: `All` / `At-risk` / `Overdue` / `Critical` / `Mine`. Default sort: **Risk descending** (no-owner first, then critical, then overdue, then else).
- **FR-OW-4** Search across the visible row's text (workspace/model/owner/contact).

### 6.3 Workspace row
- **FR-OW-5** Render: name · **criticality chip** (Critical/Business-critical/Internal/Low) · escalation text (`No owner · 34d` / `Review overdue · 21d` / `Reviewed YYYY-MM-DD · Updated 2d ago`) · primary contextual action (`Assign owner →` / `Review →` / none) · ⚙ menu.
- **FR-OW-6** Meta line: env badge · model count · report count.
- **FR-OW-7** Two role chips: **Workspace owner** (required) + **Primary contact** (optional; subtle when missing — `none yet`).
- **FR-OW-8** Right side: **Model coverage X / Y** chip — clickable, drills into the Semantic models tab filtered to this workspace's models.
- **FR-OW-9** At-risk treatment: rose left-accent · ⚠ icon · escalation pill background-rose.

### 6.4 Model row
- **FR-OW-10** Render: name · workspace+env (small) · criticality chip · escalation text · primary action (`Assign owner →` if no owner) · `Open model` + ⚙.
- **FR-OW-11** Three role chips: **Owner** · **SME** · **Steward** (multi-allowed; shows name if 1, `N tagged` if >1).
- **FR-OW-12** Partial coverage (owner ✓ but SME or Steward missing): amber left-accent.

### 6.5 Drawer
- **FR-OW-13** Light tag drawer (per-model or bulk-per-workspace). Shows the appropriate role set for the asset type.

### 6.6 Data contract (uniform, future-extensible)

```sql
CREATE TABLE ownership_tags (
  tenant_id   TEXT NOT NULL,
  asset_type  TEXT NOT NULL,   -- 'workspace' | 'semantic_model' | (future: 'report' | 'dataflow' | …)
  asset_id    TEXT NOT NULL,
  role        TEXT NOT NULL,   -- 'owner' | 'primary_contact' | 'sme' | 'steward'
  user_email  TEXT NOT NULL,
  set_by      TEXT, set_at     TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, asset_type, asset_id, role, user_email)
);
-- App-enforced role set per asset_type:
--   workspace      → role IN ('owner','primary_contact')
--   semantic_model → role IN ('owner','sme','steward')

CREATE TABLE ownership_audit_log (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT,
  asset_type TEXT, asset_id TEXT, change_type TEXT, role TEXT, user_email TEXT,
  who TEXT NOT NULL, at TIMESTAMPTZ NOT NULL, details JSONB
);

-- Workspace criticality lives on the workspace inventory (not in ownership_tags):
-- workspaces.criticality  TEXT  -- 'critical' | 'business-critical' | 'internal' | 'low'
```

No `workspace_owners` defaults, no `model_owner_overrides`, no resolution function. Bulk "tag all in workspace" = a loop of inserts on `model_role_tags`-shape rows. **V4 extension**: add `'report' | 'dataflow' | …` to `asset_type` and a per-type role allowlist; no schema change.

### 6.7 Joins required (LayerPulse-only)

```
workspaces ⋈ ownership_tags (asset_type='workspace')   → workspace owner + primary contact
semantic_models ⋈ ownership_tags (asset_type='semantic_model')  → owner + sme + stewards
ownership_tags ⋈ aad_users (display name + title)
```

## 7. States · edge cases

| State | Trigger | UI |
|---|---|---|
| No owner | no `owner` tag for the asset | rose row, ⚠ icon, escalation `No owner · Nd`, primary action `Assign owner →` |
| Review overdue | `lastReview` older than cadence | amber row, escalation `Review overdue · Nd` |
| Partial coverage (model) | owner ✓ but SME/Steward ✗ | amber row, escalation `No SME` / `No steward` |
| No contact (workspace) | optional, missing | subtle `✗ none yet`, no alert |
| Empty filter result | filter excludes all | "No workspaces match. Clear the filter to see all." |

## 8. Telemetry

| Event | Properties |
|---|---|
| `ownership.tagged` | asset_type, asset_id, role |
| `ownership.untagged` | asset_type, asset_id, role |
| `ownership.bulk_tagged` | workspace_id, role, model_count |
| `ownership.tab_switched` | tab |
| `ownership.filter_applied` | chip |
| `ownership.coverage_drillin` | workspace_id |
| `ownership.doc_signoff_rendered` | model_id, resolved (owner\|empty) |

## 9. Rollout

| Phase | Audience | Flag | Success |
|---|---|---|---|
| 0 Internal | eng + 1 partner | `lp.ownership.v2` | tag all internal workspaces + models |
| 1 Closed beta | 5 partner orgs | per-org | ≥3 orgs reach ≥80% workspace coverage in wk1; ≥50% model owner coverage |
| 2 GA | all | default-on | Documents sign-off renders a real owner for ≥50% of docs |

## 10. Open questions

- **OQ-1** ✅ V1 scope = Workspace + Semantic Model only (operator 2026-05-26).
- **OQ-2** ✅ Differentiated roles per layer (operator 2026-05-26).
- **OQ-3** ✅ Primary contact in V1 (operator 2026-05-26).
- **OQ-4** Standalone tier row vs fold into the **E Governance** pillar? (Accountability ≠ access — lean **standalone**; open for PO.)
- **OQ-5** V2 inheritance: should newly-discovered models auto-tag from their workspace owner (marked "inherited" until refined)? Useful operational UX; defer to V2 spec.

## 11. Acceptance checklist for `/build-feature`

- [ ] Data contract (§6.6) accepted by platform team — incl. `asset_type` future-extensibility
- [ ] OQ-4 / OQ-5 answered
- [ ] Health-score formula confirmed
- [ ] Risk-priority sort + at-risk pill behavior signed off
- [ ] Workspace `criticality` field source decided (manual flag on the workspace, or derived?)
- [ ] Mockup `/ownership` reviewed by operator (done — V2 2026-05-26)
- [ ] PRD tagged `v2.0`, linked from `/build-feature` issue

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/ownership`
**Screen narrative:** `docs/screens/ownership.md` · **PO review:** `public/review/ownership.html`
