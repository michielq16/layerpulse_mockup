import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Sparkline } from './components';
import { Avatar } from './UserIntel';

const OP_GROUP_BY_KEY = (groups) => Object.fromEntries(groups.map(g => [g.key, g]));

// Map the offHours window: outside Mon-Fri 06:00-19:00 UTC counts as off-hours.
function isOffHours(iso) {
  const d = new Date(iso);
  const day = d.getUTCDay();
  const hr  = d.getUTCHours();
  if (day === 0 || day === 6) return true;
  return hr < 6 || hr >= 19;
}

function timeAgo(iso) {
  const now = new Date('2026-05-17T15:00:00Z').getTime();
  const t = new Date(iso).getTime();
  const m = Math.floor((now - t) / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtAbs(iso) {
  return iso.replace('T', ' ').replace('Z', ' UTC');
}

const STATUS_TONE = { ok: 'emerald', fail: 'rose' };

export function TenantActivity({ onOpenUser }) {
  const t = DATA.tenantActivity;
  const groupMeta = OP_GROUP_BY_KEY(t.opGroups);

  const [q, setQ]                 = React.useState('');
  const [range, setRange]         = React.useState('24h');
  const [groupSel, setGroupSel]   = React.useState(new Set());                 // empty = all
  const [ws, setWs]               = React.useState('all');
  const [sens, setSens]           = React.useState('all');
  const [statusFilter, setStatus] = React.useState('all');
  const [offHoursOnly, setOff]    = React.useState(false);
  const [selectedQuery, setSQ]    = React.useState(null);
  const [openEvent, setOpenEvent] = React.useState(null);

  // Saved-query preset translates to filter state — surface the chip-active visual.
  const applySaved = (sqId) => {
    if (selectedQuery === sqId) {
      // toggle off — clear filters
      setSQ(null); setGroupSel(new Set()); setOff(false); setSens('all'); setWs('all'); setStatus('all'); setRange('24h');
      return;
    }
    setSQ(sqId);
    if (sqId === 'sq1') { setGroupSel(new Set(['export'])); setSens('Restricted'); setOff(true); setRange('30d'); setWs('all'); setStatus('all'); }
    if (sqId === 'sq2') { setGroupSel(new Set(['admin'])); setSens('all');         setOff(false); setRange('7d');  setWs('Sales-Prod'); setStatus('all'); }
    if (sqId === 'sq3') { setGroupSel(new Set(['rls']));   setSens('all');         setOff(false); setRange('30d'); setWs('all'); setStatus('fail'); }
    if (sqId === 'sq4') { setGroupSel(new Set());           setSens('all');         setOff(false); setRange('24h'); setWs('all'); setStatus('all'); /* svc filter via q */ setQ('svc-'); }
    if (sqId === 'sq5') { setGroupSel(new Set(['ai']));     setSens('all');         setOff(false); setRange('7d');  setWs('all'); setStatus('ok'); }
  };

  const rangeCutoff = React.useMemo(() => {
    const now = new Date('2026-05-17T15:00:00Z').getTime();
    if (range === '1h')  return now - 3600 * 1000;
    if (range === '24h') return now - 24 * 3600 * 1000;
    if (range === '7d')  return now - 7  * 24 * 3600 * 1000;
    if (range === '30d') return now - 30 * 24 * 3600 * 1000;
    return 0;
  }, [range]);

  const filtered = t.events.filter(ev => {
    const tEv = new Date(ev.at).getTime();
    if (tEv < rangeCutoff) return false;
    if (groupSel.size > 0 && !groupSel.has(ev.group)) return false;
    if (ws  !== 'all' && ev.ws  !== ws)  return false;
    if (sens!== 'all' && ev.sens!== sens) return false;
    if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
    if (offHoursOnly && !isOffHours(ev.at)) return false;
    if (q) {
      const hay = (ev.upn + ' ' + ev.actor + ' ' + ev.op + ' ' + ev.item + ' ' + ev.ws).toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const groupCounts = React.useMemo(() => {
    const m = {};
    t.opGroups.forEach(g => { m[g.key] = filtered.filter(e => e.group === g.key).length; });
    return m;
  }, [filtered]);

  const toggleGroup = (k) => {
    setSQ(null);
    setGroupSel(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const clearAll = () => {
    setQ(''); setRange('24h'); setGroupSel(new Set()); setWs('all'); setSens('all'); setStatus('all'); setOff(false); setSQ(null);
  };
  const hasFilters = q || range !== '24h' || groupSel.size > 0 || ws !== 'all' || sens !== 'all' || statusFilter !== 'all' || offHoursOnly;

  // For Sheet "Related events for this actor ±1h"
  const relatedForOpen = React.useMemo(() => {
    if (!openEvent) return [];
    const center = new Date(openEvent.at).getTime();
    return t.events.filter(e =>
      e.id !== openEvent.id &&
      e.upn === openEvent.upn &&
      Math.abs(new Date(e.at).getTime() - center) <= 3600 * 1000
    ).slice(0, 5);
  }, [openEvent]);

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Tenant Activity <span className="badge badge-outline" style={{ marginLeft: 10, fontSize: 10, color: 'oklch(0.45 0.18 290)', borderColor: 'oklch(0.85 0.05 290)' }}>FORENSIC</span></h1>
          <p className="lp-page-sub">Searchable, exportable history of every Fabric operation across this tenant. Source: <span className="mono">/admin/activityevents</span> (1-hour windows, 30-day retention). Auditor-grade — every timestamp is UTC, every actor is a UPN.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="star" size={13}/>Save current query</button>
          <button className="btn btn-outline btn-sm"><Icon name="bell" size={13}/>Watch this query</button>
          <button className="btn btn-sm"><Icon name="arrow-down" size={14}/>Export CSV ({filtered.length})</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Events / 24h"        value={t.summary.events24h.toLocaleString()} icon="activity" tone="sky"     spark={t.summary.events24hSpark}/>
        <StatCard label="Distinct actors"     value={t.summary.actors24h}                  sub="last 24h" icon="users"   tone="violet"/>
        <StatCard label={"Top op · " + t.summary.topOp.op} value={t.summary.topOp.count}   sub="last 24h" icon="bar-chart" tone="emerald"/>
        <StatCard label="Off-hours events"    value={t.summary.offHours7d}                 sub="last 7d · Mon–Fri 06–19 UTC window" icon="moon" tone={t.summary.offHoursAlert ? 'rose' : 'sky'}/>
      </div>

      {/* Saved queries — Bloomberg-style preset row */}
      <div className="lp-section-head" style={{ marginTop: 20 }}>
        <h2>Saved queries</h2>
        <span className="lp-eyebrow">Operator presets · click to apply</span>
      </div>
      <div className="ta-saved-row fade-in d2">
        {t.savedQueries.map(sq => (
          <button key={sq.id} className={'ta-saved-chip tone-' + sq.tone + '-soft' + (selectedQuery === sq.id ? ' active' : '')} onClick={() => applySaved(sq.id)}>
            <Icon name={sq.icon} size={12}/>
            <span>{sq.label}</span>
          </button>
        ))}
      </div>

      {/* Filter bar — Bloomberg terminal layout */}
      <div className="lp-card lp-card-flush fade-in d3 ta-filter-card">
        <div className="ta-filter-row">
          <div className="lp-search" style={{ flex: 1, minWidth: 260 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search UPN, actor, item, operation, workspace…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <div className="seg-tabs">
            {[['1h','1h'],['24h','24h'],['7d','7d'],['30d','30d']].map(([k,l]) => (
              <button key={k} className={'seg-tab' + (range === k ? ' active' : '')} onClick={() => { setRange(k); setSQ(null); }}>{l}</button>
            ))}
          </div>
          <select className="input input-sm" value={ws}   onChange={e => { setWs(e.target.value); setSQ(null); }}>
            <option value="all">All workspaces</option>
            {t.workspaces.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className="input input-sm" value={sens} onChange={e => { setSens(e.target.value); setSQ(null); }}>
            <option value="all">Any sensitivity</option>
            {t.sensitivities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input input-sm" value={statusFilter} onChange={e => { setStatus(e.target.value); setSQ(null); }}>
            <option value="all">Any status</option>
            <option value="ok">Success</option>
            <option value="fail">Failed</option>
          </select>
        </div>

        <div className="ta-filter-row" style={{ marginTop: 8, alignItems: 'center' }}>
          <span className="lp-eyebrow" style={{ minWidth: 90 }}>Operation:</span>
          <div className="chip-row">
            {t.opGroups.map(g => {
              const active = groupSel.has(g.key);
              const n = groupCounts[g.key] || 0;
              return (
                <button key={g.key} className={'chip ta-op-chip tone-' + g.tone + '-soft' + (active ? ' active' : '')} onClick={() => toggleGroup(g.key)} title={g.ops.join(' · ')}>
                  <span className={'ta-op-dot tone-' + g.tone + '-solid'}/>
                  {g.label}<span className="count mono">{n}</span>
                </button>
              );
            })}
          </div>
          <label className="ta-off-toggle" onClick={() => { setOff(o => !o); setSQ(null); }}>
            <input type="checkbox" checked={offHoursOnly} readOnly/>
            <Icon name="moon" size={12}/>
            <span>Off-hours only</span>
          </label>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ marginLeft: 'auto' }}>
              <Icon name="x" size={12}/>Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results table — virtualized-style (sticky head, dense rows) */}
      <div className="lp-section-head" style={{ marginTop: 16 }}>
        <h2>Events <span className="count">{filtered.length} of {t.events.length}</span></h2>
        <span className="lp-eyebrow">UTC · sorted by time, newest first · click any row for full detail</span>
      </div>

      <div className="lp-card lp-card-flush fade-in d4">
        <div className="ta-head">
          <div>Time UTC</div>
          <div>Actor</div>
          <div>Operation</div>
          <div>Item</div>
          <div>Workspace</div>
          <div>Sens</div>
          <div>Status</div>
        </div>
        {filtered.length === 0 && (
          <div className="empty" style={{ padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No events match.</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Loosen the filters above, or {hasFilters && <a onClick={clearAll} style={{ color: 'oklch(0.55 0.18 237)', cursor: 'pointer', fontWeight: 500 }}>clear all filters</a>}.</div>
          </div>
        )}
        {filtered.map(ev => {
          const meta = groupMeta[ev.group];
          const off = isOffHours(ev.at);
          const isSvc = ev.upn.startsWith('svc-');
          return (
            <button key={ev.id} className={'ta-row' + (ev.flag ? ' ta-row-flag' : '') + (off ? ' ta-row-off' : '')} onClick={() => setOpenEvent(ev)}>
              <div className="ta-time">
                <span className="mono">{ev.at.slice(11, 19)}</span>
                <span className="ta-date mono">{ev.at.slice(0, 10)}</span>
                {off && <span className="ta-off-pill" title="Outside business hours"><Icon name="moon" size={9}/></span>}
              </div>
              <div className="ta-actor">
                {isSvc
                  ? <span className="ta-svc"><Icon name="bot" size={11}/></span>
                  : <Avatar name={ev.actor} size={22}/>}
                <div style={{ minWidth: 0 }}>
                  <div className="ta-upn mono">{ev.upn}</div>
                </div>
              </div>
              <div className="ta-op">
                <span className={'ta-op-dot tone-' + meta.tone + '-solid'}/>
                <span className="mono">{ev.op}</span>
              </div>
              <div className="ta-item">{ev.item}</div>
              <div className="mono ta-ws">{ev.ws}</div>
              <div>
                {ev.sens
                  ? <span className={'badge ' + (ev.sens === 'Restricted' ? 'tone-rose-soft' : ev.sens === 'Confidential' ? 'tone-amber-soft' : 'tone-slate-soft')} style={{ fontSize: 10 }}>{ev.sens}</span>
                  : <span className="muted mono" style={{ fontSize: 10 }}>—</span>}
              </div>
              <div>
                <span className={'ta-status tone-' + STATUS_TONE[ev.status] + '-soft'}>
                  <span className={'ta-status-dot tone-' + STATUS_TONE[ev.status] + '-solid'}/>
                  {ev.status === 'ok' ? 'OK' : 'FAIL'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {openEvent && <EventSheet ev={openEvent} group={groupMeta[openEvent.group]} related={relatedForOpen} onClose={() => setOpenEvent(null)} onPickRelated={setOpenEvent}/>}
    </>
  );
}

function EventSheet({ ev, group, related, onClose, onPickRelated }) {
  const off  = isOffHours(ev.at);
  const isSvc = ev.upn.startsWith('svc-');

  return (
    <div className="usr-sheet-overlay" onClick={onClose}>
      <div className="usr-sheet ta-sheet" onClick={e => e.stopPropagation()}>
        <div className="usr-sheet-head">
          <div className={'ta-sheet-icon tone-' + group.tone + '-soft'}>
            <span className={'ta-op-dot tone-' + group.tone + '-solid'} style={{ width: 14, height: 14 }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="usr-sheet-upn mono">{ev.op}</div>
            <div className="usr-sheet-name">{ev.item}</div>
          </div>
          {ev.flag && (
            <span className="badge tone-rose-soft" style={{ marginRight: 8 }}>
              <Icon name="alert" size={11}/>Flagged
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><Icon name="close" size={16}/></button>
        </div>

        <div className="usr-sheet-body">
          <div className="ta-detail-grid">
            <DetailRow label="Time"        value={<span className="mono">{fmtAbs(ev.at)}</span>} hint={timeAgo(ev.at) + ' ago' + (off ? ' · off-hours' : '')}/>
            <DetailRow label="Actor"       value={
              <div className="ta-actor" style={{ gap: 8 }}>
                {isSvc ? <span className="ta-svc"><Icon name="bot" size={11}/></span> : <Avatar name={ev.actor} size={22}/>}
                <span className="mono">{ev.upn}</span>
              </div>
            } hint={ev.actor}/>
            <DetailRow label="Workspace"   value={<span className="mono">{ev.ws}</span>}/>
            <DetailRow label="Sensitivity" value={
              ev.sens
                ? <span className={'badge ' + (ev.sens === 'Restricted' ? 'tone-rose-soft' : ev.sens === 'Confidential' ? 'tone-amber-soft' : 'tone-slate-soft')}>{ev.sens}</span>
                : <span className="muted mono">—</span>
            }/>
            <DetailRow label="Status"      value={
              <span className={'ta-status tone-' + STATUS_TONE[ev.status] + '-soft'}>
                <span className={'ta-status-dot tone-' + STATUS_TONE[ev.status] + '-solid'}/>
                {ev.status === 'ok' ? 'Success' : 'Failed'}
              </span>
            } hint={ev.errCode || ''}/>
            <DetailRow label="IP"          value={<span className="mono">{ev.ip}</span>}/>
            <DetailRow label="Event ID"    value={<span className="mono">{ev.id}</span>}/>
          </div>

          <div className="lp-section-head" style={{ marginTop: 16 }}>
            <h2>Raw event</h2>
            <span className="lp-eyebrow">Activity Log API payload</span>
          </div>
          <pre className="ta-raw">{JSON.stringify({
            Id: ev.id,
            CreationTime: ev.at,
            Operation: ev.op,
            UserId: ev.upn,
            UserType: isSvc ? 'ServicePrincipal' : 'Regular',
            WorkspaceName: ev.ws,
            ItemName: ev.item,
            SensitivityLabelId: ev.sens || null,
            ClientIP: ev.ip,
            ResultStatus: ev.status === 'ok' ? 'Succeeded' : 'Failed',
            ResultStatusErrorCode: ev.errCode || null,
          }, null, 2)}</pre>

          {related.length > 0 && (
            <>
              <div className="lp-section-head" style={{ marginTop: 16 }}>
                <h2>Related from same actor <span className="count">±1h</span></h2>
                <span className="lp-eyebrow">{ev.upn}</span>
              </div>
              <div className="lp-card lp-card-flush">
                {related.map(r => (
                  <button key={r.id} className="ta-related-row" onClick={() => onPickRelated(r)}>
                    <span className="mono" style={{ width: 80, color: 'var(--muted-foreground)' }}>{r.at.slice(11, 19)}</span>
                    <span className="mono ta-op-mono">{r.op}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.item}</span>
                    <span className="mono muted" style={{ fontSize: 11 }}>{r.ws}</span>
                    <Icon name="chevron-right" size={12} style={{ color: 'var(--muted-foreground)' }}/>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="usr-sheet-foot">
          <button className="btn btn-outline btn-sm"><Icon name="external" size={13}/>Open in Fabric admin</button>
          <button className="btn btn-outline btn-sm"><Icon name="users" size={13}/>See all from {ev.upn.split('@')[0]}</button>
          <div style={{ flex: 1 }}/>
          {ev.flag && (
            <button className="btn btn-sm" style={{ background: 'oklch(0.55 0.20 25)', color: '#fff' }}>
              <Icon name="bell" size={13}/>Add to evidence pack
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, hint }) {
  return (
    <div className="ta-detail-row">
      <div className="ta-detail-label">{label}</div>
      <div className="ta-detail-value">{value}{hint && <span className="ta-detail-hint">{hint}</span>}</div>
    </div>
  );
}
