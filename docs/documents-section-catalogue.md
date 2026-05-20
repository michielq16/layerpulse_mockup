# Documents — master section catalogue

**The full-scope contract for the auto-generated semantic-model document.** Every audience preset (Auditor / Analyst / Executive / Engineer) is a *subset selection* of this master list. This is the source of truth for "what makes the most complete document."

- **Companion to:** `docs/screens/documents.md` (per-audience matrix) · `docs/prds/documents.md`
- **Two knowledge layers:** **Automated** (Fabric API + LP collectors — renders even with zero manual data) · **Manual** (LP-side foundation — ownership + glossary; what makes the doc *trustworthy*).
- **Status:** ✅ built in the mockup · ◻️ proposed (extractable/capturable, not yet built).

---

## Ordered document sequence

The master order. Each preset picks a subset; sequence is preserved.

```
FRONT MATTER
  1. Cover                          AUTO meta + MANUAL owner/domain + certification
  2. Table of contents             AUTO
  3. Executive summary             AUTO
  4. Custom executive note         MANUAL (owner free-text)
TRUST & HEALTH
  5. Model maturity / quality      AUTO
  6. Refresh history (+ incremental policy)  AUTO
  7. Governance findings           AUTO
SCHEMA
  8. Tables                        AUTO + glossary-driven descriptions
  9. Columns + types + roles       AUTO + glossary-driven descriptions
 10. Relationships                 AUTO
 11. ER diagram                    DERIVED
 12. Hierarchies                   AUTO
 13. Calculation groups / perspectives / translations  AUTO
LOGIC
 14. Power Query (M)               AUTO
 15. Measures + DAX + dependencies AUTO + glossary-driven descriptions
 16. Calculated columns + storage  AUTO
 17. Measure usage / dormancy      DERIVED
GOVERNANCE & SECURITY
 18. RLS rules                     AUTO
 19. Object-level security (OLS)   AUTO
 20. Sensitivity labels            AUTO
 21. Access (× RLS scope)          AUTO
LINEAGE & USAGE
 22. Lineage upstream              AUTO
 23. Lineage downstream            AUTO
 24. Adoption                      AUTO
 25. Storage / size breakdown      AUTO
 26. Capacity / cost attribution   AUTO
CONTEXT (business knowledge)
 27. Business glossary             MANUAL
 28. Processes governing model     MANUAL
 29. Owners & stewards             MANUAL
 30. Change log                    AUTO + manual narrative overlay
BACK MATTER
 31. Sign-off block                MANUAL
 32. Certification / endorsement stamp  MANUAL
```

---

## Automated sections (Fabric API + LP collectors)

| # | Section | Source | Status |
|---|---|---|---|
| 1 | Model metadata + last scan | Scanner getInfo | ✅ |
| 2 | Executive summary KPIs | Scanner | ✅ |
| 3 | Model maturity / quality score (6 dims) | LP rules engine | ✅ |
| 4 | Tables (rows · partitions · fact/dim) | Scanner | ✅ |
| 5 | Columns + data types + roles | Scanner | ✅ |
| 6 | Relationships | Scanner | ✅ |
| 7 | ER diagram (auto-layout) | Derived | ✅ |
| 8 | Power Query (M) | Scanner getDefinition / TMDL (Axis 0) | ✅ |
| 9 | Measures + DAX + dependency parse | Scanner / TMDL | ✅ |
| 10 | Calculated columns | Scanner | ✅ |
| 11 | RLS rules | Scanner | ✅ |
| 12 | Sensitivity labels (MIP) | Scanner | ✅ |
| 13 | Access (Build/Read × RLS scope) | Admin API + Graph | ✅ |
| 14 | Refresh history | Refreshables endpoint | ✅ |
| 15 | Lineage upstream + downstream | Scanner lineage + reports axis | ✅ |
| 16 | Adoption (DAU/WAU/MAU) | activity_events | ✅ |
| 17 | Governance findings | LP rules engine | ✅ |
| 18 | Change log | activity_events | ✅ |
| 19 | **Object-level security (OLS)** | Scanner | ✅ (built this cycle) |
| 20 | **Hierarchies** | Scanner | ✅ (built this cycle) |
| 21 | **Calculation groups / perspectives / translations** | Scanner / TMDL | ✅ (built this cycle) |
| 22 | **Measure usage / dormancy** | activity_events × DAX parse | ✅ (built this cycle) |
| 23 | **Storage / size breakdown (VertiPaq)** | DMV | ✅ (built this cycle) |
| 24 | **Capacity / cost attribution (CU + €)** | H1/H2 collectors | ✅ (built this cycle) |
| 25 | **Incremental-refresh policy** | TMDL | ✅ (built this cycle — block on Refresh history) |

## Manual sections (LP-side foundation)

| # | Section | Source | Status |
|---|---|---|---|
| 1 | Ownership — Owner / SME / Stewards / Domain | `/ownership` (default + override) | ✅ |
| 2 | Business glossary attachments | `/glossary` `linkedTo` | ✅ |
| 3 | Process attachments | `/glossary` process-type, model-attached | ✅ |
| 4 | Measure descriptions (glossary-driven) | attached Metric/KPI | ✅ |
| 5 | Column descriptions (glossary-driven) | attached term via `linkedTo.columns` | ✅ |
| 6 | Table descriptions (glossary-driven) | attached term via `linkedTo.tables` | ✅ |
| 7 | Sign-off block (Owner + Stewards) | ownership roles → render | ✅ |
| 8 | **Certification / endorsement stamp** | manual flag | ✅ (built this cycle) |
| 9 | **Custom executive note** (owner free-text intro) | manual | ✅ (built this cycle) |
| 10 | Change-log narrative overlay (the *why*) | manual annotation | ◻️ (T3) |

---

## Audience matrix (which preset shows which section)

✓ = present in that preset. Empty = excluded by design.

| Section | Auditor | Analyst | Executive | Engineer |
|---|:-:|:-:|:-:|:-:|
| Cover (+ certification badge) | ✓ | ✓ | ✓ | ✓ |
| Executive summary | ✓ | ✓ | ✓ big | ✓ |
| Custom executive note | — | ✓ | ✓ | — |
| Model maturity / quality | ✓ | ✓ | — | ✓ |
| Refresh history (+ incremental policy) | ✓ | ✓ | — | ✓ |
| Governance findings | ✓ | — | — | ✓ |
| Tables + columns | ✓ | ✓ | — | ✓ full |
| Relationships | ✓ | ✓ | — | ✓ |
| ER diagram | — | — | — | ✓ |
| Hierarchies | — | ✓ | — | ✓ |
| Calc groups / perspectives / translations | — | — | — | ✓ |
| Power Query (M) | — | — | — | ✓ |
| Measures + DAX | ✓ named | ✓ no-DAX | ✓ top-4 | ✓ + DAX |
| Calculated columns + storage | — | — | — | ✓ |
| Measure usage / dormancy | ✓ | — | — | ✓ |
| RLS rules | ✓ | — | — | — |
| OLS | ✓ | — | — | ✓ |
| Sensitivity labels | ✓ | — | — | — |
| Access (× RLS scope) | ✓ | — | — | ✓ |
| Lineage up/down | ✓ | ✓ | — | ✓ |
| Adoption | — | ✓ | ✓ | ✓ |
| Storage / size breakdown | — | — | — | ✓ |
| Capacity / cost attribution | ✓ | — | ✓ | ✓ |
| Business glossary | compliance terms | full · grouped | Metric+KPI | technical |
| Processes governing model | ✓ | — | — | — |
| Owners + sign-off | ✓ | contact card | cover credit | — |
| Change log | ✓ last-8 | — | — | ✓ full |

---

## Degradation rule

- **Automated sections** render even with zero manual data.
- **Manual sections** render explicit empty-states ("No stewards assigned in LP. Add via /ownership" · measure with no glossary term renders without a description) — **never fabricated content**. The empty slot is the signal to populate the LP foundation.

## Remaining gap (◻️)

- **Change-log narrative overlay** (the manual *why* on auto-detected changes) — T3, deferred.

All other catalogue entries are built in the mockup as of this cycle.

---

## Section sources — API call (auto) or LP screen (manual)

Where every section's data comes from. Automated = a Fabric API call / LP collector; manual = the LayerPulse screen where a human captures it.

| Section | Source — API call **or** LP screen |
|---|---|
| Cover | `Scanner getInfo` + LP `/ownership` (owner/domain) |
| Executive summary (KPIs) | `Scanner getInfo` (counts) + Metrics App DAX (rows) |
| Owner's note | LP `/models/[id]` — owner free-text |
| Table of contents | generated (no call) |
| Model maturity / quality | LP rules engine (over `Scanner getInfo` + BPA) |
| Scope & method | template (lists the APIs used) |
| Tables + columns | `Scanner getInfo` + LP `/glossary` (descriptions) |
| Relationships | `Scanner getInfo` → `relationships[]` |
| ER diagram | derived (auto-layout from relationships) |
| Hierarchies | `Scanner getInfo` → `hierarchies[]` |
| Calc groups / perspectives / translations | `Scanner getDefinition` (TMDL) |
| Power Query (M) | `Scanner getDefinition?datasetExpressions=true` (partition source) |
| Measures + DAX | `Scanner getInfo` → `measures[].expression` + LP `/glossary` (descriptions) |
| Calculated columns | `Scanner getInfo` + DMV (storage) |
| Measure usage / dormancy | `/admin/activityevents` × DAX dependency parse |
| RLS rules | `Scanner getInfo` → `roles[].tablePermissions[].filterExpression` |
| Object-level security (OLS) | `Scanner getInfo` → `roles[]` object permissions |
| Sensitivity labels | `Scanner getInfo` → column `sensitivityLabel` |
| Access | `/admin/datasets/{id}/users` + Graph `/groups/{id}/members` |
| Refresh history | `/admin/capacities/refreshables` + `/admin/activityevents` |
| Storage / size (VertiPaq) | DMV `$SYSTEM.DISCOVER_STORAGE_TABLE_COLUMN_SEGMENTS` |
| Capacity / cost (CU + €) | Metrics App DAX + `cost_observations` (H1/H2) |
| Lineage (up/down) | `Scanner` lineage + `/admin/groups/{ws}/reports` |
| Adoption (DAU/WAU/MAU) | `/admin/activityevents` (`ViewReport`-class) |
| Business glossary | LP `/glossary` |
| Processes governing model | LP `/glossary` (process-type, model-attached) |
| Owners & stewards | LP `/ownership` |
| Change log | `/admin/activityevents` + Scanner snapshot diff |
| Sign-off block | LP `/ownership` (roles → signature lines) |
| Change-log "why" notes ◻️ | LP — change-log annotation (not built) |

**The split:** Fabric **Scanner** (`getInfo`/`getDefinition`) carries schema + logic + security · **Admin API** (`/admin/activityevents`, `/admin/capacities/refreshables`, `/admin/datasets/{id}/users`) carries usage/refresh/access · **Graph** adds group-member expansion · **Metrics App DAX + DMV** carry cost + storage · **LP screens** (`/glossary`, `/ownership`) carry the two manual layers.
