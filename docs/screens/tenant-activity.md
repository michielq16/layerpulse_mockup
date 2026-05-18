# Screen: Tenant Activity (forensic search · `/tenant-activity`)

**Pillar:** Governance · primary. **FinOps:** secondary (export-heavy patterns surface here before they show up on `/users-new`).
**Persona:** Partner (Y1) — answering an auditor question or an incident-response question across one customer tenant. Also direct customer security/compliance lead (Y2).
**Value-loop quadrant:** **Validate** (the row IS the evidence; the sheet is the proof; CSV-out is the deliverable).
**Decision the user makes:**
- "Send the auditor this filtered slice as CSV by Tuesday."
- "Who exported the salary report Wednesday off-hours?"
- "Did the RLS rule for EMEA actually fire? When?"
- "Is `svc-finance-runner` doing anything other than scheduled refreshes?"

**Data joins required:**
```
activity_events
  × users               (UPN → display name, service-account flag)
  × workspaces          (workspace name, env classification)
  × items               (item type, sensitivity label inheritance)
  × sensitivity_labels  (Restricted / Confidential / Internal)
  × tenant_settings     (off-hours window definition)
  × ip_geo (optional v2 — origin country / corp-network classification)
```
Microsoft has each piece in 5 different UIs and never the cross-join.

## Why a new page (not editing existing `/activity`)

There were two surfaces conflated under the word "activity":

| Route | Role | What it answers |
|---|---|---|
| `/activity` (existing — renamed in sidebar to **Activity (LP)**) | LP's own audit log: scans / doc generations / AI analyses / resolutions | "What did LayerPulse do today?" |
| `/tenant-activity` (new) | Forensic search over Fabric's `activityevents` API | "What did anyone do inside this Fabric tenant?" |

Keep both. `/activity` is operator-transparency; `/tenant-activity` is auditor / SOC 2 evidence.

## Happy path

1. Partner gets an auditor email: *"Who exported the salary attrition report off-hours in the last month?"* Opens `/tenant-activity`.
2. Page lands on **last 24h** with the 4 KPI cards (Events · Distinct actors · Top op · Off-hours / 7d). Top-right shows `Save current query`, `Watch query`, `Export CSV (n)`.
3. Saved-query row above the filter bar: clicks **"Off-hours Restricted exports · 30d"** (sq1). One click applies: range=30d, operation=Export, sensitivity=Restricted, off-hours-only=true. Active chip gets a checkmark.
4. Table narrows to 4 events. All flagged with rose left-edge accent (visible from row chrome). Each row shows: time UTC + relative date + off-hours pill · UPN · operation (with tone-coded dot) · item · workspace · sensitivity badge · status.
5. Partner clicks one row — `daniel.o@contoso.onmicrosoft.com` exporting `Sales Pipeline · raw_deals` at 23:51 UTC. Right Sheet (~720px) slides in:
   - **Header band:** operation icon + op name + item + flagged badge
   - **Detail grid:** Time (with relative + off-hours hint) · Actor (UPN + display name + service-account icon if applicable) · Workspace · Sensitivity · Status · IP · Event ID
   - **Raw event:** JSON-shaped Activity Log API payload (Microsoft's `CreationTime`, `Operation`, `UserId`, `ResultStatus`, etc.)
   - **Related from same actor ±1h** — up to 5 sibling events at the same UPN within an hour window (helps spot a session/pattern). Click any to navigate to it.
   - **Foot:** `Open in Fabric admin` · `See all from daniel.o` · `Add to evidence pack` (rose CTA when row is flagged)
6. Partner clicks `Export CSV (4)` → downloads filtered CSV → attaches to auditor email. Closes ticket.

## Edge states

- **Loading** → skeleton mirrors the table: 8 ghost rows × 7 columns + 4 StatCard skeletons + saved-query chip placeholders.
- **No events match filters** → empty state copy: *"No events match. Loosen the filters above, or **clear all filters**."* The link clears state. Never "No data yet."
- **Date range outside retention** (Fabric Activity Log = 30d) → banner above the table: *"Beyond 30-day retention. Earlier events are only available via LayerPulse's archived `activity_events` table (if backfill is enabled). See Settings."*
- **Permission-denied** (partner-of-record without read scope on this tenant) → page shows the KPI strip greyed + a single banner: *"Read-only access denied for this tenant. Ask {customer admin} to grant partner-read in Connections."* Filter bar, table, and CSV export all disabled.
- **Saved query referencing a deleted workspace** → row counts show with strikethrough; tooltip on the saved chip: *"Workspace `Marketing-Legacy` no longer exists; this query may be stale."* Clicking still applies (returns 0).
- **Event row's UPN matches a service account** → avatar replaced with bot icon; UPN colored differently from human actors to make the distinction scannable.
- **Status = fail** with `errCode` populated → sheet shows the code below the status pill (e.g., `CapacityThrottle`, `RuleNotMatched`).
- **Auditor mode** (toggle in Settings, out-of-scope for v1) → would hide all "click to filter" interactions and render timestamps in a fixed `YYYY-MM-DD HH:MM:SS UTC` format with no relative-time labels. Tone rules say absolute UTC for auditor surfaces; this screen already obeys.

## Filter + saved-query behavior

- **Date range:** 1h / 24h / 7d / 30d segmented tabs. Default 24h. Beyond 30d requires the LP archive (see edge state).
- **Search:** matches UPN ∪ display name ∪ operation ∪ item ∪ workspace, case-insensitive substring.
- **Operation group chips:** tone-coded (sky=view / amber=export / violet=edit-and-AI / emerald=share / rose=admin / sky=rls). Multi-select. Counts update live with all other active filters.
- **Workspace dropdown / Sensitivity dropdown / Status dropdown:** standard selects with "All" reset option.
- **Off-hours only toggle:** filters events outside Mon-Fri 06:00–19:00 UTC.
- **Saved queries:** 5 presets seeded; clicking one applies its filter bundle and adds a checkmark. Clicking again clears it. Any manual filter change clears the active-saved highlight (state diverged).
- **Clear all:** appears when any filter is active; resets to defaults.

## Components used

- `StatCard` × 4 (tones: sky / violet / emerald / rose-or-sky depending on off-hours alert)
- `Sparkline` (Events / 24h KPI)
- `Avatar` (reused from `UserIntel.jsx`) + new `ta-svc` bot variant for service principals
- `seg-tabs` (date range)
- `chip` (operation groups — new `ta-op-chip` modifier for tone-bg-when-active)
- New: `ta-saved-chip` (saved-query preset row), `ta-off-toggle` (off-hours checkbox styled as chip), `ta-row` 7-col grid with sticky head, `ta-row-flag` left-edge accent, `ta-row-off` off-hours background tint, `ta-sheet` extends `usr-sheet` overlay, `ta-detail-grid` two-col label/value rows, `ta-raw` monospace JSON block, `ta-related-row` for the ±1h related-events list

## Metrics surfaced on the screen

- **Events / 24h** — headline; sparkline shows the 24-hour shape
- **Distinct actors / 24h** — health-of-activity (unusual if very low or very high)
- **Top op · {name}** — quick situational awareness ("Today is view-heavy")
- **Off-hours / 7d** — rose-toned when above an alert threshold; this is the auditor-relevant number
- **Per-group event counts** — surfaced on each operation chip with live filter-aware updates
- **Per-event tags:** off-hours pill on time cell, rose left-edge accent on flagged rows, sensitivity badge per row, status pill

## Cherry-pick verdict predictions

| Element | Verdict prediction |
|---|---|
| UPN-first row layout | Strong keep — matches `/users-new` decision |
| Saved-query preset row above filters | Strong keep — Bloomberg-terminal differentiator |
| Off-hours toggle + auto-tint | Strong keep — SOC 2 trifecta (Export* / OffHoursAccess / RLS) per CLAUDE.md tone rules |
| Tone-coded operation group chips | Keep — scannable at a glance |
| 7-column dense table | Keep but stress-test at 5000+ rows; will need virtualization library (react-window) in real product |
| Right Sheet w/ raw JSON + related events | Strong keep — auditor needs the raw payload |
| `Add to evidence pack` CTA | Keep only if backed by the planned SOC 2 evidence pack feature (T1.12 in LP backlog); otherwise vapor |
| `See all from {actor}` CTA | Strong keep — pivots from row → user → /users-new with that UPN preset |
| `Watch this query` CTA | Keep but defer wiring — saves a daily-digest subscription (D-pillar overlap) |

## Anti-patterns explicitly avoided

- **No live-tail mode.** Tempting but feels like a Datadog clone; auditor work is retrospective, not streaming.
- **No "AI-summarize this event" button.** Adds noise; the raw payload is the deliverable.
- **No charts beyond the KPI sparkline.** This is a forensic surface, not a dashboard. The Adoption page already serves rollup analytics.
- **No mobile design.** Target 1440×900 dual-monitor per CLAUDE.md.
- **No timezone toggle.** UTC only. The auditor's clock is UTC; mixing local-time invites mistakes.
- **No saved-query auto-share.** Saved queries are per-operator; sharing a query is a v2 polish, not v1.

## What's deliberately NOT in this sketch

- Saved-query CRUD (just 5 hardcoded presets here)
- "Watch query" alerting wire-up (sets a subscription that pages on threshold breach; D-pillar overlap)
- Backfill UI for events older than 30d
- Auditor mode toggle (out-of-scope; mentioned in edge states for future)
- Geographic origin enrichment (IP → country) — v2
