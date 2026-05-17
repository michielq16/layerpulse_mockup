# Screen: Users (new sketch · `/users-new`)

**Pillar:** Governance + FinOps (joint)
**Persona:** Partner (Y1) — managing 10–50 customer tenants and doing license rationalization + SOC 2 prep across them. Also useful for direct mid-market customers (Y2) running their own admin.
**Value-loop quadrant:** **Validate** (the row is the evidence; the sheet is the proof)
**Decision the user makes:**
- "Reclaim this PPU seat — €200/mo and 184 days dormant"
- "Strip Admin from `svc-finance-runner` before auditor Tuesday — service account with 8 workspace-admin roles and zero activity"
- "Investigate Daniel Okafor — 312 exports / 30d + 9 off-hours sessions + Admin on Sales-Prod"

**Data joins required:**
```
user_licenses
  × activity_events (last_active, distinct workspaces 30d, distinct reports 30d, exports/30d, off-hours sessions)
  × workspace_roles (admin counts per UPN)
  × security_group_membership (inherited grants for the matrix)
  × tenant_settings (off-hours window definition)
```
No Microsoft surface joins these together. Entra hides UPNs by default and shows display name; Fabric admin portal shows roles per workspace, never per user. LayerPulse is the join.

## Why a new page instead of editing `/users`

Operator decision (2026-05-17): keep the existing `/users` (department ribbon + capacity-cost leaderboard) intact. Build a new route `/users-new` as the sketch space; cherry-pick the parts that win into the real product later.

## Happy path

1. Partner lands on `/users-new` from a "review high-risk identities" prompt in the Intelligence sidebar or directly from sidebar nav.
2. Eye goes top-right: **`Access risk · high: 4`** StatCard (rose tone) — this is where the partner clicks.
3. Risk chip-filter snaps to **High risk** (4 rows). Sort defaults to **Risk first**.
4. Row 1: `svc-finance-runner@contoso.onmicrosoft.com` — Pro $10/mo, dormant 92d, 8 admin roles, "Service account · Admin on 8 workspaces". Click the row.
5. Right Sheet slides in. UPN in the header. 4 tabs: Overview / Permissions / Activity / Risk.
6. **Permissions** tab: workspace × role matrix shows the 8 admin assignments, all "Direct", all "92d ago". Rose left-edge accent on each — they're all stale.
7. **Risk** tab: 3 cards (service account / no activity 92d / off-hours pattern 03:00 UTC) with placeholder evidence rows.
8. Bottom-right: **`Reclaim Pro (€10/mo)`** appears in rose because the user is dormant >60d AND has a paid license. Partner files the reclamation ticket.

## Edge states (minimum 2)

- **Empty roster (no users yet)** → table empty-state copy: "No users have signed in yet. Run an introspection from Settings or wait for the first activity_events batch (1h windows)." Never "No data."
- **Loading** → skeleton mirrors the table: 6 rows × 7 columns of bone-colored bars + 4 StatCard skeletons.
- **Permission-denied (partner-of-record without read on this tenant)** → row is greyed, badges hidden, UPN replaced with `••••@<tenant>`, drill-down is disabled with tooltip "Customer must grant partner-read scope. See Connections."
- **No risk signals on a user** → Risk tab shows shield-check empty state: "No risk signals. LayerPulse checks dormant-admin, over-privilege, export-heavy, and off-hours patterns nightly." Not "—".
- **User has license cost but no activity** → Overview tab swaps the sparkline card for an inline note: "No activity in the last 30 days. License cost still billing at €X/mo." Foot CTA becomes "Reclaim".

## Filter / sort behavior

- **Search**: matches against UPN ∪ display name ∪ department (case-insensitive substring). UPN-first is the design choice — partners reference by UPN.
- **Risk chips**: All / High / Medium / OK — with counts. Mutually exclusive selection.
- **License dropdown**: All / Free / Pro / PPU / Fabric F1 — sourced from distinct SKUs in the data.
- **Activity dropdown**: Any / Active (≤30d) / Dormant 30–60d / Dormant 60d+.
- **Sort**: Risk first (default) / License $ desc / Most dormant / UPN A–Z.

## Components used

- `StatCard` × 4 (tones: sky / amber / violet / rose)
- `Sparkline` (Overview tab, only when user has >0 activity)
- `Avatar` (reused from `UserIntel.jsx`)
- `chip-row` + `model-tabs` (existing primitives)
- New: `usr-row` grid table (UPN-first, 7-col), `usr-risk-pill`, `usr-sheet` overlay drawer, `usr-mtx-row` permissions matrix, `usr-risk-card` for the Risk tab

## What's deliberately not in this sketch

- **No bulk operations.** A "select-multiple-and-reclaim" affordance is tempting but premature — every reclamation is an individual decision with risk; we want the partner reading the Risk tab before they pull a license, not slamming a checkbox column.
- **No charts beyond the per-user sparkline.** This is a forensic surface, not a dashboard. The Adoption page already serves the rollup.
- **No "AI-suggested actions" without humans-in-the-loop.** The bottom-right Reclaim CTA is rule-derived (license cost > 0 AND dormant > 60d) — deterministic, auditable, not "AI says so".
- **No mobile design.** Target is 1440×900 dual-monitor. Mobile is "doesn't break", not "designed-for".

## Cherry-pick candidates (operator decides what wins later)

| Element | Verdict prediction |
|---|---|
| UPN as primary identifier | Strong keep — unique pain point partners can't solve elsewhere |
| Workspace × role matrix in Permissions tab | Strong keep — replaces the existing "Access" sidebar page eventually |
| 4 StatCards: Seats / Wasted / Admins / High-risk | Keep top 3; "Wasted" is the FinOps hook |
| Right-side Sheet with 4 tabs | Likely keep, but maybe collapse Activity into Overview |
| Risk chip-filter row | Strong keep — drives the page |
| Reclaim CTA in sheet footer | Keep only if backed by a real reclamation flow; otherwise becomes vapor |
| Departmental ribbon (from `/users`) | Cherry-pick from the **existing** page — does not appear here |
