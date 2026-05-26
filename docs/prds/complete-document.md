# PRD — Complete Document (the canonical full-scope semantic-model doc)

| | |
|---|---|
| **Status** | Draft · ready for operator review (mockup design brief) |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (the 4 audience presets are shipped; Complete is the canonical base they derive from) |
| **Pillar** | Semantic Model Quality (P2) — feeds Governance evidence (P3) via the sign-off block |
| **Persona** | Both — direct customer (model owner / auditor) + partner (preparing customer evidence) |
| **Mockup source** | `docs/screens/complete-document.md` · live as the **Complete** tab on `/documents` |
| **Real-product surface** | Already absorbed into **LP T1.18 "C2d — the Perfect Document"** (canonical PRD `docs/prd/c2d-documents-auto-word-generation.md`) |
| **Depends on** | Documents pillar (shipped) · LP T1.16 telemetry rollup (shipped) · LP T1.17 Business Glossary · Ownership tagging |
| **Blocks** | Cleaner audience presets (they become subset filters over Complete instead of separate documents) |

---

## 1. Problem

LayerPulse already generates audience-bounded documents — Auditor (SOC 2 evidence), Analyst (onboarding), Executive (QBR summary), Engineer (technical detail). Useful, but **four separate documents per model is a content-drift accident waiting to happen**: a table description in the auditor render disagrees with the engineer render, a measure description shows up in one preset and not another, the glossary section is filtered differently in each.

A single **canonical full-scope document** — the model-of-record artifact — solves this by being **the** base render. The 4 audience presets become **lenses** (subset filters) over it. One source, four views, zero drift. And because it's full-scope, it's also the **evidence baseline** a tenant attaches to model certification, hands to a new platform partner, or files in a governance audit.

## 2. Goals · non-goals

### Goals (v1)

- **G1.** A single **Complete** render that includes every section in the master catalogue, no audience filtering.
- **G2.** **Layered for signal density** — three tiers: 1-page cover scorecard → briefing body (8 group-led sections) → exhaustive appendices (A–D).
- **G3.** **Cover-page KEEP / OPTIMIZE / RETIRE verdict** — deterministic, no-AI, RAG over Adoption · Cost · Quality · Refresh.
- **G4.** **Source tagging** per group — Automated (Fabric API) / Manual (LayerPulse) / Derived. Reader always knows what's machine-extracted.
- **G5.** **Glossary-driven descriptions** — measure / column / table descriptions come only from attached glossary terms. No invented prose. Blank when no term attached.
- **G6.** **Ownership → cover credit + sign-off block** drawn from LP `/ownership`. Empty-state when missing; never fabricated.
- **G7.** **Completeness meter** on the cover — manual-layer coverage at a glance (Owner / SME / Stewards / Glossary / Processes).
- **G8.** **Audience presets become lenses** — Auditor / Analyst / Executive / Engineer all rendered as subset filters over the same Complete source.

### Non-goals (v1)

- **NG1.** Distinct audience-bound *documents*. Replaced by lenses over Complete.
- **NG2.** Custom section-picker. The 4 presets cover ≥95% of use cases; a custom-pick mode can be a V2 polish.
- **NG3.** AI-written summaries / descriptions. Deterministic only — descriptions sourced from glossary, never generated.
- **NG4.** Per-section ownership overrides. Doc-level owner = model-level owner from `/ownership`.
- **NG5.** Multi-model "merged" documents. One model, one Complete render.

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **Model owner** | "I need the definitive write-up of my model — every section, ready to attach to certification." → `/documents` → generate → **Complete** tab → download `.docx`. |
| **Auditor-facing partner** | "Hand the auditor a SOC 2 evidence pack." → Complete render → switch to Auditor lens for the filtered subset → export. |
| **New analyst onboarding** | "Learn this model end-to-end before I touch it." → Complete → read top-down (the cover gets me oriented in 30s; the body teaches me; the appendix is the reference). |
| **Governance lead** | "Is this model trustworthy? What's the verdict?" → Complete cover → read the KEEP/OPTIMIZE/RETIRE + dimensions + completeness meter. |

## 4. 5-gate scorecard

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Quality (canonical model write-up) feeding Governance (sign-off block) |
| **G2 · JOIN** | The doc IS the join: Scanner × Admin API × Metrics App DAX × DMV × LP ownership × LP glossary into one artifact. No other tool produces this. |
| **G3 · Persona** | Model owner / auditor / analyst / governance lead — different jobs, same artifact, different lenses |
| **G4 · Differentiator** | The single canonical doc per model, fused automatic + manual layers, deterministic verdict — *"nobody else produces that"* |
| **G5 · Decision** | KEEP / OPTIMIZE / RETIRE — surfaced on the cover; the rest of the doc justifies it |

## 5. Information architecture

```
DocumentPreviewModal  (route: /documents → open a doc → preview modal)

  View switcher: [ Complete ★ default ] [ Auditor ] [ Analyst ] [ Executive ] [ Engineer ]
                  (Complete is the canonical base; the 4 audience tabs render subsets)

  ── Tier 1 · Cover scorecard (1 page) ────────────────────────────
       Brand · model identity · purpose
       Certification stamp
       KEEP / OPTIMIZE / RETIRE verdict band (RAG · 4 axes)
       Health score + 6 quality dimensions
       4 headline KPIs
       Owner / SME / Stewards / Domain
       Manual-layer completeness meter
       Source legend

  ── Tier 2 · Body (briefing depth, group-led + source chips) ─────
       1. Executive summary + owner's note          [auto + manual]
       2. Trust & health (maturity · refresh · findings)  [auto]
       3. Schema (tables · relationships · ER · hierarchies)  [auto + glossary]
       4. Logic (measures + descriptions · calc groups)  [auto + glossary]
       5. Governance & security (RLS · OLS · labels · access × RLS)  [auto]
       6. Lineage & usage (upstream · downstream · adoption · storage · cost)  [auto + derived]
       7. Business context (glossary · grouped by type)  [manual]
       8. Ownership & sign-off (owners · changelog · signatures)  [manual]

  ── Tier 3 · Appendices (exhaustive reference) ───────────────────
       A. Full column inventory (every table × column)
       B. Full DAX expressions (every measure, monospace)
       C. Power Query (M) per table
       D. Measure usage / dormancy
```

## 6. Functional requirements

### 6.1 Render

- **FR-CD-1** The Complete view is the **default** for newly generated documents (modal `initialAudience || 'complete'`).
- **FR-CD-2** Audience presets (auditor/analyst/executive/engineer) render as **subset filters** over Complete: they pick a defined slice of the section catalogue, not a separate document body.
- **FR-CD-3** Each group-lead carries an explicit **source chip** (Automated · Manual · Derived) shown on the page next to the H2.

### 6.2 Cover scorecard (Tier 1)

- **FR-CD-4** Verdict band: deterministic RAG over Adoption / Cost / Quality / Refresh; output one of `RETIRE` / `OPTIMIZE` / `KEEP` with a one-line rationale.
- **FR-CD-5** Verdict logic:
  - `RETIRE` if `adoption.rag === 'r'`
  - `OPTIMIZE` if any axis is red OR ≥2 are amber
  - `KEEP` otherwise
- **FR-CD-6** RAG thresholds (open for tuning):
  - Adoption: g if `mau ≥ 100 && dormantPct < 0.4`; a if `mau ≥ 30`; else r.
  - Cost: g if `shareOfCapacityPct ≤ 20`; a if `≤ 40`; else r.
  - Quality: g if `score ≥ 8`; a if `≥ 6.5`; else r.
  - Refresh: g if `last-90d ok-rate ≥ 0.95`; a if `≥ 0.85`; else r.
- **FR-CD-7** Completeness meter: 5 chips — `Owner ✓/✗ · SME ✓/✗ · Stewards (N) ✓/✗ · Glossary (N) ✓/✗ · Processes ✓/✗`. ✓ when present.
- **FR-CD-8** Certification stamp from `sample.certification` (status + certifier + date).
- **FR-CD-9** Source legend rendered in the cover footer (Automated = green · Manual = violet).

### 6.3 Body (Tier 2)

- **FR-CD-10** 8 groups (Executive summary · Trust & health · Schema · Logic · Governance & security · Lineage & usage · Business context · Ownership & sign-off) in catalogue order.
- **FR-CD-11** Each group-lead = numbered title + source chip; section components inside are reused (see Components used).
- **FR-CD-12** Descriptions are **glossary-attached only**. No description rendered when no term attached (blank).
- **FR-CD-13** Manual sections render explicit empty-states (e.g. "No stewards assigned — add via /ownership"), never fabricated.

### 6.4 Appendices (Tier 3)

- **FR-CD-14** Clear divider banner: `A P P E N D I C E S — Exhaustive reference`.
- **FR-CD-15** Each appendix on its own page-break: A (full columns) · B (full DAX, monospace) · C (Power Query M) · D (measure usage + dormancy).

### 6.5 Data contract (read-side only)

No new tables. Complete reads:

| Source | Section consumers |
|---|---|
| Scanner `getInfo` | Tables · relationships · hierarchies · OLS · RLS · sensitivity labels · column inventory |
| Scanner `getDefinition` (TMDL) | Measures + DAX · Power Query M · calc groups · perspectives · translations |
| `/admin/activityevents` | Adoption · changelog · measure usage |
| `/admin/capacities/refreshables` | Refresh history |
| `/admin/datasets/{id}/users` + Graph `/groups/{id}/members` | Access × RLS scope |
| Metrics App DAX | Cost attribution (CU + €) |
| VertiPaq DMV (`$SYSTEM.DISCOVER_STORAGE_TABLE_COLUMN_SEGMENTS`) | Storage / size breakdown |
| LP DB — ownership tags | Owner / SME / Stewards on cover + sign-off |
| LP DB — glossary attachments | All descriptions throughout the document |
| LP DB — manual flags | Certification stamp · owner's note |

## 7. States · edge cases

| State | Trigger | UI |
|---|---|---|
| Newly generated | preset not specified | defaults to Complete |
| Switch to audience lens | user clicks a preset tab | re-renders as a filtered subset; pagination resets to page 1 |
| Source model changed | `lastGen < model.lastModified` | banner "Source model has changed since this document was last generated. Regenerate to refresh." + `Regenerate now` button |
| No glossary term attached to measure X | empty `linkedTo` | measure renders with name + format only; description row omitted |
| No owner assigned | `/ownership` has no owner tag for this model | cover shows `Owner — not yet assigned` (rose); sign-off block shows `No owner assigned — add via /ownership` |
| Verdict band — RETIRE | adoption red | rose left-accent on band; rationale "Barely used — candidate to retire or consolidate." |
| Verdict band — OPTIMIZE | any red or ≥2 amber | amber left-accent; rationale "High value with fixable weak spots…" |
| Verdict band — KEEP | clean | green left-accent; rationale "Heavily used, healthy, and earning its CU…" |

## 8. Telemetry

| Event | Properties |
|---|---|
| `documents.complete_rendered` | model_id, verdict, completeness pct |
| `documents.lens_switched` | model_id, from, to |
| `documents.verdict_displayed` | model_id, verdict, axes (g/a/r per axis) |
| `documents.regenerate_clicked` | model_id, reason (outdated\|user) |
| `documents.exported` | model_id, format, lens |

## 9. Rollout

Complete already renders in the mockup; LP T1.18 ("C2d — the Perfect Document") is the canonical implementation row. This PRD is the design brief that informed T1.18; LP `/build-feature` ships against the canonical PRD (`docs/prd/c2d-documents-auto-word-generation.md`).

| Phase | Audience | Flag |
|---|---|---|
| 0 Internal | eng | always-on |
| 1 Closed beta | partner orgs | per-org |
| 2 GA | all | default-on; Complete is the modal default; presets remain selectable |

## 10. Open questions

- **OQ-1** ✅ Complete is the modal default (operator 2026-05-22).
- **OQ-2** ✅ Verdict band added (operator 2026-05-24).
- **OQ-3** Verdict-band RAG thresholds — formal tuning when more real-tenant data lands? (Currently the conservative defaults in §6.2.)
- **OQ-4** Custom section-picker as a 5th tab (V2)? Useful for partners assembling unusual evidence packs.
- **OQ-5** Per-paragraph source attribution (every sentence labeled at the inline level)? Probably overengineered — group-lead chip covers it.

## 11. Acceptance checklist for `/build-feature`

- [ ] Section catalogue (`docs/documents-section-catalogue.md`) accepted as the source of truth for what Complete includes
- [ ] Verdict-band RAG thresholds confirmed (§6.2)
- [ ] Audience presets re-implemented as **filters over Complete** (not separate page-builders)
- [ ] Glossary-driven description rule enforced (`FR-CD-12`) — blank-when-empty, never invented
- [ ] Ownership empty-state copy approved (`FR-CD-13` + sign-off behavior)
- [ ] Mockup `/documents` → Complete tab reviewed by operator (done — verdict band added 2026-05-24)
- [ ] PRD tagged `v1.0`, linked from the LP-side T1.18 PRD

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/documents` (open a doc → **Complete** tab)
**Screen narrative:** `docs/screens/complete-document.md` · **PO review:** `public/review/complete-document.html`
**Master section catalogue:** `docs/documents-section-catalogue.md`
**Design doc:** `docs/plans/2026-05-22-complete-document-design.md`
**LP-side absorbed:** **T1.18 "C2d — the Perfect Document"** · `docs/prd/c2d-documents-auto-word-generation.md`
