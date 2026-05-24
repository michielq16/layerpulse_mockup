# PRD — Ownership & Stewardship (role tagging)

| | |
|---|---|
| **Status** | Draft · ready for operator review |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (manual-accountability foundation; unblocks the Documents sign-off) |
| **Pillar** | Governance & Compliance (P3) |
| **Persona** | Both — partner (accountability per customer tenant) + direct customer |
| **Mockup source** | `docs/screens/ownership.md` · live at `/ownership` + model Ownership tab |
| **Real-product surface** | `app.layerpulse.com/ownership` (new route) + model-detail tab |
| **Depends on** | LP DB (no Fabric API exposes accountability) · AAD user directory (role pickers) · model inventory (tag targets) |
| **Blocks** | Documents cover credit + sign-off block · partner Team & Seats coverage |

---

## 1. Problem

Fabric exposes *permissions* (workspace Admin/Member, dataset Build/Read), not *accountability* — who owns a model, who's the SME, who stewards it. That's human judgement and no API carries it. Every prior LP surface treated "owner" as an empty string column. This is the screen that fills it, once, and feeds it into the Documents sign-off and the partner coverage view.

## 2. Goals · non-goals

### Goals (v1)
- **G1.** Capture three roles per model — **Owner** (accountable), **SME** (expert), **Steward** (maintainer; many allowed) — by **simple tagging**.
- **G2.** **Coverage visibility** — tagged = covered; untagged = a gap, shown in per-role dots; a "Coverage gaps" KPI.
- **G3.** **Bulk shortcut** — "tag all models in a workspace" with a role (a bulk write, not a relationship).
- **G4.** **Append-only audit log** of tag changes (who · when · what).
- **G5.** Feed Documents (cover Owner/Domain + sign-off) and the partner Team & Seats coverage, degrading to explicit empty-states (never fabricated).

### Non-goals (v1)
- **NG1.** **Workspace-default inheritance.** Cut — tagging is direct (operator decision 2026-05-24).
- **NG2.** **Per-model / per-report overrides** + the "why" + resolution rule. Cut — there's nothing to override when there's no inheritance.
- **NG3.** Editing Fabric permissions (LP captures accountability; never mutates Fabric ACLs).
- **NG4.** Approval workflow / notifications (defer; the audit log suffices for v1).
- **NG5.** Inferring owners from activity as canonical (may *suggest* later; a human always confirms).

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **Governance lead** | "Make sure every model has an owner + steward before the audit." → `/ownership` → work the gaps the dots show. |
| **Workspace admin** | "Tag accountability for my workspace's models in one go." → ⚙ row → tag all. |
| **Partner consultant** | "Which of my customer's models have no owner?" → coverage dots / Team & Seats roll-up. |
| **Auditor-facing partner** | "Ship the doc with a real sign-off." → Owner + Stewards flow into the Documents sign-off. |

## 4. 5-gate scorecard

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Governance — the accountability authority that makes Quality docs trustworthy + Compliance shippable |
| **G2 · JOIN** | `model_role_tags × semantic_models × aad_users` — no Fabric API exposes accountability; LP is the only place that holds it next to the technical catalog |
| **G3 · Persona** | Steward tags once; partner sees coverage per customer; auditor-facing partner ships a real sign-off |
| **G4 · Differentiator** | Accountability captured + **joined into auto-docs and the partner portfolio view** — Fabric shows permissions only, per-tenant, with no accountability concept |
| **G5 · Decision** | "Who's accountable, and where are the gaps to fill?" — answered in <5s from the dots |

## 5. Information architecture

```
/ownership
├── 5 StatCards (workspaces · owners-tagged · no-owner · coverage-gaps · stewards-active)
├── filter row (search · status chips · env pills)
├── Ownership-by-workspace table
│     workspace · env · owner · role-coverage dots · last-reviewed · status · ⚙(tag all)
└── Activity (audit log)

tag drawer (shared shell) — tag Owner / SME / Stewards (per workspace = bulk, or per model)

/models/[id]/ownership   (model tab) — this model's Owner / SME / Stewards + tag affordance
```

## 6. Functional requirements

- **FR-OW-1** Role coverage cell: one line per role (Owner / SME / Steward) = word label + one dot per model in the workspace; filled = tagged; color by ratio (1.0 green · ≥0.5 amber · >0 red · 0 grey). No letter badges, no fractions.
- **FR-OW-2** KPI strip: workspaces · owners tagged (/workspaces) · no owner · **coverage gaps** (workspaces with any role under-tagged) · stewards active.
- **FR-OW-3** Tag drawer: pick a user from the AAD pool for Owner / SME; Stewards multi-select. Applied per model, or **per workspace = tag all that workspace's models** (bulk write).
- **FR-OW-4** Untagged workspace → rose "No owner" status + inline "Tag →".
- **FR-OW-5** Audit log: append-only who/when/what for every tag change.
- **FR-OW-6** Model Ownership tab: this model's Owner / SME / Stewards + a tag affordance. No "inherited / override" blocks.

### 6.1 Data contract (collapsed — one association table)

```sql
CREATE TABLE model_role_tags (
  tenant_id   TEXT NOT NULL,
  model_id    TEXT NOT NULL,
  role        TEXT NOT NULL,            -- owner | sme | steward
  user_email  TEXT NOT NULL,
  set_by      TEXT,
  set_at      TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (model_id, role, user_email)  -- owner/sme effectively one row; steward many
);
CREATE INDEX mrt_model_idx ON model_role_tags (model_id);

CREATE TABLE model_role_audit_log (       -- append-only
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT, model_id TEXT,
  change_type TEXT NOT NULL,              -- tag | untag | bulk_tag
  role TEXT, user_email TEXT, who TEXT NOT NULL, at TIMESTAMPTZ NOT NULL
);
```

No `workspace_owners` defaults, no `model_owner_overrides`, no resolution function. "Owner" is just `role='owner'` on the model. Bulk = a loop of inserts.

### 6.2 Joins required (LayerPulse-only)

```
semantic_models
  ⋈ model_role_tags (owner/sme/steward)   (coverage · dots · doc sign-off)
  ⋈ aad_users                              (name / avatar)
coverage gap = a model with no row for a given role
```

## 7. States · edge cases

| State | Trigger | UI |
|---|---|---|
| No owner | model has no `owner` tag | rose status + "Tag →"; doc renders empty-state |
| Partial coverage | some models untagged for a role | amber/red dots; counts in "Coverage gaps" |
| No models in workspace | 0 models | coverage cell "no models" |
| Review overdue | past cadence | amber status |
| Drawer dismiss | ESC / backdrop | close without save |

## 8. Telemetry

| Event | Properties |
|---|---|
| `ownership.tagged` | model_id, role |
| `ownership.untagged` | model_id, role |
| `ownership.bulk_tagged` | workspace_id, role, model_count |
| `ownership.coverage_viewed` | workspace_id, gaps |
| `ownership.doc_signoff_rendered` | model_id, resolved (owner\|empty) |

## 9. Rollout

| Phase | Audience | Flag | Success |
|---|---|---|---|
| 0 Internal | eng + 1 partner | `lp.ownership.v1` | tag all internal models |
| 1 Closed beta | 5 partner orgs | per-org | ≥3 orgs reach ≥80% owner coverage in wk1 |
| 2 GA | all | default-on | Documents sign-off shows a real owner (not empty) for ≥50% of generated docs |

## 10. Open questions

- **OQ-1** ✅ Simple tagging, no inheritance/override (operator 2026-05-24).
- **OQ-2** ✅ Bulk "tag all in workspace" included (writes tags, not a relationship).
- **OQ-3** Standalone vs fold into the **E Governance** pillar? (Accountability ≠ access; lean standalone — open for PO.)
- **OQ-4** Suggest likely owners from the permission/activity graph, or stay fully manual in v1? (Lean: suggest, human confirms.)

## 11. Acceptance checklist for `/build-feature`

- [ ] Data contract (§6.1) accepted by platform team
- [ ] OQ-3 / OQ-4 answered
- [ ] Coverage-dots + bulk-tag UX signed off
- [ ] Doc sign-off empty-state behavior confirmed
- [ ] Mockup `/ownership` reviewed by operator (done — simplified 2026-05-24)
- [ ] PRD tagged `v1.0`, linked from `/build-feature` issue

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/ownership`
**Screen narrative:** `docs/screens/ownership.md` · **PO review:** `public/review/ownership.html`
