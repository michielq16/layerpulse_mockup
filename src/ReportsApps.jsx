import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, CapacityScopeSelector } from './components';

const DOT_COLOR = { healthy: 'oklch(0.55 0.17 145)', dormant: 'oklch(0.65 0.18 55)', orphan: 'oklch(0.55 0.22 25)', broken: 'oklch(0.55 0.22 25)' };
const APP_TONES = {
  sky:    { bg: 'var(--modern-icon-bg-sky)',    fg: 'var(--modern-icon-fg-sky)' },
  violet: { bg: 'var(--modern-icon-bg-violet)', fg: 'var(--modern-icon-fg-violet)' },
  emerald:{ bg: 'var(--modern-icon-bg-emerald)',fg: 'var(--modern-icon-fg-emerald)' },
  amber:  { bg: 'var(--modern-icon-bg-amber)',  fg: 'var(--modern-icon-fg-amber)' },
  rose:   { bg: 'var(--modern-icon-bg-rose)',   fg: 'var(--modern-icon-fg-rose)' },
};

function RefreshPill({ r }) {
  if (r === 'ok')     return <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:4, background:'oklch(0.94 0.06 145)', color:'oklch(0.38 0.14 145)' }}>✓ ok</span>;
  if (r === 'stale')  return <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:4, background:'oklch(0.95 0.07 60)', color:'oklch(0.46 0.15 55)' }}>↻ stale</span>;
  if (r === 'failed') return <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:4, background:'oklch(0.94 0.06 25)', color:'oklch(0.42 0.17 25)' }}>✗ failed</span>;
  return <span style={{ fontSize:10, color:'var(--muted-foreground)' }}>—</span>;
}

function UsageBar({ opens30, maxOpens }) {
  const pct = maxOpens > 0 ? Math.round(opens30 / maxOpens * 100) : 0;
  return (
    <div className="cat-usage-col">
      <div className="cat-usage-bar">
        <div style={{ width: pct + '%', background: 'oklch(0.69 0.17 237)' }}/>
      </div>
      <span className="mono" style={{ fontSize:12, minWidth:34, textAlign:'right' }}>{opens30.toLocaleString()}</span>
    </div>
  );
}

function MiniSpark({ data }) {
  const W = 50, H = 20;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (v / max) * (H - 4) - 2;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={W} height={H} className="mini-spark" viewBox={`0 0 ${W} ${H}`}>
      <path d={pts} fill="none" stroke="oklch(0.69 0.17 237)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

function AppAccordionRow({ app, allReports }) {
  const [open, setOpen] = React.useState(false);
  const tone = APP_TONES[app.tone] || APP_TONES.sky;
  const reps = allReports.filter(r => r.apps && r.apps.includes(app.name));
  const totalOpens = reps.reduce((s, r) => s + r.opens30, 0);
  const engPct = app.audience > 0 ? Math.round(app.opens30 / app.audience * 100) : 0;

  return (
    <div className="cat-app-row">
      <button className="cat-app-head" onClick={() => setOpen(o => !o)}>
        <div className="cat-app-icon" style={{ background: tone.bg, color: tone.fg }}>
          <Icon name="boxes" size={18}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cat-app-name">{app.name}</div>
          <div className="cat-app-meta">{app.ws} · {reps.length} reports</div>
        </div>
        <div className="cat-app-stats">
          <div className="cat-app-stat">
            <div className="k">{app.audience.toLocaleString()}</div>
            <div className="l">Audience</div>
          </div>
          <div className="cat-app-stat">
            <div className="k">{app.opens30.toLocaleString()}</div>
            <div className="l">Opens/30d</div>
          </div>
          <div className="cat-app-stat" style={{ paddingRight: 0 }}>
            <div className="k">{engPct}%</div>
            <div className="l">Engagement</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:12, flexShrink:0 }}>
          <div style={{ width:80, height:5, borderRadius:999, background:'var(--muted)', overflow:'hidden' }}>
            <div style={{ width: Math.min(100, engPct) + '%', height:'100%', background: engPct < 20 ? 'oklch(0.65 0.18 55)' : 'oklch(0.58 0.15 150)', borderRadius:999 }}/>
          </div>
          <span className={'rep-status rep-status-' + app.status} style={{ flexShrink:0 }}>
            <span className="d"/>{app.status === 'healthy' ? 'Healthy' : 'Dormant'}
          </span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} style={{ color:'var(--muted-foreground)' }}/>
        </div>
      </button>
      {open && (
        <div className="cat-app-reports fade-in">
          {reps.length === 0 && (
            <div style={{ padding:'12px 20px', fontSize:12, color:'var(--muted-foreground)' }}>No reports linked to this app.</div>
          )}
          {reps.map(rep => (
            <div key={rep.name} className="cat-app-rep-row">
              <span className="cat-status-dot" style={{ background: DOT_COLOR[rep.status] || DOT_COLOR.healthy }}/>
              <span className="cat-rep-name">{rep.name}</span>
              <span className="badge badge-outline" style={{ fontSize:10 }}>{rep.type}</span>
              <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{rep.opens30.toLocaleString()} opens</span>
              <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>{rep.viewers30} viewers</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportsApps({ onGoModel }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sort, setSort] = React.useState('opens');
  const [capacityId, setCapId] = React.useState('all');                          // page-scope filter (top-right head)
  const r = DATA.reports;
  const a = DATA.apps;

  const healthyCount = r.items.filter(i => i.status === 'healthy').length;
  const dormantCount = r.items.filter(i => i.status === 'dormant').length;
  const orphanCount  = r.items.filter(i => i.status === 'orphan' || i.status === 'broken').length;
  const inAppCount   = r.items.filter(i => i.apps && i.apps.length > 0).length;

  const maxOpens = Math.max(...r.items.map(i => i.opens30));

  const filtered = r.items
    .filter(it => {
      if (statusFilter === 'active')  return it.status === 'healthy';
      if (statusFilter === 'dormant') return it.status === 'dormant';
      if (statusFilter === 'issues')  return it.status === 'orphan' || it.status === 'broken';
      return true;
    })
    .filter(it => {
      if (!search) return true;
      const q = search.toLowerCase();
      return it.name.toLowerCase().includes(q) || it.ws.toLowerCase().includes(q) || it.dataset.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'opens')   return b.opens30 - a.opens30;
      if (sort === 'viewers') return b.viewers30 - a.viewers30;
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Report Catalog</h1>
          <p className="lp-page-sub">Your full report estate — active, dormant, and orphaned reports joined to dataset health, viewer activity, and published apps.</p>
        </div>
        <div className="fade-in d2 ws-head-actions">
          <CapacityScopeSelector value={capacityId} onChange={setCapId}/>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={12}/>Re-scan</button>
          <button className="btn btn-sm"><Icon name="external" size={12}/>Export</button>
        </div>
      </div>

      <div className="cat-stat-strip fade-in">
        <div className="cat-stat-cell">
          <div className="cat-stat-k">{r.total}</div>
          <div className="cat-stat-l">Total reports</div>
        </div>
        <div className="cat-stat-cell">
          <div className="cat-stat-k" style={{ color:'oklch(0.45 0.17 145)' }}>{healthyCount}</div>
          <div className="cat-stat-l">Active this month</div>
        </div>
        <div className="cat-stat-cell">
          <div className="cat-stat-k" style={{ color:'oklch(0.52 0.16 55)' }}>{dormantCount}</div>
          <div className="cat-stat-l">Dormant</div>
        </div>
        <div className="cat-stat-cell">
          <div className="cat-stat-k" style={{ color:'oklch(0.50 0.20 25)' }}>{orphanCount}</div>
          <div className="cat-stat-l">Orphaned / broken</div>
        </div>
        <div className="cat-stat-cell">
          <div className="cat-stat-k">{a.total}</div>
          <div className="cat-stat-l">Apps</div>
        </div>
        <div className="cat-stat-cell">
          <div className="cat-stat-k">{inAppCount}</div>
          <div className="cat-stat-l">Reports in apps</div>
        </div>
      </div>

      <div className="cat-filter-bar fade-in d2">
        <div className="lp-search" style={{ flex:1, minWidth:200 }}>
          <Icon name="search" size={14}/>
          <input
            placeholder="Search reports or workspaces…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="chip-row" style={{ gap:6 }}>
          {[
            ['all','All'],
            ['active','Active'],
            ['dormant','Dormant'],
            ['issues','Issues'],
          ].map(([k,l]) => (
            <button key={k} className={'chip' + (statusFilter === k ? ' active' : '')} onClick={() => setStatusFilter(k)}>{l}</button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', background:'var(--card)', fontSize:13, color:'var(--foreground)', outline:'none', cursor:'pointer' }}
        >
          <option value="opens">Most opens</option>
          <option value="viewers">Most viewers</option>
          <option value="az">A–Z</option>
        </select>
      </div>

      <div className="lp-card lp-card-flush fade-in d2">
        <table className="cat-table">
          <thead>
            <tr>
              <th style={{ width:20 }}></th>
              <th>Report</th>
              <th>Workspace</th>
              <th>Type</th>
              <th>Dataset</th>
              <th>Usage (30d)</th>
              <th>Viewers</th>
              <th>In apps</th>
              <th>Modified</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(rep => (
              <tr key={rep.name}>
                <td>
                  <span className="cat-status-dot" style={{ background: DOT_COLOR[rep.status] || DOT_COLOR.healthy }}/>
                </td>
                <td>
                  <span className="cat-name" title={rep.name}>{rep.name}</span>
                </td>
                <td>
                  <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>{rep.ws}</span>
                </td>
                <td>
                  <span className="badge badge-outline" style={{ fontSize:10 }}>{rep.type}</span>
                </td>
                <td>
                  <div>
                    <span
                      className="cat-dataset"
                      style={{ cursor: rep.modelId && onGoModel ? 'pointer' : undefined, color: rep.modelId && onGoModel ? 'var(--primary)' : (rep.dataset === '(deleted)' ? 'oklch(0.50 0.20 25)' : undefined) }}
                      onClick={() => rep.modelId && onGoModel && onGoModel(rep.wsId || 'finance-prod', rep.modelId)}
                    >
                      {rep.dataset}
                    </span>
                    <div style={{ marginTop:2 }}><RefreshPill r={rep.refresh}/></div>
                  </div>
                </td>
                <td style={{ minWidth:120 }}>
                  <UsageBar opens30={rep.opens30} maxOpens={maxOpens}/>
                </td>
                <td>
                  <span className="mono" style={{ fontSize:12 }}>{rep.viewers30}</span>
                </td>
                <td>
                  {rep.apps && rep.apps.length > 0
                    ? rep.apps.map(appName => <span key={appName} className="cat-app-chip">{appName}</span>)
                    : <span style={{ color:'var(--muted-foreground)', fontSize:12 }}>—</span>
                  }
                </td>
                <td>
                  <span style={{ fontSize:12, color:'var(--muted-foreground)', whiteSpace:'nowrap' }}>{rep.modified}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cat-table-foot">
          Showing {filtered.length} of {r.total} reports
        </div>
      </div>

      <div className="lp-section-head fade-in d3">
        <h2>Published apps <span className="count">{a.total} total</span></h2>
      </div>

      <div className="cat-apps-list fade-in d3">
        {a.items.map(app => (
          <AppAccordionRow key={app.name} app={app} allReports={r.items}/>
        ))}
      </div>
    </>
  );
}
