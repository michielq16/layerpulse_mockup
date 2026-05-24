# PRD — Business glossary (tenant-wide dictionary + model attachment)

| | |
|---|---|
| **Status** | Draft · ready for operator review |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (foundation for the Documents complete-doc) |
| **Pillar** | Governance & Compliance (P3) — feeds Semantic Model Quality (P2) |
| **Persona** | Both — partner (per-customer dictionary) + direct customer |
| **Mockup source** | `docs/screens/glossary.md` · live at `/glossary` + `VocabularyPanel` on `/models/[id]` |
| **Real-product surface** | `app.layerpulse.com/glossary` (new route) + model-detail attachments |
| **Depends on** | LP DB (no Fabric API exists for this) · AAD user directory (owner/SME pickers) · model-introspection (attach targets) |
| **Blocks** | Documents "complete document" (glossary-driven descriptions + per-audience glossary sections) · trustworthy Analyst/Auditor docs |

---

## 1. Problem

Fabric exposes column types, table names, and DAX. It does **not** expose what a term *means in this business*, who owns the definition, whether it's approved, or where the policy doc lives. That knowledge is scattered across Confluence, Notion, Power BI tooltips, and Slack — so every analyst onboarding restarts from zero, every QBR re-litigates "what does NRR mean here," and every auto-generated document either invents a description or leaves it blank.

There is no Fabric API for business semantics. Microsoft Purview *has* a glossary, but it's a separate product, separately licensed, manually maintained, and disconnected from any document-generation surface. Most Fabric tenants don't populate it.

LayerPulse already holds the technical catalog. A tenant-wide glossary that **attaches terms to model objects** lets the business meaning travel with the technical asset — and lands, canonically, in every generated document.

## 2. Goals · non-goals

### Goals (v1)

- **G1.** A single tenant-wide dictionary of business terms (Metric / KPI / Dimension / Business term / Acronym / Process).
- **G2.** DAMA-DMBOK-shaped metadata per term: definition · type · domain · status · sensitivity · owner · SME · source · business-process URL · synonyms · related terms · review cadence.
- **G3.** **Attach terms to semantic-model objects** — model / measure / column / table — many-to-many.
- **G4.** Surface attachments where the work happens: `VocabularyPanel` on the model Overview, a glossary subsection on the Measures drawer, and per-audience glossary sections in the Documents modal.
- **G5.** Drive document descriptions from attached terms (the "no invented prose" rule).
- **G6.** A–Z dictionary view (default) + Cards view, with filter rail (type/domain/status/sensitivity/owner).
- **G7.** Manual entry first (no auto-suggest in v1).

### Non-goals (v1)

- **NG1.** Auto-suggesting attachments by naming/synonym/DAX-scan (Phase 2).
- **NG2.** Bulk-apply a term to all models in a workspace (Phase 2).
- **NG3.** Microsoft Purview import/sync (Tier 2).
- **NG4.** Definition versioning / approval workflow (the ownership audit-log pattern may suffice; revisit).
- **NG5.** Per-attachment domain/sensitivity override.
- **NG6.** LLM-generated definitions (Q3+, humans-in-the-loop only).

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **Data steward** | "Define NRR once, attach it to the measure, and have it appear in every doc + tooltip." → `/glossary` → Add term → attach to `[Net Revenue Retention %]`. |
| **New analyst** | "Learn the vocabulary before my first task." → `/glossary` A–Z view → read top-to-bottom. |
| **Partner consultant** | "The auditor doc must cite canonical definitions, not invented prose." → attachments flow into the Auditor/Analyst doc automatically. |
| **BI engineer** | "Which glossary term does this measure implement?" → Measures tab → select measure → Business glossary subsection. |

## 4. 5-gate scorecard

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Governance (definition authority) feeding Quality (trustworthy docs) |
| **G2 · JOIN** | `business_terms × term_attachments × semantic_model_objects` — no Fabric API exposes business semantics; LP is the only place holding both layers |
| **G3 · Persona** | Steward defines once; analyst/auditor/exec consume everywhere; partner ships trustworthy docs |
| **G4 · Differentiator** | Tenant-wide dictionary **attached to the technical catalog** and **joined into auto-docs** — Purview has the data shape but no doc generation; Power BI has doc potential but no semantics |
| **G5 · Decision** | "Is this the official definition? What uses it? Who do I ask?" — answered in <5s |

## 5. Information architecture

```
/glossary
├── 5 StatCards (total / approved / proposed / review-overdue / orphan)
├── filter rail (search · Type · Domain · Status · Sensitivity · Owner)
└── main view
    ├── [A–Z]  (DEFAULT)  letter index + alphabetical groups + dictionary rows
    └── [Cards]           card grid + sort dropdown
    └── term detail drawer (definition · meta grid · synonyms · related · linked-to)

/models/[id]/overview
└── VocabularyPanel   (sectioned chips by type · "+ Attach term")

/models/[id]/measures
└── selected-measure drawer → "Business glossary" subsection · "+ Attach term"

DocumentPreviewModal
└── per-audience glossary sections + glossary-driven measure/column/table descriptions
```

A–Z is the default view (operator decision 2026-05-20) — a glossary is a dictionary; the alphabetical reference is the primary read.

## 6. Functional requirements

### 6.1 Dictionary (`/glossary`)

- **FR-GL-1** 5 StatCards: total · approved · proposed · review-overdue · orphan (no model linked).
- **FR-GL-2** Filter rail (sticky 240px): search (term ∪ definition ∪ synonyms) + chip-groups Type / Domain / Status / Sensitivity (counts, tone-tinted) + Owner select. Search input constrained to rail width.
- **FR-GL-3** View toggle defaults to **A–Z**. A–Z = letter thumb-index (letters with terms only) → smooth-scroll; alphabetical groups with sticky letter + rows `Term [TYPE] [status if not approved] — first-sentence definition`. Cards = grid + sort dropdown (Alphabetical / Recently reviewed / Review-due first / Status).
- **FR-GL-4** Term detail drawer (680px): definition · 2-col meta grid (Owner · SME · Source · Business-process URL · Last reviewed · Next review) · synonyms chips · related-terms chips (navigable in-drawer) · **Linked-to** (model + measure chips). Edit toggle. 
- **FR-GL-5** Add-term drawer: Term · Definition · Type · Domain · Status (default Proposed) · Sensitivity (default Internal) · Owner · SME · Source · URL · Synonyms (CSV) · Related (CSV) · Review cadence.
- **FR-GL-6** Controlled vocabularies: types (business/metric/kpi/dimension/acronym/process) · statuses (approved/proposed/under-review/deprecated) · sensitivities (public/internal/confidential/restricted) · domains (tenant-configurable).

### 6.2 Attachment

- **FR-AT-1** A term attaches to N model objects; an object has N terms (many-to-many).
- **FR-AT-2** Attachment levels: `model` · `measure` (by `model_id + measure_name`, accepting bracketed + bare forms) · `column` (`Table[Column]`) · `table`.
- **FR-AT-3** Type → home guidance (soft, not enforced): Metric/KPI → measure · Dimension → table/column · Business term → anywhere · Acronym → model-level · Process → model-level.
- **FR-AT-4** `VocabularyPanel` on model Overview: sectioned chips by type for every term attached to the model; "+ Attach term" → search/filter drawer; chip click → detail drawer.
- **FR-AT-5** Measures-tab drawer: "Business glossary" subsection listing terms attached to the selected measure; "+ Attach term" scoped to that measure.
- **FR-AT-6** Process attaches to the **model**, never the workspace (the workspace is the container; the process governs the model).

### 6.3 Document binding

- **FR-DB-1** Measure/column/table descriptions in the Documents modal come **only** from an attached term (first sentence) + a type tag. No attachment → no description rendered.
- **FR-DB-2** Per-audience glossary sections pull terms attached to the model: Analyst (full, grouped) · Executive (Metric+KPI) · Auditor (Process+Acronym) · Engineer (Acronym+Dimension). Falls back to canonical fixture only to avoid an empty section.

### 6.4 Data contract

```sql
CREATE TABLE business_terms (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  term            TEXT NOT NULL,
  definition      TEXT NOT NULL,
  type            TEXT NOT NULL,   -- business|metric|kpi|dimension|acronym|process
  domain          TEXT NOT NULL,
  status          TEXT NOT NULL,   -- approved|proposed|under-review|deprecated
  sensitivity     TEXT NOT NULL,   -- public|internal|confidential|restricted
  owner_email     TEXT,
  sme_email       TEXT,
  source          TEXT,
  process_url     TEXT,
  synonyms        TEXT[],          -- free strings (soft-link)
  related         TEXT[],          -- free strings (soft-link)
  last_reviewed_at TIMESTAMPTZ,
  next_review_at   TIMESTAMPTZ,    -- ops anchor: daily cron flags overdue
  created_at      TIMESTAMPTZ NOT NULL,
  created_by      TEXT
);

CREATE TABLE term_attachments (
  term_id      TEXT NOT NULL REFERENCES business_terms(id),
  object_type  TEXT NOT NULL,    -- model|measure|column|table
  model_id     TEXT NOT NULL,
  object_ref   TEXT,             -- measure name | 'Table[Column]' | table name | null for model-level
  attached_by  TEXT,
  attached_at  TIMESTAMPTZ NOT NULL,
  why          TEXT,             -- optional context
  PRIMARY KEY (term_id, object_type, model_id, object_ref)
);
CREATE INDEX ta_model_idx ON term_attachments (model_id);
CREATE INDEX ta_term_idx  ON term_attachments (term_id);
```

`synonyms`/`related` are string arrays (not FKs) so terms can soft-link to terms that don't exist yet.

### 6.5 Joins required (LayerPulse-only)

```
business_terms
  ⋈ term_attachments ⋈ semantic_model_objects   (VocabularyPanel, Measures drawer, doc descriptions)
  ⋈ aad_users                                    (owner / SME display)
```

## 7. States · edge cases

| State | Trigger | UI |
|---|---|---|
| Empty glossary | 0 terms | A–Z empty + "add the first term" |
| No matches | filters exclude all | "Clear filters or add the first term" |
| Orphan term | 0 attachments | detail drawer: "No model or measure references this term yet. Map manually →" |
| Review overdue | `next_review_at < now()` | rose flag on card + drawer; daily cron → `/alerts` if steward has >3 overdue |
| Deprecated term | status=deprecated | slate pill; definition opens with `[DEPRECATED YYYY-MM]` |
| Broken related-term | related name not in glossary | plain non-clickable chip |
| Search-rail overflow | — | `.lp-search` constrained to 100% inside the rail (global default is 320px) |

## 8. Telemetry

| Event | Properties |
|---|---|
| `glossary.view_toggled` | view (az\|cards) |
| `glossary.term_opened` | term_id, type, from (az\|cards\|vocab_panel\|measure_drawer) |
| `glossary.term_added` | type, domain, status |
| `glossary.term_attached` | term_id, object_type, model_id |
| `glossary.filter_applied` | filter_type, value |

## 9. Rollout

| Phase | Audience | Flag | Success |
|---|---|---|---|
| 0 Internal | eng + 1 partner | `lp.glossary.v1` @layerpulse | seed 50 terms |
| 1 Closed beta | 5 partner orgs | per-org | ≥3 orgs attach ≥20 terms in wk1 |
| 2 GA | all | default-on | glossary-driven descriptions appear in ≥50% of generated docs |

## 10. Open questions

- **OQ-1** Glossary scope confirmed tenant-wide single dictionary (operator). Per-workspace dictionaries rejected (duplication).
- **OQ-2** ✅ **Resolved 2026-05-23** — multiple terms on one measure: a **"primary" flag** on the attachment picks the canonical definition for the doc.
- **OQ-3** Domain list: tenant-configurable vs fixed 7? (Mock: fixed Finance/Sales/Marketing/Operations/HR/Product/Compliance.)
- **OQ-4** Should `why` be required on attachments (like the ownership override "why")? Audit value vs friction.
- **OQ-5** ✅ **Resolved 2026-05-23** — **standalone governance screen**, not part of Documents (value is independent of doc generation; Documents is a consumer). Accepted into LayerPulse backlog as **T1.16**.
- **OQ-6** ✅ **Resolved 2026-05-23** — attachment auto-suggest (name match) is deferred to **Phase 2**; v1 is manual attachment only.

## 11. Acceptance checklist for `/build-feature`

- [ ] Data contract (§6.4) accepted by platform team
- [ ] OQ-1 through OQ-4 answered
- [ ] Attachment surfaces (VocabularyPanel + Measures drawer + doc binding) signed off
- [ ] Mockup `/glossary` + model attachment reviewed by operator
- [ ] PRD tagged `v1.0`, linked from `/build-feature` issue

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/glossary` · attachment at `https://layerpulze-mockup.vercel.app/workspaces/finance-prod/sales-analytics` (Overview · Measures)
**Screen narrative:** `docs/screens/glossary.md`
**Related PRDs:** `docs/prds/documents.md` · `docs/screens/ownership.md` · `docs/analysis/fabric-artifact-ownership-conventions.md`
