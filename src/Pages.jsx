import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { Badge } from './components';

export function AreaChart({ data, threshold }) {
  const W = 760, H = 220, P = 24;
  const lo = 0, hi = 100;
  const x = i => P + (i * (W - 2*P)) / (data.length - 1);
  const y = v => H - P - ((v - lo) / (hi - lo)) * (H - 2*P);
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.v)}`).join(' ');
  const area = line + ` L ${x(data.length - 1)} ${H - P} L ${x(0)} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="cap-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0,0.25,0.5,0.75,1].map(f => (
        <line key={f} x1={P} x2={W-P} y1={P + f*(H-2*P)} y2={P + f*(H-2*P)} stroke="oklch(0.92 0.005 250)" strokeDasharray="2 3" strokeWidth="1"/>
      ))}
      <line x1={P} x2={W-P} y1={y(threshold)} y2={y(threshold)} stroke="oklch(0.55 0.22 25)" strokeDasharray="4 4" strokeWidth="1.2"/>
      <text x={W-P} y={y(threshold)-5} textAnchor="end" fontSize="10" fill="oklch(0.55 0.22 25)" fontFamily="JetBrains Mono">{threshold}% threshold</text>
      <path d={area} fill="url(#cap-grad)"/>
      <path d={line} fill="none" stroke="oklch(0.69 0.17 237)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function Alerts() {
  const [rules, setRules] = React.useState([
    { type: 'Capacity above threshold',       threshold: '85%',           last: '2h ago',  enabled: true, icon: 'gauge', tone: 'amber' },
    { type: 'Refresh failed',                 threshold: 'any',           last: '14h ago', enabled: true, icon: 'refresh', tone: 'rose' },
    { type: 'Health score drop',              threshold: '−10 pts / 24h', last: 'never',   enabled: false, icon: 'activity', tone: 'sky' },
    { type: 'Doc coverage below target',      threshold: '80%',           last: '3d ago',  enabled: true, icon: 'file-text', tone: 'emerald' },
    { type: 'New Import model > 50M rows',    threshold: '50,000,000',    last: '1d ago',  enabled: true, icon: 'database', tone: 'violet' },
    { type: 'Undocumented measure created',   threshold: 'any',           last: '6h ago',  enabled: false, icon: 'bell', tone: 'amber' },
  ]);
  const toggle = i => setRules(rs => rs.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r));
  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Alerts</h1>
          <p className="lp-page-sub">Tell me what's wrong, not what's normal.</p>
        </div>
        <button className="btn btn-sm fade-in d2"><Icon name="plus" size={14}/>New rule</button>
      </div>
      <div className="lp-card lp-card-flush fade-in">
        {rules.map((r, i) => (
          <div key={r.type} className="alert-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={'lp-stat-tile tone-' + r.tone} style={{ width: 34, height: 34 }}><Icon name={r.icon} size={16}/></span>
              <div>
                <div className="alert-title">{r.type}</div>
                <div className="alert-meta">threshold {r.threshold} · last fired {r.last}</div>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={r.enabled} onChange={() => toggle(i)}/>
              <span/>
            </label>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Settings (4-tab rebuild) ──────────────────────────────────────────
// Tabs: Connection · Ingestion · Pricing · Plan
//   - Connection : SP creds + connection status + Capacity Metrics App workspace/dataset IDs
//   - Ingestion  : sync toggle + schedule + last-sync + per-arm status + timezone
//   - Pricing    : capacity $/mo + license $/user/mo (Free / Pro / PPU / F-SKUs / M365 E5)
//   - Plan       : LayerPulse subscription — current usage + tier comparison + upgrade

export function Settings() {
  const [tab, setTab] = React.useState('connection');
  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Settings</h1>
          <p className="lp-page-sub">Configure how LayerPulse connects to your Fabric tenant, ingests data, prices your contracts, and bills for itself.</p>
        </div>
      </div>

      <div className="model-tabs fade-in d2" style={{ marginTop: 6 }}>
        {[
          ['connection','Connection','shield-check'],
          ['ingestion', 'Ingestion', 'refresh'],
          ['pricing',   'Pricing',   'dollar'],
          ['plan',      'Plan & Billing', 'zap'],
        ].map(([k, l, ic]) => (
          <button key={k} className={'model-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
            <Icon name={ic} size={14}/>{l}
          </button>
        ))}
      </div>

      {tab === 'connection' && <ConnectionTab/>}
      {tab === 'ingestion'  && <IngestionTab/>}
      {tab === 'pricing'    && <PricingTab/>}
      {tab === 'plan'       && <PlanTab/>}
    </>
  );
}

// ── Tab 1: Connection ────────────────────────────────────────────────
function ConnectionTab() {
  const [saved, setSaved] = React.useState(false);
  const submit = e => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  return (
    <div className="settings-tab fade-in d3">
      {/* Connection status hero */}
      <div className="lp-card settings-status">
        <div className="settings-status-row">
          <span className="badge tone-emerald-soft" style={{ fontWeight: 600 }}>● ready</span>
          <span className="badge tone-slate-soft" style={{ fontWeight: 500 }}><Icon name="shield-check" size={11}/>Silver fidelity</span>
          <span className="mono settings-status-time">last sync 4m ago · {new Date('2026-05-18T04:01:00').toLocaleString('en-US', { hour12: false })}</span>
        </div>
        <div className="settings-status-grid">
          <div className="settings-status-cell"><div className="k mono">4</div><div className="l">Capacities</div></div>
          <div className="settings-status-cell"><div className="k mono">511</div><div className="l">Workspaces</div></div>
          <div className="settings-status-cell"><div className="k mono">1,688</div><div className="l">Models</div></div>
          <div className="settings-status-cell"><div className="k mono">12,604</div><div className="l">Reports</div></div>
        </div>
      </div>

      {/* Service principal */}
      <form className="lp-card" onSubmit={submit}>
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Service principal</div>
            <div className="lp-card-sub">Authenticates LayerPulse against the Fabric REST + Admin APIs. Credentials encrypted at rest.</div>
          </div>
          <Badge tone="outline"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.58 0.15 150)' }}/>Connected</Badge>
        </div>
        <div className="form-grid">
          <label>Environment name<input className="input" defaultValue="SBM Production"/></label>
          <label>Azure Tenant ID<input className="input mono" defaultValue="81effa57-092e-4f44-acc1-0cc5105272cb"/></label>
          <label>Client ID<input className="input mono" defaultValue="b10a2337-036e-4661-9f43-f5b6b2ce4ab7"/></label>
          <label>Client secret<input className="input mono" type="password" defaultValue="••••••••••••••••"/></label>
        </div>
        <div className="settings-form-foot">
          {saved && <span className="settings-saved">✓ saved</span>}
          <button className="btn btn-outline btn-sm" type="button"><Icon name="zap" size={12}/>Test connection</button>
          <button className="btn btn-sm">Save credentials</button>
        </div>
      </form>

      {/* Capacity Metrics App */}
      <div className="lp-card">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Capacity Metrics App</div>
            <div className="lp-card-sub">Connect LayerPulse to your installed Microsoft Capacity Metrics App for capacity, throttling, and CU-level cost telemetry.</div>
          </div>
          <span className="badge tone-emerald-soft">Connected</span>
        </div>
        <div className="form-grid">
          <label>Workspace ID<input className="input mono" defaultValue="ae8456ba-d1da-417c-b660-9f2bf74f91e3"/></label>
          <label>Dataset ID<input className="input mono" defaultValue="55d69150-9395-4b05-9e3b-4caed8066e59"/></label>
        </div>
        <details className="settings-help">
          <summary>How to find these IDs</summary>
          <ol>
            <li>In Power BI, open the Microsoft Fabric Capacity Metrics app workspace.</li>
            <li>Copy the Workspace ID from <span className="mono">app.powerbi.com/groups/&lt;this&gt;</span> and the Dataset ID from the report URL.</li>
            <li>Add the service principal above as a Workspace <b>Member</b> with <b>Build</b> permission on the dataset. <span className="muted">(Same SP as the tenant connection — no new SP needed.)</span></li>
          </ol>
        </details>
      </div>

      {/* Danger zone — destructive ops live under Connection (this is where the SP attaches the tenant) */}
      <div className="lp-card settings-danger">
        <div className="settings-danger-head">
          <Icon name="alert-triangle" size={14}/>
          <span>Danger zone</span>
        </div>
        <div className="settings-danger-body">
          <div className="settings-row-label">Delete this environment</div>
          <div className="settings-row-sub">Permanently delete this environment, its workspaces, models, capacities, and all collected metrics. This cannot be undone. The Fabric tenant itself is not affected.</div>
        </div>
        <div className="settings-danger-actions">
          <button className="btn btn-outline btn-sm">Export environment first</button>
          <button className="btn btn-sm settings-danger-cta">Delete environment</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Ingestion ─────────────────────────────────────────────────
// Each arm has a per-run history (last N scheduled runs). Outcomes: ok / partial / fail / pending.
// Rolls up to an aggregate "97% completion · 28/30 ok" summary + a 30-square health grid.
const RUN_TONE = {
  ok:      { bg: 'oklch(0.58 0.15 150)', label: 'OK'      },
  partial: { bg: 'oklch(0.65 0.18 65)',  label: 'Partial' },
  fail:    { bg: 'oklch(0.55 0.22 25)',  label: 'Failed'  },
  pending: { bg: 'oklch(0.85 0.005 250)',label: 'Pending' },
};

// Pseudo-random outcome per (arm, day) — stable per seed.
function runOutcome(seed, i) {
  let h = 2166136261; const s = seed + '·' + i;
  for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619);
  const r = (h >>> 0) % 100;
  if (r < 92) return 'ok';
  if (r < 97) return 'partial';
  return 'fail';
}

// Build N runs of history for an arm.
function buildHistory(seed, n) {
  return Array.from({ length: n }, (_, i) => runOutcome(seed, n - 1 - i));
}

function RunGrid({ runs, label }) {
  const okCount   = runs.filter(r => r === 'ok').length;
  const partial   = runs.filter(r => r === 'partial').length;
  const failed    = runs.filter(r => r === 'fail').length;
  const completion = Math.round((okCount / runs.length) * 100);
  return (
    <div className="ing-grid-row">
      <div className="ing-grid-cells">
        {runs.map((r, i) => (
          <span key={i} className={'ing-cell ing-cell-' + r}
                title={`Run ${i + 1} of ${runs.length} · ${RUN_TONE[r].label}`}
                style={{ background: RUN_TONE[r].bg }}/>
        ))}
      </div>
      <div className="ing-grid-summary">
        <span className="ing-grid-pct mono">{completion}%</span>
        <span className="ing-grid-detail muted">
          {okCount} ok{partial > 0 ? ` · ${partial} partial` : ''}{failed > 0 ? ` · ${failed} failed` : ''}
        </span>
      </div>
    </div>
  );
}

// Five canonical LP collector arms — see Obsidian: docs/architecture/metrics-app-model.md,
// runbooks/sp-onboarding.md, audits/collector-atomicity-audit-2026-05-11.md,
// prd/{activity-events-atomic-ingestion,governance-pillar-section-b,settings-cron-controls}.md.
// Run nightly via Promise.allSettled — failure-isolated per axis.
const INGEST_ARMS = [
  { key: 'activity',     name: 'Activity events',           meta: '/admin/activityevents · 24×1h · 1,284 events / 24h' },
  { key: 'metrics',      name: 'Capacity Metrics App (DAX)', meta: 'MetricsByItemAndHour · 41 tables · 147 measures'   },
  { key: 'refreshables', name: 'Refreshables',              meta: '/admin/capacities/refreshables · 47 datasets'      },
  { key: 'tenant',       name: 'Tenant settings',           meta: '/v1/admin/tenantsettings · 160 settings'            },
  { key: 'scanner',      name: 'Model introspection',       meta: 'admin/groups + admin/datasets + Scanner getInfo · Silver fidelity' },
];

// Planned ingestion axes — not collected yet. Ordered by BACKLOG.md sequencing (Tier-1 SP-only first,
// then Q3 Graph-delegated, then Q4 SP-only). Each axis lights up its own product surface when it lands.
const PLANNED_AXES = [
  { key: 'reports',    seq: 1, name: 'Reports',            meta: 'GET /v1/admin/groups/{wsId}/reports · per-workspace fan-out · viewer activity + cost share-of-bill', tier: 'Tier 1 · T1.8', auth: 'SP-only',         surface: 'Reports & Apps pillar',         prd: 'reports-apps-pillar.md' },
  { key: 'dataflows',  seq: 2, name: 'Dataflows',          meta: 'Admin API · Gen1 + Gen2 · lineage + refresh history',                                                   tier: 'Tier 1 · T1.9', auth: 'SP-only',         surface: 'Dataflow catalog',              prd: 'fabric-dataflows-axis.md' },
  { key: 'items',      seq: 3, name: 'All Fabric items',   meta: '/admin/workspaces (drop 14d activity filter) · Lakehouses + Notebooks + Pipelines + Datamarts + …',     tier: 'Tier 1',         auth: 'SP-only',         surface: 'Artifact catalog',              prd: '../reports/2026-05-15-data-inventory-survey.md' },
  { key: 'users-lic',  seq: 4, name: 'Users + licenses',   meta: 'Microsoft Graph · /users + /subscribedSkus + /reports/userActivity',                                     tier: 'Q3',             auth: 'Graph delegated', surface: 'Users page v2 (license cost)',  prd: 'users-page-pillar.md' },
  { key: 'aad-groups', seq: 5, name: 'AAD groups',         meta: 'Microsoft Graph · /groups + /groups/{id}/members (transitive expansion)',                                 tier: 'Q3',             auth: 'Graph',           surface: 'E Governance · Sections C/D',  prd: 'microsoft-graph-integration.md' },
  { key: 'apps',       seq: 6, name: 'Apps',               meta: 'Admin API · published apps · audience + engagement metrics',                                              tier: 'Q4',             auth: 'SP-only',         surface: 'App catalog',                   prd: 'reports-apps-pillar.md' },
];

function IngestionTab() {
  const [syncOn, setSyncOn]     = React.useState(true);
  const [schedule, setSchedule] = React.useState('daily');
  const [timezone, setTimezone] = React.useState('Amsterdam (NL)');

  // Build 30-run history per arm + overall (combined daily completion).
  const armHistory = INGEST_ARMS.map(a => ({ ...a, runs: buildHistory(a.key, 30) }));
  const overall    = Array.from({ length: 30 }, (_, i) => {
    const day = armHistory.map(a => a.runs[i]);
    if (day.every(o => o === 'ok')) return 'ok';
    if (day.some(o => o === 'fail')) return 'fail';
    return 'partial';
  });
  const okCount  = overall.filter(o => o === 'ok').length;
  const partial  = overall.filter(o => o === 'partial').length;
  const failed   = overall.filter(o => o === 'fail').length;
  const overallPct = Math.round((okCount / overall.length) * 100);
  const allHealthy = failed === 0 && partial <= 1;

  return (
    <div className="settings-tab fade-in d3">
      <div className="lp-card">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Data ingestion</div>
            <div className="lp-card-sub">Sync your Fabric tenant on a schedule. Pause to stop auto-syncing without removing credentials.</div>
          </div>
          <span className={'badge ' + (allHealthy ? 'tone-emerald-soft' : failed > 0 ? 'tone-rose-soft' : 'tone-amber-soft')}>
            {allHealthy ? 'Healthy' : failed > 0 ? `${failed} failed runs` : `${partial} partial runs`}
          </span>
        </div>

        <div className="settings-row">
          <div className="settings-row-main">
            <div className="settings-row-label">Sync enabled</div>
            <div className="settings-row-sub">Pulls workspaces, models, metrics from your Fabric tenant on the schedule below.</div>
          </div>
          <label className="doc-toggle">
            <input type="checkbox" checked={syncOn} onChange={e => setSyncOn(e.target.checked)}/>
            <span className="doc-toggle-track"><span className="doc-toggle-thumb"/></span>
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-main">
            <div className="settings-row-label">Schedule</div>
            <div className="settings-row-sub">All syncs run at 02:00 in the timezone set below. Pick a daily cadence, a specific weekday, or a custom cron expression.</div>
          </div>
          <select className="input input-sm" value={schedule} onChange={e => setSchedule(e.target.value)} style={{ width: 240, flexShrink: 0 }}>
            <option value="daily">Daily</option>
            <option value="weekly-mon">Weekly on Monday</option>
            <option value="weekly-tue">Weekly on Tuesday</option>
            <option value="weekly-wed">Weekly on Wednesday</option>
            <option value="weekly-thu">Weekly on Thursday</option>
            <option value="weekly-fri">Weekly on Friday</option>
            <option value="weekly-sat">Weekly on Saturday</option>
            <option value="weekly-sun">Weekly on Sunday</option>
            <option value="custom">Custom (cron expression)</option>
          </select>
        </div>
        {schedule === 'custom' && (
          <div className="settings-row" style={{ paddingTop: 0, borderTop: 0 }}>
            <div className="settings-row-main">
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted-foreground)' }}>Cron expression</span>
                <input className="input mono" defaultValue="0 2 * * *" placeholder="0 2 * * *  (every day at 02:00)" style={{ maxWidth: 320 }}/>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>5-field POSIX cron · minute hour day-of-month month day-of-week</span>
              </label>
            </div>
          </div>
        )}

        {/* Overall 30-day completion grid */}
        <div className="settings-row">
          <div className="settings-row-main">
            <div className="settings-row-label">Last 30 scheduled runs · <b className="mono">{overallPct}% completion</b></div>
            <div className="settings-row-sub">{okCount} ok · {partial} partial · {failed} failed. Each cell = one daily run, oldest left → newest right.</div>
          </div>
        </div>
        <div className="ing-overall-grid">
          {overall.map((r, i) => (
            <span key={i} className={'ing-cell ing-cell-' + r}
                  title={`Run ${i + 1}/30 · ${RUN_TONE[r].label}`}
                  style={{ background: RUN_TONE[r].bg }}/>
          ))}
        </div>
        <div className="ing-legend">
          {Object.entries(RUN_TONE).filter(([k]) => k !== 'pending').map(([k, t]) => (
            <span key={k} className="ing-legend-item">
              <span className="ing-cell" style={{ background: t.bg }}/>
              {t.label}
            </span>
          ))}
        </div>

        <div className="settings-row settings-row-last" style={{ marginTop: 6 }}>
          <div className="settings-row-main">
            <div className="settings-row-label">Last sync: <b>11h ago</b></div>
            <div className="settings-row-sub mono">1,652 models · 1,008,160 events · next run in ~13h</div>
          </div>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={12}/>Sync now</button>
        </div>
      </div>

      {/* Per-arm health w/ 14-run mini-grid */}
      <div className="lp-card">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Per-arm health · last 30 runs</div>
            <div className="lp-card-sub">LayerPulse pulls each axis on its own schedule. Failures isolate to one arm — the grid shows you exactly where the gap is.</div>
          </div>
        </div>
        <div className="ing-arms">
          <div className="ing-arms-head">
            <div>Arm</div>
            <div>Last 30 runs</div>
            <div>Completion</div>
            <div>Detail</div>
          </div>
          {armHistory.map(a => {
            const armOk = a.runs.filter(r => r === 'ok').length;
            const armPct = Math.round((armOk / a.runs.length) * 100);
            return (
              <div key={a.key} className="ing-arms-row">
                <div className="ing-arms-name">
                  <span className={'arm-dot status-' + (armPct === 100 ? 'ok' : armPct >= 90 ? 'warn' : 'fail')}/>
                  {a.name}
                </div>
                <div className="ing-arms-cells">
                  {a.runs.map((r, i) => (
                    <span key={i} className={'ing-cell ing-cell-' + r}
                          title={`Run ${i + 1}/30 · ${RUN_TONE[r].label}`}
                          style={{ background: RUN_TONE[r].bg }}/>
                  ))}
                </div>
                <div className="mono ing-arms-pct">{armPct}%</div>
                <div className="mono muted ing-arms-meta">{a.meta}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Planned axes — roadmap teaser, 6 axes ordered by BACKLOG.md sequencing */}
      <div className="lp-card ing-planned">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Planned ingestion axes <span className="count mono">{PLANNED_AXES.length}</span></div>
            <div className="lp-card-sub">New data sources on the LP roadmap, ordered by sequencing. Each axis lights up its own product surface when it lands. PRDs linked.</div>
          </div>
          <span className="badge tone-violet-soft">QBR roadmap</span>
        </div>
        <div className="ing-planned-list">
          {PLANNED_AXES.map(a => {
            const tierTone = a.tier.startsWith('Tier 1') ? 'sky' : a.tier.startsWith('Q3') ? 'amber' : 'rose';
            return (
              <div key={a.key} className="ing-planned-row">
                <div className="ing-planned-seq mono">{a.seq}</div>
                <div className="ing-planned-main">
                  <div className="ing-planned-name">
                    <span className="ing-planned-dot"/>
                    {a.name}
                  </div>
                  <div className="ing-planned-meta mono">{a.meta}</div>
                  <div className="ing-planned-surface"><Icon name="zap" size={10}/> Unlocks: <b>{a.surface}</b></div>
                </div>
                <div className="ing-planned-tier">
                  <span className={'badge tone-' + tierTone + '-soft'} style={{ fontSize: 10 }}>{a.tier}</span>
                  <span className="badge badge-outline" style={{ fontSize: 9.5 }}>{a.auth}</span>
                  <a href={`https://github.com/michielq16/layerpulse_mockup/blob/main/docs/prd/${a.prd}`} target="_blank" rel="noreferrer" className="ing-planned-prd mono">prd/{a.prd}</a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lp-card">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Timezone</div>
            <div className="lp-card-sub">Used for off-hours bucketing (09:00–18:00 local), refresh scheduling, and audit timestamps in your local view. Auditor surfaces always render in UTC.</div>
          </div>
        </div>
        <div className="form-grid form-grid-single">
          <label>Working timezone
            <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
              <optgroup label="Americas">
                <option>Los Angeles (PT)</option>
                <option>Denver (MT)</option>
                <option>Chicago (CT)</option>
                <option>New York (ET)</option>
                <option>São Paulo (BRT)</option>
              </optgroup>
              <optgroup label="Europe">
                <option>London (UK)</option>
                <option>Amsterdam (NL)</option>
                <option>Berlin (DE)</option>
                <option>Paris (FR)</option>
                <option>Stockholm (SE)</option>
              </optgroup>
              <optgroup label="Asia-Pacific">
                <option>Singapore (SGT)</option>
                <option>Hong Kong (HKT)</option>
                <option>Tokyo (JST)</option>
                <option>Sydney (AEDT)</option>
              </optgroup>
              <optgroup label="Other">
                <option>UTC</option>
              </optgroup>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Pricing (Capacity + License) ──────────────────────────────
const CAPACITY_PRICING_SEED = [
  { id: 'cap-prd', name: 'SBM Offshore Power BI – PRD', sku: 'F8', region: 'West Europe', cost: 5000, currency: 'USD', effective: '2026-05-18' },
  { id: 'cap-snd', name: 'SBM Offshore Power BI – SND', sku: 'F2', region: 'West Europe', cost: 1462, currency: 'USD', effective: '2026-05-18' },
  { id: 'cap-uat', name: 'SBM Offshore Power BI – UAT', sku: 'F4', region: 'West Europe', cost: 0,    currency: 'USD', effective: null,        missing: true },
];

const LICENSE_PRICING_SEED = [
  { id: 'free',   name: 'Power BI (Free)',           cost: 0,   per: 'user/mo', users: 312, note: 'No paid feature access' },
  { id: 'pro',    name: 'Power BI Pro',              cost: 10,  per: 'user/mo', users: 134, note: 'Standard MS list price' },
  { id: 'ppu',    name: 'Power BI Premium / User',   cost: 20,  per: 'user/mo', users: 12,  note: 'Premium features per user' },
  { id: 'e5',     name: 'Microsoft 365 E5',          cost: 57,  per: 'user/mo', users: 38,  note: 'Includes Power BI Pro · enterprise bundle' },
  { id: 'svc',    name: 'Service principal',          cost: 0,   per: '—',       users: 4,   note: 'No license fee' },
];

function PricingTab() {
  return (
    <div className="settings-tab fade-in d3">
      <div className="lp-card">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Capacity pricing</div>
            <div className="lp-card-sub">Enter your actual monthly cost for each detected capacity to power contract-aware cost attribution.</div>
          </div>
          <select className="input input-sm" defaultValue="USD" style={{ width: 90 }}>
            <option>USD</option><option>EUR</option><option>GBP</option>
          </select>
        </div>
        <div className="pricing-list">
          {CAPACITY_PRICING_SEED.map(c => (
            <div key={c.id} className={'pricing-row' + (c.missing ? ' pricing-row-missing' : '')}>
              <div className="pricing-row-main">
                <div className="pricing-row-name">{c.name}</div>
                <div className="pricing-row-meta mono">{c.sku} · {c.region}</div>
                {c.missing
                  ? <div className="pricing-row-cost"><span className="missing-pricing">No pricing configured</span></div>
                  : <div className="pricing-row-cost mono"><b>${c.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b> / month <span className="muted">({c.currency})</span></div>}
                {c.effective && <div className="pricing-row-eff">Effective {c.effective} <span className="tone-emerald-soft" style={{ padding: '0 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>current</span></div>}
              </div>
              <div className="pricing-row-actions">
                <button className="btn btn-outline btn-sm"><Icon name="settings" size={12}/>{c.missing ? 'Set price' : 'Update price'}</button>
                {!c.missing && <button className="btn btn-ghost btn-sm"><Icon name="chevron-down" size={12}/>History (1)</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="pricing-footnote">
          <Icon name="info" size={12}/>
          <span>Without pricing, LayerPulse computes CU only — no $ attribution. <b>SBM-UAT</b> needs pricing to surface in /costs.</span>
        </div>
      </div>

      <div className="lp-card">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">License pricing</div>
            <div className="lp-card-sub">Customer-entered subscription cost per Power BI / Microsoft 365 license tier. Drives <code>Wasted Spend</code> on /users-new + /workspaces Total Cost KPI.</div>
          </div>
          <span className="mono settings-license-total">$3,506/mo · 500 licenses</span>
        </div>
        <div className="pricing-list">
          {LICENSE_PRICING_SEED.map(l => {
            const monthly = l.cost * l.users;
            return (
              <div key={l.id} className="pricing-row pricing-license-row">
                <div className="pricing-row-main">
                  <div className="pricing-row-name">{l.name}</div>
                  <div className="pricing-row-meta">{l.note}</div>
                </div>
                <div className="pricing-license-grid">
                  <div className="pricing-license-cell">
                    <div className="pricing-license-k mono">${l.cost}</div>
                    <div className="pricing-license-l">{l.per}</div>
                  </div>
                  <div className="pricing-license-cell">
                    <div className="pricing-license-k mono">{l.users}</div>
                    <div className="pricing-license-l">assigned</div>
                  </div>
                  <div className="pricing-license-cell">
                    <div className="pricing-license-k mono" style={{ color: monthly > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>${monthly.toLocaleString()}</div>
                    <div className="pricing-license-l">total/mo</div>
                  </div>
                </div>
                <div className="pricing-row-actions">
                  <button className="btn btn-outline btn-sm"><Icon name="settings" size={12}/>Edit</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pricing-footnote">
          <Icon name="info" size={12}/>
          <span>Defaults pulled from Microsoft list pricing (Pro $10, PPU $20, M365 E5 $57). Override to match your enterprise agreement.</span>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Plan & Billing (LayerPulse subscription) ─────────────────
const LP_TIERS = [
  {
    id: 'free', name: 'Free', price: 0, period: '/forever',
    blurb: 'For exploration and personal use.',
    limits: { models: 3, ai: 100, docs: 100, capacities: 1, retention: '7 days' },
    features: ['1 partner seat', 'Up to 3 semantic models', 'Daily ingest only', 'No multi-tenant'],
  },
  {
    id: 'pro', name: 'Pro', price: 49, period: '/mo · per seat', recommended: true,
    blurb: 'For Microsoft partners managing 10–50 customer tenants.',
    limits: { models: 'Unlimited', ai: 5000, docs: 'Unlimited', capacities: 10, retention: '90 days' },
    features: ['Multi-tenant partner portal (F-2)', 'Unlimited semantic models', 'Hourly ingest available', 'Tenant Activity forensic search', 'Documents auto-Word (all audiences)', 'Email digests + standing subscriptions'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: null, period: 'Contact sales',
    blurb: 'For enterprise direct customers & MSP partners with > 50 tenants.',
    limits: { models: 'Unlimited', ai: 'Unlimited', docs: 'Unlimited', capacities: 'Unlimited', retention: '7 years' },
    features: ['Everything in Pro', 'SOC 2 evidence pack export', '7-year activity retention', 'SSO + custom auth', 'Dedicated success engineer', 'SLA-backed uptime'],
  },
];

function PlanTab() {
  const currentTier = 'free';
  return (
    <div className="settings-tab fade-in d3">
      <div className="lp-card plan-current">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Your plan · <b>Free</b></div>
            <div className="lp-card-sub">Upgrade to unlock unlimited models, hourly ingest, and the auto-Word Documents flow.</div>
          </div>
          <button className="btn btn-sm doc-gen-cta"><Icon name="zap" size={13}/>Upgrade to Pro</button>
        </div>
        <div className="plan-usage">
          {[
            { l: 'Semantic models tracked', v: 3, max: 3,   over: true },
            { l: 'AI analyses · 30d',       v: 44, max: 100 },
            { l: 'Docs generated · 30d',    v: 18, max: 100 },
            { l: 'Capacities connected',    v: 1, max: 1,   over: true },
          ].map(r => (
            <div key={r.l} className="plan-usage-row">
              <div className="plan-usage-label">{r.l}</div>
              <div className="plan-usage-bar">
                <div className="plan-usage-fill" style={{ width: (r.v / r.max * 100) + '%', background: r.v >= r.max ? 'oklch(0.55 0.22 25)' : 'oklch(0.69 0.17 237)' }}/>
              </div>
              <div className="plan-usage-val mono">{r.v}/{r.max}</div>
              {r.over && <span className="badge tone-rose-soft" style={{ fontSize: 9.5 }}>at cap</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="lp-section-head"><h2>Compare tiers</h2></div>

      <div className="plan-tier-grid">
        {LP_TIERS.map(t => (
          <div key={t.id} className={'plan-tier' + (t.id === currentTier ? ' plan-tier-current' : '') + (t.recommended ? ' plan-tier-recommended' : '')}>
            {t.recommended && <div className="plan-tier-recommended-badge">RECOMMENDED FOR PARTNERS</div>}
            <div className="plan-tier-head">
              <div className="plan-tier-name">{t.name}</div>
              <div className="plan-tier-price">
                {t.price === null ? <span style={{ fontSize: 16 }}>Custom</span> : <><span className="plan-tier-price-num mono">${t.price}</span><span className="plan-tier-price-period">{t.period}</span></>}
              </div>
              <div className="plan-tier-blurb">{t.blurb}</div>
            </div>
            <ul className="plan-tier-features">
              {t.features.map(f => (
                <li key={f}><Icon name="check" size={11}/> {f}</li>
              ))}
            </ul>
            <div className="plan-tier-limits">
              <div className="plan-tier-limits-grid">
                <div><span className="muted">Models</span><b>{t.limits.models}</b></div>
                <div><span className="muted">AI / mo</span><b>{t.limits.ai}</b></div>
                <div><span className="muted">Docs / mo</span><b>{t.limits.docs}</b></div>
                <div><span className="muted">Capacities</span><b>{t.limits.capacities}</b></div>
                <div><span className="muted">Retention</span><b>{t.limits.retention}</b></div>
              </div>
            </div>
            <div className="plan-tier-cta">
              {t.id === currentTier
                ? <button className="btn btn-outline btn-sm" disabled>Current plan</button>
                : t.id === 'enterprise'
                  ? <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Talk to sales</button>
                  : <button className="btn btn-sm doc-gen-cta"><Icon name="zap" size={12}/>Upgrade to {t.name}</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="lp-card plan-history">
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Billing history</div>
            <div className="lp-card-sub">Charges, invoices, and receipts. Available once you upgrade to Pro.</div>
          </div>
          <button className="btn btn-outline btn-sm" disabled><Icon name="external" size={12}/>Open billing portal</button>
        </div>
        <div className="empty" style={{ padding: 18, textAlign: 'center', fontSize: 12.5 }}>
          No invoices yet — Free plan has no charges.
        </div>
      </div>
    </div>
  );
}

export function DrillSheet({ issue, onClose }) {
  if (!issue) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <aside className="sheet">
        <div className="sheet-head">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone={'sev-' + issue.severity}>{issue.severity}</Badge>
            <Badge tone="outline">{issue.category}</Badge>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-foreground)' }}>{issue.id}</span>
          </div>
          <button className="sheet-close" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="sheet-body">
          <h2 style={{ fontSize: 20, margin: '0 0 10px', fontWeight: 600, letterSpacing: '-0.01em' }}>{issue.title}</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 18px' }}>{issue.evidence}</p>

          <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Root cause</div>
          <div className="lp-card" style={{ padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Sales Model refresh pulls all <code style={{ background: 'var(--muted)', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>FactSales</code> rows on every run.</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>42% of 7-day CU · peak Tue–Thu 08:00–10:00</div>
          </div>

          <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Affected objects (3)</div>
          <div className="lp-card lp-card-flush" style={{ marginBottom: 16 }}>
            <table className="lp-table">
              <thead><tr><th>Measure</th><th>DAX</th><th style={{ width: 90 }}>Complexity</th></tr></thead>
              <tbody>
                <tr><td className="name"><Icon name="bar-chart" size={12}/>Total Sales</td><td className="num muted" style={{ fontSize: 11 }}>SUM(FactSales[Amount])</td><td><Badge tone="sev-info">Simple</Badge></td></tr>
                <tr><td className="name"><Icon name="bar-chart" size={12}/>YTD Revenue</td><td className="num muted" style={{ fontSize: 11 }}>CALCULATE(...)</td><td><Badge tone="sev-critical">High</Badge></td></tr>
                <tr><td className="name"><Icon name="bar-chart" size={12}/>Gross Margin</td><td className="num muted" style={{ fontSize: 11 }}>DIVIDE(...)</td><td><Badge tone="sev-warning">Medium</Badge></td></tr>
              </tbody>
            </table>
          </div>

          <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Recommendation</div>
          <div style={{ padding: 14, borderRadius: 10, background: 'oklch(0.96 0.04 237)', border: '1px solid oklch(0.80 0.1 237 / 0.3)', fontSize: 13, marginBottom: 16 }}>
            <Icon name="wand" size={14}/> &nbsp;Schedule refresh outside 08:00–10:00 window and enable incremental refresh on FactSales.
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6 }}>Est. savings: ~€182/month</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm"><Icon name="external" size={12}/>View in model</button>
            <button className="btn btn-outline btn-sm"><Icon name="dollar" size={12}/>Cost breakdown</button>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>Dismiss</button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function TweaksPanel({ state, set, onClose }) {
  return (
    <div className="tw-panel">
      <div className="tw-head">
        <Icon name="sliders" size={14}/>
        <span className="title">Tweaks</span>
        <span className="mono">prototype</span>
        <button className="tw-close" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      <div className="tw-body">
        <div className="tw-section-label">Theme</div>
        <div className="tw-btn-row">
          <button className={state.theme === 'light' ? 'active' : ''} onClick={() => set({ theme: 'light' })}>Light</button>
          <button className={state.theme === 'dark' ? 'active' : ''} onClick={() => set({ theme: 'dark' })}>Dark</button>
        </div>

        <div className="tw-section-label">Density</div>
        <div className="tw-btn-row">
          <button className={state.density === 'comfortable' ? 'active' : ''} onClick={() => set({ density: 'comfortable' })}>Comfortable</button>
          <button className={state.density === 'compact' ? 'active' : ''} onClick={() => set({ density: 'compact' })}>Compact</button>
        </div>

        <div className="tw-section-label">Accent</div>
        <div className="tw-swatches">
          {[
            ['sky', 'oklch(0.69 0.17 237)'],
            ['violet', 'oklch(0.62 0.16 275)'],
            ['emerald', 'oklch(0.58 0.15 150)'],
          ].map(([k, c]) => (
            <button key={k} className={'tw-swatch ' + (state.accent === k ? 'active' : '')} style={{ background: c }} onClick={() => set({ accent: k })}/>
          ))}
        </div>
      </div>
    </div>
  );
}
