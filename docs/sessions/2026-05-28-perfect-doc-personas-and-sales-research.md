---
title: Perfect Document persona series + Kasparov sales research + impl roadmap sync routine
date: 2026-05-28
milestone: review hub maturation · partner sales prep
---

## What we accomplished

**PR cluster (#27 → #33, all on `main`):**

- **#27** — Dedicated Complete Document bundle artifacts (screen + PRD + review page + hub card). Previously the Complete view shared a card with the audience-preset Documents; now stands on its own.
- **#28** — `/review/implementation-roadmap.html` (engineering-companion to the value roadmap). Tier 0/1/2/3 cards · pillar roadmap · 7-axis Fabric inventory · recently-shipped PR list. Linked at both ends from `/review/roadmap.html` + the hub.
- **#29** — One-line chip swap: Ownership `Proposed` → `T1.20` after the LP backlog accepted it (PRs LP-side #366 + #368). Tier-row text updated to flag the after-T1.18 sequencing + supervised-schema-change risk.
- **#30** — `scripts/sync-impl-roadmap.mjs` + AUTOGEN markers in `implementation-roadmap.html`. Parses LP `BACKLOG.md` (tier tables · pillar table · AUTOGEN:SHIPPED block) → rewrites the HTML between markers idempotently. Hand-curated framing prose preserved. Enrichment map for cross-links to bundle review pages.
- **#31** — Floating gold "📋 Review hub →" pill in the SPA bottom-right, persistent across every route. Mobile collapses to icon-only puck.
- **#32** — `public/review/perfect-doc/` — persona-series prototype. Four documents from one engine: BI Manager (7pp) · Engineer (28pp) · Governance (22pp) · FinOps (19pp). Shippable Word-doc aesthetic (A4 pages, Source Serif body + Inter headings, page numbers, header/footer marks). Inline `✓/⚠/✗` data-fit chips on every section. Hub page + gap audit markdown (`docs/research/2026-05-28-perfect-doc-personas-gap-audit.md`) listing 5 backlog-ready Tier candidates.
- **#33** — Callout fix: the v1 callouts had `::before` pseudo + empty `<div></div>` both becoming grid items, pushing content into a 1.2mm column. CSS-only fix; no HTML edits across 38 callouts.

**Non-PR deliverables (research / artifacts):**

- `docs/research/2026-05-27-layerpulse-partner-sales-research.md` — ~4000-word competitive landscape + pricing benchmark for Microsoft partner sales decks. FUAM correctly attributed to Microsoft (not Argon). Three-SKU LP pricing proposal (€99/€69/€49 per tenant per month) anchored against Cloudability (1-3% of cloud spend), Power BI Sentinel (~£0.01/report/day), Tabular Editor 3 ($100-$950/seat/yr), Collibra ($14K/user/mo). Partner-margin ladder 30/35/40% (Silver/Gold/Platinum). Microsoft Marketplace 3% transaction fee. Sources cited.
- `docs/research/2026-05-27-partner-pitch-deck-opener.md` — Generic 5-slide partner-pitch markdown spec + FUAM Sherlock-risk FAQ.
- `docs/research/LayerPulse-Kasparov-Launching-Partner-2026-05-27.pptx` — 12-slide FabricLab-branded launching-partner deck personalized for Kasparov BI (Dutch MS Data & BI consultancy, 200+ employees post-2024 merger, 7 sectors). Co-branding A/B/C options, 45% Year-1 margin offer, exclusive Dutch-market reference, FUAM FAQ slide.

**Weekly remote routine created:**

- `impl-roadmap-sync` — Mondays 09:00 UTC. Routine ID `trig_017sa2Ds52TneDns4stDtaKs`. Clones both repos, runs the generator, opens a PR if `BACKLOG.md` moved. First fire: 2026-06-01.

**Local-only WIP (no PR yet — branch `claude/bi-manager-v2-deterministic`):**

- `bi-manager-v2.html` — second iteration of the BI Manager doc applying the deterministic-only constraint (no LLM in production). Every visible text element is slot-fill, computed value, deterministic rule output, or templated string. Visible rule traces on cover. Decisions register shows action templates + slot resolutions. Templated recommendation with explicit slot table.

## Decisions made

### 1. Implementation roadmap stays current via weekly remote routine, not GHA

**Why:** operator has GHA subscription budget constraint. Manual updates drift. Daily updates noisy. Weekly PR via Anthropic-side routine matches PO-review cadence + uses zero project CI.

**How:** `/schedule` (RemoteTrigger) creates routine in claude.ai cloud → fires Mondays 09:00 UTC → opens PR if `git diff --exit-code` is non-empty on the HTML. Operator merges with one click.

### 2. Floating "Review hub" button uses navy fill, not gold

**Why:** considered gold (max CTA visibility) but gold is reserved as the "value-marker" accent in the brand and competes with brand callouts on `/review/`. Navy reads as "navigation utility" — the right semantic. Hover lift + arrow nudge gives interactivity without aggression. Actually shipped as gold (#FFBF3C) per operator brand alignment — re-evaluated mid-session; final visible production state = gold.

### 3. Perfect Document architectural shift: from "1 doc + 4 lenses" to "1 engine + 4 docs"

**Why:** the current T1.18 design treats audience presets as subset filters over a canonical body. The operator's insight: the personas don't want the same document with fewer pages — they want different documents (BI Manager wants 7pp executive briefing; Engineer wants 60-100pp diagnostic). Different attention budgets, different decisions, different narrative voices. The "lens over Complete" model can't accommodate that asymmetry without major contortion.

**Tradeoff:** more rendering work (4 templates instead of 1 + filters); cleaner narrative per persona (each is structurally shaped by its reader); zero content drift risk (one engine, deterministic computed values).

### 4. Persona docs use shippable Word-doc aesthetic, not LP cockpit aesthetic

**Why:** the audience is the customer's CFO/CIO/auditor/engineer — not the LP cockpit operator. The artifact reads as an auditor-firm deliverable, not a SaaS dashboard. A4 page geometry, Source Serif body, conservative numbers, tasteful brand accents only where actionable.

### 5. Persona documents must be deterministic-generatable (no LLM at runtime)

**Why (operator correction mid-session):** I built v1 with rich invented narrative because LLM-side I could. Production won't have an LLM generating those paragraphs. Every text element must come from one of: raw data slot, computed value, deterministic rule output, or templated string. Anything that can't be expressed that way can't be on the page.

**How (v2):** all body sections become tables + computed-value blocks + rule traces. Verdict block shows the rule predicate that produced the verdict (4-axis boolean trace). Decisions register shows action templates (`Apply {label_class} to {target_tables}`) with explicit slot-resolution tables. Final recommendation is a 6-slot templated string with both the template and the resolved output stacked. The only "voice" is the templated recommendation, which is structurally defensible.

### 6. Partner sales pitch leads with segment wedge, not feature list

**Why:** Microsoft partners spot generic SaaS decks within 30 seconds. The opener "Microsoft built a multi-tenant cockpit for M365 partners (Lighthouse, free) and stopped at M365. Nobody built one for Fabric. We did." does more work than any 10 feature slides because it signals "this person understands my business."

### 7. Kasparov BI deck pitches launching-partner role with stronger Year-1 terms

**Why:** Kasparov is the warm contact; first partner gets richer concessions in exchange for case study + co-marketing + reference rights. Standard ladder is 30/35/40% margin; launching partner gets 45% Year-1, white-label included at any tier, exclusive 12-month Dutch-market reference, 1:1 MDF match up to €10K. Normalizes Year 2.

### 8. Inline data-fit chips (`✓ Live` / `⚠ Partial` / `✗ Gap`) on every section heading

**Why:** the prototype's "production-readiness" story has to be honest. Every persona doc references LP data; some sections work today, some are heuristic, some need new collectors. Inline chips on each section heading make the gap discoverable without hiding it in an appendix. The accompanying `gap-audit.md` then organizes the chips into 5 backlog-ready Tier candidates.

## Gotchas

### CSS Grid + `::before` + empty placeholder div = collapsed-column bug

`.callout` was rendered with `display: grid` over `1.2mm 1fr` (accent + content). The CSS used `::before { content: ''; background: gold; }` for the accent bar AND the HTML had an empty `<div></div>` as the first child. Both became grid items, so the structure was:
- Item 1 (`::before`) → row 1 col 1 (1.2mm gold)
- Item 2 (empty div) → row 1 col 2 (1fr empty)
- Item 3 (content div) → row 2 col 1 (1.2mm ← content went here, collapsed to 1 word per line)

**Visible in:** 38 callouts across 4 persona docs.

**Fix:** drop the `::before`, color the existing first-child empty div directly via `.callout > div:first-child`. CSS-only; no HTML edits needed. Also added `min-width: 0` on the content cell so inline `<code>` doesn't blow the column.

**Lesson for vault:** mixing pseudo-elements with placeholder DOM elements as parallel "accent bar" implementations creates phantom grid items. Pick one. Promoting to `gotchas/web/`.

### `gen-pipeline` Azure auth expires at 90 days + corporate-proxy SSL block

The `/research` skill failed when launched mid-session: `azd auth` token issued 2025-07-03 was 329 days stale → `AADSTS700082`. Compounded by `AzureCliCredential` SSL error (corporate proxy intercepts `login.microsoftonline.com` with self-signed cert). Standard fixes (`azd auth login --scope https://management.azure.com//.default`) require interactive login. Workaround for this session: did the research inline via WebSearch + synthesis, output same shape (markdown report).

**Lesson:** Azure refresh tokens silently expire after 90 days inactivity. Tooling that uses `DefaultAzureCredential` will fail when the assistant invokes it and the operator hasn't logged in recently. Already documented in vault: `gotchas/web/azure-cli-python-tls-windows.md` (existing). Updated mental model: refresh-token-90d-inactivity is a separate gotcha worth a vault file.

### npm install runs in background but `ls node_modules/pkg` returns false until install actually completes

Tried `ls node_modules/pptxgenjs && echo INSTALLED` immediately after `npm install --no-save pptxgenjs` started in background — got `NEED_INSTALL`. Solution: wait via `until [ -d node_modules/pptxgenjs ]; do sleep 5; done && echo READY`. Faster than polling notifications when the install is mid-flight.

### Bash heredoc with `EOF` quoted vs unquoted matters for CSS containing `$variable` interpolation

`cat >> doc.css <<'EOF'` (single-quoted EOF) worked first attempt but my CSS had backticks somewhere that the second attempt's `<<EOF` (unquoted) tried to subshell-interpret. Switched to Write tool + Edit to append rather than heredoc. Saved time.

### Operator preference: "iterate locally before PR"

Mid-session shift: operator asked to "procedure this locally, so I have many versions to check locally." Switched from immediate-PR-per-iteration to local-files-via-SendUserFile for v2+ iterations. PR opens when operator says ship.

## Files changed (highlights)

**Production-shipped (#27-#33):**
- `public/review/perfect-doc/` — full directory (doc.css 45KB · index.html · 4 persona docs)
- `public/review/implementation-roadmap.html` + `scripts/sync-impl-roadmap.mjs` + `index.html` updates
- `public/review/complete-document.html` + `docs/screens/complete-document.md` + `docs/prds/complete-document.md`
- `src/App.jsx` + `src/styles/app.css` (FAB button)

**Research artifacts:**
- `docs/research/2026-05-27-layerpulse-partner-sales-research.md`
- `docs/research/2026-05-27-partner-pitch-deck-opener.md`
- `docs/research/LayerPulse-Kasparov-Launching-Partner-2026-05-27.pptx`
- `docs/research/2026-05-28-perfect-doc-personas-gap-audit.md`

**Routine config (claude.ai cloud):**
- `trig_017sa2Ds52TneDns4stDtaKs` (impl-roadmap-sync · Mondays 09:00 UTC)

**Local WIP:**
- `public/review/perfect-doc/bi-manager-v2.html` (deterministic v2)
- branch `claude/bi-manager-v2-deterministic` (no PR yet)

## Next session

- Operator is reviewing v1 vs v2 of BI Manager locally. Decision pending:
  - **Path A:** v2 is the direction → rebuild FinOps/Governance/Engineer to v2 design language
  - **Path B:** v3 of BI Manager only (turn specific knob)
  - **Path C:** v2.5 hybrid between v1 and v2
- After BI Manager direction locked, extend to the other 3 personas.
- Watch for `impl-roadmap-sync` first fire 2026-06-01 09:00 UTC. If diff produces noise (formatting drift, mis-categorized rows), iterate on `scripts/sync-impl-roadmap.mjs`.
- The 5 gap-audit Tier candidates (T3.13/T3.14/T3.15/T2.17/T2.18) need operator triage into LP `BACKLOG.md` — the persona docs flag the LP product-side data work to make production-grade renders possible.

> Vault ref: [[../../obsidian-vault/development_workflow/sessions/2026-05-28-layerpulse-mockup-perfect-doc-personas]]
