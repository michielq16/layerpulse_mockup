import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, EnvBadge } from './components';

/* ─────────────────────────────────────────────────────────────────────────
   /ownership — workspace defaults + per-model overrides
   Manual-data foundation: captures business role assignments that no
   Fabric API exposes. Workspace-level default inheritance is the
   90% case; per-model override handles the long tail (a downstream
   user becomes the de-facto owner of their report).
   ───────────────────────────────────────────────────────────────────────── */

const STATUS = {
  current: { label: 'Current', tone: 'emerald' },
  stale:   { label: 'Review overdue', tone: 'amber' },
  missing: { label: 'No owner', tone: 'rose' },
};

export function Ownership({ onOpenModel }) {
  const o = DATA.ownership;
  const [search, setSearch] = React.useState('');
  const [envFilter, setEnvFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [drawer, setDrawer] = React.useState(null);

  const allEnvs = Array.from(new Set(o.workspaceDefaults.map(w => w.env)));

  const filteredWs = o.workspaceDefaults.filter(w => {
    if (envFilter !== 'all' && w.env !== envFilter) return false;
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (search && !(w.ws + (w.leadName || '')).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all:     o.workspaceDefaults.length,
    current: o.workspaceDefaults.filter(w => w.status === 'current').length,
    stale:   o.workspaceDefaults.filter(w => w.status === 'stale').length,
    missing: o.workspaceDefaults.filter(w => w.status === 'missing').length,
  };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Ownership</h1>
          <p className="lp-page-sub">Workspace defaults inherit down. Override per model when a downstream user owns the report. Fabric tells us who has <i>permissions</i>; LP captures who's <i>accountable</i>.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
          <button className="btn btn-sm doc-gen-cta" onClick={() => setDrawer({ kind: 'add-default' })}><Icon name="plus" size={14}/>Assign default</button>
        </div>
      </div>

      <div className="lp-grid-5 fade-in">
        <StatCard label="Workspaces"       value={o.stats.workspaces}        icon="folders"  tone="sky"/>
        <StatCard label="Defaults set"     value={o.stats.assignedDefaults}  unit={`/${o.stats.workspaces}`} sub={`${Math.round(o.stats.assignedDefaults / o.stats.workspaces * 100)}% coverage`} icon="shield-check" tone="emerald"/>
        <StatCard label="Missing defaults" value={o.stats.missingDefaults}   sub="Action required" icon="alert-triangle" tone="rose"/>
        <StatCard label="Per-model overrides" value={o.stats.modelsWithOverride} unit={`/${o.stats.totalModels}`} sub="Exceptions to workspace default" icon="git-branch" tone="amber"/>
        <StatCard label="Stewards active"  value={o.stats.stewardsActive}    icon="users"    tone="violet"/>
      </div>

      {/* ── Workspace defaults section ─────────────────────────────── */}

      <div className="lp-section-head" style={{ marginTop: 22 }}>
        <h2>Workspace defaults <span className="count">{filteredWs.length} of {o.workspaceDefaults.length}</span></h2>
        <span className="lp-eyebrow">Last reviewed by anyone · {o.stats.lastReviewed}</span>
      </div>

      <div className="lp-card lp-card-flush fade-in d2" style={{ padding: 14, marginBottom: 14 }}>
        <div className="doc-lib-filters">
          <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search workspace, lead…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="chip-row">
            {[['all', 'All', counts.all], ['current', 'Current', counts.current], ['stale', 'Review due', counts.stale], ['missing', 'No owner', counts.missing]].map(([k, l, n]) => (
              <button key={k} className={'chip' + (statusFilter === k ? ' active' : '')} onClick={() => setStatusFilter(k)}>
                {l}<span className="count">{n}</span>
              </button>
            ))}
          </div>
          <div className="chip-row">
            <button className={'chip chip-sm' + (envFilter === 'all' ? ' active' : '')} onClick={() => setEnvFilter('all')}>All env</button>
            {allEnvs.map(e => (
              <button key={e} className={'chip chip-sm' + (envFilter === e ? ' active' : '')} onClick={() => setEnvFilter(e)}>{e}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="own-ws-table fade-in d2">
        <div className="own-ws-row own-ws-head">
          <span>Workspace</span>
          <span>Env</span>
          <span>Default lead</span>
          <span>Stewards</span>
          <span>Overrides</span>
          <span>Last reviewed</span>
          <span>Status</span>
          <span></span>
        </div>
        {filteredWs.map(w => {
          const st = STATUS[w.status];
          return (
            <div key={w.ws} className={'own-ws-row' + (w.status === 'missing' ? ' own-ws-missing' : '')}>
              <span className="own-ws-name">{w.ws}</span>
              <span><EnvBadge env={w.env}/></span>
              <span className="own-ws-lead">
                {w.leadName ? (<>
                  <span className="own-avatar">{w.leadName.split(' ').map(n => n[0]).slice(0,2).join('')}</span>
                  <span>
                    <div className="own-lead-name">{w.leadName}</div>
                    <div className="own-lead-mail mono">{w.leadEmail}</div>
                  </span>
                </>) : (
                  <span className="own-empty">No default assigned · <a onClick={() => setDrawer({ kind: 'edit-default', ws: w.ws })}>Assign →</a></span>
                )}
              </span>
              <span className="mono own-num">{w.stewards}</span>
              <span className="mono own-num">{w.overrides > 0 ? <a onClick={() => setDrawer({ kind: 'workspace-overrides', ws: w.ws })}>{w.overrides}</a> : '—'}</span>
              <span className="mono own-rev">{w.lastReview || <span className="own-empty">never</span>}</span>
              <span><span className={'own-status own-status-' + st.tone}><span className="dot"/>{st.label}</span></span>
              <span className="own-actions">
                <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setDrawer({ kind: 'edit-default', ws: w.ws })}><Icon name="settings" size={13}/></button>
              </span>
            </div>
          );
        })}
        {filteredWs.length === 0 && (
          <div className="empty" style={{ padding: 28 }}>No workspaces match. Adjust filters above.</div>
        )}
      </div>

      {/* ── Per-model overrides section ────────────────────────────── */}

      <div className="lp-section-head" style={{ marginTop: 26 }}>
        <h2>Per-model overrides <span className="count">{o.overrides.length}</span></h2>
        <span className="lp-eyebrow">Models where the owner differs from the workspace default</span>
      </div>

      <div className="own-override-list fade-in d3">
        {o.overrides.map(ov => (
          <div key={ov.id} className="own-override">
            <div className="own-override-main">
              <div className="own-override-head">
                <span className="own-override-model">{ov.model}</span>
                <span className="sep">·</span>
                <span className="mono own-override-ws">{ov.ws}</span>
                <span className="own-override-pill">Override</span>
              </div>
              <div className="own-override-why">{ov.why}</div>
              <div className="own-override-meta">
                <span><b>Owner now:</b> {ov.leadName}</span>
                <span className="sep">·</span>
                <span className="mono">{ov.leadEmail}</span>
                <span className="sep">·</span>
                <span>Set <b>{ov.set}</b> by {ov.setBy}</span>
              </div>
            </div>
            <div className="own-override-actions">
              <button className="btn btn-ghost btn-sm" title="Open model" onClick={() => onOpenModel?.(ov.ws, ov.model)}><Icon name="external" size={13}/>Open</button>
              <button className="btn btn-ghost btn-sm" title="Edit override" onClick={() => setDrawer({ kind: 'edit-override', id: ov.id })}><Icon name="settings" size={13}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Audit log ─────────────────────────────────────────────── */}

      <div className="lp-section-head" style={{ marginTop: 26 }}>
        <h2>Activity</h2>
        <span className="lp-eyebrow">All ownership changes · last 90d</span>
      </div>

      <div className="own-audit fade-in d4">
        {o.auditLog.map((a, i) => (
          <div key={i} className="own-audit-row">
            <span className="mono own-audit-date">{a.date}</span>
            <span className="own-audit-who">{a.who}</span>
            <span className="own-audit-change">{a.change}</span>
          </div>
        ))}
      </div>

      {drawer && <OwnershipDrawer drawer={drawer} onClose={() => setDrawer(null)}/>}
    </>
  );
}

/* ── Drawer (edit form) ──────────────────────────────────────────────── */

function OwnershipDrawer({ drawer, onClose }) {
  const o = DATA.ownership;

  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const isAdd      = drawer.kind === 'add-default';
  const isEditDef  = drawer.kind === 'edit-default';
  const isEditOv   = drawer.kind === 'edit-override';
  const isWsOv     = drawer.kind === 'workspace-overrides';

  const existingWs = isEditDef ? o.workspaceDefaults.find(w => w.ws === drawer.ws) : null;
  const existingOv = isEditOv ? o.overrides.find(x => x.id === drawer.id) : null;
  const wsOverrides = isWsOv ? o.overrides.filter(x => x.ws === drawer.ws) : [];

  let title, body;
  if (isAdd) {
    title = 'Assign workspace default';
    body = <DefaultForm initialWs="" initialLead="" />;
  } else if (isEditDef) {
    title = `Edit default · ${drawer.ws}`;
    body = <DefaultForm initialWs={drawer.ws} initialLead={existingWs?.leadEmail || ''} stewards={existingWs?.stewards || 0}/>;
  } else if (isEditOv) {
    title = `Edit override · ${existingOv?.model}`;
    body = <OverrideForm initialLead={existingOv?.leadEmail} initialWhy={existingOv?.why}/>;
  } else if (isWsOv) {
    title = `Overrides in ${drawer.ws}`;
    body = (
      <div className="own-drawer-list">
        {wsOverrides.map(ov => (
          <div key={ov.id} className="own-drawer-override">
            <div><b>{ov.model}</b> → {ov.leadName}</div>
            <div className="own-override-why" style={{ fontSize: 12 }}>{ov.why}</div>
            <div className="own-override-meta" style={{ fontSize: 11 }}>Set {ov.set} by {ov.setBy}</div>
          </div>
        ))}
        {wsOverrides.length === 0 && <div className="empty" style={{ padding: 14 }}>No overrides in this workspace.</div>}
      </div>
    );
  }

  return (
    <div className="own-drawer-backdrop" onClick={onClose}>
      <div className="own-drawer" onClick={e => e.stopPropagation()}>
        <div className="own-drawer-head">
          <div className="own-drawer-title">{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close (Esc)"><Icon name="x" size={14}/></button>
        </div>
        <div className="own-drawer-body">{body}</div>
        {!isWsOv && (
          <div className="own-drawer-foot">
            <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm">Save</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultForm({ initialWs, initialLead, stewards = 0 }) {
  const o = DATA.ownership;
  const [ws, setWs] = React.useState(initialWs);
  const [lead, setLead] = React.useState(initialLead);
  const [role, setRole] = React.useState('data-lead');

  return (
    <div className="own-form">
      <div className="own-form-row">
        <label>Workspace</label>
        <select className="input" value={ws} onChange={e => setWs(e.target.value)} disabled={!!initialWs}>
          <option value="">— Choose workspace —</option>
          {o.workspaceDefaults.map(w => <option key={w.ws} value={w.ws}>{w.ws} ({w.env})</option>)}
        </select>
      </div>

      <div className="own-form-row">
        <label>Default lead</label>
        <select className="input" value={lead} onChange={e => setLead(e.target.value)}>
          <option value="">— Pick a user —</option>
          {o.aadUsers.map(u => <option key={u.email} value={u.email}>{u.name} · {u.title}</option>)}
        </select>
        <div className="own-form-hint">Suggested from workspace permissions: 3 AAD users have Admin role.</div>
      </div>

      <div className="own-form-row">
        <label>Role</label>
        <div className="own-role-grid">
          {o.roles.map(r => (
            <button key={r.key} className={'own-role-tab' + (role === r.key ? ' active' : '')} onClick={() => setRole(r.key)}>
              <span className="own-role-label">{r.label}</span>
              <span className="own-role-desc">{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="own-form-row">
        <label>Stewards</label>
        <div className="own-form-stewards">
          <span className="own-empty">{stewards > 0 ? `${stewards} stewards assigned · ` : ''}<a>+ Add steward</a></span>
        </div>
        <div className="own-form-hint">Stewards review changes, approve new measures, and back up the lead.</div>
      </div>

      <div className="own-form-row">
        <label>Review cadence</label>
        <select className="input">
          <option>Quarterly (default)</option>
          <option>Monthly</option>
          <option>Annually</option>
          <option>On change</option>
        </select>
      </div>
    </div>
  );
}

function OverrideForm({ initialLead, initialWhy }) {
  const o = DATA.ownership;
  const [lead, setLead] = React.useState(initialLead || '');
  const [why, setWhy]   = React.useState(initialWhy || '');

  return (
    <div className="own-form">
      <div className="own-form-row">
        <label>Override owner</label>
        <select className="input" value={lead} onChange={e => setLead(e.target.value)}>
          <option value="">— Pick a user —</option>
          {o.aadUsers.map(u => <option key={u.email} value={u.email}>{u.name} · {u.title}</option>)}
        </select>
      </div>

      <div className="own-form-row">
        <label>Why this override</label>
        <textarea className="input" rows={4} value={why} onChange={e => setWhy(e.target.value)}
          placeholder="Required. e.g. 'Built by the forecasting team after Alex gave them publish rights. They now self-own.'"/>
        <div className="own-form-hint">Audit-quality context. Stays attached to the override forever.</div>
      </div>
    </div>
  );
}

/* ── ModelOwnership — reused inside /models/[id]/ownership tab ────────── */

export function ModelOwnership({ modelName, workspace }) {
  const o = DATA.ownership;
  const wsDefault = o.workspaceDefaults.find(w => w.ws === workspace);
  const override  = o.overrides.find(x => x.model === modelName);
  const audit     = o.auditLog.filter(a => a.change.includes(modelName) || a.change.includes(workspace));
  const [drawer, setDrawer] = React.useState(null);

  return (
    <>
      <div className="lp-section-head">
        <h2>Inherited from workspace</h2>
        {wsDefault && <span className="lp-eyebrow">Default for all models in <b>{workspace}</b></span>}
      </div>

      {wsDefault ? (
        <div className="model-own-block fade-in">
          <div className="model-own-card">
            <div className="model-own-card-head">
              <div className="own-avatar own-avatar-lg">{wsDefault.leadName?.split(' ').map(n => n[0]).slice(0,2).join('') || '?'}</div>
              <div>
                <div className="model-own-lead">{wsDefault.leadName || '—'}</div>
                <div className="model-own-role">Data lead · {workspace}</div>
                <div className="mono model-own-mail">{wsDefault.leadEmail || '—'}</div>
              </div>
            </div>
            <div className="model-own-card-meta">
              <div><span className="lp-eyebrow">Stewards</span><span className="mono">{wsDefault.stewards}</span></div>
              <div><span className="lp-eyebrow">Last reviewed</span><span className="mono">{wsDefault.lastReview || '—'}</span></div>
              <div><span className="lp-eyebrow">Status</span><span className={'own-status own-status-' + STATUS[wsDefault.status].tone}><span className="dot"/>{STATUS[wsDefault.status].label}</span></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="lp-card" style={{ padding: 18 }}>
          <div className="own-empty"><Icon name="alert" size={14} style={{ marginRight: 6 }}/>No workspace default set. <a>Assign one →</a></div>
        </div>
      )}

      <div className="lp-section-head" style={{ marginTop: 24 }}>
        <h2>Override for this model</h2>
        <div style={{ marginLeft: 'auto' }}>
          {override
            ? <button className="btn btn-outline btn-sm" onClick={() => setDrawer({ kind: 'edit-override', id: override.id })}><Icon name="settings" size={13}/>Edit override</button>
            : <button className="btn btn-sm doc-gen-cta" onClick={() => setDrawer({ kind: 'add-override' })}><Icon name="plus" size={13}/>Override default</button>
          }
        </div>
      </div>

      {override ? (
        <div className="own-override fade-in d2" style={{ marginTop: 0 }}>
          <div className="own-override-main">
            <div className="own-override-head">
              <span className="own-override-model">{override.leadName}</span>
              <span className="own-override-pill">Override</span>
            </div>
            <div className="own-override-why">{override.why}</div>
            <div className="own-override-meta">
              <span className="mono">{override.leadEmail}</span>
              <span className="sep">·</span>
              <span>Set <b>{override.set}</b> by {override.setBy}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="lp-card" style={{ padding: 18 }}>
          <div className="own-empty">No override — inherits workspace default. Add an override only when a downstream user owns this specific report.</div>
        </div>
      )}

      {audit.length > 0 && (
        <>
          <div className="lp-section-head" style={{ marginTop: 24 }}>
            <h2>Activity</h2>
            <span className="lp-eyebrow">Changes touching this model or workspace</span>
          </div>
          <div className="own-audit fade-in d3">
            {audit.map((a, i) => (
              <div key={i} className="own-audit-row">
                <span className="mono own-audit-date">{a.date}</span>
                <span className="own-audit-who">{a.who}</span>
                <span className="own-audit-change">{a.change}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {drawer && <OwnershipDrawer drawer={drawer} onClose={() => setDrawer(null)}/>}
    </>
  );
}
