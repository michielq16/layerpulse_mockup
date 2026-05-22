# Screen: Portfolio command center — fix-first action queue

**Pillar:** FinOps-led, cross-pillar (Quality + Governance findings feed the same queue)
**Persona:** Partner (primary) — managing 10–50 customer Fabric tenants
**Value-loop quadrant:** Render — over the `getPartnerPortfolio` JOIN (the cross-tenant aggregation)
**Decision the user makes:** "Across all my customers, what do I fix first — and for which customer — before Tuesday's QBR?"
**Data joins required:** `recommendations × wasted_spend × capacity throttling × dormant_reports × ownership × F-2 access state`, aggregated across every customer env scoped by `partners.partner_id`. No Fabric API exposes a cross-tenant action ranking — Microsoft's portals are tenant-scoped.

**Iteration, not redesign.** This extends the existing `/portfolio` (route unchanged). The roster, aggregate StatCards, customer drill-sheet, and F-2 activity feed are kept. The change adds a **fix-first action queue** as the new hero and **folds the old "worst movers" section into it** (action-level is more decision-dense than customer-level).

**Sample data:** `DATA.partnerPortfolio.fixFirst` in `src/data.jsx` — 10 actions across 7 customers spanning 8 types (throttling · wasted spend · refresh failure · model bloat · access loss · ownership gap · doc coverage · cert expiry), 3 pillars.

## Why this exists

The vision names the partner-portfolio view as the moat (`getPartnerPortfolio` — "the only place a partner sees the whole portfolio at once"). The old `/portfolio` showed *how customers are doing* (a roster) but never *what to do first across them*. The command center closes that: one €-ranked queue of discrete, actionable fixes, each tied to the customer it belongs to. It is the second "wow" screen after Documents.

## Happy path

1. Partner lands on `/portfolio`. Aggregate StatCards (customers · spend/mo · throttling · health) unchanged.
2. **Fix-first queue** is the hero. Headline: **"€X/mo recoverable"** — the sum of quantified € impact across open actions (the QBR number).
3. Each row, top-down: rank · type icon (severity-toned) · what to do (one line) · customer + env + pillar pill + type · € impact · primary CTA + Snooze + Mark-resolved.
4. **Sort** toggles **Priority** (default) vs **€ impact**. Priority blends € with severity so a critical non-€ item (e.g. lost partner-read access) ranks above a smaller € item — visibility loss is urgent even with no € attached.
5. **Pillar filter** chips (All / FinOps / Quality / Governance) narrow the queue.
6. Partner works top-down: clicks the CTA (Act as / Re-invite / Open issue / Assign owner / Generate docs / Open settings) → drops into the right customer context, or **Snoozes** (7d) / **Marks resolved** (humans-in-the-loop — never auto-actioned).
7. Roster + F-2 activity remain below for the per-customer and event-log views.

## Ranking model

```
priority = euro != null ? euro : severityWeight(sev)   // critical 900 · warning 300 · info 80
€-sort   = euro desc (non-€ actions sink)
recoverable headline = Σ euro over open (non-snoozed, non-resolved) actions
```

## Edge states (minimum 2)

- **Queue clear for filter:** "Queue clear for this filter. Nothing to action — switch the pillar filter or unsnooze items below." (never "No data")
- **Snoozed/resolved:** footer shows "N snoozed · M resolved"; "Show snoozed" reveals muted rows with a **Restore** action. Resolved are archived from the count.
- **Non-€ action:** € column renders an italic muted label (`visibility lost` / `audit risk` / `expires 21d`) instead of a number — still ranked by blended priority.
- **Access-revoked customer:** surfaces as a critical `Access lost` row with a **Re-invite** CTA (mirrors the existing roster's blocked-visibility state).

## Components used

- `StatCard` × 4 (kept) — aggregate strip
- `FixFirstQueue` (new) — `ff-*` styles in `user-intel.css`
- `chip` row (pillar filter + sort) — existing chip primitive
- Row: `ff-icon` tone dot · `ff-pill` pillar tag · `ff-euro` (num/soft) · `btn` CTA + `ff-icon-btn` ghost icon buttons (Snooze `archive` / Resolve `check`)
- Existing roster (`pf-card`) + `CustomerSheet` + F-2 feed (`pf-act-*`) — unchanged

## Deferred to Phase 2 (per Phase-0 decision)

- **"Build QBR pack from selected actions"** — multi-select queue rows → export an evidence bundle (ties to Documents + Audit). Noted, not built in v1.

## Notes for LP-side PRD authoring

- Queue is a **read-side aggregation**, not a new table: union per-pillar findings (`recommendations`, `computeWastedSpend`, throttling from capacity telemetry, dormant from `fabric_reports` once T1.8 lands, ownership gaps from the ownership layer, F-2 access state). Snooze/resolve need lightweight per-action state (`partner_action_state(action_key, partner_id, status, snoozed_until, resolved_at, resolved_by)`).
- `action_key` must be stable across cron runs (type + customer_env + object_ref) so snooze/resolve persist.
- The € figures reuse existing `shareOfBill` / `computeWastedSpend` math — don't invent a new cost model.
