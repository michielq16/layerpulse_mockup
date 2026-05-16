import React from 'react';
import DATA from './data';
import { Sidebar, Topbar } from './components';
import { Overview } from './Overview';
import { Workspaces, WorkspaceDetail } from './Workspaces';
import { ModelView } from './Model';
import { Capacity, Costs } from './CostAttribution';
import { Alerts, Settings, DrillSheet, TweaksPanel } from './Pages';
import { Documents, Governance, Activity } from './NewPages';
import { Users, UserDetail } from './UserIntel';
import { Adoption, Sleepers, Audit } from './UserIntel2';
import { Licenses } from './Licenses';
import { ReportsApps } from './ReportsApps';
import { LineageExplorer, Access } from './SchemaMoat';

const TWEAK_DEFAULTS = {
  theme: 'light',
  density: 'comfortable',
  accent: 'sky',
};

export default function App() {
  const [route, setRoute] = React.useState('overview');
  const [issue, setIssue] = React.useState(null);
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', tweaks.theme === 'dark');
    document.documentElement.dataset.density = tweaks.density;
    const accents = {
      sky:     'oklch(0.69 0.17 237)',
      violet:  'oklch(0.62 0.16 275)',
      emerald: 'oklch(0.58 0.15 150)',
    };
    document.documentElement.style.setProperty('--primary', accents[tweaks.accent] || accents.sky);
    document.documentElement.style.setProperty('--accent',  accents[tweaks.accent] || accents.sky);
    document.documentElement.style.setProperty('--ring',    accents[tweaks.accent] || accents.sky);
  }, [tweaks]);

  const setTweak = (patch) => {
    setTweaks(s => {
      const next = { ...s, ...patch };
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch (e) {}
      return next;
    });
  };

  React.useEffect(() => {
    const handler = (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.type === '__activate_edit_mode')   setTweaksOpen(true);
      if (ev.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const parts = route.split('/');
  const top = parts[0];
  const wsId = parts[1];
  const modelId = parts[2];

  const crumbs = (() => {
    const base = [];
    if (top === 'overview')   return [{ label: 'Environment Overview' }];
    if (top === 'capacity')   return [{ label: 'Capacity' }];
    if (top === 'costs')      return [{ label: 'Cost & Usage' }];
    if (top === 'alerts')     return [{ label: 'Alerts' }];
    if (top === 'settings')   return [{ label: 'Settings' }];
    if (top === 'documents')  return [{ label: 'Documents' }];
    if (top === 'governance') return [{ label: 'Governance' }];
    if (top === 'activity')   return [{ label: 'Activity' }];
    if (top === 'adoption')   return [{ label: 'Adoption' }];
    if (top === 'sleepers')   return [{ label: 'Sleepers' }];
    if (top === 'audit')      return [{ label: 'Audit & Compliance' }];
    if (top === 'licenses')   return [{ label: 'Licenses' }];
    if (top === 'reports')    return [{ label: 'Reports & Apps' }];
    if (top === 'lineage')    return [{ label: 'Lineage Explorer' }];
    if (top === 'access')     return [{ label: 'Access' }];
    if (top === 'users') {
      const base2 = [{ label: 'Users', go: parts[1] ? () => setRoute('users') : undefined }];
      if (parts[1]) {
        const u = DATA.users.top.find(x => x.id === parts[1]);
        base2.push({ label: u ? u.name : parts[1] });
      }
      return base2;
    }
    if (top === 'workspaces') {
      base.push({ label: 'Workspaces', go: wsId ? () => setRoute('workspaces') : undefined });
      if (wsId) {
        const ws = DATA.workspaces.items.find(w => w.id === wsId);
        base.push({ label: ws ? ws.name : wsId, go: modelId ? () => setRoute('workspaces/' + wsId) : undefined });
      }
      if (modelId) {
        const m = DATA.model[modelId];
        base.push({ label: m ? m.name : modelId });
      }
      return base;
    }
    return [{ label: top }];
  })();

  let page;
  if (top === 'overview')       page = <Overview onOpenIssue={setIssue} onGoWorkspace={(id) => setRoute(id ? 'workspaces/' + id : 'workspaces')}/>;
  else if (top === 'capacity')  page = <Capacity/>;
  else if (top === 'costs')     page = <Costs/>;
  else if (top === 'alerts')    page = <Alerts/>;
  else if (top === 'settings')  page = <Settings/>;
  else if (top === 'documents')  page = <Documents/>;
  else if (top === 'governance') page = <Governance/>;
  else if (top === 'activity')   page = <Activity/>;
  else if (top === 'adoption')   page = <Adoption/>;
  else if (top === 'sleepers')   page = <Sleepers/>;
  else if (top === 'audit')      page = <Audit/>;
  else if (top === 'licenses')   page = <Licenses onOpenUser={(id) => setRoute('users/' + id)}/>;
  else if (top === 'reports')    page = <ReportsApps onGoModel={(ws, m) => setRoute('workspaces/' + ws + '/' + m)}/>;
  else if (top === 'lineage')    page = <LineageExplorer/>;
  else if (top === 'access')     page = <Access/>;
  else if (top === 'users') {
    if (parts[1]) page = <UserDetail userId={parts[1]} onBack={() => setRoute('users')}/>;
    else          page = <Users onOpenUser={(id) => setRoute('users/' + id)}/>;
  }
  else if (top === 'workspaces') {
    if (modelId)   page = <ModelView wsId={wsId} modelId={modelId} onBack={() => setRoute('workspaces/' + wsId)}/>;
    else if (wsId) page = <WorkspaceDetail wsId={wsId} onBack={() => setRoute('workspaces')} onOpenModel={(ws, m) => setRoute('workspaces/' + ws + '/' + m)}/>;
    else           page = <Workspaces onOpen={(id) => setRoute('workspaces/' + id)}/>;
  }

  const screenLabel = 'customer · ' + route.replace(/\//g, ' › ');

  return (
    <div className="lp-app" data-screen-label={screenLabel}>
      <Sidebar route={route} setRoute={setRoute}/>
      <main className="lp-main">
        <Topbar
          crumbs={crumbs}
          tenant={DATA.tenant.env}
          theme={tweaks.theme}
          onTheme={() => setTweak({ theme: tweaks.theme === 'dark' ? 'light' : 'dark' })}
          onTweaks={() => setTweaksOpen(o => !o)}
        />
        <div className="lp-scroll">
          <div className="lp-content" key={route}>{page}</div>
        </div>
      </main>

      {issue && <DrillSheet issue={issue} onClose={() => setIssue(null)}/>}
      {tweaksOpen && <TweaksPanel state={tweaks} set={setTweak} onClose={() => {
        setTweaksOpen(false);
        try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
      }}/>}
    </div>
  );
}
