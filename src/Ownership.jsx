import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, EnvBadge } from './components';

/* ── Helpers — resolve effective roles + domain for a model ─────────────── */

export function userByEmail(email) {
  if (!email) return null;
  return DATA.ownership.aadUsers.find(u => u.email === email) || { email, name: email, title: '' };
}

export function resolveModelOwner(modelName, workspace) {
  // Simple tagging (no inheritance/override): a model's owner is whoever is
  // tagged on its workspace. Tagged = covered; untagged = gap.
  const wsDefault = DATA.ownership.workspaceDefaults.find(w => w.ws === workspace);
  if (wsDefault?.leadName) {
    return { name: wsDefault.leadName, email: wsDefault.leadEmail, source: 'tagged' };
  }
  return null;
}

export function resolveModelSme(modelId) {
  const a = DATA.ownership.rolesPerModel.find(r => r.modelId === modelId && r.role === 'sme');
  if (!a) return null;
  const u = userByEmail(a.userEmail);
  return { ...a, name: u?.name, title: u?.title };
}

export function resolveModelStewards(modelId) {
  return DATA.ownership.rolesPerModel
    .filter(r => r.modelId === modelId && r.role === 'steward')
    .map(r => ({ ...r, ...userByEmail(r.userEmail) }));
}

export function resolveModelDomain(modelId) {
  const key = DATA.ownership.modelDomains[modelId];
  if (!key) return null;
  return DATA.glossary.domains.find(d => d.key === key) || { key, label: key };
}

/* Smart-suggest: order AAD users by their workspace permission tier. */
export function suggestUsersForWorkspace(workspace) {
  const o = DATA.ownership;
  const perms = o.workspacePermissions[workspace] || [];
  const tier = (email) => {
    const p = perms.find(x => x.email === email);
    if (!p) return 2; // not in workspace
    return p.role === 'admin' ? 0 : 1;
  };
  return [...o.aadUsers].sort((a, b) => tier(a.email) - tier(b.email));
}

export function workspacePermissionTier(email, workspace) {
  if (!email || !workspace) return null;
  const perms = DATA.ownership.workspacePermissions[workspace] || [];
  return perms.find(x => x.email === email)?.role || null;
}

/* Role-coverage summary per workspace (for /ownership table). */
export function workspaceRoleCoverage(workspace) {
  const o = DATA.ownership;
  const wsModels = DATA.documents.pickerModels.filter(m => m.ws === workspace);
  const total = wsModels.length;
  if (total === 0) return { total: 0, ownerSet: 0, smeSet: 0, stewardSet: 0 };
  const ownerSet   = wsModels.filter(m => resolveModelOwner(m.name, workspace)).length;
  const smeSet     = wsModels.filter(m => resolveModelSme(m.id)).length;
  const stewardSet = wsModels.filter(m => resolveModelStewards(m.id).length > 0).length;
  return { total, ownerSet, smeSet, stewardSet };
}

/* ─────────────────────────────────────────────────────────────────────────
   /ownership — simple role tagging (no inheritance/override)
   Manual-data foundation: captures business role assignments (Owner / SME /
   Steward) that no Fabric API exposes. Tag an item with someone = covered;
   untagged = a gap, visible in the dots. A "tag all models in workspace"
   shortcut handles scale — it just writes tags, it is not a relationship.
   ───────────────────────────────────────────────────────────────────────── */

const STATUS = {
  current: { label: 'Current', tone: 'emerald' },
  stale:   { label: 'Review overdue', tone: 'amber' },
  missing: { label: 'No owner', tone: 'rose' },
};

/* Inline cell — one line per role: word label + a dot per model.
   Filled dots = models with that role tagged; color = coverage tier
   (all=green · ~half=amber · some=red · none=all grey). The dots carry
   the count, so no fraction text and no letter badges. */
function RoleCoverageCell({ cov }) {
  if (cov.total === 0) return <span className="own-empty">no models</span>;
  const tier = (n) => {
    if (n === 0)    return 'empty';
    const pct = n / cov.total;
    if (pct >= 1)   return 'full';
    if (pct >= 0.5) return 'partial';
    return 'low';
  };
  const rows = [
    { name: 'Owner',   n: cov.ownerSet },
    { name: 'SME',     n: cov.smeSet },
    { name: 'Steward', n: cov.stewardSet },
  ];
  return (
    <span className="role-cov-cell">
      {rows.map(r => (
        <span key={r.name} className="role-cov-row" title={`${r.name}: ${r.n} of ${cov.total} models tagged`}>
          <span className="role-cov-name">{r.name}</span>
          <span className="role-cov-dots">
            {Array.from({ length: cov.total }).map((_, i) => (
              <span key={i} className={'rc-dot ' + (i < r.n ? 'rc-' + tier(r.n) : 'rc-empty')}/>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
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

  // Workspaces where any role is missing on any model (a tagging gap).
  const coverageGaps = o.workspaceDefaults.filter(w => {
    const c = workspaceRoleCoverage(w.ws);
    return c.total > 0 && (c.ownerSet < c.total || c.smeSet < c.total || c.stewardSet < c.total);
  }).length;

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Ownership</h1>
          <p className="lp-page-sub">Tag who's accountable for each model — Owner, SME, Steward. Tagged shows in the dots; untagged is a gap. Fabric tells us who has <i>permissions</i>; LP captures who's <i>accountable</i>.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
          <button className="btn btn-sm doc-gen-cta" onClick={() => setDrawer({ kind: 'add-default' })}><Icon name="plus" size={14}/>Tag owner</button>
        </div>
      </div>

      <div className="lp-grid-5 fade-in">
        <StatCard label="Workspaces"       value={o.stats.workspaces}        icon="folders"  tone="sky"/>
        <StatCard label="Owners tagged"    value={o.stats.assignedDefaults}  unit={`/${o.stats.workspaces}`} sub={`${Math.round(o.stats.assignedDefaults / o.stats.workspaces * 100)}% of workspaces`} icon="shield-check" tone="emerald"/>
        <StatCard label="No owner"         value={o.stats.missingDefaults}   sub="Untagged — action required" icon="alert-triangle" tone="rose"/>
        <StatCard label="Coverage gaps"    value={coverageGaps}              sub="workspaces missing a role" icon="git-branch" tone="amber"/>
        <StatCard label="Stewards active"  value={o.stats.stewardsActive}    icon="users"    tone="violet"/>
      </div>

      {/* ── Workspace defaults section ─────────────────────────────── */}

      <div className="lp-section-head" style={{ marginTop: 22 }}>
        <h2>Ownership by workspace <span className="count">{filteredWs.length} of {o.workspaceDefaults.length}</span></h2>
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
          <span>Owner</span>
          <span>Role coverage</span>
          <span>Last reviewed</span>
          <span>Status</span>
          <span></span>
        </div>
        {filteredWs.map(w => {
          const st = STATUS[w.status];
          const cov = workspaceRoleCoverage(w.ws);
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
                  <span className="own-empty">Untagged · <a onClick={() => setDrawer({ kind: 'edit-default', ws: w.ws })}>Tag →</a></span>
                )}
              </span>
              <RoleCoverageCell cov={cov}/>
              <span className="mono own-rev">{w.lastReview || <span className="own-empty">never</span>}</span>
              <span><span className={'own-status own-status-' + st.tone}><span className="dot"/>{st.label}</span></span>
              <span className="own-actions">
                <button className="btn btn-ghost btn-sm" title="Tag all models in this workspace" onClick={() => setDrawer({ kind: 'edit-default', ws: w.ws })}><Icon name="settings" size={13}/></button>
              </span>
            </div>
          );
        })}
        {filteredWs.length === 0 && (
          <div className="empty" style={{ padding: 28 }}>No workspaces match. Adjust filters above.</div>
        )}
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
  const isAddOv    = drawer.kind === 'add-override';
  const isEditOv   = drawer.kind === 'edit-override';
  const isWsOv     = drawer.kind === 'workspace-overrides';
  const isSme      = drawer.kind === 'edit-sme';
  const isAddStw   = drawer.kind === 'add-steward';
  const isRmStw    = drawer.kind === 'remove-steward';
  const isDomain   = drawer.kind === 'change-domain';

  const existingWs = isEditDef ? o.workspaceDefaults.find(w => w.ws === drawer.ws) : null;
  const existingOv = isEditOv ? o.overrides.find(x => x.id === drawer.id) : null;
  const wsOverrides = isWsOv ? o.overrides.filter(x => x.ws === drawer.ws) : [];
  const existingSme = isSme && drawer.modelId ? o.rolesPerModel.find(r => r.modelId === drawer.modelId && r.role === 'sme') : null;

  let title, body;
  if (isAdd) {
    title = 'Tag owner';
    body = <DefaultForm initialWs="" initialLead="" />;
  } else if (isEditDef) {
    title = `Tag roles · ${drawer.ws} (all models)`;
    body = <DefaultForm initialWs={drawer.ws} initialLead={existingWs?.leadEmail || ''} stewards={existingWs?.stewards || 0}/>;
  } else if (isAddOv) {
    title = drawer.modelName ? `Override owner · ${drawer.modelName}` : 'Add override';
    body = <OverrideForm initialLead="" initialWhy="" modelHint={drawer.modelName} workspaceHint={drawer.workspace}/>;
  } else if (isEditOv) {
    title = `Edit owner override · ${existingOv?.model}`;
    body = <OverrideForm initialLead={existingOv?.leadEmail} initialWhy={existingOv?.why} workspaceHint={existingOv?.ws}/>;
  } else if (isSme) {
    title = `${existingSme ? 'Edit' : 'Assign'} SME · ${drawer.modelName}`;
    body = <SmeForm initialLead={existingSme?.userEmail || ''} initialWhy={existingSme?.why || ''} workspaceHint={drawer.workspace} modelHint={drawer.modelName}/>;
  } else if (isAddStw) {
    title = `Add steward · ${drawer.modelName}`;
    body = <StewardForm workspaceHint={drawer.workspace} modelHint={drawer.modelName}/>;
  } else if (isRmStw) {
    title = `Remove steward · ${drawer.modelName}`;
    body = (
      <div className="own-form">
        <div className="own-form-context">
          <div className="lp-eyebrow">Removing</div>
          <div className="own-form-context-body">
            <div><b>{userByEmail(drawer.userEmail)?.name}</b> <span className="mono own-form-context-ws">{drawer.userEmail}</span></div>
            <div className="own-form-context-sub">This will remove the steward role only. The user keeps any other roles + workspace permissions.</div>
          </div>
        </div>
      </div>
    );
  } else if (isDomain) {
    title = `${drawer.currentDomain ? 'Change' : 'Set'} domain · ${drawer.modelName}`;
    body = <DomainForm initialDomain={drawer.currentDomain} modelHint={drawer.modelName}/>;
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

/* Smart-suggest user picker — sorts admins/members of the workspace to the top. */
function UserSelect({ value, onChange, workspace, placeholder = '— Pick a user —' }) {
  const sorted = workspace ? suggestUsersForWorkspace(workspace) : DATA.ownership.aadUsers;
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {sorted.map(u => {
        const tier = workspacePermissionTier(u.email, workspace);
        const badge = tier === 'admin' ? '★ Admin · ' : tier === 'member' ? '· Member · ' : '— ';
        return <option key={u.email} value={u.email}>{badge}{u.name} · {u.title}</option>;
      })}
    </select>
  );
}

function OverrideForm({ initialLead, initialWhy, modelHint, workspaceHint }) {
  const o = DATA.ownership;
  const [lead, setLead] = React.useState(initialLead || '');
  const [why, setWhy]   = React.useState(initialWhy || '');
  const wsDefault = workspaceHint ? o.workspaceDefaults.find(w => w.ws === workspaceHint) : null;
  const perms = workspaceHint ? o.workspacePermissions[workspaceHint] : null;
  const adminCount = perms ? perms.filter(p => p.role === 'admin').length : 0;
  const memberCount = perms ? perms.filter(p => p.role === 'member').length : 0;

  return (
    <div className="own-form">
      {(modelHint || workspaceHint) && (
        <div className="own-form-context">
          <div className="lp-eyebrow">Overriding Owner for</div>
          <div className="own-form-context-body">
            <div><b>{modelHint}</b> {workspaceHint && <span className="mono own-form-context-ws">{workspaceHint}</span>}</div>
            {wsDefault?.leadName && (
              <div className="own-form-context-sub">Workspace default Owner is <b>{wsDefault.leadName}</b>. Override only when a downstream user owns this specific report.</div>
            )}
          </div>
        </div>
      )}

      <div className="own-form-row">
        <label>Override owner</label>
        <UserSelect value={lead} onChange={setLead} workspace={workspaceHint}/>
        {workspaceHint && (
          <div className="own-form-hint">Smart-suggest: <b>{adminCount}</b> workspace Admin · <b>{memberCount}</b> Member — listed first.</div>
        )}
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

/* SME assignment (singular) */
function SmeForm({ initialLead, initialWhy, modelHint, workspaceHint }) {
  const [lead, setLead] = React.useState(initialLead || '');
  const [why, setWhy]   = React.useState(initialWhy || '');

  return (
    <div className="own-form">
      <div className="own-form-context">
        <div className="lp-eyebrow">SME for</div>
        <div className="own-form-context-body">
          <div><b>{modelHint}</b> <span className="mono own-form-context-ws">{workspaceHint}</span></div>
          <div className="own-form-context-sub">The SME is the knowledge-holder — the person new analysts contact with questions. The Analyst document uses this name as the "Questions? Contact:" field; if blank, it falls back to the Owner.</div>
        </div>
      </div>

      <div className="own-form-row">
        <label>SME</label>
        <UserSelect value={lead} onChange={setLead} workspace={workspaceHint}/>
        <div className="own-form-hint">Often someone other than the Owner — the SME knows the data; the Owner is accountable for it.</div>
      </div>

      <div className="own-form-row">
        <label>Why (optional)</label>
        <textarea className="input" rows={3} value={why} onChange={e => setWhy(e.target.value)}
          placeholder="Optional context, e.g. 'Wrote the original DAX; reference for any time-intelligence question.'"/>
      </div>
    </div>
  );
}

/* Steward assignment (multi) */
function StewardForm({ modelHint, workspaceHint }) {
  const [lead, setLead] = React.useState('');

  return (
    <div className="own-form">
      <div className="own-form-context">
        <div className="lp-eyebrow">Adding steward to</div>
        <div className="own-form-context-body">
          <div><b>{modelHint}</b> <span className="mono own-form-context-ws">{workspaceHint}</span></div>
          <div className="own-form-context-sub">Stewards review changes, approve new measures, and back up the Owner. The Auditor document sign-off block credits all stewards.</div>
        </div>
      </div>

      <div className="own-form-row">
        <label>Steward</label>
        <UserSelect value={lead} onChange={setLead} workspace={workspaceHint}/>
      </div>
    </div>
  );
}

/* Domain assignment */
function DomainForm({ initialDomain, modelHint }) {
  const [domain, setDomain] = React.useState(initialDomain || '');
  const domains = DATA.glossary.domains;

  return (
    <div className="own-form">
      <div className="own-form-context">
        <div className="lp-eyebrow">Tagging domain for</div>
        <div className="own-form-context-body">
          <div><b>{modelHint}</b></div>
          <div className="own-form-context-sub">Domain is the business area this model serves (e.g. Finance, Sales). Used to filter the glossary by relevant terms and to group models across workspaces.</div>
        </div>
      </div>

      <div className="own-form-row">
        <label>Domain</label>
        <div className="own-domain-grid">
          {domains.map(d => (
            <button key={d.key} className={'own-domain-tab' + (domain === d.key ? ' active' : '')} onClick={() => setDomain(d.key)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ModelOwnership — /models/[id]/ownership tab (v2: 3 roles + domain) ── */

export function ModelOwnership({ modelName, workspace }) {
  const o = DATA.ownership;
  const modelId = (DATA.documents.pickerModels.find(m => m.name === modelName) || {}).id;
  const owner    = resolveModelOwner(modelName, workspace);
  const sme      = modelId ? resolveModelSme(modelId) : null;
  const stewards = modelId ? resolveModelStewards(modelId) : [];
  const domain   = modelId ? resolveModelDomain(modelId) : null;
  const audit    = o.auditLog.filter(a => a.change.includes(modelName) || a.change.includes(workspace));
  const [drawer, setDrawer] = React.useState(null);

  return (
    <>
      <div className="lp-section-head">
        <h2>Roles for this model</h2>
        <span className="lp-eyebrow">Owner inherits from workspace default unless overridden. SME &amp; Stewards live on the model.</span>
      </div>

      <div className="model-role-grid fade-in">

        {/* OWNER */}
        <div className="model-role-card">
          <div className="model-role-head">
            <span className={'model-role-pill model-role-pill-sky'}>Owner</span>
            <span className="model-role-source">{owner ? (owner.source === 'override' ? 'Override on model' : 'Inherited from workspace') : 'Not set'}</span>
            <div className="model-role-actions">
              {owner?.source === 'override'
                ? <button className="btn btn-ghost btn-sm" onClick={() => setDrawer({ kind: 'edit-override', id: o.overrides.find(x => x.model === modelName)?.id })}><Icon name="settings" size={12}/>Edit</button>
                : <button className="btn btn-ghost btn-sm" onClick={() => setDrawer({ kind: 'add-override', modelName, workspace })}><Icon name="plus" size={12}/>Override</button>
              }
            </div>
          </div>
          {owner ? (
            <div className="model-role-body">
              <div className="own-avatar own-avatar-lg">{owner.name?.split(' ').map(n => n[0]).slice(0,2).join('') || '?'}</div>
              <div className="model-role-person">
                <div className="model-role-name">{owner.name}</div>
                <div className="mono model-role-mail">{owner.email}</div>
                {owner.source === 'override' && owner.why && <div className="model-role-why">{owner.why}</div>}
              </div>
            </div>
          ) : (
            <div className="model-role-empty">No owner set. Inherits from workspace default; workspace has none. <a onClick={() => setDrawer({ kind: 'add-override', modelName, workspace })}>Assign →</a></div>
          )}
        </div>

        {/* SME */}
        <div className="model-role-card">
          <div className="model-role-head">
            <span className={'model-role-pill model-role-pill-emerald'}>SME</span>
            <span className="model-role-source">{sme ? 'Set on this model' : 'Not assigned · falls back to Owner'}</span>
            <div className="model-role-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setDrawer({ kind: 'edit-sme', modelId, modelName, workspace })}>
                <Icon name={sme ? 'settings' : 'plus'} size={12}/>{sme ? 'Edit' : 'Assign'}
              </button>
            </div>
          </div>
          {sme ? (
            <div className="model-role-body">
              <div className="own-avatar own-avatar-lg">{sme.name?.split(' ').map(n => n[0]).slice(0,2).join('') || '?'}</div>
              <div className="model-role-person">
                <div className="model-role-name">{sme.name}</div>
                <div className="mono model-role-mail">{sme.userEmail}</div>
                {sme.title && <div className="model-role-title">{sme.title}</div>}
                {sme.why && <div className="model-role-why">{sme.why}</div>}
              </div>
            </div>
          ) : (
            <div className="model-role-empty">No SME assigned. The Analyst document will use the Owner as the "Questions? Contact:" field.</div>
          )}
        </div>

        {/* STEWARDS */}
        <div className="model-role-card model-role-card-wide">
          <div className="model-role-head">
            <span className={'model-role-pill model-role-pill-amber'}>Stewards</span>
            <span className="model-role-source">{stewards.length} assigned</span>
            <div className="model-role-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setDrawer({ kind: 'add-steward', modelId, modelName, workspace })}><Icon name="plus" size={12}/>Add steward</button>
            </div>
          </div>
          {stewards.length > 0 ? (
            <div className="model-stewards-list">
              {stewards.map(s => (
                <div key={s.userEmail} className="model-steward-row">
                  <div className="own-avatar">{s.name?.split(' ').map(n => n[0]).slice(0,2).join('') || '?'}</div>
                  <div className="model-steward-main">
                    <div className="model-steward-name">{s.name}</div>
                    <div className="mono model-steward-mail">{s.userEmail}</div>
                  </div>
                  <div className="model-steward-meta">Set {s.set} by {s.setBy}</div>
                  <button className="btn btn-ghost btn-sm" title="Remove" onClick={() => setDrawer({ kind: 'remove-steward', modelId, modelName, userEmail: s.userEmail })}><Icon name="x" size={12}/></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="model-role-empty">No stewards assigned. The Auditor document sign-off block will only credit the Owner.</div>
          )}
        </div>

        {/* DOMAIN */}
        <div className="model-role-card">
          <div className="model-role-head">
            <span className={'model-role-pill model-role-pill-violet'}>Domain</span>
            <span className="model-role-source">{domain ? 'Tagged' : 'Untagged'}</span>
            <div className="model-role-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setDrawer({ kind: 'change-domain', modelId, modelName, currentDomain: domain?.key })}><Icon name="settings" size={12}/>{domain ? 'Change' : 'Set'}</button>
            </div>
          </div>
          {domain ? (
            <div className="model-role-body" style={{ alignItems: 'center' }}>
              <div className="model-domain-chip">{domain.label}</div>
              <div className="model-role-title" style={{ marginLeft: 'auto' }}>Used by glossary filter &amp; cross-workspace grouping.</div>
            </div>
          ) : (
            <div className="model-role-empty">Untagged. <a onClick={() => setDrawer({ kind: 'change-domain', modelId, modelName })}>Tag a domain →</a> (e.g. Finance, Sales) — helps filter the glossary and group cross-workspace.</div>
          )}
        </div>
      </div>

      {audit.length > 0 && (
        <>
          <div className="lp-section-head" style={{ marginTop: 28 }}>
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

/* ── RolePanel — read-only role display for /models/[id]/overview ──────── */

export function RolePanel({ modelName, workspace, onEdit }) {
  const modelId = (DATA.documents.pickerModels.find(m => m.name === modelName) || {}).id;
  const owner    = resolveModelOwner(modelName, workspace);
  const sme      = modelId ? resolveModelSme(modelId) : null;
  const stewards = modelId ? resolveModelStewards(modelId) : [];
  const domain   = modelId ? resolveModelDomain(modelId) : null;

  const Tile = ({ tone, label, source, person, missing, extra }) => (
    <div className="role-panel-tile">
      <div className="role-panel-head">
        <span className={'model-role-pill model-role-pill-' + tone}>{label}</span>
        {source && <span className="role-panel-source">{source}</span>}
      </div>
      {person ? (
        <div className="role-panel-person">
          <div className="own-avatar">{person.name?.split(' ').map(n => n[0]).slice(0,2).join('') || '?'}</div>
          <div>
            <div className="role-panel-name">{person.name}</div>
            <div className="mono role-panel-mail">{person.email || person.userEmail}</div>
          </div>
        </div>
      ) : extra ? extra : (
        <div className="role-panel-missing">{missing}</div>
      )}
    </div>
  );

  return (
    <div className="role-panel fade-in">
      <div className="role-panel-head-row">
        <div className="lp-eyebrow">Roles &amp; ownership</div>
        <a className="role-panel-edit" onClick={onEdit}>Edit in Ownership tab <Icon name="arrow-right" size={11}/></a>
      </div>
      <div className="role-panel-grid">
        <Tile
          tone="sky" label="Owner"
          source={owner?.source === 'override' ? 'Override' : owner ? 'Inherited' : '—'}
          person={owner}
          missing="Not set — assign in Ownership tab"
        />
        <Tile
          tone="emerald" label="SME"
          source={sme ? 'Set' : 'Falls back to Owner'}
          person={sme && { name: sme.name, email: sme.userEmail }}
          missing="—"
        />
        <Tile
          tone="amber" label="Stewards"
          source={`${stewards.length} assigned`}
          extra={stewards.length > 0 ? (
            <div className="role-panel-stewards">
              {stewards.slice(0, 3).map(s => (
                <div key={s.userEmail} className="role-panel-steward" title={s.userEmail}>
                  <div className="own-avatar own-avatar-sm">{s.name?.split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                  <span>{s.name?.split(' ')[0]}</span>
                </div>
              ))}
              {stewards.length > 3 && <span className="role-panel-more">+{stewards.length - 3} more</span>}
            </div>
          ) : null}
          missing="No stewards assigned"
        />
        <Tile
          tone="violet" label="Domain"
          source={domain ? 'Tagged' : '—'}
          extra={domain ? <div className="model-domain-chip">{domain.label}</div> : null}
          missing="Untagged"
        />
      </div>
    </div>
  );
}
