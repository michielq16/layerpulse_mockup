import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Badge } from './components';
import { Avatar } from './UserIntel';

export function LineageExplorer() {
  const l = DATA.lineage;
  const [selected, setSelected] = React.useState('sm-1');
  const [filter, setFilter] = React.useState('all');

  const upstream = new Set(), downstream = new Set();
  const collect = (id, set, dir) => {
    l.edges.forEach(([a, b]) => {
      if (dir === 'up' && b === id && !set.has(a)) { set.add(a); collect(a, set, 'up'); }
      if (dir === 'down' && a === id && !set.has(b)) { set.add(b); collect(b, set, 'down'); }
    });
  };
  collect(selected, upstream, 'up');
  collect(selected, downstream, 'down');

  const isHighlit = (id) => id === selected || upstream.has(id) || downstream.has(id);
  const edgeHighlit = ([a, b]) =>
    (a === selected || upstream.has(a)) && (b === selected || downstream.has(b) || b === selected) ||
    (b === selected) || (a === selected && downstream.has(b));

  const visibleNodes = filter === 'all' ? l.nodes : l.nodes.filter(n => filter === 'sleeper' ? (n.status === 'sleeper' || n.status === 'orphan' || n.status === 'dormant') : n.type === filter);
  const visibleIds = new Set(visibleNodes.map(n => n.id));

  const sel = l.nodes.find(n => n.id === selected);
  const W = 1140, H = 440;

  const layerColors = {
    Source: 'oklch(0.55 0.05 250)',
    Lakehouse: 'oklch(0.62 0.16 237)',
    Warehouse: 'oklch(0.58 0.16 275)',
    Notebook: 'oklch(0.58 0.18 290)',
    Pipeline: 'oklch(0.58 0.14 150)',
    Semantic: 'oklch(0.66 0.16 75)',
    Report: 'oklch(0.62 0.16 25)',
    App: 'oklch(0.55 0.05 250)',
  };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Lineage Explorer</h1>
          <p className="lp-page-sub">Cross-workload data graph — sources → lakehouses → notebooks → semantic models → reports → apps. Click any node to trace its upstream sources and downstream consumers.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Export PNG</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Tracked artifacts" value={l.totalItems} sub={l.newCategories + ' workload types'} icon="boxes" tone="violet"/>
        <StatCard label="Sleepers / orphans" value={l.sleeperItems} sub="last seen > 30 d" icon="moon" tone="amber"/>
        <StatCard label="Pipeline depth" value="6" unit=" hops" sub="source → app" icon="git-branch" tone="sky"/>
        <StatCard label="Sleeper cost" value="€552" delta={-100} sub="reclaimable / month" icon="dollar" tone="emerald"/>
      </div>

      <div className="lp-section-head">
        <h2>Cross-workload graph <span className="count">{visibleNodes.length} of {l.nodes.length} visible</span></h2>
        <div className="chip-row">
          {[
            ['all', 'All'],
            ['Source', 'Sources'],
            ['Lakehouse', 'Lakehouse / WH'],
            ['Notebook', 'Notebooks'],
            ['Semantic', 'Models'],
            ['Report', 'Reports'],
            ['App', 'Apps'],
            ['sleeper', 'Sleepers'],
          ].map(([k, lbl]) => (
            <button key={k} className={'chip' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{lbl}</button>
          ))}
        </div>
      </div>

      <div className="lp-card lineage-card fade-in d2">
        <div className="lineage-legend">
          {Object.entries(layerColors).map(([k, c]) => (
            <span key={k} className="ln-leg"><span className="ln-leg-dot" style={{ background: c }}/>{k}</span>
          ))}
        </div>
        <div className="lineage-canvas">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="ln-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="oklch(0.65 0.06 250)"/>
              </marker>
              <marker id="ln-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="oklch(0.55 0.18 237)"/>
              </marker>
            </defs>
            {[0, 1, 2, 3, 4, 5].map(layer => (
              <text key={layer} x={[80, 280, 460, 640, 820, 1000][layer]} y={26} fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono"
                fill="oklch(0.55 0.03 250)" letterSpacing="0.08em">
                {['SOURCE', 'STORAGE', 'PROCESS', 'MODEL', 'REPORT', 'APP'][layer]}
              </text>
            ))}
            {l.edges.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b)).map(([a, b], i) => {
              const A = l.nodes.find(n => n.id === a), B = l.nodes.find(n => n.id === b);
              const hot = edgeHighlit([a, b]);
              const mid = (A.x + B.x) / 2;
              return (
                <path key={i}
                  d={`M ${A.x + 70} ${A.y} C ${mid} ${A.y}, ${mid} ${B.y}, ${B.x - 70} ${B.y}`}
                  stroke={hot ? 'oklch(0.55 0.18 237)' : 'oklch(0.85 0.02 250)'}
                  strokeWidth={hot ? 2 : 1.2}
                  fill="none"
                  markerEnd={hot ? 'url(#ln-arrow-hot)' : 'url(#ln-arrow)'}
                  opacity={hot ? 1 : 0.7}
                />
              );
            })}
            {visibleNodes.map(n => {
              const stale = n.status === 'sleeper' || n.status === 'orphan' || n.status === 'dormant';
              const isSel = n.id === selected;
              const lit = isHighlit(n.id);
              return (
                <g key={n.id} onClick={() => setSelected(n.id)} style={{ cursor: 'pointer' }}>
                  <rect x={n.x - 70} y={n.y - 22} width="140" height="44" rx="8"
                    fill={lit ? 'oklch(1 0 0)' : 'oklch(0.97 0.005 250)'}
                    stroke={isSel ? layerColors[n.type] : (stale ? 'oklch(0.66 0.16 55)' : 'oklch(0.88 0.02 250)')}
                    strokeWidth={isSel ? 2.5 : 1}
                    strokeDasharray={stale ? '3 3' : 'none'}
                    style={{ transition: 'all 200ms ease' }}
                  />
                  <circle cx={n.x - 56} cy={n.y - 6} r="4" fill={layerColors[n.type]}/>
                  <text x={n.x - 46} y={n.y - 2} fontSize="10" fontFamily="DM Sans" fontWeight="600" fill="var(--foreground)">
                    {n.label.length > 16 ? n.label.slice(0, 16) + '…' : n.label}
                  </text>
                  <text x={n.x - 46} y={n.y + 12} fontSize="9" fontFamily="JetBrains Mono" fill="oklch(0.50 0.03 250)">
                    {n.cost > 0 ? '€' + n.cost + '/mo · ' : ''}{n.lastSeen}
                  </text>
                  {stale && <circle cx={n.x + 60} cy={n.y - 14} r="4" fill="oklch(0.66 0.16 55)"/>}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {sel && (
        <div className="lp-grid-money fade-in d3">
          <div className="lp-card">
            <div className="lp-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: layerColors[sel.type] + '20', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: layerColors[sel.type], display: 'block' }}/>
                </div>
                <div>
                  <div className="lp-card-title">{sel.label}</div>
                  <div className="lp-card-sub">{sel.kind} · last seen {sel.lastSeen}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {(sel.status === 'sleeper' || sel.status === 'orphan' || sel.status === 'dormant') && <span className="badge tone-amber-soft">Sleeper</span>}
                <span className="badge badge-outline">{sel.type}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{upstream.size}</div>
                <div className="lp-eyebrow">upstream</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{downstream.size}</div>
                <div className="lp-eyebrow">downstream</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className={'mono ' + (sel.cost > 0 ? (sel.status === 'sleeper' || sel.status === 'orphan' ? 'val-rose' : '') : '')} style={{ fontSize: 20, fontWeight: 700 }}>
                  {sel.cost > 0 ? '€' + sel.cost : '—'}
                </div>
                <div className="lp-eyebrow">/mo</div>
              </div>
            </div>

            <div className="trace-section">
              <div className="lp-eyebrow">Upstream sources <span className="mono muted"> · {upstream.size}</span></div>
              {upstream.size === 0 && <div className="muted" style={{ fontSize: 12, padding: '6px 0' }}>Source node — no upstream dependencies.</div>}
              {Array.from(upstream).map(id => {
                const n = l.nodes.find(x => x.id === id);
                return (
                  <button key={id} className="trace-row" onClick={() => setSelected(id)}>
                    <span className="trace-dot" style={{ background: layerColors[n.type] }}/>
                    <span className="trace-name">{n.label}</span>
                    <span className="badge badge-outline">{n.type}</span>
                    <span className="muted mono">{n.lastSeen}</span>
                  </button>
                );
              })}
            </div>
            <div className="trace-section">
              <div className="lp-eyebrow">Downstream consumers <span className="mono muted"> · {downstream.size}</span></div>
              {downstream.size === 0 && <div className="muted" style={{ fontSize: 12, padding: '6px 0' }}>Leaf node — no downstream consumers.</div>}
              {Array.from(downstream).map(id => {
                const n = l.nodes.find(x => x.id === id);
                return (
                  <button key={id} className="trace-row" onClick={() => setSelected(id)}>
                    <span className="trace-dot" style={{ background: layerColors[n.type] }}/>
                    <span className="trace-name">{n.label}</span>
                    <span className="badge badge-outline">{n.type}</span>
                    <span className="muted mono">{n.lastSeen}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Open in Fabric</button>
              {(sel.status === 'sleeper' || sel.status === 'orphan') && <button className="btn btn-sm btn-danger">Archive</button>}
            </div>
          </div>
          <div className="lp-card">
            <div className="lp-card-header">
              <div>
                <div className="lp-card-title">Impact analysis</div>
                <div className="lp-card-sub">If you change or remove this artifact…</div>
              </div>
            </div>
            <div className="impact-list">
              {sel.status === 'sleeper' || sel.status === 'orphan' ? (
                <div className="impact-card impact-warn">
                  <Icon name="alert" size={14}/>
                  <div>
                    <b>Safe to archive.</b> {downstream.size === 0 ? 'No downstream consumers detected in the last 30 days.' : 'All downstream consumers are also sleeping.'}
                    {sel.cost > 0 && <> Saves <b className="mono">€{sel.cost}/mo</b>.</>}
                  </div>
                </div>
              ) : downstream.size > 0 ? (
                <div className="impact-card impact-info">
                  <Icon name="info" size={14}/>
                  <div>
                    <b>{downstream.size} downstream consumers</b> would be affected. Includes {Array.from(downstream).slice(0, 2).map(id => l.nodes.find(n => n.id === id).label).join(', ')}{downstream.size > 2 ? ` +${downstream.size - 2} more` : ''}.
                  </div>
                </div>
              ) : (
                <div className="impact-card impact-good">
                  <Icon name="check" size={14}/>
                  <div><b>Leaf node.</b> No downstream consumers — safe to modify in place.</div>
                </div>
              )}
              <div className="impact-card impact-info">
                <Icon name="git-branch" size={14}/>
                <div><b>Trace depth:</b> {upstream.size} hops upstream, {downstream.size} hops downstream.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Access() {
  const [tab, setTab] = React.useState('groups');
  const a = DATA.access;
  const riskTone = { high: 'rose', med: 'amber', low: 'emerald' };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Access</h1>
          <p className="lp-page-sub">AAD security groups, workspace role assignments, and stale permissions — joined to 30-day activity to surface privileged access that isn't being used.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={12}/>Re-sync Graph</button>
          <button className="btn btn-sm"><Icon name="external" size={12}/>SOC2 evidence pack</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="AAD groups synced"     value={a.groupsTotal} icon="users" tone="sky"/>
        <StatCard label="Workspace assignments" value={a.assignmentsTotal} icon="shield" tone="violet"/>
        <StatCard label="Privileged Admin role" value={a.privilegedCount} sub="across all workspaces" icon="alert" tone="rose"/>
        <StatCard label="Stale assignments"     value={a.staleAssignments} sub="unused 60d+" icon="moon" tone="amber"/>
      </div>

      <div className="lp-section-head">
        <h2>{tab === 'groups' ? 'Security groups' : 'Role assignments'}</h2>
        <span className="seg-tabs">
          <button className={'seg-tab' + (tab === 'groups' ? ' active' : '')} onClick={() => setTab('groups')}>Groups · {a.groups.length}</button>
          <button className={'seg-tab' + (tab === 'roles' ? ' active' : '')} onClick={() => setTab('roles')}>Assignments · {a.assignments.length}</button>
        </span>
      </div>

      {tab === 'groups' && (
        <div className="lp-card lp-card-flush fade-in">
          <div className="reclaim-head" style={{ gridTemplateColumns: 'minmax(180px,2fr) 110px 110px 110px 110px 90px 110px' }}>
            <div>Group</div>
            <div>Role</div>
            <div>Members</div>
            <div>Inactive 30d</div>
            <div>Workspaces</div>
            <div>Risk</div>
            <div>Updated</div>
          </div>
          {a.groups.map(g => (
            <div key={g.name} className={'reclaim-row' + (g.stale ? ' is-stale' : '')} style={{ gridTemplateColumns: 'minmax(180px,2fr) 110px 110px 110px 110px 90px 110px' }}>
              <div className="audit-user">
                <span className="grp-mark"><Icon name="users" size={11}/></span>
                <span>
                  {g.name}
                  {g.stale && <span className="pill-stale">STALE</span>}
                </span>
              </div>
              <div><span className={'badge ' + (g.role === 'Admin' ? 'tone-rose-soft' : g.role === 'Member' ? 'tone-amber-soft' : 'tone-slate-soft')}>{g.role}</span></div>
              <div className="mono">{g.members}</div>
              <div className={'mono ' + (g.inactive > g.members * 0.3 ? 'val-rose' : g.inactive > 0 ? 'val-amber' : '')}>{g.inactive}</div>
              <div className="mono">{g.workspaces}</div>
              <div><span className={'badge tone-' + riskTone[g.risk] + '-soft'}>{g.risk.toUpperCase()}</span></div>
              <div className="muted mono" style={{ fontSize: 11 }}>{g.updated}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'roles' && (
        <div className="lp-card lp-card-flush fade-in">
          <div className="reclaim-head" style={{ gridTemplateColumns: 'minmax(160px,1.4fr) minmax(160px,1.4fr) 110px 110px 90px 110px 90px' }}>
            <div>Workspace</div>
            <div>Principal</div>
            <div>Type</div>
            <div>Role</div>
            <div>Members</div>
            <div>Last used</div>
            <div>Risk</div>
          </div>
          {a.assignments.map((r, i) => (
            <div key={i} className={'reclaim-row' + (r.stale ? ' is-stale' : '')} style={{ gridTemplateColumns: 'minmax(160px,1.4fr) minmax(160px,1.4fr) 110px 110px 90px 110px 90px' }}>
              <div><Icon name="folder" size={11}/> <span style={{ marginLeft: 4 }}>{r.workspace}</span></div>
              <div className="audit-user">
                {r.kind === 'ServicePrincipal'
                  ? <span className="svc-badge"><Icon name="bot" size={10}/></span>
                  : r.kind === 'Group'
                    ? <span className="grp-mark"><Icon name="users" size={11}/></span>
                    : <Avatar name={r.principal} size={22}/>}
                <span>{r.principal}{r.stale && <span className="pill-stale">STALE</span>}</span>
              </div>
              <div><span className="badge badge-outline">{r.kind}</span></div>
              <div><span className={'badge ' + (r.role === 'Admin' ? 'tone-rose-soft' : r.role === 'Member' ? 'tone-amber-soft' : 'tone-slate-soft')}>{r.role}</span></div>
              <div className="mono">{r.members}</div>
              <div className="muted mono">{r.lastUsed}</div>
              <div><span className={'badge tone-' + riskTone[r.risk] + '-soft'}>{r.risk.toUpperCase()}</span></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
