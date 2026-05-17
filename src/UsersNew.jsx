import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Sparkline } from './components';
import { Avatar } from './UserIntel';

const RISK_META = {
  rose:  { label: 'High',   tone: 'rose'    },
  amber: { label: 'Medium', tone: 'amber'   },
  sky:   { label: 'OK',     tone: 'sky'     },
};

const LICENSE_TONE = {
  'PPU':       'violet',
  'Pro':       'sky',
  'Free':      'slate',
  'Fabric F1': 'emerald',
};

// Merge `users.top` with `usersNew.ext` and append `usersNew.extras`.
function buildRoster() {
  const base = DATA.users.top.map(u => {
    const ext = DATA.usersNew.ext[u.id] || {};
    return { ...u, ...ext };
  });
  const extras = (DATA.usersNew.extras || []).map(x => ({
    // Minimal shim so cards/sheet don't crash on extras that lack the rich activity payload.
    cu: 0, cost: 0, queries: 0, copilot: 0, copilotRate: 0,
    spark: Array.from({ length: 14 }, () => 0),
    email: x.upn, status: 'normal',
    ...x,
  }));
  return [...base, ...extras];
}

export function UsersNew({ onOpenLegacyUser }) {
  const roster = React.useMemo(buildRoster, []);
  const s = DATA.usersNew.summary;

  const [q, setQ] = React.useState('');
  const [lic, setLic] = React.useState('all');
  const [activity, setActivity] = React.useState('all');
  const [risk, setRisk] = React.useState('all');
  const [sort, setSort] = React.useState('risk');
  const [openUser, setOpenUser] = React.useState(null);

  const filtered = roster.filter(u => {
    if (q && !((u.upn + ' ' + u.name + ' ' + u.dept).toLowerCase().includes(q.toLowerCase()))) return false;
    if (lic !== 'all' && u.licenseSku !== lic) return false;
    if (risk !== 'all' && u.risk !== risk) return false;
    const days = parseLastActiveDays(u.lastActive);
    if (activity === 'active'    && days > 30)            return false;
    if (activity === 'dormant30' && !(days >= 30 && days < 60)) return false;
    if (activity === 'dormant60' && days < 60)            return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'risk')     return riskWeight(b.risk) - riskWeight(a.risk);
    if (sort === 'cost')     return (b.licenseCost || 0) - (a.licenseCost || 0);
    if (sort === 'dormant')  return parseLastActiveDays(b.lastActive) - parseLastActiveDays(a.lastActive);
    if (sort === 'upn')      return (a.upn || '').localeCompare(b.upn || '');
    return 0;
  });

  const licenseOpts = ['all', ...Array.from(new Set(roster.map(u => u.licenseSku)))];

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Users <span className="badge badge-outline" style={{ marginLeft: 10, fontSize: 10, letterSpacing: 0.05, color: 'oklch(0.45 0.18 290)', borderColor: 'oklch(0.85 0.05 290)' }}>NEW SKETCH</span></h1>
          <p className="lp-page-sub">UPN-first roster — license cost, adoption signal, and access risk for every identity in one row. Partners cherry-pick from this view; the legacy <a onClick={onOpenLegacyUser} style={{ color: 'oklch(0.55 0.18 237)', cursor: 'pointer', fontWeight: 500 }}>Users page</a> stays as-is.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
          <button className="btn btn-outline btn-sm"><Icon name="bell" size={14}/>Watch risk delta</button>
          <button className="btn btn-sm"><Icon name="shield-check" size={14}/>Review high-risk ({s.highRiskCount})</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Total seats"          value={s.seats.toLocaleString()}              sub="Licensed identities · all SKUs"  icon="users"        tone="sky"/>
        <StatCard label="Wasted licenses / mo" value={'€' + s.wastedLicensesCost.toLocaleString()} sub={s.wastedSeats + ' seats · 0 activity 30d'} icon="dollar"       tone="amber"/>
        <StatCard label="Admins"               value={s.admins}                              sub={s.adminsRatio + ' admins:members'} icon="shield"       tone="violet"/>
        <StatCard label="Access risk · high"   value={s.highRiskCount}                       sub="Dormant admin / over-priv / off-hours" icon="alert-triangle" tone="rose"/>
      </div>

      <div className="lp-card lp-card-flush fade-in d2" style={{ padding: 14, marginTop: 18, marginBottom: 14 }}>
        <div className="usr-filters">
          <div className="lp-search" style={{ flex: 1, minWidth: 280 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search by UPN, name, or department…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <div className="chip-row">
            {[['all','All',roster.length],
              ['rose','High risk',roster.filter(u => u.risk === 'rose').length],
              ['amber','Medium',roster.filter(u => u.risk === 'amber').length],
              ['sky','OK',roster.filter(u => u.risk === 'sky').length]
            ].map(([k,l,n]) => (
              <button key={k} className={'chip' + (risk === k ? ' active' : '')} onClick={() => setRisk(k)}>
                {k !== 'all' && <span className={'usr-risk-dot tone-' + k + '-soft'}/>}
                {l}<span className="count">{n}</span>
              </button>
            ))}
          </div>
          <select className="input input-sm" value={lic} onChange={e => setLic(e.target.value)}>
            {licenseOpts.map(o => <option key={o} value={o}>{o === 'all' ? 'All licenses' : o}</option>)}
          </select>
          <select className="input input-sm" value={activity} onChange={e => setActivity(e.target.value)}>
            <option value="all">Any activity</option>
            <option value="active">Active (≤30d)</option>
            <option value="dormant30">Dormant 30–60d</option>
            <option value="dormant60">Dormant 60d+</option>
          </select>
          <select className="input input-sm" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="risk">Sort: Risk first</option>
            <option value="cost">Sort: License $</option>
            <option value="dormant">Sort: Most dormant</option>
            <option value="upn">Sort: UPN A–Z</option>
          </select>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Roster <span className="count">{sorted.length} of {roster.length}</span></h2>
        <span className="lp-eyebrow">Click a row to drill down · UPN is the primary identifier</span>
      </div>

      <div className="lp-card lp-card-flush fade-in d3">
        <div className="usr-head">
          <div>User</div>
          <div>License</div>
          <div>Last active</div>
          <div>Workspaces 30d</div>
          <div>Admin roles</div>
          <div>Access risk</div>
          <div/>
        </div>
        {sorted.map(u => {
          const lt = LICENSE_TONE[u.licenseSku] || 'slate';
          const days = parseLastActiveDays(u.lastActive);
          const dormantClass = days > 60 ? ' val-rose' : days > 30 ? ' val-amber' : '';
          const riskMeta = RISK_META[u.risk] || RISK_META.sky;
          return (
            <button key={u.id} className={'usr-row' + (u.risk === 'rose' ? ' usr-row-rose' : '')} onClick={() => setOpenUser(u)}>
              <div className="usr-id">
                <Avatar name={u.name}/>
                <div style={{ minWidth: 0 }}>
                  <div className="usr-upn mono" title={u.upn}>{u.upn}</div>
                  <div className="usr-name-line">{u.name} · <span className="muted">{u.role} · {u.dept}</span></div>
                </div>
              </div>
              <div>
                <span className={'badge tone-' + lt + '-soft'} style={{ fontSize: 10, fontWeight: 600 }}>{u.licenseSku}</span>
                <div className="mono usr-lic-cost">€{u.licenseCost || 0}/mo</div>
              </div>
              <div title={u.lastActiveAbs} className={'usr-last mono' + dormantClass}>{u.lastActive} ago</div>
              <div className="mono">{u.ws30d}</div>
              <div className="usr-admin">
                {u.adminCount > 0
                  ? <><Icon name="shield" size={12}/><span className="mono">{u.adminCount}</span></>
                  : <span className="muted mono">0</span>}
              </div>
              <div>
                <span className={'usr-risk-pill tone-' + riskMeta.tone + '-soft'}>
                  <span className="usr-risk-dot solid"/>
                  {riskMeta.label}
                </span>
                {u.riskReasons?.length > 0 && (
                  <div className="usr-risk-reason" title={u.riskReasons.join(' · ')}>{u.riskReasons[0]}</div>
                )}
              </div>
              <Icon name="chevron-right" size={14} className="usr-arrow"/>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="empty" style={{ padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No users match.</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Loosen the filters above, or clear search.</div>
          </div>
        )}
      </div>

      {openUser && <UserSheet user={openUser} onClose={() => setOpenUser(null)}/>}
    </>
  );
}

function UserSheet({ user, onClose }) {
  const [tab, setTab] = React.useState('overview');
  const u = user;
  const riskMeta = RISK_META[u.risk] || RISK_META.sky;

  return (
    <div className="usr-sheet-overlay" onClick={onClose}>
      <div className="usr-sheet" onClick={e => e.stopPropagation()}>
        <div className="usr-sheet-head">
          <Avatar name={u.name} size={48}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="usr-sheet-upn mono">{u.upn}</div>
            <div className="usr-sheet-name">{u.name} · <span className="muted">{u.role} · {u.dept}</span></div>
          </div>
          <span className={'usr-risk-pill tone-' + riskMeta.tone + '-soft'} style={{ marginRight: 6 }}>
            <span className="usr-risk-dot solid"/>{riskMeta.label} risk
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><Icon name="close" size={16}/></button>
        </div>

        <div className="model-tabs" style={{ paddingLeft: 18, paddingRight: 18, marginBottom: 0 }}>
          {[['overview','Overview','activity'],['permissions','Permissions','shield'],['activity','Activity','bar-chart'],['risk','Risk', 'alert-triangle']].map(([k,l,ic]) => (
            <button key={k} className={'model-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
              <Icon name={ic} size={13}/>{l}
              {k === 'risk' && u.riskReasons?.length > 0 && <span className="model-tab-count mono" style={{ background: 'oklch(0.93 0.07 25)', color: 'oklch(0.45 0.18 25)' }}>{u.riskReasons.length}</span>}
            </button>
          ))}
        </div>

        <div className="usr-sheet-body">
          {tab === 'overview' && <OverviewTab u={u}/>}
          {tab === 'permissions' && <PermissionsTab u={u}/>}
          {tab === 'activity' && <ActivityTab u={u}/>}
          {tab === 'risk' && <RiskTab u={u}/>}
        </div>

        <div className="usr-sheet-foot">
          <button className="btn btn-outline btn-sm"><Icon name="external" size={13}/>Open in Entra</button>
          <button className="btn btn-outline btn-sm"><Icon name="bell" size={13}/>Watch this user</button>
          <div style={{ flex: 1 }}/>
          {(u.licenseCost > 0 && parseLastActiveDays(u.lastActive) > 60) && (
            <button className="btn btn-sm" style={{ background: 'oklch(0.55 0.20 25)', color: '#fff' }}>
              <Icon name="x" size={13}/>Reclaim {u.licenseSku} (€{u.licenseCost}/mo)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ u }) {
  return (
    <>
      <div className="lp-grid-4">
        <StatCard label="License cost"     value={'€' + (u.licenseCost || 0)} unit="/mo" sub={u.licenseSku} icon="dollar" tone="sky"/>
        <StatCard label="Last active"      value={u.lastActive} sub={u.lastActiveAbs || ''} icon="activity" tone={parseLastActiveDays(u.lastActive) > 60 ? 'rose' : parseLastActiveDays(u.lastActive) > 30 ? 'amber' : 'emerald'}/>
        <StatCard label="Workspaces 30d"   value={u.ws30d} sub={(u.reports30d || 0) + ' reports viewed'} icon="folders" tone="violet"/>
        <StatCard label="Admin assignments" value={u.adminCount} sub={u.adminCount > 0 ? 'Direct role on workspaces' : '—'} icon="shield" tone={u.adminCount > 2 ? 'amber' : 'sky'}/>
      </div>

      {u.spark && u.cu > 0 && (
        <div className="lp-card" style={{ marginTop: 14 }}>
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Activity · 14 days</div>
              <div className="lp-card-sub">Daily query count · {u.queries.toLocaleString()} total this month</div>
            </div>
            <span className="lp-eyebrow">{Math.round(u.copilotRate * 100)}% Copilot</span>
          </div>
          <div style={{ padding: '8px 14px 14px' }}>
            <Sparkline data={u.spark} tone="sky" w={620} h={56}/>
          </div>
        </div>
      )}

      {(!u.spark || u.cu === 0) && (
        <div className="lp-card" style={{ marginTop: 14, padding: 28, textAlign: 'center', color: 'var(--muted-foreground)' }}>
          No activity in the last 30 days. {u.licenseCost > 0 ? `License cost still billing at €${u.licenseCost}/mo.` : ''}
        </div>
      )}
    </>
  );
}

function PermissionsTab({ u }) {
  // Pull real access map for u1 (the rich seed). For everyone else, render a plausible synthetic matrix.
  const access = DATA.userAccess?.[u.id] || DATA.userAccess?.default;
  const rows = collectMatrixRows(access, u);

  return (
    <>
      <div className="lp-section-head" style={{ marginTop: 0 }}>
        <h2>Workspace × role matrix <span className="count">{rows.length} grants</span></h2>
        <span className="lp-eyebrow">Direct + inherited (via security groups)</span>
      </div>
      <div className="lp-card lp-card-flush">
        <div className="usr-mtx-head">
          <div>Workspace</div>
          <div>Role</div>
          <div>Via</div>
          <div>Last used</div>
          <div>Reports / datasets</div>
        </div>
        {rows.length === 0 && <div className="empty" style={{ padding: 24 }}>No workspace assignments. This account is licensed but unattached — strong candidate for reclamation.</div>}
        {rows.map((r, i) => (
          <div key={i} className={'usr-mtx-row' + (r.risk ? ' usr-mtx-risk' : '')}>
            <div className="usr-mtx-ws"><Icon name="folders" size={12}/>{r.workspace}</div>
            <div><span className={'badge tone-' + roleTone(r.role) + '-soft'}>{r.role}</span></div>
            <div className="muted mono" style={{ fontSize: 11 }}>{r.via}</div>
            <div className="mono" style={{ fontSize: 11 }}>{r.lastUsed}</div>
            <div className="mono" style={{ fontSize: 11 }}>{r.reportsCount} / {r.datasetsCount}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ActivityTab({ u }) {
  const recent = DATA.userDetail.recent;
  return (
    <>
      <div className="lp-section-head" style={{ marginTop: 0 }}>
        <h2>Recent events <span className="count">last 7 events</span></h2>
        <span className="lp-eyebrow">Source: activity_events · forensic search available in Activity</span>
      </div>
      <div className="lp-card lp-card-flush">
        {u.queries === 0 && <div className="empty" style={{ padding: 24 }}>No events in retention window. The account may be inactive — check license and last sign-in in Entra.</div>}
        {u.queries > 0 && recent.map((r, i) => (
          <div key={i} className="recent-row">
            <span className={'act-dot tone-' + r.tone}>
              <Icon name={({ ViewReport:'bar-chart', AskCopilot:'wand', ExportData:'external', EditDataset:'settings', RefreshDataset:'refresh' })[r.op] || 'activity'} size={12}/>
            </span>
            <span className="recent-op mono">{r.op}</span>
            <span className="recent-target">{r.target}</span>
            <span className="recent-at mono">{r.at}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function RiskTab({ u }) {
  if (!u.riskReasons || u.riskReasons.length === 0) {
    return (
      <div className="lp-card" style={{ padding: 28, textAlign: 'center', color: 'var(--muted-foreground)' }}>
        <Icon name="shield-check" size={28}/>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>No risk signals.</div>
        <div style={{ marginTop: 4, fontSize: 12 }}>LayerPulse checks dormant-admin, over-privilege, export-heavy, and off-hours patterns nightly.</div>
      </div>
    );
  }
  return (
    <>
      <div className="lp-section-head" style={{ marginTop: 0 }}>
        <h2>Signals <span className="count">{u.riskReasons.length}</span></h2>
        <span className="lp-eyebrow">Composed nightly · evidence rows below each</span>
      </div>
      <div className="lp-card lp-card-flush">
        {u.riskReasons.map((r, i) => (
          <div key={i} className="usr-risk-card">
            <div className="usr-risk-card-head">
              <span className="usr-risk-dot solid amber"/>
              <div className="usr-risk-card-title">{r}</div>
              <span className="usr-risk-card-tag mono">RULE-{String(i + 1).padStart(3, '0')}</span>
            </div>
            <div className="usr-risk-card-evi">
              <Icon name="info" size={11}/>
              Evidence rows would render here — e.g. last 5 activity_events matching the rule, with timestamps + workspace IDs.
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── helpers ─────────────────────────────────────────────────────

function parseLastActiveDays(s) {
  if (!s) return 999;
  const m = String(s).match(/^(\d+(?:\.\d+)?)\s*([mhdw])/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === 'm') return n / (60 * 24);
  if (unit === 'h') return n / 24;
  if (unit === 'd') return n;
  if (unit === 'w') return n * 7;
  return 0;
}
function riskWeight(r) { return r === 'rose' ? 3 : r === 'amber' ? 2 : r === 'sky' ? 1 : 0; }
function roleTone(role) { return role === 'Admin' ? 'rose' : role === 'Contributor' ? 'amber' : role === 'Member' ? 'sky' : 'slate'; }

function collectMatrixRows(access, u) {
  const rows = [];
  if (access) {
    (access.direct || []).forEach(g => {
      rows.push({
        workspace: g.name, role: g.role, via: 'Direct',
        lastUsed: g.lastUsed || '—',
        reportsCount: g.reports?.length || 0,
        datasetsCount: g.datasets?.length || 0,
        risk: !!g.risk,
      });
    });
    (access.viaGroups || []).forEach(grp => {
      grp.grants.forEach(g => {
        rows.push({
          workspace: g.name, role: g.role, via: grp.group,
          lastUsed: g.lastUsed || '—',
          reportsCount: g.reports?.length || 0,
          datasetsCount: g.datasets?.length || 0,
          risk: !!g.risk,
        });
      });
    });
  }
  // For extras / users with no access map, fabricate something representative based on adminCount.
  if (rows.length === 0 && u.adminCount > 0) {
    for (let i = 0; i < Math.min(u.adminCount, 3); i++) {
      rows.push({
        workspace: ['Finance-Prod', 'Sales-Prod', 'Ops-Legacy-2022', 'Audit-2025', 'Marketing', 'BI-Sandbox', 'HR-Data', 'Shared-Reports'][i % 8],
        role: 'Admin', via: 'Direct',
        lastUsed: parseLastActiveDays(u.lastActive) > 60 ? '92d ago' : '4d ago',
        reportsCount: 0, datasetsCount: 0,
        risk: parseLastActiveDays(u.lastActive) > 60,
      });
    }
  }
  return rows;
}
