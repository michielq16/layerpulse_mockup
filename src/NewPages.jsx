import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard } from './components';

export function Documents() {
  const d = DATA.documents;
  const [selectedId, setSelectedId] = React.useState(d.pickerModels[0].id);
  const [pickerQ, setPickerQ] = React.useState('');
  const [pickerFilter, setPickerFilter] = React.useState('all');
  const [audience, setAudience] = React.useState('analyst');
  const [format, setFormat] = React.useState('docx');
  const [includeLogo, setIncludeLogo] = React.useState(true);
  const [customSel, setCustomSel] = React.useState(null);
  const [libQ, setLibQ] = React.useState('');

  const selected = d.pickerModels.find(m => m.id === selectedId) || d.pickerModels[0];

  const audienceDefaults = React.useMemo(() => {
    const set = new Set();
    d.sections.forEach(grp => grp.items.forEach(s => {
      if (s.audiences && s.audiences.includes(audience)) set.add(s.key);
    }));
    return set;
  }, [audience]);

  const activeSel = customSel != null ? customSel : audienceDefaults;
  const isOn = (k) => activeSel.has(k);
  const toggle = (k) => {
    const next = new Set(activeSel);
    if (next.has(k)) next.delete(k); else next.add(k);
    setCustomSel(next);
  };
  const resetToAudience = () => setCustomSel(null);

  const sectionCount = (s) => s.countKey ? (selected[s.countKey] || 0) : (s.count || 0);
  const selectedCount = d.sections.reduce((n, grp) => n + grp.items.filter(s => isOn(s.key)).length, 0);
  const totalItems = d.sections.reduce((n, grp) => n + grp.items.filter(s => isOn(s.key)).reduce((m, s) => m + sectionCount(s), 0), 0);
  const estPages = Math.max(3, Math.round(selectedCount * 1.4 + totalItems / 18));
  const estKB = Math.round(8 + selectedCount * 2.2 + totalItems * 0.12);

  const filteredPicker = d.pickerModels.filter(m =>
    (pickerQ === '' || m.name.toLowerCase().includes(pickerQ.toLowerCase()) || m.ws.toLowerCase().includes(pickerQ.toLowerCase())) &&
    (pickerFilter === 'all' || m.status === pickerFilter)
  );

  const libItems = d.items.filter(it =>
    libQ === '' || it.model.toLowerCase().includes(libQ.toLowerCase()) || it.ws.toLowerCase().includes(libQ.toLowerCase())
  );

  const previewSections = d.sections.flatMap(grp => grp.items.filter(s => isOn(s.key)).map(s => ({ ...s, count: sectionCount(s), group: grp.group })));

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Documents</h1>
          <p className="lp-page-sub">Auto-generate Word documents from any semantic model. Pick a model, choose what to include, preview, and ship to your auditor or new analyst in seconds.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Regenerate outdated</button>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Open library</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Models documented" value={d.stats.modelsDocumented} unit="/34" sub={Math.round(d.stats.modelsDocumented / 34 * 100) + '% coverage'} icon="file-text" tone="emerald"/>
        <StatCard label="Generated / 30d"   value={d.stats.generated30d}     icon="wand"      tone="sky"/>
        <StatCard label="Outdated"          value={d.stats.outdated}         sub="Model changed since gen" icon="alert-triangle" tone="amber"/>
        <StatCard label="Median gen time"   value={d.stats.medianGenSec}     unit="s" sub="across all models" icon="zap" tone="violet"/>
      </div>

      <div className="lp-section-head">
        <h2>Generate a document</h2>
        <span className="lp-eyebrow">3 steps · ~{d.stats.medianGenSec}s</span>
      </div>

      <div className="doc-gen-grid fade-in d2">
        {/* ── STEP 1: Model picker ── */}
        <div className="doc-gen-col doc-gen-pick">
          <div className="doc-gen-step"><span className="doc-gen-step-n">1</span>Pick a model</div>

          <div className="lp-search doc-pick-search">
            <Icon name="search" size={13}/>
            <input placeholder="Search models or workspaces…" value={pickerQ} onChange={e => setPickerQ(e.target.value)}/>
          </div>

          <div className="chip-row" style={{ marginBottom: 8 }}>
            {[['all','All',d.pickerModels.length],['outdated','Outdated',d.pickerModels.filter(m=>m.status==='outdated').length],['never','Never',d.pickerModels.filter(m=>m.status==='never').length]].map(([k,l,n]) => (
              <button key={k} className={'chip chip-sm' + (pickerFilter === k ? ' active' : '')} onClick={() => setPickerFilter(k)}>
                {l}<span className="count">{n}</span>
              </button>
            ))}
          </div>

          <div className="doc-pick-list">
            {filteredPicker.map(m => (
              <button key={m.id} className={'doc-pick-row' + (m.id === selectedId ? ' selected' : '')} onClick={() => { setSelectedId(m.id); setCustomSel(null); }}>
                <div className="doc-pick-icon" style={{
                  background: `var(--modern-icon-bg-${m.tone})`,
                  color:      `var(--modern-icon-fg-${m.tone})`,
                }}>
                  <Icon name="boxes" size={14}/>
                </div>
                <div className="doc-pick-main">
                  <div className="doc-pick-name">{m.name}</div>
                  <div className="doc-pick-meta">
                    <span className="mono">{m.ws}</span>
                    <span className="sep">·</span>
                    <span className="mono">{m.tables}t · {m.measures}m</span>
                  </div>
                </div>
                <span className={'doc-pick-stat doc-pick-stat-' + m.status}>
                  {m.status === 'current'  && <><span className="dot"/>Current</>}
                  {m.status === 'outdated' && <><span className="dot"/>Outdated</>}
                  {m.status === 'never'    && <><span className="dot"/>Never</>}
                </span>
              </button>
            ))}
            {filteredPicker.length === 0 && <div className="empty" style={{ padding: '20px 0', fontSize: 12 }}>No models match.</div>}
          </div>
        </div>

        {/* ── STEP 2: Sections + options ── */}
        <div className="doc-gen-col doc-gen-config">
          <div className="doc-gen-step"><span className="doc-gen-step-n">2</span>Choose sections</div>

          <div className="doc-aud-row">
            <div className="lp-eyebrow" style={{ marginBottom: 6 }}>Audience preset</div>
            <div className="doc-aud-tabs">
              {d.audiences.filter(a => a.key !== 'custom').map(a => (
                <button key={a.key} className={'doc-aud-tab' + (audience === a.key && customSel == null ? ' active' : '')} onClick={() => { setAudience(a.key); setCustomSel(null); }}>
                  <span className="doc-aud-label">{a.label}</span>
                  <span className="doc-aud-sub">{a.sub}</span>
                </button>
              ))}
            </div>
            {customSel != null && (
              <div className="doc-aud-custom">
                <span><Icon name="sliders" size={11}/> Custom selection — <b>{selectedCount} sections</b></span>
                <button className="btn btn-ghost btn-sm" onClick={resetToAudience}>Reset to {d.audiences.find(a=>a.key===audience).label}</button>
              </div>
            )}
          </div>

          <div className="doc-sections">
            {d.sections.map(grp => {
              const onCount = grp.items.filter(s => isOn(s.key)).length;
              return (
                <div key={grp.group} className="doc-section-grp">
                  <div className="doc-section-grp-head">
                    <span className="doc-section-grp-name">{grp.group}</span>
                    <span className="doc-section-grp-count mono">{onCount}/{grp.items.length}</span>
                  </div>
                  <div className="doc-section-grp-body">
                    {grp.items.map(s => {
                      const on = isOn(s.key);
                      const cnt = sectionCount(s);
                      return (
                        <label key={s.key} className={'doc-section-row' + (on ? ' on' : '')}>
                          <input type="checkbox" checked={on} onChange={() => toggle(s.key)}/>
                          <span className="doc-section-check"><Icon name="check" size={10}/></span>
                          <span className="doc-section-label">{s.label}</span>
                          {cnt > 0 && <span className="doc-section-count mono">{cnt}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="doc-options">
            <div className="doc-option-row">
              <span className="lp-eyebrow">Format</span>
              <div className="seg-tabs" style={{ marginLeft: 'auto' }}>
                {[['docx','.docx'],['pdf','.pdf'],['md','Markdown']].map(([k,l]) => (
                  <button key={k} className={'seg-tab' + (format === k ? ' active' : '')} onClick={() => setFormat(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="doc-option-row">
              <span className="lp-eyebrow">Cover</span>
              <label className="doc-toggle" style={{ marginLeft: 'auto' }}>
                <input type="checkbox" checked={includeLogo} onChange={e => setIncludeLogo(e.target.checked)}/>
                <span className="doc-toggle-track"><span className="doc-toggle-thumb"/></span>
                <span style={{ fontSize: 12 }}>Include partner logo</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── STEP 3: Preview + actions ── */}
        <div className="doc-gen-col doc-gen-preview">
          <div className="doc-gen-step"><span className="doc-gen-step-n">3</span>Preview & download</div>

          <div className="doc-preview-card">
            <div className="doc-preview-chrome">
              <div className="doc-preview-tabs">
                <span className="doc-preview-tab active">Page 1</span>
                <span className="doc-preview-tab">Page 2</span>
                <span className="doc-preview-tab">…</span>
                <span className="doc-preview-tab">Page {estPages}</span>
              </div>
              <span className="doc-preview-fmt mono">{format.toUpperCase()}</span>
            </div>
            <div className="doc-preview-page">
              {includeLogo && (
                <div className="doc-preview-header">
                  <div className="doc-preview-logo">L</div>
                  <span className="doc-preview-partner">LayerPulse · Contoso Fabric</span>
                </div>
              )}
              <div className="doc-preview-title">{selected.name}</div>
              <div className="doc-preview-sub">{d.audiences.find(a => a.key === audience).label} report · {selected.ws} · {selected.env}</div>
              <div className="doc-preview-rule"/>
              {previewSections.length === 0 && (
                <div className="doc-preview-empty">No sections selected. Pick at least one section in step 2 to see the document take shape.</div>
              )}
              {previewSections.slice(0, 8).map((s, i) => (
                <div key={s.key} className="doc-preview-section">
                  <div className="doc-preview-section-h">
                    <span className="doc-preview-section-n mono">{i + 1}.</span>
                    <span>{s.label}</span>
                    {s.count > 1 && <span className="doc-preview-section-c mono">{s.count}</span>}
                  </div>
                  <div className="doc-preview-section-lines">
                    <span style={{ width: '78%' }}/>
                    <span style={{ width: '64%' }}/>
                    <span style={{ width: '82%' }}/>
                  </div>
                </div>
              ))}
              {previewSections.length > 8 && (
                <div className="doc-preview-more">+ {previewSections.length - 8} more section{previewSections.length - 8 > 1 ? 's' : ''} on later pages</div>
              )}
            </div>
          </div>

          <div className="doc-est-strip">
            <div className="doc-est-cell">
              <div className="doc-est-k mono">{estPages}</div>
              <div className="doc-est-l">pages</div>
            </div>
            <div className="doc-est-cell">
              <div className="doc-est-k mono">~{estKB} KB</div>
              <div className="doc-est-l">size</div>
            </div>
            <div className="doc-est-cell">
              <div className="doc-est-k mono">~{Math.max(6, Math.round(selectedCount * 2))}s</div>
              <div className="doc-est-l">to generate</div>
            </div>
          </div>

          <div className="doc-gen-actions">
            <button className="btn btn-outline btn-sm" disabled={selectedCount === 0}><Icon name="external" size={13}/>Share link</button>
            <button className="btn btn-outline btn-sm" disabled={selectedCount === 0}><Icon name="refresh" size={13}/>Schedule weekly</button>
            <button className="btn doc-gen-cta" disabled={selectedCount === 0}>
              <Icon name="arrow-down" size={14}/>Generate .{format}
            </button>
          </div>

          {selected.status === 'outdated' && (
            <div className="doc-gen-hint">
              <Icon name="alert" size={12}/>
              <span>Last generated {selected.lastGen}. Model has changed since — regenerate to refresh.</span>
            </div>
          )}
          {selected.status === 'never' && (
            <div className="doc-gen-hint doc-gen-hint-info">
              <Icon name="info" size={12}/>
              <span>No prior document for this model. First generation will become the baseline.</span>
            </div>
          )}
        </div>
      </div>

      <div className="lp-section-head" style={{ marginTop: 28 }}>
        <h2>Recently generated <span className="count">{libItems.length} of {d.items.length}</span></h2>
        <div className="lp-search" style={{ width: 240 }}>
          <Icon name="search" size={13}/>
          <input placeholder="Search library…" value={libQ} onChange={e => setLibQ(e.target.value)}/>
        </div>
      </div>

      <div className="doc-list fade-in d3">
        {libItems.map(it => (
          <div key={it.id} className="doc-row">
            <div className="doc-icon" style={{
              background: `var(--modern-icon-bg-${it.tone})`,
              color:      `var(--modern-icon-fg-${it.tone})`,
            }}>
              <Icon name="file-text" size={18}/>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="doc-title">
                {it.model}
                <span className={'doc-status ' + it.status}>
                  <span className="dot"/>{it.status === 'current' ? 'Current' : 'Outdated'}
                </span>
              </div>
              <div className="doc-meta">
                <span>{it.type}</span>
                <span className="sep">·</span>
                <span className="mono">{it.ws}</span>
                <span className="sep">·</span>
                <span>{it.tables}t · {it.measures}m</span>
                <span className="sep">·</span>
                <span>updated {it.updated}</span>
                <span className="sep">·</span>
                <span className="mono">{it.size}</span>
              </div>
            </div>
            <div className="doc-actions">
              <button className="btn btn-ghost btn-sm" title="View"><Icon name="external" size={14}/></button>
              <button className="btn btn-ghost btn-sm" title="Regenerate"><Icon name="refresh" size={14}/></button>
              <button className="btn btn-outline btn-sm">Download</button>
            </div>
          </div>
        ))}
        {libItems.length === 0 && <div className="empty">No documents match. Generate one above to see it appear here.</div>}
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
