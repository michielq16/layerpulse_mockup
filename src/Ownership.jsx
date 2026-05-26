import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, EnvBadge } from './components';

/* ─────────────────────────────────────────────────────────────────────────
   /ownership — V2 cockpit
   Two-layer governance: Workspace (Owner + Primary contact) and Semantic
   Model (Owner + SME + Steward). Different roles per layer because the
   responsibilities are different. Simple tagging — no inheritance, no
   overrides. The page answers "what governance risk needs attention NOW",
   not "who owns what". Default sort = risk descending.
   ───────────────────────────────────────────────────────────────────────── */

/* ── Helpers ── */
export function userByEmail(email) {
  if (!email) return null;
  return DATA.ownership.aadUsers.find(u => u.email === email) || { email, name: email, title: '' };
}

export function resolveModelOwner(modelName, workspace) {
  // V2: owner is a per-model tag in rolesPerModel (the workspace bulk shortcut
  // writes individual tags; no inheritance to resolve).
  const m = DATA.documents.pickerModels.find(p => p.name === modelName && (!workspace || p.ws === workspace));
  if (!m) return null;
  const tag = DATA.ownership.rolesPerModel.find(r => r.modelId === m.id && r.role === 'owner');
  if (!tag) return null;
  const u = userByEmail(tag.userEmail);
  return { name: u?.name || tag.userEmail, email: tag.userEmail, source: 'tagged', title: u?.title || '' };
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
export function suggestUsersForWorkspace(workspace) {
  const o = DATA.ownership;
  const perms = o.workspacePermissions[workspace] || [];
  const tier = (email) => {
    const p = perms.find(x => x.email === email);
    if (!p) return 2;
    return p.role === 'admin' ? 0 : 1;
  };
  return [...o.aadUsers].sort((a, b) => tier(a.email) - tier(b.email));
}
export function workspacePermissionTier(email, workspace) {
  if (!email || !workspace) return null;
  const perms = DATA.ownership.workspacePermissions[workspace] || [];
  return perms.find(x => x.email === email)?.role || null;
}
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

/* ── Constants ── */
const CRIT_LABEL = { critical: 'CRITICAL', 'business-critical': 'BUSINESS-CRITICAL', internal: 'INTERNAL', low: 'LOW' };
const CRIT_TONE  = { critical: 'rose', 'business-critical': 'amber', internal: 'sky', low: 'slate' };

/* Risk priority — higher = needs attention sooner. */
function workspaceRisk(w) {
  let r = 0;
  if (!w.leadName) r += 1000;                                  // no owner is the top alert
  if (w.criticality === 'critical') r += 400;
  else if (w.criticality === 'business-critical') r += 200;
  else if (w.criticality === 'internal') r += 50;
  if (w.status === 'stale') r += 150;
  return r;
}
function modelRisk(m) {
  let r = 0;
  if (!resolveModelOwner(m.name, m.ws)) r += 800;
  if (!resolveModelSme(m.id)) r += 80;
  if (resolveModelStewards(m.id).length === 0) r += 40;
  return r;
}

/* Health score — weighted average of 4 coverage signals. */
function computeHealth() {
  const o = DATA.ownership;
  const models = DATA.documents.pickerModels;
  const totalWs = o.workspaceDefaults.length;
  const ownedWs = o.workspaceDefaults.filter(w => w.leadName).length;
  const totalM  = models.length;
  const ownedM  = models.filter(m => resolveModelOwner(m.name, m.ws)).length;
  const smedM   = models.filter(m => resolveModelSme(m.id)).length;
  const freshWs = o.workspaceDefaults.filter(w => w.status === 'current').length;
  const score = Math.round(((ownedWs/totalWs)*0.30 + (ownedM/totalM)*0.30 + (smedM/totalM)*0.25 + (freshWs/totalWs)*0.15) * 100);
  return { score, trend: 6 }; // +6 over 60d (mocked baseline)
}

/* ── Page ── */
export function Ownership({ onOpenModel, onActAsCustomer }) {
  const o = DATA.ownership;
  const models = DATA.documents.pickerModels;
  const [tab, setTab] = React.useState('workspaces');
  const [search, setSearch] = React.useState('');
  const [chip, setChip] = React.useState('all');                 // all | at-risk | overdue | critical | mine
  const [sort, setSort] = React.useState('risk');                // risk | name | activity
  const [drawer, setDrawer] = React.useState(null);

  const health = React.useMemo(computeHealth, []);
  const atRisk   = o.workspaceDefaults.filter(w => !w.leadName || w.status === 'missing' || w.criticality === 'critical' && !w.leadName).length;
  const overdue  = o.workspaceDefaults.filter(w => w.status === 'stale').length;
  const totalModels = models.length;

  /* Workspaces — filter + sort */
  const filteredWs = o.workspaceDefaults
    .filter(w => {
      if (search && !((w.ws + (w.leadName || '') + (w.primaryContactName || '')).toLowerCase().includes(search.toLowerCase()))) return false;
      if (chip === 'at-risk')   return !w.leadName || w.status === 'stale' || (w.criticality === 'critical' && !w.leadName);
      if (chip === 'overdue')   return w.status === 'stale';
      if (chip === 'critical')  return w.criticality === 'critical';
      if (chip === 'mine')      return (w.leadEmail === 'a.rivera@contoso.com' || w.primaryContactEmail === 'a.rivera@contoso.com');
      return true;
    })
    .sort((a, b) => sort === 'name' ? a.ws.localeCompare(b.ws) : workspaceRisk(b) - workspaceRisk(a));

  /* Models — filter + sort */
  const filteredModels = models
    .filter(m => {
      const owner = resolveModelOwner(m.name, m.ws);
      if (search && !((m.name + ' ' + m.ws + (owner?.name || '')).toLowerCase().includes(search.toLowerCase()))) return false;
      if (chip === 'at-risk')  return !owner || !resolveModelSme(m.id) || resolveModelStewards(m.id).length === 0;
      if (chip === 'critical') {
        const w = o.workspaceDefaults.find(x => x.ws === m.ws);
        return w?.criticality === 'critical';
      }
      if (chip === 'mine')     return owner?.email === 'a.rivera@contoso.com';
      return true;
    })
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : modelRisk(b) - modelRisk(a));

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Ownership &amp; Stewardship</h1>
          <p className="lp-page-sub">Assign accountable owners and stewards to every workspace and semantic model — separate from Fabric permissions and contributor access.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
          <button className="btn btn-sm doc-gen-cta" onClick={() => setDrawer({ kind: 'add' })}><Icon name="plus" size={14}/>Tag owner</button>
        </div>
      </div>

      <div className="lp-grid-5 fade-in">
        <StatCard label="Workspaces"      value={o.workspaceDefaults.length} icon="folders" tone="sky"/>
        <StatCard label="Health score"    value={health.score} unit="/100" delta={health.trend} sub={`${health.trend > 0 ? '+' : ''}${health.trend} in 60d`} icon="activity" tone={health.score >= 80 ? 'emerald' : health.score >= 60 ? 'amber' : 'rose'}/>
        <StatCard label="At-risk"         value={atRisk} sub="needs attention" icon="alert-triangle" tone={atRisk > 0 ? 'rose' : 'sky'}/>
        <StatCard label="Review overdue"  value={overdue} sub="past review date" icon="alert" tone={overdue > 0 ? 'amber' : 'sky'}/>
        <StatCard label="Stewards active" value={o.stats.stewardsActive} icon="users" tone="violet"/>
      </div>

      {/* Tab toggle */}
      <div className="own2-tabs fade-in d2">
        <button className={'own2-tab' + (tab === 'workspaces' ? ' active' : '')} onClick={() => setTab('workspaces')}>
          Workspaces <span className="mini-count">{o.workspaceDefaults.length}</span>
        </button>
        <button className={'own2-tab' + (tab === 'models' ? ' active' : '')} onClick={() => setTab('models')}>
          Semantic models <span className="mini-count">{totalModels}</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="own2-filterbar fade-in d3">
        <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
          <Icon name="search" size={13}/>
          <input placeholder={tab === 'workspaces' ? 'Search workspace, owner, contact…' : 'Search model, workspace, owner…'} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="chip-row">
          {[['all','All'],['at-risk','At-risk'],['overdue','Overdue'],['critical','Critical'],['mine','Mine']].map(([k, l]) => (
            <button key={k} className={'chip' + (chip === k ? ' active' : '')} onClick={() => setChip(k)}>{l}</button>
          ))}
        </div>
        <div className="own2-sort">
          <span className="lp-eyebrow" style={{ marginRight: 6 }}>Sort</span>
          <select className="input input-sm" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="risk">Risk</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Rows */}
      <div className="own2-list fade-in d3">
        {tab === 'workspaces' && filteredWs.map(w => (
          <WorkspaceRow key={w.ws} w={w} onTag={() => setDrawer({ kind: 'tag-ws', ws: w.ws })} onDrillModels={() => { setTab('models'); setSearch(w.ws); }}/>
        ))}
        {tab === 'workspaces' && filteredWs.length === 0 && <div className="empty" style={{ padding: 28 }}>No workspaces match. Clear the filter to see all.</div>}
        {tab === 'models' && filteredModels.map(m => (
          <ModelRow key={m.id} m={m} onTag={() => setDrawer({ kind: 'tag-model', modelId: m.id })} onOpen={() => onOpenModel?.(m.ws, m.id)}/>
        ))}
        {tab === 'models' && filteredModels.length === 0 && <div className="empty" style={{ padding: 28 }}>No models match.</div>}
      </div>

      {/* Activity log (kept) */}
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

/* ── Workspace row ── */
function WorkspaceRow({ w, onTag, onDrillModels }) {
  const cov = workspaceRoleCoverage(w.ws);
  const noOwner = !w.leadName;
  const stale = w.status === 'stale';
  const critical = w.criticality === 'critical';
  const rowTone = noOwner ? 'rose' : stale ? 'amber' : null;

  // Escalation text
  let esc = null;
  if (noOwner) {
    // crude: derive a day count from the workspace position (mocked)
    esc = w.ws === 'Supply-Chain' ? 'No owner · 34d' : w.ws === 'Customer-Success' ? 'No owner · 21d' : 'No owner';
  } else if (stale) {
    const days = w.lastUpdate?.match(/(\d+)d/)?.[1] || '21';
    esc = `Review overdue · ${days}d`;
  } else if (w.lastReview) {
    esc = `Reviewed ${w.lastReview}` + (w.lastUpdate ? ` · Updated ${w.lastUpdate}` : '');
  }

  // Primary action: contextual
  let primaryAction = null;
  if (noOwner) primaryAction = { label: 'Assign owner', onClick: onTag };
  else if (stale) primaryAction = { label: 'Review', onClick: onTag };

  return (
    <div className={'own2-row' + (rowTone ? ' own2-row-' + rowTone : '')}>
      <div className="own2-row-top">
        {(noOwner || stale) && <Icon name="alert-triangle" size={16} className={rowTone === 'rose' ? 'own2-alert-icon-rose' : 'own2-alert-icon-amber'}/>}
        <span className="own2-row-name">{w.ws}</span>
        <CritChip c={w.criticality}/>
        {esc && <span className={'own2-esc' + (noOwner || stale ? ' own2-esc-bad' : '')}>{esc}</span>}
        <div style={{ flex: 1 }}/>
        {primaryAction && <button className="btn btn-sm doc-gen-cta" onClick={primaryAction.onClick}>{primaryAction.label} →</button>}
        <button className="btn btn-ghost btn-sm" title="More" onClick={onTag}><Icon name="settings" size={13}/></button>
      </div>
      <div className="own2-row-meta">
        <EnvBadge env={w.env}/>
        <span className="mono">{cov.total} {cov.total === 1 ? 'model' : 'models'}</span>
        <span className="own2-sep">·</span>
        <span className="mono">{w.reports} {w.reports === 1 ? 'report' : 'reports'}</span>
      </div>
      <div className="own2-row-roles">
        <RoleChip label="Workspace owner" name={w.leadName} title={w.leadName ? userByEmail(w.leadEmail)?.title : null}/>
        <RoleChip label="Primary contact" name={w.primaryContactName} title={w.primaryContactName ? userByEmail(w.primaryContactEmail)?.title : null} subtle/>
        <div style={{ flex: 1 }}/>
        <ModelCoverageChip cov={cov} onClick={onDrillModels}/>
      </div>
    </div>
  );
}

/* ── Semantic model row ── */
function ModelRow({ m, onTag, onOpen }) {
  const owner = resolveModelOwner(m.name, m.ws);
  const sme = resolveModelSme(m.id);
  const stewards = resolveModelStewards(m.id);
  const o = DATA.ownership;
  const ws = o.workspaceDefaults.find(w => w.ws === m.ws);
  const noOwner = !owner;
  const partial = owner && (!sme || stewards.length === 0);
  const rowTone = noOwner ? 'rose' : partial ? 'amber' : null;

  let esc = null;
  if (noOwner) esc = m.id === 'rev-forecast' ? 'No owner · 18d' : m.id === 'supply-pipeline' ? 'No owner · 34d' : 'No owner';
  else if (!sme) esc = 'No SME';
  else if (stewards.length === 0) esc = 'No steward';

  return (
    <div className={'own2-row' + (rowTone ? ' own2-row-' + rowTone : '')}>
      <div className="own2-row-top">
        {(noOwner || partial) && <Icon name="alert-triangle" size={16} className={rowTone === 'rose' ? 'own2-alert-icon-rose' : 'own2-alert-icon-amber'}/>}
        <span className="own2-row-name">{m.name}</span>
        <span className="own2-row-ws">{m.ws} · {m.env}</span>
        {ws && <CritChip c={ws.criticality}/>}
        {esc && <span className={'own2-esc' + (noOwner ? ' own2-esc-bad' : ' own2-esc-warn')}>{esc}</span>}
        <div style={{ flex: 1 }}/>
        {noOwner && <button className="btn btn-sm doc-gen-cta" onClick={onTag}>Assign owner →</button>}
        <button className="btn btn-ghost btn-sm" title="Open model" onClick={onOpen}><Icon name="external" size={13}/></button>
        <button className="btn btn-ghost btn-sm" title="Tag roles" onClick={onTag}><Icon name="settings" size={13}/></button>
      </div>
      <div className="own2-row-meta">
        <span className="mono">{m.tables} tables</span><span className="own2-sep">·</span>
        <span className="mono">{m.measures} measures</span><span className="own2-sep">·</span>
        <span className="mono">{m.glossary || 0} glossary terms</span>
      </div>
      <div className="own2-row-roles">
        <RoleChip label="Owner"   name={owner?.name}/>
        <RoleChip label="SME"     name={sme?.name}/>
        <RoleChip label="Steward" name={stewards.length === 0 ? null : stewards.length === 1 ? stewards[0].name : `${stewards.length} tagged`}/>
      </div>
    </div>
  );
}

/* ── Small chips ── */
function CritChip({ c }) {
  if (!c) return null;
  return <span className={'own2-crit own2-crit-' + CRIT_TONE[c]}>{CRIT_LABEL[c]}</span>;
}
function RoleChip({ label, name, title, subtle }) {
  const missing = !name;
  return (
    <span className={'own2-role' + (missing ? ' own2-role-missing' : '') + (subtle ? ' own2-role-subtle' : '')}>
      <span className="own2-role-lbl">{label}</span>
      <span className="own2-role-mark">{missing ? '✗' : '✓'}</span>
      <span className="own2-role-name">{missing ? (subtle ? 'none yet' : 'Missing') : name}</span>
      {title && !missing && <span className="own2-role-title">· {title}</span>}
    </span>
  );
}
function ModelCoverageChip({ cov, onClick }) {
  if (cov.total === 0) return <span className="own2-cov own2-cov-empty">no models</span>;
  const tone = cov.ownerSet === cov.total ? 'emerald' : cov.ownerSet === 0 ? 'rose' : 'amber';
  return (
    <button className={'own2-cov own2-cov-' + tone} onClick={onClick} title="Drill into the Semantic models tab filtered to this workspace">
      Model coverage <b>{cov.ownerSet} of {cov.total}</b> {tone === 'emerald' ? '✓' : tone === 'rose' ? '⚠' : '⚠'}
    </button>
  );
}

/* ── ModelOwnership — the per-model tab (consumed by Model.jsx) ── */
export function ModelOwnership({ modelName, workspace }) {
  const m = DATA.documents.pickerModels.find(p => p.name === modelName && (!workspace || p.ws === workspace));
  const owner = m ? resolveModelOwner(m.name, m.ws) : null;
  const sme = m ? resolveModelSme(m.id) : null;
  const stewards = m ? resolveModelStewards(m.id) : [];
  return (
    <div className="own2-modeltab fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="lp-section-head"><h2>Ownership &amp; Stewardship</h2><span className="lp-eyebrow">Per-model role tags · simple tagging (no inheritance)</span></div>
      <div className="lp-grid-4">
        <div className="lp-card" style={{ padding: 18 }}>
          <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Owner</div>
          {owner ? <><div style={{ fontWeight: 600 }}>{owner.name}</div><div className="mono" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{owner.email}</div>{owner.title && <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{owner.title}</div>}</> : <em style={{ color: 'oklch(0.55 0.20 25)' }}>Missing — tag an owner</em>}
        </div>
        <div className="lp-card" style={{ padding: 18 }}>
          <div className="lp-eyebrow" style={{ marginBottom: 6 }}>SME</div>
          {sme ? <><div style={{ fontWeight: 600 }}>{sme.name}</div><div className="mono" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{sme.userEmail}</div></> : <em style={{ color: 'oklch(0.55 0.20 25)' }}>None tagged</em>}
        </div>
        <div className="lp-card" style={{ padding: 18, gridColumn: 'span 2' }}>
          <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Stewards <span className="mono">{stewards.length}</span></div>
          {stewards.length === 0 ? <em style={{ color: 'oklch(0.55 0.20 25)' }}>None tagged</em> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{stewards.map(s => <span key={s.userEmail} className="badge tone-violet-soft" style={{ fontSize: 11.5 }}>{s.name || s.userEmail}</span>)}</div>}
        </div>
      </div>
      <p className="doc-p doc-p-sub">Tagging is direct — there's no workspace-default inheritance or override. To bulk-apply across this workspace's models, use the workspace row's <code className="mono">⚙</code> on /ownership.</p>
    </div>
  );
}

/* ── RolePanel — compact summary used on the model overview ── */
export function RolePanel({ modelName, workspace, onEdit }) {
  const m = DATA.documents.pickerModels.find(p => p.name === modelName && (!workspace || p.ws === workspace));
  const owner = m ? resolveModelOwner(m.name, m.ws) : null;
  const sme = m ? resolveModelSme(m.id) : null;
  const stewards = m ? resolveModelStewards(m.id) : [];
  return (
    <div className="lp-card" style={{ padding: 14 }}>
      <div className="lp-section-head" style={{ margin: 0 }}>
        <h2 style={{ fontSize: 13.5 }}>Ownership</h2>
        {onEdit && <a onClick={onEdit} style={{ fontSize: 12, cursor: 'pointer' }}>Edit →</a>}
      </div>
      <div className="own2-row-roles" style={{ marginTop: 10 }}>
        <RoleChip label="Owner"   name={owner?.name}/>
        <RoleChip label="SME"     name={sme?.name}/>
        <RoleChip label="Steward" name={stewards.length === 0 ? null : stewards.length === 1 ? stewards[0].name : `${stewards.length} tagged`}/>
      </div>
    </div>
  );
}

/* ── Drawer (light) ── */
function OwnershipDrawer({ drawer, onClose }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const isWs = drawer.kind === 'tag-ws';
  const isModel = drawer.kind === 'tag-model';
  const title = isWs ? `Tag roles · ${drawer.ws}` : isModel ? 'Tag roles · this model' : 'Tag owner';

  return (
    <div className="usr-sheet-overlay" onClick={onClose}>
      <div className="usr-sheet" onClick={e => e.stopPropagation()}>
        <div className="usr-sheet-head">
          <div className="pf-sheet-icon"><Icon name="shield" size={20}/></div>
          <div style={{ flex: 1 }}>
            <div className="usr-sheet-upn" style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 600 }}>{title}</div>
            <div className="usr-sheet-name mono">{isWs ? 'Workspace · Owner + Primary contact' : isModel ? 'Model · Owner + SME + Steward' : 'Pick a workspace or model'}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><Icon name="close" size={16}/></button>
        </div>
        <div className="usr-sheet-body">
          <p className="doc-p doc-p-sub" style={{ marginTop: 0 }}>
            {isWs && 'Tag the workspace owner (accountable) and an optional primary contact (operational/escalation). The workspace owner can also be applied to all this workspace\'s models in one action (bulk shortcut).'}
            {isModel && 'Tag the model\'s Owner (accountable), SME (business expert), and Stewards (data quality / maintenance — multiple allowed).'}
          </p>
          <div className="empty" style={{ padding: 18, marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mockup form</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>The full tag-roles form is wired LP-side via <code className="mono">/build-feature</code> from the design-brief PRD. Closing the drawer.</div>
          </div>
        </div>
        <div className="usr-sheet-foot">
          <div style={{ flex: 1 }}/>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
