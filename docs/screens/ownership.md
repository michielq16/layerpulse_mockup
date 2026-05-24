# Screen: Ownership — role tagging (Owner / SME / Steward)

**Pillar:** Governance & Compliance (the manual-accountability foundation other surfaces consume)
**Persona:** Both — partner (accountability per customer tenant) + direct customer
**Value-loop quadrant:** Ingest (manual capture) — the human judgement no Fabric API exposes
**Decision the user makes:** "Who's accountable for this model — and where are the gaps I need to fill before an audit / before it breaks?"
**Data joins required:** None upstream — this *is* the upstream. LP DB is the source of truth; it joins into the Documents sign-off and the partner Team & Seats coverage.
**Sample data:** `DATA.ownership` in `src/data.jsx` — workspaces · AAD user pool · per-model role tags (`rolesPerModel`) · audit log.

## Why this exists

Fabric tells us who has **permissions** (workspace Admin/Member, dataset Build/Read). It does **not** tell us who's **accountable**: who owns the model, who's the subject-matter expert, who stewards it for governance. That mapping is human judgement, and no API carries it. Ownership is where a person captures it once, and it flows into the Documents cover + sign-off block and the partner-portal coverage view.

## The model — simple tagging (no inheritance, no overrides)

**Tag an item with someone = covered. Not tagged = a gap, shown in the dots.** That's the whole model. There is deliberately **no** workspace-default inheritance, **no** per-model/per-report override, and **no** resolution rule — that machinery was cut as complexity that didn't earn its keep (operator decision 2026-05-24). Scale is handled by a **"tag all models in a workspace"** shortcut, which simply writes the same tag across the workspace's models — it is a bulk write, not a persistent relationship to maintain.

Three roles per model: **Owner** (accountable), **SME** (subject expert), **Steward** (maintains/reviews; can be several).

## Happy path

1. User lands on `/ownership`. Header + `+ Tag owner` CTA.
2. **5-KPI strip:** Workspaces · Owners tagged (/workspaces) · No owner · Coverage gaps · Stewards active.
3. **Ownership-by-workspace table:** workspace · env · owner (avatar + name, or "Untagged · Tag →") · **role coverage** · last reviewed · status · ⚙.
4. **Role coverage cell** — one line per role: the role **word** + a dot per model in the workspace; filled dots = models with that role tagged, colored by ratio (all = green · ~half = amber · few = red · none = grey). The dots are the count — no fractions, no letter codes.
5. The ⚙ on a row opens the **tag drawer** (tag Owner / SME / Stewards across that workspace's models — the bulk shortcut). Per-model tagging happens on the model's Ownership tab.
6. **Activity (audit log):** dated who/what changes.

## Edge states (minimum 2)

- **Untagged workspace:** rose-tinted "No owner" status + inline "Tag →".
- **No models in workspace:** coverage cell reads "no models."
- **Partial coverage:** amber/red dots per role surface the gap directly; the "Coverage gaps" KPI counts workspaces missing any role.
- **Review overdue:** amber status pill.
- **ESC / backdrop:** closes the drawer.

## Components used

- `StatCard` × 5 (KPI strip) · `lp-grid-5`
- `own-ws-table` / `own-ws-row` — workspace table (7 columns; Overrides column removed)
- `RoleCoverageCell` — per-role dots (`role-cov-cell` / `role-cov-row` / `role-cov-name` / `rc-dot` tiers)
- `own-avatar` · `own-status` pill · `own-audit` log
- tag drawer (shared right-side shell) + role/steward form atoms

## How it feeds other surfaces

- **Documents** — the resolved Owner + Domain credit the cover; Owner + Stewards render the back-page sign-off. Untagged → explicit "No owner assigned — add via /ownership" (never fabricated).
- **Partner portal · Team & Seats** — "covered vs gap" rolls up to the partner-side coverage view.

## Notes for LP-side PRD authoring

- Storage collapses to **one association table** — e.g. `model_role_tags(model_id, role, user_email, set_by, set_at)` with `role ∈ {owner, sme, steward}` (steward many-per-model). No `workspace_owners` default rows, no `model_owner_overrides`, no resolution layer.
- Coverage = counts over `model_role_tags`; a "gap" = a model missing a role tag. Bulk "tag all in workspace" = a loop of inserts, not a stored default.
- `role` is a small controlled vocabulary; keep append-only if it ever grows.
