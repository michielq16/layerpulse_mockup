import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, EnvBadge } from './components';

export function Workspaces({ onOpen }) {
  const [q, setQ]               = React.useState('');
  const [env, setEnv]           = React.useState('all');
  const [capacityId, setCapId]  = React.useState('all');
  const [capOpen, setCapOpen]   = React.useState(false);

  const allItems   = DATA.workspaces.items;
  const capacities = DATA.workspaces.capacities;
  const summary    = DATA.workspaces.summary;

  // Apply capacity + env + search filters.
  const items = allItems.filter(w =>
    (capacityId === 'all' || w.capacityId === capacityId) &&
    (env === 'all' || w.env.toLowerCase() === env) &&
    (q === '' || w.name.toLowerCase().includes(q.toLowerCase()))
  );

  // KPIs recalculate when the capacity filter narrows.
  const scoped = capacityId === 'all' ? allItems : allItems.filter(w => w.capacityId === capacityId);
  const scopedModels  = scoped.reduce((n, w) => n + (w.models || 0), 0);
  const scopedReports = scoped.reduce((n, w) => n + (w.reports || 0), 0);
  const scopedCapCost = capacityId === 'all'
    ? capacities.reduce((s, c) => s + c.monthlyCost, 0)
    : (capacities.find(c => c.id === capacityId)?.monthlyCost || 0);
  // License cost scales pro-rata with workspaces in scope (rough estimate for the mockup).
  const scopedLicCost = Math.round(summary.totalCost.licenseCost * (scoped.length / allItems.length));
  const scopedTotal   = scopedCapCost + scopedLicCost;
  const scopedWaste   = Math.round(summary.wastedSpend.value * (scoped.length / allItems.length));

  // Env-bucket counts honor the capacity filter (matches your screenshot's "PROD 185 / UAT 162 / DEV 164" semantics).
  const envCounts = {
    all:  scoped.length,
    prod: scoped.filter(w => w.env === 'PROD').length,
    uat:  scoped.filter(w => w.env === 'UAT').length,
    dev:  scoped.filter(w => w.env === 'DEV').length,
  };

  const selectedCap = capacities.find(c => c.id === capacityId);

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Workspaces</h1>
          <p className="lp-page-sub">Every Fabric workspace in this tenant — scoped by capacity, ranked by health. Click any to drill into models, reports, and cost.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Sync workspaces</button>
          <button className="btn btn-sm"><Icon name="plus" size={14}/>Connect capacity</button>
        </div>
      </div>

      {/* 5-KPI strip — Workspaces · Models · Health · Total Cost · Potential Wasted */}
      <div className="ws-grid-5 fade-in">
        <StatCard label="Workspaces"     value={scoped.length}              sub={capacityId === 'all' ? 'across portfolio' : selectedCap?.name} icon="folders" tone="sky"/>
        <StatCard label="Semantic Models" value={scopedModels}              sub={scopedReports + ' reports'}                                    icon="database" tone="violet"/>
        <HealthScoreCard health={summary.health}/>
        <StatCard label="Total Cost · Est." value={'$' + (scopedTotal / 1000).toFixed(1) + 'k'} unit="/mo" sub={'$' + scopedCapCost.toLocaleString() + ' capacity + $' + scopedLicCost.toLocaleString() + ' licenses'} icon="dollar" tone="emerald"/>
        <StatCard label="Potential Wasted" value={'$' + scopedWaste.toLocaleString()} unit="/mo" sub={summary.wastedSpend.sources.length + ' optimization opportunities'} icon="trend-down" tone="amber"/>
      </div>

      <div className="lp-section-head" style={{ marginTop: 20 }}>
        <h2>Browse <span className="count">{items.length} of {scoped.length}</span></h2>
        <span className="lp-eyebrow">Filter by capacity, environment, or name</span>
      </div>

      {/* Filter bar — capacity selector + search + env pills */}
      <div className="lp-card lp-card-flush ws-filter-card fade-in d2">
        <div className="ws-filter-row">
          {/* Capacity selector */}
          <div className="ws-cap-wrap">
            <span className="ws-cap-label">CAPACITY</span>
            <button className={'ws-cap-btn' + (capOpen ? ' open' : '')} onClick={() => setCapOpen(o => !o)}>
              <span className={'ws-cap-dot' + (capacityId === 'all' ? '' : ' active')}/>
              <span className="ws-cap-name">{capacityId === 'all' ? 'All capacities' : selectedCap?.name}</span>
              {capacityId !== 'all' && selectedCap && <span className="badge badge-outline ws-cap-sku">{selectedCap.sku}</span>}
              {capacityId === 'all' && <span className="ws-cap-count mono">{capacities.length}</span>}
              <Icon name="chevron-down" size={12}/>
            </button>
            {capOpen && (
              <div className="ws-cap-pop" onClick={e => e.stopPropagation()}>
                <div className="ws-cap-pop-head">CAPACITIES · {capacities.length}</div>
                <button className={'ws-cap-pop-row' + (capacityId === 'all' ? ' active' : '')} onClick={() => { setCapId('all'); setCapOpen(false); }}>
                  <span className="ws-cap-pop-name">All capacities</span>
                  {capacityId === 'all' && <Icon name="check" size={13}/>}
                </button>
                {capacities.map(c => (
                  <button key={c.id} className={'ws-cap-pop-row' + (capacityId === c.id ? ' active' : '')} onClick={() => { setCapId(c.id); setCapOpen(false); }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ws-cap-pop-name">{c.name} <span className="badge badge-outline ws-cap-sku-sm">{c.sku}</span></div>
                      <div className="ws-cap-pop-sub mono">${c.monthlyCost.toLocaleString()}/mo · {c.region}</div>
                    </div>
                    {capacityId === c.id && <Icon name="check" size={13}/>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search workspaces…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>

          <div className="chip-row ws-env-chips">
            {[['all','All','sky'],['prod','PROD','emerald'],['uat','UAT','amber'],['dev','DEV','violet']].map(([k, label, tone]) => (
              <button key={k} className={'chip ws-env-chip ws-env-' + tone + (env === k ? ' active' : '')} onClick={() => setEnv(k)}>
                <span className={'ws-env-dot tone-' + tone + '-solid'}/>
                {label}<span className="count">{envCounts[k]}</span>
              </button>
            ))}
            <button className="chip"><Icon name="star" size={12}/>Starred</button>
          </div>
        </div>
      </div>

      <div className="lp-grid-3">
        {items.map((w, i) => (
          <div key={w.id} className={'fade-in d' + ((i % 5) + 1)}>
            <WorkspaceCardV2 ws={w} capacity={capacities.find(c => c.id === w.capacityId)} onClick={() => onOpen(w.id)}/>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="empty" style={{ padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No workspaces match.</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Loosen the capacity, environment, or search filter above.</div>
        </div>
      )}
    </>
  );
}

function HealthScoreCard({ health }) {
  const tone = health.score >= 75 ? 'emerald' : health.score >= 55 ? 'amber' : 'rose';
  return (
    <div className="lp-card lp-stat ws-health-card">
      <div className={'lp-stat-tile tone-' + tone}><Icon name="activity" size={20}/></div>
      <div className="lp-stat-body">
        <div className="lp-eyebrow">Health Score</div>
        <div className="lp-stat-value">{health.score}<span className="lp-stat-unit">/100</span></div>
        <div className="ws-health-sub">
          <span className="ws-health-pill" title={'FinOps weight ' + health.weights.finops + '%'}>
            <span className="ws-health-dot tone-sky-solid"/>FinOps <b className="mono">{health.finops}</b>
          </span>
          <span className="ws-health-pill" title={'Quality weight ' + health.weights.quality + '%'}>
            <span className="ws-health-dot tone-violet-solid"/>Quality <b className="mono">{health.quality}</b>
          </span>
          <span className="ws-health-pill" title={'Governance weight ' + health.weights.governance + '%'}>
            <span className="ws-health-dot tone-amber-solid"/>Gov <b className="mono">{health.governance}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function WorkspaceCardV2({ ws, capacity, onClick }) {
  return (
    <div className="ws-card" onClick={onClick}>
      <div className="ws-card-head">
        <div className="ws-card-icon" style={{
          background: `var(--modern-icon-bg-${ws.iconTone})`,
          color:      `var(--modern-icon-fg-${ws.iconTone})`,
        }}>
          <Icon name="folder" size={18}/>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ws-card-title">{ws.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
            <EnvBadge env={ws.env}/>
            {ws.health != null && (
              <span className="ws-card-sub mono" style={{ fontSize: 11 }}>health {ws.health}</span>
            )}
            {capacity && (
              <span className="badge badge-outline" style={{ fontSize: 9.5, height: 18, padding: '0 6px' }}>{capacity.sku}</span>
            )}
          </div>
        </div>
        <button className={'ws-card-star' + (ws.star ? ' on' : '')} onClick={e => e.stopPropagation()}>
          <Icon name="star" size={16}/>
        </button>
      </div>
      <div className="ws-card-stats">
        <div className="ws-card-stat"><div className="k">{ws.models}</div><div className="l">Models</div></div>
        <div className="ws-card-stat"><div className="k">{ws.reports}</div><div className="l">Reports</div></div>
        <div className="ws-card-stat">
          <div className="k mono">${ws.costPerMo >= 1000 ? (ws.costPerMo / 1000).toFixed(1) + 'k' : ws.costPerMo}</div>
          <div className="l">$/mo</div>
        </div>
      </div>
      <div className="ws-card-footer">
        <span>scanned {ws.scanned}</span>
        {ws.scanCta
          ? <span className="arr">Scan now <Icon name="zap" size={12}/></span>
          : <span className="arr">Open <Icon name="arrow-right" size={12}/></span>}
      </div>
    </div>
  );
}

export function WorkspaceDetail({ wsId, onOpenModel, onBack }) {
  const detail = DATA.workspaceDetail[wsId] || {
    name: DATA.workspaces.items.find(w => w.id === wsId)?.name || 'Workspace',
    env: DATA.workspaces.items.find(w => w.id === wsId)?.env || 'DEV',
    subtitle: 'This workspace has not been scanned yet.',
    models: [],
  };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <Icon name="chevron-right" size={14} strokeWidth={2.5}/> <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>—</span>
              <span style={{ transform: 'none' }}>Back to workspaces</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 className="lp-page-title" style={{ margin: 0 }}>{detail.name}</h1>
            <EnvBadge env={detail.env}/>
          </div>
          <p className="lp-page-sub">{detail.subtitle}</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Rescan workspace</button>
          <button className="btn btn-sm"><Icon name="external" size={14}/>Open in Fabric</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in d2">
        <StatCard label="Models"       value={detail.models.length}                    icon="database" tone="violet"/>
        <StatCard label="Scanned"      value={detail.models.filter(m => m.score).length} unit={'/' + detail.models.length} icon="shield-check" tone="emerald"/>
        <StatCard label="Avg Score"    value={(detail.models.filter(m => m.score).reduce((a, m) => a + m.score, 0) / Math.max(1, detail.models.filter(m => m.score).length)).toFixed(1)} unit="/10" icon="activity" tone="sky"/>
        <StatCard label="Measures"     value={detail.models.reduce((a, m) => a + m.measures, 0)} icon="bar-chart" tone="amber"/>
      </div>

      <div className="lp-section-head">
        <h2>Models <span className="count">{detail.models.length} total</span></h2>
        <div className="lp-search" style={{ width: 260 }}>
          <Icon name="search" size={14}/>
          <input placeholder="Search models…"/>
        </div>
      </div>

      <div className="lp-card lp-card-flush">
        <table className="lp-table">
          <thead>
            <tr>
              <th>Model</th>
              <th style={{ width: 100 }}>Tables</th>
              <th style={{ width: 110 }}>Measures</th>
              <th style={{ width: 140 }}>Quality</th>
              <th style={{ width: 140 }}>Last scanned</th>
              <th style={{ width: 120 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {detail.models.map(m => (
              <tr key={m.id} onClick={() => m.score && onOpenModel(wsId, m.id)}>
                <td>
                  <div className="name">
                    <span style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--modern-icon-bg-violet)', color: 'var(--modern-icon-fg-violet)', display: 'grid', placeItems: 'center' }}>
                      <Icon name="database" size={14}/>
                    </span>
                    {m.name}
                  </div>
                </td>
                <td className="num muted">{m.tables}</td>
                <td className="num muted">{m.measures}</td>
                <td>
                  {m.score
                    ? <ScoreBar score={m.score} tone={m.tone}/>
                    : <span className="muted" style={{ fontSize: 12 }}>—</span>}
                </td>
                <td className="muted num" style={{ fontSize: 12 }}>{m.scanned}</td>
                <td>
                  {m.score
                    ? <span className="btn btn-outline btn-sm">Open <Icon name="arrow-right" size={12}/></span>
                    : <span className="btn btn-sm"><Icon name="zap" size={12}/>Scan</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ScoreBar({ score, tone = 'emerald' }) {
  const color = {
    emerald: 'oklch(0.58 0.15 150)',
    amber:   'oklch(0.66 0.16 62)',
    rose:    'oklch(0.60 0.20 20)',
  }[tone] || 'oklch(0.58 0.15 150)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--muted)' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', borderRadius: 999, background: color }}/>
      </div>
      <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>{score.toFixed(1)}</span>
    </div>
  );
}
