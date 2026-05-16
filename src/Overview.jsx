import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Provenance, IssueCard, HealthRibbon, EnvBadge } from './components';

export function Overview({ onOpenIssue, onGoWorkspace }) {
  const o = DATA.overview;

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Environment Overview</h1>
          <p className="lp-page-sub">
            Cost, quality, refresh, and security — one story.{' '}
            <span className="mono">Last sync 4m ago · F64 / west-europe</span>
          </p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Provenance level="silver"/>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={14}/>Re-sync</button>
          <button className="btn btn-sm"><Icon name="wand" size={14}/>Generate report</button>
        </div>
      </div>

      <div className="lp-grid-4">
        <div className="fade-in d1"><StatCard label="Health Score" value="74" unit="/100" delta={+3} sub="vs last week" icon="activity" tone="sky" spark={o.trend}/></div>
        <div className="fade-in d2"><StatCard label="CU Spend (24h)" value="12.4" unit="k" delta={+8} sub="vs prev 24h" icon="dollar" tone="violet" spark={[10,11,11.2,11,11.5,12,12.1,12.4,12.2,12.4]}/></div>
        <div className="fade-in d3"><StatCard label="Capacity Util." value="62" unit="%" sub="P95: 88% · 3 throttle events" icon="gauge" tone="amber"/></div>
        <div className="fade-in d4"><StatCard label="Doc Coverage" value="78" unit="%" delta={-2} sub="142 of 182 measures" icon="file-text" tone="emerald"/></div>
      </div>

      <div className="lp-section-head">
        <h2>Health composition <span className="count">5 weighted dimensions</span></h2>
        <span className="lp-eyebrow">F64-prod-we</span>
      </div>

      <div className="lp-grid-money fade-in d2">
        <div className="lp-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="score-hero">
            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 8 }}>Composite health</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <div className="score-hero-num">74</div>
                <span className="score-hero-unit">/ 100</span>
                <span className="score-delta"><Icon name="trend-up" size={12}/> +3 pts · 7d</span>
              </div>
              <div className="score-label">Silver fidelity · weighted by your governance policy</div>
            </div>
            <svg className="score-trend-line" viewBox="0 0 300 60" width="100%" height="60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad-score" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="oklch(0.69 0.17 237)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {(() => {
                const d = o.trend, mx = Math.max(...d), mn = Math.min(...d);
                const xs = (i) => (i / (d.length - 1)) * 300;
                const ys = (v) => 55 - ((v - mn) / (mx - mn || 1)) * 50;
                const line = d.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(v)}`).join(' ');
                const area = line + ` L 300 60 L 0 60 Z`;
                return <>
                  <path d={area} fill="url(#grad-score)"/>
                  <path d={line} stroke="oklch(0.69 0.17 237)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </>;
              })()}
            </svg>
          </div>
        </div>
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Contribution to score</div>
              <div className="lp-card-sub">Width = weight · colour = dimension · number = raw score</div>
            </div>
          </div>
          <HealthRibbon composition={o.composition} score={o.health}/>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {o.composition.map(c => (
              <div key={c.key} style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>
                  +{Math.round(c.value * c.weight / 100)}
                </div>
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Top issues <span className="count">{o.issuesOpen} open</span></h2>
        <div className="actions">
          <span className="seg-tabs">
            <button className="seg-tab active">All</button>
            <button className="seg-tab">Critical</button>
            <button className="seg-tab">Warning</button>
            <button className="seg-tab">Info</button>
          </span>
        </div>
      </div>
      <div className="lp-grid-2">
        {o.topIssues.map((iss, i) => (
          <div key={iss.id} className={'fade-in d' + (i + 1)}>
            <IssueCard {...iss} onClick={() => onOpenIssue(iss)}/>
          </div>
        ))}
        {DATA.licenses && DATA.licenses.mfaCoverage < 0.95 && (
          <div className="fade-in">
            <IssueCard
              id="SEC-MFA"
              severity="warning"
              category="Security"
              title={<>{DATA.licenses.mfaMissing} users missing MFA — including {DATA.licenses.mfaMissingList?.filter(u => u.admin).length || 0} admins</>}
              evidence={`Only ${Math.round(DATA.licenses.mfaCoverage * 100)}% MFA coverage across ${DATA.licenses.mfaTotal} principals`}
              impact="Access risk"
              impactTone="warning"
              onClick={() => {}}
            />
          </div>
        )}
      </div>

      <div className="lp-section-head">
        <h2>Workspace spotlight <span className="count">top 4 by CU</span></h2>
        <a className="lp-eyebrow" style={{ cursor: 'pointer' }} onClick={() => onGoWorkspace()}>View all 12 →</a>
      </div>
      <div className="lp-grid-4">
        {DATA.workspaces.items.slice(0, 4).map((w, i) => (
          <div key={w.id} className={'fade-in d' + (i + 1)}>
            <WorkspaceCard ws={w} onClick={() => onGoWorkspace(w.id)}/>
          </div>
        ))}
      </div>
    </>
  );
}

export function WorkspaceCard({ ws, onClick }) {
  return (
    <div className="ws-card" onClick={onClick}>
      <div className="ws-card-head">
        <div className="ws-card-icon" style={{
          background: `var(--modern-icon-bg-${ws.iconTone})`,
          color: `var(--modern-icon-fg-${ws.iconTone})`,
        }}>
          <Icon name="folder" size={18}/>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="ws-card-title">{ws.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
            <EnvBadge env={ws.env}/>
            {ws.health != null && (
              <span className="ws-card-sub" style={{ fontFamily: 'var(--font-mono)' }}>
                health {ws.health}
              </span>
            )}
          </div>
        </div>
        <button className={'ws-card-star' + (ws.star ? ' on' : '')} onClick={e => e.stopPropagation()}>
          <Icon name="star" size={16}/>
        </button>
      </div>
      <div className="ws-card-stats">
        <div className="ws-card-stat"><div className="k">{ws.models}</div><div className="l">Models</div></div>
        <div className="ws-card-stat"><div className="k">{ws.tables}</div><div className="l">Tables</div></div>
        <div className="ws-card-stat"><div className="k">{ws.measures}</div><div className="l">Measures</div></div>
      </div>
      <div className="ws-card-footer">
        <span>scanned {ws.scanned}</span>
        {ws.scanCta
          ? <span className="arr">Scan now <Icon name="zap" size={12}/></span>
          : <span className="arr">Open <Icon name="arrow-right" size={12}/></span>}
      </div>
    </div>
  );
}
