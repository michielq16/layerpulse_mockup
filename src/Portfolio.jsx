import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Sparkline, EnvBadge } from './components';

const DELTA_TONE = (n) => (n > 0 ? 'emerald' : n < 0 ? 'rose' : 'slate');
const DELTA_ARROW = (n) => (n > 0 ? '▲' : n < 0 ? '▼' : '–');

const SEV_BADGE = {
  critical: 'tone-rose-soft',
  warning:  'tone-amber-soft',
  info:     'tone-sky-soft',
};

export function Portfolio({ onActAsCustomer }) {
  const p = DATA.partnerPortfolio;
  const [search, setSearch] = React.useState('');
  const [bucket, setBucket] = React.useState('all');
  const [openCustomer, setOpenCustomer] = React.useState(null);

  const filtered = p.customers.filter(c => {
    if (search && !((c.name + ' ' + c.env).toLowerCase().includes(search.toLowerCase()))) return false;
    if (bucket === 'starred')   return !!c.star;
    if (bucket === 'throttle')  return c.throttling;
    if (bucket === 'declining') return c.healthDelta < 0;
    if (bucket === 'critical')  return c.topIssue?.sev === 'critical';
    return true;
  });

  const counts = {
    all:        p.customers.length,
    starred:    p.customers.filter(c => c.star).length,
    throttle:   p.customers.filter(c => c.throttling).length,
    declining:  p.customers.filter(c => c.healthDelta < 0).length,
    critical:   p.customers.filter(c => c.topIssue?.sev === 'critical').length,
  };

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">
            Portfolio
            <span className="badge badge-outline" style={{ marginLeft: 10, fontSize: 10, color: 'oklch(0.45 0.18 290)', borderColor: 'oklch(0.85 0.05 290)' }}>PARTNER</span>
          </h1>
          <p className="lp-page-sub">Every customer Fabric tenant where <b>{p.partner.name}</b> is partner-of-record. Health, spend, and risk across the entire book in one pane — no portal-hopping.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={13}/>Re-sync all</button>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={13}/>Export portfolio report</button>
          <button className="btn btn-sm"><Icon name="plus" size={13}/>Invite customer</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Customers" value={p.summary.customers} sub={p.summary.invitedPending + ' invited · pending'} icon="users" tone="sky"/>
        <StatCard label="Total spend / mo" value={'€' + p.summary.totalCUSpend.toLocaleString()} sub="aggregate across portfolio" icon="dollar" tone="emerald" spark={p.summary.spendSpark}/>
        <StatCard label="Throttling now" value={p.summary.throttlingNow} sub={p.summary.throttlingNow > 0 ? 'live alert · revisit capacity' : 'no active throttling'} icon="alert-triangle" tone={p.summary.throttlingNow > 0 ? 'rose' : 'sky'}/>
        <StatCard label="Aggregate Health" value={p.summary.aggregateHealth} unit="/100" delta={p.summary.healthDelta} sub={p.summary.criticalIssues + ' critical issues open'} icon="activity" tone={p.summary.healthDelta < 0 ? 'amber' : 'emerald'}/>
      </div>

      {/* Customer grid filter row */}
      <div className="lp-section-head" style={{ marginTop: 18 }}>
        <h2>Customers <span className="count">{filtered.length} of {p.customers.length}</span></h2>
        <div className="actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="lp-search" style={{ width: 220 }}>
            <Icon name="search" size={13}/>
            <input placeholder="Search customer or env…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="chip-row">
            {[['all','All',counts.all],['starred','★',counts.starred],['throttle','Throttling',counts.throttle],['declining','Declining',counts.declining],['critical','Critical',counts.critical]].map(([k,l,n]) => (
              <button key={k} className={'chip' + (bucket === k ? ' active' : '')} onClick={() => setBucket(k)}>
                {l}<span className="count">{n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pf-grid fade-in d2">
        {filtered.map(c => <CustomerCard key={c.id} c={c} onOpen={() => setOpenCustomer(c)}/>)}
        {filtered.length === 0 && (
          <div className="empty pf-empty">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No customers match.</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Clear the filter or search above.</div>
          </div>
        )}
      </div>

      {/* Worst-N movement — QBR / outbound-call ammo */}
      <div className="lp-section-head" style={{ marginTop: 24 }}>
        <h2>Worst movers · week-over-week <span className="count">5</span></h2>
        <span className="lp-eyebrow">The list to work through first</span>
      </div>
      <div className="lp-card lp-card-flush fade-in d3">
        <div className="pf-mov-head">
          <div>Customer</div>
          <div>Health Δ</div>
          <div>Cost Δ</div>
          <div>Wasted Δ</div>
          <div>Top action</div>
          <div></div>
        </div>
        {p.worstMovement.map(m => (
          <div key={m.id} className="pf-mov-row">
            <div className="pf-mov-name">
              <div className="pf-mov-name-line">{m.name}</div>
              <div className="mono pf-mov-env">{m.env}</div>
            </div>
            <div className={'mono pf-mov-delta tone-' + DELTA_TONE(m.healthDelta) + '-fg'}>
              {DELTA_ARROW(m.healthDelta)} {m.healthDelta > 0 ? '+' : ''}{m.healthDelta} pts
            </div>
            <div className={'mono pf-mov-delta tone-' + DELTA_TONE(-m.costDeltaPct) + '-fg'} title="Cost up = bad for the partner narrative">
              {DELTA_ARROW(m.costDeltaPct)} {m.costDeltaPct > 0 ? '+' : ''}{m.costDeltaPct}%
            </div>
            <div className={'mono pf-mov-delta tone-' + DELTA_TONE(-m.wastedSpendDelta) + '-fg'}>
              {m.wastedSpendDelta > 0 ? '+€' + m.wastedSpendDelta : m.wastedSpendDelta < 0 ? '–€' + Math.abs(m.wastedSpendDelta) : '€0'}
            </div>
            <div className="pf-mov-action">{m.topAction}</div>
            <button className="btn btn-outline btn-sm" onClick={() => onActAsCustomer && onActAsCustomer(m.id)}>{m.cta} →</button>
          </div>
        ))}
      </div>

      {/* F-2 activity feed */}
      <div className="lp-section-head" style={{ marginTop: 24 }}>
        <h2>F-2 activity <span className="count">last 5 days</span></h2>
        <span className="lp-eyebrow">Invitations · access changes · capacity events</span>
      </div>
      <div className="lp-card lp-card-flush fade-in d4">
        {p.f2Activity.map(ev => (
          <div key={ev.id} className="pf-act-row">
            <span className={'pf-act-dot tone-' + ev.tone + '-soft'}>
              <Icon name={ev.icon} size={12}/>
            </span>
            <div className="pf-act-customer">{ev.customer}</div>
            <div className="pf-act-detail">{ev.detail}</div>
            <span className="pf-act-time mono" title={ev.atAbs}>{ev.at}</span>
          </div>
        ))}
      </div>

      {openCustomer && <CustomerSheet c={openCustomer} onClose={() => setOpenCustomer(null)} onActAs={() => { onActAsCustomer && onActAsCustomer(openCustomer.id); setOpenCustomer(null); }}/>}
    </>
  );
}

function CustomerCard({ c, onOpen }) {
  const delta = c.healthDelta;
  const sevB = c.topIssue ? SEV_BADGE[c.topIssue.sev] : null;
  return (
    <button className={'pf-card' + (c.throttling ? ' pf-card-throttle' : '') + (c.topIssue?.sev === 'critical' ? ' pf-card-critical' : '')} onClick={onOpen}>
      <div className="pf-card-head">
        <div className="pf-card-name">
          {c.star && <Icon name="star" size={11} style={{ color: 'oklch(0.65 0.18 75)' }}/>}
          <span>{c.name}</span>
        </div>
        <EnvBadge env={c.tier}/>
      </div>

      <div className="pf-card-stats">
        <div className="pf-card-stat">
          <div className="pf-card-stat-val mono">{c.health}<span className="pf-card-stat-unit">/100</span></div>
          <div className="pf-card-stat-lbl">
            Health
            {delta !== 0 && <span className={'pf-card-delta mono tone-' + DELTA_TONE(delta) + '-fg'}>{DELTA_ARROW(delta)} {delta > 0 ? '+' : ''}{delta}</span>}
          </div>
        </div>
        <div className="pf-card-stat">
          <div className="pf-card-stat-val mono">{c.currency}{c.monthlySpend.toLocaleString()}</div>
          <div className="pf-card-stat-lbl">Monthly spend</div>
        </div>
      </div>

      <div className="pf-card-spark">
        {c.cuPercent === 0
          ? <span className="pf-card-spark-empty">visibility blocked</span>
          : <>
              <Sparkline data={c.cuSpark} tone={c.throttling ? 'rose' : c.cuPercent > 80 ? 'amber' : 'sky'} w={120} h={24}/>
              <span className="mono pf-card-cu">{c.cuPercent}%</span>
            </>}
      </div>

      {c.topIssue ? (
        <div className="pf-card-issue">
          <span className={'badge ' + sevB} style={{ fontSize: 9.5, height: 18, padding: '0 6px' }}>{c.topIssue.sev}</span>
          <span className="pf-card-issue-text">{c.topIssue.text}</span>
        </div>
      ) : (
        <div className="pf-card-issue pf-card-issue-ok">
          <span className="badge tone-emerald-soft" style={{ fontSize: 9.5, height: 18, padding: '0 6px' }}>healthy</span>
          <span className="pf-card-issue-text muted">No open critical findings</span>
        </div>
      )}

      <div className="pf-card-foot">
        <span className="muted mono">sync {c.lastSync}</span>
        <span className="pf-card-cta">Open <Icon name="arrow-right" size={11}/></span>
      </div>
    </button>
  );
}

function CustomerSheet({ c, onClose, onActAs }) {
  const sevB = c.topIssue ? SEV_BADGE[c.topIssue.sev] : null;
  const delta = c.healthDelta;
  return (
    <div className="usr-sheet-overlay" onClick={onClose}>
      <div className="usr-sheet pf-sheet" onClick={e => e.stopPropagation()}>
        <div className="usr-sheet-head">
          <div className="pf-sheet-icon">
            <Icon name="folders" size={20}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="usr-sheet-upn" style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 600 }}>{c.name}</div>
            <div className="usr-sheet-name mono">{c.env} · {c.region}</div>
          </div>
          {c.throttling && <span className="badge tone-rose-soft" style={{ marginRight: 8 }}><Icon name="alert" size={11}/>Throttling</span>}
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><Icon name="close" size={16}/></button>
        </div>

        <div className="usr-sheet-body">
          <div className="lp-grid-4">
            <StatCard label="Health Score"  value={c.health}        unit="/100" delta={delta} icon="activity" tone={c.health > 75 ? 'emerald' : c.health > 55 ? 'amber' : 'rose'}/>
            <StatCard label="Monthly spend" value={c.currency + c.monthlySpend.toLocaleString()} sub="this month" icon="dollar" tone="sky"/>
            <StatCard label="Capacity util" value={c.cuPercent + '%'} sub={c.cuPercent > 80 ? 'P95 high · risk of throttle' : 'within budget'} icon="gauge" tone={c.cuPercent > 80 ? 'amber' : 'sky'}/>
            <StatCard label="Last synced"   value={c.lastSync}      sub={c.lastSync === '3d ago' ? 'visibility may be stale' : 'live'} icon="refresh" tone={c.lastSync.includes('d') ? 'amber' : 'emerald'}/>
          </div>

          {c.topIssue && (
            <>
              <div className="lp-section-head" style={{ marginTop: 16 }}>
                <h2>Top open issue</h2>
                <span className="lp-eyebrow">From this customer's Issues feed</span>
              </div>
              <div className="lp-card pf-sheet-issue">
                <span className={'badge ' + sevB}>{c.topIssue.sev}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.topIssue.text}</span>
              </div>
            </>
          )}

          <div className="lp-section-head" style={{ marginTop: 16 }}>
            <h2>Capacity · 7 days</h2>
            <span className="lp-eyebrow">{c.tier} · {c.region}</span>
          </div>
          <div className="lp-card" style={{ padding: 18 }}>
            {c.cuPercent === 0 ? (
              <div className="empty" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No telemetry — partner-read access has been revoked.</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Re-invite this customer to restore visibility. See F-2 activity feed for the revocation event.</div>
              </div>
            ) : (
              <Sparkline data={c.cuSpark} tone={c.throttling ? 'rose' : c.cuPercent > 80 ? 'amber' : 'sky'} w={640} h={64}/>
            )}
          </div>
        </div>

        <div className="usr-sheet-foot">
          <button className="btn btn-outline btn-sm"><Icon name="external" size={13}/>Open in customer overview</button>
          <button className="btn btn-outline btn-sm"><Icon name="bell" size={13}/>Watch this customer</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm" onClick={onActAs}>
            <Icon name="arrow-right" size={13}/>Act as {c.name}
          </button>
        </div>
      </div>
    </div>
  );
}
