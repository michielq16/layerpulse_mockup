# LayerPulse Mockup — the E2E process

**The strict, repeatable path from "I want a screen" to "it's a Tier row in the LayerPulse backlog."** Same six phases every time → standards, repeatability, predictable outcomes.

- **PO-facing version:** `public/review/process.html` (served at `/review/process.html`) — read that one if markdown is high cognitive load.
- **Companion specs:** `docs/handover/README.md` (handover bridge) · `CLAUDE.md` (role, gates, brand, screen-narrative format).

---

## The shape

```
0 FRAME   ──▶ 1 DESIGN ──▶ 2 ITERATE ──▶ 3 BUNDLE ──▶ 4 SHIP ──▶ 5 BACKLOG
(you+me)      (me)          (you+me)       (me)          (you=merge)  (you accept)
 gates first   build+narrate  feedback loop  4 artifacts                I draft tier
```

Two actors. **You (PO)** own the bookends — framing intent (Phase 0) and accepting into the backlog (Phase 5). **I (mockup designer)** own the middle — design, bundle, ship. Handoffs are explicit.

---

## Phase 0 — FRAME (the gate)

**Who:** you + me, before anything is drawn.
**You start it:** `/brainstorming — I want a screen for <area>`, or just name the screen.

I run the **5 fight-for-value gates** on the idea *before* sketching. A weak answer on any gate → I push back and counter-propose (the senior-PM safety valve against generic dashboards).

| Gate | Question | Reject | Proceed |
|---|---|---|---|
| **G1 Pillar** | Which pillar does it advance? | "generic dashboard" | "FinOps — new wasted-spend dimension" |
| **G2 Join** | What DB join does it need that no tool delivers? | "shows the data" | "joins activity × licenses × tenant settings" |
| **G3 Persona** | Whose KPI does it move? | "helpful for whoever" | "Partner QBR — cost-saving evidence" |
| **G4 Differentiator** | What's unique vs. Microsoft? | "nicer charts" | "portfolio-wide / auditor-ready" |
| **G5 Decision** | What decision results? | "be informed" | "which capacity to scale down" |

**Definition of done:** a one-liner — pillar + persona + decision-supported + value-loop quadrant (`Ingest → Join → Validate → Render`) + the DB join.

## Phase 1 — DESIGN

**Who:** me.

I build the working screen (React/JSX) with Fabric-plausible fake data, locked brand tokens + components, and write the **screen narrative** (`docs/screens/<x>.md`, format per CLAUDE.md). Push to a feature branch (`claude/<topic>`), open a PR, link the live Vercel preview.

**Definition of done:** a live preview URL + the screen narrative committed, posted to you.

## Phase 2 — ITERATE (the loop)

**Who:** you + me.

You react to the *live* screen; I push; the preview updates at the same branch-alias URL. The mockup's speed is the point — iterate freely here. Nothing is final until you sign off.

**Definition of done:** you say "approved / sign off."

## Phase 3 — BUNDLE

**Who:** me, proactively at sign-off (I don't wait to be asked).

I assemble the full handover bundle:

- **Review page** — plain-language HTML via the `review-page` skill → `public/review/<x>.html`
- **PRD** — build spec → `docs/prds/<x>.md`
- **Screenshots** — functional captures via Playwright against local dev → `docs/handover/screenshots/<x>/`
- **Hub card** — refreshed on `public/review/index.html` (`/review/`)

I also grep `<lp-product>/docs/BACKLOG.md` to name the correct pillar + confirm no duplicate row already covers it.

**Definition of done:** all five artifacts exist — `screen.md` · `prd.md` · `review.html` · screenshots · live route — and the hub shows the card.

## Phase 4 — SHIP TO MOCKUP PROD

**Who:** you trigger, I execute.
**You say:** "merge".

I squash-merge the PR to `main`; Vercel redeploys production; the bundle goes live on the review hub. Then `/sync-memory` persists the session (vault session log + project memory + dashboard).

**Definition of done:** bundle live on the production hub; session logged.

## Phase 5 — FEED THE BACKLOG (attach to a tier)

**Who:** I offer, you accept.

I draft the **Tier-row text** (status · rationale · dependencies · estimate · pillar). **You** paste it into `<lp-product>/docs/BACKLOG.md` attached to a Tier (T0–T3) — the mockup never writes the LP backlog directly. From there it's the product track: `/prd` formalizes → `/build-feature` ships → real product.

**Definition of done:** a Tier row in BACKLOG.md referencing the bundle. The screen has crossed the bridge.

---

## How to start engaging — four openers

| Intent | Opener | Enters at |
|---|---|---|
| New screen (most common) | `/brainstorming — I want a screen for <area>` | Phase 0 (gated) |
| Iterate an existing mockup screen | `iterate /<route>: <feedback>` | Phase 2 (not re-gated) |
| Bundle a screen already built | `bundle <screen> for handover` | Phase 3 |
| Fix a bug on a live screen | `fix <bug> on /<route>` | minimal path, no re-gate |

## One source, two readers

Every screen produces both formats from the same design — neither is a summary of the other:

| Reader | Surface | Why |
|---|---|---|
| You (PO) | `review.html` | plain language, scannable, ends with decisions — low cognitive load |
| Build team | `screen.md` + `prd.md` | full detail: data contracts, edge states, telemetry |
| LayerPulse | screenshots | sees the screen, not just reads about it |

---

## Hard rules (non-negotiable)

- **Phase 0 gates run before any design.** A failed gate stops the screen — I counter-propose, never silently build.
- **Multi-file work goes on a feature branch + PR.** Never direct to `main`. (See CLAUDE.md "Delivery protocol".)
- **I never auto-merge** — merge is your explicit "merge" in Phase 4.
- **I never write the LayerPulse backlog** — I draft the Tier row; you accept it (Phase 5).
- **Manual-data sections degrade, never fabricate** — empty-state copy tells you how to populate, never invents owners/definitions.
