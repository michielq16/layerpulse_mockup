# Screen: Ownership & Stewardship — governance cockpit (V2)

**Pillar:** Governance & Compliance (the manual-accountability foundation other surfaces consume)
**Persona:** Both — partner (accountability per customer tenant) + direct customer
**Value-loop quadrant:** Ingest (manual capture) — the human judgement no Fabric API exposes
**Decision the user makes:** "What governance risk needs my attention right now — which workspaces / models are missing an owner, an SME, a steward?"
**Data joins required:** None upstream — this *is* the upstream; LP DB is the source of truth and joins into the Documents sign-off + the partner Team & Seats coverage.
**Sample data:** `DATA.ownership` in `src/data.jsx` — workspaces (with `criticality`, `primaryContact*`, `lastUpdate`, `reports`) · AAD user pool · per-model role tags (`rolesPerModel` includes `owner` rows from the V2 bulk-tag simulation) · audit log.

## Why this exists

Fabric exposes *permissions* (workspace Admin/Member/Contributor/Viewer; dataset Build/Read). It does **not** expose **accountability** — who runs the workspace, who explains the metric, who signs off when the auditor asks. That mapping is human judgement; no API carries it. Ownership is where it's captured once and flows into the Documents cover/sign-off and the partner-portal coverage view.

## V2 — what changed (and why)

Three problems with V1: (a) the dot matrix encoded per-model coverage *inside* a workspace row, making population invisible; (b) inheritance + per-model/per-report **override** machinery added complexity without earning its keep; (c) the page felt like an admin table rather than a governance operations center.

V2 cuts all three:

- **Different roles per layer** — Workspace = `Owner + Primary contact`; Semantic model = `Owner + SME + Steward`. Forcing identical roles where they don't fit just makes UX vague.
- **No inheritance, no overrides** — tagging is direct. The bulk "tag all models in workspace" shortcut writes individual tags; it's a write, not a relationship.
- **Cockpit identity** — risk-first default sort, criticality chips, escalation timers ("No owner · 34d"), at-risk filter pill, Ownership-health score with 60-day trend.
- **Two tabs separate the layers** — `[ Workspaces ]  [ Semantic models ]` — resolves the granularity problem cleanly.

## The model

| Layer | Roles | Purpose |
|---|---|---|
| **Workspace** | **Owner** (required) · **Primary contact** (optional) | Operational accountability + escalation/ops contact (often a different person — BI ops lead, platform PM). |
| **Semantic model** | **Owner** · **SME** · **Steward** (multi) | Business-logic accountability + KPI/DAX subject expertise + data quality + change review. |

Tagged = covered; untagged = a gap. The screen sorts gaps to the top by **risk priority** (no-owner > critical > overdue > else).

## Happy path

1. User lands on `/ownership` — sees **5 KPIs** (Workspaces · Health score with trend · At-risk · Review overdue · Stewards active) + the **Workspaces** tab by default.
2. The first rows are the **at-risk ones** (rose left-accent, ⚠ icon, escalation timer "No owner · 34d", `Assign owner →` primary action). Healthy rows sit below.
3. Each workspace row carries: name + **criticality chip** (Critical / Business-critical / Internal / Low) + escalation text · env + `X models · Y reports` · **two role chips** (Workspace owner + Primary contact) · **Model coverage X of Y** (clickable, drills into the Semantic models tab pre-filtered).
4. User can switch to **Semantic models** tab — same row pattern, three role chips, model rows show parent workspace + criticality.
5. Filter pills: All / **At-risk** / Overdue / Critical / Mine. Search across workspace, model, owner, contact.
6. **Tag drawer** opens from the primary action or `⚙` — supports per-model tagging or the bulk "tag all in this workspace" shortcut.

## Edge states

- **No owner (critical)** — rose row, ⚠ icon, escalation timer in days; primary action `Assign owner →`.
- **Review overdue** — amber row, escalation timer; primary action `Review →`.
- **Partial role coverage** (owner ✓ but SME or Steward ✗) — amber row; subtle "No SME" / "No steward" chip.
- **No primary contact set** — shown as `✗ none yet` (subtle, not alarming — it's optional).
- **Workspace with 0 models** — Model coverage cell reads "no models."
- **ESC / backdrop** — closes the drawer.

## Components used

- `StatCard` × 5 (KPI strip)
- `own2-tabs` — tab toggle (Workspaces / Semantic models)
- `own2-filterbar` — search + chip-row + sort dropdown
- `own2-row` — card-table hybrid row (top-line · meta · roles)
- `RoleChip` — role chip with ✓/✗ + name (or "Missing" / "none yet")
- `CritChip` — criticality pill (Critical / Business-critical / Internal / Low)
- `ModelCoverageChip` — workspace-row drill-in to the Models tab
- `OwnershipDrawer` — tag-roles drawer (per-model or bulk-per-workspace)
- `own-audit` / `own-audit-row` — activity log (kept)

## How it feeds other surfaces

- **Documents** — resolved Owner + Domain credit the cover; Owner + Stewards render the sign-off. Untagged → explicit "No owner assigned — add via /ownership" (never fabricated).
- **Partner Portal · Team & Seats** — workspace ownership rolls up to "covered vs gap" per customer tenant.

## Risk priority (default sort)

```
risk(workspace) = (no owner ? +1000) + (criticality: critical +400 | business-critical +200 | internal +50) + (stale ? +150)
risk(model)     = (no owner ? +800)  + (no SME ? +80) + (no steward ? +40)
```

Sort descending. At-risk filter shortcut narrows to non-zero risk.

## Notes for LP-side PRD authoring

- Single uniform schema with `asset_type` enum for future-proofing — see PRD §6.
- App-enforced role set per `asset_type`: `workspace` → `('owner','primary_contact')`; `semantic_model` → `('owner','sme','steward')`.
- Ownership health score = weighted: `ownerWs×0.30 + ownerModel×0.30 + smeModel×0.25 + freshWs×0.15`.
- Inheritance ("new model auto-tags from its workspace") deferred to V2/V3.
