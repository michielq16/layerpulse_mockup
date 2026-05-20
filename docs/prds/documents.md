# PRD — Documents (semantic-model documentation vault + generator)

| | |
|---|---|
| **Status** | Draft · ready for operator review |
| **Author** | LayerPulse Mockup Designer (this codebase) |
| **Target release** | Q3 2026 (post-FinOps GA) |
| **Pillar** | Semantic Model Quality (P2) — top-ranked of 7 priorities |
| **Persona** | Partner (Y1) — managing 10–50 customer Fabric tenants |
| **Mockup source** | `docs/screens/documents.md` · live preview at `/documents` on the mockup |
| **Real-product surface** | `app.layerpulse.com/documents` (new route) |
| **Depends on** | Semantic-model introspection (already shipped) · Model metadata DB · Worker pool for async generation · Object storage for rendered docs |
| **Blocks** | C2d "Customer documentation review" SOC 2 control evidence |

---

## 1. Problem

A Microsoft partner managing 30 Fabric tenants gets the same recurring ask: *"send the auditor the docs for `Sales Analytics` by Tuesday"* / *"new analyst starting Monday — give them a handoff doc for `Budget Planning`"* / *"the executive review is in 2 hours and Revenue Forecast hasn't been documented in 6 months."*

Today they either:
- (a) write the doc by hand from PowerPoint templates (4–8 hours per model, rots immediately on next model change),
- (b) export DAX Studio's measure list as CSV and email it (incomprehensible to auditors), or
- (c) skip the doc and live with the audit finding.

Microsoft's surfaces (Fabric admin portal, DAX Studio, Tabular Editor, Power BI Desktop) **render** the metadata but never produce an audience-shaped artifact. There is no "give me the doc" button in the Microsoft stack.

The mockup demonstrates that the document **is** the deliverable, and LayerPulse can produce it deterministically because we already join `model_metadata × workspace × tenant_settings × activity_events × lineage_edges` for every tenant we monitor.

## 2. Goals · non-goals

### Goals (in scope for v1)

- **G1.** Generate audience-shaped documents (Auditor / Analyst / Executive / Engineer / Custom) from any semantic model with metadata in our store.
- **G2.** Make every previously generated doc discoverable and re-downloadable from a library — the **default landing tab**.
- **G3.** Auto-detect when a doc is outdated (source model changed since last generation) and surface a one-click regenerate.
- **G4.** Schedule auto-regeneration per doc (Daily / Weekly / Monthly / On-change / Off).
- **G5.** Support 3 output formats: `.docx` (Word, the headline), `.pdf`, `.md`.
- **G6.** Median generation time ≤ 30s for models up to 100 measures / 200 columns / 30 tables.

### Non-goals (explicit cuts for v1)

- **NG1.** Editing a generated document in-browser. (We're a generator; if you want to edit, download the .docx.)
- **NG2.** Multi-model documents in a single file (one doc = one semantic model in v1; portfolio docs are v2).
- **NG3.** Real-time collaborative editing.
- **NG4.** PowerPoint output.
- **NG5.** Internationalization (English only at GA; locale plumbing must not block).
- **NG6.** Approval workflows ("send to manager for sign-off") — that's a Q4 add.
- **NG7.** Embedded doc viewer with redlining. Click-to-download is the v1 deliverable.

## 3. Users · jobs-to-be-done

| Persona | Job |
|---|---|
| **Partner consultant** | "Hand the auditor SOC 2 evidence for 4 customer models by Tuesday." → Library tab → filter `audience=Auditor` → click each row's Download. |
| **Partner analyst lead** | "New analyst starts Monday on Finance — give her every doc she needs for onboarding." → Generate tab → pick `Sales Analytics`, choose Analyst preset, .docx, download. |
| **Direct customer BI lead** (Y2) | "Auto-keep our 6 prod models documented." → Library tab → set each row's schedule chip to `On change`. |
| **Partner exec sponsor** | "Show me one-page summary of `Revenue Forecast` for the QBR." → Generate → Executive preset → .pdf. |

## 4. Value-loop quadrant + 5-gate scorecard

**Quadrant:** **Render** (we ingest + join + validate in other places — this surface turns the result into the artifact)

| Gate | Answer |
|---|---|
| **G1 · Pillar** | Quality — auditable, regeneratable model docs |
| **G2 · JOIN** | `model_metadata × workspace × lineage_edges × rls_rules × sensitivity_labels × change_log × glossary_terms` — Microsoft renders these in 5 separate UIs and none of them produces a document |
| **G3 · Persona** | Partner saves 4–8 hrs per model × 10s of models × every customer change |
| **G4 · Differentiator** | Audience presets · auto-regen on model change · partner-portfolio-wide doc library · auditor-ready Word output |
| **G5 · Decision** | "Send THIS file to the auditor / new hire / exec by Tuesday" — concrete, downloadable, dated |

## 5. Information architecture

```
/documents
├── [Library]   (default tab)
│   ├── outdated banner (visible iff any doc outdated)
│   ├── 4 StatCards (modelsDocumented / generated30d / outdated / medianGenSec)
│   ├── filter row (search, status chips, workspace, audience, sort)
│   └── doc-row list (one per generated doc; schedule chip per row)
└── [Generate]
    ├── 3-step grid (Pick model · Choose sections · Live preview)
    └── Generate button → async job → drops the result into Library
```

The Library/Generate split was an explicit operator decision (2026-05-17) — the prior layout led with the generator, but the 90% case is "grab the auditor doc for Customer X now," not "configure a new generation." The library is the daily door.

## 6. Functional requirements

### 6.1 Library tab (default view)

- **FR-LIB-1** Lands as default tab on `/documents`. State persists in URL: `/documents?tab=library`.
- **FR-LIB-2** Renders 4 StatCards: `modelsDocumented / 34` · `generated30d` · `outdated` · `medianGenSec`. Numbers are the headlines; copy is sub-line only.
- **FR-LIB-3** Outdated banner auto-shows when `count(docs where status='outdated') > 0`. Banner has two CTAs: `Set up auto-regen` (deep-links to schedule popover) and `Regenerate all` (queues all outdated for regen in one async batch).
- **FR-LIB-4** Filter row contains:
  - Search box (matches model name ∪ workspace name, case-insensitive substring)
  - Status chips: All / Current / Outdated / Scheduled — with live counts, mutually exclusive
  - Workspace dropdown (distinct workspaces from the doc list)
  - Audience dropdown (distinct audiences from the doc list)
  - Sort dropdown: Recently generated (default) / Name A–Z / Outdated first
- **FR-LIB-5** Each row shows: model icon (tone from model.tone) · model name + audience pill + status pill · workspace + format + "updated X ago" (with absolute UTC tooltip) + size · schedule chip · row actions (View / Regenerate / Download).
- **FR-LIB-6** Audience pill colors:
  - Auditor → rose
  - Analyst → sky
  - Executive → amber
  - Engineer → violet
- **FR-LIB-7** Outdated rows get a 3px rose left-edge accent.
- **FR-LIB-8** Schedule chip click opens a popover with 5 options (Off / Daily / Weekly / Monthly / On change). Selection persists to backend. Chip label updates immediately (optimistic) and shows next-fire time when not Off.
- **FR-LIB-9** Row actions:
  - **View** → opens rendered doc in new tab (signed-URL fetch from object storage)
  - **Regenerate** → queues async job; row replaced by skeleton until job finishes; toast on success/failure
  - **Download** → triggers signed-URL download in browser
- **FR-LIB-10** Empty-state copy when filters yield 0 results: "No documents match. Adjust the filters above, or generate a new document." Never "No data yet."

### 6.2 Generate tab

- **FR-GEN-1** Selecting the Generate tab navigates to `/documents?tab=generate`. The `[+ Generate new]` page-header CTA jumps to this tab from anywhere.
- **FR-GEN-2** Three-column grid: Pick model · Choose sections · Live preview.
- **FR-GEN-3** **Model picker (column 1):** search + chip filter (All / Outdated / Never). Rows show model name, workspace, table+measure counts, last-gen status pill. Click selects.
- **FR-GEN-4** **Sections (column 2):** Audience preset tabs (Auditor / Analyst / Executive / Engineer / Custom). Selecting a preset toggles a default section set. Manually toggling any section flips audience to Custom and shows "Reset to <preset>" link.
- **FR-GEN-5** Section list grouped: Cover & summary / Schema / Logic / Lineage / Governance / Context. Each item shows item count (from model metadata where applicable, e.g., `42 measures`).
- **FR-GEN-6** Format selector: `.docx` (default) / `.pdf` / `.md`. Include-logo checkbox.
- **FR-GEN-7** **Live preview (column 3):** Word-shaped page preview showing the section order with item counts and estimated page count + file size. Updates on every selection change (debounced 150ms).
- **FR-GEN-8** Generate button: posts the job spec to `/api/documents/generate` (async), shows progress toast, lands the result row at the top of Library when complete. Median wall-clock target: 24s.

### 6.3 Data contract

Each library doc row is one row in `generated_documents`:

```sql
CREATE TABLE generated_documents (
  id              TEXT PRIMARY KEY,             -- 'd1', 'd2', ...
  tenant_id       TEXT NOT NULL,
  model_id        TEXT NOT NULL,                -- FK semantic_models.id
  workspace_id    TEXT NOT NULL,
  audience        TEXT NOT NULL,                -- 'auditor' | 'analyst' | 'executive' | 'engineer' | 'custom'
  format          TEXT NOT NULL,                -- 'docx' | 'pdf' | 'md'
  status          TEXT NOT NULL,                -- 'current' | 'outdated' | 'generating' | 'failed'
  section_spec    JSONB NOT NULL,               -- { sections: ['cover','exec','tables',...], includeLogo: true }
  model_hash_at_gen TEXT NOT NULL,              -- the model_metadata content hash at the moment of generation
  storage_url     TEXT NOT NULL,                -- signed URL prefix for the rendered file
  size_bytes      INT NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL,
  schedule        TEXT NOT NULL DEFAULT 'off',  -- 'off' | 'daily' | 'weekly' | 'monthly' | 'onchange'
  schedule_next   TIMESTAMPTZ,                  -- null iff schedule = 'off'
  generated_by    TEXT,                         -- UPN
  job_id          TEXT                          -- async job correlation
);
CREATE INDEX gd_tenant_status_idx ON generated_documents (tenant_id, status, generated_at DESC);
CREATE INDEX gd_model_idx         ON generated_documents (model_id);
```

**Outdated detection** runs nightly:
```sql
UPDATE generated_documents gd
SET status = 'outdated'
FROM semantic_models sm
WHERE sm.id = gd.model_id
  AND sm.content_hash <> gd.model_hash_at_gen
  AND gd.status = 'current';
```

### 6.4 Joins required (LayerPulse-only)

```
generated_documents
  ⋈ semantic_models       (current model_hash → outdated detection)
  ⋈ model_metadata        (tables, columns, measures, relationships, DAX text)
  ⋈ workspace             (workspace name, env classification)
  ⋈ lineage_edges         (upstream sources / downstream reports sections)
  ⋈ rls_rules             (Auditor preset)
  ⋈ sensitivity_labels    (Auditor preset)
  ⋈ glossary_terms        (Analyst/Executive context section)
  ⋈ change_log            (last 90d change-log section)
```

Microsoft surfaces never join `model_metadata × rls_rules × lineage_edges` for a single artifact. This is the moat.

### 6.5 Renderer

- **REN-1** One renderer service, three pipelines: `docx` (python-docx or equivalent), `pdf` (HTML → headless Chromium → PDF), `md` (string templates).
- **REN-2** Templates live in `/renderer/templates/<audience>/<section>.{docx-fragment,html,md.j2}`. Custom audience composes from the same fragments by section_spec.
- **REN-3** Branding: the partner's tenant logo (when configured) appears on the cover. Falls back to LayerPulse mark.
- **REN-4** Outputs land in object storage at `s3://lp-docs/<tenant_id>/<model_id>/<doc_id>.<ext>`. Signed-URL TTL = 1h for view/download; regenerated on each library load.
- **REN-5** Failed jobs flip `status='failed'`; library row shows rose status pill and an "Why did this fail?" link → modal with worker log excerpt.

## 7. States · edge cases

| State | Trigger | UI behavior |
|---|---|---|
| Loading library | First mount | Skeleton: 10 doc-row skeletons + 4 StatCard skeletons. NO spinner. |
| Empty library (no docs ever) | `count(generated_documents WHERE tenant_id=$) = 0` | Library shows: "No documents yet. Generate your first one →" with link to Generate tab. NEVER "No data yet." |
| Outdated banner suppressed | User dismisses the banner | Hidden for 24h via local preference; reappears next day if still outdated. Never permanently dismissable. |
| Schedule chip during generation | Doc has status='generating' | Chip disabled, tooltip "Available after generation completes". |
| Generation in progress in another tab | Backend pushes via SSE | Affected library row swaps to "Generating…" pill with shimmer; no full page reload. |
| Generation fails | status='failed' | Row pill is rose "Failed". Row action set: View → log modal. Regenerate enabled. Download disabled. |
| Model deleted but docs exist | model_id no longer in semantic_models | Row shows "Source model deleted" status; only Download enabled; row title is the cached model name at gen time. |
| Permission-denied on workspace | Partner lost read scope after doc was generated | Row is shown but Download/View disabled with tooltip "Re-grant partner-read on this workspace in Connections." |
| Network error on Download | Signed URL expired | Toast: "Link expired. Regenerating download link…" auto-retries once. |
| Concurrent edits to schedule | User changes chip in two tabs simultaneously | Last-write-wins; tab without focus refreshes chip on next visibility-change. |

## 8. Telemetry

Send via the existing telemetry pipe (PostHog project `Default project` / id 167104). Event names follow `documents.<verb>`:

| Event | Properties | Why we track it |
|---|---|---|
| `documents.tab_viewed` | tab (library\|generate), doc_count, outdated_count | Validate Library-first IA decision |
| `documents.filter_applied` | filter_type (status\|workspace\|audience\|sort), value | Find which filters matter |
| `documents.row_clicked` | action (view\|regenerate\|download), audience, format, age_days | Format/audience demand mix |
| `documents.schedule_set` | from, to, audience | Find the dominant cadence |
| `documents.generate_started` | model_id, audience, format, section_count, custom (bool) | Conversion + audience mix |
| `documents.generate_completed` | model_id, duration_ms, output_bytes, success | Track p50/p95 against 30s SLO |
| `documents.generate_failed` | model_id, error_class | Find renderer regressions |
| `documents.outdated_banner_action` | action (regen_all\|setup_auto\|dismiss) | Banner ROI |

**Dashboard to build (PostHog):**
- Time-series of `documents.generate_completed.duration_ms` p50/p95
- Funnel: `tab_viewed[generate]` → `generate_started` → `generate_completed`
- Stickiness of users who set at least one schedule

## 9. Rollout plan

| Phase | Gate | Audience | Feature flag | Success criterion |
|---|---|---|---|---|
| **0 — Internal** | Smoke + 5 stub docs | Engineering + 1 design partner | `lp.documents.v1=true` for `@layerpulse.com` only | Renderer p95 ≤ 30s on stub set |
| **1 — Closed beta** | 5 partner orgs hand-picked | Partner consultants | `lp.documents.v1` per-org allow-list | ≥ 3 of 5 partners generate ≥ 10 docs in week 1 |
| **2 — Open beta** | All partner orgs | Partners | `lp.documents.v1=true` default-on for `org.type='partner'` | Generation p95 < 30s sustained · failure rate < 2% |
| **3 — GA** | Direct customers | All tenants | Flag retired | Library tab is the most-visited surface in Quality pillar |

Rollback: feature flag flip + library route 302 → `/overview` with a banner "Documents temporarily unavailable."

## 10. Open questions (operator to resolve before `/build-feature`)

1. **OQ-1** Do partner-tenant docs include the customer's logo or the partner's logo on the cover? (Current mock: partner's. Likely customer's for SOC 2 evidence; needs legal review.)
2. **OQ-2** Is DAX expression text in the Engineer preset OK for SOC 2 evidence, or do we redact CALCULATE filters as a default? (Current: full expressions visible.)
3. **OQ-3** Retention policy for generated docs in object storage: 90d / 1y / forever? (Auditor scenario needs ≥ 7y; size grows quickly.)
4. **OQ-4** Is the `On change` schedule cadence rate-limited? (A volatile model with hourly schema changes would queue 24+ jobs/day.)
5. **OQ-5** Is the partner allowed to download docs for a customer they're no longer partner-of-record for? (Probably no; need a Connections-side check at signed-URL time.)
6. **OQ-6** Does v1 ship custom section ordering or is the section sequence fixed by audience? (Current mock: fixed by audience preset, Custom audience uses the same order with a different membership set.)

## 11. Out of scope but parked for v2

- Doc-level access control (today: anyone in the tenant who can see the model can see its docs)
- "Bring your own template" — customer-uploaded .dotx as a section-fragment override
- PDF redlining vs. last-generated version
- Portfolio document — one .docx covering 5 models for a customer review
- Inline doc preview pane (vs. download-only)
- Email delivery: "send this PDF to auditor@firm.com weekly"

## 12. Acceptance checklist for `/build-feature`

The real-product team can pick this up when:

- [ ] Open questions OQ-1 through OQ-6 are answered
- [ ] Data contract (§6.3) accepted by the platform team
- [ ] Renderer infra capacity sized for projected load (estimate: 200 jobs/day at GA, p95 worker memory 2 GB)
- [ ] Object-storage retention policy decided (OQ-3)
- [ ] Mockup `/documents` reviewed and signed off by operator
- [ ] PRD this doc tagged `v1.0`, linked from the `/build-feature` issue

---

## 13. Addendum (v1.1) — rendered preview modal + automated/manual section model

*Added 2026-05-20 after the mockup grew the rendered preview + the complete-document section set. §1–12 above describe the library/generate flow and remain valid; this addendum captures everything the mockup has demonstrated since.*

### 13.1 The DocumentPreviewModal (the headline interaction)

The "Generate .{format}" CTA and every library/Documentation-tab row now open a **rendered Word-shaped preview** instead of just dropping a file. This is the wow-moment surface.

- **FR-MODAL-1** Fullscreen drawer (≈92vw/92vh), **must portal to `document.body`** — it cannot render inside the page content tree because the model-detail tab wrapper carries a persisted CSS transform that becomes a containing block and traps `position: fixed`. (Mockup learning — server-rendered product won't have this exact bug but the modal must still be a top-level overlay.)
- **FR-MODAL-2** Sticky header with a **4-way audience seg-switch** that re-renders the body in place. One generation → all 4 audience variants viewable without re-fetch.
- **FR-MODAL-3** Body is a paginated 816×1056 (US-Letter @ 96dpi) page strip. The preview styling is a **fidelity hint**; the server-side `.docx` renderer is source of truth and must match font/spacing/numbering.
- **FR-MODAL-4** Footer page-nav tracks scroll position. Format selector + Regenerate + Download + Close (Esc).

### 13.2 Automated vs. manual — the section architecture

Every section belongs to one of two buckets. This split is the spine of the feature.

| Bucket | Source | Sections |
|---|---|---|
| **Automated** | Fabric API + LP collectors | Cover metadata · Exec-summary KPIs · **Model maturity / quality score** · Scope & method · Schema (tables/cols) · Relationships · ER diagram · **Power Query (M)** · Measures + DAX · Calc columns · RLS + Sensitivity · **Access** (perms × RLS scope) · **Refresh history** · **Adoption** · Lineage · Change log |
| **Manual** | LP-side foundation | Owner / SME / Stewards (→ cover credit + Auditor sign-off + Analyst contact card) · Domain · Business-glossary attachments (→ glossary sections + measure/column/table descriptions) |

**Degradation rule:** automated sections render even with zero manual data. Manual sections render explicit empty-states ("No stewards assigned in LP. Add via /ownership") — **never fabricated content**. This is what makes the doc trustworthy.

### 13.3 New automated sections (added v1.1)

- **FR-QUALITY-1** Model-maturity section: overall score + per-dimension bars (Naming/Sources/Performance/Structure/Hygiene/Discoverability) + weakest-dimension note. Audiences: Auditor · Analyst · Engineer.
- **FR-REFRESH-1** Refresh-history section: 24h/7d/30d/90d run rollup (runs/ok/failed/success-rate) + recent failures with reasons. Audiences: Auditor · Analyst · Engineer. Audience-specific framing (Analyst: "stale = untrustworthy"; Engineer: "first place to look"; Auditor: "reliability evidence").
- **FR-ACCESS-1** Access section: principal × role × member-count × **RLS scope**. Audiences: Auditor (who-can-read control) · Engineer ("does my RLS work?" — each Read group maps to an RLS rule). Source: Admin API permissions + AAD Graph group expansion.
- **FR-ADOPTION-1** Adoption section: DAU/WAU/MAU + total opens + dormant count + top downstream surfaces. Audiences: Analyst · Executive · Engineer. Source: activity_events on downstream reports.
- **FR-MCODE-1** Power Query (M) section: the M expression per table (ingestion/transform layer), extracted from partition definitions via Scanner getDefinition / TMDL. Audience: Engineer. Rendered distinct from DAX (green-on-dark vs gold-on-dark).

### 13.4 Manual-data bindings

- **FR-OWNERBIND-1** Cover Owner = `resolveModelOwner(model, ws)` w/ inheritance indicator. Auditor sign-off = Owner + up to 2 Stewards (+N overflow) + external-auditor row. Analyst contact = SME with fallback-to-Owner indicator. All empty-states explicit. Source: `model_owners` (see PRD `ownership.md`).
- **FR-GLOSSBIND-1** Measure / column / table descriptions come **only** from an attached business-glossary term (`linkedTo.measures` / `.columns` / `.tables`). No attachment → no description. Each rendered description carries a tone-coded type tag (`METRIC · AOV`). Source: `business_terms` + attachment junctions (see PRD `glossary.md`).
- **FR-GLOSSBIND-2** Per-audience glossary section pulls terms attached to *this* model: Analyst (full, grouped by type) · Executive (Metric+KPI) · Auditor (Process+Acronym appendix) · Engineer (Acronym+Dimension appendix).

### 13.5 Per-model entry point

- **FR-MODELDOC-1** `/models/[id]` → Documentation tab shows 4 audience preset cards + a versions list filtered to that model (from `generated_documents WHERE model_id=$`). Cards + version rows open the same modal. Empty-state when the model has no versions.

### 13.6 Additional open questions (v1.1)

- **OQ-7** Access section: do we expand AAD nested groups to effective-member counts, or show direct membership only? (Graph transitive expansion is expensive at scale.)
- **OQ-8** Refresh-history window: 90d in the doc, or configurable? Does the auditor need the full retention window (≥1y)?
- **OQ-9** Power Query M for the Auditor preset as data-provenance evidence (condensed, source-only)? Operator considering.
- **OQ-10** When a measure has multiple attached glossary terms, which wins for the description? (Current mock: first match. Likely needs a "primary term" flag on the attachment.)

---

**Mockup reference:** `https://layerpulze-mockup.vercel.app/documents` · model entry `https://layerpulze-mockup.vercel.app/workspaces/finance-prod/sales-analytics` → Documentation tab
**Screen narrative:** `docs/screens/documents.md`
**Related PRDs:** `docs/prds/glossary.md` · `docs/screens/ownership.md`
