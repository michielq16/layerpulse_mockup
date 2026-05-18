# Screen: Partner Portfolio (`/portfolio`)

**Pillar:** Cross-pillar rollup — FinOps cost + Quality health + Governance risk, scoped to **all customers a partner owns**. This is the F-2 wedge per `product-vision.md`.
**Persona:** **Partner (Y1) — primary.** A Microsoft partner-of-record managing 10–50 customer Fabric tenants. Today they live in Microsoft admin portals tenant-by-tenant; LayerPulse compresses that into a single pane.
**Value-loop quadrant:** **Render** — joins per-tenant Health, Cost, Capacity, and F-2 access state into one grid that nothing else delivers.
**Decision the user makes:**
- "Call Customer X today about the cost spike."
- "Schedule QBRs with the 3 customers slipping on Health Score."
- "Re-invite Margie's Travel — partner-read got revoked Tuesday."
- "Stop worrying about Litware for now — green across the board."

**Data joins required:**
```
customer_envs (partner-of-record FK)
  × capacities          (tier, region, current CU%, throttle events)
  × health_scores       (latest + 7d delta)
  × cost_attribution    (monthly $ per customer + portfolio total)
  × top_issues          (highest severity unresolved finding per customer)
  × invitations         (F-2 invite state: sent / accepted / expired / revoked)
  × activity_events     (F-2 grant/revoke/throttle/SKU-change events)
```
This join is the LayerPulse moat: Microsoft has no concept of "partner-of-record portfolio." Admin portals are tenant-scoped only.

## Why a new top-level route

The mockup was single-customer end-to-end before this. `Overview`, `Capacity`, `Workspaces`, etc. all show one tenant (Contoso). To represent the F-2 partner-portfolio wedge, the partner needs a surface **above** the per-customer screens — a context switch. `/portfolio` is that switch. The sidebar gains a new top-most **Partner** group with this route + 12-customer counter, sitting above the existing customer-scoped Overview.

In the real product, the sidebar would swap entirely between PartnerSidebar and CustomerSidebar based on context (see CLAUDE.md "Locked components"). The mockup approximates this with the new top group; the "Act as {Customer}" CTA in the customer-detail Sheet simulates the F-2 hand-off.

## Happy path — "Monday morning portfolio sweep" (3 min)

1. Partner lands on `/portfolio` first thing Monday. 4 KPI strip immediately surfaces the state of the book:
   - **Customers** · 12 active + 2 invited (pending)
   - **Total spend / mo** · €47,820 with 14-day sparkline
   - **Throttling now** · 2 (rose) — the live alert that needs reaction
   - **Aggregate Health** · 71 / 100 (−3 vs last week, amber tone) · 7 critical issues open
2. Eye drops to **Worst movers · week-over-week** below the grid. 5 rows ranked by combined health-Δ + cost-Δ + wasted-spend-Δ:
   - Trey Research (−12 health, capacity migration unstable) — `Schedule call`
   - Fabrikam (−8 health, +24% cost, throttling 12h/wk) — `Schedule call`
   - Margie's Travel (−4 health, partner-read REVOKED) — `Re-invite`
   - Adventure Works (refresh failure rate climbed 11% → 18%) — `Open issue`
   - Proseware (14 dormant Power BI reports still consuming refresh CU) — `Open report`
3. Partner clicks `Schedule call` next to Fabrikam → leaves the screen (real-product would open a Cal.com / scheduler integration; mockup wires to `setRoute('overview')` as the "Act as Fabrikam" simulation).
4. Comes back, scans the **customer grid** (12 tiles, 3×4 on desktop). Three tiles have rose left-edge accents (throttling or critical). Filter chip row above the grid surfaces them by category — clicks `Critical` → 4 tiles remain.
5. Clicks the Wide World Importers tile (sky/green) just to verify. Right-side **Customer Sheet** slides in (~820px):
   - Header band: customer name, env, region, throttling pill if applicable
   - 4 StatCards: Health Score (with Δ) / Monthly spend / Capacity util / Last synced
   - Top open issue card
   - Capacity 7-day sparkline
   - Foot: `Open in customer overview` · `Watch this customer` · `Act as {Customer}` primary CTA (simulates F-2 context switch)
6. Scrolls down to the **F-2 activity feed** at the bottom of the page — last 5 days of invitations, access grants/revocations, capacity changes. Reads it like a Slack thread; nothing requires action.
7. Closes the laptop. Total time: 3 minutes. Replaces the 45 min of tenant-by-tenant portal-hopping that today's workflow demands.

## Edge states

- **First-time partner with 0 customers** → grid replaced by a CTA card: *"No customers yet. Send your first F-2 invitation to onboard one."* with `Invite customer` button. Never "No data."
- **Partner-read revoked on a customer** (Margie's Travel in the seed data) → that card's CU sparkline is empty + shows italic *"visibility blocked"* in place of the percentage. Sheet swaps the capacity chart for an empty-state explainer with a pointer to the F-2 activity row that recorded the revocation.
- **Last sync > 1 day on a customer** → the sync stamp in the card foot goes muted-yellow ("sync 3d ago"), and the sheet's Last-synced StatCard flips to amber.
- **All customers healthy** (rare) → Aggregate Health KPI goes emerald, "Throttling now" reads `0 — no active throttling`, Worst-movers section title can show *"Nothing significant this week — your customers are stable."* (Implementation note: only render the section when ≥1 mover has a negative health-Δ or cost-Δ > 10%.)
- **Filter yields 0 customers** → grid empty state: *"No customers match. Clear the filter or search above."*
- **Currency mix** in portfolio (€/£/$ per customer) → the **Total spend / mo** KPI is intentionally rendered in € only with an implicit "approximate FX" footnote in v2. v1 just shows €47,820 from the seed; the mixed-currency footer would land alongside `/costs` Mixed-Currency banner pattern.
- **Customer with expired invitation** (Coho Vineyard in seed) → does NOT show in the customer grid (they're not "live"); is counted in the `invitedPending` summary on the KPI; appears in F-2 activity feed with `invite_expired` tone.

## Filter / search behavior

- **Search:** matches customer name ∪ env (case-insensitive substring).
- **Bucket chips:** All / ★ (starred) / Throttling / Declining / Critical — each shows live count. Mutually exclusive.
- Filter state does **not** clear when opening the customer Sheet (so closing returns you to the same view).

## Components used

- `StatCard` × 4 (tones: sky · emerald w/ sparkline · rose-or-sky · emerald-or-amber)
- `Sparkline` (per-customer 7d CU + the portfolio total-spend KPI)
- `EnvBadge` reused (tier badge per card)
- `chip` (filter buckets with counts)
- New: `pf-card` grid tile (200px tall, dense), `pf-card-throttle` rose left-edge accent, `pf-card-critical` border tint, `pf-mov-row` 6-col deltas+action table, `pf-act-row` F-2 feed line, `pf-sheet` extends `usr-sheet` overlay, `pf-sheet-icon` with linear-gradient brand badge
- New utility tokens: `tone-emerald-fg` / `tone-rose-fg` / `tone-amber-fg` / `tone-sky-fg` / `tone-slate-fg` — pure-foreground colored deltas (no background)

## Metrics surfaced on the screen

- **Customers** (active + invited)
- **Total spend / mo** (aggregate across portfolio, € only in v1 — see edge state on currency mix)
- **Throttling now** (count, rose-toned when > 0)
- **Aggregate Health** (avg health score, weighted equally; weighted-by-capacity is v2)
- Per-customer: Health Score + Δ · Monthly spend (with currency) · 7d CU sparkline + current % · top issue severity + 1-line · last-sync relative time (absolute UTC on hover via title attr)
- **Worst-movers table:** health-Δ pts · cost-Δ % · wasted-spend-Δ €/mo · top-action narrative
- **F-2 activity feed:** 10 most-recent events (grants / revokes / invites / throttle alerts / SKU changes)

## Anti-patterns explicitly avoided

- **No "AI-summarize my portfolio" button.** The numbers ARE the headline per CLAUDE.md tone rules. Adding an AI gloss would dilute that.
- **No customer-scoring leaderboard** ("Customer #1 of the month"). Implies favoritism; partners need neutral signal.
- **No map view.** Tempting (regions span globe), but a map adds zero decision power; the env badge already encodes region.
- **No infinite scroll on the activity feed.** Hard-capped at the last 5 days / 10 events. If the partner wants more, link to `/tenant-activity` (S2 sketch).
- **No chat-with-portfolio agent.** D-pillar agents are standing subscriptions; chat is anti-pattern.

## What's deliberately NOT in this sketch

- Weighted-by-capacity aggregate health calculation (v1 is simple mean)
- Currency normalization in the spend KPI
- Per-customer permission verification at the API level (UI just shows what the customer-envs join returns; backend enforcement is real-product concern)
- Drag-to-reorder of customer cards or saved custom segments
- Annotated calendar view ("when are my QBRs this week?")
- Per-customer billing detail (lives on the existing `/billing` partner page in the real product, not yet in mockup)

## Cherry-pick verdict predictions

| Element | Verdict prediction |
|---|---|
| 4 KPI strip (Customers · Spend · Throttling · Health) | Strong keep — these are the partner's daily-driver metrics |
| Customer-tile grid w/ inline sparkline + top-issue | Strong keep — the central artifact of this page |
| Worst-movers table | Strong keep — the QBR ammo loop the operator described |
| F-2 activity feed | Likely keep, but trim to 5 events; 10 feels like clutter at the bottom of an already-dense page |
| Customer Sheet on click | Keep — the bridge between portfolio context and per-customer drill |
| "Act as {Customer}" CTA pattern | Strong keep — matches the F-2 partner-of-record badge spec in CLAUDE.md |
| Currency mix shown as-is per card | Cherry-pick **iteration** — needs the Mixed-Currency banner pattern from `/costs` to surface the implicit-€ aggregation rule |
| Sidebar "Partner" group at top | Real product should use PartnerSidebar / CustomerSidebar swap; this is the mockup's approximation |
| `Re-invite` action on revoked-access customer | Strong keep — wires straight to the F-2 invitation flow |
