import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { EnvBadge, Provenance, IssueCard, Badge } from './components';
import { ModelDiagram, ModelDocs, ModelAI, ModelHealth, ModelReports, ModelDataflows } from './ModelTabs';
import { ModelOwnership, RolePanel } from './Ownership';

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
          { k: 'ownership',  l: 'Ownership' },
          { k: 'measures',   l: 'Measures' },
          { k: 'lineage',    l: 'Lineage' },
          { k: 'diagram',    l: 'Diagram' },
          { k: 'docs',       l: 'Documentation' },
          { k: 'ai',         l: 'AI Analysis' },
          { k: 'health',     l: 'Health' },
          { k: 'reports',    l: 'Reports' },
          { k: 'dataflows',  l: 'Refresh Chain' },
        ].map(t => (
          <button key={t.k} className={'model-tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>
            {t.l}
          </button>
        ))}
      </div>

      <div key={tab} className="fade-in">
        {tab === 'overview' && <ModelOverview m={m} onGoToOwnership={() => setTab('ownership')}/>}
        {tab === 'measures' && <ModelMeasures/>}
        {tab === 'lineage' && <ModelLineage/>}
        {tab === 'diagram' && <ModelDiagram/>}
        {tab === 'docs' && <ModelDocs/>}
        {tab === 'ownership' && <ModelOwnership modelName={m.name} workspace={m.workspace}/>}
        {tab === 'ai' && <ModelAI/>}
        {tab === 'health' && <ModelHealth/>}
        {tab === 'reports' && <ModelReports/>}
        {tab === 'dataflows' && <ModelDataflows/>}
      </div>
    </>
  );
}

function ModelOverview({ m, onGoToOwnership }) {
  return (
    <>
      <RolePanel modelName={m.name} workspace={m.workspace} onEdit={onGoToOwnership}/>
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
  const measures = DATA.modelExtras.measures;
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [daxPanel, setDaxPanel] = React.useState(null);

  const filtered = measures.filter(m =>
    (filter === 'all' || (filter === 'used' ? m.used : !m.used)) &&
    (q === '' || m.name.toLowerCase().includes(q.toLowerCase()))
  );

  const selected = daxPanel ? measures.find(m => m.id === daxPanel) : null;

  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="lp-search" style={{ flex: 1, minWidth: 220 }}>
          <Icon name="search" size={14}/>
          <input placeholder="Search measures…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <span className="seg-tabs">
          {[['all','All · ' + measures.length], ['used','Used · ' + measures.filter(m => m.used).length], ['unused','Unused · ' + measures.filter(m => !m.used).length]].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </span>
        <span className="lp-eyebrow">{measures.filter(m => m.deps.length > 1).length} chained · {measures.filter(m => !m.used).length} orphans</span>
      </div>

      <div className="lp-grid-money" style={{ alignItems: 'start' }}>
        <div className="lp-card lp-card-flush">
          {filtered.map(m => (
            <button key={m.id} className={'measure-row' + (daxPanel === m.id ? ' active' : '') + (!m.used ? ' measure-unused' : '')}
              onClick={() => setDaxPanel(p => p === m.id ? null : m.id)}>
              <span className="measure-icon" style={{ background: m.used ? 'var(--modern-icon-bg-sky)' : 'var(--muted)', color: m.used ? 'var(--modern-icon-fg-sky)' : 'var(--muted-foreground)' }}>
                <Icon name="bar-chart" size={13}/>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="measure-name">{m.name}</div>
                <div className="measure-meta">
                  <span className="badge badge-outline" style={{ fontSize: 10 }}>{m.table}</span>
                  {m.deps.slice(0, 2).map(d => <span key={d} className="measure-dep mono">{d}</span>)}
                  {m.deps.length > 2 && <span className="measure-dep mono">+{m.deps.length - 2}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={'badge ' + (m.complexity === 'complex' ? 'tone-violet-soft' : m.complexity === 'medium' ? 'tone-sky-soft' : 'tone-slate-soft')} style={{ fontSize: 10 }}>{m.complexity}</span>
                {m.reports > 0
                  ? <span className="measure-reports"><Icon name="bar-chart" size={10}/>{m.reports}</span>
                  : <span className="muted" style={{ fontSize: 11 }}>unused</span>}
                <Icon name="chevron-right" size={12} style={{ color: 'var(--muted-foreground)', transform: daxPanel === m.id ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}/>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="empty">No measures match your search.</div>}
        </div>

        <div className="lp-card" style={{ position: 'sticky', top: 16 }}>
          {selected ? (
            <>
              <div className="lp-card-header">
                <div>
                  <div className="lp-card-title">{selected.name}</div>
                  <div className="lp-card-sub">{selected.table} · last used {selected.lastUsed}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={'badge ' + (selected.used ? 'tone-emerald-soft' : 'tone-rose-soft')}>{selected.used ? 'In use' : 'Unused'}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDaxPanel(null)}><Icon name="x" size={14}/></button>
                </div>
              </div>
              <div className="dax-editor">
                <div className="dax-toolbar">
                  <span className="lp-eyebrow">DAX Expression</span>
                  <button className="btn btn-ghost btn-sm"><Icon name="external" size={12}/>Copy</button>
                </div>
                <pre className="dax-code">{selected.dax}</pre>
              </div>
              <div style={{ marginTop: 14 }}>
                <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Dependencies</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.deps.map(d => (
                    <span key={d} className="badge badge-outline mono" style={{ fontSize: 11 }}>{d}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{selected.reports}</div>
                  <div className="lp-eyebrow">reports</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{selected.deps.length}</div>
                  <div className="lp-eyebrow">dependencies</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{selected.complexity}</div>
                  <div className="lp-eyebrow">complexity</div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              <Icon name="bar-chart" size={28}/>
              <div style={{ marginTop: 10, fontSize: 14 }}>Select a measure to inspect its DAX expression and dependencies</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const ML_LAYER_COLORS = {
  Source: 'oklch(0.55 0.05 250)',
  Lakehouse: 'oklch(0.62 0.16 237)',
  Warehouse: 'oklch(0.58 0.16 275)',
  Notebook: 'oklch(0.58 0.18 290)',
  Pipeline: 'oklch(0.58 0.14 150)',
  Semantic: 'oklch(0.66 0.16 75)',
  Report: 'oklch(0.62 0.16 25)',
  App: 'oklch(0.55 0.05 250)',
};

function ModelLineage() {
  const l = DATA.lineage;
  const [selected, setSelected] = React.useState('sm-1');
  const [viewAll, setViewAll] = React.useState(false);

  const upstream = new Set(), downstream = new Set();
  const collect = (id, set, dir) => {
    l.edges.forEach(([a, b]) => {
      if (dir === 'up' && b === id && !set.has(a)) { set.add(a); collect(a, set, 'up'); }
      if (dir === 'down' && a === id && !set.has(b)) { set.add(b); collect(b, set, 'down'); }
    });
  };
  collect(selected, upstream, 'up');
  collect(selected, downstream, 'down');

  const sm1Up = new Set(), sm1Down = new Set();
  const collectSm1 = (id, set, dir) => {
    l.edges.forEach(([a, b]) => {
      if (dir === 'up' && b === id && !set.has(a)) { set.add(a); collectSm1(a, set, 'up'); }
      if (dir === 'down' && a === id && !set.has(b)) { set.add(b); collectSm1(b, set, 'down'); }
    });
  };
  collectSm1('sm-1', sm1Up, 'up');
  collectSm1('sm-1', sm1Down, 'down');
  const connectedIds = new Set(['sm-1', ...sm1Up, ...sm1Down]);

  const visibleNodes = viewAll ? l.nodes : l.nodes.filter(n => connectedIds.has(n.id));
  const visibleIds = new Set(visibleNodes.map(n => n.id));

  const isHighlit = (id) => id === selected || upstream.has(id) || downstream.has(id);
  const edgeHighlit = ([a, b]) =>
    (upstream.has(a) || a === selected) && (downstream.has(b) || b === selected) ||
    (a === selected) || (b === selected);

  const sel = l.nodes.find(n => n.id === selected);
  const W = 1140, H = 440;

  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>E2E Lineage — Sales Analytics</div>
          <div className="lp-page-sub" style={{ margin: '3px 0 0' }}>
            Source → Storage → Process → Model → Reports → Apps · click any node to trace upstream and downstream
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className={'btn btn-outline btn-sm' + (viewAll ? '' : '')} onClick={() => setViewAll(v => !v)}>
            <Icon name="boxes" size={12}/>{viewAll ? 'Connected only' : 'Show all'}
          </button>
        </div>
      </div>

      <div className="lp-card lineage-card fade-in">
        <div className="lineage-legend">
          {Object.entries(ML_LAYER_COLORS).map(([k, c]) => (
            <span key={k} className="ln-leg"><span className="ln-leg-dot" style={{ background: c }}/>{k}</span>
          ))}
        </div>
        <div className="lineage-canvas">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="ml-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="oklch(0.65 0.06 250)"/>
              </marker>
              <marker id="ml-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="oklch(0.55 0.18 237)"/>
              </marker>
            </defs>
            {[0,1,2,3,4,5].map(layer => (
              <text key={layer} x={[80,280,460,640,820,1000][layer]} y={26} fontSize="10" textAnchor="middle"
                fontFamily="JetBrains Mono" fill="oklch(0.55 0.03 250)" letterSpacing="0.08em">
                {['SOURCE','STORAGE','PROCESS','MODEL','REPORT','APP'][layer]}
              </text>
            ))}
            {l.edges.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b)).map(([a, b], i) => {
              const A = l.nodes.find(n => n.id === a), B = l.nodes.find(n => n.id === b);
              if (!A || !B) return null;
              const hot = edgeHighlit([a, b]);
              const mid = (A.x + B.x) / 2;
              return (
                <path key={i}
                  d={`M ${A.x+70} ${A.y} C ${mid} ${A.y}, ${mid} ${B.y}, ${B.x-70} ${B.y}`}
                  stroke={hot ? 'oklch(0.55 0.18 237)' : 'oklch(0.85 0.02 250)'}
                  strokeWidth={hot ? 2 : 1.2}
                  fill="none"
                  markerEnd={hot ? 'url(#ml-arrow-hot)' : 'url(#ml-arrow)'}
                  opacity={hot ? 1 : 0.6}
                />
              );
            })}
            {visibleNodes.map(n => {
              const stale = n.status === 'sleeper' || n.status === 'orphan' || n.status === 'dormant';
              const isSel = n.id === selected;
              const lit = isHighlit(n.id);
              const dimmed = !lit;
              return (
                <g key={n.id} onClick={() => setSelected(s => s === n.id ? 'sm-1' : n.id)} style={{ cursor: 'pointer' }}>
                  <rect x={n.x-70} y={n.y-22} width="140" height="44" rx="8"
                    fill={lit ? 'var(--card)' : 'oklch(0.97 0.005 250)'}
                    stroke={isSel ? ML_LAYER_COLORS[n.type] : (stale ? 'oklch(0.66 0.16 55)' : 'oklch(0.88 0.02 250)')}
                    strokeWidth={isSel ? 2.5 : 1}
                    strokeDasharray={stale ? '3 3' : 'none'}
                    opacity={dimmed ? 0.35 : 1}
                    style={{ transition: 'all 180ms ease' }}
                    filter={isSel ? 'drop-shadow(0 2px 8px oklch(0.66 0.16 75 / 0.3))' : undefined}
                  />
                  <circle cx={n.x-56} cy={n.y-6} r="4" fill={ML_LAYER_COLORS[n.type]} opacity={dimmed ? 0.35 : 1}/>
                  <text x={n.x-46} y={n.y-2} fontSize="10" fontFamily="DM Sans" fontWeight="600" fill="var(--foreground)" opacity={dimmed ? 0.35 : 1}>
                    {n.label.length > 16 ? n.label.slice(0,16)+'…' : n.label}
                  </text>
                  <text x={n.x-46} y={n.y+12} fontSize="9" fontFamily="JetBrains Mono" fill="oklch(0.50 0.03 250)" opacity={dimmed ? 0.25 : 1}>
                    {n.cost > 0 ? '€'+n.cost+'/mo · ' : ''}{n.lastSeen}
                  </text>
                  {stale && <circle cx={n.x+60} cy={n.y-14} r="4" fill="oklch(0.66 0.16 55)"/>}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {sel && (
        <div className="lp-card fade-in d2" style={{ marginTop: 14 }}>
          <div className="lp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: ML_LAYER_COLORS[sel.type] + '20', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: ML_LAYER_COLORS[sel.type], display: 'block' }}/>
              </div>
              <div>
                <div className="lp-card-title">{sel.label}</div>
                <div className="lp-card-sub">{sel.kind} · {sel.type} layer · last seen {sel.lastSeen}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(sel.status === 'sleeper' || sel.status === 'orphan' || sel.status === 'dormant') && <span className="badge tone-amber-soft">Sleeper</span>}
              <span className="badge badge-outline">{sel.type}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--border)', marginBottom: 16 }}>
            {[
              { l: 'Upstream', v: upstream.size },
              { l: 'Downstream', v: downstream.size },
              { l: '/mo cost', v: sel.cost > 0 ? '€'+sel.cost : '—', rose: sel.cost > 0 && (sel.status === 'sleeper' || sel.status === 'orphan') },
            ].map((s, i) => (
              <div key={s.l} style={{ textAlign: 'center', padding: '14px 0', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div className={'mono ' + (s.rose ? 'val-rose' : '')} style={{ fontSize: 22, fontWeight: 700 }}>{s.v}</div>
                <div className="lp-eyebrow" style={{ marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Upstream <span className="mono muted">({upstream.size})</span></div>
              {upstream.size === 0
                ? <div className="muted" style={{ fontSize: 12 }}>Source node — no upstream dependencies.</div>
                : Array.from(upstream).map(id => {
                    const n = l.nodes.find(x => x.id === id);
                    return (
                      <button key={id} className="trace-row" onClick={() => setSelected(id)}>
                        <span className="trace-dot" style={{ background: ML_LAYER_COLORS[n.type] }}/>
                        <span className="trace-name">{n.label}</span>
                        <span className="badge badge-outline" style={{ fontSize: 10 }}>{n.type}</span>
                        <span className="muted mono" style={{ fontSize: 10 }}>{n.lastSeen}</span>
                      </button>
                    );
                  })
              }
            </div>
            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Downstream <span className="mono muted">({downstream.size})</span></div>
              {downstream.size === 0
                ? <div className="muted" style={{ fontSize: 12 }}>Leaf node — no downstream consumers.</div>
                : Array.from(downstream).map(id => {
                    const n = l.nodes.find(x => x.id === id);
                    return (
                      <button key={id} className="trace-row" onClick={() => setSelected(id)}>
                        <span className="trace-dot" style={{ background: ML_LAYER_COLORS[n.type] }}/>
                        <span className="trace-name">{n.label}</span>
                        <span className="badge badge-outline" style={{ fontSize: 10 }}>{n.type}</span>
                        <span className="muted mono" style={{ fontSize: 10 }}>{n.lastSeen}</span>
                      </button>
                    );
                  })
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
