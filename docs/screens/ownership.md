# Screen: Ownership — workspace defaults + per-model overrides

**Pillar:** Governance & Compliance (foundation for every other LP surface)
**Persona:** Both — partner (sees ownership per customer), direct customer (assigns its own)
**Value-loop quadrant:** Ingest (manual entry) — operator captures business judgement that no Fabric API exposes
**Decision the user makes:** "Who's accountable for this workspace/model? Who do I call when it breaks? Whose signature ships on the auditor doc?"
**Data joins required:** None upstream — this IS the upstream. LP DB is the source of truth.
**Sample data:** `DATA.ownership` in `src/data.jsx` — 12 workspace defaults · 7 per-model overrides · 8 AAD users · 5 role labels · 8 audit-log entries.

## Why this exists

Fabric tells us *who has permissions* (workspace admin/member, dataset build/read). It does NOT tell us:
- Who's the **business-accountable owner** of a workspace
- Who's the **BI steward** for governance reviews
- Who to call when a model breaks at 02:00 UTC
- Who signs off on the auditor doc for SOC 2 evidence

That mapping is human business judgement. Every prior LP screen treated "owner" as a string column on the model — but that string had nowhere to come from. This is the form that fills it.

**Workspace-default inheritance** is the 90% case: a workspace has a lead, and every model in that workspace inherits them.

**Per-model overrides** handle the long tail: workspace admin gives publish rights to a downstream user → they build a report → they become the de-facto owner of *that* report, while the workspace lead remains accountable for everything else. The "why" field captures the context that justified the exception.

## Happy path

1. User lands on `/ownership`. Header: title + sub + `+ Assign default` CTA.
2. **5-KPI strip:** Workspaces · Defaults set · Missing defaults · Per-model overrides · Stewards active.
3. **Workspace defaults section** (table):
   1. Filter row: search · status chips (All / Current / Review due / No owner) · env pills (PROD / UAT / DEV / All).
   2. Grid: workspace name · env badge · default lead (avatar + name + email) · stewards count · overrides count (clickable, opens drawer) · last reviewed · status pill · row settings icon.
   3. **No-owner rows get a rose-tinted background and inline "Assign →" CTA.**
   4. Edit icon opens drawer.
4. **Per-model overrides section:**
   1. List of `<own-override>` cards — left-edge violet accent.
   2. Each shows: model name + workspace · violet "Override" pill · the **why** text (audit-quality context) · "Owner now / Set on / Set by" meta.
   3. Actions per card: Open model · Edit override.
5. **Activity (audit log):** dated rows of every ownership change — who · when · what changed.

## Drawer (Assign default / Edit default / Edit override / View workspace overrides)

Same shell across all variants: right-side drawer (560px), sticky head + body + foot.

**Default form fields:**
- Workspace (locked if editing)
- Default lead (select from AAD pool — `DATA.ownership.aadUsers`)
- Role grid (2×3): Data lead / BI steward / Backup owner / Source DBA / Business owner — each with description blurb
- Stewards (multi-select; "+ Add steward" affordance)
- Review cadence (Quarterly default / Monthly / Annually / On change)

**Override form fields:**
- Override owner (select from AAD)
- **Why** (textarea, required) — audit-quality context. Stays attached forever.

## Edge states

- **No workspace default set:** rose-tinted row + inline "Assign →" link. Until set, every model in that workspace falls through to the missing-default state (Documents modal's auditor render flags it explicitly).
- **Status = Review overdue:** amber pill + nudge to re-review.
- **Empty filter result:** "No workspaces match. Adjust filters above."
- **No overrides yet (clean workspace):** override section renders empty with "No overrides — workspace default is canonical."
- **ESC + backdrop click:** closes drawer.

## ModelOwnership — inline on `/models/[id]/ownership` (5th tab)

Same sample data, scoped view:

- **Inherited from workspace** block — read-only card showing the workspace default (lead · stewards · last reviewed · status). "Override" action prominent if you're going to break inheritance.
- **Override for this model** block — empty by default (inherits). When set, renders an `<own-override>` card with why + meta + Edit affordance.
- **Activity** block — audit-log entries touching this model OR its workspace.

## Components used

- `StatCard` × 5 — KPI strip
- `lp-grid-5` (new) — 5-column KPI grid (collapses to 3 below 1200px)
- `lp-card-flush` + filter row — search + status chips + env pills
- `own-ws-table` + `own-ws-row` (new) — workspace defaults grid
- `own-avatar` (new) — initials-circle, reused everywhere
- `own-status` (new) — current/stale/missing pill (emerald/amber/rose)
- `own-override` (new) — left-violet-accent override card
- `own-override-pill` (new) — small "Override" badge
- `own-audit` + `own-audit-row` (new) — date/who/change log
- `own-drawer-backdrop` + `own-drawer` (new) — shared right-side drawer shell (reused by Glossary)
- `own-role-grid` + `own-role-tab` (new) — role-picker 2×3 grid
- `own-form` + `own-form-row` (new) — drawer form atoms
- `model-own-card` + `model-own-card-head` + `model-own-card-meta` (new) — inline block for the model-tab variant

## Metrics surfaced

- Workspaces · Defaults set / total · Missing defaults · Per-model overrides / total models · Stewards active
- Per-row: stewards count · overrides count · last reviewed date

## Benefit hypothesis

- Within 30 days of shipping, **Doc Coverage % rises 5-10 points** because the Documents modal can populate the Auditor render's Owners + Sign-off page without falling back to empty state.
- Partners can answer "who owns X" for any customer model in <5s (was: 10-minute Slack thread).
- Sets the data shape for downstream surfaces — Documents (auditor preset) · Audit & Compliance (priority #4) · Alerts (route ownership escalations to the right person).

## Open questions / future iterations

- **Bulk reassign** — "Marc Q just left, reassign all his models to Alex". Defer; needs careful UX.
- **AAD group sync** — pull workspace members from Graph and pre-fill the select. Currently mocked from `DATA.ownership.aadUsers`.
- **Approval workflow** — should role changes require a second steward to approve? Defer until SOC 2 audit feedback comes in.
- **Notifications** — "Your workspace default ownership has been reassigned" — out of scope; wire after `/alerts` integration.

## Notes for LP-side PRD authoring

- Storage shape: `workspace_owners(workspace_id, lead_email, role_label, last_review_at, review_cadence, set_by, set_at)` + `model_owner_overrides(model_id, lead_email, why, set_at, set_by)` + `model_owner_audit_log(workspace_id, model_id, change_type, details, who, at)`.
- `role_label` is a controlled vocabulary (5 values today). Add to a `role_labels` table for extensibility, but treat as append-only (renaming breaks audit log).
- The "Why" override field is the differentiator. Don't let users skip it — the audit value of overrides is *why*, not *who*.
