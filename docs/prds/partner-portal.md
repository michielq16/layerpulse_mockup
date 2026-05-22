# PRD — Partner Portal (partner environment + fix-first command center)

| | |
|---|---|
| **Status** | Draft · ready for operator review |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (partner-experience layer; command center is the wedge screen) |
| **Pillar** | Cross-cutting (FinOps + Quality + Governance) at the **partner** scope |
| **Persona** | Microsoft partner (primary) managing 10–50 customer Fabric tenants |
| **Mockup source** | `docs/screens/partner-portal.md` + `docs/screens/portfolio-command-center.md` · live at `/` (partner portal) |
| **Real-product surface** | `app.layerpulse.com` `(partner)` route group — extends the existing partner shell |
| **Depends on** | `getPartnerPortfolio(orgId)` (shipped) · `recommendations` · `computeWastedSpend` · capacity telemetry · F-2 invitation tables · per-customer health scores |
| **Blocks** | Nothing downstream; this is the partner's daily home. QBR Builder soft-depends on C2d Documents (`.docx` generation, shipping). |

---

## 1. Problem

A Microsoft partner manages 10–50 customer Fabric tenants. The existing LayerPulse partner portal (`(partner)/dashboard`) shows a **roster + 4 KPIs** — it answers *"how are my customers doing"* but not the two questions a partner actually opens the product to answer:

1. **"What do I fix first, across my whole book, today?"** — there is no cross-tenant, €-ranked action list anywhere in Microsoft's surface or the current product.
2. **"What's my value story for this customer's QBR?"** — assembled by hand today, in slides, from scattered exports.

The data to answer both already lives in the joined database (`getPartnerPortfolio` is the moat query). The gap is render surfaces that exploit it at the partner scope, plus a clean separation between the **partner environment** (book-wide) and the **customer environment** (single tenant).

## 2. Goals · non-goals

### Goals (v1)

- **G1.** A distinct **partner shell** (own sidebar) separate from the customer environment; partner is the default landing on login.
- **G2.** **Act-as transition** — one click from the portal into a customer environment, with an "Acting as {customer}" indicator + one-click return.
- **G3.** **Command center Overview** — a €-ranked, cross-customer fix-first action queue (see `portfolio-command-center.md`; merged into this portal as the home).
- **G4.** **Customers** triage table (worst-health first), **Connections** (invitation lifecycle), **Activity** (portfolio feed).
- **G5.** Three net-new partner surfaces: **QBR Builder**, **Benchmarks**, **Team & Seats**.
- **G6.** **Billing** (partner's LayerPulse subscription) + **Settings** (partner-level).

### Non-goals (v1)

- **NG1.** Multi-page / fully-branded QBR export — v1 is a single live one-pager (operator decision 2026-05-22).
- **NG2.** A separate "calm" partner home distinct from the command center — the command center *is* the home (operator decision).
- **NG3.** Mutating Fabric/customer state from the portal (read + LP-side actions only; access changes go through F-2).
- **NG4.** Cross-partner / multi-partner-org views (single partner org scope).
- **NG5.** Real-time streaming — portal reflects the daily cron + on-demand re-sync, not live tails.

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **Partner consultant** | "Triage my book in 5 minutes each morning." → Overview command center → work the queue top-down. |
| **Partner account lead** | "Prep Tuesday's QBR for Contoso." → QBR Builder → pick sections → export. |
| **Partner principal** | "Which customers are outliers I should call?" → Benchmarks → bottom third. |
| **Partner ops** | "Is every customer owned by someone on my team?" → Team & Seats → coverage gaps. |
| **Any partner user** | "Drop into a specific customer." → Customers → Act as. |

## 4. 5-gate scorecard

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Cross-pillar at the partner scope — the portal is the lens; the command center ranks findings from every pillar |
| **G2 · JOIN** | `getPartnerPortfolio` — capacity € × wasted × health × ownership × access **across all customer envs** by `partners.partner_id`. Microsoft's portals are tenant-scoped; this is structurally impossible there |
| **G3 · Persona** | The primary persona's daily home; moves time-to-triage + QBR-prep + churn-prevention KPIs |
| **G4 · Differentiator** | Portfolio-wide + continuously-updated + (QBR) auditor/exec-ready export — all three named differentiators |
| **G5 · Decision** | "What to fix first / which customer to call / what to bring to the QBR" — every page ends in a partner action |

## 5. Information architecture

```
(partner) shell  — PartnerSidebar — default landing "/"
├── Overview        /portfolio          — fix-first command center (€-ranked queue)
├── Customers       /customers          — triage table (worst-health first) + Act-as
├── Connections     /connections        — invitation funnel + diagnostics
├── Activity        /partner-activity   — portfolio event feed
├── QBR Builder ⭐   /qbr               — customer + sections → live one-pager → export
├── Benchmarks ⭐    /benchmarks         — rank customers per dimension
├── Team & Seats ⭐  /team              — assignment + coverage-gap detection
├── Billing         /partner-billing    — LP subscription, quota, invoices
└── Settings        /partner-settings   — partner profile, defaults, notifications
        │ Act as / click a customer  →  (customer) shell, "Acting as {X}" + ← Portfolio
```

## 6. Functional requirements

### 6.1 Shell + transition
- **FR-SH-1** Partner routes render `PartnerSidebar`; all other routes render the customer `Sidebar`. Route set is explicit (`PARTNER_ROUTES`).
- **FR-SH-2** Default landing (`/`) is the partner Overview (command center).
- **FR-SH-3** `actAs(customer)` enters the customer environment at that customer's Overview, sets an "Acting as {name}" state shown in both the customer sidebar (back button) and the topbar (pill + "← Portfolio").
- **FR-SH-4** Exiting returns to the partner Overview and clears the acting-as state.

### 6.2 Overview (command center)
- Per `portfolio-command-center.md` (FR-OW/DR/etc.). Re-homed into the partner shell; customer breadcrumb removed.

### 6.3 Customers
- **FR-CU-1** Table of all partner-of-record customers, **sorted worst-health first**.
- **FR-CU-2** Columns: name + env · health (+ Δ) · monthly spend · CU% · wasted € (spend × wasted%) · top issue (sev badge) · last sync · Act-as.
- **FR-CU-3** Filters: All / Critical / Declining / Throttling. Row click = Act-as.
- **FR-CU-4** Blocked-visibility customer (`cuPercent 0`) renders "—" + amber sync.

### 6.4 Connections
- **FR-CO-1** Funnel: sent → accepted → pending → expired → revoked (counts).
- **FR-CO-2** Invitations table: customer · email · status pill · sent · by · last event · resend/re-invite action + attempt count. Accepted rows show no action.

### 6.5 QBR Builder (net-new)
- **FR-QB-1** Select one customer; toggle evidence sections (cost, savings, risks, open recs, adoption, quality, next-quarter).
- **FR-QB-2** Live one-pager preview updates with toggles; pulls cost/share-of-bill, wasted-€ reclaimed, the fix-first actions scoped to that customer, and a generated next-quarter plan.
- **FR-QB-3** Export to `.docx` (reuses C2d Documents generation). v1 = single one-pager.

### 6.6 Benchmarks (net-new)
- **FR-BM-1** Dimension selector: health · wasted % · doc coverage · cost-per-CU · refresh fails.
- **FR-BM-2** Rank all customers best-first for the dimension (direction-aware); horizontal bars normalized to max; tertile color (top/mid/bottom); median marked.

### 6.7 Team & Seats (net-new)
- **FR-TS-1** Team members with role + last-active + owned-customers chips (chip → Act-as).
- **FR-TS-2** Seat usage (used/total). **Coverage gap** = customers with no assigned owner; surfaced as a banner + KPI. (Partner-side complement to the customer Ownership screen.)

### 6.8 Billing / Settings
- **FR-BI-1** Partner's LayerPulse plan, MRR, renewal; quota bars (envs / seats / models); invoices. Distinct from customer Fabric spend.
- **FR-SE-1** Partner profile · defaults (review cadence, doc target, throttle threshold) · notification toggles.

### 6.9 Data contract (net-new tables; rest is read-side aggregation)

```sql
CREATE TABLE partner_team_members (
  id TEXT PRIMARY KEY, partner_id TEXT NOT NULL, email TEXT NOT NULL,
  display_name TEXT, role TEXT NOT NULL,            -- owner|admin|analyst
  last_active_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE customer_assignments (                  -- who watches which customer
  partner_id TEXT NOT NULL, customer_env_id TEXT NOT NULL,
  member_id TEXT NOT NULL REFERENCES partner_team_members(id),
  assigned_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (partner_id, customer_env_id, member_id)
);
-- coverage gap = customer_environments (partner-of-record) with no customer_assignments row
-- QBR / Benchmarks / command center = read-side aggregations, no new tables
-- Connections reuses the existing F-2 invitations table
```

### 6.10 Joins required (LayerPulse-only)

```
getPartnerPortfolio(orgId)
  ⋈ health_scores ⋈ recommendations ⋈ wasted_spend       (command center · customers · benchmarks)
  ⋈ invitations                                           (connections)
  ⋈ partner_team_members ⋈ customer_assignments           (team & seats coverage)
  ⋈ documents generation + fix-first(scoped)              (QBR builder)
```

## 7. States · edge cases

| State | Trigger | UI |
|---|---|---|
| Coverage gap | customer with no assignment | Team banner "N customers with no owner: …" |
| Blocked visibility | partner-read revoked | Customers "—" CU + amber sync; Connections "revoked" + Re-invite |
| Empty queue (filter) | no matching actions | "Queue clear for this filter…" |
| No customers yet | fresh partner | "Invite your first customer" empty state |
| Benchmarks outliers | bottom tertile | rose-tinted bars |

## 8. Telemetry

| Event | Properties |
|---|---|
| `partner.act_as` | customer_env_id, from (overview\|customers\|team) |
| `partner.exit_customer` | — |
| `qbr.section_toggled` | section_id, on |
| `qbr.exported` | customer_env_id, sections[] |
| `benchmarks.dimension_changed` | dimension |
| `team.coverage_gap_viewed` | gap_count |
| `customers.filter_applied` | filter |

## 9. Rollout

| Phase | Audience | Flag | Success |
|---|---|---|---|
| 0 Internal | eng + 1 partner | `lp.partner-portal.v2` | command center + customers usable on real portfolio |
| 1 Closed beta | 5 partner orgs | per-org | ≥3 partners use the command center weekly; ≥1 QBR exported |
| 2 GA | all partners | default-on | partner portal is the default post-login surface; QBR Builder adoption tracked |

## 10. Open questions

- **OQ-1** Command-center home confirmed (operator). No separate calm home.
- **OQ-2** QBR v1 = single one-pager (operator); multi-page is a future iteration.
- **OQ-3** Billing = LP subscription confirmed (operator).
- **OQ-4** All three net-new pages carry forward (operator). Re-evaluate Benchmarks vs Team&Seats depth after beta usage.
- **OQ-5** Should Connections merge into Customers, or stay separate (access lifecycle vs health triage)? Lean: separate.

## 11. Acceptance checklist for `/build-feature`

- [ ] Data contract (§6.9) accepted by platform team
- [ ] Shell split + act-as transition signed off against the existing `(partner)` route group
- [ ] QBR Builder ↔ C2d Documents generation integration confirmed
- [ ] Mockup partner portal reviewed by operator (done — 4 decisions locked 2026-05-22)
- [ ] PRD tagged `v1.0`, linked from `/build-feature` issue

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/` (partner portal) · `/qbr` · `/benchmarks` · `/team`
**Screen narratives:** `docs/screens/partner-portal.md` · `docs/screens/portfolio-command-center.md`
**PO review:** `public/review/partner-portal.html` · **Related:** `docs/VALUE-ROADMAP.md`
