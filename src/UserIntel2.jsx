import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard } from './components';
import { Avatar } from './UserIntel';

export function Adoption() {
  const a = DATA.adoption;
  const [tab, setTab] = React.useState('funnel');

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Adoption</h1>
          <p className="lp-page-sub">Are users coming back? Daily/weekly/monthly active counts, onboarding funnel, and Copilot for Fabric uptake.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
          <button className="btn btn-sm"><Icon name="bell" size={14}/>Quarterly digest</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="DAU"          value={a.dau.v} delta={a.dau.delta} sub="last 24h" icon="users" tone="sky"     spark={a.dau.spark}/>
        <StatCard label="WAU"          value={a.wau.v} delta={a.wau.delta} sub="last 7 days" icon="users" tone="emerald" spark={a.wau.spark}/>
        <StatCard label="MAU"          value={a.mau.v} delta={a.mau.delta} sub="last 30 days" icon="users" tone="amber"  spark={a.mau.spark}/>
        <StatCard label="Stickiness"   value={Math.round(a.stickiness * 100) + '%'} sub="DAU / MAU" icon="activity" tone="violet"/>
      </div>

      <div className="lp-section-head">
        <h2>Onboarding & Copilot <span className="count">Pick a lens</span></h2>
        <span className="seg-tabs">
          {[['funnel','Onboarding funnel'],['cohorts','Cohorts'],['copilot','Copilot adoption']].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </span>
      </div>

      {tab === 'funnel' && (
        <div className="lp-card fade-in">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Invited → Power user</div>
              <div className="lp-card-sub">Where users drop off in their first 60 days</div>
            </div>
            <span className="lp-eyebrow">Cohort: last 90 days</span>
          </div>
          <div className="funnel">
            {a.funnel.map((s, i) => {
              const w = s.rate * 100;
              const dropoff = i > 0 ? Math.round((1 - s.count / a.funnel[i - 1].count) * 100) : 0;
              return (
                <div key={s.stage} className="funnel-row">
                  <div className="funnel-stage">{s.stage}</div>
                  <div className="funnel-bar-wrap">
                    <div className="funnel-bar" style={{ width: w + '%' }}>
                      <span className="funnel-bar-count mono">{s.count}</span>
                    </div>
                  </div>
                  <div className="funnel-rate mono">{Math.round(s.rate * 100)}%</div>
                  <div className="funnel-drop">{i > 0 ? <span className="muted mono">−{dropoff}%</span> : <span className="muted">—</span>}</div>
                </div>
              );
            })}
          </div>
          <div className="funnel-insight">
            <Icon name="info" size={14}/>
            <span><strong>54 users</strong> made it to "first query" but never came back. Consider an in-product tour or template gallery for newcomers.</span>
          </div>
        </div>
      )}

      {tab === 'cohorts' && (
        <div className="lp-card fade-in">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Monthly cohort retention</div>
              <div className="lp-card-sub">Are new sign-ups sticking around?</div>
            </div>
          </div>
          <div className="cohort-table">
            <div className="cohort-head">
              <div>Cohort</div>
              <div>New users</div>
              <div>Month 1</div>
              <div>Month 2</div>
              <div>Month 3</div>
            </div>
            {a.cohorts.map(c => (
              <div key={c.month} className="cohort-row">
                <div className="cohort-month">{c.month}</div>
                <div className="cohort-cell mono cohort-base">{c.new}</div>
                <CohortCell value={c.retained} base={c.new}/>
                <CohortCell value={c.m2} base={c.new}/>
                <CohortCell value={c.m3} base={c.new}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'copilot' && (
        <div className="fade-in">
          <div className="lp-grid-4">
            <StatCard label="Copilot users"        value={a.copilot.active}      unit={' / ' + a.copilot.eligible} sub={Math.round(a.copilot.share * 100) + '% of seats'} icon="wand" tone="violet"/>
            <StatCard label="Sessions / week"      value={a.copilot.sessionsWeek.toLocaleString()} delta={18} icon="activity" tone="sky"/>
            <StatCard label="Suggestion acceptance" value={Math.round(a.copilot.ack * 100) + '%'} sub="vs 64% benchmark" icon="check" tone="emerald"/>
            <StatCard label="License savings target" value="€2,940" sub="if 4 inactive seats reclaimed" icon="dollar" tone="amber"/>
          </div>
          <div className="lp-grid-money" style={{ marginTop: 14 }}>
            <div className="lp-card">
              <div className="lp-card-header">
                <div>
                  <div className="lp-card-title">Weekly sessions, 12 weeks</div>
                  <div className="lp-card-sub">Trend since GA</div>
                </div>
              </div>
              <CopilotChart series={a.copilot.weekly}/>
              <div className="copilot-types">
                {a.copilot.types.map(t => (
                  <div key={t.kind} className="copilot-type">
                    <div className="copilot-type-row">
                      <span>{t.kind}</span>
                      <span className="mono muted">{t.count}</span>
                    </div>
                    <div className="ds-row-bar"><div className="ds-row-bar-fill" style={{ width: (t.share / 32 * 100) + '%' }}/></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-card">
              <div className="lp-card-header">
                <div>
                  <div className="lp-card-title">Top Copilot users</div>
                  <div className="lp-card-sub">By session count</div>
                </div>
              </div>
              {a.copilot.topUsers.map(u => (
                <div key={u.name} className="copilot-user">
                  <span className="copilot-dot"><Icon name="wand" size={10}/></span>
                  <span style={{ flex: 1 }}>{u.name}</span>
                  <span className="mono muted">{u.sessions} sessions</span>
                  <span className="badge tone-emerald-soft">{Math.round(u.ack * 100)}% ack</span>
                </div>
              ))}
              <div className="copilot-cta">
                <Icon name="info" size={14}/>
                <span>4 of 42 licensed users haven't used Copilot in 30 days. <a href="#">Review →</a></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CohortCell({ value, base }) {
  if (value == null) return <div className="cohort-cell cohort-empty">—</div>;
  const pct = value / base;
  return (
    <div className="cohort-cell" style={{ background: `oklch(${0.97 - pct * 0.20} ${0.04 + pct * 0.10} 145)` }}>
      <span className="mono">{value}</span>
      <span className="cohort-pct">{Math.round(pct * 100)}%</span>
    </div>
  );
}

function CopilotChart({ series }) {
  const max = Math.max(...series) * 1.1;
  const W = 100, H = 100;
  const stepX = W / (series.length - 1);
  const pts = series.map((v, i) => [i * stepX, H - (v / max) * H]);
  const path = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  return (
    <div className="copilot-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="cp-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"  stopColor="oklch(0.62 0.18 290)" stopOpacity="0.32"/>
            <stop offset="100%" stopColor="oklch(0.62 0.18 290)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${path} L${W} ${H} L0 ${H} Z`} fill="url(#cp-grad)"/>
        <path d={path} fill="none" stroke="oklch(0.55 0.18 290)" strokeWidth="0.8" vectorEffect="non-scaling-stroke"/>
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill="oklch(0.55 0.18 290)"/>)}
      </svg>
    </div>
  );
}

const ARTIFACT_META = {
  Dataset:   { icon: 'database',   color: 'oklch(0.69 0.17 237)', bg: 'var(--modern-icon-bg-sky)',    fg: 'var(--modern-icon-fg-sky)'    },
  Lakehouse: { icon: 'layers',     color: 'oklch(0.62 0.16 275)', bg: 'var(--modern-icon-bg-violet)', fg: 'var(--modern-icon-fg-violet)' },
  Notebook:  { icon: 'file-text',  color: 'oklch(0.58 0.15 150)', bg: 'var(--modern-icon-bg-emerald)',fg: 'var(--modern-icon-fg-emerald)'},
  Dataflow:  { icon: 'git-branch', color: 'oklch(0.65 0.18 45)',  bg: 'var(--modern-icon-bg-amber)',  fg: 'var(--modern-icon-fg-amber)'  },
};
const CATEGORY_META = {
  dead:    { label: 'Confirmed dead',  pill: 'tone-rose-soft',   dot: 'oklch(0.55 0.22 25)'  },
  cold:    { label: 'Going cold',      pill: 'tone-amber-soft',  dot: 'oklch(0.65 0.18 45)'  },
  failing: { label: 'Failing refreshes', pill: 'tone-violet-soft', dot: 'oklch(0.62 0.16 275)' },
};

function SleeperSpark({ data }) {
  const W = 90, H = 28;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (v / max) * (H - 4) - 2;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = `${pts} L${W},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="slp-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0.5"/>
          <stop offset="70%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="oklch(0.60 0.02 250)" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#slp-grad)"/>
      <path d={pts} fill="none" stroke="oklch(0.69 0.17 237)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
      <line x1={W} y1="0" x2={W} y2={H} stroke="oklch(0.55 0.22 25)" strokeWidth="2" strokeDasharray="3 2"/>
    </svg>
  );
}

export function Sleepers() {
  const s = DATA.sleepers;
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [catFilter, setCatFilter]   = React.useState('all');
  const [selected, setSelected]     = React.useState(null);

  const filtered = s.artifacts.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (catFilter === 'all' || a.category === catFilter)
  );

  const totalWaste = s.artifacts.reduce((sum, a) => sum + a.cost, 0);
  const maxCost = Math.max(...s.artifacts.map(a => a.cost));
  const typeOrder = ['Dataset', 'Lakehouse', 'Notebook', 'Dataflow'];

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Sleepers</h1>
          <p className="lp-page-sub">Artifacts still burning compute but unused — datasets, lakehouses, notebooks, and dataflows. Each card shows the 30-day access trail and exactly how much you're spending on nothing.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export list</button>
          <button className="btn btn-sm"><Icon name="archive" size={14}/>Bulk archive</button>
        </div>
      </div>

      {/* Waste spotlight hero */}
      <div className="slp-hero fade-in">
        <div className="slp-hero-left">
          <div className="slp-hero-label">Total monthly waste</div>
          <div className="slp-hero-amount mono">€{totalWaste.toLocaleString()}</div>
          <div className="slp-hero-sub">{s.artifacts.length} artifacts · {s.artifacts.filter(a => a.category === 'dead').length} confirmed dead</div>
        </div>
        <div className="slp-hero-bars">
          {typeOrder.map(type => {
            const items = s.artifacts.filter(a => a.type === type);
            const cost  = items.reduce((sum, a) => sum + a.cost, 0);
            const meta  = ARTIFACT_META[type];
            return (
              <div key={type} className="slp-type-row" onClick={() => setTypeFilter(f => f === type ? 'all' : type)} style={{ cursor: 'pointer', opacity: typeFilter !== 'all' && typeFilter !== type ? 0.4 : 1 }}>
                <div className="slp-type-label">
                  <span className="slp-type-dot" style={{ background: meta.color }}/>
                  <span>{type}</span>
                  <span className="slp-type-count">{items.length}</span>
                </div>
                <div className="slp-type-track">
                  <div className="slp-type-fill" style={{ width: (cost / totalWaste * 100) + '%', background: meta.color }}/>
                </div>
                <span className="slp-type-cost mono">€{cost}</span>
              </div>
            );
          })}
        </div>
        <div className="slp-hero-cats">
          {Object.entries(CATEGORY_META).map(([k, v]) => {
            const count = s.artifacts.filter(a => a.category === k).length;
            return (
              <button key={k} className={'slp-cat-pill ' + (catFilter === k ? 'active' : '')} onClick={() => setCatFilter(f => f === k ? 'all' : k)}>
                <span className="slp-cat-dot" style={{ background: v.dot }}/>
                {v.label}<span className="slp-cat-n">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter chips */}
      <div className="lp-section-head" style={{ marginTop: 8 }}>
        <h2>Artifacts <span className="count">{filtered.length} of {s.artifacts.length}</span></h2>
        <div className="chip-row">
          {['all', ...typeOrder].map(t => (
            <button key={t} className={'chip' + (typeFilter === t ? ' active' : '')} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All types' : t}
              {t !== 'all' && <span className="count">{s.artifacts.filter(a => a.type === t).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Artifact list */}
      <div className="slp-list fade-in d2">
        {filtered.map(a => {
          const meta = ARTIFACT_META[a.type];
          const catM = CATEGORY_META[a.category];
          const isSel = selected === a.id;
          return (
            <div key={a.id} className={'slp-row' + (isSel ? ' slp-row-open' : '')} onClick={() => setSelected(s => s === a.id ? null : a.id)}>
              <div className="slp-row-icon" style={{ background: meta.bg, color: meta.fg }}>
                <Icon name={meta.icon} size={16}/>
              </div>

              <div className="slp-row-main">
                <div className="slp-row-name">{a.name}</div>
                <div className="slp-row-meta">
                  <span className="badge badge-outline">{a.ws}</span>
                  {a.size !== '—' && <span className="muted">· {a.size}</span>}
                  {a.schedule !== '—' && <span className="muted">· refreshes {a.schedule}</span>}
                  {a.downstream > 0 && <span className="slp-downstream"><Icon name="git-branch" size={10}/>{a.downstream} downstream</span>}
                </div>
              </div>

              <div className="slp-row-spark">
                <div className="slp-spark-label muted">30-day access</div>
                <SleeperSpark data={a.spark}/>
                <div className="slp-spark-now muted">dead</div>
              </div>

              <div className="slp-row-stale">
                <div className="slp-stale-val mono">{a.lastActive}d</div>
                <div className="slp-stale-lbl">inactive</div>
              </div>

              <div className="slp-row-cost">
                <div className="slp-cost-val mono">€{a.cost}</div>
                <div className="slp-cost-bar">
                  <div style={{ width: (a.cost / maxCost * 100) + '%', height: '100%', background: 'oklch(0.55 0.22 25)', borderRadius: 999 }}/>
                </div>
                <div className="slp-cost-lbl">/mo wasted</div>
              </div>

              <span className={'badge ' + catM.pill} style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>{catM.label}</span>

              <div className="slp-row-actions" onClick={e => e.stopPropagation()}>
                {a.refreshes30d > 0 && <button className="btn btn-outline btn-sm">Pause refresh</button>}
                <button className="btn btn-sm btn-danger">Archive</button>
              </div>

              {isSel && (
                <div className="slp-expand fade-in">
                  <div className="slp-expand-grid">
                    <div><span className="lp-eyebrow">Refreshes / 30d</span><div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{a.refreshes30d}</div></div>
                    <div><span className="lp-eyebrow">Type</span><div style={{ marginTop: 2 }}><span className="badge badge-outline">{a.type}</span></div></div>
                    {a.downstream > 0 && <div><span className="lp-eyebrow">Downstream consumers</span><div className="mono val-amber" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{a.downstream} artifacts at risk</div></div>}
                  </div>
                  {a.downstream > 0 && (
                    <div className="slp-warning">
                      <Icon name="alert" size={13}/>
                      <span>Archiving this will break {a.downstream} downstream artifact{a.downstream > 1 ? 's' : ''}. Check lineage before proceeding.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="empty">No artifacts match the current filters.</div>}
      </div>

      <div className="lp-section-head"><h2>Refresh-to-first-query latency <span className="count">Right-size your schedules</span></h2></div>
      <div className="lp-card lp-card-flush fade-in d3">
        <div className="latency-head">
          <div>Dataset</div>
          <div>Refresh</div>
          <div>First query</div>
          <div>Wait</div>
          <div>Recommendation</div>
        </div>
        {s.refreshLatency.map(r => (
          <div key={r.dataset} className="latency-row">
            <div><Icon name="database" size={12}/> {r.dataset}</div>
            <div className="mono">{r.refresh}</div>
            <div className="mono">{r.firstQuery}</div>
            <div className="latency-wait">
              <div className="latency-bar-track">
                <div className="latency-bar-fill" style={{ width: Math.min(100, r.wait / 6) + '%', background: r.wait > 480 ? 'var(--rose)' : r.wait > 360 ? 'var(--amber)' : 'var(--emerald)' }}/>
              </div>
              <span className="mono">{Math.floor(r.wait / 60)}h {r.wait % 60}m</span>
            </div>
            <div>
              {r.recommendation === 'shift'
                ? <span className="badge tone-amber-soft">Shift refresh later</span>
                : <span className="badge tone-emerald-soft">Well-timed</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function Audit() {
  const a = DATA.audit;
  const [tab, setTab] = React.useState('exports');
  const [q, setQ] = React.useState('');

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Audit & Compliance</h1>
          <p className="lp-page-sub">Export log, off-hours access patterns, and row-level-security rule firing — searchable, exportable for SOC 2 / HIPAA evidence.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Download report</button>
          <button className="btn btn-sm"><Icon name="bell" size={14}/>Alert rules</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Exports / 30d"        value={a.summary.exports30d.toLocaleString()} icon="external" tone="sky"/>
        <StatCard label="After-hours exports"  value={a.summary.exportsAfterHours} sub="of 1,284 total" icon="moon" tone="amber"/>
        <StatCard label="RLS rules tracked"    value={a.summary.rlsRules} sub="across 8 models" icon="shield" tone="emerald"/>
        <StatCard label="Never-firing rules"   value={a.summary.rlsNeverFire} sub="likely misconfigured" icon="alert" tone="rose"/>
      </div>

      <div className="lp-section-head">
        <span className="seg-tabs">
          {[['exports','Export log'],['offhours','Off-hours access'],['rls','RLS evaluation']].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </span>
      </div>

      {tab === 'exports' && (
        <>
          <div className="lp-card lp-card-flush fade-in" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
                <Icon name="search" size={14}/>
                <input placeholder="Search by user, dataset, report…" value={q} onChange={e => setQ(e.target.value)}/>
              </div>
              <select className="input input-sm">
                <option>All formats</option><option>CSV</option><option>XLSX</option><option>PDF</option>
              </select>
              <select className="input input-sm">
                <option>All sensitivity</option><option>Restricted</option><option>Confidential</option><option>Internal</option>
              </select>
              <select className="input input-sm">
                <option>Last 30 days</option><option>Last 7 days</option><option>Last 24 hours</option>
              </select>
            </div>
          </div>

          <div className="lp-card lp-card-flush fade-in d2">
            <div className="audit-head">
              <div>Time</div>
              <div>User</div>
              <div>Dataset / Report</div>
              <div>Format</div>
              <div>Rows</div>
              <div>Sensitivity</div>
              <div></div>
            </div>
            {a.exports.filter(e => q === '' || (e.user + e.dataset + e.report).toLowerCase().includes(q.toLowerCase())).map((e, i) => (
              <div key={i} className={'audit-row' + (e.flag ? ' flagged' : '')}>
                <div className="mono">{e.at}</div>
                <div className="audit-user">
                  {e.user.startsWith('svc-')
                    ? <span className="svc-badge"><Icon name="bot" size={10}/></span>
                    : <Avatar name={e.user} size={22}/>}
                  <span>{e.user}</span>
                </div>
                <div>
                  <div>{e.dataset}</div>
                  <div className="muted">{e.report}</div>
                </div>
                <div><span className="badge badge-outline">{e.format}</span></div>
                <div className="mono">{e.rows ? e.rows.toLocaleString() : '—'}</div>
                <div>
                  <span className={'badge ' + (e.sens === 'Restricted' ? 'tone-rose-soft' : e.sens === 'Confidential' ? 'tone-amber-soft' : 'tone-slate-soft')}>{e.sens}</span>
                </div>
                <div>
                  {e.flag && <span className="audit-flag" title="After-hours OR restricted-data export"><Icon name="alert" size={12}/></span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'offhours' && (
        <div className="lp-card fade-in">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Export heatmap, last 7 days</div>
              <div className="lp-card-sub">Exports per hour. Highlighted cells fall outside business hours (Mon–Fri 08:00–18:00 CET).</div>
            </div>
          </div>
          <OffHoursHeatmap data={a.offHoursHeatmap}/>
          <div className="funnel-insight" style={{ marginTop: 14 }}>
            <Icon name="alert" size={14}/>
            <span><strong>47 after-hours exports</strong> in the last 30 days — 3.7% of all exports. <a href="#">Review the 7 flagged in the export log →</a></span>
          </div>
        </div>
      )}

      {tab === 'rls' && (
        <div className="lp-card lp-card-flush fade-in">
          <div className="rls-head">
            <div>Rule</div>
            <div>Model</div>
            <div>Role</div>
            <div>Fires / 30d</div>
            <div>Last fire</div>
            <div>Status</div>
          </div>
          {a.rlsRules.map(r => (
            <div key={r.id} className={'rls-row' + (r.status === 'never' ? ' rls-never' : '')}>
              <div className="mono">{r.id}</div>
              <div>{r.model}</div>
              <div><span className="badge badge-outline">{r.role}</span></div>
              <div className="mono">{r.fires30d.toLocaleString()}</div>
              <div className="muted mono">{r.lastFire}</div>
              <div>
                {r.status === 'never'
                  ? <span className="badge tone-rose-soft">Never fires</span>
                  : <span className="badge tone-emerald-soft">Active</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function OffHoursHeatmap({ data }) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const max = Math.max(...data.flat());
  return (
    <div className="heatmap">
      <div className="heatmap-cols">
        <div style={{ width: 40 }}/>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="heatmap-hr" style={{ visibility: h % 4 === 0 ? 'visible' : 'hidden' }}>{String(h).padStart(2, '0')}</div>
        ))}
      </div>
      {data.map((row, di) => (
        <div key={di} className="heatmap-row">
          <div className="heatmap-day">{days[di]}</div>
          {row.map((v, hi) => {
            const intensity = v / max;
            const offHours = hi < 8 || hi > 18 || di >= 5;
            return (
              <div key={hi} className={'heatmap-cell' + (offHours && v > 3 ? ' off-hours' : '')} style={{
                background: v === 0 ? 'var(--muted)' : `oklch(${0.95 - intensity * 0.55} ${0.05 + intensity * 0.15} ${offHours ? 25 : 145})`,
              }} title={`${days[di]} ${String(hi).padStart(2, '0')}:00 — ${v} exports`}/>
            );
          })}
        </div>
      ))}
    </div>
  );
}
