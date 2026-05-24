# PRD — Ownership & Stewardship (role tagging)

> ⚠️ **SIMPLIFIED 2026-05-24 — pending full rewrite.** The **workspace-default inheritance + per-model/per-report override** model (incl. the `model_owner_overrides` table, the resolution rule, and the required "why") was **cut** by operator decision — too complex for the value. The v1 model is **simple tagging**: each model carries Owner / SME / Steward tags; tagged = covered, untagged = a gap (shown in per-role coverage dots). A "tag all models in a workspace" action is a bulk write, not a relationship. **Data contract collapses** to one association table (e.g. `model_role_tags(model_id, role, user_email, set_by, set_at)`) — no overrides/defaults/resolution layer. Functional requirements, data contract, and joins below referencing inheritance/overrides are **superseded**; this PRD is the design brief and will be re-authored LP-side via `/prd` against the simplified model.

| | |
|---|---|
| **Status** | Draft · ready for operator review |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (foundation — unblocks the Documents auditor render + sign-off) |
| **Pillar** | Governance & Compliance (P3) — foundation for every other LP surface |
| **Persona** | Both — partner (ownership per customer tenant) + direct customer (assigns its own) |
| **Mockup source** | `docs/screens/ownership.md` · live at `/ownership` + `ModelOwnership` tab on `/models/[id]/ownership` |
| **Real-product surface** | `app.layerpulse.com/ownership` (new route) + model-detail 5th tab |
| **Depends on** | LP DB (no Fabric API exposes business accountability) · AAD user directory (lead/steward pickers) · workspace inventory (Scanner) |
| **Blocks** | Documents auditor/analyst render (Owners + Sign-off page) · Audit & Compliance evidence pack · Alerts ownership-escalation routing |

---

## 1. Problem

Fabric tells us *who has permissions* — workspace Admin/Member/Contributor/Viewer, dataset Build/Read. It does **not** tell us who is **business-accountable**: who owns the workspace, who's the BI steward for governance reviews, who to call when a model breaks at 02:00 UTC, or whose signature ships on the auditor doc for SOC 2 evidence.

That mapping is human business judgement, and no Fabric API exposes it. Every prior LP screen treated "owner" as a free-text string column on the model — but that string had nowhere to come from, so it was always empty. The Documents auditor render falls back to an explicit empty-state ("No owner assigned") precisely because this foundation doesn't exist yet.

Permission ≠ accountability. A downstream user can have Build rights on a dataset without being responsible for it; a workspace admin can be accountable for 40 models without touching any of them daily. LayerPulse already holds the permission graph — capturing the accountability layer on top is what turns "who *can* touch this" into "who *answers* for this."

## 2. Goals · non-goals

### Goals (v1)

- **G1.** Capture business accountability per workspace: a **default lead** + role assignments (Data lead / BI steward / Backup owner / Source DBA / Business owner) + review cadence.
- **G2.** **Workspace-default inheritance** — every model in a workspace inherits its lead/stewards (the 90% case; zero per-model effort).
- **G3.** **Per-model overrides** for the long tail, each carrying a required **"why"** (audit-quality context that stays attached forever).
- **G4.** A **role-coverage** signal per workspace (single dot per role: filled / partial / low / empty) so gaps are visible before an auditor finds them.
- **G5.** An **append-only audit log** of every ownership change (who · when · what), surfaced both globally and scoped to a model.
- **G6.** Feed the Documents modal: cover credit (Owner + Domain) + back-page **sign-off block** (Owner + Stewards), degrading to an explicit empty-state when unset — never fabricated.
- **G7.** Manual entry first; AAD pre-fill is a soft assist, not a gate.

### Non-goals (v1)

- **NG1.** **Bulk reassign** ("Marc left — move all his models to Alex"). Phase 2; needs careful UX.
- **NG2.** **AAD group sync** — auto-pull workspace members from Graph to pre-populate. Mocked from `DATA.ownership.aadUsers` in v1.
- **NG3.** **Approval workflow** — second-steward sign-off on role changes. Defer until SOC 2 audit feedback.
- **NG4.** **Notifications** ("your workspace ownership was reassigned"). Wire after `/alerts` integration.
- **NG5.** Editing the Fabric permission graph from LP (LP captures accountability; it never mutates Fabric ACLs — that's a prohibited surface).
- **NG6.** Inferring ownership from activity heuristics as canonical (v1 may *suggest* from usage, but a human always confirms).

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **Data steward / governance lead** | "Set a lead per workspace once and have every model inherit it." → `/ownership` → Assign default → Finance-Prod → Alex Rivera + stewards + Quarterly cadence. |
| **Partner consultant** | "Answer 'who owns customer X's model Y' in <5s for a QBR." → `/ownership` filtered to the customer tenant. |
| **Workspace admin** | "A downstream user built a report and now de-facto owns it — record that exception with the reason." → per-model override + required why. |
| **Auditor-facing partner** | "Ship the SOC 2 doc with a real sign-off block, not a blank." → ownership flows into the Documents auditor render automatically. |

## 4. 5-gate scorecard

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Governance (accountability authority) — the foundation that makes Quality docs trustworthy and Compliance evidence shippable |
| **G2 · JOIN** | `workspace_owners × model_owner_overrides × semantic_models × aad_users` — no Fabric API exposes business accountability; LP is the only place joining the permission graph with the human-judgement layer |
| **G3 · Persona** | Steward assigns once; partner answers ownership instantly per customer; auditor-facing partner ships a real sign-off |
| **G4 · Differentiator** | **Workspace-default inheritance + audited per-model overrides** across a partner's whole portfolio — Fabric shows permissions per tenant with no accountability concept, no portfolio view, no audit trail of *why* |
| **G5 · Decision** | "Who's accountable for this workspace/model? Who do I call? Whose signature ships on Tuesday's auditor doc?" — answered in <5s |

## 5. Information architecture

```
/ownership
├── 5 StatCards (workspaces / defaults-set / missing-defaults / per-model-overrides / stewards-active)
├── Workspace defaults
│   ├── filter row (search · status chips All|Current|Review-due|No-owner · env pills PROD|UAT|DEV|All)
│   └── table: workspace · env · default lead (avatar) · role-coverage dots · overrides (clickable) · last-reviewed · status · ⚙
│        └── no-owner rows: rose-tinted + inline "Assign →"
├── Per-model overrides
│   └── override cards (violet left-accent): model · workspace · "Override" pill · WHY · owner-now/set-on/set-by · [Open model] [Edit]
└── Activity (audit log)  — dated who/when/what rows

drawer (Assign default · Edit default · Edit override · View workspace overrides)  — shared 560px right shell
  ├── default form: workspace (locked on edit) · lead (AAD) · role grid 2×3 · stewards (multi) · review cadence
  └── override form: override owner (AAD) · WHY (required textarea)

/models/[id]/ownership   (5th model tab — ModelOwnership)
├── Inherited-from-workspace card (read-only: lead · stewards · last-reviewed · status · prominent "Override")
├── Override-for-this-model block (empty=inherits; set=override card + Edit)
└── Activity block (entries touching this model OR its workspace)
```

Workspace-default inheritance is the spine (operator decision 2026-05-20): a workspace has a lead; models inherit; you only do extra work where reality diverges.

## 6. Functional requirements

### 6.1 Ownership dashboard (`/ownership`)

- **FR-OW-1** 5 StatCards: workspaces · defaults-set / total · missing-defaults · per-model-overrides / total-models · stewards-active. Renders on `lp-grid-5` (collapses to 3 below 1200px).
- **FR-OW-2** Workspace-defaults table: workspace name · env badge · default lead (avatar + name + email) · **role-coverage** cell · overrides count (clickable → drawer) · last-reviewed date · status pill · row ⚙ → edit drawer.
- **FR-OW-3** Filter row: search (workspace ∪ lead) + status chips (All / Current / Review due / No owner, with counts) + env pills (PROD / UAT / DEV / All).
- **FR-OW-4** **No-owner rows** get a rose-tinted background and an inline "Assign →" CTA. This is the populate-the-foundation nudge.
- **FR-OW-5** **Role coverage** renders as one colored dot per role (operator-chosen variant A, 2026-05-20): `full` (all roles filled, emerald) · `partial` (lead set, gaps, amber) · `low` (mostly empty, rose) · `empty` (nothing, slate). Same indicator on the Workspaces surface.
- **FR-OW-6** Per-model overrides section: violet left-accent cards showing model + workspace · "Override" pill · the **why** text · owner-now / set-on / set-by meta · actions [Open model] [Edit override]. Empty state: "No overrides — workspace default is canonical."
- **FR-OW-7** Activity (audit log): dated rows of every ownership change — who · when · what changed.

### 6.2 Drawer (shared shell, 4 variants)

- **FR-DR-1** Single right-side drawer shell (560px, sticky head/body/foot) reused for Assign default / Edit default / Edit override / View workspace overrides. ESC + backdrop click close.
- **FR-DR-2** Default form: Workspace (locked when editing) · Default lead (select from `aad_users`) · **role grid 2×3** (Data lead / BI steward / Backup owner / Source DBA / Business owner, each with a description blurb) · Stewards (multi-select, "+ Add steward") · Review cadence (Quarterly default / Monthly / Annually / On change).
- **FR-DR-3** Override form: Override owner (AAD select) · **Why** (textarea, **required** — submit blocked if empty). The why is the differentiator; never optional.
- **FR-DR-4** (Soft assist) Lead/steward selects may surface AAD users who actually admin/use the workspace first, ranked — but no auto-commit; a human picks.

### 6.3 Model tab (`/models/[id]/ownership`)

- **FR-MT-1** "Inherited from workspace" read-only card: workspace default lead · stewards · last-reviewed · status. Prominent "Override" action.
- **FR-MT-2** "Override for this model" block: empty by default (shows inheritance); when set renders the override card with why + meta + Edit.
- **FR-MT-3** Activity block: audit-log entries touching this model OR its parent workspace.

### 6.4 Document binding

- **FR-DB-1** Documents modal cover credits the resolved **Owner** + **Domain** for the model (override if present, else workspace default).
- **FR-DB-2** Auditor/Analyst renders include a **sign-off block** = resolved Owner + Stewards as signature lines.
- **FR-DB-3** When no ownership is captured, the doc renders an explicit "No owner assigned — add via /ownership" empty-state. **Never a fabricated name.** (Degradation rule from the section catalogue.)

### 6.5 Data contract

```sql
CREATE TABLE workspace_owners (
  workspace_id   TEXT NOT NULL,
  tenant_id      TEXT NOT NULL,
  lead_email     TEXT,                 -- default lead; null => no-owner (rose row)
  role_label     TEXT NOT NULL,        -- controlled vocab (5 today); see role_labels
  last_review_at TIMESTAMPTZ,
  review_cadence TEXT NOT NULL,        -- quarterly|monthly|annually|on_change
  set_by         TEXT,
  set_at         TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (workspace_id, role_label)
);

CREATE TABLE workspace_stewards (    -- a workspace default can have N stewards
  workspace_id TEXT NOT NULL,
  steward_email TEXT NOT NULL,
  added_by     TEXT,
  added_at     TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (workspace_id, steward_email)
);

CREATE TABLE model_owner_overrides (
  model_id    TEXT PRIMARY KEY,       -- one override row per model
  lead_email  TEXT NOT NULL,
  why         TEXT NOT NULL,          -- required; the audit differentiator
  set_at      TIMESTAMPTZ NOT NULL,
  set_by      TEXT
);

CREATE TABLE model_owner_audit_log (  -- append-only
  id           BIGSERIAL PRIMARY KEY,
  workspace_id TEXT,
  model_id     TEXT,
  change_type  TEXT NOT NULL,         -- assign_default|edit_default|set_override|edit_override|remove
  details      JSONB NOT NULL,        -- before/after
  who          TEXT NOT NULL,
  at           TIMESTAMPTZ NOT NULL
);

CREATE TABLE role_labels (            -- controlled, append-only (rename breaks audit log)
  label TEXT PRIMARY KEY,
  description TEXT
);
CREATE INDEX moo_model_idx ON model_owner_overrides (model_id);
CREATE INDEX mal_model_idx ON model_owner_audit_log (model_id);
CREATE INDEX mal_ws_idx    ON model_owner_audit_log (workspace_id);
```

`role_label` is a controlled vocabulary (5 values today) — keep it append-only; renaming breaks the audit log's historical references.

### 6.6 Joins required (LayerPulse-only)

```
semantic_models
  ⋈ workspace_owners        (resolve default lead/role per model's workspace)
  ⋈ workspace_stewards      (resolve stewards for sign-off block)
  ⋈ model_owner_overrides   (override wins over workspace default)
  ⋈ aad_users               (avatar / name / email display)
resolution: override.lead_email ?? workspace_owners.lead_email ?? NULL(empty-state)
```

## 7. States · edge cases

| State | Trigger | UI |
|---|---|---|
| No workspace default | `lead_email IS NULL` | rose-tinted row + inline "Assign →"; all models in it fall through to doc empty-state |
| Review overdue | `last_review_at` past cadence | amber status pill + re-review nudge; candidate for `/alerts` |
| Role coverage partial/low | some roles unfilled | amber/rose coverage dot; hover reveals which roles are missing |
| Empty filter result | filters exclude all | "No workspaces match. Adjust filters above." |
| No overrides (clean) | 0 override rows | "No overrides — workspace default is canonical." |
| Override missing why | submit with empty why | inline error; submit blocked (FR-DR-3) |
| Model with override + workspace also changes | both exist | override always wins; model tab shows both, flags inheritance is broken |
| Drawer dismiss | ESC / backdrop | closes without save |

## 8. Telemetry

| Event | Properties |
|---|---|
| `ownership.default_assigned` | workspace_id, role_label, has_stewards, cadence |
| `ownership.default_edited` | workspace_id, changed_fields |
| `ownership.override_set` | model_id, workspace_id, why_len |
| `ownership.override_edited` | model_id |
| `ownership.coverage_viewed` | workspace_id, tier (full\|partial\|low\|empty) |
| `ownership.filter_applied` | filter_type, value |
| `ownership.doc_signoff_rendered` | model_id, resolved_from (override\|default\|empty) |

## 9. Rollout

| Phase | Audience | Flag | Success |
|---|---|---|---|
| 0 Internal | eng + 1 partner | `lp.ownership.v1` @layerpulse | seed defaults for all internal workspaces |
| 1 Closed beta | 5 partner orgs | per-org | ≥3 orgs set defaults for ≥80% of workspaces in wk1 |
| 2 GA | all | default-on | Documents auditor render shows a real sign-off (not empty-state) for ≥50% of generated docs |

## 10. Open questions

- **OQ-1** Workspace-default-with-per-model-override confirmed (operator 2026-05-20). Single owner per scope; stewards are a list.
- **OQ-2** Should LP *suggest* likely owners from the permission/activity graph (FR-DR-4), or stay fully manual in v1? (Lean: suggest, human confirms.)
- **OQ-3** Bulk reassign UX (NG1) — what's the safe interaction when a person leaves? (Phase 2.)
- **OQ-4** Does Ownership block Documents v1? Sign-off degrades gracefully (FR-DB-3), so Documents can ship first. Confirm sequencing.
- **OQ-5** Role label set — fixed 5 or tenant-extensible `role_labels`? (Mock: fixed 5, append-only.)

## 11. Acceptance checklist for `/build-feature`

- [ ] Data contract (§6.5) accepted by platform team
- [ ] OQ-1 through OQ-5 answered
- [ ] Resolution order (override ?? default ?? empty) + doc-binding empty-state (FR-DB-3) signed off
- [ ] Role-coverage tiers + the single-dot variant reviewed by operator
- [ ] Mockup `/ownership` + model 5th tab reviewed by operator
- [ ] PRD tagged `v1.0`, linked from `/build-feature` issue

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/ownership` · model tab at `https://layerpulze-mockup.vercel.app/models/sales-analytics/ownership`
**Screen narrative:** `docs/screens/ownership.md`
**Related PRDs:** `docs/prds/documents.md` · `docs/prds/glossary.md` · `docs/analysis/fabric-artifact-ownership-conventions.md`
