import React from 'react';
import Icon from './Icon';
import DATA from './data';

// Shared capacity-scope selector — used in the page-head top-right of every page
// where the underlying KPIs / lists are capacity-attributable.
// Visual matches the /workspaces head-pill style (ws-cap-* classes).
export function CapacityScopeSelector({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const capacities = DATA.workspaces.capacities;
  const selected = capacities.find(c => c.id === value);
  React.useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    const t = setTimeout(() => window.addEventListener('click', h), 0);
    return () => { clearTimeout(t); window.removeEventListener('click', h); };
  }, [open]);
  return (
    <div className="ws-cap-wrap ws-cap-wrap-head" onClick={e => e.stopPropagation()}>
      <button className={'ws-cap-btn' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}>
        <span className={'ws-cap-dot' + (value === 'all' ? '' : ' active')}/>
        <span className="ws-cap-name">{value === 'all' ? 'All capacities' : selected?.name}</span>
        {value !== 'all' && selected && <span className="badge badge-outline ws-cap-sku">{selected.sku}</span>}
        {value === 'all' && <span className="ws-cap-count mono">{capacities.length}</span>}
        <Icon name="chevron-down" size={12}/>
      </button>
      {open && (
        <div className="ws-cap-pop ws-cap-pop-right">
          <div className="ws-cap-pop-head">CAPACITIES · {capacities.length}</div>
          <button className={'ws-cap-pop-row' + (value === 'all' ? ' active' : '')} onClick={() => { onChange('all'); setOpen(false); }}>
            <span className="ws-cap-pop-name">All capacities</span>
            {value === 'all' && <Icon name="check" size={13}/>}
          </button>
          {capacities.map(c => (
            <button key={c.id} className={'ws-cap-pop-row' + (value === c.id ? ' active' : '')} onClick={() => { onChange(c.id); setOpen(false); }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ws-cap-pop-name">{c.name} <span className="badge badge-outline ws-cap-sku-sm">{c.sku}</span></div>
                <div className="ws-cap-pop-sub mono">${c.monthlyCost.toLocaleString()}/mo · {c.region}</div>
              </div>
              {value === c.id && <Icon name="check" size={13}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatCard({ label, value, unit, sub, delta, icon, tone = 'sky', spark }) {
  return (
    <div className="lp-card lp-stat">
      <div className={'lp-stat-tile tone-' + tone}><Icon name={icon} size={20}/></div>
      <div className="lp-stat-body">
        <div className="lp-eyebrow">{label}</div>
        <div className="lp-stat-value">{value}{unit && <span className="lp-stat-unit">{unit}</span>}</div>
        {(sub || delta != null) && (
          <div className="lp-stat-sub">
            {delta != null && <span className={'delta ' + (delta >= 0 ? 'up' : 'down')}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%</span>}
            {sub}
          </div>
        )}
      </div>
      {spark && <Sparkline data={spark} tone={tone}/>}
    </div>
  );
}

export function Sparkline({ data, tone = 'sky', w = 80, h = 28 }) {
  const color = {
    sky: 'oklch(0.69 0.17 237)', violet: 'oklch(0.62 0.16 275)',
    emerald: 'oklch(0.64 0.16 135)', amber: 'oklch(0.65 0.18 45)', rose: 'oklch(0.55 0.22 25)',
  }[tone];
  const min = Math.min(...data), max = Math.max(...data);
  const pad = (max - min) * 0.15 || 1;
  const lo = min - pad, hi = max + pad;
  const x = i => (i / (data.length - 1)) * w;
  const y = v => h - ((v - lo) / (hi - lo)) * h;
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  return (
    <svg className="lp-stat-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Badge({ children, tone = 'outline' }) {
  return <span className={'badge badge-' + tone}>{children}</span>;
}

export function EnvBadge({ env }) {
  return <span className={'badge badge-env-' + env.toLowerCase()}>{env}</span>;
}

export function Provenance({ level = 'silver' }) {
  const cfg = {
    bronze:   { bg: 'oklch(0.93 0.06 55)',  fg: 'oklch(0.45 0.14 55)' },
    silver:   { bg: 'oklch(0.93 0.005 250)', fg: 'oklch(0.42 0.01 250)' },
    gold:     { bg: 'oklch(0.94 0.08 85)',   fg: 'oklch(0.48 0.15 75)' },
    platinum: { bg: 'oklch(0.93 0.06 145)',  fg: 'oklch(0.38 0.14 145)' },
  }[level];
  return (
    <span className="provenance" style={{ background: cfg.bg, color: cfg.fg }}>
      <Icon name="shield-check" size={11}/>
      {level.charAt(0).toUpperCase() + level.slice(1)} fidelity
    </span>
  );
}

export function IssueCard({ id, severity, category, title, evidence, impact, impactTone, onClick }) {
  return (
    <button className="issue" onClick={onClick}>
      <div className="issue-tags">
        <Badge tone={'sev-' + severity}>{severity}</Badge>
        <Badge tone="outline">{category}</Badge>
        <span className="issue-code">{id}</span>
      </div>
      <div className="issue-title">{title}</div>
      {evidence && <div className="issue-evidence">{evidence}</div>}
      {impact && <div className={'issue-impact ' + (impactTone || 'info')}>{impact}</div>}
    </button>
  );
}

export function HealthRibbon({ composition, score }) {
  const tones = {
    sky:     'oklch(0.62 0.17 237)',
    violet:  'oklch(0.58 0.16 285)',
    emerald: 'oklch(0.58 0.15 150)',
    amber:   'oklch(0.66 0.16 62)',
    rose:    'oklch(0.60 0.20 20)',
  };
  return (
    <div>
      <div className="ribbon" role="img" aria-label="Health composition">
        {composition.map(c => (
          <div key={c.key} className="ribbon-slice"
            style={{ flex: c.weight, background: tones[c.tone] }}>
            <div className="ribbon-slice-label">{c.label}</div>
            <div className="ribbon-slice-val">{c.value}<span className="sub">× {c.weight}%</span></div>
          </div>
        ))}
      </div>
      <div className="ribbon-legend">
        <span className="sw"><span className="sw-mark" style={{ background: 'var(--muted)' }}/>width = weight</span>
        <span className="sw">height constant · saturation = dimension tone</span>
      </div>
    </div>
  );
}

export function Sidebar({ route, setRoute }) {
  const nav = [
    { group: 'Partner', items: [
      { key: 'portfolio', label: 'Portfolio', icon: 'layers', count: 12 },
    ]},
    { items: [{ key: 'overview', label: 'Overview', icon: 'dashboard' }] },
    { group: 'Explore', items: [
      { key: 'workspaces', label: 'Workspaces', icon: 'folders', count: 12 },
      { key: 'reports',    label: 'Reports & Apps', icon: 'file-text' },
      { key: 'lineage',    label: 'Lineage',    icon: 'git-branch' },
      { key: 'documents',  label: 'Documents',  icon: 'boxes' },
    ]},
    { group: 'FinOps', items: [
      { key: 'capacity', label: 'Capacity', icon: 'gauge' },
      { key: 'costs', label: 'Cost & Usage', icon: 'dollar' },
      { key: 'licenses', label: 'Licenses', icon: 'users' },
    ]},
    { group: 'User intelligence', items: [
      { key: 'users',     label: 'Users',     icon: 'users' },
      { key: 'users-new', label: 'Users (new sketch)', icon: 'users' },
      { key: 'adoption',  label: 'Adoption',  icon: 'activity' },
      { key: 'sleepers',  label: 'Sleepers',  icon: 'moon', count: 17 },
      { key: 'audit',     label: 'Audit',     icon: 'shield' },
    ]},
    { group: 'Governance', items: [
      { key: 'governance',      label: 'Governance',      icon: 'shield' },
      { key: 'access',          label: 'Access',          icon: 'users' },
      { key: 'activity',        label: 'Activity (LP)',   icon: 'activity' },
      { key: 'tenant-activity', label: 'Tenant Activity', icon: 'bar-chart' },
      { key: 'alerts',          label: 'Alerts',          icon: 'bell', live: true },
    ]},
  ];

  const top = route.split('/')[0];
  return (
    <aside className="lp-sidebar">
      <div className="lp-sidebar-line"/>
      <div className="lp-sidebar-dots"/>
      <div className="lp-sidebar-logo">
        <div className="lp-mark">L</div>
        <div className="lp-word">Layer<span>Pulse</span></div>
      </div>
      <div className="lp-tenant" onClick={() => {}}>
        <div className="t-dot"/>
        <div>
          <div className="t-name">{DATA.tenant.name}</div>
          <div className="t-sub">{DATA.tenant.env}</div>
        </div>
        <Icon name="chevron-down" size={14}/>
      </div>
      <nav className="lp-nav">
        {nav.map((sec, i) => (
          <div key={i}>
            {sec.group && <div className="lp-nav-group">{sec.group}</div>}
            {sec.items.map(item => (
              <button key={item.key}
                className={'lp-nav-item' + (top === item.key ? ' active' : '')}
                onClick={() => setRoute(item.key)}>
                <Icon name={item.icon} size={16}/>
                <span>{item.label}</span>
                {item.count != null && <span className="mini-count">{item.count}</span>}
                {item.live && <span className="dot-live"/>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="lp-sync">
        <div className="lp-sync-row">
          <span className="live"/>
          <span className="lp-sync-title">FUAM lakehouse</span>
        </div>
        <div className="lp-sync-meta">Last sync 4m ago · next ~26m</div>
      </div>
      <div className="lp-nav-footer">
        <button className={'lp-nav-item' + (top === 'settings' ? ' active' : '')} onClick={() => setRoute('settings')}>
          <Icon name="settings" size={16}/><span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export function Topbar({ crumbs, tenant, onTheme, theme, onTweaks }) {
  return (
    <div className="lp-topbar">
      <div className="lp-breadcrumb">
        <span className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'oklch(0.55 0.02 250)' }}>{tenant}</span>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span className="sep">/</span>
            {c.go ? <a onClick={c.go}>{c.label}</a> : <b>{c.label}</b>}
          </React.Fragment>
        ))}
      </div>
      <div className="lp-topbar-right">
        <div className="lp-search">
          <Icon name="search" size={14}/>
          <input placeholder="Search models, measures, tables…"/>
          <kbd>⌘K</kbd>
        </div>
        <button className="lp-iconbtn" title="Activity"><Icon name="activity" size={16}/></button>
        <button className="lp-iconbtn" title="Notifications"><Icon name="bell" size={16}/><span className="dot"/></button>
        <button className="lp-iconbtn" onClick={onTheme} title="Theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16}/>
        </button>
        <button className="lp-iconbtn" onClick={onTweaks} title="Tweaks"><Icon name="sliders" size={16}/></button>
        <div className="lp-avatar" title="MQ">MQ</div>
      </div>
    </div>
  );
}
