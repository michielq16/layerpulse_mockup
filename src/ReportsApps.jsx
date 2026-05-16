import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard } from './components';

export function ReportsApps({ onGoModel }) {
  const [tab, setTab] = React.useState('reports');
  const [filter, setFilter] = React.useState('all');
  const r = DATA.reports, a = DATA.apps;

  const reportsFiltered = r.items.filter(it =>
    filter === 'all' || it.status === filter
  );

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Reports & Apps</h1>
          <p className="lp-page-sub">Every PowerBI / Paginated report and every published App in your tenant — joined to dataset health and viewer activity from the last 30 days.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={12}/>Re-scan</button>
          <button className="btn btn-sm"><Icon name="external" size={12}/>Export inventory</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Reports tracked"        value={r.total}             sub="across all workspaces" icon="file-text" tone="sky"/>
        <StatCard label="Orphaned / broken"      value={r.orphaned}          sub="dataset deleted or stale" icon="alert" tone="rose"/>
        <StatCard label="Dormant"                value={r.dormant}           sub="zero opens in 30d" icon="moon" tone="amber"/>
        <StatCard label="Published apps"         value={a.total}             sub={a.audienceTotal.toLocaleString() + ' total audience'} icon="boxes" tone="violet"/>
      </div>

      <div className="lp-section-head">
        <h2>{tab === 'reports' ? 'Reports' : 'Apps'}</h2>
        <span className="seg-tabs">
          <button className={'seg-tab' + (tab === 'reports' ? ' active' : '')} onClick={() => setTab('reports')}>Reports · {r.total}</button>
          <button className={'seg-tab' + (tab === 'apps' ? ' active' : '')} onClick={() => setTab('apps')}>Apps · {a.total}</button>
        </span>
      </div>

      {tab === 'reports' && (
        <>
          <div className="lp-card lp-card-flush" style={{ padding: 14, marginBottom: 14 }}>
            <div className="chip-row">
              {[
                ['all',     'All',     r.items.length],
                ['healthy', 'Healthy', r.items.filter(i => i.status === 'healthy').length],
                ['dormant', 'Dormant', r.items.filter(i => i.status === 'dormant').length],
                ['orphan',  'Orphan',  r.items.filter(i => i.status === 'orphan').length],
                ['broken',  'Broken',  r.items.filter(i => i.status === 'broken').length],
              ].map(([k, lbl, n]) => (
                <button key={k} className={'chip' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>
                  {lbl}<span className="count">{n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rep-grid fade-in d2">
            {reportsFiltered.map(rep => (
              <div key={rep.name} className={'rep-card status-' + rep.status}>
                <div className="rep-card-head">
                  <div className="rep-card-icon" style={{ background: `var(--modern-icon-bg-${rep.tone})`, color: `var(--modern-icon-fg-${rep.tone})` }}>
                    <Icon name={rep.type === 'Paginated' ? 'file-text' : 'bar-chart'} size={16}/>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="rep-card-name">{rep.name}</div>
                    <div className="rep-card-meta">
                      <span className="badge badge-outline">{rep.type}</span>
                      <span className="muted"> · {rep.ws}</span>
                    </div>
                  </div>
                  <span className={'rep-status rep-status-' + rep.status}>
                    {rep.status === 'healthy' && <><span className="d"/>Healthy</>}
                    {rep.status === 'dormant' && <><span className="d"/>Dormant</>}
                    {rep.status === 'orphan'  && <><span className="d"/>Orphaned</>}
                    {rep.status === 'broken'  && <><span className="d"/>Broken</>}
                  </span>
                </div>

                <div className="rep-card-row">
                  <Icon name="database" size={11}/>
                  <span className="muted">Source dataset</span>
                  <span className={'mono' + (rep.dataset === '(deleted)' ? ' val-rose' : '')} style={{ cursor: rep.modelId && onGoModel ? 'pointer' : undefined, color: rep.modelId && onGoModel ? 'var(--primary)' : undefined }}
                    onClick={() => rep.modelId && onGoModel && onGoModel(rep.wsId || 'finance-prod', rep.modelId || 'sales-analytics')}>
                    {rep.dataset}
                  </span>
                  <span className={'refresh-pill refresh-' + rep.refresh}>{rep.refresh === 'ok' ? '✓' : rep.refresh === 'stale' ? '↻ stale' : rep.refresh === 'failed' ? '✗ failed' : 'n/a'}</span>
                </div>

                <div className="rep-card-stats">
                  <div>
                    <div className="rep-stat-val mono">{rep.viewers30}</div>
                    <div className="rep-stat-lbl">Viewers · 30d</div>
                  </div>
                  <div>
                    <div className="rep-stat-val mono">{rep.opens30.toLocaleString()}</div>
                    <div className="rep-stat-lbl">Opens · 30d</div>
                  </div>
                  <div>
                    <div className="rep-stat-val mono">{rep.visuals}</div>
                    <div className="rep-stat-lbl">Visuals</div>
                  </div>
                  <div>
                    <div className="rep-stat-val mono">{rep.modified.split(' ')[0]}</div>
                    <div className="rep-stat-lbl">Modified</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'apps' && (
        <div className="apps-grid fade-in d2">
          {a.items.map(app => (
            <div key={app.name} className={'app-card status-' + app.status}>
              <div className="app-card-head">
                <div className="app-card-icon" style={{ background: `var(--modern-icon-bg-${app.tone})`, color: `var(--modern-icon-fg-${app.tone})` }}>
                  <Icon name="boxes" size={18}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="app-card-name">{app.name}</div>
                  <div className="app-card-meta"><span className="badge badge-outline">{app.ws}</span><span className="muted"> · {app.reports} reports</span></div>
                </div>
                <span className={'rep-status rep-status-' + app.status}>
                  <span className="d"/>{app.status === 'healthy' ? 'Healthy' : 'Dormant'}
                </span>
              </div>

              <div className="app-audience">
                <div className="audience-bar">
                  <div className="audience-active" style={{ width: Math.min(100, app.opens30 / app.audience * 100) + '%' }}/>
                </div>
                <div className="audience-meta">
                  <span><b>{app.opens30.toLocaleString()}</b> opens · 30d</span>
                  <span className="muted">of <b>{app.audience.toLocaleString()}</b> assigned</span>
                </div>
                {app.opens30 < app.audience * 0.1 && (
                  <div className="audience-warn">
                    <Icon name="alert" size={11}/>
                    <span>Only {Math.round(app.opens30 / app.audience * 100)}% engagement — review audience targeting</span>
                  </div>
                )}
              </div>

              <div className="app-card-foot">
                <span className="muted mono">Updated {app.updated}</span>
                <button className="btn btn-outline btn-sm" style={{ height: 26 }}>Open <Icon name="arrow-right" size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
