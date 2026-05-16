import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Badge } from './components';
import { AreaChart } from './Pages';

const fmtMoney = (amount, cur) => {
  if (cur === 'EUR') return '€' + amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

function squarify(items, rect) {
  if (items.length === 0) return [];
  const total = items.reduce((s, it) => s + it.value, 0);
  if (total <= 0) return [];
  const scaled = items.map(it => ({ ...it, area: it.value / total * rect.w * rect.h }));
  const out = [];
  let r = { ...rect };
  let rem = [...scaled];
  const worst = (row, w) => {
    const sum = row.reduce((s, i) => s + i.area, 0);
    const sw = w * w, sm = sum * sum;
    return row.reduce((m, i) => Math.max(m, sw * i.area / sm, sm / (sw * i.area)), 0);
  };
  while (rem.length > 0) {
    const w = Math.min(r.w, r.h);
    let row = [rem[0]];
    let cur = worst(row, w);
    let cut = 1;
    for (let i = 1; i < rem.length; i++) {
      const test = [...row, rem[i]];
      const tw = worst(test, w);
      if (tw < cur) { row = test; cur = tw; cut = i + 1; } else break;
    }
    const sum = row.reduce((s, i) => s + i.area, 0);
    const len = sum / w;
    if (r.w >= r.h) {
      let y = r.y;
      for (const it of row) { const h = it.area / len; out.push({ ...it, x: r.x, y, w: len, h }); y += h; }
      r.x += len; r.w -= len;
    } else {
      let x = r.x;
      for (const it of row) { const wd = it.area / len; out.push({ ...it, x, y: r.y, w: wd, h: len }); x += wd; }
      r.y += len; r.h -= len;
    }
    rem = rem.slice(cut);
  }
  return out;
}

export function CapacitySelector({ caps, value, onChange }) {
  const cap = caps.find(c => c.id === value) || caps[0];
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const h = () => setOpen(false);
    if (open) { window.addEventListener('click', h); return () => window.removeEventListener('click', h); }
  }, [open]);
  return (
    <div className="capsel" onClick={e => e.stopPropagation()}>
      <button className="capsel-btn" onClick={() => setOpen(!open)}>
        <span className={'cap-dot status-' + cap.status}/>
        <span className="capsel-name">{cap.name}</span>
        <span className="cap-sku">{cap.sku}</span>
        <Icon name="chevron-down" size={12}/>
      </button>
      {open && (
        <div className="capsel-menu">
          <div className="capsel-menu-title">Capacities · {caps.length}</div>
          {caps.map(c => (
            <button key={c.id} className={'capsel-opt' + (c.id === value ? ' active' : '')} onClick={() => { onChange(c.id); setOpen(false); }}>
              <span className={'cap-dot status-' + c.status}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="capsel-opt-name">{c.name}<span className="cap-sku">{c.sku}</span></div>
                <div className="capsel-opt-sub">
                  {c.hasPricing ? fmtMoney(c.monthlyBill, c.currency) + '/mo' : <span className="missing-pricing">No pricing</span>}
                  <span className="muted"> · {c.cuAvg30}% avg</span>
                </div>
              </div>
              {c.id === value && <Icon name="check" size={14}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Capacity() {
  const [capId, setCapId] = React.useState('cap-prd');
  const [tab, setTab] = React.useState('30d');
  const cap = DATA.capacities.find(c => c.id === capId);
  const series = tab === '24h' ? DATA.capacityCU24h[capId] : tab === '7d' ? DATA.capacityCU7d[capId] : DATA.capacityCU[capId];
  const data = series.map((v, i) => ({ v, i }));
  const peak = Math.max(...series);
  const overThreshold = series.filter(v => v >= 85).length;

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Capacity</h1>
          <p className="lp-page-sub">Per-capacity utilization, throttling, and CU timing. Distinct values for each capacity under <span className="mono">{cap.env}</span>.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <CapacitySelector caps={DATA.capacities} value={capId} onChange={setCapId}/>
          <button className="btn btn-outline btn-sm"><Icon name="refresh" size={12}/>Sync now</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label={'Avg utilization · ' + cap.name} value={cap.cuAvg30} unit="%" sub={`Peak ${cap.cuPeak30}% · ${cap.sku}`} icon="gauge" tone="sky"/>
        <StatCard label="Throttle events" value={cap.throttle7d} sub="last 7d" icon="alert-triangle" tone={cap.throttle7d > 0 ? 'rose' : 'emerald'}/>
        <StatCard label="Monthly bill" value={cap.hasPricing ? fmtMoney(cap.monthlyBill, cap.currency) : '—'} sub={cap.hasPricing ? `${cap.vCores} vCores · ${cap.currency}` : <span className="missing-pricing">Configure in Settings</span>} icon="dollar" tone="violet"/>
        <StatCard label="CU baseline" value={(cap.capacityCU / 1000).toFixed(1)} unit="k CU/day" sub={`${cap.vCores} × 3600 × 24`} icon="zap" tone="amber"/>
      </div>

      <div className="lp-section-head">
        <h2>Utilization <span className="count">{cap.name} · {tab}</span></h2>
        <span className="seg-tabs">
          {['24h','7d','30d'].map(t => <button key={t} className={'seg-tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>{t}</button>)}
        </span>
      </div>

      <div className="lp-card fade-in d2">
        <AreaChart data={data} threshold={85}/>
        <div className="chart-footer">
          <span>avg <span className="k">{cap.cuAvg30}%</span></span>
          <span>peak <span className="k">{Math.round(peak)}%</span></span>
          <span>throttle <span className="k">{cap.throttle7d}</span></span>
          <span>hours over 85% <span className="k">{overThreshold}</span></span>
        </div>
        <div className="data-source-pill">
          <Icon name="info" size={12}/>
          <span>Per-capacity CU from <b>{DATA.perCapacityCutover}</b>. Earlier rows are tenant-aggregate.</span>
          <a href="#" className="ds-link">What changed →</a>
        </div>
      </div>

      <div className="lp-grid-money fade-in d3" style={{ marginTop: 14 }}>
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Compare capacities</div>
              <div className="lp-card-sub">30-day avg CU% — formerly identical across the selector</div>
            </div>
          </div>
          {DATA.capacities.map(c => (
            <button key={c.id} className={'cap-compare' + (c.id === capId ? ' active' : '')} onClick={() => setCapId(c.id)}>
              <span className={'cap-dot status-' + c.status}/>
              <div className="cap-compare-name">{c.name}<span className="cap-sku">{c.sku}</span></div>
              <div className="cap-compare-bar">
                <div className="cap-compare-fill" style={{ width: c.cuAvg30 + '%' }}/>
              </div>
              <div className="cap-compare-val mono">{c.cuAvg30}<span className="muted">%</span></div>
            </button>
          ))}
        </div>
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Data collection</div>
              <div className="lp-card-sub">Per-arm sync status</div>
            </div>
            <span className="badge tone-emerald-soft">Synced 4m ago</span>
          </div>
          {[
            { arm: 'FUAM lakehouse',        status: 'ok',   meta: 'last 4m · next ~26m' },
            { arm: 'Metrics App (DAX)',     status: 'ok',   meta: 'MetricsByItemandHour · 11.2s' },
            { arm: 'Activity events',       status: 'ok',   meta: '1,284 events / 24h' },
            { arm: 'Cost calc (cron)',      status: 'ok',   meta: 'cost_observations_v2 · 6.4s' },
          ].map(r => (
            <div key={r.arm} className="arm-row">
              <span className={'arm-dot status-' + r.status}/>
              <span className="arm-name">{r.arm}</span>
              <span className="arm-meta mono">{r.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function Costs() {
  const [tab, setTab] = React.useState('attribution');
  const [capId, setCapId] = React.useState('cap-prd');
  const caps = DATA.capacities;
  const mixedCurrency = new Set(caps.map(c => c.currency)).size > 1;

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Cost & Usage</h1>
          <p className="lp-page-sub">Item-level cost attribution, workload mix, and raw consumption events. 30-day rolling window.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <CapacitySelector caps={caps} value={capId} onChange={setCapId}/>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={12}/>Export CSV</button>
        </div>
      </div>

      {mixedCurrency && (
        <div className="mixed-currency-banner fade-in">
          <Icon name="info" size={14}/>
          <span>
            <b>Mixed currencies</b> across capacities — totals are shown <b>per-capacity</b> and never auto-converted.
            EUR: {caps.filter(c => c.currency === 'EUR').map(c => c.name).join(', ')} ·
            USD: {caps.filter(c => c.currency === 'USD').map(c => c.name).join(', ')}.
          </span>
        </div>
      )}

      <div className="model-tabs fade-in d2">
        {[
          ['attribution', 'Cost Attribution', 'dollar'],
          ['workload',    'Workload Mix',     'layers'],
          ['observations','Observations',     'activity'],
        ].map(([k, l, ic]) => (
          <button key={k} className={'model-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
            <Icon name={ic} size={14}/>{l}
          </button>
        ))}
      </div>

      {tab === 'attribution'  && <CostAttribution capId={capId}/>}
      {tab === 'workload'     && <WorkloadMix capId={capId}/>}
      {tab === 'observations' && <Observations/>}
    </>
  );
}

export function CostAttribution({ capId }) {
  const cap = DATA.capacities.find(c => c.id === capId);
  const groups = DATA.costItems[capId] || [];
  const allItems = groups.flatMap(g => g.items.map(it => ({ ...it, ws: g.ws, tone: g.tone })));
  const totalCU = allItems.reduce((s, it) => s + it.cu, 0);

  if (!cap.hasPricing) {
    return (
      <div className="empty-cost fade-in d3">
        <div className="empty-cost-icon"><Icon name="dollar" size={28}/></div>
        <h3>No pricing configured for {cap.name}</h3>
        <p>Cost attribution needs a contracted monthly price to compute per-item dollar amounts. Capacity-unit values are still tracked.</p>
        <div className="empty-cost-actions">
          <button className="btn btn-sm"><Icon name="settings" size={14}/>Configure capacity pricing</button>
          <button className="btn btn-outline btn-sm">View CU-only attribution</button>
        </div>
      </div>
    );
  }

  if (totalCU === 0) {
    return (
      <div className="empty-cost fade-in d3">
        <div className="empty-cost-icon empty-cost-icon-warn"><Icon name="moon" size={28}/></div>
        <h3>No per-item activity in the selected window</h3>
        <p>{cap.name} had no item-level activity in the last 30 days. Background workloads may still consume CU — see <a href="#">Workload Mix</a> for the breakdown.</p>
      </div>
    );
  }

  const totalCost = cap.monthlyBill;
  const top10 = [...allItems].sort((a, b) => b.cu - a.cu).slice(0, 10);

  return (
    <>
      <div className="lp-grid-4 fade-in d3">
        <StatCard label="30-day bill"       value={fmtMoney(totalCost, cap.currency)} delta={+6} sub={cap.sku + ' · ' + cap.currency} icon="dollar" tone="sky"/>
        <StatCard label="Items tracked"     value={allItems.length} sub={groups.length + ' workspaces'} icon="boxes" tone="emerald"/>
        <StatCard label="Top item share"    value={Math.round(top10[0].cu / totalCU * 100) + '%'} sub={top10[0].name} icon="trend-up" tone="amber"/>
        <StatCard label="CU consumed"       value={(totalCU / 1000).toFixed(0)} unit="k" sub={Math.round(totalCU / cap.capacityCU / 30 * 100) + '% capacity'} icon="zap" tone="violet"/>
      </div>

      <div className="lp-section-head">
        <h2>Treemap <span className="count">grouped by workspace · sized by share of bill · {cap.currency}</span></h2>
      </div>
      <div className="lp-card fade-in d4">
        <Treemap groups={groups} totalCU={totalCU} cap={cap}/>
        <div className="treemap-legend">
          <Icon name="info" size={12}/>
          <span>Each rectangle = one item. Area is share of <b>{fmtMoney(totalCost, cap.currency)}/mo</b> bill. Color = workspace.</span>
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Top 10 most expensive <span className="count">share of bill · {cap.currency}</span></h2>
        <button className="btn btn-outline btn-sm">View all {allItems.length}</button>
      </div>
      <div className="lp-card lp-card-flush fade-in d5">
        <div className="cost-head">
          <div></div>
          <div>Item</div>
          <div>Workspace</div>
          <div>Type</div>
          <div>CU</div>
          <div>CU %</div>
          <div>{cap.currency} / mo</div>
          <div>Share</div>
        </div>
        {top10.map((it, i) => {
          const cuPct = it.cu / totalCU * 100;
          const cost = it.costPct / 100 * totalCost;
          return (
            <div key={it.name} className="cost-row">
              <div className="cost-rank mono">{i + 1}</div>
              <div className="cost-name">
                <Icon name={({ 'Power BI': 'bar-chart', 'Dataflow':'database', 'Pipeline':'git-branch','Spark':'zap','Dataset':'layers' })[it.type] || 'boxes'} size={12}/>
                <span>{it.name}</span>
              </div>
              <div><span className={'badge tone-' + it.tone + '-soft'}>{it.ws}</span></div>
              <div className="muted" style={{ fontSize: 12 }}>{it.type}</div>
              <div className="mono">{(it.cu / 1000).toFixed(0)}k</div>
              <div className="mono">{cuPct.toFixed(1)}%</div>
              <div className="mono" style={{ fontWeight: 600 }}>{fmtMoney(Math.round(cost), cap.currency)}</div>
              <div className="cost-share">
                <div className="cost-share-track">
                  <div className="cost-share-fill" style={{ width: it.costPct + '%', background: `oklch(0.62 0.18 ${({sky:237,emerald:150,amber:75,violet:290,rose:25,slate:250})[it.tone]||237})` }}/>
                </div>
                <span className="mono">{it.costPct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function Treemap({ groups, totalCU, cap }) {
  const W = 900, H = 360;
  const groupRects = squarify(groups.map(g => ({ ...g, value: g.items.reduce((s, i) => s + i.cu, 0) })), { x: 0, y: 0, w: W, h: H });
  return (
    <div className="treemap-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none">
        {groupRects.map(g => {
          const inner = { x: g.x + 3, y: g.y + 3, w: Math.max(0, g.w - 6), h: Math.max(0, g.h - 6) };
          const itemRects = squarify(g.items.map(i => ({ ...i, value: i.cu })), inner);
          const baseColor = ({ sky:'237', emerald:'150', amber:'75', violet:'290', rose:'25', slate:'250' })[g.tone] || '237';
          return (
            <g key={g.ws}>
              <rect x={g.x} y={g.y} width={g.w} height={g.h} fill={`oklch(0.94 0.06 ${baseColor})`} stroke="white" strokeWidth="3"/>
              {itemRects.map((it, idx) => {
                const intensity = Math.min(1, it.cu / 200_000);
                return (
                  <g key={idx} className="tm-cell">
                    <rect x={it.x} y={it.y} width={it.w} height={it.h}
                      fill={`oklch(${0.78 - intensity * 0.20} ${0.10 + intensity * 0.08} ${baseColor})`}
                      stroke="white" strokeWidth="1.5"
                    />
                    {it.w > 60 && it.h > 30 && (
                      <text x={it.x + 8} y={it.y + 18} fill={`oklch(0.28 0.16 ${baseColor})`} fontSize="11" fontWeight="600">
                        {it.name.length > Math.floor(it.w / 7) ? it.name.slice(0, Math.floor(it.w / 7) - 1) + '…' : it.name}
                      </text>
                    )}
                    {it.w > 60 && it.h > 50 && (
                      <text x={it.x + 8} y={it.y + 33} fill={`oklch(0.32 0.14 ${baseColor})`} fontSize="10" fontFamily="JetBrains Mono">
                        {fmtMoney(Math.round(it.costPct / 100 * cap.monthlyBill), cap.currency)} · {it.costPct.toFixed(1)}%
                      </text>
                    )}
                    <title>{it.name} — {fmtMoney(Math.round(it.costPct / 100 * cap.monthlyBill), cap.currency)} ({it.costPct.toFixed(1)}%) · {it.type}</title>
                  </g>
                );
              })}
              {g.w > 80 && g.h > 28 && (
                <text x={g.x + 10} y={g.y + g.h - 9} fill={`oklch(0.32 0.14 ${baseColor})`} fontSize="11" fontWeight="700" letterSpacing="0.04em" style={{ textTransform: 'uppercase' }}>
                  {g.ws}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function WorkloadMix({ capId }) {
  const cap = DATA.capacities.find(c => c.id === capId);
  const stack = DATA.workloadMix[capId] || [];
  const heat = DATA.peakHeat[capId] || [];
  const types = DATA.workloadTypes;

  const totals = types.map(t => ({ ...t, sum: stack.reduce((s, d) => s + d[t.key], 0) }));
  const grand = totals.reduce((s, t) => s + t.sum, 0);

  return (
    <>
      <div className="lp-grid-4 fade-in d3">
        {totals.slice(0, 4).map(t => (
          <div key={t.key} className="lp-card lp-stat">
            <div className="lp-stat-head">
              <span className="lp-stat-tile" style={{ background: t.color, color: 'white' }}>
                <Icon name={({powerbi:'bar-chart',dataflow:'database',pipeline:'git-branch',spark:'zap',dataset:'layers',other:'boxes'})[t.key]} size={14}/>
              </span>
              <div>
                <div className="lp-stat-label">{t.label}</div>
                <div className="lp-stat-value">{Math.round(t.sum / grand * 100)}<span className="lp-stat-unit">%</span></div>
                <div className="lp-stat-sub">{(t.sum / 1000).toFixed(0)}k CU · 30d</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lp-section-head">
        <h2>Daily CU by workload <span className="count">{cap.name} · last 30 days</span></h2>
      </div>
      <div className="lp-card fade-in d4">
        <StackedArea stack={stack} types={types}/>
        <div className="stack-legend">
          {types.map(t => (
            <div key={t.key} className="stack-legend-item">
              <span className="stack-legend-sw" style={{ background: t.color }}/>
              <span>{t.label}</span>
              <span className="mono muted">{Math.round((totals.find(x => x.key === t.key).sum / grand) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-grid-money fade-in d5">
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Peak-hour heatmap</div>
              <div className="lp-card-sub">CU% — current week, {cap.name}. Higher saturation = closer to capacity ceiling.</div>
            </div>
          </div>
          <PeakHeatmap data={heat}/>
        </div>
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Share by workload</div>
              <div className="lp-card-sub">30-day totals</div>
            </div>
          </div>
          <DonutChart totals={totals} grand={grand}/>
        </div>
      </div>
    </>
  );
}

function StackedArea({ stack, types }) {
  const W = 900, H = 240, P = 28;
  const N = stack.length;
  const totals = stack.map(d => types.reduce((s, t) => s + d[t.key], 0));
  const max = Math.max(...totals) * 1.05;
  const x = i => P + i * (W - 2 * P) / (N - 1);
  const y = v => H - P - (v / max) * (H - 2 * P);
  let runningTop = stack.map(() => 0);
  const layers = types.slice().reverse().map(t => {
    const top = stack.map((d, i) => runningTop[i] + d[t.key]);
    const path = [
      'M', x(0), y(runningTop[0]),
      ...stack.map((_, i) => `L ${x(i)} ${y(top[i])}`),
      ...stack.slice().reverse().map((_, i) => `L ${x(N - 1 - i)} ${y(runningTop[N - 1 - i])}`),
      'Z',
    ].join(' ');
    const result = { color: t.color, key: t.key, path };
    runningTop = top;
    return result;
  }).reverse();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} stroke="oklch(0.92 0.005 250)" strokeDasharray="2 3"/>
      ))}
      {layers.map(l => <path key={l.key} d={l.path} fill={l.color} fillOpacity="0.85" stroke="white" strokeWidth="0.5"/>)}
      <text x={W - P} y={P - 6} fontSize="10" fill="oklch(0.55 0.03 250)" textAnchor="end" fontFamily="JetBrains Mono">{(max / 1000).toFixed(0)}k CU</text>
    </svg>
  );
}

function DonutChart({ totals, grand }) {
  const R = 70, ir = 44, cx = 100, cy = 100;
  let a = -Math.PI / 2;
  const arcs = totals.map(t => {
    const da = (t.sum / grand) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R;
    const x2 = cx + Math.cos(a + da) * R, y2 = cy + Math.sin(a + da) * R;
    const ix1 = cx + Math.cos(a + da) * ir, iy1 = cy + Math.sin(a + da) * ir;
    const ix2 = cx + Math.cos(a) * ir, iy2 = cy + Math.sin(a) * ir;
    const large = da > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${large} 0 ${ix2} ${iy2} Z`;
    a += da;
    return { d, color: t.color, label: t.label, pct: t.sum / grand };
  });
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" width="180">
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color}/>)}
        <text x="100" y="98" textAnchor="middle" fontSize="11" fill="oklch(0.55 0.03 250)" letterSpacing="0.08em" textTransform="uppercase">TOTAL</text>
        <text x="100" y="116" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--foreground)" fontFamily="JetBrains Mono">{(grand / 1000).toFixed(0)}k</text>
      </svg>
      <div className="donut-legend">
        {arcs.map((a, i) => (
          <div key={i} className="donut-row">
            <span className="donut-sw" style={{ background: a.color }}/>
            <span>{a.label}</span>
            <span className="mono muted">{Math.round(a.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeakHeatmap({ data }) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return (
    <div className="heatmap" style={{ marginTop: 4 }}>
      <div className="heatmap-cols">
        <div style={{ width: 40 }}/>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="heatmap-hr" style={{ visibility: h % 4 === 0 ? 'visible' : 'hidden' }}>{String(h).padStart(2, '0')}</div>
        ))}
      </div>
      {data.map((row, di) => (
        <div key={di} className="heatmap-row">
          <div className="heatmap-day">{days[di]}</div>
          {row.map((v, hi) => {
            const intensity = v / 100;
            const hot = v >= 85;
            return (
              <div key={hi} className={'heatmap-cell' + (hot ? ' off-hours' : '')} style={{
                background: v === 0 ? 'var(--muted)' : `oklch(${0.95 - intensity * 0.55} ${0.04 + intensity * 0.18} ${hot ? 25 : 237})`,
              }} title={`${days[di]} ${String(hi).padStart(2, '0')}:00 — ${v}% CU`}/>
            );
          })}
        </div>
      ))}
      <div className="heatmap-legend">
        <span>0%</span>
        <div className="scale">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
            <div key={v} style={{ background: `oklch(${0.95 - v * 0.55} ${0.04 + v * 0.18} 237)` }}/>
          ))}
        </div>
        <span>100%</span>
        <span className="lp-eyebrow" style={{ marginLeft: 'auto' }}><span className="off-hr-mark"/> ≥85% (throttle risk)</span>
      </div>
    </div>
  );
}

export function Observations() {
  return (
    <>
      <div className="lp-section-head"><h2>Recent observations <span className="count">last 24 hours</span></h2></div>
      <div className="lp-card lp-card-flush fade-in d2">
        <table className="lp-table">
          <thead><tr><th>Date</th><th>Item</th><th>Operation</th><th style={{ textAlign: 'right' }}>CU</th></tr></thead>
          <tbody>
            {DATA.cuTable.map((r, i) => (
              <tr key={i}>
                <td className="muted num">{r.date}</td>
                <td>{r.item}</td>
                <td><Badge tone="outline">{r.op}</Badge></td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{r.cu.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
