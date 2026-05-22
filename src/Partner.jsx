import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Sparkline, EnvBadge } from './components';

const P = () => DATA.partnerPortfolio;
const DELTA_TONE  = (n) => (n > 0 ? 'emerald' : n < 0 ? 'rose' : 'slate');
const DELTA_ARROW = (n) => (n > 0 ? '▲' : n < 0 ? '▼' : '–');
const healthTone  = (h) => (h >= 80 ? 'emerald' : h >= 60 ? 'amber' : 'rose');
const STATUS_TONE = { accepted: 'emerald', pending: 'sky', expired: 'amber', revoked: 'rose' };

function PageHead({ title, sub, actions }) {
  return (
    <div className="lp-page-head">
      <div className="fade-in">
        <h1 className="lp-page-title">{title}</h1>
        <p className="lp-page-sub">{sub}</p>
      </div>
      {actions && <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

/* ───────────────────────── Customers — triage table ───────────────────────── */
export function PartnerCustomers({ onActAs }) {
  const p = P();
  const [bucket, setBucket] = React.useState('all');
  const bm = Object.fromEntries(p.benchmarks.map(b => [b.id, b]));

  const rows = p.customers.filter(c => {
    if (bucket === 'throttle')  return c.throttling;
    if (bucket === 'declining') return c.healthDelta < 0;
    if (bucket === 'critical')  return c.topIssue?.sev === 'critical';
    return true;
  }).sort((a, b) => a.health - b.health); // worst first — the working order

  const counts = {
    all: p.customers.length,
    throttle: p.customers.filter(c => c.throttling).length,
    declining: p.customers.filter(c => c.healthDelta < 0).length,
    critical: p.customers.filter(c => c.topIssue?.sev === 'critical').length,
  };

  return (
    <>
      <PageHead title="Customers" sub={`Every Fabric tenant where ${p.partner.name} is partner-of-record — worst-health first. Click a row to act as that customer.`}
        actions={<><button className="btn btn-outline btn-sm"><Icon name="refresh" size={13}/>Re-sync all</button><button className="btn btn-sm"><Icon name="plus" size={13}/>Invite customer</button></>}/>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Customers" value={p.summary.customers} sub={p.summary.invitedPending + ' invited · pending'} icon="boxes" tone="sky"/>
        <StatCard label="Total spend / mo" value={'€' + p.summary.totalCUSpend.toLocaleString()} sub="aggregate across portfolio" icon="dollar" tone="emerald" spark={p.summary.spendSpark}/>
        <StatCard label="Declining" value={counts.declining} sub="health down week-over-week" icon="trend-down" tone={counts.declining > 0 ? 'amber' : 'sky'}/>
        <StatCard label="Critical" value={counts.critical} sub="open critical findings" icon="alert-triangle" tone={counts.critical > 0 ? 'rose' : 'sky'}/>
      </div>

      <div className="lp-section-head" style={{ marginTop: 18 }}>
        <h2>Triage <span className="count">{rows.length}</span></h2>
        <div className="chip-row">
          {[['all','All',counts.all],['critical','Critical',counts.critical],['declining','Declining',counts.declining],['throttle','Throttling',counts.throttle]].map(([k,l,n]) => (
            <button key={k} className={'chip' + (bucket === k ? ' active' : '')} onClick={() => setBucket(k)}>{l}<span className="count">{n}</span></button>
          ))}
        </div>
      </div>

      <div className="lp-card lp-card-flush fade-in d2">
        <div className="ptr-cust-head">
          <div>Customer</div><div>Health</div><div>Spend / mo</div><div>CU%</div><div>Wasted</div><div>Top issue</div><div>Sync</div><div></div>
        </div>
        {rows.map(c => {
          const b = bm[c.id] || {};
          const wasted = Math.round(c.monthlySpend * (b.wastedPct || 0) / 100);
          return (
            <div key={c.id} className="ptr-cust-row" onClick={() => onActAs && onActAs(c)}>
              <div className="ptr-cust-name">
                {c.star && <Icon name="star" size={11} style={{ color: 'oklch(0.65 0.18 75)' }}/>}
                <div>
                  <div className="ptr-cust-name-line">{c.name}</div>
                  <div className="mono ptr-cust-env">{c.env}</div>
                </div>
              </div>
              <div className={'mono ptr-health tone-' + healthTone(c.health) + '-fg'}>
                {c.health}{c.healthDelta !== 0 && <span className={'ptr-delta tone-' + DELTA_TONE(c.healthDelta) + '-fg'}>{DELTA_ARROW(c.healthDelta)}{Math.abs(c.healthDelta)}</span>}
              </div>
              <div className="mono">{c.currency}{c.monthlySpend.toLocaleString()}</div>
              <div className={'mono' + (c.cuPercent > 80 ? ' tone-rose-fg' : c.cuPercent === 0 ? ' tone-slate-fg' : '')}>{c.cuPercent === 0 ? '—' : c.cuPercent + '%'}</div>
              <div className="mono ptr-wasted">{wasted > 0 ? '€' + wasted.toLocaleString() : '—'}</div>
              <div className="ptr-cust-issue">{c.topIssue ? <><span className={'badge tone-' + (c.topIssue.sev === 'critical' ? 'rose' : c.topIssue.sev === 'warning' ? 'amber' : 'sky') + '-soft'} style={{ fontSize: 9.5, height: 17, padding: '0 5px' }}>{c.topIssue.sev}</span> <span className="ptr-cust-issue-t">{c.topIssue.text}</span></> : <span className="muted" style={{ fontSize: 12 }}>healthy</span>}</div>
              <div className={'mono ptr-sync' + (c.lastSync.includes('d') ? ' tone-amber-fg' : '')}>{c.lastSync}</div>
              <div><span className="ptr-actas">Act as <Icon name="arrow-right" size={11}/></span></div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ───────────────────────── Connections — invitation lifecycle ───────────────────────── */
export function PartnerConnections() {
  const { funnel, invitations } = P().connections;
  const [status, setStatus] = React.useState('all');
  const rows = invitations.filter(i => status === 'all' || i.status === status);
  const stages = [['sent','Sent','sky'],['accepted','Accepted','emerald'],['pending','Pending','sky'],['expired','Expired','amber'],['revoked','Revoked','rose']];
  return (
    <>
      <PageHead title="Connections" sub="The partner-of-record invitation lifecycle. Track who's connected, chase what's pending, restore what's been revoked."
        actions={<button className="btn btn-sm"><Icon name="plus" size={13}/>New invitation</button>}/>

      <div className="ptr-funnel fade-in">
        {stages.map(([k, l, tone], i) => (
          <React.Fragment key={k}>
            <div className={'ptr-funnel-stage tone-' + tone + '-soft'}>
              <div className="mono ptr-funnel-n">{funnel[k]}</div>
              <div className="ptr-funnel-l">{l}</div>
            </div>
            {i < stages.length - 1 && <div className="ptr-funnel-arrow">›</div>}
          </React.Fragment>
        ))}
      </div>

      <div className="lp-section-head" style={{ marginTop: 22 }}>
        <h2>Invitations <span className="count">{rows.length}</span></h2>
        <div className="chip-row">
          {[['all','All'],['accepted','Accepted'],['pending','Pending'],['expired','Expired'],['revoked','Revoked']].map(([k,l]) => (
            <button key={k} className={'chip' + (status === k ? ' active' : '')} onClick={() => setStatus(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="lp-card lp-card-flush fade-in d2">
        <div className="ptr-inv-head"><div>Customer</div><div>Invited email</div><div>Status</div><div>Sent</div><div>By</div><div>Last event</div><div></div></div>
        {rows.map(iv => (
          <div key={iv.id} className="ptr-inv-row">
            <div className="ptr-cust-name-line">{iv.customer}</div>
            <div className="mono ptr-inv-email">{iv.email}</div>
            <div><span className={'badge tone-' + STATUS_TONE[iv.status] + '-soft'}>{iv.status}</span>{iv.attempts > 1 && <span className="ptr-inv-attempts" title="resend attempts">·{iv.attempts}×</span>}</div>
            <div className="mono ptr-muted">{iv.sentAt}</div>
            <div className="ptr-muted">{iv.by}</div>
            <div className="ptr-muted ptr-inv-event">{iv.lastEvent}</div>
            <div>{iv.status === 'accepted' ? <span className="ptr-muted" style={{ fontSize: 12 }}>—</span> : <button className="btn btn-outline btn-sm">{iv.status === 'revoked' ? 'Re-invite' : iv.status === 'expired' ? 'Resend' : 'Nudge'} →</button>}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────────────────── Activity — portfolio event feed ───────────────────────── */
export function PartnerActivity() {
  const acts = P().f2Activity;
  return (
    <>
      <PageHead title="Activity" sub="Invitations, access changes, capacity events, and billing across the whole portfolio — newest first."
        actions={<button className="btn btn-outline btn-sm"><Icon name="external" size={13}/>Export CSV</button>}/>
      <div className="lp-card lp-card-flush fade-in">
        {acts.map(ev => (
          <div key={ev.id} className="pf-act-row">
            <span className={'pf-act-dot tone-' + ev.tone + '-soft'}><Icon name={ev.icon} size={12}/></span>
            <div className="pf-act-customer">{ev.customer}</div>
            <div className="pf-act-detail">{ev.detail}</div>
            <span className="pf-act-time mono" title={ev.atAbs}>{ev.at}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────────────────── Benchmarks — cross-customer comparison ───────────────────────── */
const DIMS = [
  { key: 'health',     label: 'Health score',   higher: true,  fmt: (v) => v,            unit: '/100' },
  { key: 'wastedPct',  label: 'Wasted spend',   higher: false, fmt: (v) => v,            unit: '%' },
  { key: 'docCov',     label: 'Doc coverage',   higher: true,  fmt: (v) => v,            unit: '%' },
  { key: 'costPerCu',  label: 'Cost per CU',    higher: false, fmt: (v) => '€' + v.toFixed(2), unit: '' },
  { key: 'refreshFail',label: 'Refresh fails',  higher: false, fmt: (v) => v,            unit: '/7d' },
];
export function Benchmarks() {
  const p = P();
  const [dim, setDim] = React.useState('health');
  const d = DIMS.find(x => x.key === dim);
  const names = Object.fromEntries(p.customers.map(c => [c.id, c.name]));
  const rows = [...p.benchmarks].map(b => ({ id: b.id, name: names[b.id] || b.id, v: b[dim] }))
    .sort((a, b) => d.higher ? b.v - a.v : a.v - b.v); // best first
  const max = Math.max(...rows.map(r => r.v));
  const tone = (i) => (i < rows.length / 3 ? 'emerald' : i < (rows.length * 2) / 3 ? 'amber' : 'rose');
  const median = rows[Math.floor(rows.length / 2)].v;

  return (
    <>
      <PageHead title="Benchmarks" sub="Compare every customer on one dimension. Best performers first; the bottom third is where the partner conversation starts."/>
      <div className="chip-row fade-in" style={{ marginBottom: 14 }}>
        {DIMS.map(x => <button key={x.key} className={'chip' + (dim === x.key ? ' active' : '')} onClick={() => setDim(x.key)}>{x.label}</button>)}
      </div>
      <div className="lp-card fade-in d2" style={{ padding: 20 }}>
        <div className="ptr-bm-cap">
          <span><b>{d.label}</b> · {d.higher ? 'higher is better' : 'lower is better'}</span>
          <span className="ptr-muted mono">median {d.fmt(median)}{d.unit}</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.id} className="ptr-bm-row">
            <div className="ptr-bm-rank mono">{i + 1}</div>
            <div className="ptr-bm-name">{r.name}</div>
            <div className="ptr-bm-track"><div className={'ptr-bm-fill tone-' + tone(i) + '-bar'} style={{ width: Math.max(4, (r.v / max) * 100) + '%' }}/></div>
            <div className="ptr-bm-val mono">{d.fmt(r.v)}{d.unit}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────────────────── Team & Seats ───────────────────────── */
export function TeamSeats({ onActAs }) {
  const p = P();
  const owned = new Set(p.team.members.flatMap(m => m.owns));
  const gaps = p.customers.filter(c => !owned.has(c.id));
  const nameOf = (id) => (p.customers.find(c => c.id === id) || {}).name || id;
  const ROLE_TONE = { Owner: 'violet', Admin: 'sky', Analyst: 'emerald' };

  return (
    <>
      <PageHead title="Team & Seats" sub="Who on your team watches which customers. Coverage gaps are where a customer has no owner — the partner-side of accountability."
        actions={<button className="btn btn-sm"><Icon name="plus" size={13}/>Invite teammate</button>}/>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Seats" value={`${p.billing.seatQuota.used}/${p.billing.seatQuota.total}`} sub="used · plan limit" icon="users" tone="sky"/>
        <StatCard label="Customers covered" value={p.customers.length - gaps.length} unit={'/' + p.customers.length} sub="have an assigned owner" icon="shield-check" tone="emerald"/>
        <StatCard label="Coverage gaps" value={gaps.length} sub={gaps.length ? 'no owner assigned' : 'fully covered'} icon="alert-triangle" tone={gaps.length ? 'rose' : 'emerald'}/>
        <StatCard label="Team members" value={p.team.members.length} sub="across roles" icon="users" tone="violet"/>
      </div>

      {gaps.length > 0 && (
        <div className="ptr-gap fade-in d2">
          <Icon name="alert-triangle" size={15}/>
          <span><b>{gaps.length} customer{gaps.length > 1 ? 's' : ''} with no owner:</b> {gaps.map(g => g.name).join(', ')}. Assign a teammate before the next review.</span>
        </div>
      )}

      <div className="lp-section-head" style={{ marginTop: 20 }}><h2>Team <span className="count">{p.team.members.length}</span></h2></div>
      <div className="ptr-team-grid fade-in d3">
        {p.team.members.map(m => (
          <div key={m.id} className="lp-card ptr-team-card">
            <div className="ptr-team-head">
              <span className="ptr-avatar">{m.initials}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ptr-team-name">{m.name}</div>
                <div className="mono ptr-muted ptr-team-email">{m.email}</div>
              </div>
              <span className={'badge tone-' + ROLE_TONE[m.role] + '-soft'}>{m.role}</span>
            </div>
            <div className="ptr-team-owns">
              <div className="ptr-team-owns-lbl">Owns {m.owns.length} · active {m.lastActive}</div>
              <div className="ptr-team-chips">{m.owns.map(id => <button key={id} className="ptr-owns-chip" onClick={() => onActAs && onActAs(p.customers.find(c => c.id === id))}>{nameOf(id)}</button>)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────────────────── QBR Builder (net-new) ───────────────────────── */
export function QbrBuilder() {
  const p = P();
  const [custId, setCustId] = React.useState(p.customers[0].id);
  const [sections, setSections] = React.useState(() => Object.fromEntries(p.qbrSections.map(s => [s.id, s.on])));
  const cust = p.customers.find(c => c.id === custId);
  const bm = p.benchmarks.find(b => b.id === custId) || {};
  const actions = p.fixFirst.filter(a => a.customerId === custId);
  const wasted = Math.round(cust.monthlySpend * (bm.wastedPct || 0) / 100);
  const on = (id) => sections[id];

  return (
    <>
      <PageHead title="QBR Builder" sub="Assemble a quarterly-business-review pack for one customer in seconds — pick the evidence, preview the one-pager, export."/>
      <div className="ptr-qbr">
        {/* Left: controls */}
        <div className="lp-card ptr-qbr-controls">
          <div className="ptr-qbr-field">
            <label>Customer</label>
            <select className="ptr-select" value={custId} onChange={e => setCustId(e.target.value)}>
              {p.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="ptr-qbr-field">
            <label>Sections</label>
            {p.qbrSections.map(s => (
              <label key={s.id} className="ptr-toggle">
                <input type="checkbox" checked={!!sections[s.id]} onChange={e => setSections(v => ({ ...v, [s.id]: e.target.checked }))}/>
                <span><span className="ptr-toggle-l">{s.label}</span><span className="ptr-toggle-d">{s.desc}</span></span>
              </label>
            ))}
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }}><Icon name="file-text" size={14}/>Export QBR pack (.docx)</button>
        </div>

        {/* Right: live preview */}
        <div className="ptr-qbr-preview">
          <div className="ptr-doc">
            <div className="ptr-doc-head">
              <div><div className="ptr-doc-kicker">QUARTERLY BUSINESS REVIEW · Q2 2026</div><div className="ptr-doc-title">{cust.name}</div><div className="ptr-doc-sub mono">{cust.env} · {cust.region} · prepared by {p.partner.name}</div></div>
              <span className={'ptr-doc-health tone-' + healthTone(cust.health) + '-soft'}>{cust.health}<span>/100</span></span>
            </div>

            {on('cost') && <Block title="Cost & share-of-bill">
              <div className="ptr-kpis"><K l="Monthly spend" v={cust.currency + cust.monthlySpend.toLocaleString()}/><K l="Capacity util" v={cust.cuPercent + '%'}/><K l="Cost per CU" v={'€' + (bm.costPerCu || 0).toFixed(2)}/></div>
            </Block>}

            {on('saved') && <Block title="Savings delivered this quarter">
              <p className="ptr-doc-p">Reclaimed <b>€{wasted.toLocaleString()}/mo</b> of wasted spend ({bm.wastedPct}% of bill) through dormant-report deprecation and SKU right-sizing. Annualized: <b>€{(wasted * 12).toLocaleString()}</b>.</p>
            </Block>}

            {on('risks') && <Block title="Risks closed & open">
              {actions.length ? <ul className="ptr-doc-list">{actions.slice(0, 4).map(a => <li key={a.id}><span className={'ptr-dot tone-' + (a.sev === 'critical' ? 'rose' : a.sev === 'warning' ? 'amber' : 'sky') + '-bar'}/>{a.what}</li>)}</ul> : <p className="ptr-doc-p ptr-muted">No open risks this quarter — clean bill of health.</p>}
            </Block>}

            {on('actions') && <Block title="Open recommendations">
              {actions.length ? <div className="ptr-doc-actions">{actions.map(a => <div key={a.id} className="ptr-doc-action"><span>{a.typeLabel}</span><span className="mono">{a.euroLabel}</span></div>)}</div> : <p className="ptr-doc-p ptr-muted">Queue clear.</p>}
            </Block>}

            {on('adoption') && <Block title="Adoption & engagement"><div className="ptr-kpis"><K l="Doc coverage" v={bm.docCov + '%'}/><K l="Refresh fails" v={(bm.refreshFail || 0) + '/7d'}/><K l="Health Δ" v={(cust.healthDelta > 0 ? '+' : '') + cust.healthDelta}/></div></Block>}

            {on('quality') && <Block title="Model quality & docs"><p className="ptr-doc-p">Health score <b>{cust.health}/100</b>, doc coverage <b>{bm.docCov}%</b>{bm.docCov < 60 ? ' — below the 60% target.' : ' — on target.'}</p></Block>}

            {on('next') && <Block title="Plan for next quarter">
              <ul className="ptr-doc-list">
                <li><span className="ptr-dot tone-sky-bar"/>{cust.cuPercent > 80 ? 'Capacity review — sustained high CU% risks throttling.' : 'Maintain current capacity; no scaling needed.'}</li>
                <li><span className="ptr-dot tone-sky-bar"/>{bm.docCov < 60 ? 'Lift doc coverage to 60% via auto-generated model docs.' : 'Keep doc coverage above target.'}</li>
              </ul>
            </Block>}
          </div>
        </div>
      </div>
    </>
  );
}
function Block({ title, children }) { return <div className="ptr-doc-block"><div className="ptr-doc-block-h">{title}</div>{children}</div>; }
function K({ l, v }) { return <div className="ptr-k"><div className="ptr-k-v mono">{v}</div><div className="ptr-k-l">{l}</div></div>; }

/* ───────────────────────── Billing & Settings ───────────────────────── */
export function PartnerBilling() {
  const b = P().billing;
  const Q = ({ label, q }) => (
    <div className="ptr-quota">
      <div className="ptr-quota-top"><span>{label}</span><span className="mono">{q.used}/{q.total}</span></div>
      <div className="ptr-quota-track"><div className={'ptr-quota-fill tone-' + (q.used / q.total > 0.85 ? 'rose' : q.used / q.total > 0.6 ? 'amber' : 'emerald') + '-bar'} style={{ width: (q.used / q.total * 100) + '%' }}/></div>
    </div>
  );
  return (
    <>
      <PageHead title="Billing" sub="Your LayerPulse subscription — plan, quota, and invoices. (Customer Fabric spend lives per-customer.)"/>
      <div className="ptr-bill fade-in">
        <div className="lp-card ptr-plan">
          <div className="ptr-plan-top"><div><div className="ptr-plan-name">{b.plan}</div><div className="ptr-muted">Renews {b.renewal}</div></div><span className="badge tone-emerald-soft">{b.status}</span></div>
          <div className="ptr-plan-price mono">{b.currency}{b.mrr.toLocaleString()}<span>/mo</span></div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Manage plan</button>
        </div>
        <div className="lp-card ptr-quotas">
          <div className="lp-eyebrow" style={{ marginBottom: 4 }}>Usage against plan</div>
          <Q label="Customer environments" q={b.envQuota}/>
          <Q label="Team seats" q={b.seatQuota}/>
          <Q label="Models tracked" q={b.modelQuota}/>
        </div>
      </div>

      <div className="lp-section-head" style={{ marginTop: 22 }}><h2>Invoices</h2></div>
      <div className="lp-card lp-card-flush fade-in d2">
        <div className="ptr-inv2-head"><div>Invoice</div><div>Date</div><div>Amount</div><div>Status</div><div></div></div>
        {b.invoices.map(iv => (
          <div key={iv.id} className="ptr-inv2-row">
            <div className="mono">{iv.id}</div><div className="ptr-muted">{iv.date}</div>
            <div className="mono">{P().billing.currency}{iv.amount.toLocaleString()}</div>
            <div><span className="badge tone-emerald-soft">{iv.status}</span></div>
            <div><button className="btn btn-ghost btn-sm"><Icon name="external" size={13}/>PDF</button></div>
          </div>
        ))}
      </div>
    </>
  );
}

export function PartnerSettings() {
  const p = P();
  return (
    <>
      <PageHead title="Settings" sub="Partner-level configuration — profile, defaults, and notifications. Per-customer settings live inside each customer environment."/>
      <div className="ptr-set fade-in">
        <div className="lp-card ptr-set-card">
          <div className="ptr-set-h">Partner profile</div>
          <Row l="Organization" v={p.partner.name}/>
          <Row l="Partner-of-record customers" v={p.partner.customerCount + ' active · ' + p.partner.invitedPending + ' pending'}/>
          <Row l="Primary contact" v="michiel@acmedata.partners"/>
        </div>
        <div className="lp-card ptr-set-card">
          <div className="ptr-set-h">Defaults</div>
          <Row l="New-customer review cadence" v="Quarterly"/>
          <Row l="Default doc-coverage target" v="60%"/>
          <Row l="Capacity throttle alert" v="≥ 80% CU sustained 15m"/>
        </div>
        <div className="lp-card ptr-set-card">
          <div className="ptr-set-h">Notifications</div>
          <Row l="Weekly portfolio digest" v="On · Mondays 08:00"/>
          <Row l="Critical fix-first alerts" v="On · email + in-app"/>
          <Row l="Invitation status changes" v="On"/>
        </div>
      </div>
    </>
  );
}
function Row({ l, v }) { return <div className="ptr-set-row"><span className="ptr-set-l">{l}</span><span className="ptr-set-v">{v}</span></div>; }
