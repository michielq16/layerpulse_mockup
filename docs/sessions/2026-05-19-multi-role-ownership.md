# Session log — 2026-05-19 · Multi-role ownership + RolePanel + domain

**Operator:** Michiel
**Branch:** `claude/ownership-glossary` (continues PR #4)
**Production:** https://layerpulze-mockup.vercel.app
**Prior session:** [[2026-05-19-foundation-data-screens]] · [[fabric-artifact-ownership-conventions]] (analysis)

Continuation of the foundation-data-screens work. Extends the singular-Owner ownership model to a **3-role taxonomy** (Owner + SME + Stewards) plus **domain tagging**, plus a **read-only RolePanel** on the model Overview tab.

---

## Operator decisions confirmed

After the [[fabric-artifact-ownership-conventions]] analysis, operator agreed with all 4 recommendations:

1. **3 roles in v1** (Owner + SME + Stewards). Defer Business Owner + Technical Owner to v2.
2. **Report-level overrides** — Tier 1, shipped as a "Per-report overrides" section on `/ownership` (no dedicated `/reports/[id]/ownership` route yet; deferred until operator explicitly asks).
3. **Domain assignment per model** — in scope. Reuses `DATA.glossary.domains` controlled vocabulary.
4. **AAD smart-suggest** — in scope. Picker lists workspace Admins first, then Members, then everyone else, with inline tier badge.

---

## What shipped

### 1. Data extensions (`src/data.jsx`)

- `rolesPerModel[]` — SME (singular) + Stewards (multi) per model. Owner stays in `workspaceDefaults` + `overrides`.
- `modelDomains` — `{ modelId: domainKey }` map. Reuses `DATA.glossary.domains` controlled vocab.
- `reportOverrides[]` — 3 sample report-level Owner overrides (Sales Pipeline Dashboard · CFO Daily Brief · EMEA Sales Scorecard, all on Sales Analytics model).
- `workspacePermissions` — workspace → [{ email, role: admin|member }] map for smart-suggest.
- `roleCatalog` — 3 v1 roles w/ cardinality + tone + doc-render mapping.

### 2. Helpers in `Ownership.jsx`

Exported pure functions consumable from any screen:
- `userByEmail(email)` → AAD user record
- `resolveModelOwner(modelName, workspace)` → returns `{ name, email, source: 'workspace'|'override', why? }` w/ inheritance resolution
- `resolveModelSme(modelId)` → SME or null
- `resolveModelStewards(modelId)` → array
- `resolveModelDomain(modelId)` → domain record or null
- `suggestUsersForWorkspace(workspace)` → AAD users sorted admin-first
- `workspacePermissionTier(email, workspace)` → 'admin' | 'member' | null
- `workspaceRoleCoverage(workspace)` → `{ total, ownerSet, smeSet, stewardSet }`

### 3. Per-model Ownership tab — 4-card role grid

Replaces the prior 2-section "Inherited / Override" layout with a 4-tile grid (Owner · SME · Stewards · Domain). Each card shows:
- Role pill (tone-tinted)
- Source ("Inherited from workspace" · "Override on model" · "Falls back to Owner" · etc.)
- Assigned user(s) with avatar + email
- Override "why" context (when present)
- Empty state w/ inline assign CTA
- Edit/Override action button

Domain card: shows current domain chip or untagged state. Tap → drawer w/ 7-option domain picker (Finance · Sales · Marketing · Operations · HR · Product · Compliance).

### 4. RolePanel — read-only on `/models/[id]/overview`

Operator primary ask. Inserted at the top of the Overview tab. 4-tile horizontal strip (Owner · SME · Stewards · Domain) showing:
- Tone-tinted role pill
- Source line ("Inherited" / "Override" / "Falls back to Owner")
- Avatar + name + email per assigned user
- Stewards: up to 3 inline chips + "+N more" overflow
- Domain: chip if tagged, "Untagged" otherwise
- "Edit in Ownership tab →" link in the panel head (switches the model tab)

### 5. `/ownership` workspace table — Role coverage column

Replaces the old "Stewards" numeric column with a **3-row coverage cell**: O / S / W mini-bars showing Owner / SME / Stewards coverage % across all models in the workspace (e.g. "O ████ 8/8 · S ██░░ 4/8 · W ███░ 6/8"). Grid columns retuned (1.3 / 0.5 / 1.5 / 1.3 / 0.6 / 0.8 / 0.9 / 0.3).

### 6. Per-report overrides section on `/ownership`

New section between "Per-model overrides" and "Activity". Same `own-override` card shape, sky border accent (vs. violet for model overrides). Shows: report name + kind pill (Report/Paginated/App) · "on {model name}" inline context · the why · owner now meta.

3 sample overrides exemplify the canonical case: a downstream team built a report on a shared model and owns it independently from the model owner.

### 7. AAD smart-suggest in role pickers

All role picker dropdowns route through `<UserSelect workspace={ws}>` which:
- Sorts AAD users by `suggestUsersForWorkspace(workspace)` — admins first, then members, then everyone
- Prefixes each option with `★ Admin · `, `· Member · `, or `— `
- The form hint reports "Smart-suggest: N workspace Admin · M Member"

### 8. New drawer modes

`OwnershipDrawer` now handles:
- `add-default` / `edit-default` — workspace default (existing)
- `add-override` / `edit-override` — model Owner override (existing)
- `edit-sme` — SME assignment (NEW)
- `add-steward` (NEW)
- `remove-steward` (NEW)
- `change-domain` (NEW)
- `workspace-overrides` — read-only workspace override list (existing)

Each form has a tinted context block at the top explaining what's being assigned + why-context fields where appropriate.

---

## Doc-generation tie-in (deferred — Documents modal lives on PR #3)

Per the [[fabric-artifact-ownership-conventions]] analysis, audience-to-role mapping:

| Audience | Cover Owner field | Sign-off / contact |
|---|---|---|
| Auditor | Owner | Sign-off block: Owner + Stewards |
| Analyst | Owner | "Questions? Contact:" = SME *(fallback: Owner)* |
| Executive | Owner *(v2: Business Owner)* | (no sign-off) |
| Engineer | Owner *(v2: Technical Owner)* | "Recent contributors" from activity_events |

**Status: NOT wired into the modal in this PR.** The Documents modal lives on PR #3 (`claude/c2d-preview-modal`) which is still open and separate. The audience→role binding is a follow-up PR after both PR #3 and PR #4 merge.

Recommended follow-up PR: `claude/documents-role-binding` (against merged `main`). Updates `DocumentPreviewModal` to:
- Pull `resolveModelOwner` for cover Owner field
- Pull `resolveModelSme` for Analyst preset contact field (fallback to Owner)
- Pull `resolveModelStewards` for Auditor preset sign-off block
- Render fallback indicator ("uses Owner") when secondary roles are blank

---

## Files changed

- `src/data.jsx` — `rolesPerModel`, `modelDomains`, `reportOverrides`, `workspacePermissions`, `roleCatalog` (+ ~110 LOC fixture)
- `src/Ownership.jsx` — added 8 export helpers · `RolePanel` component · refactored `ModelOwnership` to 4-card grid · added `SmeForm` · `StewardForm` · `DomainForm` · `UserSelect` smart-suggest · `RoleCoverageCell` · per-report overrides section · 4 new drawer modes (+ ~370 LOC)
- `src/Model.jsx` — imports `RolePanel` + wires `onGoToOwnership` callback · inserts panel at top of Overview tab
- `src/styles/app.css` — model-role-grid · model-role-card · model-role-pill (4 tones) · model-steward-row · model-domain-chip · own-domain-grid · own-override-pill-report · role-cov-cell + bars · role-panel + tiles (+ ~250 LOC)
- New: `docs/sessions/2026-05-19-multi-role-ownership.md` (this file)
- Update pending: `docs/screens/ownership.md` (will refresh in follow-up commit before PR review)

## Verification

- `npm run build` → clean (1.22s · 23 modules)
- Vercel preview pending push

## Open threads

| Item | Notes |
|---|---|
| **Document modal role binding** | NOT in this PR. Lives on PR #3. Wire in follow-up after both PRs merge. |
| Update `docs/screens/ownership.md` | Refresh narrative to reflect 3-role taxonomy + domain + report-overrides + smart-suggest. |
| Dedicated `/reports/[id]/ownership` route | Not built. Report-level overrides surface only on `/ownership`. Operator can request if it becomes ergonomically necessary. |
| Business Owner + Technical Owner roles | v2. Add to `roleCatalog`; existing UI extends naturally (more role cards in the grid). |
| AAD Graph live ingest | Smart-suggest mocked from `workspacePermissions`. Production needs Graph delegated. |
| Domain inheritance from workspace | Currently per-model only. Workspace could carry a default domain that propagates. Minor enhancement. |
| Role-audit log | Audit log shows ownership *events*; doesn't yet differentiate Owner vs SME vs Steward changes. Add `role` to audit-log entries. |
