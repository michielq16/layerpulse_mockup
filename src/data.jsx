// Consolidated data for LayerPulze — combines Data.jsx through Data5.jsx

// ─── Helpers ─────────────────────────────────────────────────────────────────
const __spark = (n, base = 10, vol = 0.5) =>
  Array.from({ length: n }, (_, i) => Math.round((base + Math.sin(i * 0.6) * base * 0.3 + (Math.random() - 0.5) * base * vol) * 10) / 10);

const __wkSpark = (n, base, vol = 0.3, seed = 1) => {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round((base + Math.sin(i * 0.4 + seed) * base * 0.25 + (rand() - 0.5) * base * vol) * 10) / 10));
};

const __r = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

const __mkStack = (base, seed) => {
  const r = (i, m) => { let s = (seed + i * m) % 233280; return ((s * 9301 + 49297) % 233280) / 233280; };
  return Array.from({ length: 30 }, (_, i) => ({
    powerbi:  Math.round((base * 0.42 + (r(i, 1) - 0.5) * base * 0.2)),
    dataflow: Math.round((base * 0.20 + (r(i, 3) - 0.5) * base * 0.15)),
    pipeline: Math.round((base * 0.15 + (r(i, 5) - 0.5) * base * 0.12)),
    spark:    Math.round((base * 0.13 + (r(i, 7) - 0.5) * base * 0.10) + (i % 7 < 5 ? base * 0.05 : 0)),
    dataset:  Math.round((base * 0.08 + (r(i, 11) - 0.5) * base * 0.06)),
    other:    Math.max(0, Math.round((base * 0.02 + (r(i, 13) - 0.5) * base * 0.03))),
  }));
};

const __mkHeat = (avg, peak, seed) => Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    const wk = d < 5, work = h >= 8 && h <= 18, batch = h >= 2 && h <= 5;
    let v = avg;
    if (work && wk) v = avg + (peak - avg) * 0.7 * (1 - Math.abs(h - 11) / 8);
    else if (batch && wk) v = avg + (peak - avg) * 0.85;
    else if (!wk && work) v = avg * 0.4;
    else v = avg * 0.6;
    const s = (seed + d * 24 + h) % 233280;
    return Math.max(0, Math.round(v + ((s * 9301 + 49297) % 233280 / 233280 - 0.5) * 10));
  }));

// ─── Base data (Data.jsx) ─────────────────────────────────────────────────────
const DATA = {
  tenant: { name: 'Contoso Fabric', env: 'F64-prod-we', region: 'west-europe' },

  overview: {
    health: 74,
    healthDelta: +3,
    docCoverage: 78,
    capacity: 62,
    spend24h: '12.4k',
    spendDelta: +8,
    issuesOpen: 14,
    composition: [
      { key: 'cost',    label: 'Cost efficiency',    value: 62, weight: 30, tone: 'sky' },
      { key: 'quality', label: 'Model quality',      value: 81, weight: 25, tone: 'violet' },
      { key: 'docs',    label: 'Doc coverage',       value: 78, weight: 20, tone: 'emerald' },
      { key: 'refresh', label: 'Refresh reliability',value: 88, weight: 15, tone: 'amber' },
      { key: 'sec',     label: 'Security posture',   value: 54, weight: 10, tone: 'rose' },
    ],
    trend: [68, 69, 71, 70, 72, 71, 73, 72, 74, 73, 75, 74],
    topIssues: [
      { id: 'COST-001', severity: 'critical', category: 'cost',
        title: <>3 Import-mode models exceed <code>50M</code> rows — storage pressure</>,
        evidence: <>Workspace <b>Finance-Prod</b> · 2,142 CU over 7d</>,
        impact: '≈ $182/mo potential savings · 3 affected models',
        impactTone: 'critical' },
      { id: 'QUAL-001', severity: 'warning', category: 'quality',
        title: <>47 undocumented measures in <b>Finance-Prod</b></>,
        evidence: <>182 measures total · last audit 3d ago</>,
        impact: 'Blocks self-serve reporting',
        impactTone: 'warning' },
      { id: 'REF-012', severity: 'warning', category: 'refresh',
        title: <>Refresh p95 &gt; 10 min on <code>Sales Pipeline</code></>,
        evidence: <>4 capacities · 62% utilization avg</>,
        impact: 'Risks SLA on 3 downstream reports',
        impactTone: 'warning' },
      { id: 'SEC-008',  severity: 'info', category: 'security',
        title: 'Row-level security covers 8 of 24 critical tables',
        evidence: 'Recommended by your governance policy',
        impact: 'Exposure flagged on PII in 3 workspaces',
        impactTone: 'info' },
    ],
  },

  workspaces: {
    counts: { workspaces: 12, models: 34, tables: 496, measures: 976 },
    items: [
      { id: 'sales-prod', name: 'Sales-Prod',   env: 'PROD', star: true,  models: 5, tables: 68, measures: 172, scanned: '2h ago',  owner: 'A. Rivera',     iconTone: 'sky',     health: 88 },
      { id: 'finance-prod', name: 'Finance-Prod', env: 'PROD', star: true,  models: 8, tables: 120, measures: 301, scanned: '1d ago',  owner: 'M. Qureshi',    iconTone: 'violet',  health: 62 },
      { id: 'hr-data',    name: 'HR-Data',      env: 'DEV',  star: false, models: 2, tables: 18, measures: 42,  scanned: '—',       owner: 'J. Patel',      iconTone: 'emerald', health: null, scanCta: true },
      { id: 'supply-uat', name: 'Supply-Chain', env: 'UAT',  star: false, models: 4, tables: 52, measures: 98,  scanned: '6h ago',  owner: 'T. Hoffmann',   iconTone: 'amber',   health: 74 },
      { id: 'retail-ops', name: 'RetailOps',    env: 'PROD', star: true,  models: 7, tables: 94, measures: 210, scanned: '12h ago', owner: 'S. Lindqvist',  iconTone: 'rose',    health: 92 },
      { id: 'mkt-dev',    name: 'Marketing',    env: 'DEV',  star: false, models: 3, tables: 38, measures: 74,  scanned: '3d ago',  owner: 'P. Nguyen',      iconTone: 'sky',     health: 55 },
      { id: 'ops-score',  name: 'Operations Scorecard', env: 'PROD', star: false, models: 3, tables: 47, measures: 59, scanned: '1d ago', owner: 'K. Andersen', iconTone: 'emerald', health: 81 },
      { id: 'ana-sbx',    name: 'Analytics-Sandbox', env: 'DEV', star: false, models: 2, tables: 59, measures: 20, scanned: '—', owner: 'D. Okafor', iconTone: 'violet', health: null, scanCta: true },
    ],
  },

  workspaceDetail: {
    'finance-prod': {
      name: 'Finance-Prod', env: 'PROD',
      subtitle: 'Owned by M. Qureshi · 8 models · connected via FUAM-Prod',
      models: [
        { id: 'sales-analytics', name: 'Sales Analytics',   tables: 12, measures: 42, scanned: '3d ago',  score: 9.2, tone: 'emerald' },
        { id: 'budget-planning', name: 'Budget Planning',   tables: 8,  measures: 15, scanned: '—',       score: null },
        { id: 'kpi-dashboard',   name: 'KPI Dashboard',     tables: 4,  measures: 28, scanned: '1d ago',  score: 7.4, tone: 'amber' },
        { id: 'rev-forecast',    name: 'Revenue Forecast',  tables: 9,  measures: 31, scanned: '6h ago',  score: 8.1, tone: 'emerald' },
        { id: 'expense-pnl',     name: 'Expense P&L',       tables: 11, measures: 38, scanned: '2d ago',  score: 6.2, tone: 'amber' },
        { id: 'gl-balances',     name: 'GL Balances',       tables: 7,  measures: 22, scanned: '5d ago',  score: 4.1, tone: 'rose' },
      ],
    },
  },

  model: {
    'sales-analytics': {
      name: 'Sales Analytics',
      workspace: 'Finance-Prod',
      env: 'PROD',
      scannedAgo: '3d ago',
      score: 9.2,
      tier: 'Platinum',
      weakest: { dim: 'Discoverability', val: 5.5 },
      stats: { tables: 13, columns: 162, measures: 47, relationships: 18, reports: 1 },
      breakdown: [
        { key: 'naming',   label: 'Naming',             val: 9.5 },
        { key: 'sources',  label: 'Sources',            val: 8.9 },
        { key: 'perf',     label: 'Performance',        val: 8.1 },
        { key: 'struct',   label: 'Structure',          val: 9.8 },
        { key: 'hygiene',  label: 'Hygiene',            val: 7.0 },
        { key: 'discover', label: 'Discoverability',    val: 5.5 },
      ],
      scoreTrend: [8.4, 8.5, 8.7, 8.8, 8.9, 9.0, 9.0, 9.1, 9.1, 9.2, 9.2, 9.2],
      tables: [
        { group: 'Fact',      rows: [{ name: 'FactSales',       cols: 14, rel: 'active' }, { name: 'FactReturns', cols: 9, rel: 'active' }, { name: 'FactBudget', cols: 12, rel: 'inactive' }] },
        { group: 'Dimension', rows: [{ name: 'DimProduct',      cols: 8,  rel: 'active' }, { name: 'DimCustomer',cols: 11, rel: 'active' }, { name: 'DimDate',    cols: 7, rel: 'active' }, { name: 'DimGeography', cols: 6, rel: 'active' }] },
      ],
      actions: { warning: 18, info: 2 },
    },
  },

  capacity: {
    '24h': [42,45,50,55,60,66,70,78,82,75,72,68,65,64,68,72,78,85,92,88,82,72,62,58],
    '7d':  [58,61,66,70,74,72,68,65,62,60,66,72,78,82,80,76,70,66,62,60,64,70,78,84,88,86,82,74],
    '30d': Array.from({ length: 30 }, (_, i) => 55 + Math.round(Math.sin(i / 3) * 15 + i * 0.3)),
  },

  cuConsumers: [
    { nm: 'Sales Refresh',    pct: 42, cu: 2142, tone: 'oklch(0.69 0.17 237)' },
    { nm: 'Budget Calc',      pct: 28, cu: 1418, tone: 'oklch(0.62 0.16 275)' },
    { nm: 'KPI Refresh',      pct: 16, cu: 812,  tone: 'oklch(0.64 0.16 135)' },
    { nm: 'Expense Rollup',   pct: 9,  cu: 456,  tone: 'oklch(0.65 0.18 45)' },
    { nm: 'Ad-hoc queries',   pct: 5,  cu: 252,  tone: 'oklch(0.55 0.22 25)' },
  ],
  cuTable: [
    { date: 'Apr 07', item: 'Sales Model',   op: 'Refresh',    cu: 1240 },
    { date: 'Apr 07', item: 'Budget Calc',   op: 'Dataflow',   cu:  812 },
    { date: 'Apr 07', item: 'KPI Refresh',   op: 'Refresh',    cu:  456 },
    { date: 'Apr 06', item: 'Sales Model',   op: 'Refresh',    cu: 1180 },
    { date: 'Apr 06', item: 'Expense P&L',   op: 'Refresh',    cu:  712 },
    { date: 'Apr 06', item: 'Ad-hoc query',  op: 'Query',      cu:   42 },
    { date: 'Apr 05', item: 'Sales Model',   op: 'Refresh',    cu: 1326 },
  ],

  // ─── Documents, Governance, Activity (Data2.jsx) ─────────────────────────
  documents: {
    stats: { modelsDocumented: 13, total: 52, outdated: 3, storage: '2.3 MB' },
    items: [
      { id: 'd1', model: 'RetailOperations',        ws: 'RetailOps',     type: 'Data Dictionary',       status: 'current',  tables: 13, measures: 47, docs: 11, updated: '11m ago', size: '24.6 KB', tone: 'rose' },
      { id: 'd2', model: 'Management of Change',    ws: 'Operations',    type: 'Full Documentation',    status: 'current',  tables: 46, measures: 30, docs: 9,  updated: '1h ago',  size: '38.1 KB', tone: 'amber' },
      { id: 'd3', model: 'Operations Scorecard',    ws: 'Ops-Score',     type: 'Data Dictionary',       status: 'current',  tables: 74, measures: 579, docs: 6, updated: '6h ago',  size: '78.4 KB', tone: 'emerald' },
      { id: 'd4', model: 'Sales Analytics',         ws: 'Finance-Prod',  type: 'Full Documentation',    status: 'outdated', tables: 12, measures: 42, docs: 8,  updated: '9d ago',  size: '52.6 KB', tone: 'sky' },
      { id: 'd5', model: 'Budget Planning',         ws: 'Finance-Prod',  type: 'Health Check (Dev)',    status: 'current',  tables: 8,  measures: 15, docs: 4,  updated: '2d ago',  size: '21.5 KB', tone: 'violet' },
      { id: 'd6', model: 'Revenue Forecast',        ws: 'Finance-Prod',  type: 'Executive Summary',     status: 'outdated', tables: 9,  measures: 31, docs: 3,  updated: '14d ago', size: '18.9 KB', tone: 'amber' },
      { id: 'd7', model: 'HR Headcount',            ws: 'HR-Data',       type: 'Data Dictionary',       status: 'current',  tables: 6,  measures: 22, docs: 5,  updated: '3d ago',  size: '19.2 KB', tone: 'emerald' },
      { id: 'd8', model: 'Marketing Funnel',        ws: 'Marketing',     type: 'Full Documentation',    status: 'current',  tables: 11, measures: 38, docs: 7,  updated: '5h ago',  size: '41.8 KB', tone: 'sky' },
    ],
  },

  governance: {
    score: 48,
    compliantRules: 6, totalRules: 25, settingsCount: 160,
    findings: [
      { id: 'G-001', sev: 'critical', cat: 'External Sharing',   title: 'Guest access not scoped to security groups',   detail: 'Currently allowed for the entire tenant.',   recommend: 'Restrict to specific AAD groups.' },
      { id: 'G-002', sev: 'critical', cat: 'External Sharing',   title: 'Publish to web enabled',                        detail: 'Reports can be exposed to the public internet.', recommend: 'Disable or limit via security groups.' },
      { id: 'G-003', sev: 'critical', cat: 'Security',            title: 'Resource key auth not blocked',                 detail: 'Dataflow Gen1 still accepts resource keys.',   recommend: 'Block entirely or whitelist.' },
      { id: 'G-004', sev: 'warning',  cat: 'Content',             title: 'R and Python visuals enabled tenant-wide',      detail: 'Custom script visuals increase attack surface.', recommend: 'Disable or restrict to a data-science group.' },
      { id: 'G-005', sev: 'warning',  cat: 'Content',             title: 'Web content tiles enabled',                     detail: 'Third-party HTML iframes can be embedded.',   recommend: 'Disable unless needed for approved reports.' },
      { id: 'G-006', sev: 'warning',  cat: 'Developer',           title: 'Custom visuals allowed without certification',  detail: 'Anyone can publish uncertified visuals.',    recommend: 'Require certification.' },
      { id: 'G-007', sev: 'warning',  cat: 'Content',             title: 'Export to PowerPoint/PDF not restricted',       detail: 'Bulk export flagged by your DLP policy.',    recommend: 'Restrict to a subset of users.' },
      { id: 'G-008', sev: 'warning',  cat: 'Info Protection',     title: 'Sensitivity labels not required on upload',     detail: 'Labels can be omitted on some models.',      recommend: 'Require label on all PBIX upload.' },
      { id: 'G-009', sev: 'warning',  cat: 'Admin',               title: 'Admin API usage not audited',                   detail: 'No retention set for audit log events.',     recommend: 'Set retention to 180 days minimum.' },
      { id: 'G-010', sev: 'info',     cat: 'Info Protection',     title: 'Sensitivity labels enabled',                    detail: '5 of 7 default labels configured.',          recommend: 'Add the remaining 2 to standardize.' },
      { id: 'G-011', sev: 'info',     cat: 'Workspaces',          title: 'Workspace naming convention unenforced',        detail: '47% of workspaces lack environment prefix.', recommend: 'Apply name template policy.' },
      { id: 'G-012', sev: 'info',     cat: 'Datasets',            title: 'XMLA endpoints set to Read/Write',              detail: 'Third-party tools can write models.',        recommend: 'Review for principle of least privilege.' },
      { id: 'G-013', sev: 'info',     cat: 'Content',             title: 'Public email allowed for Publish to Web',       detail: 'No domain restriction on publish-to-web.',   recommend: 'Restrict to corporate domains.' },
    ],
    categories: [
      { name: 'Additional workloads',        enabled: 2, total: 5  },
      { name: 'Admin API settings',          enabled: 4, total: 6  },
      { name: 'Microsoft Fabric',            enabled: 6, total: 14 },
      { name: 'Dataflow settings',           enabled: 3, total: 8  },
      { name: 'Developer settings',          enabled: 2, total: 7  },
      { name: 'Export and sharing settings', enabled: 1, total: 12 },
      { name: 'Help and support',            enabled: 3, total: 3  },
      { name: 'Information protection',      enabled: 5, total: 9  },
    ],
  },

  activity: {
    stats: { scans: 4, docs: 3, ai: 2, resolved: 8 },
    items: [
      { date: 'Apr 23, 2026', day: [
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'RetailOperations',   meta: '9.2/10',           ago: '2h ago',  tone: 'sky' },
        { type: 'doc',     actor: 'Michiel V.', verb: 'Generated',        target: 'RetailOperations',   meta: 'Data Dictionary',  ago: '2h ago',  tone: 'emerald' },
        { type: 'ai',      actor: 'Sara P.',    verb: 'Ran',              target: 'Sales Analytics',    meta: 'DAX Analysis',     ago: '4h ago',  tone: 'violet' },
        { type: 'alert',   actor: 'system',     verb: 'Fired alert',      target: 'Capacity >85%',      meta: 'Cap-West · 08:42', ago: '6h ago',  tone: 'amber' },
      ]},
      { date: 'Apr 22, 2026', day: [
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'Management of Change', meta: '7.4/10',         ago: '1d ago',  tone: 'sky' },
        { type: 'resolve', actor: 'Michiel V.', verb: 'Resolved',         target: 'COST-001',           meta: '≈ €182/mo saved',  ago: '1d ago',  tone: 'emerald' },
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'Mooring Dashboard',  meta: '4.0/10',           ago: '1d ago',  tone: 'sky' },
      ]},
      { date: 'Apr 21, 2026', day: [
        { type: 'doc',     actor: 'Sara P.',    verb: 'Generated',        target: 'Budget Planning',    meta: 'Health Check',     ago: '2d ago',  tone: 'emerald' },
        { type: 'ai',      actor: 'Michiel V.', verb: 'Ran',              target: 'RetailOperations',   meta: 'Power Query Review', ago: '2d ago', tone: 'violet' },
        { type: 'resolve', actor: 'Sara P.',    verb: 'Resolved',         target: 'QUAL-001',           meta: '47 measures documented', ago: '2d ago', tone: 'emerald' },
        { type: 'scan',    actor: 'Michiel V.', verb: 'Re-scanned',       target: 'Operations Scorecard', meta: '8.1/10',         ago: '2d ago',  tone: 'sky' },
      ]},
    ],
  },

  modelExtras: {
    diagram: {
      tables: [
        { id: 'fs',  name: 'FactSales',     kind: 'fact', x: 360, y: 60, cols: ['SalesKey','ProductKey','CustomerKey','DateKey','Quantity','Amount','Cost','Discount'] },
        { id: 'fr',  name: 'FactReturns',   kind: 'fact', x: 600, y: 60, cols: ['ReturnKey','ProductKey','CustomerKey','DateKey','Quantity','RefundAmt'] },
        { id: 'fb',  name: 'FactBudget',    kind: 'fact', x: 820, y: 270, cols: ['BudgetKey','ProductKey','DateKey','Planned','Actual'] },
        { id: 'dp',  name: 'DimProduct',    kind: 'dim',  x: 60,  y: 30,  cols: ['ProductKey','Name','Category','SubCat','Brand'] },
        { id: 'dc',  name: 'DimCustomer',   kind: 'dim',  x: 60,  y: 200, cols: ['CustomerKey','Name','Segment','Country','Tier'] },
        { id: 'dd',  name: 'DimDate',       kind: 'dim',  x: 620, y: 310, cols: ['DateKey','Date','Year','Quarter','Month','Day'] },
        { id: 'dg',  name: 'DimGeography',  kind: 'dim',  x: 60,  y: 370, cols: ['GeoKey','Country','Region','City'] },
        { id: 'mm',  name: '_Measures',     kind: 'measure', x: 360, y: 330, cols: ['TotalSales','YTDRevenue','GrossMargin','SalesGrowth%'] },
      ],
      rels: [
        { from: 'dp', to: 'fs', kind: 'active' },
        { from: 'dp', to: 'fr', kind: 'active' },
        { from: 'dp', to: 'fb', kind: 'inactive' },
        { from: 'dc', to: 'fs', kind: 'active' },
        { from: 'dc', to: 'fr', kind: 'active' },
        { from: 'dd', to: 'fs', kind: 'active' },
        { from: 'dd', to: 'fr', kind: 'active' },
        { from: 'dd', to: 'fb', kind: 'active' },
        { from: 'dg', to: 'dc', kind: 'active' },
      ],
    },
    docs: [
      { id: 'v11', name: 'SalesAnalytics_Data_Dictionary.docx', type: 'Data Dictionary', version: 'v11', latest: true, ago: '11m ago', by: 'Michiel V.', size: '24.6 KB', pages: 14 },
      { id: 'v10', name: 'SalesAnalytics_Data_Dictionary.docx', type: 'Data Dictionary', version: 'v10',                ago: '1w ago',  by: 'Michiel V.', size: '24.6 KB', pages: 14 },
      { id: 'v9',  name: 'SalesAnalytics_Full_Documentation.docx', type: 'Full Documentation', version: 'v9',           ago: '1w ago',  by: 'Sara P.',    size: '52.6 KB', pages: 38 },
      { id: 'v7',  name: 'SalesAnalytics_Health_Check_Developer.docx', type: 'Health Check (Dev)', version: 'v7',       ago: '1w ago',  by: 'Sara P.',    size: '21.5 KB', pages: 11 },
      { id: 'v6',  name: 'SalesAnalytics_Executive_Summary.docx', type: 'Executive Summary', version: 'v6',             ago: '2w ago',  by: 'Michiel V.', size: '14.2 KB', pages: 4  },
    ],
    ai: [
      { id: 'AI-4', name: 'Report Structure Review', tone: 'rose',   critical: 1, warning: 0, info: 2, at: '01:52', by: 'Michiel V.', summary: 'One report page uses 9 slicers — consider a filter pane.' },
      { id: 'AI-3', name: 'Data Model Assessment',   tone: 'violet', critical: 0, warning: 0, info: 5, at: '01:51', by: 'Michiel V.', summary: 'Model is well-normalized. 5 suggestions on hygiene.' },
      { id: 'AI-2', name: 'Power Query Review',      tone: 'amber',  critical: 0, warning: 1, info: 2, at: '01:51', by: 'Michiel V.', summary: 'One native-query step breaks folding on DimCustomer.' },
      { id: 'AI-1', name: 'DAX Analysis',            tone: 'sky',    critical: 0, warning: 1, info: 3, at: '01:51', by: 'Michiel V.', summary: 'YTD Revenue uses FILTER(ALL()) unnecessarily.' },
    ],
    health: {
      unused: {
        measures: { used: 25, unused: 22, total: 47 },
        columns:  { used: 36, unused: 113, total: 149 },
        measuresList: [
          { name: 'Stockout Alert Status', table: '_Measures',   ago: '47d' },
          { name: 'Profit Margin Status',  table: '_Measures',   ago: '62d' },
          { name: 'Inventory Age Bucket',  table: '_Measures',   ago: '31d' },
          { name: 'Sales LY Delta',        table: '_Measures',   ago: '22d' },
        ],
        columnsList: [
          { name: 'Column1',        table: '_Measures',  ago: 'never' },
          { name: 'ChannelCode',    table: 'DimChannel', ago: '94d' },
          { name: 'Region2',        table: 'DimGeo',     ago: '72d' },
          { name: 'ReportingEntity',table: 'DimOrg',     ago: '45d' },
        ],
      },
      duplicates: [
        { a: 'Total Active Products', b: '7 identical copies', kind: 'exact', similarity: 100 },
        { a: 'Store Rank — Profit',   b: '3 identical copies', kind: 'exact', similarity: 100 },
        { a: 'Sales Growth %',        b: 'Sales MOM',           kind: 'similar', similarity: 86 },
      ],
      savings: {
        removable: 135, measures: 22, columns: 113, dupes: 8, reduction: 69,
        candidates: [
          { name: 'Stockout Alert Status', kind: 'measure', confidence: 'HIGH', reason: 'Not used in any report' },
          { name: 'Profit Margin Status',  kind: 'measure', confidence: 'HIGH', reason: 'Not used in any report' },
          { name: 'Inventory Age Bucket',  kind: 'measure', confidence: 'MED',  reason: 'Used only in a hidden page' },
          { name: 'ChannelCode',           kind: 'column',  confidence: 'HIGH', reason: 'No downstream references' },
        ],
      },
    },
    reports: {
      coverage: { measures: 2, measuresTotal: 47, columns: 1, columnsTotal: 149 },
      pages: [
        { id: 'p1', name: 'Retail Dashboard',      visuals: 12, measures: 2, cols: 1, hidden: false, thumbSeed: 'dash' },
        { id: 'p2', name: 'Store Rankings',         visuals: 6,  measures: 3, cols: 2, hidden: false, thumbSeed: 'rank' },
        { id: 'p3', name: 'Margin Analysis',        visuals: 8,  measures: 4, cols: 3, hidden: false, thumbSeed: 'marg' },
        { id: 'p4', name: 'Legacy — Old Dashboard', visuals: 4,  measures: 1, cols: 0, hidden: true,  thumbSeed: 'old' },
      ],
    },
  },

  // ─── User Intelligence (Data3.jsx) ───────────────────────────────────────
  userIntel: {
    summary: {
      totalUsers: 487,
      activeMTD: 312,
      copilotUsers: 42,
      sleepersCount: 17,
      monthlySpend: 18432,
      currency: '€',
    },
  },

  users: {
    departments: [
      { name: 'Finance',     headcount: 84, cu: 1284200, cost: 6420, share: 35, tone: 'sky' },
      { name: 'Operations',  headcount: 142, cu: 928400,  cost: 4642, share: 25, tone: 'emerald' },
      { name: 'Sales',       headcount: 73, cu: 612300,  cost: 3061, share: 16, tone: 'amber' },
      { name: 'HR',          headcount: 38, cu: 287600,  cost: 1438, share: 8,  tone: 'violet' },
      { name: 'IT',          headcount: 56, cu: 401400,  cost: 2007, share: 11, tone: 'rose' },
      { name: 'Unassigned',  headcount: 94, cu: 175900,  cost: 864,  share: 5,  tone: 'slate' },
    ],
    top: [
      { id: 'u1', name: 'Sara Patel',     email: 'sara.patel@contoso.com',     dept: 'Finance',    role: 'Senior Analyst',    cu: 184200, cost: 921, queries: 4823, datasets: 28, refreshes: 47, exports: 134, copilot: 312, spark: __spark(14, 14, 0.3), copilotRate: 0.34, status: 'power' },
      { id: 'u2', name: 'Michiel Vermeer',email: 'michiel.v@contoso.com',      dept: 'Finance',    role: 'BI Lead',           cu: 142800, cost: 714, queries: 3128, datasets: 41, refreshes: 89, exports: 86,  copilot: 248, spark: __spark(14, 12, 0.3), copilotRate: 0.41, status: 'power' },
      { id: 'u3', name: 'Anita Velasquez', email: 'anita.v@contoso.com',       dept: 'Operations', role: 'Ops Manager',       cu: 98400,  cost: 492, queries: 2840, datasets: 17, refreshes: 12, exports: 198, copilot: 56,  spark: __spark(14, 9, 0.4),  copilotRate: 0.08, status: 'power' },
      { id: 'u4', name: 'Daniel Okafor',   email: 'daniel.o@contoso.com',      dept: 'Sales',      role: 'Sales Director',    cu: 87100,  cost: 436, queries: 1962, datasets: 12, refreshes: 4,  exports: 312, copilot: 12,  spark: __spark(14, 8, 0.5),  copilotRate: 0.02, status: 'normal' },
      { id: 'u5', name: 'Emilia Rossi',    email: 'emilia.r@contoso.com',      dept: 'Operations', role: 'Plant Manager',     cu: 74600,  cost: 373, queries: 1543, datasets: 9,  refreshes: 8,  exports: 67,  copilot: 0,   spark: __spark(14, 7, 0.4),  copilotRate: 0,    status: 'normal' },
      { id: 'u6', name: 'Hans Berg',       email: 'hans.b@contoso.com',        dept: 'IT',         role: 'Data Engineer',     cu: 68300,  cost: 342, queries: 932,  datasets: 47, refreshes: 142, exports: 18, copilot: 184, spark: __spark(14, 6, 0.5),  copilotRate: 0.62, status: 'power' },
      { id: 'u7', name: 'Yuki Tanaka',     email: 'yuki.t@contoso.com',        dept: 'Finance',    role: 'Junior Analyst',    cu: 52900,  cost: 264, queries: 1843, datasets: 8,  refreshes: 6,  exports: 41,  copilot: 92,  spark: __spark(14, 5, 0.4),  copilotRate: 0.21, status: 'normal' },
      { id: 'u8', name: 'Maya Greenfield', email: 'maya.g@contoso.com',        dept: 'HR',         role: 'People Analyst',    cu: 41200,  cost: 206, queries: 1284, datasets: 6,  refreshes: 18, exports: 23,  copilot: 41,  spark: __spark(14, 4, 0.5),  copilotRate: 0.14, status: 'normal' },
      { id: 'u9', name: 'Jakub Nowak',     email: 'jakub.n@contoso.com',       dept: 'Operations', role: 'Logistics Analyst', cu: 38700,  cost: 193, queries: 1102, datasets: 14, refreshes: 5,  exports: 78,  copilot: 0,   spark: __spark(14, 3.7, 0.5),copilotRate: 0,    status: 'normal' },
      { id: 'u10',name: 'Priya Sharma',    email: 'priya.s@contoso.com',       dept: 'Sales',      role: 'Sales Analyst',     cu: 33400,  cost: 167, queries: 944,  datasets: 11, refreshes: 3,  exports: 156, copilot: 6,   spark: __spark(14, 3.2, 0.4),copilotRate: 0.01, status: 'normal' },
      { id: 'u11',name: 'Felix Beaumont',  email: 'felix.b@contoso.com',       dept: 'Finance',    role: 'Controller',        cu: 28900,  cost: 145, queries: 712,  datasets: 22, refreshes: 9,  exports: 89,  copilot: 0,   spark: __spark(14, 2.7, 0.5),copilotRate: 0,    status: 'normal' },
      { id: 'u12',name: 'Lena Hofmann',    email: 'lena.h@contoso.com',        dept: 'IT',         role: 'DBA',               cu: 24300,  cost: 122, queries: 412,  datasets: 38, refreshes: 78, exports: 4,   copilot: 22,  spark: __spark(14, 2.3, 0.6),copilotRate: 0.18, status: 'normal' },
    ],
  },

  userDetail: {
    heatmap: Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hr) => {
        const workHr = hr >= 8 && hr <= 18;
        const workDay = day < 5;
        const base = workHr && workDay ? 6 : (hr >= 19 && hr <= 22 && workDay) ? 1.5 : workDay ? 0.5 : 0.3;
        return Math.max(0, Math.round((base + Math.sin(hr * 0.4 + day) * 1.5 + Math.random() * 2) * (workHr && workDay ? 1.2 : 0.6)));
      })
    ),
    recent: [
      { at: '14:42', op: 'ViewReport',    target: 'Sales Analytics · Margin Dashboard', tone: 'sky' },
      { at: '14:38', op: 'AskCopilot',    target: '"trend in EMEA Q1 revenue?"',         tone: 'violet' },
      { at: '14:21', op: 'ExportData',    target: 'Sales Analytics · top-customers',     tone: 'amber' },
      { at: '13:55', op: 'EditDataset',   target: 'Budget Planning · YTD Variance',      tone: 'rose' },
      { at: '13:12', op: 'ViewReport',    target: 'Revenue Forecast · Q2 outlook',       tone: 'sky' },
      { at: '12:08', op: 'RefreshDataset',target: 'Budget Planning',                     tone: 'emerald' },
      { at: '11:34', op: 'ViewReport',    target: 'Sales Analytics · Pipeline',          tone: 'sky' },
    ],
    datasets: [
      { name: 'Sales Analytics',   ws: 'Finance-Prod', queries: 1840, share: 38 },
      { name: 'Budget Planning',   ws: 'Finance-Prod', queries: 1284, share: 27 },
      { name: 'Revenue Forecast',  ws: 'Finance-Prod', queries: 612,  share: 13 },
      { name: 'Marketing Funnel',  ws: 'Marketing',    queries: 487,  share: 10 },
      { name: 'HR Headcount',      ws: 'HR-Data',      queries: 312,  share: 6  },
      { name: '6 others',          ws: '—',            queries: 288,  share: 6  },
    ],
  },

  adoption: {
    dau: { v: 124, delta: 8, spark: __spark(30, 100, 0.2) },
    wau: { v: 287, delta: 3, spark: __spark(30, 250, 0.15) },
    mau: { v: 419, delta: 12, spark: __spark(30, 380, 0.1) },
    stickiness: 0.42,
    funnel: [
      { stage: 'Invited',         count: 487, rate: 1.00 },
      { stage: 'First sign-in',   count: 412, rate: 0.85 },
      { stage: 'First query',     count: 358, rate: 0.74 },
      { stage: 'Second session',  count: 304, rate: 0.62 },
      { stage: 'Weekly active',   count: 212, rate: 0.44 },
      { stage: 'Power user',      count: 38,  rate: 0.08 },
    ],
    cohorts: [
      { month: 'Nov',   new: 18, retained: 14, m2: 11, m3: 9 },
      { month: 'Dec',   new: 24, retained: 19, m2: 16, m3: 12 },
      { month: 'Jan',   new: 31, retained: 26, m2: 22, m3: 17 },
      { month: 'Feb',   new: 28, retained: 24, m2: 19, m3: null },
      { month: 'Mar',   new: 36, retained: 32, m2: null, m3: null },
      { month: 'Apr',   new: 42, retained: null, m2: null, m3: null },
    ],
    copilot: {
      eligible: 487, active: 42, share: 0.086,
      sessionsWeek: 1284,
      ack: 0.78,
      weekly: __spark(12, 80, 0.4).map(v => Math.max(20, v * 14)),
      topUsers: [
        { name: 'Hans Berg',        sessions: 184, ack: 0.82 },
        { name: 'Michiel Vermeer',  sessions: 248, ack: 0.71 },
        { name: 'Sara Patel',       sessions: 312, ack: 0.84 },
        { name: 'Yuki Tanaka',      sessions: 92,  ack: 0.69 },
      ],
      types: [
        { kind: 'Summarise',     count: 412, share: 32 },
        { kind: 'Explain DAX',   count: 318, share: 25 },
        { kind: 'Q&A',           count: 287, share: 22 },
        { kind: 'Suggest visual',count: 164, share: 13 },
        { kind: 'Other',         count: 103, share: 8  },
      ],
    },
  },

  sleepers: {
    summary: { count: 17, refreshes30d: 1840, wastedCU: 142300, wastedCost: 712, biggestStale: 94 },
    candidates: [
      { id: 's1', name: 'Marketing Funnel 2024',   ws: 'Marketing',    refreshes30d: 240, lastQuery: 94, queries30d: 0, cost: 184, status: 'archive', size: '2.4 GB', refreshSched: 'Hourly' },
      { id: 's2', name: 'Legacy Sales (Q3-Q4 2023)',ws: 'Finance-Prod', refreshes30d: 120, lastQuery: 78, queries30d: 0, cost: 96,  status: 'archive', size: '4.1 GB', refreshSched: '4× daily' },
      { id: 's3', name: 'HR Onboarding Pipeline',  ws: 'HR-Data',      refreshes30d: 90,  lastQuery: 64, queries30d: 0, cost: 72,  status: 'archive', size: '480 MB', refreshSched: '3× daily' },
      { id: 's4', name: 'Plant Output (PILOT)',    ws: 'Operations',   refreshes30d: 240, lastQuery: 52, queries30d: 0, cost: 184, status: 'archive', size: '1.2 GB', refreshSched: 'Hourly' },
      { id: 's5', name: 'Q1 Audit Snapshot',       ws: 'Finance-Prod', refreshes30d: 60,  lastQuery: 41, queries30d: 0, cost: 48,  status: 'archive', size: '320 MB', refreshSched: '2× daily' },
      { id: 's6', name: 'Field Sales Mobile',      ws: 'Sales',        refreshes30d: 180, lastQuery: 12, queries30d: 4, cost: 142, status: 'review',  size: '1.8 GB', refreshSched: '6× daily' },
      { id: 's7', name: 'Pricing Strategy DEV',    ws: 'Sandbox',      refreshes30d: 240, lastQuery: 8,  queries30d: 2, cost: 184, status: 'review',  size: '210 MB', refreshSched: 'Hourly' },
    ],
    refreshLatency: [
      { dataset: 'Sales Analytics',    refresh: '04:00', firstQuery: '08:14', wait: 254, recommendation: 'good'   },
      { dataset: 'Budget Planning',    refresh: '04:30', firstQuery: '09:42', wait: 312, recommendation: 'good'   },
      { dataset: 'Revenue Forecast',   refresh: '00:00', firstQuery: '09:18', wait: 558, recommendation: 'shift'  },
      { dataset: 'HR Headcount',       refresh: '02:00', firstQuery: '10:33', wait: 513, recommendation: 'shift'  },
      { dataset: 'Marketing Funnel',   refresh: '03:00', firstQuery: '08:48', wait: 348, recommendation: 'good'   },
    ],
  },

  audit: {
    summary: { exports30d: 1284, exportsAfterHours: 47, rlsRules: 23, rlsNeverFire: 4 },
    exports: [
      { at: '2026-05-11 14:21', user: 'Sara Patel',      dataset: 'Sales Analytics',    report: 'Margin Dashboard',  format: 'CSV',   rows: 12840,  sens: 'Confidential', flag: false },
      { at: '2026-05-11 11:08', user: 'Michiel Vermeer', dataset: 'Revenue Forecast',   report: 'Q2 Outlook',        format: 'XLSX',  rows: 2142,   sens: 'Internal',     flag: false },
      { at: '2026-05-11 09:42', user: 'Anita Velasquez', dataset: 'Operations Scorecard',report: 'KPI Heatmap',      format: 'PDF',   rows: null,    sens: 'Internal',     flag: false },
      { at: '2026-05-11 02:34', user: 'svc-bi-runner',   dataset: 'Budget Planning',    report: 'YTD Variance',      format: 'CSV',   rows: 48120,  sens: 'Restricted',   flag: true },
      { at: '2026-05-10 22:17', user: 'Daniel Okafor',   dataset: 'Sales Analytics',    report: 'Pipeline detail',   format: 'XLSX',  rows: 6204,   sens: 'Confidential', flag: true },
      { at: '2026-05-10 14:55', user: 'Maya Greenfield', dataset: 'HR Headcount',       report: 'Attrition',         format: 'PDF',   rows: null,    sens: 'Restricted',   flag: false },
      { at: '2026-05-10 11:18', user: 'Yuki Tanaka',     dataset: 'Sales Analytics',    report: 'EMEA Q1',           format: 'CSV',   rows: 8412,   sens: 'Confidential', flag: false },
      { at: '2026-05-10 03:08', user: 'Felix Beaumont',  dataset: 'Budget Planning',    report: 'Forecast vs Actual',format: 'XLSX',  rows: 5184,   sens: 'Restricted',   flag: true },
    ],
    offHoursHeatmap: Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hr) => {
        const work = hr >= 8 && hr <= 18 && day < 5;
        return Math.max(0, Math.round(
          (work ? 14 : (day >= 5 ? 2 : 1.2))
          + Math.sin(hr * 0.4 + day) * 1.6
          + Math.random() * (work ? 4 : 1.5)
        ));
      })
    ),
    rlsRules: [
      { id: 'RLS-001', model: 'Sales Analytics',    role: 'EU Sales',    fires30d: 18420, lastFire: '8m ago', status: 'active' },
      { id: 'RLS-002', model: 'Sales Analytics',    role: 'US Sales',    fires30d: 22180, lastFire: '12m ago',status: 'active' },
      { id: 'RLS-003', model: 'Sales Analytics',    role: 'APAC Sales',  fires30d: 8410,  lastFire: '34m ago',status: 'active' },
      { id: 'RLS-004', model: 'Budget Planning',    role: 'Finance HQ',  fires30d: 4280,  lastFire: '2h ago', status: 'active' },
      { id: 'RLS-005', model: 'Budget Planning',    role: 'Finance EMEA',fires30d: 1840,  lastFire: '4h ago', status: 'active' },
      { id: 'RLS-006', model: 'HR Headcount',       role: 'HR Admin',    fires30d: 612,    lastFire: '6h ago', status: 'active' },
      { id: 'RLS-007', model: 'HR Headcount',       role: 'Regional HR', fires30d: 0,      lastFire: 'never',  status: 'never' },
      { id: 'RLS-008', model: 'Operations Scorecard',role:'Plant Admin', fires30d: 14280, lastFire: '4m ago', status: 'active' },
      { id: 'RLS-009', model: 'Operations Scorecard',role:'Plant Ops',   fires30d: 9140,  lastFire: '11m ago',status: 'active' },
      { id: 'RLS-010', model: 'Marketing Funnel',   role: 'Marketing US',fires30d: 0,      lastFire: 'never',  status: 'never' },
      { id: 'RLS-011', model: 'Marketing Funnel',   role: 'Marketing EU',fires30d: 0,      lastFire: 'never',  status: 'never' },
      { id: 'RLS-012', model: 'Revenue Forecast',   role: 'Finance HQ',  fires30d: 0,      lastFire: 'never',  status: 'never' },
    ],
  },

  // ─── Capacity & Cost Attribution (Data4.jsx) ─────────────────────────────
  capacities: [
    { id: 'cap-prd', name: 'SBM-PRD',  sku: 'F8', vCores: 8, currency: 'EUR', monthlyBill: 5847, capacityCU: 28800,
      hasPricing: true, status: 'healthy', cuAvg30: 64, cuPeak30: 91, throttle7d: 1, env: 'F64-prod-we' },
    { id: 'cap-snd', name: 'SBM-SND',  sku: 'F2', vCores: 2, currency: 'EUR', monthlyBill: 1462, capacityCU: 7200,
      hasPricing: true, status: 'idle',    cuAvg30: 12, cuPeak30: 28, throttle7d: 0, env: 'F64-prod-we' },
    { id: 'cap-uat', name: 'SBM-UAT',  sku: 'F4', vCores: 4, currency: 'USD', monthlyBill: 0,    capacityCU: 14400,
      hasPricing: false,status: 'healthy', cuAvg30: 38, cuPeak30: 62, throttle7d: 0, env: 'F64-prod-we' },
  ],

  capacityCU: {
    'cap-prd': __wkSpark(30, 64, 0.35, 7),
    'cap-snd': __wkSpark(30, 12, 0.50, 13),
    'cap-uat': __wkSpark(30, 38, 0.30, 21),
  },
  capacityCU24h: {
    'cap-prd': __wkSpark(24, 64, 0.40, 31),
    'cap-snd': __wkSpark(24, 12, 0.55, 37),
    'cap-uat': __wkSpark(24, 38, 0.35, 41),
  },
  capacityCU7d: {
    'cap-prd': __wkSpark(28, 64, 0.35, 43),
    'cap-snd': __wkSpark(28, 12, 0.50, 47),
    'cap-uat': __wkSpark(28, 38, 0.30, 53),
  },

  perCapacityCutover: '2026-04-22',

  costItems: {
    'cap-prd': [
      { ws: 'Finance-Prod', tone: 'sky', items: [
        { name: 'Sales Analytics',     type: 'Power BI',  cu: 184200, costPct: 21.1 },
        { name: 'Budget Planning',     type: 'Power BI',  cu: 142800, costPct: 16.4 },
        { name: 'YTD Pipeline',        type: 'Pipeline',  cu:  98400, costPct: 11.3 },
        { name: 'Revenue Forecast',    type: 'Power BI',  cu:  62100, costPct:  7.1 },
        { name: 'GL Reconciliation',   type: 'Dataflow',  cu:  41200, costPct:  4.7 },
      ]},
      { ws: 'Operations', tone: 'emerald', items: [
        { name: 'Ops Scorecard',       type: 'Power BI',  cu:  87100, costPct: 10.0 },
        { name: 'Plant Output Spark',  type: 'Spark',     cu:  74600, costPct:  8.6 },
        { name: 'Equipment Telemetry', type: 'Dataset',   cu:  38700, costPct:  4.4 },
      ]},
      { ws: 'Sales', tone: 'amber', items: [
        { name: 'Pipeline 360',        type: 'Power BI',  cu:  56400, costPct:  6.5 },
        { name: 'CRM Sync',            type: 'Pipeline',  cu:  28900, costPct:  3.3 },
        { name: 'Lead Score Notebook', type: 'Spark',     cu:  18400, costPct:  2.1 },
      ]},
      { ws: 'Marketing', tone: 'violet', items: [
        { name: 'Funnel Dashboard',    type: 'Power BI',  cu:  24300, costPct:  2.8 },
        { name: 'Campaign Lake',       type: 'Dataflow',  cu:  12100, costPct:  1.4 },
      ]},
      { ws: 'HR-Data', tone: 'rose', items: [
        { name: 'Headcount Model',     type: 'Power BI',  cu:   8400, costPct:  1.0 },
      ]},
    ],
    'cap-snd': [
      { ws: 'Sandbox', tone: 'slate', items: [
        { name: 'Pricing Strategy DEV', type: 'Power BI', cu: 18400, costPct: 52 },
        { name: 'Test Notebook',        type: 'Spark',    cu:  9200, costPct: 26 },
        { name: 'Ad-hoc Queries',       type: 'Dataset',  cu:  4300, costPct: 12 },
        { name: 'Migration Scratch',    type: 'Pipeline', cu:  3500, costPct: 10 },
      ]},
    ],
    'cap-uat': [],
  },

  workloadMix: {
    'cap-prd': __mkStack(28800 * 0.64, 17),
    'cap-snd': __mkStack(7200 * 0.12, 23),
    'cap-uat': __mkStack(14400 * 0.38, 29),
  },

  workloadTypes: [
    { key: 'powerbi',  label: 'Power BI',  color: 'oklch(0.66 0.18 75)'  },
    { key: 'dataflow', label: 'Dataflow',  color: 'oklch(0.62 0.18 237)' },
    { key: 'pipeline', label: 'Pipeline',  color: 'oklch(0.58 0.14 150)' },
    { key: 'spark',    label: 'Spark',     color: 'oklch(0.58 0.18 290)' },
    { key: 'dataset',  label: 'Dataset',   color: 'oklch(0.58 0.20 25)'  },
    { key: 'other',    label: 'Other',     color: 'oklch(0.55 0.03 250)' },
  ],

  peakHeat: {
    'cap-prd': __mkHeat(64, 91, 11),
    'cap-snd': __mkHeat(12, 28, 19),
    'cap-uat': __mkHeat(38, 62, 27),
  },

  // ─── Schema Moat (Data5.jsx) ─────────────────────────────────────────────
  licenses: {
    tenantSpend: 33840,
    reclaimable: 4700,
    reclaimableCount: 47,
    unassigned: 18,
    mfaCoverage: 0.87,
    mfaTotal: 487,
    mfaMissing: 63,
    skus: [
      { sku: 'Power BI Pro',       skuPart: 'PBI_PRO',       total: 320, consumed: 286, monthly: 9.99,  color: 'sky',     family: 'Power BI', stale: 47, list: 9.99 },
      { sku: 'Power BI PPU',       skuPart: 'PBI_PREMIUM_P', total:  18, consumed:  18, monthly: 19.99, color: 'violet',  family: 'Power BI', stale: 2,  list: 19.99 },
      { sku: 'Fabric Free',        skuPart: 'FABRIC_FREE',   total: 200, consumed: 124, monthly: 0,     color: 'slate',   family: 'Fabric',   stale: 0,  list: 0 },
      { sku: 'Microsoft 365 E5',   skuPart: 'M365_E5',       total: 350, consumed: 312, monthly: 53.30, color: 'emerald', family: 'M365',     stale: 12, list: 53.30 },
      { sku: 'Microsoft 365 E3',   skuPart: 'M365_E3',       total: 140, consumed: 124, monthly: 33.10, color: 'amber',   family: 'M365',     stale: 8,  list: 33.10 },
    ],
    reclaimList: [
      { name: 'Daniel Okafor',   dept: 'Sales',      sku: 'Power BI Pro', lastActive: 47, sessions30d: 0, cost: 9.99, status: 'reclaim' },
      { name: 'Priya Sharma',    dept: 'Sales',      sku: 'Power BI Pro', lastActive: 38, sessions30d: 0, cost: 9.99, status: 'reclaim' },
      { name: 'Felix Beaumont',  dept: 'Finance',    sku: 'Power BI Pro', lastActive: 32, sessions30d: 1, cost: 9.99, status: 'reclaim' },
      { name: 'Lena Hofmann',    dept: 'IT',         sku: 'Power BI Pro', lastActive: 31, sessions30d: 2, cost: 9.99, status: 'reclaim' },
      { name: 'Jakub Nowak',     dept: 'Operations', sku: 'Power BI Pro', lastActive: 28, sessions30d: 0, cost: 9.99, status: 'reclaim' },
      { name: 'Yuki Tanaka',     dept: 'Finance',    sku: 'Power BI Pro', lastActive: 22, sessions30d: 4, cost: 9.99, status: 'downgrade' },
      { name: 'Maya Greenfield', dept: 'HR',         sku: 'Power BI Pro', lastActive: 18, sessions30d: 6, cost: 9.99, status: 'downgrade' },
    ],
    mfaMissingList: [
      { name: 'svc-bi-runner',       role: 'Service Account', dept: 'IT',      lastActive: 0,  admin: true },
      { name: 'svc-fabric-ingest',   role: 'Service Account', dept: 'IT',      lastActive: 0,  admin: true },
      { name: 'Contractor: J. Okoye',role: 'External',        dept: 'Sales',   lastActive: 4,  admin: false },
      { name: 'Anna Kowalski',       role: 'Member',          dept: 'Finance', lastActive: 1,  admin: false },
    ],
  },

  reports: {
    total: 184,
    orphaned: 7,
    dormant: 23,
    withoutRefresh: 12,
    items: [
      { name: 'Margin Dashboard',         ws: 'Finance-Prod',   type: 'Power BI',   dataset: 'Sales Analytics',          viewers30: 142, opens30: 1842, modified: '2d ago',   status: 'healthy', refresh: 'ok',     visuals: 12, tone: 'sky' },
      { name: 'Pipeline 360',             ws: 'Sales',          type: 'Power BI',   dataset: 'Sales Analytics',          viewers30: 84,  opens30: 612,  modified: '5d ago',   status: 'healthy', refresh: 'ok',     visuals: 14, tone: 'amber' },
      { name: 'YTD Variance Report',      ws: 'Finance-Prod',   type: 'Paginated',  dataset: 'Budget Planning',          viewers30: 38,  opens30: 287,  modified: '1w ago',   status: 'healthy', refresh: 'ok',     visuals: 4,  tone: 'sky' },
      { name: 'Q4 Sales Snapshot 2024',   ws: 'Sales',          type: 'Power BI',   dataset: 'Legacy Sales',             viewers30: 0,   opens30: 0,    modified: '94d ago',  status: 'orphan',  refresh: 'failed', visuals: 18, tone: 'amber' },
      { name: 'EMEA Quarterly Review',    ws: 'Finance-Prod',   type: 'Power BI',   dataset: 'Revenue Forecast',         viewers30: 22,  opens30: 124,  modified: '3w ago',   status: 'healthy', refresh: 'ok',     visuals: 9,  tone: 'sky' },
      { name: 'Plant Output Live',        ws: 'Operations',     type: 'Power BI',   dataset: 'Plant Output (PILOT)',     viewers30: 4,   opens30: 18,   modified: '47d ago',  status: 'dormant', refresh: 'stale',  visuals: 7,  tone: 'emerald' },
      { name: 'Marketing Funnel 2024',    ws: 'Marketing',      type: 'Power BI',   dataset: 'Marketing Funnel 2024',    viewers30: 0,   opens30: 0,    modified: '94d ago',  status: 'orphan',  refresh: 'stale',  visuals: 11, tone: 'violet' },
      { name: 'HR Attrition',             ws: 'HR-Data',        type: 'Power BI',   dataset: 'HR Headcount',             viewers30: 17,  opens30: 84,   modified: '12d ago',  status: 'healthy', refresh: 'ok',     visuals: 6,  tone: 'rose' },
      { name: 'Operations Scorecard',     ws: 'Ops-Score',      type: 'Power BI',   dataset: 'Ops Scorecard',            viewers30: 64,  opens30: 412,  modified: '4d ago',   status: 'healthy', refresh: 'ok',     visuals: 8,  tone: 'emerald' },
      { name: 'Stockout Alert Status',    ws: 'Operations',     type: 'Power BI',   dataset: '(deleted)',                viewers30: 0,   opens30: 0,    modified: '187d ago', status: 'broken',  refresh: 'na',     visuals: 3,  tone: 'rose' },
    ],
  },

  apps: {
    total: 18,
    audienceTotal: 1840,
    dormantCount: 4,
    items: [
      { name: 'Sales Q4 Insights',    ws: 'Sales',         audience: 412, opens30: 8,   updated: '94d ago',  status: 'dormant',  reports: 4, tone: 'amber' },
      { name: 'Finance Executive',    ws: 'Finance-Prod',  audience: 28,  opens30: 142, updated: '4d ago',   status: 'healthy',  reports: 6, tone: 'sky' },
      { name: 'Plant Operations',     ws: 'Operations',    audience: 184, opens30: 612, updated: '6d ago',   status: 'healthy',  reports: 5, tone: 'emerald' },
      { name: 'HR Self-Service',      ws: 'HR-Data',       audience: 487, opens30: 184, updated: '12d ago',  status: 'healthy',  reports: 3, tone: 'rose' },
      { name: 'Marketing Funnel',     ws: 'Marketing',     audience: 64,  opens30: 0,   updated: '187d ago', status: 'dormant',  reports: 2, tone: 'violet' },
      { name: 'CFO Briefing',         ws: 'Finance-Prod',  audience: 12,  opens30: 42,  updated: '2d ago',   status: 'healthy',  reports: 4, tone: 'sky' },
    ],
  },

  lineage: {
    totalItems: 487,
    newCategories: 6,
    sleeperItems: 41,
    nodes: [
      { id: 'src-sql',    type: 'Source',      kind: 'SQL Server',    label: 'srv-eu.sql.azure',    x: 80,   y: 80,  cost: 0,   lastSeen: 'now',  layer: 0 },
      { id: 'src-blob',   type: 'Source',      kind: 'Blob storage',  label: 'datalake-prd',         x: 80,   y: 220, cost: 0,   lastSeen: 'now',  layer: 0 },
      { id: 'src-api',    type: 'Source',      kind: 'REST API',      label: 'CRM API',              x: 80,   y: 360, cost: 0,   lastSeen: 'now',  layer: 0 },
      { id: 'lh-1',       type: 'Lakehouse',   kind: 'Lakehouse',     label: 'finance_lake',         x: 280,  y: 120, cost: 184, lastSeen: '4m',   layer: 1 },
      { id: 'lh-2',       type: 'Lakehouse',   kind: 'Lakehouse',     label: 'Legacy_2023',          x: 280,  y: 260, cost: 410, lastSeen: '187d', status: 'sleeper', layer: 1 },
      { id: 'wh-1',       type: 'Warehouse',   kind: 'Warehouse',     label: 'finance_wh',           x: 280,  y: 380, cost: 142, lastSeen: '8m',   layer: 1 },
      { id: 'nb-1',       type: 'Notebook',    kind: 'Notebook',      label: 'sales-etl.ipynb',      x: 460,  y: 80,  cost:  62, lastSeen: '2h',   layer: 2 },
      { id: 'nb-2',       type: 'Notebook',    kind: 'Notebook',      label: 'price-model.ipynb',    x: 460,  y: 200, cost: 318, lastSeen: '6m',   layer: 2 },
      { id: 'pipe-1',     type: 'Pipeline',    kind: 'Pipeline',      label: 'CRM Sync',             x: 460,  y: 320, cost:  98, lastSeen: '1h',   layer: 2 },
      { id: 'sm-1',       type: 'Semantic',    kind: 'Semantic model',label: 'Sales Analytics',      x: 640,  y: 100, cost: 487, lastSeen: '12m',  layer: 3 },
      { id: 'sm-2',       type: 'Semantic',    kind: 'Semantic model',label: 'Revenue Forecast',     x: 640,  y: 240, cost: 142, lastSeen: '34m',  layer: 3 },
      { id: 'sm-3',       type: 'Semantic',    kind: 'Semantic model',label: 'Legacy Sales',         x: 640,  y: 360, cost: 218, lastSeen: '78d',  status: 'sleeper', layer: 3 },
      { id: 'rpt-1',      type: 'Report',      kind: 'Report',        label: 'Margin Dashboard',     x: 820,  y: 60,  cost: 0,   lastSeen: '8m',   layer: 4 },
      { id: 'rpt-2',      type: 'Report',      kind: 'Report',        label: 'Pipeline 360',         x: 820,  y: 140, cost: 0,   lastSeen: '24m',  layer: 4 },
      { id: 'rpt-3',      type: 'Report',      kind: 'Report',        label: 'EMEA Quarterly',       x: 820,  y: 240, cost: 0,   lastSeen: '1h',   layer: 4 },
      { id: 'rpt-4',      type: 'Report',      kind: 'Report',        label: 'Q4 Sales 2024',        x: 820,  y: 340, cost: 0,   lastSeen: '94d',  status: 'orphan', layer: 4 },
      { id: 'app-1',      type: 'App',         kind: 'App',           label: 'Finance Executive',    x: 1000, y: 100, cost: 0,   lastSeen: '12m',  layer: 5 },
      { id: 'app-2',      type: 'App',         kind: 'App',           label: 'Sales Q4 Insights',    x: 1000, y: 280, cost: 0,   lastSeen: '4d',   status: 'dormant', layer: 5 },
    ],
    edges: [
      ['src-sql', 'lh-1'],   ['src-blob', 'lh-2'], ['src-blob', 'wh-1'], ['src-api', 'pipe-1'],
      ['lh-1', 'nb-1'],      ['lh-1', 'nb-2'],     ['wh-1', 'pipe-1'],   ['lh-2', 'sm-3'],
      ['nb-1', 'sm-1'],      ['nb-2', 'sm-2'],     ['pipe-1', 'sm-1'],   ['pipe-1', 'sm-2'],
      ['sm-1', 'rpt-1'],     ['sm-1', 'rpt-2'],    ['sm-2', 'rpt-3'],    ['sm-3', 'rpt-4'],
      ['rpt-1', 'app-1'],    ['rpt-3', 'app-1'],   ['rpt-2', 'app-2'],
    ],
  },

  access: {
    groupsTotal: 47,
    assignmentsTotal: 312,
    privilegedCount: 14,
    staleAssignments: 23,
    groups: [
      { name: 'Finance-Admins',        members: 23, inactive: 4,  workspaces: 8, role: 'Admin',       risk: 'high',   updated: '12d ago' },
      { name: 'Sales-Contributors',    members: 84, inactive: 12, workspaces: 5, role: 'Contributor', risk: 'med',    updated: '4d ago' },
      { name: 'Operations-Viewers',    members:142, inactive: 8,  workspaces: 12,role: 'Viewer',      risk: 'low',    updated: '8d ago' },
      { name: 'BI-Power-Users',        members: 38, inactive: 2,  workspaces: 18,role: 'Member',      risk: 'med',    updated: '2d ago' },
      { name: 'HR-Limited',            members: 12, inactive: 0,  workspaces: 2, role: 'Viewer',      risk: 'low',    updated: '6d ago' },
      { name: 'IT-Service-Accounts',   members:  6, inactive: 0,  workspaces: 23,role: 'Admin',       risk: 'high',   updated: '34d ago' },
      { name: 'Marketing-Editors',     members: 28, inactive: 6,  workspaces: 4, role: 'Member',      risk: 'low',    updated: '14d ago' },
      { name: 'Legacy-Sales-2023',     members: 18, inactive: 18, workspaces: 3, role: 'Admin',       risk: 'high',   updated: '187d ago', stale: true },
    ],
    assignments: [
      { workspace: 'Sales-Prod',       principal: 'Finance-Admins',      kind: 'Group',  role: 'Admin',       members: 23, lastUsed: '4d ago',   risk: 'high' },
      { workspace: 'Finance-Prod',     principal: 'Finance-Admins',      kind: 'Group',  role: 'Admin',       members: 23, lastUsed: '1d ago',   risk: 'high' },
      { workspace: 'Finance-Prod',     principal: 'BI-Power-Users',      kind: 'Group',  role: 'Member',      members: 38, lastUsed: '4h ago',   risk: 'low' },
      { workspace: 'Operations',       principal: 'IT-Service-Accounts', kind: 'Group',  role: 'Admin',       members:  6, lastUsed: '34d ago',  risk: 'high' },
      { workspace: 'Marketing',        principal: 'Legacy-Sales-2023',   kind: 'Group',  role: 'Admin',       members: 18, lastUsed: '187d ago', risk: 'high', stale: true },
      { workspace: 'HR-Data',          principal: 'HR-Limited',          kind: 'Group',  role: 'Viewer',      members: 12, lastUsed: '6d ago',   risk: 'low' },
      { workspace: 'Sandbox',          principal: 'sara.patel@…',        kind: 'User',   role: 'Admin',       members:  1, lastUsed: '1d ago',   risk: 'med' },
      { workspace: 'Sales',            principal: 'svc-bi-runner',       kind: 'ServicePrincipal', role: 'Admin', members: 1, lastUsed: '4m ago', risk: 'high' },
    ],
  },
};

export default DATA;
