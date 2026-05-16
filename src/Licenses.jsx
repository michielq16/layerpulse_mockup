import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard } from './components';
import { Avatar } from './UserIntel';

function fmtEur(amount) {
  return '€' + amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function Licenses() {
  const [tab, setTab] = React.useState('reclaim');
  const l = DATA.licenses;
  const totalSeats = l.skus.reduce((s, k) => s + k.total, 0);
  const totalConsumed = l.skus.reduce((s, k) => s + k.consumed, 0);

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Licenses</h1>
          <p className="lp-page-sub">Tenant-wide license inventory joined to 30-day activity. Spot reclaimable seats, downgrade candidates, and MFA gaps in one place.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={12}/>Re-sync Graph</button>
          <button className="btn btn-sm"><Icon name="external" size={12}/>Export reclaim list</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Monthly license spend" value={fmtEur(l.tenantSpend)} delta={4} sub="across all SKUs" icon="dollar" tone="violet"/>
        <StatCard label="Reclaimable" value={fmtEur(l.reclaimable)} sub={l.reclaimableCount + ' inactive holders · 30d'} icon="moon" tone="amber"/>
        <StatCard label="Unassigned seats" value={l.unassigned} sub={Math.round(l.unassigned / totalSeats * 100) + '% of total'} icon="users" tone="sky"/>
        <StatCard label="MFA coverage" value={Math.round(l.mfaCoverage * 100) + '%'} sub={l.mfaMissing + ' of ' + l.mfaTotal + ' missing'} icon="shield" tone={l.mfaCoverage < 0.95 ? 'rose' : 'emerald'}/>
      </div>

      <div className="lp-section-head">
        <h2>License mix <span className="count">{totalConsumed} of {totalSeats} seats assigned</span></h2>
      </div>

      <div className="lp-card fade-in d2">
        <div className="lic-mix">
          {l.skus.map(sku => (
            <div key={sku.skuPart} className={'lic-mix-row tone-' + sku.color}>
              <div className="lic-mix-head">
                <div className="lic-mix-name">{sku.sku}<span className="cap-sku">{sku.family}</span></div>
                <div className="lic-mix-meta">
                  <span className="mono">{sku.consumed} / {sku.total}</span>
                  <span className="muted"> · {sku.monthly > 0 ? fmtEur(sku.monthly) + '/mo each' : 'free'}</span>
                  {sku.stale > 0 && <span className="lic-stale-pill">{sku.stale} inactive 30d</span>}
                </div>
              </div>
              <div className="lic-mix-bar">
                <div className="lic-mix-fill-active" style={{ width: ((sku.consumed - sku.stale) / sku.total * 100) + '%' }}/>
                <div className="lic-mix-fill-stale"  style={{ width: (sku.stale / sku.total * 100) + '%' }}/>
                <div className="lic-mix-fill-empty" style={{ width: ((sku.total - sku.consumed) / sku.total * 100) + '%' }}/>
              </div>
              <div className="lic-mix-totals">
                <span className="mono">{fmtEur(sku.consumed * sku.monthly)}/mo</span>
                {sku.stale > 0 && <span className="lic-savings mono">↓ {fmtEur(sku.stale * sku.monthly)} reclaimable</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="lic-legend">
          <span className="lic-sw lic-sw-active"/><span>Active in 30d</span>
          <span className="lic-sw lic-sw-stale"/><span>Inactive 30d+</span>
          <span className="lic-sw lic-sw-empty"/><span>Unassigned</span>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Recommendations</h2>
        <span className="seg-tabs">
          {[['reclaim', 'Reclaim · ' + l.reclaimList.length], ['mfa', 'MFA gaps · ' + l.mfaMissingList.length]].map(([k, lbl]) => (
            <button key={k} className={'seg-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{lbl}</button>
          ))}
        </span>
      </div>

      {tab === 'reclaim' && (
        <div className="lp-card lp-card-flush fade-in">
          <div className="reclaim-head">
            <div>User</div>
            <div>Dept</div>
            <div>License</div>
            <div>Last active</div>
            <div>30d sessions</div>
            <div>Saved / mo</div>
            <div>Action</div>
          </div>
          {l.reclaimList.map((u, i) => (
            <div key={i} className="reclaim-row">
              <div className="audit-user"><Avatar name={u.name} size={24}/><span>{u.name}</span></div>
              <div><span className="badge badge-outline">{u.dept}</span></div>
              <div><span className="badge tone-sky-soft">{u.sku}</span></div>
              <div className={'mono ' + (u.lastActive > 30 ? 'val-rose' : 'val-amber')}>{u.lastActive}d ago</div>
              <div className="mono">{u.sessions30d}</div>
              <div className="mono" style={{ fontWeight: 600 }}>{fmtEur(u.cost)}</div>
              <div>
                {u.status === 'reclaim'
                  ? <button className="btn btn-outline btn-sm" style={{ height: 26 }}>Reclaim seat</button>
                  : <button className="btn btn-outline btn-sm" style={{ height: 26 }}>Downgrade to free</button>}
              </div>
            </div>
          ))}
          <div className="reclaim-foot">
            <span>Total reclaimable: <b>{fmtEur(l.reclaimable)}/mo</b> across {l.reclaimableCount} users (only top 7 shown).</span>
            <button className="btn btn-sm">Reclaim all <Icon name="arrow-right" size={12}/></button>
          </div>
        </div>
      )}

      {tab === 'mfa' && (
        <div className="lp-card lp-card-flush fade-in">
          <div className="reclaim-head" style={{ gridTemplateColumns: 'minmax(180px, 2fr) 110px 110px 110px 100px 120px' }}>
            <div>Principal</div>
            <div>Role</div>
            <div>Dept</div>
            <div>Last active</div>
            <div>Admin?</div>
            <div>Action</div>
          </div>
          {l.mfaMissingList.map((u, i) => (
            <div key={i} className="reclaim-row" style={{ gridTemplateColumns: 'minmax(180px, 2fr) 110px 110px 110px 100px 120px' }}>
              <div className="audit-user">
                {u.role === 'Service Account'
                  ? <span className="svc-badge"><Icon name="bot" size={10}/></span>
                  : <Avatar name={u.name} size={24}/>}
                <span>{u.name}</span>
              </div>
              <div><span className="badge tone-slate-soft">{u.role}</span></div>
              <div><span className="badge badge-outline">{u.dept}</span></div>
              <div className="mono muted">{u.lastActive}d ago</div>
              <div>{u.admin ? <span className="badge tone-rose-soft">Admin</span> : <span className="muted">—</span>}</div>
              <div><button className="btn btn-outline btn-sm" style={{ height: 26 }}>Notify owner</button></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
