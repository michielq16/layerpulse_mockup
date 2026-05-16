import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, EnvBadge } from './components';
import { WorkspaceCard } from './Overview';

export function Workspaces({ onOpen }) {
  const [q, setQ] = React.useState('');
  const [env, setEnv] = React.useState('all');
  const items = DATA.workspaces.items.filter(w =>
    (env === 'all' || w.env.toLowerCase() === env) &&
    (q === '' || w.name.toLowerCase().includes(q.toLowerCase()))
  );
  const c = DATA.workspaces.counts;

  const envCounts = {
    all: DATA.workspaces.items.length,
    prod: DATA.workspaces.items.filter(w => w.env === 'PROD').length,
    uat:  DATA.workspaces.items.filter(w => w.env === 'UAT').length,
    dev:  DATA.workspaces.items.filter(w => w.env === 'DEV').length,
  };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Workspaces</h1>
          <p className="lp-page-sub">Every workspace visible to the service principal. Click to inspect models.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Sync workspaces</button>
          <button className="btn btn-sm"><Icon name="plus" size={14}/>Connect capacity</button>
        </div>
      </div>

      <div className="lp-grid-4">
        <StatCard label="Workspaces"  value={c.workspaces} icon="folders"  tone="sky"/>
        <StatCard label="Models"      value={c.models}     icon="database" tone="violet"/>
        <StatCard label="Tables"      value={c.tables}     icon="layers"   tone="emerald"/>
        <StatCard label="Measures"    value={c.measures}   icon="bar-chart" tone="amber"/>
      </div>

      <div className="lp-section-head">
        <h2>Browse <span className="count">{items.length} matches</span></h2>
      </div>

      <div className="lp-card lp-card-flush" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search workspaces…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <div className="chip-row">
            {['all','prod','uat','dev'].map(k => (
              <button key={k} className={'chip' + (env === k ? ' active' : '')} onClick={() => setEnv(k)}>
                {k === 'all' ? 'All' : k.toUpperCase()}
                <span className="count">{envCounts[k]}</span>
              </button>
            ))}
            <button className="chip"><Icon name="star" size={12}/>Starred</button>
          </div>
        </div>
      </div>

      <div className="lp-grid-3">
        {items.map((w, i) => (
          <div key={w.id} className={'fade-in d' + ((i % 5) + 1)}>
            <WorkspaceCard ws={w} onClick={() => onOpen(w.id)}/>
          </div>
        ))}
      </div>

      {items.length === 0 && <div className="empty">No workspaces match "{q}".</div>}
    </>
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
