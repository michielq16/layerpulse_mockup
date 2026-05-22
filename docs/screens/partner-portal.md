# Screen: Partner portal — the partner environment (shell split)

**Pillar:** Cross-cutting (FinOps + Quality + Governance) at the **partner** scope
**Persona:** Microsoft partner (primary) managing 10–50 customer tenants
**Value-loop quadrant:** Render — over `getPartnerPortfolio` (the cross-tenant aggregation)
**Decision the user makes:** "Where do I spend my attention across my whole book — and which customer do I drop into?"

## The architectural change — two shells

Before: the mockup had **one shell** (the customer environment); partner pages were pinned at the top of the customer sidebar and rendered under a customer breadcrumb. That conflated two distinct environments.

Now there are **two shells**, matching the real product (`(partner)` vs `(customer)/[customerId]` route groups in LayerPulse):

```
Partner logs in → PARTNER PORTAL  (PartnerSidebar — the default landing "/")
                  Overview(command center) · Customers · Connections · Activity
                  · QBR Builder · Benchmarks · Team & Seats · Billing · Settings
                       │  Act as / click a customer
                       ▼
                  CUSTOMER ENVIRONMENT  (customer Sidebar + "Acting as {X}" + ← Portfolio)
                  Overview · Workspaces · Models · Documents · Capacity · … (all existing pages)
```

- `App.jsx` chooses the shell via `PARTNER_ROUTES`. Partner routes render `PartnerSidebar`; everything else renders the customer `Sidebar`.
- **Act-as:** `actAs(customer)` sets `actingAs` + routes to the customer `overview`. The customer sidebar shows an "Acting as {name}" back button; the topbar shows "← Portfolio" + an "acting as" pill.
- **Default landing is the partner portal** (`/` → `portfolio`), because a partner logs into their portal first.
- **Designed past LayerPulse, not copied:** LP's partner Overview is a roster + 4 KPIs; ours is the fix-first command center. Customers is a triage table (not cards); Connections is a funnel + diagnostics; plus three net-new pages LP doesn't have.

## Pages

| Page | Route | What it does |
|---|---|---|
| **Overview** (command center) | `portfolio` | The €-ranked fix-first action queue across all customers. See `portfolio-command-center.md`. |
| **Customers** | `customers` | Dense triage table — worst-health first: health Δ · spend · CU% · wasted € · top issue · sync · Act-as. |
| **Connections** | `connections` | F-2 invitation lifecycle: sent→accepted→pending→expired→revoked funnel + invitations table with resend/re-invite + attempt diagnostics. |
| **Activity** | `partner-activity` | Portfolio-wide event feed (invitations, access, capacity, billing). |
| **QBR Builder** ⭐ | `qbr` | *Net-new.* Pick a customer + toggle evidence sections → live Word-style QBR one-pager (cost, savings delivered, risks closed, open recs, next-quarter plan) → export. The partner's outbound-value weapon. |
| **Benchmarks** ⭐ | `benchmarks` | *Net-new.* Rank every customer on one dimension (health / wasted % / doc coverage / cost-per-CU / refresh fails); best-first, tertile-colored, median marked. "Where the partner conversation starts." |
| **Team & Seats** ⭐ | `team` | *Net-new.* Who watches which customers; seat usage; **coverage-gap** detection (a customer with no assigned owner — partner-side accountability, pairs with the customer Ownership screen). |
| **Billing** | `partner-billing` | The partner's LayerPulse subscription — plan, quota usage bars (envs/seats/models), invoices. (Distinct from customer Fabric spend.) |
| **Settings** | `partner-settings` | Partner profile · defaults (review cadence, doc target, throttle threshold) · notifications. |

## Edge states

- **Coverage gap (Team):** banner "N customers with no owner: …" — never silent.
- **Connections empty filter:** status chips narrow; revoked/expired rows always offer Re-invite/Resend.
- **Customers blocked-visibility:** `cuPercent: 0` → "—" + amber sync; mirrors the revoked-access state.
- **Benchmarks:** bottom-third tinted rose to surface the outliers.

## Components

- New: `PartnerSidebar` (components.jsx) · partner pages (`Partner.jsx`) · `ptr-*` styles (`partner.css`).
- Reused: `StatCard`, `lp-card`, `lp-section-head`, `chip`, `badge`, tone helpers, the customer `Sidebar` (now with `onExit`/`actingAs`) + `Topbar` (now with `partnerMode`/`actingAs`/`onExitCustomer`).

## Decisions locked (2026-05-22, operator sign-off)

1. **Command center is the home** — logging in lands directly on the fix-first queue. No separate "calmer" partner home.
2. **QBR Builder stays a tight single live one-pager** for v1 (not multi-page) — revisit depth later if needed.
3. **Billing framing confirmed** — partner Billing = the partner's LayerPulse subscription, distinct from each customer's Fabric spend.
4. **All three net-new pages survive** — QBR Builder, Benchmarks, and Team & Seats all carry into the real product.

## Notes for LP-side PRD authoring

- The shell split already exists in LayerPulse (`(partner)` vs `(customer)` route groups) — the value here is the **content**: command-center Overview, triage Customers, and the three net-new surfaces (QBR Builder, Benchmarks, Team & Seats).
- **QBR Builder** reuses Documents (`.docx` generation) + the fix-first queue + share-of-bill math — it's an assembly surface, not new data.
- **Benchmarks** is a read-side ranking over existing per-customer metrics.
- **Team & Seats** needs a `partner_team_members` + `customer_assignments` table; coverage gap = customers with no assignment row.
