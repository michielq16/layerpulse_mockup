# Screen: Complete Document — the canonical full-scope semantic-model doc

**Pillar:** Semantic Model Quality (P2) — feeds Governance evidence (P3) via the sign-off block
**Persona:** Both — direct customer (model owner / auditor) + partner (preparing customer evidence)
**Value-loop quadrant:** Render — over the joined doc data (Scanner + Admin API + Metrics App DAX + DMV + LP-side ownership + LP-side glossary)
**Decision the user makes:** "Is this model trustworthy and what should I do with it — KEEP it as canonical, OPTIMIZE the weak spots, or RETIRE it?"
**Data joins required:** Scanner `getInfo` × Scanner `getDefinition`(TMDL) × `/admin/activityevents` × `/admin/capacities/refreshables` × `/admin/datasets/{id}/users` × Metrics App DAX × VertiPaq DMV × LP `/ownership` × LP `/glossary`. Single artifact, fused.

**Live surface:** the **Complete** tab inside the document preview modal on `/documents` (default for newly generated docs). The 4 audience presets (Auditor · Analyst · Executive · Engineer) are *lenses* — subsets of this base, not separate documents.

**Sample data:** `DATA.documents.sample` in `src/data.jsx`; render code in `src/NewPages.jsx` (`completePages` + `CompleteCover` + section components).

## Why this exists

The 4 audience presets answer *"what does the auditor / analyst / exec / engineer need?"*. The **Complete document** answers a different question: *"what is the full-scope canonical write-up of this model — model-of-record, single source of truth?"* It's the document a tenant attaches to a model's certification, hands to a new platform partner, or files as a SOC 2 evidence baseline. Every audience preset is derived as a subset of it.

The trade for completeness is signal density — so the doc is **tiered**: a 1-page scorecard up front, briefing depth in the body, exhaustive reference in the appendices. The reader extracts as little or as much as they need; the document doesn't force a read order.

## The three tiers

### Tier 1 — Cover scorecard (1 page · the 30-second answer)

Fused, single page:

- Brand · model identity (name · workspace · env) · purpose line (drawn from `execSummary.narrative` first sentence — *never* invented prose).
- **Certification stamp** (Certified / Promoted / None + certifier name + date).
- **KEEP / OPTIMIZE / RETIRE verdict band** — deterministic RAG over four axes (Adoption · Cost · Quality · Refresh) with a one-line rationale. Matches the LP T1.18 *Model Scorecard* framing.
- **Health score + 6 quality dimensions** as mini bars (LP quality engine).
- **4 headline KPIs** (Tables · Rows · Measures · Active relationships).
- **Identity + ownership grid** (Workspace · Env · Domain · Owner · SME · Generated date).
- **Manual layer completeness meter** — `Owner ✓ · SME ✓ · Stewards (N) ✓ · Glossary (N) ✓ · Processes ✗` — the human-curated coverage at a glance.
- **Source legend** — Automated (Fabric API) vs Manual (LayerPulse).

### Tier 2 — Body (briefing depth · top-to-bottom)

Eight grouped sections, each introduced by a **group-lead banner** carrying a source chip (Automated / Manual / Derived):

1. **Executive summary** + owner's free-text note *(auto + manual)*
2. **Trust & health** — quality dimensions, refresh + incremental policy, governance findings *(auto)*
3. **Schema** — tables, relationships, ER diagram, hierarchies *(auto + glossary descriptions)*
4. **Logic** — measures + glossary-driven descriptions, calc groups, perspectives, translations *(auto + glossary)*
5. **Governance & security** — RLS, OLS, sensitivity labels, access × RLS scope *(auto)*
6. **Lineage & usage** — upstream + downstream, adoption, storage (VertiPaq), cost attribution *(auto + derived)*
7. **Business context** — business glossary (all terms attached to this model, grouped) *(manual)*
8. **Ownership & sign-off** — owners table, change log, signature block *(manual)*

### Tier 3 — Appendices (exhaustive reference)

Clearly fenced. The full inventories the body briefs over:

- **Appendix A** — Full column inventory (every table × column × type × role × description)
- **Appendix B** — Full DAX expressions (every measure, monospace)
- **Appendix C** — Power Query (M) per table
- **Appendix D** — Measure usage / dormancy (derived from activity_events × DAX dependency parse)

## Locked principles

- **Glossary-driven descriptions.** Measure / column / table descriptions come ONLY from attached business-glossary terms. No term attached → no description rendered (blank). Never invented prose. This is the *trust contract* — the doc grows in quality with the glossary, not faster.
- **Source tagging.** Each group-lead carries Automated / Manual / Derived so the reader always knows what's machine-extracted vs human-captured.
- **Ownership → cover + sign-off.** Owner/SME/Stewards/Domain flow from LP `/ownership` into the cover credit and the back-page sign-off. Missing → explicit empty-state, never fabricated.
- **Degradation, never fabrication.** Automated sections always render. Manual sections render explicit empty-states ("No stewards assigned — add via /ownership") — the empty slot is the prompt to populate the foundation.
- **Completeness meter on cover.** Surfaces how complete the human layer is + what to populate next.

## Audience presets = lenses (subsets), not separate documents

The Complete document is the **canonical base**. The 4 audience presets become *views* over it:

| Preset | Sections included | Why |
|---|---|---|
| **Auditor** | Trust & health · Governance & security · Ownership & sign-off · Appendix A (columns) | SOC 2 / HIPAA evidence pack |
| **Analyst** | Executive summary · Schema · Logic (no DAX) · Business context | Onboarding handoff |
| **Executive** | Cover scorecard · Lineage & usage (adoption + cost) | QBR-ready summary |
| **Engineer** | Schema · Logic (with DAX) · Appendices B + C + D | Full technical detail |

Same source artifact, four subset filters. No content drift between them by construction.

## KEEP / OPTIMIZE / RETIRE verdict — deterministic, no-AI

```
axes:    Adoption · Cost · Quality · Refresh
rag:     g (good) | a (amber) | r (red)
verdict: RETIRE   if adoption.rag === 'r'
         OPTIMIZE if any red OR ≥2 amber
         KEEP     otherwise
```

Mirrors LP T1.18 (the *Model Scorecard*). Sample render shows KEEP for Sales Analytics (one amber on Refresh, three greens).

## Edge states

- **Missing manual data** — empty states with "add via …" prompts (never blank or fabricated).
- **Outdated source model** — banner on the modal: "Source model has changed since last generated. Regenerate to refresh."
- **No glossary terms attached** — measure/column descriptions stay blank; the *Business context* group renders empty + a populate prompt.
- **Switching audience tabs** — same data, different subset of pages; the modal pagination resets to page 1.

## Components used

- `DocumentPreviewModal` (modal shell + audience switch + page nav)
- `CompleteCover` (new tier-1 cover with verdict band + completeness meter)
- `completePages(ctx)` (page builder for the full render)
- `GroupLead` + source chips
- Reused section components: `ExecKpiGrid` · `ExecNoteBlock` · `QualityScoreSection` · `RefreshHistorySection` · `FindingsList` · `TablesOverview` · `RelationshipsTable` · `ErDiagram` · `HierarchiesSection` · `MeasuresList` · `CalcGroupsSection` · `RlsTable` · `OlsSection` · `SensLabelsTable` · `AccessSection` · `LineageBlocks` · `AdoptionSection` · `StorageSection` · `CostAttributionSection` · `GlossaryList` · `OwnersTable` · `ChangelogTable` · `SignOffBlock` · `ColumnsForTable` · `PowerQuerySection` · `MeasureUsageSection`

## Local-file deliverable

A real `.docx` generator exists for this view (run locally; the operator gets a Word file they can open):

```
node scripts/gen-complete-docx.mjs   # script created on demand; not committed
                                     # → Sales-Analytics-Complete-Document.docx
```

Mirrors the on-screen render: cover scorecard with verdict band, briefing body, appendices. Validates clean OOXML.

## Notes for LP-side PRD authoring

- LP has already absorbed this into **T1.18 "C2d — the Perfect Document"** (canonical PRD `docs/prd/c2d-documents-auto-word-generation.md`, V2 framing: Model Scorecard + Technical Reference). The mockup design intent + this narrative are the design brief; LP authored the canonical implementation PRD.
- The KEEP/OPTIMIZE/RETIRE verdict + adoption/cost/refresh axes depend on the **telemetry rollup** (LP T1.16, shipped 2026-05-24).
- Glossary-driven descriptions depend on the **Business Glossary pillar** (LP T1.17).
- Sign-off block depends on the **Ownership** layer (mockup ready, not yet on LP backlog).
