import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard } from './components';

export function Documents() {
  const [q, setQ] = React.useState('');
  const [ws, setWs] = React.useState('all');
  const [status, setStatus] = React.useState('all');

  const allWs = Array.from(new Set(DATA.documents.items.map(d => d.ws)));
  const items = DATA.documents.items.filter(d =>
    (q === '' || d.model.toLowerCase().includes(q.toLowerCase()) || d.type.toLowerCase().includes(q.toLowerCase())) &&
    (ws === 'all' || d.ws === ws) &&
    (status === 'all' || d.status === status)
  );

  const s = DATA.documents.stats;
  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Documents</h1>
          <p className="lp-page-sub">Every document generated for every scanned model. Sourced from the last scan snapshot.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Regenerate all</button>
          <button className="btn btn-sm"><Icon name="plus" size={14}/>New document</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Documented models" value={s.modelsDocumented} unit="/34" icon="file-text" tone="emerald"/>
        <StatCard label="Total documents"   value={s.total}           icon="folders"    tone="sky"/>
        <StatCard label="Outdated"          value={s.outdated}         icon="alert-triangle" tone="amber" sub="Model changed since generation"/>
        <StatCard label="Storage used"      value={s.storage}          icon="database"   tone="violet"/>
      </div>

      <div className="lp-section-head">
        <h2>Library <span className="count">{items.length} of {DATA.documents.items.length}</span></h2>
      </div>

      <div className="lp-card lp-card-flush" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search documents, models, types…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <select className="input input-sm" value={ws} onChange={e => setWs(e.target.value)}>
            <option value="all">All workspaces</option>
            {allWs.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <div className="chip-row">
            {[['all','All'],['current','Current'],['outdated','Outdated']].map(([k,l]) => (
              <button key={k} className={'chip' + (status === k ? ' active' : '')} onClick={() => setStatus(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="doc-list fade-in d2">
        {items.map(d => (
          <div key={d.id} className="doc-row">
            <div className="doc-icon" style={{
              background: `var(--modern-icon-bg-${d.tone})`,
              color:      `var(--modern-icon-fg-${d.tone})`,
            }}>
              <Icon name="file-text" size={18}/>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="doc-title">
                {d.model}
                <span className={'doc-status ' + d.status}>
                  <span className="dot"/>{d.status === 'current' ? 'Current' : 'Outdated'}
                </span>
              </div>
              <div className="doc-meta">
                <span>{d.type}</span>
                <span className="sep">·</span>
                <span className="mono">{d.ws}</span>
                <span className="sep">·</span>
                <span>{d.tables}t · {d.measures}m</span>
                <span className="sep">·</span>
                <span>{d.docs} documents</span>
                <span className="sep">·</span>
                <span>updated {d.updated}</span>
                <span className="sep">·</span>
                <span className="mono">{d.size}</span>
              </div>
            </div>
            <div className="doc-actions">
              <button className="btn btn-ghost btn-sm" title="View"><Icon name="external" size={14}/></button>
              <button className="btn btn-ghost btn-sm" title="Regenerate"><Icon name="refresh" size={14}/></button>
              <button className="btn btn-outline btn-sm">Download</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="empty">No documents match your filters.</div>}
      </div>
    </>
  );
}

export function Governance() {
  const [filter, setFilter] = React.useState('all');
  const [open, setOpen] = React.useState({});
  const g = DATA.governance;
  const counts = {
    all: g.findings.length,
    critical: g.findings.filter(f => f.sev === 'critical').length,
    warning:  g.findings.filter(f => f.sev === 'warning').length,
    info:     g.findings.filter(f => f.sev === 'info').length,
  };
  const findings = filter === 'all' ? g.findings : g.findings.filter(f => f.sev === filter);

  const R = 46, C = 2 * Math.PI * R;

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Governance</h1>
          <p className="lp-page-sub">Tenant compliance against your governance policy. Evaluated hourly against {g.settingsCount} admin settings.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Open Fabric admin</button>
          <button className="btn btn-sm"><Icon name="refresh" size={14}/>Re-evaluate</button>
        </div>
      </div>

      <div className="gov-hero fade-in">
        <div className="gov-score">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="10"/>
            <circle cx="60" cy="60" r={R} fill="none"
              stroke="oklch(0.65 0.18 45)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - g.score / 100)}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="58" textAnchor="middle" fontSize="28" fontWeight="700" fontFamily="JetBrains Mono" fill="var(--foreground)">{g.score}</text>
            <text x="60" y="76" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--muted-foreground)">/ 100</text>
          </svg>
        </div>
        <div className="gov-hero-meta">
          <div className="lp-eyebrow">Compliance score</div>
          <div className="gov-hero-line">
            <b>{g.compliantRules}</b> of <b>{g.totalRules}</b> rules compliant · evaluating <b>{g.settingsCount}</b> settings
          </div>
          <div className="gov-pill-row">
            <span className="gov-pill gov-pill-crit"><b>{counts.critical}</b> critical</span>
            <span className="gov-pill gov-pill-warn"><b>{counts.warning}</b> warning</span>
            <span className="gov-pill gov-pill-info"><b>{counts.info}</b> info</span>
          </div>
          <div className="gov-bar">
            <div className="gov-bar-seg crit" style={{ width: (counts.critical / counts.all * 100) + '%' }} title={`${counts.critical} critical`}/>
            <div className="gov-bar-seg warn" style={{ width: (counts.warning / counts.all * 100) + '%' }} title={`${counts.warning} warning`}/>
            <div className="gov-bar-seg info" style={{ width: (counts.info / counts.all * 100) + '%' }} title={`${counts.info} info`}/>
          </div>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Findings <span className="count">{findings.length}</span></h2>
        <span className="seg-tabs">
          {[['all','All ' + counts.all],['critical','Critical ' + counts.critical],['warning','Warning ' + counts.warning],['info','Info ' + counts.info]].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </span>
      </div>

      <div className="lp-card lp-card-flush fade-in d2">
        {findings.map(f => (
          <div key={f.id} className={'gov-row gov-sev-' + f.sev}>
            <button className="gov-row-main" onClick={() => setOpen(o => ({ ...o, [f.id]: !o[f.id] }))}>
              <span className={'sev-mark sev-' + f.sev} aria-hidden/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="gov-row-title">{f.title}</div>
                <div className="gov-row-meta">
                  <span className="mono">{f.id}</span>
                  <span className="sep">·</span>
                  <span>{f.cat}</span>
                  <span className="sep">·</span>
                  <span className={'sev-label ' + f.sev}>{f.sev}</span>
                </div>
              </div>
              <Icon name={open[f.id] ? 'chevron-up' : 'chevron-down'} size={14}/>
            </button>
            {open[f.id] && (
              <div className="gov-row-detail">
                <div className="lp-eyebrow">Detail</div>
                <div className="gov-detail-text">{f.detail}</div>
                <div className="lp-eyebrow" style={{ marginTop: 10 }}>Recommendation</div>
                <div className="gov-recommend"><Icon name="wand" size={13}/>{f.recommend}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-sm"><Icon name="external" size={12}/>Fix in admin portal</button>
                  <button className="btn btn-outline btn-sm">Mark as accepted risk</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="lp-section-head">
        <h2>All settings <span className="count">{g.settingsCount} in {g.categories.length} categories</span></h2>
        <div className="actions">
          <button className="btn btn-ghost btn-sm">Expand all</button>
        </div>
      </div>

      <div className="lp-card lp-card-flush fade-in d3">
        {g.categories.map(cat => (
          <div key={cat.name} className="gov-cat">
            <Icon name="chevron-right" size={14}/>
            <div className="gov-cat-name">{cat.name}</div>
            <div className="gov-cat-bar">
              <div className="gov-cat-fill" style={{ width: (cat.enabled / cat.total * 100) + '%' }}/>
            </div>
            <div className="gov-cat-count mono">{cat.enabled}/{cat.total} enabled</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function Activity() {
  const [filter, setFilter] = React.useState('all');
  const s = DATA.activity.stats;

  const typeIcon = { scan: 'refresh', doc: 'file-text', ai: 'wand', alert: 'alert-triangle', resolve: 'check' };
  const allItems = DATA.activity.items.map(day => ({
    ...day,
    day: day.day.filter(i => filter === 'all' || i.type === filter),
  })).filter(day => day.day.length > 0);

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Activity</h1>
          <p className="lp-page-sub">Audit log of every scan, doc generation, AI analysis, and resolution across your environment.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Scans this week"  value={s.scans}    icon="refresh"   tone="sky"/>
        <StatCard label="Documents"        value={s.docs}     icon="file-text" tone="emerald"/>
        <StatCard label="AI analyses"      value={s.ai}       icon="wand"      tone="violet"/>
        <StatCard label="Issues resolved"  value={s.resolved} icon="check"     tone="amber"/>
      </div>

      <div className="lp-section-head">
        <h2>Timeline</h2>
        <span className="seg-tabs">
          {[['all','All'],['scan','Scans'],['doc','Documents'],['ai','AI'],['resolve','Resolved']].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </span>
      </div>

      <div className="fade-in d2">
        {allItems.map(day => (
          <div key={day.date} className="act-day">
            <div className="act-day-head">
              <div className="act-day-date">{day.date}</div>
              <div className="act-day-count">{day.day.length}</div>
              <div className="act-day-line"/>
            </div>
            <div className="act-items">
              {day.day.map((it, idx) => (
                <div key={idx} className="act-item">
                  <span className={'act-dot tone-' + it.tone}>
                    <Icon name={typeIcon[it.type] || 'activity'} size={12}/>
                  </span>
                  <div className="act-text">
                    <span className="act-actor">{it.actor}</span>
                    <span>{it.verb.toLowerCase()}</span>
                    <span className="act-target">{it.target}</span>
                  </div>
                  <span className="act-meta mono">{it.meta}</span>
                  <span className="act-ago">{it.ago}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {allItems.length === 0 && <div className="empty">No activity of that type yet.</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button className="btn btn-outline btn-sm">Load more</button>
      </div>
    </>
  );
}
