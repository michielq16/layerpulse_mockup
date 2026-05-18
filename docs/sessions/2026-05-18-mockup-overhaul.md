# Session log — 2026-05-18 · Mockup overhaul (S1 → S3 + Settings + Workspaces + Capacity)

**Operator:** Michiel
**Branch:** `main` (direct merges; feature-branch only for the initial round)
**Production:** https://layerpulze-mockup.vercel.app
**LP-product vault:** `C:\Users\michi\Downloads\layerpulse\docs\` (canonical source of truth — read for product strategy, BACKLOG, PRDs)

This is the **durable session memory** — read this before the chat transcript on any future session. Reflects everything shipped to production between commit `9e56eaf` (Partner Portfolio S3) and `8e7ff2c` (Settings select-arrow normalize). The chat log adds nuance but not facts; this file is the canonical reference.

---

## What's on production right now

Run `vercel ls --prod` on the linked checkout for the current per-deploy URL. The branch alias is stable: `https://layerpulze-mockup.vercel.app/<route>`.

### Routes shipped (mockup)

| Route | What it is | Notes |
|---|---|---|
| `/overview` | Evidence Snapshot | Now has CapacityScopeSelector top-right |
| `/portfolio` | **S3 — Partner Portfolio** (F-2 wedge) | 12-customer grid · worst-movers · F-2 activity feed |
| `/workspaces` | **Rebuilt v2.5** | Cap selector top-right · 5-KPI strip · sort + view toggle · list mode |
| `/models/[id]/{overview,measures,lineage,diagram}` | 4-tab model deep-dive | Unchanged |
| `/lineage` | Cross-workload graph | Unchanged |
| `/documents` | **S1 — Auto-Word generation** | Library tab default · Generate tab w/ 3-step flow |
| `/reports` | Reports & Apps catalog | Cap selector top-right |
| `/capacity` | **Rebuilt** | Multi-line compare chart · right-sizing matrix · data-collection card removed (moved to /settings) |
| `/costs` | Cost & Usage | 3 tabs: Cost Attribution · Workload Mix · **Cost vs Adoption** (replaced Observations) |
| `/workload-mix` | (Inside /costs) | — |
| `/users` | Legacy user-intel | Kept as-is per operator (cherry-pick later) |
| `/users-new` | **UPN-first roster sketch** | Sibling to /users for cherry-pick |
| `/tenant-activity` | **S2 — Bloomberg-terminal forensic search** | activity_events table + raw JSON sheet |
| `/activity` | LP audit log (sidebar: "Activity (LP)") | Internal LP scan/AI log, NOT tenant-activity |
| `/governance` | Governance findings | Unchanged |
| `/access` | Access matrix | Unchanged |
| `/adoption`, `/sleepers`, `/audit`, `/licenses`, `/alerts` | Various user-intel + governance | Unchanged |
| `/settings` | **Rebuilt — 3 tabs** | Connection · Ingestion · Pricing |
| `/billing` | **NEW — promoted out of Settings** | LP subscription tiers + usage + invoices |

### Locked components (don't redesign without explicit ask)

- `StatCard` (sky / violet / emerald / amber / rose tones · optional spark + delta)
- `Sparkline` (returns null for <2 pts)
- `CapacityScopeSelector` (shared, in `components.jsx`) — used on `/overview`, `/workspaces`, `/capacity`, `/costs`, `/tenant-activity`, `/reports`
- `Avatar`, `EnvBadge`, `Provenance`, `HealthRibbon`, `IssueCard`
- Sidebar w/ collapse toggle + LayerPulse.ai logo

---

## The 7 ranked priorities — status

Per `productvision.md` §12 + CLAUDE.md.

| # | Priority | Status |
|---|---|---|
| 1 | **C2d Documents** (auto-Word) | ✅ Shipped as `/documents` · narrative + PRD draft authored |
| 2 | **Users page** (UPN-first) | ✅ Shipped as `/users-new` (legacy `/users` kept untouched for cherry-pick) |
| 3 | **Tenant Activity** (forensic search) | ✅ Shipped as `/tenant-activity` |
| 4 | Audit & Compliance (SOC 2 pack) | 🔜 Existing `/audit` is partial; full pack pending |
| 5 | Lineage Explorer | ✅ `/lineage` already shipped (pre-session) |
| 6 | Reports & Apps | ✅ `/reports` already shipped (pre-session) |
| 7 | D-pillar Intelligence sidebar | 🔜 Not started — standing-subscription cards, NOT chat |

---

## Operator preferences locked in this session

These are durable design decisions. Don't re-litigate without explicit ask.

### IA + navigation

- **Sidebar tenant switcher removed** (Contoso Fabric pill below logo). Page-scope context now comes from per-page **CapacityScopeSelector** at top-right.
- **Sidebar sync-status card removed** ("Tenant sync · last 4m ago"). Sync status lives in `/settings → Ingestion`.
- **Sidebar collapse toggle** at top-right of logo row. State persists in `localStorage` (`lp-sidebar-collapsed`).
- **Logo:** the LayerPulse.ai PNG asset at 44px height in expanded state · inline-SVG wave mark in collapsed state. No more "L + LayerPulse" wordmark.
- **Billing promoted to top-level sidebar entry** (`/billing`), separate from Settings. Settings is operational config; Billing is commercial.
- **Sidebar footer order:** `Billing` (credit-card icon) → `Settings` (cog).

### Filter-bar conventions (Workspaces standard, apply elsewhere)

- **Capacity selector lives in the page-head top-right**, not in the filter bar. Pages with capacity scope: `/overview`, `/workspaces`, `/capacity`, `/costs`, `/tenant-activity`, `/reports`.
- **Filter bar = single row.** Layout: search wide-flex · env pills right-aligned · sort pill + view toggle anchored right via `margin-left: auto`. Don't wrap to two rows when one fits.
- **Section head pattern:** `Browse N matches` / `Browse N of N` left, no eyebrow if redundant. Image-15 standard.
- **Sort pill** uses chevron-down + icon-label pattern with checkmark on active option in popover. Default sort: "Most $/mo" (FinOps-first framing).
- **View toggle** = 2-icon pill, sky bg on active. `grid` icon for tile mode, `list-rows` for list.
- **Env pills:** clean text + count, no colored dots (Image 15 style).
- **Z-index discipline:** every dropdown popover lives at `z-index: 1000`; the containing card has `position: relative; z-index: 30+` to beat sibling grids below.

### Tone + copy

- **Numbers are the headline.** `47 wasted models` > `Lots of optimization opportunities`.
- **Empty states must be actionable.** Never `No data yet` — always tell the user how to populate ("Run introspection from Settings to discover semantic models").
- **Relative time for live state** · `2h ago` · **absolute UTC for auditor surfaces** (`/tenant-activity`, export logs).
- **No marketing copy** inside the product. No "Welcome!" splash. No "AI-powered" without humans-in-the-loop.
- **Direct cross-page links** when one surface points at another (e.g. Settings sub-line → Billing).

### Settings IA (locked 2026-05-18)

```
/settings (3 tabs):
├── Connection — SP creds + Capacity Metrics App + status hero + Danger zone (delete env)
├── Ingestion — Data ingestion card (sync toggle + schedule + timezone + 30-day grid + last-sync)
│                · Per-arm health card (5 arms · 30-cell mini-grids · 90-100% completion)
│                · Planned ingestion axes (6-axis roadmap teaser, BACKLOG-sequenced, greyed out)
└── Pricing — Capacity pricing + License pricing

/billing (own route, separate from Settings):
└── Current plan + usage + 3-tier comparison + billing history
```

**Timezone sits IMMEDIATELY AFTER Schedule** inside the Data ingestion card (one block, not two cards). Reading flow preserved: schedule sub-text says "in the timezone set below" → Timezone IS the next row.

### Ingestion — canonical 5 collector arms (per LP-product Obsidian)

Researched in `architecture/metrics-app-model.md` · `runbooks/sp-onboarding.md` · `audits/collector-atomicity-audit-2026-05-11.md` · `prd/activity-events-atomic-ingestion.md` · `prd/governance-pillar-section-b.md` · `BACKLOG.md`. Run nightly via `Promise.allSettled`, failure-isolated per axis.

| # | Arm | Endpoint | Detail |
|---|---|---|---|
| 1 | Activity events | `/admin/activityevents` · 24×1h windows | `1,284 events / 24h` · T1.1b backfill extends 24h → 30d |
| 2 | Capacity Metrics App (DAX) | DAX queries against the installed MS Metrics App workspace (NOT a REST endpoint) | `MetricsByItemAndHour · 41 tables · 147 measures` |
| 3 | Refreshables | `/admin/capacities/refreshables` (paginated) | `47 datasets` |
| 4 | Tenant settings | `/v1/admin/tenantsettings` | `160 settings · latest-wins snapshots` (5th arm, PR #269) |
| 5 | Model introspection | `admin/groups + admin/datasets + Scanner getInfo` | **Compound** — workspace list (daily full) + dataset list (daily full) + incremental Scanner via `admin/workspaces/modified` (29.5d cap) + Scanner LRO + getDefinition TMDL best-effort. **Silver fidelity.** |

**Cadence answer:** workspaces refresh **daily incremental**, NOT every 30 days. The 30-day number is the MS-imposed cap on `modifiedSince` — forces a full-scan fallback when `lastScannerRunAt` is null or > 29.5d old.

**"Cost calc (cron) · cost_observations_v2"** was REMOVED from the mockup. It was incorrectly listed as a collector arm — it's actually a post-collection derived computation.

### Planned ingestion axes (roadmap teaser, BACKLOG-sequenced)

LP-side-confirmed order, surfaced as greyed-out tiles in `/settings → Ingestion`:

1. Reports (Tier 1 · T1.8 · SP-only) → Reports & Apps pillar
2. Dataflows (Tier 1 · T1.9 · SP-only) → Dataflow catalog
3. All Fabric items (Tier 1 · SP-only · drop 14d filter) → Artifact catalog
4. Users + licenses (Q3 · Graph delegated) → Users page v2
5. AAD groups (Q3 · Graph) → E Governance Sections C/D
6. Apps (Q4 · SP-only) → App catalog

### Workspaces page (`/workspaces`)

- **5-KPI strip:** Workspaces · Semantic Models · **Health Score %** (weighted FinOps 40 / Quality 35 / Gov 25 w/ sub-pillar pills) · Total Cost Est. · Potential Wasted
- **Capacity selector top-right of page-head**, NOT in filter bar
- **Filter bar single row:** Search · env pills (All/PROD/UAT/DEV/★) · sort pill · view toggle
- **Tile cards:** Models · Reports · $/mo (replaced tables/measures)
- **List view available** via view toggle — 9-col grid

### Capacity page (`/capacity`)

- **No more data-collection card** (moved to /settings/Ingestion)
- **Multi-line CU% overlay chart** comparing all capacities
- **Right-sizing matrix table** with per-capacity recommendations (upsize / downsize / right-sized)

### Cost & Usage page (`/costs`)

- **Observations tab REMOVED** (operator: "more valuable")
- **Cost vs Adoption tab ADDED** in its place — median-split scatter, 4 quadrants (Wasted · Hot · Efficient · Idle), per-artifact dots sized by cost
- "Top wasted-spend candidates" table below the scatter — QBR ammo

### Documents page (`/documents`)

- **Library-first IA.** Library tab default (operator decision — 90% case is "grab the auditor doc for Customer X now")
- Generate tab is one click away · 3-step flow (model picker → section toggles + audience preset → live Word-shaped preview)
- Library rows: audience pill · status pill · format · last-gen w/ UTC tooltip · schedule chip popover (Off/Daily/Weekly/Monthly/On change)

### `/users-new` (sketch — NOT a replacement for /users)

Operator: "create user_new page with your new sketch proposal. we consolidate later based on cherry picking." Keep both routes alive until consolidation pass.

### `/tenant-activity` vs `/activity`

- `/activity` = LP's INTERNAL audit (scans, doc gens, AI runs) — sidebar label "Activity (LP)"
- `/tenant-activity` = Bloomberg-terminal forensic search over Fabric `activity_events` — operator's S2 priority

---

## Cross-tool / cross-OS quirks fixed this session

| Issue | Fix |
|---|---|
| Vercel `<select>` native arrow rendered as Windows up/dash/down spinner stack | CSS normalize: `select.input { appearance: none; background-image: inline-SVG chevron; padding-right: 32px; }` site-wide |
| Filter-bar dropdowns rendered BEHIND workspace cards | `.ws-filter-card { position: relative; z-index: 30; }` + popovers at `z-index: 1000` |
| Schedule row collapsed to word-per-line vertical | Replaced `minWidth: 200` on `<select>` with `width: 240px; flex-shrink: 0` |
| Deep links 404'd on `/tenant-activity` etc. | `vercel.json` SPA rewrite + URL-driven routing in App.jsx (getInitialRoute + popstate listener) |
| Branch-preview URLs 401'd anonymously | Operator can disable Deployment Protection in Vercel Settings; in-browser auth works |

---

## Naming + branding

- **Product name: LayerPulse** (since 2026-04-26). Earlier `LayerPulze` spelling is deprecated.
- **Vercel project name: `layerpulze-mockup`** (historical "z", retained).
- **Logo:** PNG at `src/assets/logo-layerpulse.png` (367 KB, Vite-bundled). LayerPulse.ai with cyan/blue wave mark.
- **All FUAM mentions removed** from the codebase (`grep -r FUAM` returns 0). Operator decision 2026-05-18.

---

## Vercel + Git workflow

- **Linked checkout** to `michielq-7337s-projects/layerpulze-mockup` via `vercel link` (`.vercel/` gitignored)
- **`NODE_OPTIONS=--use-system-ca`** required on Windows for Vercel CLI (corporate root CA fix)
- **Direct-merge-to-main pattern** has been used most of the session per operator preference (skips PR ceremony for design iterations). Initial work happened on `claude/review-document-structure-26rnC` + PR #2.
- **gh CLI** is authed as `michielq16` — use for PR comments, status, etc.

### URL forms (CLAUDE.md Delivery protocol)

- Production: `https://layerpulze-mockup.vercel.app/<route>` (tracks main)
- Branch preview: `https://layerpulze-mockup-git-<branch-slug>-michielq-7337s-projects.vercel.app/<route>`
- Per-deploy: `https://layerpulze-mockup-<deployId>-michielq-7337s-projects.vercel.app/<route>` — most reliable

---

## What's NOT done — queued / open threads

| Item | Source | Notes |
|---|---|---|
| Priority #4 **Audit & Compliance** (SOC 2 evidence pack) | CLAUDE.md priorities | 3 tabs proposed: Export log · Off-hours heatmap · RLS evaluation · Download evidence pack ZIP |
| Priority #7 **D-pillar Intelligence sidebar** | CLAUDE.md priorities | Standing-subscription cards · NOT chat |
| Cherry-pick consolidation **`/users` ⇄ `/users-new`** | Operator decision | Operator wants to cherry-pick from both; consolidate when ready |
| Overview's "Workspace spotlight" tiles | Self-noted | Still show tables/measures in old WorkspaceCard. Workspaces page uses the new card. Aligning Overview is a follow-up |
| Per-workspace detail (`/workspaces/<id>`) model table | Self-noted | Still shows Tables/Measures columns. Could refactor to Models/Reports/$ |
| Reports & Apps · Lineage Explorer iteration passes | Operator queued | "ripe for similar polish" after Settings sweep |
| Test cherry-pick: `docs/screens/users-new.md` cherry-pick verdict table | Self-authored prediction | Operator hasn't decided which parts win |
| LP-product side **`/prd`** to author canonical PRDs from `docs/screens/*.md` | Convention | Operator runs `/prd` on LP-product repo; mockup-side PRD draft (`docs/prds/documents.md`) is companion-reference only |

---

## Durable artifacts in this repo (read these in addition to this file)

- `docs/screens/documents.md` — S1 screen narrative
- `docs/screens/users-new.md` — `/users-new` sketch narrative
- `docs/screens/tenant-activity.md` — S2 narrative
- `docs/screens/portfolio.md` — S3 narrative
- `docs/prds/documents.md` — companion PRD draft (NOT authoritative; LP-side `/prd` produces the real one)
- `CLAUDE.md` — operating brief (5 gates, pillars, brand, anti-patterns, Vercel scope, Delivery protocol)

---

## How to use this file in a future session

1. Read `CLAUDE.md` first (always — it's the gates + tone + IA).
2. Read **this file** to know what's on production + what's been decided.
3. Then read the relevant screen narrative if working on that screen.
4. Only dip into the LP-product Obsidian vault (`C:\Users\michi\Downloads\layerpulse\docs\`) when something specific from BACKLOG or a PRD matters.

If the operator says something this file contradicts: **trust the operator** — this file is a frozen snapshot, not a constraint.
