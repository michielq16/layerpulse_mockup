# Fabric-artifact ownership — industry conventions + LP recommendation

**Date:** 2026-05-19
**Trigger:** Operator question — "I want to add the different roles to the semantic-model overview. How does Purview do this? How do other BI tools handle ownership in the Fabric/Power BI context? Workspace vs. report vs. semantic model? Glossary side is easy (owner / SME of a domain) — what about Fabric artifacts?"
**Scope:** Survey of how Purview / Power BI / Tableau / Looker / Atlan / Collibra handle artifact-level ownership. Recommend LP's approach tied to the goal of the generated document.

---

## Industry survey

### Microsoft Purview (the closest direct competitor for this surface)

Purview is Microsoft's data catalog. Asset-level ownership is first-class — every catalog entry (dataset, table, column, lakehouse, report) can carry multiple owners.

**Roles supported per asset:**
- **Asset Owner** — accountable; typically a person or AAD group
- **Subject Matter Expert (SME)** — knowledge holder; multiple allowed
- **Data Steward / Curator** — governance; reviews changes, approves classifications
- **Data Custodian** — operational responsibility (less common in deployments)

**Hierarchy + inheritance:** Purview uses a collection hierarchy (tenant → collection → asset). Owners can be set at the collection level and inherited down, with per-asset override.

**Domain assignment:** Each asset belongs to a "data domain" (Finance, Sales, Operations, etc.) — controlled vocabulary, used for filtering and curator routing.

**Practical reality:** Purview is a separate product, separate licensing, separate UI. Most Fabric tenants don't actively populate Purview ownership fields because the UX requires leaving Power BI/Fabric and the connector to auto-doc-generation isn't there. Purview *has* the data shape but rarely *has the data*.

### Power BI / Fabric Admin Portal (native Microsoft surfaces)

Power BI itself has minimal ownership concept:
- **Workspace roles:** Admin · Member · Contributor · Viewer (permissions, NOT business ownership)
- **Dataset has a "configured by" user** — the credential-holder for the data source; transferable via "Take Over"
- **App has a publisher** — the user who published the app
- **Each item has a "modified by"** — last editor, not owner

Fabric adds:
- **Fabric Domains** (relatively new) — workspaces can be assigned to a domain for governance. NOT an owner; a grouping.

**No native concept of "Business Owner" or "SME" at the item level.** This is the gap LP is filling.

### Tableau Server / Cloud

- **Project Leaders** — workspace-equivalent governance
- **Content Owner** — singular per workbook / data source. Defaults to creator; transferable.
- **Certification** — admins can certify data sources; certifier is recorded.
- **Tags** — flexible, folksonomy-style.

Tableau treats ownership as singular per artifact, with certification as the trust signal.

### Looker

- **Folder Admin** — workspace
- **Content Owner** per Look / Dashboard / Model
- **LookML model developer** — implicit creator
- "Validator" role for certified Looks

### Atlan / Alation / Collibra (modern data catalogs)

Heavy hitters in the data-catalog space. All three converge on a similar shape:

- **Asset-level multi-role:** Owner · Steward · SME · Frequent User · Verified-by
- **Inheritance hierarchy:** database → schema → table → column (or workspace → asset for BI tools)
- **Domain assignment:** controlled vocab, often hierarchical (Finance → Tax → Indirect Tax)
- **Verification / endorsement:** "verified by Steward" stamp, visible everywhere the asset surfaces

**Practical reality:** these are enterprise products ($$$). Setup is heavy (full catalog ingestion, mapping workflow, steward onboarding). LP's audience is mid-market and Microsoft partners who can't justify Atlan-tier overhead.

---

## What converges across the industry

Despite different vocabularies, the pattern is consistent:

1. **Asset-level ownership is the norm.** Workspace-only is the exception (only PBI native does this, and the industry rates it inadequate).
2. **Multiple roles per asset.** Typically 3-5: Owner, Steward, SME, Technical Owner, Business Owner.
3. **Inheritance with override.** Workspace/collection defaults flow to assets; per-asset override for exceptions.
4. **Domain assignment.** Assets belong to a business domain (controlled vocab).
5. **Certification / endorsement.** Trust signal — "this is the canonical thing for this purpose."

---

## Fabric-specific structure

Fabric's logical hierarchy:

```
Tenant
└── Capacity
    └── Workspace
        ├── Semantic model
        │   └── (Tables · Columns · Measures · Relationships · RLS)
        ├── Report (thin or DirectQuery; usually depends on a semantic model)
        ├── Paginated report
        ├── App (packaged distribution)
        ├── Dataflow / Pipeline
        ├── Lakehouse / Warehouse
        └── Notebook
```

**Where should ownership live?**

The semantic model is the canonical unit for governance because:
- It's where the joins, measures, RLS, and sensitivity labels are defined
- Multiple reports usually point to one semantic model
- Auto-documentation (LP's C2d bet) renders *the semantic model*, not individual reports
- Refresh schedules attach to the semantic model
- Audit events (Scanner snapshots) are model-scoped

**Three levels that need ownership:**

| Level | Why | When to override workspace default |
|---|---|---|
| **Workspace** | Default for everything in it. Workspace lead is accountable for the workspace as a logical area (e.g. Finance-Prod). | Rarely overridden directly; serves as the inheritance source. |
| **Semantic model** | The canonical artifact. Most teams' day-to-day ownership conversations happen at this level. | When a downstream team builds a thin report on top of a shared model — the model owner doesn't change, but the report owner might. |
| **Report** | Consumer of a semantic model. Frequently owned by a different team than the model. | When a report's audience or domain differs from the model. Example: a sales report on the Finance "Sales Analytics" model — sales team owns the *report*, finance team owns the *model*. |

**LP's current state (PR #4):** workspace default + per-model override. **Two levels. Three are needed.**

---

## Tying to "what is the goal of the generated document?"

This is the key insight. Each audience preset for the auto-Word doc serves a different decision, and **each decision needs a different role surfaced**:

| Audience | Decision | Role surfaced on cover | Sign-off / contact field |
|---|---|---|---|
| **Auditor** | "Is this doc good enough to send to my SOC 2 auditor?" | Owner (accountable) | Sign-off block: Owner signature + Steward signature |
| **Analyst** | "Can I onboard a new analyst with this doc?" | Owner | "Questions? Contact:" = SME (falls back to Owner if no SME assigned) |
| **Executive** | "Can the CFO read this and trust it?" | **Business Owner** (falls back to Owner) | (no sign-off; business owner credit only) |
| **Engineer** | "Can another engineer maintain this model?" | **Technical Owner** (falls back to Owner) | "Recent contributors:" auto-derived from activity_events |

**Conclusion:** LP needs 3 primary roles + 2 optional roles, with smart fallback:

### Required (always assigned)

1. **Owner** — accountable. Singular per artifact. Inherits from workspace default unless overridden.

### Optional but useful (surfaces on document audiences)

2. **SME (Subject Matter Expert)** — knowledge. Singular per artifact. Used by Analyst doc. Falls back to Owner.
3. **Business Owner** — sponsorship / signs off business definitions. Singular. Used by Executive doc. Falls back to Owner.
4. **Technical Owner** — maintains DAX, RLS, refresh. Singular. Used by Engineer doc. Falls back to Owner.
5. **Stewards** — governance review. Multi-value (0..N). Used by Auditor doc sign-off block.

**Why not the 8-role full taxonomy** (Owner / Steward / SME / Custodian / Sponsor / Author / Reviewer / etc.)? Because 90% of teams will populate 1-2 fields and leave the rest blank. The form should make it easy to assign one Owner and walk away. Optional roles render with `(uses default)` indicators in the document so they're obviously fallback-shaped.

---

## Recommended LP shape

### Data model

Per artifact (workspace · semantic model · report), an `artifact_owners` row keyed on `(artifact_type, artifact_id, role)`:

```sql
artifact_owners (
  artifact_type   text     -- 'workspace' | 'model' | 'report'
  artifact_id     uuid
  role            text     -- 'owner' | 'sme' | 'business-owner' | 'technical-owner' | 'steward'
  user_email      text
  assigned_at     timestamp
  assigned_by     text
  why             text     -- required for non-Owner overrides (audit-quality context)
)
```

`role IN ('owner', 'sme', 'business-owner', 'technical-owner') → singular per artifact` (enforced at app level). `role = 'steward'` allows multiple rows per artifact.

### Inheritance flow (3 levels)

```
Workspace default Owner
     ↓ (inherits unless overridden)
Semantic model Owner [+ optional SME / Business Owner / Technical Owner / Stewards]
     ↓ (inherits unless overridden)
Report Owner [+ optional SME if different from model]
```

Each level can override the previous for the Owner role. Optional roles (SME / Business Owner / Technical Owner / Stewards) live on the semantic model — reports inherit them implicitly via the model link unless the report explicitly diverges.

### Where it shows in LP UI

1. **`/ownership`** (already shipped) — add a "Roles" column tally (e.g. "1 Owner · 2 Stewards · SME assigned") per workspace. Add a "Role coverage %" KPI.
2. **`/models/[id]/overview`** (operator's primary ask) — **read-only role panel** at the top of the overview tab showing all 5 roles + inheritance source ("inherited from workspace" or "set on model"). Quick-edit link → ownership tab.
3. **`/models/[id]/ownership`** (already shipped) — expand to support all 5 roles. Inheritance indicators per role.
4. **`/reports/[id]/ownership`** (NEW · Tier 2) — only for reports that diverge from their model's owner.
5. **Documents modal** — Cover.Owner field switches based on audience (per the table above). Sign-off block on Auditor preset pulls Owner + Stewards. Analyst preset "Contact" line pulls SME.

---

## Benefit hypothesis

1. **Document trustworthiness goes from cosmetic → operational.** Today the Auditor doc cover says "Owner: Alex Rivera" — but Alex doesn't sign the sign-off block because the field is templated, not pulled from real data. With 5 roles populated, the auditor doc cites actual signatures, actual Steward names, actual SME contacts. Within 60 days of shipping, Doc Coverage % of trustworthy auditor docs climbs from ~0% (templated) to >80% (operationally accurate).

2. **Cross-tool consolidation.** Customers currently maintain ownership in Confluence wiki + Power BI dataset settings + tribal Slack knowledge. LP becomes the source of truth, joins into the auto-doc, and surfaces in the same UI where the model lives. Estimated time savings: 10-20 min per onboarding doc question (avg 2-3 per week per analyst team).

3. **Partner-portfolio answer.** Partner can answer "who owns the Sales Analytics model across all 12 customer tenants" in <5 seconds. Today: ~30-minute Slack thread per customer. Direct partner-pillar value.

4. **Sets up Priority #4 (SOC 2 Audit Pack).** Evidence pack needs actual signatures, not templated copy. Multi-role ownership is the prerequisite. Without it, the SOC 2 Audit Pack ships with placeholder fields and partners can't actually send it to auditors.

5. **Stewardship signal for the Glossary.** A glossary term's "owner" can default to the steward of its primary linked model. Cross-screen reuse of the same role taxonomy.

---

## Value prop vs. competition

| Tool | Asset-level ownership | Multi-role | Fabric-native | Auto-doc generation | Cost & setup |
|---|---|---|---|---|---|
| **Microsoft Purview** | Yes (multi-role) | Yes (3-4 roles) | Yes (via ingest) | No | High — separate license, separate UI, requires Purview admin to populate |
| **Atlan / Collibra** | Yes (multi-role) | Yes (4-6 roles) | Yes (via connector) | Limited | Very high — enterprise pricing, multi-month rollout |
| **Power BI Admin / Fabric Admin** | Workspace only | No | Native | No | Free — but inadequate; no asset-level ownership |
| **Fabric Domains** | Workspace-group level | No (just a tag) | Native | No | Free — useful for grouping, not for accountability |
| **LayerPulse** | **Workspace + Model + Report** | **5 roles (3 required, 2 optional)** | **Yes (native focus)** | **Yes — joined into auto-Word per audience** | **Included in LP subscription** |

**LP's distinct wedge:**

- **Asset-level ownership + auto-doc generation in the same tool.** Purview has the ownership data shape but no auto-doc. Power BI has the doc-generation potential (via partner tools like Tabular Editor) but no ownership data shape. LP joins them, native to Fabric, in one product, in one UI.
- **The "Why" field on overrides.** Captures the audit-quality context that justified breaking inheritance. Atlan/Collibra technically support this via free-form comments; nobody enforces it. LP makes the "Why" required — and it surfaces in the auto-Word's audit log. This is the dimension other tools miss.
- **Three-tier inheritance is the right shape for Fabric.** Most catalogs flatten ownership at the asset level (lots of typing). LP's workspace → model → report inheritance matches how Fabric teams actually organize: most ownership lives at the model level, with workspace defaults handling the long tail and report overrides handling the rare downstream-author case.

---

## Open questions for the operator

Before implementing this, I'd recommend deciding on:

1. **Do we need all 5 roles in v1, or just Owner + SME + Stewards (the 3 that show up most often in real teams)?** My recommendation: start with 3, add Business Owner + Technical Owner in v2 once we see usage patterns.

2. **Report-level overrides — Tier 1 (this PR) or Tier 2 (next session)?** If shipping report-level requires a new `/reports/[id]/ownership` route, that's an extra screen. Could defer if the operator wants to keep this round tight.

3. **Domain assignment per model — in scope?** Fabric Domains exist at workspace level natively. LP could add a per-model domain tag (Finance / Sales / etc.) for cross-workspace grouping. Useful for the glossary's "Linked-to models" filter. Could be a small additive change.

4. **Smart suggest from AAD?** When assigning an Owner to a model, pre-populate the dropdown with users who have Admin / Member roles on the underlying workspace (so the suggestion list shows real candidates). Reasonable add; not blocking.

---

## Recommended next steps

If the operator approves the direction:

1. **Sketch the read-only role panel on `/models/[id]/overview`** (primary ask in the operator message).
2. **Expand the per-model Ownership tab editor** to handle the 3 (or 5) roles instead of just Owner.
3. **Update Documents modal** to pull audience-appropriate roles per the mapping table above.
4. **Update `/ownership`** workspace-defaults table to surface role-coverage at the workspace level.
5. **Defer:** report-level overrides, domain assignment per model (unless explicitly in scope).
