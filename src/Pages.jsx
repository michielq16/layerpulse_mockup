import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { Badge } from './components';

export function AreaChart({ data, threshold }) {
  const W = 760, H = 220, P = 24;
  const lo = 0, hi = 100;
  const x = i => P + (i * (W - 2*P)) / (data.length - 1);
  const y = v => H - P - ((v - lo) / (hi - lo)) * (H - 2*P);
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.v)}`).join(' ');
  const area = line + ` L ${x(data.length - 1)} ${H - P} L ${x(0)} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="cap-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0,0.25,0.5,0.75,1].map(f => (
        <line key={f} x1={P} x2={W-P} y1={P + f*(H-2*P)} y2={P + f*(H-2*P)} stroke="oklch(0.92 0.005 250)" strokeDasharray="2 3" strokeWidth="1"/>
      ))}
      <line x1={P} x2={W-P} y1={y(threshold)} y2={y(threshold)} stroke="oklch(0.55 0.22 25)" strokeDasharray="4 4" strokeWidth="1.2"/>
      <text x={W-P} y={y(threshold)-5} textAnchor="end" fontSize="10" fill="oklch(0.55 0.22 25)" fontFamily="JetBrains Mono">{threshold}% threshold</text>
      <path d={area} fill="url(#cap-grad)"/>
      <path d={line} fill="none" stroke="oklch(0.69 0.17 237)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function Alerts() {
  const [rules, setRules] = React.useState([
    { type: 'Capacity above threshold',       threshold: '85%',           last: '2h ago',  enabled: true, icon: 'gauge', tone: 'amber' },
    { type: 'Refresh failed',                 threshold: 'any',           last: '14h ago', enabled: true, icon: 'refresh', tone: 'rose' },
    { type: 'Health score drop',              threshold: '−10 pts / 24h', last: 'never',   enabled: false, icon: 'activity', tone: 'sky' },
    { type: 'Doc coverage below target',      threshold: '80%',           last: '3d ago',  enabled: true, icon: 'file-text', tone: 'emerald' },
    { type: 'New Import model > 50M rows',    threshold: '50,000,000',    last: '1d ago',  enabled: true, icon: 'database', tone: 'violet' },
    { type: 'Undocumented measure created',   threshold: 'any',           last: '6h ago',  enabled: false, icon: 'bell', tone: 'amber' },
  ]);
  const toggle = i => setRules(rs => rs.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r));
  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Alerts</h1>
          <p className="lp-page-sub">Tell me what's wrong, not what's normal.</p>
        </div>
        <button className="btn btn-sm fade-in d2"><Icon name="plus" size={14}/>New rule</button>
      </div>
      <div className="lp-card lp-card-flush fade-in">
        {rules.map((r, i) => (
          <div key={r.type} className="alert-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={'lp-stat-tile tone-' + r.tone} style={{ width: 34, height: 34 }}><Icon name={r.icon} size={16}/></span>
              <div>
                <div className="alert-title">{r.type}</div>
                <div className="alert-meta">threshold {r.threshold} · last fired {r.last}</div>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={r.enabled} onChange={() => toggle(i)}/>
              <span/>
            </label>
          </div>
        ))}
      </div>
    </>
  );
}

export function Settings() {
  const [saved, setSaved] = React.useState(false);
  const submit = e => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Settings</h1>
          <p className="lp-page-sub">Service principal, FUAM workspace, and data collection.</p>
        </div>
      </div>
      <form className="lp-card fade-in" onSubmit={submit} style={{ maxWidth: 760 }}>
        <div className="lp-card-header">
          <div>
            <div className="lp-card-title">Service principal credentials</div>
            <div className="lp-card-sub">Stored encrypted. Used to authenticate against Fabric REST.</div>
          </div>
          <Badge tone="outline"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.58 0.15 150)' }}/>Connected · 3 capacities</Badge>
        </div>
        <div className="form-grid">
          <label>Tenant ID<input className="input" defaultValue="sbm.onmicrosoft.com"/></label>
          <label>Client ID<input className="input" defaultValue="8a76d2f1-3b2c-41e7-a6d9-4c92ef8d2136"/></label>
          <label>Client secret<input className="input" type="password" defaultValue="••••••••••••••••"/></label>
          <label>FUAM workspace<input className="input" defaultValue="FUAM-Prod"/></label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginTop: 18 }}>
          {saved && <span style={{ color: 'oklch(0.50 0.15 145)', fontSize: 12, fontWeight: 500 }}>✓ saved</span>}
          <button className="btn btn-outline btn-sm" type="button">Test connection</button>
          <button className="btn btn-sm">Save credentials</button>
        </div>
      </form>

      <div className="lp-section-head"><h2>Billing</h2></div>
      <div className="lp-card fade-in d2" style={{ maxWidth: 760 }}>
        <div className="lp-card-header">
          <div><div className="lp-card-title">Free plan</div><div className="lp-card-sub">Upgrade to unlock more models and AI runs.</div></div>
          <button className="btn btn-sm"><Icon name="zap" size={12}/>Upgrade</button>
        </div>
        {[
          { l: 'Semantic models tracked', v: 3, max: 3 },
          { l: 'AI analyses used',        v: 44, max: 100 },
          { l: 'Docs generated',          v: 18, max: 100 },
        ].map(r => (
          <div key={r.l} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 90px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13 }}>{r.l}</div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--muted)' }}>
              <div style={{ width: (r.v / r.max * 100) + '%', height: '100%', borderRadius: 999, background: r.v >= r.max ? 'oklch(0.55 0.22 25)' : 'oklch(0.69 0.17 237)' }}/>
            </div>
            <div className="num" style={{ fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{r.v}/{r.max}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function DrillSheet({ issue, onClose }) {
  if (!issue) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <aside className="sheet">
        <div className="sheet-head">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone={'sev-' + issue.severity}>{issue.severity}</Badge>
            <Badge tone="outline">{issue.category}</Badge>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-foreground)' }}>{issue.id}</span>
          </div>
          <button className="sheet-close" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="sheet-body">
          <h2 style={{ fontSize: 20, margin: '0 0 10px', fontWeight: 600, letterSpacing: '-0.01em' }}>{issue.title}</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 18px' }}>{issue.evidence}</p>

          <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Root cause</div>
          <div className="lp-card" style={{ padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Sales Model refresh pulls all <code style={{ background: 'var(--muted)', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>FactSales</code> rows on every run.</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>42% of 7-day CU · peak Tue–Thu 08:00–10:00</div>
          </div>

          <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Affected objects (3)</div>
          <div className="lp-card lp-card-flush" style={{ marginBottom: 16 }}>
            <table className="lp-table">
              <thead><tr><th>Measure</th><th>DAX</th><th style={{ width: 90 }}>Complexity</th></tr></thead>
              <tbody>
                <tr><td className="name"><Icon name="bar-chart" size={12}/>Total Sales</td><td className="num muted" style={{ fontSize: 11 }}>SUM(FactSales[Amount])</td><td><Badge tone="sev-info">Simple</Badge></td></tr>
                <tr><td className="name"><Icon name="bar-chart" size={12}/>YTD Revenue</td><td className="num muted" style={{ fontSize: 11 }}>CALCULATE(...)</td><td><Badge tone="sev-critical">High</Badge></td></tr>
                <tr><td className="name"><Icon name="bar-chart" size={12}/>Gross Margin</td><td className="num muted" style={{ fontSize: 11 }}>DIVIDE(...)</td><td><Badge tone="sev-warning">Medium</Badge></td></tr>
              </tbody>
            </table>
          </div>

          <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Recommendation</div>
          <div style={{ padding: 14, borderRadius: 10, background: 'oklch(0.96 0.04 237)', border: '1px solid oklch(0.80 0.1 237 / 0.3)', fontSize: 13, marginBottom: 16 }}>
            <Icon name="wand" size={14}/> &nbsp;Schedule refresh outside 08:00–10:00 window and enable incremental refresh on FactSales.
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6 }}>Est. savings: ~€182/month</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm"><Icon name="external" size={12}/>View in model</button>
            <button className="btn btn-outline btn-sm"><Icon name="dollar" size={12}/>Cost breakdown</button>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>Dismiss</button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function TweaksPanel({ state, set, onClose }) {
  return (
    <div className="tw-panel">
      <div className="tw-head">
        <Icon name="sliders" size={14}/>
        <span className="title">Tweaks</span>
        <span className="mono">prototype</span>
        <button className="tw-close" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      <div className="tw-body">
        <div className="tw-section-label">Theme</div>
        <div className="tw-btn-row">
          <button className={state.theme === 'light' ? 'active' : ''} onClick={() => set({ theme: 'light' })}>Light</button>
          <button className={state.theme === 'dark' ? 'active' : ''} onClick={() => set({ theme: 'dark' })}>Dark</button>
        </div>

        <div className="tw-section-label">Density</div>
        <div className="tw-btn-row">
          <button className={state.density === 'comfortable' ? 'active' : ''} onClick={() => set({ density: 'comfortable' })}>Comfortable</button>
          <button className={state.density === 'compact' ? 'active' : ''} onClick={() => set({ density: 'compact' })}>Compact</button>
        </div>

        <div className="tw-section-label">Accent</div>
        <div className="tw-swatches">
          {[
            ['sky', 'oklch(0.69 0.17 237)'],
            ['violet', 'oklch(0.62 0.16 275)'],
            ['emerald', 'oklch(0.58 0.15 150)'],
          ].map(([k, c]) => (
            <button key={k} className={'tw-swatch ' + (state.accent === k ? 'active' : '')} style={{ background: c }} onClick={() => set({ accent: k })}/>
          ))}
        </div>
      </div>
    </div>
  );
}
