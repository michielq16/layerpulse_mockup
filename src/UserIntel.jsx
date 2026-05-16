import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard, Sparkline } from './components';

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i) | 0;
  const hues = [220, 145, 280, 35, 12, 195];
  return hues[Math.abs(h) % hues.length];
}
function initials(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}
export function Avatar({ name, size = 36 }) {
  const hue = avatarColor(name);
  return (
    <div className="ui-avatar" style={{
      width: size, height: size,
      background: `oklch(0.94 0.05 ${hue})`,
      color:      `oklch(0.42 0.13 ${hue})`,
      fontSize: size * 0.40,
    }}>{initials(name)}</div>
  );
}

export function Users({ onOpenUser }) {
  const [q, setQ] = React.useState('');
  const [dept, setDept] = React.useState('all');
  const [sort, setSort] = React.useState('cost');

  const u = DATA.users;
  const depts = ['all', ...u.departments.map(d => d.name)];

  const filtered = u.top
    .filter(x => (dept === 'all' || x.dept === dept) && (q === '' || (x.name + x.email).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === 'queries' ? b.queries - a.queries : sort === 'copilot' ? b.copilot - a.copilot : b.cu - a.cu);

  const maxCU = Math.max(...u.top.map(x => x.cu));

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Users</h1>
          <p className="lp-page-sub">Who consumes your capacity. Cost-attribution by user, department, and team — translated through capacity pricing.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export CSV</button>
          <button className="btn btn-outline btn-sm"><Icon name="settings" size={14}/>Configure mapping</button>
          <button className="btn btn-sm"><Icon name="bell" size={14}/>New alert</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Active this month"   value={DATA.userIntel.summary.activeMTD} sub="64% of seats" icon="activity" tone="sky"/>
        <StatCard label="Monthly spend"        value={'€' + DATA.userIntel.summary.monthlySpend.toLocaleString()} delta={6} icon="dollar" tone="emerald"/>
        <StatCard label="Power users"          value={u.top.filter(x => x.status === 'power').length} sub="top 5% of consumers" icon="star" tone="amber"/>
        <StatCard label="Copilot users"        value={DATA.userIntel.summary.copilotUsers} unit={' / ' + DATA.userIntel.summary.totalUsers} sub="9% adoption" icon="wand" tone="violet"/>
      </div>

      <div className="lp-section-head">
        <h2>Department breakdown <span className="count">€{u.departments.reduce((s, d) => s + d.cost, 0).toLocaleString()}/mo · 6 departments</span></h2>
      </div>

      <div className="lp-card fade-in d2">
        <div className="dept-ribbon">
          {u.departments.map(d => (
            <div key={d.name} className={'dept-slice tone-' + d.tone} style={{ flex: d.share }} title={`${d.name} · ${d.share}%`}>
              <div className="dept-slice-label">{d.name}</div>
              <div className="dept-slice-val">{d.share}<span className="pct">%</span></div>
            </div>
          ))}
        </div>
        <div className="dept-grid">
          {u.departments.map(d => (
            <div key={d.name} className="dept-card">
              <div className={'dept-dot tone-' + d.tone}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="dept-card-name">{d.name}</div>
                <div className="dept-card-meta">{d.headcount} people · {(d.cu / 1000).toFixed(0)}k CU</div>
              </div>
              <div className="dept-card-cost mono">€{d.cost.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-section-head">
        <h2>Leaderboard <span className="count">Top consumers · {filtered.length} of {u.top.length}</span></h2>
        <span className="seg-tabs">
          {[['cost','By cost'],['queries','By queries'],['copilot','By Copilot']].map(([k,l]) => (
            <button key={k} className={'seg-tab' + (sort === k ? ' active' : '')} onClick={() => setSort(k)}>{l}</button>
          ))}
        </span>
      </div>

      <div className="lp-card lp-card-flush" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="lp-search" style={{ flex: 1, minWidth: 240 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <select className="input input-sm" value={dept} onChange={e => setDept(e.target.value)}>
            {depts.map(d => <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>)}
          </select>
        </div>
      </div>

      <div className="lp-card lp-card-flush fade-in d3">
        <div className="leader-head">
          <div>User</div>
          <div>Consumption (last 30d)</div>
          <div>Cost</div>
          <div>Queries</div>
          <div>Datasets</div>
          <div>Copilot</div>
        </div>
        {filtered.map((user, i) => (
          <button key={user.id} className="leader-row" onClick={() => onOpenUser(user.id)}>
            <div className="leader-rank mono">{i + 1}</div>
            <div className="leader-user">
              <Avatar name={user.name}/>
              <div style={{ minWidth: 0 }}>
                <div className="leader-name">
                  {user.name}
                  {user.status === 'power' && <span className="pill-power">POWER</span>}
                </div>
                <div className="leader-meta">{user.role} · {user.dept}</div>
              </div>
            </div>
            <div className="leader-bar">
              <div className="leader-bar-track">
                <div className="leader-bar-fill" style={{ width: (user.cu / maxCU * 100) + '%' }}/>
              </div>
              <div className="leader-bar-val mono">{(user.cu / 1000).toFixed(0)}k</div>
              <Sparkline data={user.spark} tone="sky" w={56} h={20}/>
            </div>
            <div className="leader-cost mono">€{user.cost}</div>
            <div className="leader-num mono">{user.queries.toLocaleString()}</div>
            <div className="leader-num mono">{user.datasets}</div>
            <div className="leader-copilot">
              {user.copilot > 0 ? (
                <>
                  <span className="copilot-dot"><Icon name="wand" size={10}/></span>
                  <span className="mono">{user.copilot}</span>
                </>
              ) : <span className="muted">—</span>}
            </div>
            <Icon name="chevron-right" size={14} className="leader-arrow"/>
          </button>
        ))}
        {filtered.length === 0 && <div className="empty">No users match your filters.</div>}
      </div>
    </>
  );
}

export function UserDetail({ userId, onBack }) {
  const user = DATA.users.top.find(u => u.id === userId) || DATA.users.top[0];
  const d = DATA.userDetail;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxHeat = Math.max(...d.heatmap.flat());

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user.name} size={56}/>
          <div>
            <h1 className="lp-page-title" style={{ margin: 0 }}>
              {user.name}
              {user.status === 'power' && <span className="pill-power" style={{ marginLeft: 10 }}>POWER USER</span>}
              {user.copilotRate > 0.3 && <span className="pill-copilot" style={{ marginLeft: 6 }}><Icon name="wand" size={10}/>COPILOT POWER</span>}
            </h1>
            <p className="lp-page-sub">{user.role} · {user.dept} · {user.email}</p>
          </div>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>Back</button>
          <button className="btn btn-outline btn-sm"><Icon name="bell" size={14}/>Watch user</button>
          <button className="btn btn-sm"><Icon name="external" size={14}/>Open in Entra</button>
        </div>
      </div>

      <div className="lp-grid-4 fade-in">
        <StatCard label="Capacity this month" value={(user.cu / 1000).toFixed(0)} unit="k CU" sub={`€${user.cost}`} icon="zap" tone="amber" spark={user.spark}/>
        <StatCard label="Queries"             value={user.queries.toLocaleString()} sub={`${(user.queries / 30 | 0)}/day avg`} icon="bar-chart" tone="sky"/>
        <StatCard label="Datasets touched"    value={user.datasets} sub={`${user.refreshes} refreshes`} icon="database" tone="emerald"/>
        <StatCard label="Copilot sessions"    value={user.copilot} sub={`${Math.round(user.copilotRate * 100)}% of activity`} icon="wand" tone="violet"/>
      </div>

      <div className="lp-grid-money fade-in d2">
        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Activity heatmap</div>
              <div className="lp-card-sub">Last 7 days × 24 hours · darker = more events</div>
            </div>
            <span className="lp-eyebrow">Local time (CET)</span>
          </div>
          <div className="heatmap">
            <div className="heatmap-cols">
              <div style={{ width: 40 }}/>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="heatmap-hr" style={{ visibility: h % 4 === 0 ? 'visible' : 'hidden' }}>{String(h).padStart(2, '0')}</div>
              ))}
            </div>
            {d.heatmap.map((row, di) => (
              <div key={di} className="heatmap-row">
                <div className="heatmap-day">{days[di]}</div>
                {row.map((v, hi) => {
                  const intensity = v / maxHeat;
                  const offHours = hi < 7 || hi > 19 || di >= 5;
                  return (
                    <div key={hi} className={'heatmap-cell' + (offHours && v > 2 ? ' off-hours' : '')} style={{
                      background: v === 0 ? 'var(--muted)' : `oklch(${0.95 - intensity * 0.55} ${0.05 + intensity * 0.15} 237)`,
                    }} title={`${days[di]} ${String(hi).padStart(2, '0')}:00 — ${v} events`}/>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span>less</span>
            <div className="scale">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                <div key={v} style={{ background: `oklch(${0.95 - v * 0.55} ${0.05 + v * 0.15} 237)` }}/>
              ))}
            </div>
            <span>more</span>
            <span className="lp-eyebrow" style={{ marginLeft: 'auto' }}>
              <span className="off-hr-mark"/> 7 off-hours sessions
            </span>
          </div>
        </div>

        <div className="lp-card">
          <div className="lp-card-header">
            <div>
              <div className="lp-card-title">Datasets touched</div>
              <div className="lp-card-sub">By query count</div>
            </div>
          </div>
          {d.datasets.map(ds => (
            <div key={ds.name} className="ds-row">
              <div className="ds-row-name">
                <Icon name="database" size={12}/>
                <span>{ds.name}</span>
                <span className="badge badge-outline">{ds.ws}</span>
              </div>
              <div className="ds-row-bar">
                <div className="ds-row-bar-fill" style={{ width: ds.share + '%' }}/>
              </div>
              <div className="ds-row-val mono">{ds.queries.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-section-head"><h2>Recent activity <span className="count">7 events · today</span></h2></div>
      <div className="lp-card lp-card-flush fade-in d3">
        {d.recent.map((r, i) => (
          <div key={i} className="recent-row">
            <span className={'act-dot tone-' + r.tone}>
              <Icon name={({
                ViewReport: 'bar-chart', AskCopilot: 'wand', ExportData: 'external',
                EditDataset: 'settings', RefreshDataset: 'refresh',
              })[r.op] || 'activity'} size={12}/>
            </span>
            <span className="recent-op mono">{r.op}</span>
            <span className="recent-target">{r.target}</span>
            <span className="recent-at mono">{r.at}</span>
          </div>
        ))}
      </div>
    </>
  );
}
