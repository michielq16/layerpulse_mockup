import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { EnvBadge, Provenance, IssueCard, Badge } from './components';
import { ModelDiagram, ModelDocs, ModelAI, ModelHealth, ModelReports } from './ModelTabs';

export function ModelView({ wsId, modelId, onBack }) {
  const [tab, setTab] = React.useState('overview');
  const m = DATA.model[modelId] || {
    name: 'Model', workspace: wsId, env: 'PROD', scannedAgo: '—',
    score: 7.0, tier: 'Gold', weakest: { dim: '—', val: 0 },
    stats: { tables: 0, columns: 0, measures: 0, relationships: 0, reports: 0 },
    breakdown: [], scoreTrend: [], tables: [], actions: { warning: 0, info: 0 },
  };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 className="lp-page-title" style={{ margin: 0 }}>{m.name}</h1>
            <EnvBadge env={m.env}/>
            <Provenance level="platinum"/>
          </div>
          <p className="lp-page-sub">Scanned {m.scannedAgo} · Workspace {m.workspace}</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>Back</button>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Re-scan</button>
          <button className="btn btn-sm"><Icon name="file-text" size={14}/>Generate doc</button>
        </div>
      </div>

      <div className="model-tabs">
        {[
          { k: 'overview',   l: 'Overview' },
          { k: 'measures',   l: 'Measures' },
          { k: 'lineage',    l: 'Lineage' },
          { k: 'diagram',    l: 'Diagram' },
          { k: 'docs',       l: 'Documentation' },
          { k: 'ai',         l: 'AI Analysis' },
          { k: 'health',     l: 'Health' },
          { k: 'reports',    l: 'Reports' },
        ].map(t => (
          <button key={t.k} className={'model-tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>
            {t.l}
          </button>
        ))}
      </div>

      <div key={tab} className="fade-in">
        {tab === 'overview' && <ModelOverview m={m}/>}
        {tab === 'measures' && <ModelMeasures/>}
        {tab === 'lineage' && <ModelLineage/>}
        {tab === 'diagram' && <ModelDiagram/>}
        {tab === 'docs' && <ModelDocs/>}
        {tab === 'ai' && <ModelAI/>}
        {tab === 'health' && <ModelHealth/>}
        {tab === 'reports' && <ModelReports/>}
      </div>
    </>
  );
}

function ModelOverview({ m }) {
  return (
    <>
      <div className="lp-grid-money">
        <div className="lp-card fade-in">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Quality score</div>
              <div className="lp-card-sub">{m.tier} tier · weakest: {m.weakest.dim} ({m.weakest.val.toFixed(1)}/10)</div>
            </div>
            <span className="provenance" style={{ background: 'oklch(0.93 0.06 145)', color: 'oklch(0.38 0.14 145)' }}>
              <Icon name="shield-check" size={11}/>{m.tier}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, color: 'oklch(0.40 0.14 145)' }}>
                {m.score.toFixed(1)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6 }}>/ 10 · trending ▲ 0.2</div>
            </div>
            <div style={{ flex: 1 }}>
              {m.breakdown.map(b => (
                <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 36px', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 12 }}>
                  <div>{b.label}</div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--muted)' }}>
                    <div style={{ width: (b.val * 10) + '%', height: '100%', borderRadius: 999, background: b.val < 7 ? 'oklch(0.65 0.18 45)' : 'oklch(0.58 0.15 150)' }}/>
                  </div>
                  <div className="num" style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{b.val.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lp-card fade-in d2">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Model surface</div>
              <div className="lp-card-sub">What makes up this semantic model</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { l: 'Tables', v: m.stats.tables, tone: 'sky' },
              { l: 'Columns', v: m.stats.columns, tone: 'violet' },
              { l: 'Measures', v: m.stats.measures, tone: 'amber' },
              { l: 'Relations', v: m.stats.relationships, tone: 'emerald' },
              { l: 'Reports', v: m.stats.reports, tone: 'rose' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center', padding: '8px 0', borderRight: '1px solid var(--border)' }}>
                <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>{s.v}</div>
                <div className="lp-eyebrow" style={{ marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: 12, borderRadius: 8, background: 'var(--muted)', fontSize: 12, color: 'var(--muted-foreground)' }}>
            <b style={{ color: 'var(--foreground)' }}>No changes</b> detected since last scan — model is stable.
          </div>
        </div>
      </div>

      <div className="lp-section-head"><h2>Action center <span className="count">{m.actions.warning + m.actions.info} open</span></h2></div>
      <div className="lp-grid-2">
        <IssueCard id="BPA-014" severity="warning" category="DAX" title={<>3 measures use <code>FILTER(ALL())</code> unnecessarily</>} evidence="Can be rewritten with KEEPFILTERS for 22% perf" impact="Est. 22% refresh gain" impactTone="warning"/>
        <IssueCard id="BPA-021" severity="warning" category="Naming" title="5 columns break naming convention" evidence="Expected PascalCase · found snake_case" impact="Discoverability −0.8" impactTone="warning"/>
        <IssueCard id="BPA-005" severity="info" category="Hygiene" title="2 hidden tables still referenced by measures" evidence="Consider unhiding or pruning" impact="Cleanup opportunity" impactTone="info"/>
        <IssueCard id="BPA-030" severity="info" category="Perf" title={<>Dual-mode on <code>DimDate</code></>} evidence="Already optimal" impact="No action needed" impactTone="good"/>
      </div>

      <div className="lp-section-head"><h2>Tables <span className="count">{m.stats.tables} tables</span></h2></div>
      <div className="lp-card lp-card-flush">
        <table className="lp-table">
          <thead>
            <tr><th>Name</th><th style={{ width: 100 }}>Columns</th><th style={{ width: 100 }}>Relationship</th><th style={{ width: 60 }}></th></tr>
          </thead>
          <tbody>
            {m.tables.flatMap(g => g.rows.map(r => (
              <tr key={r.name}>
                <td><div className="name"><span style={{ width: 22, height: 22, borderRadius: 5, background: g.group === 'Fact' ? 'oklch(0.92 0.04 255)' : 'var(--modern-icon-bg-emerald)', color: g.group === 'Fact' ? 'oklch(0.45 0.12 255)' : 'var(--modern-icon-fg-emerald)', display: 'grid', placeItems: 'center' }}><Icon name="database" size={12}/></span>{r.name}<span className="badge badge-outline" style={{ height: 18, fontSize: 10 }}>{g.group}</span></div></td>
                <td className="num muted">{r.cols}</td>
                <td><span className="badge badge-outline">— {r.rel}</span></td>
                <td className="row-arrow"><Icon name="arrow-right" size={14}/></td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ModelMeasures() {
  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <span className="seg-tabs"><button className="seg-tab active">Dependencies</button><button className="seg-tab">Lineage</button></span>
        <span className="lp-eyebrow" style={{ marginLeft: 'auto' }}>41 connected · 6 orphans · 34 edges</span>
      </div>
      <div className="lp-card" style={{ padding: 0 }}>
        <div className="lineage-pane">
          <LineagePreview/>
        </div>
      </div>
    </>
  );
}

function ModelLineage() {
  return (
    <div className="lp-card">
      <div className="lp-card-header">
        <div><div className="lp-card-title">Lineage graph</div><div className="lp-card-sub">Source → table → measure → report</div></div>
        <span className="lp-eyebrow">React Flow · interactive</span>
      </div>
      <div className="lineage-pane"><LineagePreview/></div>
    </div>
  );
}

function LineagePreview() {
  const nodes = [
    { id: 1, t: 'fact',    x: 14, y: 22, label: 'FactSales',      icon: 'database' },
    { id: 2, t: 'dim',     x: 14, y: 48, label: 'DimProduct',     icon: 'database' },
    { id: 3, t: 'dim',     x: 14, y: 74, label: 'DimDate',        icon: 'calendar' },
    { id: 4, t: 'measure', x: 48, y: 22, label: 'Total Sales',    icon: 'bar-chart' },
    { id: 5, t: 'measure', x: 48, y: 44, label: 'YTD Revenue',    icon: 'bar-chart' },
    { id: 6, t: 'measure', x: 48, y: 66, label: 'Gross Margin',   icon: 'bar-chart' },
    { id: 7, t: 'measure', x: 82, y: 34, label: 'Sales Growth %', icon: 'trend-up' },
    { id: 8, t: 'measure', x: 82, y: 60, label: 'KPI Card Total', icon: 'zap' },
  ];
  const edges = [ [1,4],[1,5],[1,6],[2,4],[2,6],[3,5],[4,7],[5,7],[6,8],[4,8] ];
  const posById = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {edges.map(([a, b], i) => {
          const A = posById[a], B = posById[b];
          return <path key={i} d={`M ${A.x}% ${A.y}% C ${(A.x + B.x) / 2}% ${A.y}%, ${(A.x + B.x) / 2}% ${B.y}%, ${B.x}% ${B.y}%`} stroke="oklch(0.72 0.02 250)" strokeWidth="1.3" fill="none"/>;
        })}
      </svg>
      {nodes.map(n => (
        <div key={n.id} className={'ln-node ' + n.t} style={{ left: n.x + '%', top: n.y + '%', transform: 'translate(-50%, -50%)' }}>
          <div className="ln-icon"><Icon name={n.icon} size={12}/></div>
          {n.label}
        </div>
      ))}
    </>
  );
}
