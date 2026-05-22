# LayerPulse — value-ranked roadmap

**What's worth building next, ordered by customer value — not engineering sequence.** The product-owner's view of "what moves the needle," before anything lands on the LayerPulse implementation backlog.

- **PO-facing version:** `public/review/roadmap.html` (served at `/review/roadmap.html`).
- **Companions:** `docs/MOCKUP-PROCESS.md` (how a screen travels) · `<lp-product>/docs/BACKLOG.md` (the implementation roadmap this complements).

---

## Two roadmaps, one product

| | Implementation roadmap | Value roadmap (this doc) |
|---|---|---|
| **Lives in** | `<lp-product>/docs/BACKLOG.md` | here + `/review/roadmap.html` |
| **Ranks by** | tier · dependency · effort · validation | differentiator × decision × JOIN × persona |
| **Answers** | "what's buildable next, in what order" | "what should we fight for first" |
| **Owned by** | engineering | product owner |

They meet at the bridge: value-ranked here → you accept → tiered in the backlog → `/prd` → `/build-feature` → shipped.

## How we rank value (repeatable)

Four value dimensions, from the 5 fight-for-value gates + the product vision. **Build-readiness is a separate axis** — it sets the *horizon*, not the value. A high-value screen with no data yet is "held," not "low."

| Dimension | The question |
|---|---|
| **Differentiator** | Unique vs Microsoft? (portfolio-wide · continuously-updated · auditor-ready) |
| **Decision density** | How big / frequent is the decision it drives? Is there a € attached? |
| **JOIN advantage** | Does it need a database join no other tool has? |
| **Persona fit** | Does it move the primary persona's KPI — the partner managing 10–50 tenants? |

```
value   = differentiator × decision × join × persona
horizon = value ÷ build-readiness
```

---

## The roadmap

### ✅ Shipped to mockup — the knowledge + accountability layer (feeds everything below)

| Screen | Pillar | Decision it drives |
|---|---|---|
| **Documents** | Quality | "Hand the auditor / analyst / exec a trustworthy model doc without writing it." Biggest "nobody does that" moment. |
| **Business Glossary** | Quality | "Is this the official definition? What uses it?" — flows into every document. |
| **Ownership** | Governance | "Who's accountable? Whose signature ships on the auditor doc?" |

### 🔥 Now — build next (highest value, data ready)

**1. Portfolio "fix-first" command center** · *revisit `/dashboard`* · FinOps
- **Decision:** "Across all 10–50 of my customers, what do I fix first — and for which customer — before Tuesday's QBR?" Highest decision-density screen in the product.
- **Why #1:** the vision's literal moat (`getPartnerPortfolio` — the only place a partner sees the whole portfolio at once). Microsoft's portals are tenant-scoped; impossible there. The second "wow" after Documents.
- **Value:** differentiator ●●●● · decision ●●●● · JOIN ●●●● · persona ●●●●

### ⏭ Next (very high value, leverages what we just shipped)

**2. Users page (UPN-first)** · *new* · Governance
- **Decision:** "Which licenses am I wasting? Whose access is risky?" Hard-€ per user.
- **Why:** the natural pair to Ownership — *Ownership = who's accountable; Users = who actually uses it + what it costs.* JOIN: activity × license cost × access risk × ownership. PRD approved.
- **Value:** differentiator ●●●○ · decision ●●●● · JOIN ●●●● · persona ●●●○

**3. Audit & Compliance** · *new* · Governance
- **Decision:** "What evidence do I bring the auditor Tuesday?" Revenue-linked (Pro→Enterprise).
- **Why:** "auditor-ready export" is a named differentiator. Consumes Ownership's sign-off block + Governance Section B (both now in place). Export log + off-hours + RLS evaluation + SOC 2 ZIP.
- **Value:** differentiator ●●●● · decision ●●●○ · JOIN ●●●○ · persona ●●●○

### ⏸ Held — data-blocked (high value, axis not live)

- **Lineage Explorer (env-wide)** · Quality — "if I change this source, what breaks?" Blocked on the `fabric_reports` axis (T1.8); the graph needs report nodes to be worth drawing.
- **Reports & Apps catalog** · FinOps — "which reports are dead — am I paying to refresh them?" Same `fabric_reports` axis block. Dormant detection + per-report cost once it lands.

### 🅿 Later / folded (premature or low differentiator)

- **Intelligence sidebar (agentic)** — Q3+. Agents need the inventory *wide* first. Standing subscriptions, not chat.
- **Tenant Activity (forensic search)** — folded behind Users; it's the forensic sibling/enabler on the same backend, not a standalone hero.
- **Model Health tab** — incremental polish on the existing model surface; weak differentiator.

---

## What we're deliberately NOT building yet

Ten very-high-value screens beat twenty mediocre ones. The cut is as important as the list:

- **Lineage Explorer & Reports & Apps** — high value, but designing now means guessing at un-ingested data. Held, not dropped.
- **Agentic sidebar** — needs the inventory wide first. Premature by design.
- **Model Health** — a polish tab, not a differentiator. No hero slot.
- **Standalone Tenant Activity** — real value, but an enabler folded into Users.

---

**Living document.** Re-rank when: a data axis lands (un-blocks a "held" item), a screen ships (moves to ✅), or the value lens shifts (a non-goal becomes a goal). Last ranked: 2026-05-22.
