// Consolidated data for LayerPulse — combines Data.jsx through Data5.jsx

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
    // Capacities feed the /workspaces capacity selector + per-workspace $ cost math.
    // Pricing $ comes from the Capacity Pricing card in Settings; CU-share allocates spend across workspaces.
    capacities: [
      { id: 'cap-prd', name: 'Contoso Fabric — PROD',   sku: 'F64', region: 'west-europe', monthlyCost: 12400, currency: '$', avgCUPercent: 71, throttling: false },
      { id: 'cap-dev', name: 'Contoso Fabric — DEV/UAT', sku: 'F8',  region: 'west-europe', monthlyCost: 620,   currency: '$', avgCUPercent: 38, throttling: false },
    ],
    // Aggregate KPIs for the /workspaces strip. Recomputed at view time when capacity filter narrows.
    summary: {
      totalWorkspaces:    12,
      totalModels:        34,
      totalReports:       91,
      // Health Score (weighted: FinOps 40% · Quality 35% · Governance 25%)
      // FinOps  = (adoption 64 + capacity-eff 71 + license-eff 92) / 3 = 75.7
      // Quality = (doc coverage 78 + model quality avg 70) / 2     = 74
      // Gov     = governance compliance score                       = 48
      // Weighted = (75.7×40 + 74×35 + 48×25) / 100                  = 67
      health: { score: 67, finops: 76, quality: 74, governance: 48, weights: { finops: 40, quality: 35, governance: 25 } },
      totalCost:          { value: 17820, currency: '$', capacityCost: 13020, licenseCost: 4800 },
      wastedSpend:        { value: 2680,  currency: '$', sources: [
        { label: 'Unused Pro/PPU licenses',          amount: 1820, count: 17, hint: '17 seats with 0 activity / 30d — reclaim or downgrade' },
        { label: 'Dormant reports refresh CU',       amount: 552,  count: 14, hint: '14 reports unopened 90d still consuming refresh budget' },
        { label: 'Over-provisioned DEV/UAT capacity', amount: 308, count: 1,  hint: 'DEV F8 avg 38% — could downsize to F4 (–$310/mo)' },
      ]},
    },
    items: [
      { id: 'sales-prod',   name: 'Sales-Prod',          env: 'PROD', capacityId: 'cap-prd', star: true,  models: 5, reports: 18, scanned: '2h ago',  owner: 'A. Rivera',     iconTone: 'sky',     health: 88, costPerMo: 3420 },
      { id: 'finance-prod', name: 'Finance-Prod',        env: 'PROD', capacityId: 'cap-prd', star: true,  models: 8, reports: 26, scanned: '1d ago',  owner: 'M. Qureshi',    iconTone: 'violet',  health: 62, costPerMo: 4180 },
      { id: 'hr-data',      name: 'HR-Data',             env: 'DEV',  capacityId: 'cap-dev', star: false, models: 2, reports: 4,  scanned: '—',       owner: 'J. Patel',      iconTone: 'emerald', health: null, scanCta: true, costPerMo: 84 },
      { id: 'supply-uat',   name: 'Supply-Chain',        env: 'UAT',  capacityId: 'cap-dev', star: false, models: 4, reports: 9,  scanned: '6h ago',  owner: 'T. Hoffmann',   iconTone: 'amber',   health: 74, costPerMo: 168 },
      { id: 'retail-ops',   name: 'RetailOps',           env: 'PROD', capacityId: 'cap-prd', star: true,  models: 7, reports: 22, scanned: '12h ago', owner: 'S. Lindqvist',  iconTone: 'rose',    health: 92, costPerMo: 2980 },
      { id: 'mkt-dev',      name: 'Marketing',           env: 'DEV',  capacityId: 'cap-dev', star: false, models: 3, reports: 7,  scanned: '3d ago',  owner: 'P. Nguyen',      iconTone: 'sky',     health: 55, costPerMo: 142 },
      { id: 'ops-score',    name: 'Operations Scorecard',env: 'PROD', capacityId: 'cap-prd', star: false, models: 3, reports: 8,  scanned: '1d ago',  owner: 'K. Andersen',   iconTone: 'emerald', health: 81, costPerMo: 1820 },
      { id: 'ana-sbx',      name: 'Analytics-Sandbox',   env: 'DEV',  capacityId: 'cap-dev', star: false, models: 2, reports: 3,  scanned: '—',       owner: 'D. Okafor',     iconTone: 'violet',  health: null, scanCta: true, costPerMo: 56 },
    ],
  },

  workspaceDetail: {
    'finance-prod': {
      name: 'Finance-Prod', env: 'PROD',
      subtitle: 'Owned by M. Qureshi · 8 models · connected via Capacity Metrics App',
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
    stats: { modelsDocumented: 13, total: 52, outdated: 3, generated30d: 18, medianGenSec: 24 },
    pickerModels: [
      { id: 'sales-analytics',   name: 'Sales Analytics',       ws: 'Finance-Prod', env: 'PROD', tables: 12, measures: 42, columns: 156, rels: 18, lastGen: '9d ago',  status: 'outdated', tone: 'sky',     glossary: 38, owner: 'A. Rivera'    },
      { id: 'budget-planning',   name: 'Budget Planning',       ws: 'Finance-Prod', env: 'PROD', tables: 8,  measures: 15, columns: 84,  rels: 10, lastGen: '2d ago',  status: 'current',  tone: 'violet',  glossary: 21, owner: 'M. Qureshi'   },
      { id: 'kpi-dashboard',     name: 'KPI Dashboard',         ws: 'Finance-Prod', env: 'PROD', tables: 4,  measures: 28, columns: 52,  rels: 6,  lastGen: '1d ago',  status: 'current',  tone: 'emerald', glossary: 12, owner: 'M. Qureshi'   },
      { id: 'rev-forecast',      name: 'Revenue Forecast',      ws: 'Finance-Prod', env: 'PROD', tables: 9,  measures: 31, columns: 102, rels: 12, lastGen: '6h ago',  status: 'current',  tone: 'sky',     glossary: 19, owner: 'A. Rivera'    },
      { id: 'expense-pnl',       name: 'Expense P&L',           ws: 'Finance-Prod', env: 'PROD', tables: 11, measures: 38, columns: 124, rels: 14, lastGen: '2d ago',  status: 'current',  tone: 'amber',   glossary: 24, owner: 'A. Rivera'    },
      { id: 'gl-balances',       name: 'GL Balances',           ws: 'Finance-Prod', env: 'PROD', tables: 7,  measures: 22, columns: 64,  rels: 8,  lastGen: '5d ago',  status: 'outdated', tone: 'rose',    glossary: 14, owner: 'M. Qureshi'   },
      { id: 'retail-ops',        name: 'RetailOperations',      ws: 'RetailOps',    env: 'PROD', tables: 13, measures: 47, columns: 178, rels: 22, lastGen: '11m ago', status: 'current',  tone: 'rose',    glossary: 31, owner: 'S. Lindqvist' },
      { id: 'mgmt-change',       name: 'Management of Change',  ws: 'Operations',   env: 'PROD', tables: 46, measures: 30, columns: 412, rels: 38, lastGen: '1h ago',  status: 'current',  tone: 'amber',   glossary: 47, owner: 'S. Lindqvist' },
      { id: 'ops-scorecard',     name: 'Operations Scorecard',  ws: 'Ops-Score',    env: 'PROD', tables: 74, measures: 579,columns: 982, rels: 91, lastGen: '6h ago',  status: 'current',  tone: 'emerald', glossary: 88, owner: 'K. Andersen'  },
      { id: 'hr-headcount',      name: 'HR Headcount',          ws: 'HR-Data',      env: 'DEV',  tables: 6,  measures: 22, columns: 48,  rels: 7,  lastGen: '3d ago',  status: 'current',  tone: 'emerald', glossary: 11, owner: 'J. Patel'     },
      { id: 'marketing-funnel',  name: 'Marketing Funnel',      ws: 'Marketing',    env: 'DEV',  tables: 11, measures: 38, columns: 96,  rels: 13, lastGen: '5h ago',  status: 'current',  tone: 'sky',     glossary: 18, owner: 'P. Nguyen'    },
      { id: 'supply-pipeline',   name: 'Supply Chain Pipeline', ws: 'Supply-Chain', env: 'UAT',  tables: 18, measures: 54, columns: 198, rels: 24, lastGen: null,      status: 'never',    tone: 'amber',   glossary: 0,  owner: 'T. Hoffmann'  },
      { id: 'mooring-dash',      name: 'Mooring Dashboard',     ws: 'Operations',   env: 'PROD', tables: 9,  measures: 24, columns: 72,  rels: 11, lastGen: null,      status: 'never',    tone: 'violet',  glossary: 0,  owner: 'S. Lindqvist' },
    ],
    sections: [
      { group: 'Cover & summary', items: [
        { key: 'cover',   label: 'Cover page',          count: 1, default: true,  audiences: ['auditor','analyst','executive','engineer'] },
        { key: 'exec',    label: 'Executive summary',   count: 1, default: true,  audiences: ['auditor','executive']                     },
        { key: 'toc',     label: 'Table of contents',   count: 1, default: true,  audiences: ['auditor','analyst','engineer']            },
      ]},
      { group: 'Schema', items: [
        { key: 'tables',  label: 'Tables',                  countKey: 'tables',   default: true,  audiences: ['auditor','analyst','engineer'] },
        { key: 'columns', label: 'Columns + data types',    countKey: 'columns',  default: true,  audiences: ['auditor','analyst','engineer'] },
        { key: 'rels',    label: 'Relationships',           countKey: 'rels',     default: true,  audiences: ['auditor','analyst','engineer'] },
        { key: 'erd',     label: 'ER diagram',              count: 1,             default: false, audiences: ['analyst','engineer']           },
      ]},
      { group: 'Logic', items: [
        { key: 'measures',  label: 'Measures',              countKey: 'measures', default: true,  audiences: ['analyst','engineer','auditor'] },
        { key: 'dax',       label: 'DAX expressions',       countKey: 'measures', default: false, audiences: ['engineer']                     },
        { key: 'calc-cols', label: 'Calculated columns',    count: 14,            default: false, audiences: ['engineer']                     },
      ]},
      { group: 'Lineage', items: [
        { key: 'upstream',  label: 'Upstream sources',      count: 8,  default: false, audiences: ['analyst','engineer','auditor'] },
        { key: 'downstream',label: 'Downstream reports',    count: 11, default: false, audiences: ['analyst','engineer']           },
        { key: 'impact',    label: 'Impact analysis list',  count: 1,  default: false, audiences: ['engineer']                     },
      ]},
      { group: 'Governance', items: [
        { key: 'rls',       label: 'Row-level security rules', count: 6, default: false, audiences: ['auditor'] },
        { key: 'sens',      label: 'Sensitivity labels',       count: 4, default: false, audiences: ['auditor'] },
        { key: 'findings',  label: 'Governance findings',      count: 3, default: false, audiences: ['auditor'] },
      ]},
      { group: 'Context', items: [
        { key: 'glossary',  label: 'Business glossary',        countKey: 'glossary', default: false, audiences: ['analyst','executive'] },
        { key: 'owners',    label: 'Owners & stewards',        count: 4,             default: false, audiences: ['auditor','analyst']   },
        { key: 'changelog', label: 'Change log (last 90d)',    count: 12,            default: false, audiences: ['engineer','auditor']  },
      ]},
    ],
    audiences: [
      { key: 'auditor',   label: 'Auditor',     sub: 'SOC 2 / HIPAA evidence' },
      { key: 'analyst',   label: 'New analyst', sub: 'Onboarding handoff'    },
      { key: 'executive', label: 'Executive',   sub: 'QBR-ready summary'      },
      { key: 'engineer',  label: 'Engineer',    sub: 'Full technical detail'  },
      { key: 'custom',    label: 'Custom',      sub: 'Pick sections manually' },
    ],
    items: [
      { id: 'd1', model: 'RetailOperations',        ws: 'RetailOps',     audience: 'auditor',   format: 'docx', status: 'current',  schedule: 'weekly',  scheduleNext: 'Mon 06:00', updated: '11m ago', updatedAbs: '2026-05-17 11:23 UTC', size: '24.6 KB', tone: 'rose'    },
      { id: 'd2', model: 'Management of Change',    ws: 'Operations',    audience: 'engineer',  format: 'docx', status: 'current',  schedule: 'onchange', scheduleNext: 'on model change', updated: '1h ago',  updatedAbs: '2026-05-17 10:42 UTC', size: '38.1 KB', tone: 'amber'   },
      { id: 'd3', model: 'Operations Scorecard',    ws: 'Ops-Score',     audience: 'analyst',   format: 'docx', status: 'current',  schedule: 'monthly', scheduleNext: '1st of month', updated: '6h ago',  updatedAbs: '2026-05-17 05:31 UTC', size: '78.4 KB', tone: 'emerald' },
      { id: 'd4', model: 'Sales Analytics',         ws: 'Finance-Prod',  audience: 'auditor',   format: 'docx', status: 'outdated', schedule: 'off',                                  updated: '9d ago',  updatedAbs: '2026-05-08 09:14 UTC', size: '52.6 KB', tone: 'sky'     },
      { id: 'd5', model: 'Budget Planning',         ws: 'Finance-Prod',  audience: 'analyst',   format: 'docx', status: 'current',  schedule: 'weekly',  scheduleNext: 'Mon 06:00', updated: '2d ago',  updatedAbs: '2026-05-15 06:00 UTC', size: '21.5 KB', tone: 'violet'  },
      { id: 'd6', model: 'Revenue Forecast',        ws: 'Finance-Prod',  audience: 'executive', format: 'pdf',  status: 'outdated', schedule: 'off',                                  updated: '14d ago', updatedAbs: '2026-05-03 14:08 UTC', size: '18.9 KB', tone: 'amber'   },
      { id: 'd7', model: 'HR Headcount',            ws: 'HR-Data',       audience: 'auditor',   format: 'docx', status: 'current',  schedule: 'monthly', scheduleNext: '1st of month', updated: '3d ago',  updatedAbs: '2026-05-14 03:00 UTC', size: '19.2 KB', tone: 'emerald' },
      { id: 'd8', model: 'Marketing Funnel',        ws: 'Marketing',     audience: 'engineer',  format: 'md',   status: 'current',  schedule: 'off',                                  updated: '5h ago',  updatedAbs: '2026-05-17 06:22 UTC', size: '41.8 KB', tone: 'sky'     },
      { id: 'd9', model: 'Sales Analytics',         ws: 'Finance-Prod',  audience: 'analyst',   format: 'docx', status: 'outdated', schedule: 'off',                                  updated: '11d ago', updatedAbs: '2026-05-06 16:42 UTC', size: '48.3 KB', tone: 'sky'     },
      { id: 'd10',model: 'GL Balances',             ws: 'Finance-Prod',  audience: 'auditor',   format: 'docx', status: 'current',  schedule: 'weekly',  scheduleNext: 'Mon 06:00', updated: '4d ago',  updatedAbs: '2026-05-13 06:00 UTC', size: '22.8 KB', tone: 'rose'    },
      // Extra Sales Analytics variants so the model-detail docs tab shows all 4 audience renders.
      { id: 'd11',model: 'Sales Analytics',         ws: 'Finance-Prod',  audience: 'executive', format: 'pdf',  status: 'current',  schedule: 'weekly',  scheduleNext: 'Mon 06:00', updated: '11m ago',  updatedAbs: '2026-05-19 11:24 UTC', size: '12.2 KB', tone: 'amber'   },
      { id: 'd12',model: 'Sales Analytics',         ws: 'Finance-Prod',  audience: 'engineer',  format: 'docx', status: 'current',  schedule: 'onchange', scheduleNext: 'on model change', updated: '14m ago', updatedAbs: '2026-05-19 11:18 UTC', size: '64.1 KB', tone: 'violet'  },
    ],

    // Canonical sample-content block. Powers every rendered preview in the modal — the
    // model name in the heading is swapped with the selected library row / picker choice,
    // but the body content (tables, measures, DAX, RLS, lineage, etc.) stays the same so
    // every "View" demonstrates a fully-populated render. This is a mockup-only fixture;
    // the real renderer joins live joins via the back-end.
    sample: {
      execSummary: {
        canonicalModel: 'Sales Analytics',
        workspace: 'Finance-Prod',
        env: 'PROD',
        lastRefresh: '2026-05-17 04:00 UTC',
        kpis: [
          { label: 'Tables',               value: '5',     sub: '1 fact · 4 dim' },
          { label: 'Total rows',           value: '5.13M', sub: 'FactSales 4.2M' },
          { label: 'Measures',             value: '42',    sub: '8 documented' },
          { label: 'Active relationships', value: '4',     sub: '0 inactive' },
          { label: 'RLS rules',            value: '6',     sub: '4 region · 2 segment' },
          { label: 'Downstream reports',   value: '11',    sub: 'Top: Sales Pipeline (142 viewers)' },
        ],
        narrative: 'This model is the canonical source for tenant-wide revenue reporting. It joins 4.2M sales transactions to customer, product, geography, and date dimensions, and feeds 11 downstream reports across Finance, Sales, and Executive workspaces. RLS scopes data per region and per customer segment.',
      },
      tables: [
        { name: 'FactSales', kind: 'fact', rows: '4,217,408', cols: 14, partition: 'Date · monthly',
          columns: [
            { name: 'SalesKey',       type: 'Int64',           role: 'PK',               desc: 'Surrogate key — line-grain' },
            { name: 'DateKey',        type: 'Int64',           role: 'FK→DimDate',       desc: 'YYYYMMDD' },
            { name: 'CustomerKey',    type: 'Int64',           role: 'FK→DimCustomer',   desc: 'Surrogate; not customer business ID' },
            { name: 'ProductKey',     type: 'Int64',           role: 'FK→DimProduct',    desc: '' },
            { name: 'GeographyKey',   type: 'Int64',           role: 'FK→DimGeography',  desc: 'Ship-to geography' },
            { name: 'Quantity',       type: 'Decimal(18,4)',   role: 'fact',             desc: 'Units sold' },
            { name: 'UnitPrice',      type: 'Decimal(18,4)',   role: 'fact',             desc: 'Per-unit list price (LCY)' },
            { name: 'DiscountPct',    type: 'Decimal(5,4)',    role: 'fact',             desc: '0.00 – 1.00' },
            { name: 'NetAmountLCY',   type: 'Decimal(18,4)',   role: 'fact',             desc: 'Qty × UnitPrice × (1 − DiscountPct)' },
            { name: 'CostLCY',        type: 'Decimal(18,4)',   role: 'fact',             desc: 'COGS in LCY' },
          ],
        },
        { name: 'DimDate', kind: 'dim', rows: '14,610', cols: 12, partition: '—',
          columns: [
            { name: 'DateKey',        type: 'Int64',     role: 'PK',   desc: 'YYYYMMDD · 1990 → 2030' },
            { name: 'Date',           type: 'DateTime',  role: 'attr', desc: '' },
            { name: 'YearMonth',      type: 'Int64',     role: 'attr', desc: 'YYYYMM' },
            { name: 'CalQuarter',     type: 'Text',      role: 'attr', desc: 'Q1 — Q4' },
            { name: 'FiscalYear',     type: 'Int64',     role: 'attr', desc: 'Jul 1 – Jun 30' },
            { name: 'IsBusinessDay',  type: 'Boolean',   role: 'flag', desc: '' },
          ],
        },
        { name: 'DimCustomer', kind: 'dim', rows: '847,221', cols: 16, partition: '—',
          columns: [
            { name: 'CustomerKey',  type: 'Int64',  role: 'PK',   desc: 'Surrogate' },
            { name: 'CustomerID',   type: 'Text',   role: 'BK',   desc: 'Stable business key' },
            { name: 'CustomerName', type: 'Text',   role: 'attr', desc: 'Confidential · External' },
            { name: 'Segment',      type: 'Text',   role: 'attr', desc: 'SMB / Mid-Market / Enterprise' },
            { name: 'Region',       type: 'Text',   role: 'attr', desc: 'NA / EMEA / APAC / LATAM' },
            { name: 'TierCode',     type: 'Text',   role: 'attr', desc: 'A / B / C / D' },
          ],
        },
        { name: 'DimProduct', kind: 'dim', rows: '12,408', cols: 18, partition: '—',
          columns: [
            { name: 'ProductKey',   type: 'Int64',           role: 'PK',   desc: '' },
            { name: 'SKU',          type: 'Text',            role: 'BK',   desc: '' },
            { name: 'ProductName',  type: 'Text',            role: 'attr', desc: '' },
            { name: 'Category',     type: 'Text',            role: 'attr', desc: '' },
            { name: 'Subcategory',  type: 'Text',            role: 'attr', desc: '' },
            { name: 'ListPriceLCY', type: 'Decimal(18,4)',   role: 'attr', desc: 'Internal' },
          ],
        },
        { name: 'DimGeography', kind: 'dim', rows: '4,217', cols: 8, partition: '—',
          columns: [
            { name: 'GeographyKey', type: 'Int64', role: 'PK',   desc: '' },
            { name: 'Country',      type: 'Text',  role: 'attr', desc: 'ISO-3166 alpha-2' },
            { name: 'Region',       type: 'Text',  role: 'attr', desc: 'NA / EMEA / APAC / LATAM' },
            { name: 'SubRegion',    type: 'Text',  role: 'attr', desc: '' },
          ],
        },
      ],
      measures: [
        { name: '[Total Revenue (LCY)]', folder: 'Revenue', format: 'Currency · LCY · 2dp',
          desc: 'Sum of net amount from sales. Local currency, no conversion applied.',
          dax: 'SUM ( FactSales[NetAmountLCY] )',
          dependsOn: ['FactSales[NetAmountLCY]'] },
        { name: '[Total Revenue YoY %]', folder: 'Revenue · Time intelligence', format: 'Percentage · 1dp',
          desc: 'Year-over-year revenue growth versus same period last year.',
          dax: 'VAR _Current = [Total Revenue (LCY)]\nVAR _Prior   =\n  CALCULATE (\n    [Total Revenue (LCY)],\n    SAMEPERIODLASTYEAR ( DimDate[Date] )\n  )\nRETURN\n  DIVIDE ( _Current - _Prior, _Prior )',
          dependsOn: ['[Total Revenue (LCY)]', 'DimDate[Date]'] },
        { name: '[Gross Margin %]', folder: 'Profitability', format: 'Percentage · 1dp',
          desc: 'Gross margin as a share of revenue. Uses COGS at the line level.',
          dax: 'VAR _Rev  = [Total Revenue (LCY)]\nVAR _Cost = SUM ( FactSales[CostLCY] )\nRETURN\n  DIVIDE ( _Rev - _Cost, _Rev )',
          dependsOn: ['[Total Revenue (LCY)]', 'FactSales[CostLCY]'] },
        { name: '[Active Customers (90d)]', folder: 'Customers', format: 'Integer · thousands separator',
          desc: 'Distinct customers with at least one purchase in the last 90 days.',
          dax: 'CALCULATE (\n  DISTINCTCOUNT ( FactSales[CustomerKey] ),\n  DATESINPERIOD ( DimDate[Date], MAX ( DimDate[Date] ), -90, DAY )\n)',
          dependsOn: ['FactSales[CustomerKey]', 'DimDate[Date]'] },
        { name: '[AOV (LCY)]', folder: 'Customers', format: 'Currency · LCY · 2dp',
          desc: 'Average order value over the selected period.',
          dax: 'DIVIDE (\n  [Total Revenue (LCY)],\n  DISTINCTCOUNT ( FactSales[SalesKey] )\n)',
          dependsOn: ['[Total Revenue (LCY)]', 'FactSales[SalesKey]'] },
        { name: '[Revenue YTD (LCY)]', folder: 'Revenue · Time intelligence', format: 'Currency · LCY · 2dp',
          desc: 'Year-to-date revenue using fiscal calendar (Jul 1 anchor).',
          dax: 'CALCULATE (\n  [Total Revenue (LCY)],\n  DATESYTD ( DimDate[Date], "06-30" )\n)',
          dependsOn: ['[Total Revenue (LCY)]', 'DimDate[Date]'] },
        { name: '[Top 10 Customers Share %]', folder: 'Customers', format: 'Percentage · 1dp',
          desc: 'Revenue share from the top 10 customers in current filter context.',
          dax: 'VAR _Top10 =\n  TOPN ( 10, ALL ( DimCustomer[CustomerKey] ),\n         [Total Revenue (LCY)], DESC )\nVAR _TopRev = CALCULATE ( [Total Revenue (LCY)], _Top10 )\nRETURN\n  DIVIDE (\n    _TopRev,\n    CALCULATE ( [Total Revenue (LCY)], ALL ( DimCustomer ) )\n  )',
          dependsOn: ['[Total Revenue (LCY)]', 'DimCustomer[CustomerKey]'] },
        { name: '[Net Revenue Retention %]', folder: 'Customers · Retention', format: 'Percentage · 1dp',
          desc: 'NRR: revenue from prior-year cohort evaluated this year divided by their original revenue.',
          dax: 'VAR _CohortRev =\n  CALCULATE (\n    [Total Revenue (LCY)],\n    SAMEPERIODLASTYEAR ( DimDate[Date] )\n  )\nVAR _CurRev =\n  CALCULATE (\n    [Total Revenue (LCY)],\n    KEEPFILTERS (\n      FILTER ( ALL ( DimCustomer ),\n               [Active Customers (90d)] > 0 )\n    )\n  )\nRETURN\n  DIVIDE ( _CurRev, _CohortRev )',
          dependsOn: ['[Total Revenue (LCY)]', '[Active Customers (90d)]'] },
      ],
      relationships: [
        { from: 'FactSales[DateKey]',       to: 'DimDate[DateKey]',             card: '*:1', active: true,  cross: 'single' },
        { from: 'FactSales[CustomerKey]',   to: 'DimCustomer[CustomerKey]',     card: '*:1', active: true,  cross: 'single' },
        { from: 'FactSales[ProductKey]',    to: 'DimProduct[ProductKey]',       card: '*:1', active: true,  cross: 'single' },
        { from: 'FactSales[GeographyKey]',  to: 'DimGeography[GeographyKey]',   card: '*:1', active: true,  cross: 'single' },
      ],
      rls: [
        { rule: 'Region · NA',       table: 'DimGeography', filter: 'DimGeography[Region] = "NA"',                                          members: 'sg-sales-na@contoso.com' },
        { rule: 'Region · EMEA',     table: 'DimGeography', filter: 'DimGeography[Region] = "EMEA"',                                        members: 'sg-sales-emea@contoso.com' },
        { rule: 'Region · APAC',     table: 'DimGeography', filter: 'DimGeography[Region] = "APAC"',                                        members: 'sg-sales-apac@contoso.com' },
        { rule: 'Region · LATAM',    table: 'DimGeography', filter: 'DimGeography[Region] = "LATAM"',                                       members: 'sg-sales-latam@contoso.com' },
        { rule: 'SMB segment only',  table: 'DimCustomer',  filter: 'DimCustomer[Segment] = "SMB"',                                         members: 'sg-smb-team@contoso.com'  },
        { rule: 'Blocklist · EU',    table: 'DimGeography', filter: 'NOT ( DimGeography[Country] IN { "DE", "FR", "IT" } )',                members: 'sg-non-eu@contoso.com'    },
      ],
      sensLabels: [
        { table: 'DimCustomer', col: 'CustomerName',  label: 'Confidential · External' },
        { table: 'DimCustomer', col: 'Email',         label: 'Confidential · Internal' },
        { table: 'FactSales',   col: 'NetAmountLCY',  label: 'General' },
        { table: 'DimProduct',  col: 'ListPriceLCY',  label: 'Internal'  },
      ],
      findings: [
        { sev: 'critical', title: 'No sensitivity label on FactSales',
          detail: 'Revenue measure FactSales[NetAmountLCY] is not labeled. Tenant policy requires "Confidential · Financial" on all financial fact tables.',
          rec:    'Apply "Confidential · Financial" to FactSales at the table level.' },
        { sev: 'warning',  title: '2 inactive relationships present',
          detail: 'Two USERELATIONSHIP-only relationships exist between FactSales and DimDate; not documented in the glossary.',
          rec:    'Add inline DAX comment or remove if obsolete.' },
        { sev: 'info',     title: 'Calculated columns: 14',
          detail: 'Calculated columns are evaluated at refresh and bloat the model. Power Query is cheaper for the same outcome.',
          rec:    'Review the 14 calc-cols; convert to source columns where possible.' },
      ],
      owners: [
        { name: 'Alex Rivera',      role: 'Data lead',        email: 'a.rivera@contoso.com',    last: '2026-05-15' },
        { name: 'Marc Qureshi',     role: 'BI steward',       email: 'm.qureshi@contoso.com',   last: '2026-05-12' },
        { name: 'Sofia Lindqvist',  role: 'Backup owner',     email: 's.lindqvist@contoso.com', last: '2026-04-28' },
        { name: 'Karim Andersen',   role: 'Source DBA (CRM)', email: 'k.andersen@contoso.com',  last: '2026-04-20' },
      ],
      lineage: {
        upstream: [
          { item: 'sales_raw.fact_orders',          kind: 'Lakehouse · Delta', layer: 'Bronze', refresh: 'Hourly'           },
          { item: 'sales_raw.fact_order_lines',     kind: 'Lakehouse · Delta', layer: 'Bronze', refresh: 'Hourly'           },
          { item: 'crm.customers',                  kind: 'Dataflow Gen2',     layer: 'Silver', refresh: 'Daily 03:00 UTC' },
          { item: 'product_master.skus',            kind: 'SQL endpoint',      layer: 'Silver', refresh: 'Daily 02:30 UTC' },
          { item: 'geo.countries',                  kind: 'CSV in OneLake',    layer: 'Bronze', refresh: 'Static'           },
          { item: 'finance.exchange_rates',         kind: 'SQL endpoint',      layer: 'Silver', refresh: 'Daily 02:00 UTC' },
          { item: 'sales_curated.fact_sales_gold',  kind: 'Lakehouse · Delta', layer: 'Gold',   refresh: 'Hourly'           },
          { item: 'date.dim_date',                  kind: 'Static seed',       layer: 'Gold',   refresh: 'Never'            },
        ],
        downstream: [
          { item: 'Sales Pipeline Dashboard',  kind: 'Report',    ws: 'Finance-Prod',     viewers: 142, lastView: '12m ago' },
          { item: 'Executive QBR Pack',        kind: 'Report',    ws: 'Exec-Reports',     viewers:  18, lastView: '2h ago'  },
          { item: 'Revenue Forecast v3',       kind: 'Report',    ws: 'Finance-Prod',     viewers:  47, lastView: '38m ago' },
          { item: 'NA Sales Scorecard',        kind: 'Report',    ws: 'Sales-NA',         viewers:  91, lastView: '4h ago'  },
          { item: 'EMEA Sales Scorecard',      kind: 'Report',    ws: 'Sales-EMEA',       viewers:  64, lastView: '6h ago'  },
          { item: 'APAC Sales Scorecard',      kind: 'Report',    ws: 'Sales-APAC',       viewers:  38, lastView: '1d ago'  },
          { item: 'Finance Mobile Dashboard',  kind: 'Report',    ws: 'Mobile-BI',        viewers: 211, lastView: '7m ago'  },
          { item: 'CFO Daily Brief',           kind: 'Paginated', ws: 'Exec-Reports',     viewers:   6, lastView: '8h ago'  },
          { item: 'Sales Ops Drilldown',       kind: 'Report',    ws: 'Sales-Ops',        viewers:  29, lastView: '3h ago'  },
          { item: 'Top Customers Watchlist',   kind: 'Report',    ws: 'Customer-Success', viewers:  17, lastView: '9h ago'  },
          { item: 'Sales Hub App',             kind: 'App',       ws: 'Sales-Apps',       viewers: 184, lastView: '21m ago' },
        ],
      },
      changelog: [
        { date: '2026-05-15', who: 'Alex Rivera',     change: 'Added measure [Net Revenue Retention %]' },
        { date: '2026-05-12', who: 'Marc Qureshi',    change: 'Renamed [GM%] → [Gross Margin %]' },
        { date: '2026-05-08', who: 'Marc Qureshi',    change: 'Refactored DimDate fiscal calendar (FY 07-01)' },
        { date: '2026-04-29', who: 'Alex Rivera',     change: 'Added FactSales[NetAmountLCY] (replaces calc column)' },
        { date: '2026-04-21', who: 'Sofia Lindqvist', change: 'Added RLS rule: Blocklist · EU' },
        { date: '2026-04-15', who: 'Alex Rivera',     change: 'Inactive relationship: FactSales[ShipDateKey] → DimDate' },
        { date: '2026-04-08', who: 'Karim Andersen',  change: 'Source upgrade: crm.customers schema v3' },
        { date: '2026-03-30', who: 'Marc Qureshi',    change: 'Added measure [Top 10 Customers Share %]' },
        { date: '2026-03-21', who: 'Alex Rivera',     change: 'Migrated 4 calc columns → Power Query' },
        { date: '2026-03-14', who: 'Sofia Lindqvist', change: 'Added sensitivity label: Confidential · External' },
        { date: '2026-03-04', who: 'Marc Qureshi',    change: 'Folder reorg: Revenue → Time intelligence' },
        { date: '2026-02-22', who: 'Alex Rivera',     change: 'Removed deprecated measure [Old Revenue]' },
      ],
      glossary: [
        { term: 'LCY', def: 'Local Currency. Revenue is stored in source-transaction currency; conversion happens in the report layer.' },
        { term: 'AOV', def: 'Average Order Value. [Total Revenue (LCY)] divided by DISTINCTCOUNT of SalesKey.' },
        { term: 'NRR', def: 'Net Revenue Retention. Revenue from prior-year cohort evaluated this year divided by their original revenue.' },
        { term: 'Fiscal Year', def: 'FY runs Jul 1 – Jun 30. Reflected in DimDate[FiscalYear].' },
        { term: 'Segment', def: 'Customer size band: SMB (< $1M ARR) / Mid-Market ($1M – $10M) / Enterprise ($10M+).' },
      ],
      erd: {
        tables: [
          { name: 'FactSales',    x: 350, y: 200, kind: 'fact' },
          { name: 'DimDate',      x:  60, y:  60, kind: 'dim'  },
          { name: 'DimCustomer',  x: 580, y:  60, kind: 'dim'  },
          { name: 'DimProduct',   x: 580, y: 340, kind: 'dim'  },
          { name: 'DimGeography', x:  60, y: 340, kind: 'dim'  },
        ],
      },

      /* Power Query (M) — the ingestion/transform layer. Extracted from the
         model's partition definitions via Scanner getDefinition / TMDL.
         DAX is the analytics layer; M is how each table is loaded + shaped. */
      mQueries: [
        { table: 'FactSales', source: 'Lakehouse · sales_curated.fact_sales_gold', kind: 'Import',
          m: 'let\n    Source = Lakehouse.Contents(null){[workspaceId = "f64-prod-we"]}[Data],\n    curated = Source{[Id = "sales_curated", ItemKind = "Lakehouse"]}[Data],\n    fact = curated{[Id = "fact_sales_gold", ItemKind = "Table"]}[Data],\n    KeepProd = Table.SelectRows(fact, each [OrderDate] >= #date(2022, 1, 1)),\n    DropInternal = Table.RemoveColumns(KeepProd, {"_hash", "etl_batch_id", "_loaded_at"}),\n    NetAmount = Table.AddColumn(DropInternal, "NetAmountLCY",\n        each [Quantity] * [UnitPrice] * (1 - [DiscountPct]), type number),\n    Typed = Table.TransformColumnTypes(NetAmount, {\n        {"SalesKey", Int64.Type}, {"DateKey", Int64.Type},\n        {"NetAmountLCY", type number}, {"CostLCY", type number}\n    })\nin\n    Typed' },
        { table: 'DimCustomer', source: 'Dataflow Gen2 · crm.customers', kind: 'Import',
          m: 'let\n    Source = PowerPlatform.Dataflows(null),\n    ws = Source{[workspaceId = "f64-prod-we"]}[Data],\n    crm = ws{[dataflowId = "crm-sync"]}[Data],\n    customers = crm{[entity = "customers"]}[Data],\n    Segment = Table.AddColumn(customers, "Segment",\n        each if [ARR] >= 10000000 then "Enterprise"\n             else if [ARR] >= 1000000 then "Mid-Market"\n             else "SMB", type text),\n    Renamed = Table.RenameColumns(Segment, {{"cust_id", "CustomerID"}, {"cust_name", "CustomerName"}})\nin\n    Renamed' },
        { table: 'DimDate', source: 'Static seed · date.dim_date', kind: 'Import',
          m: 'let\n    Start = #date(1990, 1, 1),\n    End = #date(2030, 12, 31),\n    Days = Duration.Days(End - Start) + 1,\n    Dates = List.Dates(Start, Days, #duration(1, 0, 0, 0)),\n    Tbl = Table.FromList(Dates, Splitter.SplitByNothing(), {"Date"}),\n    Cols = Table.AddColumn(Tbl, "DateKey",\n        each Date.Year([Date]) * 10000 + Date.Month([Date]) * 100 + Date.Day([Date]), Int64.Type),\n    Fiscal = Table.AddColumn(Cols, "FiscalYear",\n        each if Date.Month([Date]) >= 7 then Date.Year([Date]) + 1 else Date.Year([Date]), Int64.Type)\nin\n    Fiscal' },
      ],

      /* AUTOMATED sections — Fabric API + LP collectors. Combine with the
         MANUAL ownership + glossary data to produce the complete document. */

      // Model maturity / quality score (LP rules engine — same shape as /models overview)
      quality: {
        score: 9.2, tier: 'Platinum', trend: 0.2,
        breakdown: [
          { dim: 'Naming',         val: 9.5 },
          { dim: 'Sources',        val: 8.9 },
          { dim: 'Performance',    val: 8.1 },
          { dim: 'Structure',      val: 9.8 },
          { dim: 'Hygiene',        val: 7.0 },
          { dim: 'Discoverability',val: 5.5 },
        ],
        weakest: 'Discoverability',
        note: 'Discoverability is the weakest dimension — 14 of 156 columns lack descriptions and 18 measures have no business-glossary term attached.',
      },

      // Refresh history (Refreshables endpoint + activity_events). Stale refreshes
      // = stale data = "not trustworthy" — surfaced for analyst + auditor + engineer.
      refresh: {
        schedule: 'Daily · 04:00 UTC',
        lastRefresh: '2026-05-20 04:02 UTC',
        lastStatus: 'success',
        avgDurationMin: 7.4,
        windows: [
          { window: 'Last 24h', runs: 1,  ok: 1,  failed: 0 },
          { window: 'Last 7d',  runs: 7,  ok: 6,  failed: 1 },
          { window: 'Last 30d', runs: 30, ok: 27, failed: 3 },
          { window: 'Last 90d', runs: 90, ok: 84, failed: 6 },
        ],
        recentFailures: [
          { date: '2026-05-14 04:01 UTC', reason: 'Gateway timeout — source crm.customers unreachable for 15 min' },
          { date: '2026-05-08 04:00 UTC', reason: 'DAX error in [Net Revenue Retention %] — circular dependency (since fixed)' },
          { date: '2026-04-29 04:03 UTC', reason: 'Capacity throttled — F64 at 100% CU during the refresh window' },
        ],
      },

      // Access (Admin API permissions + AAD Graph group expansion). Engineer
      // uses this to verify RLS scoping; auditor uses it as a who-can-read control.
      access: [
        { principal: 'Alex Rivera',         kind: 'User',  role: 'Admin', members: null, source: 'Workspace Admin',   rls: 'Bypass (admin sees all)' },
        { principal: 'sg-fin-data',         kind: 'Group', role: 'Build', members: 18,   source: 'Workspace Member',  rls: 'Bypass (build role)' },
        { principal: 'sg-bi-stewards',      kind: 'Group', role: 'Build', members: 6,    source: 'Workspace Member',  rls: 'Bypass (build role)' },
        { principal: 'sg-sales-na',         kind: 'Group', role: 'Read',  members: 42,   source: 'App audience',      rls: 'Region · NA' },
        { principal: 'sg-sales-emea',       kind: 'Group', role: 'Read',  members: 28,   source: 'App audience',      rls: 'Region · EMEA' },
        { principal: 'sg-sales-apac',       kind: 'Group', role: 'Read',  members: 19,   source: 'App audience',      rls: 'Region · APAC' },
        { principal: 'sg-exec',             kind: 'Group', role: 'Read',  members: 12,   source: 'App audience',      rls: 'No filter (sees all regions)' },
        { principal: 'sg-smb-team',         kind: 'Group', role: 'Read',  members: 9,    source: 'Direct grant',      rls: 'SMB segment only' },
      ],

      // Adoption (activity_events on downstream reports). Reach + dormancy.
      adoption: {
        dau: 42, wau: 168, mau: 284,
        totalViewers30d: 312,
        totalOpens30d: 9840,
        dormantReports: 2,
        newReaders30d: 47,
        trend30: [88,92,104,96,118,142,138,101,87,95,112,128,134,122,108,98,132,148,156,144,128,112,94,106,124,138,152,146,134,118],
      },

      /* ── Completeness sections (built 2026-05-20 from the master catalogue) ── */

      // Object-Level Security — column/table hide rules per role (Scanner).
      ols: [
        { role: 'sg-sales-na',   object: 'FactSales[CostLCY]',        access: 'None', note: 'COGS hidden from regional sellers' },
        { role: 'sg-sales-emea', object: 'FactSales[CostLCY]',        access: 'None', note: 'COGS hidden from regional sellers' },
        { role: 'sg-smb-team',   object: 'DimCustomer[TierCode]',     access: 'None', note: 'Internal tiering hidden from SMB team' },
        { role: 'sg-sales-apac', object: 'DimCustomer.Email',         access: 'None', note: 'PII column hidden' },
      ],

      // Hierarchies — dimension drill paths (Scanner).
      hierarchies: [
        { table: 'DimDate',      name: 'Calendar',  levels: ['FiscalYear', 'CalQuarter', 'YearMonth', 'Date'] },
        { table: 'DimGeography', name: 'Geography', levels: ['Region', 'SubRegion', 'Country'] },
        { table: 'DimProduct',   name: 'Product',   levels: ['Category', 'Subcategory', 'ProductName'] },
        { table: 'DimCustomer',  name: 'Segment',   levels: ['Segment', 'TierCode', 'CustomerName'] },
      ],

      // Calculation groups / perspectives / translations (TMDL).
      calcGroups: [
        { name: 'Time Intelligence', precedence: 10, items: ['Current', 'YTD', 'QTD', 'MTD', 'PY', 'YoY %', 'YoY Δ'] },
        { name: 'Currency',          precedence: 5,  items: ['LCY', 'USD', 'EUR'] },
      ],
      perspectives: ['Sales (default)', 'Finance close', 'Executive summary'],
      translations: ['en-US (base)', 'nl-NL', 'de-DE'],

      // Measure usage / dormancy (activity_events × DAX dependency parse).
      measureUsage: {
        total: 42, usedIn30d: 31, dormant: 11,
        topUsed: [
          { measure: '[Total Revenue (LCY)]',        reports: 11, opens30d: 4820 },
          { measure: '[Gross Margin %]',             reports: 7,  opens30d: 2110 },
          { measure: '[Total Revenue YoY %]',        reports: 6,  opens30d: 1980 },
          { measure: '[Active Customers (90d)]',     reports: 4,  opens30d: 940 },
        ],
        dormantList: [
          { measure: '[Old Revenue]',                lastUsed: 'never',   note: 'Superseded by [Total Revenue (LCY)] — safe to remove' },
          { measure: '[Discount Impact]',           lastUsed: '90d+ ago', note: 'Zero report references' },
          { measure: '[Running Total]',             lastUsed: 'never',   note: 'Authored but never surfaced' },
        ],
      },

      // Storage / size breakdown (DMV — VertiPaq).
      storage: {
        totalMB: 612, compressionRatio: '11.4×',
        byTable: [
          { table: 'FactSales',    mb: 482, pct: 78.8, cardinalityCol: 'SalesKey (4.2M)' },
          { table: 'DimCustomer',  mb: 78,  pct: 12.7, cardinalityCol: 'CustomerKey (847K)' },
          { table: 'DimProduct',   mb: 31,  pct: 5.1,  cardinalityCol: 'ProductKey (12K)' },
          { table: 'DimGeography', mb: 12,  pct: 2.0,  cardinalityCol: 'GeographyKey (4.2K)' },
          { table: 'DimDate',      mb: 9,   pct: 1.4,  cardinalityCol: 'DateKey (14.6K)' },
        ],
      },

      // Capacity / cost attribution (H1/H2 collectors).
      cost: {
        capacity: 'F64-prod-we', sku: 'F64',
        cuPer30d: 184200, shareOfCapacityPct: 14.2, estCostEur30d: 921,
        refreshCuPct: 62, querycuPct: 38,
        trend: 'flat (±3% MoM)',
        note: 'Refresh dominates CU. Incremental refresh (already on) keeps this from scaling with the 4.2M-row fact.',
      },

      // Incremental-refresh policy (TMDL) — rendered as a block on Refresh history.
      incremental: {
        enabled: true,
        rangeStart: '2022-01-01',
        rollingWindow: '36 months',
        refreshGranularity: 'Day',
        detectChanges: 'etl_batch_id',
        note: 'Only the trailing window re-processes; partitions older than 36 months are sealed.',
      },

      // Certification / endorsement stamp (manual flag).
      certification: {
        status: 'Certified',           // Certified | Promoted | None
        by: 'Marc Qureshi',
        role: 'BI steward',
        at: '2026-05-12',
        note: 'Reviewed against the Finance data-quality checklist; approved for tenant-wide reuse.',
      },

      // Custom executive note (manual free-text the owner writes).
      execNote: 'Sales Analytics is the single source of truth for tenant-wide revenue. As of this quarter it feeds 11 downstream reports across Finance, Sales, and Executive workspaces and is the basis for the board NRR metric. Treat any discrepancy here as authoritative over departmental spreadsheets. — Alex Rivera, Data lead',
    },
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
    measures: [
      { id: 'm1',  name: 'Total Sales',          table: '_Measures', used: true,  lastUsed: '2h ago',   deps: ['FactSales[Amount]'],                        dax: 'Total Sales = \nSUM( FactSales[Amount] )',                                                    reports: 3, complexity: 'simple'  },
      { id: 'm2',  name: 'YTD Revenue',          table: '_Measures', used: true,  lastUsed: '14m ago',  deps: ['Total Sales','DimDate[Year]'],              dax: 'YTD Revenue = \nCALCULATE(\n    [Total Sales],\n    DATESYTD( DimDate[Date] )\n)',           reports: 4, complexity: 'medium'  },
      { id: 'm3',  name: 'Gross Margin',         table: '_Measures', used: true,  lastUsed: '2h ago',   deps: ['FactSales[Amount]','FactSales[Cost]'],      dax: 'Gross Margin = \nDIVIDE(\n    SUM( FactSales[Amount] ) - SUM( FactSales[Cost] ),\n    SUM( FactSales[Amount] )\n)', reports: 2, complexity: 'simple'  },
      { id: 'm4',  name: 'Sales Growth %',       table: '_Measures', used: true,  lastUsed: '1h ago',   deps: ['Total Sales','DimDate'],                    dax: 'Sales Growth % = \nVAR _this = [Total Sales]\nVAR _prev = CALCULATE(\n    [Total Sales],\n    SAMEPERIODLASTYEAR( DimDate[Date] )\n)\nRETURN\nDIVIDE( _this - _prev, _prev )', reports: 3, complexity: 'complex' },
      { id: 'm5',  name: 'Budget Variance',      table: '_Measures', used: true,  lastUsed: '4h ago',   deps: ['FactBudget[Planned]','FactBudget[Actual]'], dax: 'Budget Variance = \n[Total Sales] - SUM( FactBudget[Planned] )',                           reports: 1, complexity: 'simple'  },
      { id: 'm6',  name: 'Avg Order Value',      table: '_Measures', used: false, lastUsed: '47d ago',  deps: ['FactSales[Amount]','FactSales[SalesKey]'],  dax: 'Avg Order Value = \nAVERAGEX(\n    FactSales,\n    FactSales[Amount]\n)',                      reports: 0, complexity: 'simple'  },
      { id: 'm7',  name: 'Return Rate',          table: '_Measures', used: false, lastUsed: '62d ago',  deps: ['FactReturns','FactSales'],                  dax: 'Return Rate = \nDIVIDE(\n    COUNTROWS( FactReturns ),\n    COUNTROWS( FactSales )\n)',       reports: 0, complexity: 'medium'  },
      { id: 'm8',  name: 'Customer Count',       table: '_Measures', used: true,  lastUsed: '2d ago',   deps: ['DimCustomer[CustomerKey]'],                 dax: 'Customer Count = \nDISTINCTCOUNT( DimCustomer[CustomerKey] )',                              reports: 2, complexity: 'simple'  },
      { id: 'm9',  name: 'Top 10 Customers',     table: '_Measures', used: false, lastUsed: '90d ago',  deps: ['DimCustomer','Total Sales'],                dax: 'Top 10 Customers = \nCALCULATE(\n    [Customer Count],\n    TOPN( 10, DimCustomer, [Total Sales] )\n)', reports: 0, complexity: 'complex' },
      { id: 'm10', name: 'MTD Revenue',          table: '_Measures', used: true,  lastUsed: '30m ago',  deps: ['Total Sales','DimDate'],                    dax: 'MTD Revenue = \nCALCULATE(\n    [Total Sales],\n    DATESMTD( DimDate[Date] )\n)',            reports: 2, complexity: 'medium'  },
      { id: 'm11', name: 'Discount Impact',      table: '_Measures', used: false, lastUsed: 'never',    deps: ['FactSales[Discount]'],                      dax: 'Discount Impact = \nSUM( FactSales[Discount] )',                                            reports: 0, complexity: 'simple'  },
      { id: 'm12', name: 'Running Total',        table: '_Measures', used: false, lastUsed: 'never',    deps: ['Total Sales','DimDate'],                    dax: 'Running Total = \nCALCULATE(\n    [Total Sales],\n    FILTER(\n        ALL( DimDate ),\n        DimDate[Date] <= MAX( DimDate[Date] )\n    )\n)', reports: 0, complexity: 'complex' },
    ],
    dataflows: [
      { id: 'df1', name: 'Sales CRM Staging',     gen: 'Gen2', schedule: 'Daily 04:00', runs30d: 30, failed: 0,  avgDuration: '4m 12s', downstream: 2, status: 'healthy', lastRun: '2h ago',   size: '1.4 GB' },
      { id: 'df2', name: 'CRM Staging Gen1',       gen: 'Gen1', schedule: 'Daily 02:00', runs30d: 30, failed: 14, avgDuration: '8m 47s', downstream: 6, status: 'failing', lastRun: '26m ago',  size: '—'      },
      { id: 'df3', name: 'SharePoint HR Import',   gen: 'Gen1', schedule: 'Daily 06:00', runs30d: 30, failed: 3,  avgDuration: '1m 58s', downstream: 3, status: 'warning', lastRun: '1h ago',   size: '180 MB' },
      { id: 'df4', name: 'ERP Bronze Ingestion',   gen: 'Gen2', schedule: '4× daily',    runs30d: 120, failed: 0, avgDuration: '12m 4s', downstream: 4, status: 'healthy', lastRun: '42m ago',  size: '8.2 GB' },
      { id: 'df5', name: 'Marketing Attribution',  gen: 'Gen2', schedule: 'Hourly',      runs30d: 720, failed: 2, avgDuration: '52s',    downstream: 1, status: 'warning', lastRun: '18m ago',  size: '420 MB' },
    ],
    refreshChain: [
      { id: 'src-sql',  label: 'SQL Server',       type: 'Source',    icon: 'database',   layer: 'SOURCE',  schedule: 'Always-on',
        runs: [{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true}] },
      { id: 'src-blob', label: 'datalake-prd',     type: 'Source',    icon: 'database',   layer: 'SOURCE',  schedule: 'Always-on',
        runs: [{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true}] },
      { id: 'src-api',  label: 'CRM API',          type: 'Source',    icon: 'activity',   layer: 'SOURCE',  schedule: 'Always-on',
        runs: [{ok:true},{ok:true},{ok:false},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:false},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true}] },
      { id: 'lh-1',     label: 'finance_lake',     type: 'Lakehouse', icon: 'layers',     layer: 'STORAGE', schedule: 'Continuous',
        runs: [{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true}] },
      { id: 'wh-1',     label: 'finance_wh',       type: 'Warehouse', icon: 'database',   layer: 'STORAGE', schedule: 'Continuous',
        runs: [{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true}] },
      { id: 'nb-1',     label: 'sales-etl.ipynb',  type: 'Notebook',  icon: 'file-text',  layer: 'PROCESS', schedule: 'Daily 03:00',
        runs: [{ok:true},{ok:true},{ok:true},{ok:false},{ok:true},{ok:true},{ok:true},{ok:true},{ok:false},{ok:true},{ok:true},{ok:true},{ok:true},{ok:true}] },
      { id: 'pipe-1',   label: 'CRM Sync',         type: 'Pipeline',  icon: 'git-branch', layer: 'PROCESS', schedule: 'Every 4h',
        runs: [{ok:true},{ok:false},{ok:false},{ok:true},{ok:false},{ok:false},{ok:true},{ok:false},{ok:true},{ok:false},{ok:false},{ok:false},{ok:true},{ok:false}] },
      { id: 'sm-1',     label: 'Sales Analytics',  type: 'Semantic',  icon: 'bar-chart',  layer: 'MODEL',   schedule: 'Daily 02:00',
        runs: [{ok:true},{ok:false},{ok:false},{ok:true},{ok:false},{ok:false},{ok:true},{ok:false},{ok:true},{ok:false},{ok:false},{ok:false},{ok:true},{ok:false}] },
    ],
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
      { id: 'u1', name: 'Sara Patel',     email: 'sara.patel@contoso.com',     dept: 'Finance',    role: 'Senior Analyst',    cu: 184200, cost: 921, queries: 4823, datasets: 28, refreshes: 47, exports: 134, copilot: 312, spark: __spark(14, 14, 0.3), copilotRate: 0.34, status: 'power',  licenseSku: 'PPU',      licenseCost: 200 },
      { id: 'u2', name: 'Michiel Vermeer',email: 'michiel.v@contoso.com',      dept: 'Finance',    role: 'BI Lead',           cu: 142800, cost: 714, queries: 3128, datasets: 41, refreshes: 89, exports: 86,  copilot: 248, spark: __spark(14, 12, 0.3), copilotRate: 0.41, status: 'power',  licenseSku: 'PPU',      licenseCost: 200 },
      { id: 'u3', name: 'Anita Velasquez', email: 'anita.v@contoso.com',       dept: 'Operations', role: 'Ops Manager',       cu: 98400,  cost: 492, queries: 2840, datasets: 17, refreshes: 12, exports: 198, copilot: 56,  spark: __spark(14, 9, 0.4),  copilotRate: 0.08, status: 'power',  licenseSku: 'Pro',      licenseCost: 10  },
      { id: 'u4', name: 'Daniel Okafor',   email: 'daniel.o@contoso.com',      dept: 'Sales',      role: 'Sales Director',    cu: 87100,  cost: 436, queries: 1962, datasets: 12, refreshes: 4,  exports: 312, copilot: 12,  spark: __spark(14, 8, 0.5),  copilotRate: 0.02, status: 'normal', licenseSku: 'Pro',      licenseCost: 10  },
      { id: 'u5', name: 'Emilia Rossi',    email: 'emilia.r@contoso.com',      dept: 'Operations', role: 'Plant Manager',     cu: 74600,  cost: 373, queries: 1543, datasets: 9,  refreshes: 8,  exports: 67,  copilot: 0,   spark: __spark(14, 7, 0.4),  copilotRate: 0,    status: 'normal', licenseSku: 'Pro',      licenseCost: 10  },
      { id: 'u6', name: 'Hans Berg',       email: 'hans.b@contoso.com',        dept: 'IT',         role: 'Data Engineer',     cu: 68300,  cost: 342, queries: 932,  datasets: 47, refreshes: 142, exports: 18, copilot: 184, spark: __spark(14, 6, 0.5),  copilotRate: 0.62, status: 'power',  licenseSku: 'Fabric F1', licenseCost: 262 },
      { id: 'u7', name: 'Yuki Tanaka',     email: 'yuki.t@contoso.com',        dept: 'Finance',    role: 'Junior Analyst',    cu: 52900,  cost: 264, queries: 1843, datasets: 8,  refreshes: 6,  exports: 41,  copilot: 92,  spark: __spark(14, 5, 0.4),  copilotRate: 0.21, status: 'normal', licenseSku: 'Pro',      licenseCost: 10  },
      { id: 'u8', name: 'Maya Greenfield', email: 'maya.g@contoso.com',        dept: 'HR',         role: 'People Analyst',    cu: 41200,  cost: 206, queries: 1284, datasets: 6,  refreshes: 18, exports: 23,  copilot: 41,  spark: __spark(14, 4, 0.5),  copilotRate: 0.14, status: 'normal', licenseSku: 'Pro',      licenseCost: 10  },
      { id: 'u9', name: 'Jakub Nowak',     email: 'jakub.n@contoso.com',       dept: 'Operations', role: 'Logistics Analyst', cu: 38700,  cost: 193, queries: 1102, datasets: 14, refreshes: 5,  exports: 78,  copilot: 0,   spark: __spark(14, 3.7, 0.5),copilotRate: 0,    status: 'normal', licenseSku: 'Free',     licenseCost: 0   },
      { id: 'u10',name: 'Priya Sharma',    email: 'priya.s@contoso.com',       dept: 'Sales',      role: 'Sales Analyst',     cu: 33400,  cost: 167, queries: 944,  datasets: 11, refreshes: 3,  exports: 156, copilot: 6,   spark: __spark(14, 3.2, 0.4),copilotRate: 0.01, status: 'normal', licenseSku: 'Pro',      licenseCost: 10  },
      { id: 'u11',name: 'Felix Beaumont',  email: 'felix.b@contoso.com',       dept: 'Finance',    role: 'Controller',        cu: 28900,  cost: 145, queries: 712,  datasets: 22, refreshes: 9,  exports: 89,  copilot: 0,   spark: __spark(14, 2.7, 0.5),copilotRate: 0,    status: 'normal', licenseSku: 'Pro',      licenseCost: 10  },
      { id: 'u12',name: 'Lena Hofmann',    email: 'lena.h@contoso.com',        dept: 'IT',         role: 'DBA',               cu: 24300,  cost: 122, queries: 412,  datasets: 38, refreshes: 78, exports: 4,   copilot: 22,  spark: __spark(14, 2.3, 0.6),copilotRate: 0.18, status: 'normal', licenseSku: 'Fabric F1', licenseCost: 262 },
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

  userAccess: {
    u1: {
      direct: [
        { id: 'da1', type: 'workspace', name: 'Finance-Prod',  role: 'Contributor', since: '2024-08-12', lastUsed: '2h ago',  risk: null,
          reports:  ['Margin Dashboard', 'YTD Variance Report', 'EMEA Quarterly Review'],
          datasets: ['Sales Analytics', 'Budget Planning', 'Revenue Forecast'] },
        { id: 'da2', type: 'workspace', name: 'Marketing',     role: 'Viewer',      since: '2025-01-10', lastUsed: '23d ago', risk: null,
          reports:  ['Marketing Funnel 2024'],
          datasets: ['Marketing Funnel 2024'] },
        { id: 'da3', type: 'workspace', name: 'Ops-Legacy-2022', role: 'Admin',     since: '2023-03-01', lastUsed: '94d ago', risk: 'Admin · unused 94d',
          reports:  [],
          datasets: [] },
      ],
      viaGroups: [
        { id: 'ga1', group: 'Finance-All', groupType: 'Security Group', memberSince: '2023-06-01',
          grants: [
            { id: 'g1a', type: 'app',       name: 'Sales Insights App',     role: 'Viewer', lastUsed: '3d ago',  reports: ['Pipeline 360', 'Margin Dashboard'] },
            { id: 'g1b', type: 'workspace', name: 'Shared-Finance-Reports', role: 'Viewer', lastUsed: '8d ago',  reports: ['EMEA Quarterly Review'], datasets: ['Revenue Forecast'] },
          ]},
        { id: 'ga2', group: 'EMEA-Finance-Reporting', groupType: 'M365 Group', memberSince: '2024-02-14',
          grants: [
            { id: 'g2a', type: 'app',       name: 'EMEA Executive Dashboard', role: 'Viewer', lastUsed: '1w ago',   reports: ['EMEA Quarterly Review'] },
          ]},
        { id: 'ga3', group: 'BI-Power-Users', groupType: 'Security Group', memberSince: '2024-06-01',
          grants: [
            { id: 'g3a', type: 'workspace', name: 'BI-Dev-Sandbox',  role: 'Contributor', lastUsed: 'never', reports: [], datasets: [] },
          ]},
      ],
    },
    u2: {
      direct: [
        { id: 'da1', type: 'workspace', name: 'Finance-Prod',  role: 'Admin',       since: '2023-01-15', lastUsed: '1h ago',  risk: null,
          reports:  ['Margin Dashboard', 'YTD Variance Report', 'EMEA Quarterly Review', 'Budget vs Actuals'],
          datasets: ['Sales Analytics', 'Budget Planning', 'Revenue Forecast'] },
        { id: 'da2', type: 'workspace', name: 'BI-Dev-Sandbox',role: 'Admin',       since: '2023-01-15', lastUsed: '4h ago',  risk: null,
          reports:  [],
          datasets: ['Sales Analytics DEV', 'Budget Planning DEV'] },
        { id: 'da3', type: 'workspace', name: 'Data-Platform', role: 'Contributor', since: '2024-03-20', lastUsed: '2d ago',  risk: null,
          reports:  [],
          datasets: ['ERP Bronze', 'CRM Staging'] },
      ],
      viaGroups: [
        { id: 'ga1', group: 'Finance-All', groupType: 'Security Group', memberSince: '2023-01-15',
          grants: [
            { id: 'g1a', type: 'app',       name: 'Sales Insights App',    role: 'Viewer', lastUsed: '5d ago', reports: ['Pipeline 360'] },
            { id: 'g1b', type: 'app',       name: 'EMEA Executive Dashboard', role: 'Viewer', lastUsed: '1w ago', reports: ['EMEA Quarterly Review'] },
          ]},
        { id: 'ga2', group: 'BI-Power-Users', groupType: 'Security Group', memberSince: '2023-01-15',
          grants: [
            { id: 'g2a', type: 'workspace', name: 'Shared-Finance-Reports', role: 'Contributor', lastUsed: '3d ago', reports: ['EMEA Quarterly Review'], datasets: ['Revenue Forecast'] },
          ]},
      ],
    },
    default: {
      direct: [
        { id: 'da1', type: 'workspace', name: 'Finance-Prod',  role: 'Viewer',  since: '2024-09-01', lastUsed: '5d ago', risk: null,
          reports:  ['Margin Dashboard'],
          datasets: ['Sales Analytics'] },
      ],
      viaGroups: [
        { id: 'ga1', group: 'All-Staff-PBI', groupType: 'Security Group', memberSince: '2024-01-01',
          grants: [
            { id: 'g1a', type: 'app', name: 'Company KPI Dashboard', role: 'Viewer', lastUsed: '12d ago', reports: ['Operations Scorecard'] },
          ]},
      ],
    },
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
    reportConsumption: {
      totalOpens30: 4031,
      uniqueViewers30: 284,
      newViewers: 47,
      avgOpenRate: 0.68,
      trend30: [88,92,104,96,118,142,138,101,87,95,112,128,134,122,108,98,132,148,156,144,128,112,94,106,124,138,152,146,134,118],
      topReports: [
        { name: 'Margin Dashboard',       opens30: 1842, viewers30: 142, ws: 'Finance-Prod', trend: [52,58,64,60,72,68,74] },
        { name: 'Pipeline 360',           opens30: 612,  viewers30: 84,  ws: 'Sales',         trend: [18,20,22,19,24,22,26] },
        { name: 'Retail Margin Overview', opens30: 312,  viewers30: 47,  ws: 'RetailOps',    trend: [8,10,12,11,14,12,14] },
        { name: 'Operations Scorecard',   opens30: 412,  viewers30: 64,  ws: 'Ops-Score',    trend: [12,14,16,12,18,14,16] },
        { name: 'Supply Chain KPIs',      opens30: 184,  viewers30: 31,  ws: 'Supply-Chain', trend: [4,6,8,6,8,7,9] },
        { name: 'YTD Variance Report',    opens30: 287,  viewers30: 38,  ws: 'Finance-Prod', trend: [8,8,10,12,10,11,12] },
        { name: 'HR Attrition',           opens30: 84,   viewers30: 17,  ws: 'HR-Data',      trend: [2,4,3,4,3,4,4] },
        { name: 'EMEA Quarterly Review',  opens30: 124,  viewers30: 22,  ws: 'Finance-Prod', trend: [3,4,4,5,4,5,6] },
      ],
      bottomReports: [
        { name: 'Stockout Alert Status',    lastOpen: '187d ago', status: 'broken' },
        { name: 'Q4 Sales Snapshot 2024',   lastOpen: '94d ago',  status: 'orphan' },
        { name: 'Marketing Funnel 2024',    lastOpen: '94d ago',  status: 'orphan' },
        { name: 'Plant Output Live',        lastOpen: '47d ago',  status: 'dormant' },
        { name: 'Field Sales Performance',  lastOpen: '52d ago',  status: 'dormant' },
      ],
    },
  },

  sleepers: {
    summary: {
      count: 23, wastedCost: 1842, wastedCU: 284600,
      byType: {
        Dataset:   { count: 8,  cost: 712  },
        Lakehouse: { count: 6,  cost: 540  },
        Notebook:  { count: 5,  cost: 380  },
        Dataflow:  { count: 4,  cost: 210  },
      },
    },
    artifacts: [
      { id: 's1',  type: 'Dataset',   name: 'Marketing Funnel 2024',    ws: 'Marketing',     lastActive: 94,  cost: 184, refreshes30d: 240, downstream: 3, size: '2.4 GB',  schedule: 'Hourly',    category: 'dead',    spark: [8,7,6,4,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's2',  type: 'Lakehouse', name: 'Legacy_2023',               ws: 'Data-Platform', lastActive: 187, cost: 410, refreshes30d: 0,   downstream: 2, size: '18.4 GB', schedule: '—',         category: 'dead',    spark: [12,10,8,6,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's3',  type: 'Dataset',   name: 'Legacy Sales Q3-Q4 2023',   ws: 'Finance-Prod',  lastActive: 78,  cost: 96,  refreshes30d: 120, downstream: 1, size: '4.1 GB',  schedule: '4× daily',  category: 'dead',    spark: [6,5,4,3,2,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's4',  type: 'Notebook',  name: 'ML Churn Scoring v1',       ws: 'Data-Platform', lastActive: 112, cost: 148, refreshes30d: 0,   downstream: 0, size: '—',       schedule: '—',         category: 'dead',    spark: [9,8,7,5,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's5',  type: 'Dataset',   name: 'HR Onboarding Pipeline',    ws: 'HR-Data',       lastActive: 64,  cost: 72,  refreshes30d: 90,  downstream: 2, size: '480 MB',  schedule: '3× daily',  category: 'dead',    spark: [5,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's6',  type: 'Dataflow',  name: 'CRM Staging Gen1',          ws: 'Sales',         lastActive: 9,   cost: 98,  refreshes30d: 14,  downstream: 6, size: '—',       schedule: 'Daily',     category: 'failing', spark: [8,7,8,7,3,7,8,7,3,7,8,3,7,8,7,3,7,8,7,3,7,3,7,8,7,3,0,3,7,3] },
      { id: 's7',  type: 'Dataset',   name: 'Plant Output (PILOT)',       ws: 'Operations',    lastActive: 52,  cost: 184, refreshes30d: 240, downstream: 0, size: '1.2 GB',  schedule: 'Hourly',    category: 'dead',    spark: [10,9,8,6,4,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's8',  type: 'Lakehouse', name: 'Archive_Sandbox_2024',      ws: 'Sandbox',       lastActive: 143, cost: 220, refreshes30d: 0,   downstream: 0, size: '7.8 GB',  schedule: '—',         category: 'dead',    spark: [4,3,2,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's9',  type: 'Notebook',  name: 'EDA Customer Segments v3',  ws: 'Data-Platform', lastActive: 88,  cost: 92,  refreshes30d: 0,   downstream: 1, size: '—',       schedule: '—',         category: 'dead',    spark: [6,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's10', type: 'Dataset',   name: 'Q1 Audit Snapshot',         ws: 'Finance-Prod',  lastActive: 41,  cost: 48,  refreshes30d: 60,  downstream: 0, size: '320 MB',  schedule: '2× daily',  category: 'dead',    spark: [4,3,3,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's11', type: 'Dataflow',  name: 'SharePoint HR Import',      ws: 'HR-Data',       lastActive: 18,  cost: 54,  refreshes30d: 30,  downstream: 3, size: '—',       schedule: 'Daily',     category: 'cold',    spark: [7,6,6,5,4,4,4,3,3,3,2,3,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1] },
      { id: 's12', type: 'Lakehouse', name: 'ERP_Bronze_Legacy',         ws: 'Data-Platform', lastActive: 67,  cost: 180, refreshes30d: 0,   downstream: 4, size: '32.1 GB', schedule: '—',         category: 'dead',    spark: [8,7,6,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      { id: 's13', type: 'Dataset',   name: 'Field Sales Mobile',        ws: 'Sales',         lastActive: 12,  cost: 142, refreshes30d: 180, downstream: 2, size: '1.8 GB',  schedule: '6× daily',  category: 'cold',    spark: [9,8,8,7,7,6,6,5,5,4,4,4,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2] },
      { id: 's14', type: 'Notebook',  name: 'Forecast Backtesting 2024', ws: 'Finance-Prod',  lastActive: 56,  cost: 84,  refreshes30d: 0,   downstream: 0, size: '—',       schedule: '—',         category: 'dead',    spark: [7,6,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
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
      { name: 'Margin Dashboard',         ws: 'Finance-Prod',   type: 'Power BI',   dataset: 'Sales Analytics',          wsId: 'finance-prod',   modelId: 'sales-analytics',  viewers30: 142, opens30: 1842, modified: '2d ago',   status: 'healthy', refresh: 'ok',     visuals: 12, tone: 'sky',    apps: ['Finance Executive'] },
      { name: 'Pipeline 360',             ws: 'Sales',          type: 'Power BI',   dataset: 'Sales Analytics',          wsId: 'finance-prod',   modelId: 'sales-analytics',  viewers30: 84,  opens30: 612,  modified: '5d ago',   status: 'healthy', refresh: 'ok',     visuals: 14, tone: 'amber',  apps: ['Sales Q4 Insights'] },
      { name: 'YTD Variance Report',      ws: 'Finance-Prod',   type: 'Paginated',  dataset: 'Budget Planning',          wsId: 'finance-prod',   modelId: 'budget-planning',  viewers30: 38,  opens30: 287,  modified: '1w ago',   status: 'healthy', refresh: 'ok',     visuals: 4,  tone: 'sky',    apps: ['Finance Executive', 'CFO Briefing'] },
      { name: 'Q4 Sales Snapshot 2024',   ws: 'Sales',          type: 'Power BI',   dataset: 'Legacy Sales',             wsId: null,             modelId: null,               viewers30: 0,   opens30: 0,    modified: '94d ago',  status: 'orphan',  refresh: 'failed', visuals: 18, tone: 'amber',  apps: [] },
      { name: 'EMEA Quarterly Review',    ws: 'Finance-Prod',   type: 'Power BI',   dataset: 'Revenue Forecast',         wsId: 'finance-prod',   modelId: 'sales-analytics',  viewers30: 22,  opens30: 124,  modified: '3w ago',   status: 'healthy', refresh: 'ok',     visuals: 9,  tone: 'sky',    apps: ['Finance Executive'] },
      { name: 'Plant Output Live',        ws: 'Operations',     type: 'Power BI',   dataset: 'Plant Output (PILOT)',     wsId: null,             modelId: null,               viewers30: 4,   opens30: 18,   modified: '47d ago',  status: 'dormant', refresh: 'stale',  visuals: 7,  tone: 'emerald',apps: [] },
      { name: 'Marketing Funnel 2024',    ws: 'Marketing',      type: 'Power BI',   dataset: 'Marketing Funnel 2024',    wsId: null,             modelId: null,               viewers30: 0,   opens30: 0,    modified: '94d ago',  status: 'orphan',  refresh: 'stale',  visuals: 11, tone: 'violet', apps: ['Marketing Funnel'] },
      { name: 'HR Attrition',             ws: 'HR-Data',        type: 'Power BI',   dataset: 'HR Headcount',             wsId: null,             modelId: null,               viewers30: 17,  opens30: 84,   modified: '12d ago',  status: 'healthy', refresh: 'ok',     visuals: 6,  tone: 'rose',   apps: ['HR Self-Service'] },
      { name: 'Operations Scorecard',     ws: 'Ops-Score',      type: 'Power BI',   dataset: 'Ops Scorecard',            wsId: null,             modelId: null,               viewers30: 64,  opens30: 412,  modified: '4d ago',   status: 'healthy', refresh: 'ok',     visuals: 8,  tone: 'emerald',apps: ['Plant Operations'] },
      { name: 'Stockout Alert Status',    ws: 'Operations',     type: 'Power BI',   dataset: '(deleted)',                wsId: null,             modelId: null,               viewers30: 0,   opens30: 0,    modified: '187d ago', status: 'broken',  refresh: 'na',     visuals: 3,  tone: 'rose',   apps: [] },
      { name: 'CFO Weekly Briefing',      ws: 'Finance-Prod',   type: 'Paginated',  dataset: 'Sales Analytics',          wsId: 'finance-prod',   modelId: 'sales-analytics',  viewers30: 12,  opens30: 48,   modified: '1d ago',   status: 'healthy', refresh: 'ok',     visuals: 5,  tone: 'sky',    apps: ['CFO Briefing'] },
      { name: 'Headcount Planning',       ws: 'HR-Data',        type: 'Power BI',   dataset: 'HR Headcount',             wsId: null,             modelId: null,               viewers30: 8,   opens30: 32,   modified: '18d ago',  status: 'healthy', refresh: 'ok',     visuals: 5,  tone: 'rose',   apps: ['HR Self-Service'] },
      { name: 'Supply Chain KPIs',        ws: 'Supply-Chain',   type: 'Power BI',   dataset: 'Supply Chain Model',       wsId: null,             modelId: null,               viewers30: 31,  opens30: 184,  modified: '3d ago',   status: 'healthy', refresh: 'ok',     visuals: 10, tone: 'amber',  apps: ['Plant Operations'] },
      { name: 'Budget vs Actuals',        ws: 'Finance-Prod',   type: 'Paginated',  dataset: 'Budget Planning',          wsId: 'finance-prod',   modelId: 'budget-planning',  viewers30: 18,  opens30: 72,   modified: '5d ago',   status: 'healthy', refresh: 'ok',     visuals: 3,  tone: 'sky',    apps: ['CFO Briefing', 'Finance Executive'] },
      { name: 'Field Sales Performance',  ws: 'Sales',          type: 'Power BI',   dataset: 'Field Sales Mobile',       wsId: null,             modelId: null,               viewers30: 2,   opens30: 6,    modified: '52d ago',  status: 'dormant', refresh: 'stale',  visuals: 8,  tone: 'amber',  apps: [] },
      { name: 'Retail Margin Overview',   ws: 'RetailOps',      type: 'Power BI',   dataset: 'RetailOperations',         wsId: null,             modelId: null,               viewers30: 47,  opens30: 312,  modified: '6d ago',   status: 'healthy', refresh: 'ok',     visuals: 9,  tone: 'rose',   apps: ['Plant Operations'] },
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

  // /users-new — sketch of UPN-first Users page (priority #2). Keeps `users` shape untouched.
  usersNew: {
    summary: {
      seats:             487,
      wastedLicensesCost: 1820,   // Pro/PPU assigned, 0 activity 30d → € reclaimable
      wastedSeats:        17,
      admins:             34,
      adminsRatio:        '34 : 453',
      highRiskCount:      4,
    },
    // Per-user extension keyed by users.top id. Adds dimensions the new page needs without
    // disturbing the existing /users page that reads users.top.
    ext: {
      u1:  { upn: 'sara.patel@contoso.onmicrosoft.com',     lastActive: '2h',   lastActiveAbs: '2026-05-17 12:14 UTC', ws30d: 8,  reports30d: 14, adminCount: 1, risk: 'amber', riskReasons: ['Admin on Ops-Legacy-2022 · unused 94d'] },
      u2:  { upn: 'michiel.v@contoso.onmicrosoft.com',      lastActive: '14m',  lastActiveAbs: '2026-05-17 14:02 UTC', ws30d: 12, reports30d: 27, adminCount: 4, risk: 'sky',   riskReasons: [] },
      u3:  { upn: 'anita.v@contoso.onmicrosoft.com',        lastActive: '1d',   lastActiveAbs: '2026-05-16 16:08 UTC', ws30d: 5,  reports30d: 9,  adminCount: 0, risk: 'amber', riskReasons: ['Export-heavy · 198 exports / 30d'] },
      u4:  { upn: 'daniel.o@contoso.onmicrosoft.com',       lastActive: '3h',   lastActiveAbs: '2026-05-17 11:42 UTC', ws30d: 4,  reports30d: 6,  adminCount: 2, risk: 'rose',  riskReasons: ['High export · 312/30d', 'Off-hours access · 9 sessions', 'Admin on Sales-Prod'] },
      u5:  { upn: 'emilia.r@contoso.onmicrosoft.com',       lastActive: '6h',   lastActiveAbs: '2026-05-17 08:21 UTC', ws30d: 3,  reports30d: 4,  adminCount: 0, risk: 'sky',   riskReasons: [] },
      u6:  { upn: 'hans.b@contoso.onmicrosoft.com',         lastActive: '12m',  lastActiveAbs: '2026-05-17 14:04 UTC', ws30d: 14, reports30d: 8,  adminCount: 3, risk: 'sky',   riskReasons: [] },
      u7:  { upn: 'yuki.t@contoso.onmicrosoft.com',         lastActive: '4h',   lastActiveAbs: '2026-05-17 10:38 UTC', ws30d: 3,  reports30d: 11, adminCount: 0, risk: 'sky',   riskReasons: [] },
      u8:  { upn: 'maya.g@contoso.onmicrosoft.com',         lastActive: '2d',   lastActiveAbs: '2026-05-15 10:08 UTC', ws30d: 2,  reports30d: 6,  adminCount: 0, risk: 'sky',   riskReasons: [] },
      u9:  { upn: 'jakub.n@contoso.onmicrosoft.com',        lastActive: '67d',  lastActiveAbs: '2026-03-11 09:14 UTC', ws30d: 0,  reports30d: 0,  adminCount: 0, risk: 'amber', riskReasons: ['Dormant 67d · Free license'] },
      u10: { upn: 'priya.s@contoso.onmicrosoft.com',        lastActive: '5h',   lastActiveAbs: '2026-05-17 09:33 UTC', ws30d: 4,  reports30d: 7,  adminCount: 1, risk: 'amber', riskReasons: ['Export-heavy · 156/30d'] },
      u11: { upn: 'felix.b@contoso.onmicrosoft.com',        lastActive: '2d',   lastActiveAbs: '2026-05-15 16:42 UTC', ws30d: 6,  reports30d: 5,  adminCount: 0, risk: 'sky',   riskReasons: [] },
      u12: { upn: 'lena.h@contoso.onmicrosoft.com',         lastActive: '8h',   lastActiveAbs: '2026-05-17 06:24 UTC', ws30d: 9,  reports30d: 3,  adminCount: 2, risk: 'sky',   riskReasons: [] },
    },
    // Extra users that only appear on /users-new — chosen to seed clear high-risk + wasted-license cases.
    extras: [
      { id: 'u13', upn: 'jens.muller@contoso.onmicrosoft.com',   name: 'Jens Müller',      dept: 'Sales',      role: 'Regional Mgr',  licenseSku: 'PPU',  licenseCost: 200, lastActive: '184d', lastActiveAbs: '2025-11-15 11:42 UTC', ws30d: 0,  reports30d: 0,  adminCount: 0, risk: 'rose',  riskReasons: ['Dormant 184d · PPU $200/mo wasted'] },
      { id: 'u14', upn: 'svc-finance-runner@contoso.onmicrosoft.com', name: 'svc-finance-runner', dept: 'IT',  role: 'Service Acct',  licenseSku: 'Fabric F1', licenseCost: 262, lastActive: '92d',  lastActiveAbs: '2026-02-15 03:00 UTC', ws30d: 0,  reports30d: 0,  adminCount: 8, risk: 'rose',  riskReasons: ['Service account · Admin on 8 workspaces', 'No activity 92d', 'Off-hours pattern: 03:00 UTC'] },
      { id: 'u15', upn: 'amelia.shaw@contoso.onmicrosoft.com',   name: 'Amelia Shaw',      dept: 'Finance',    role: 'Auditor',       licenseSku: 'Pro',  licenseCost: 10,  lastActive: '38d',  lastActiveAbs: '2026-04-09 14:20 UTC', ws30d: 0,  reports30d: 0,  adminCount: 1, risk: 'amber', riskReasons: ['Dormant 38d', 'Admin on Audit-2025 unused 38d'] },
    ],
  },

  // /tenant-activity — forensic search over Fabric activity_events (priority #3 / T1.13). UPN aliases mirror usersNew.
  tenantActivity: {
    summary: {
      events24h:      583,
      events24hSpark: __wkSpark(24, 25, 0.6, 17),
      actors24h:      47,
      topOp:          { op: 'ViewReport', count: 312 },
      offHours7d:     23,
      offHoursAlert:  true,
    },
    // Realistic Fabric event types grouped for filter chips. Tone matches LP severity system.
    opGroups: [
      { key: 'view',   label: 'View',   tone: 'sky',     ops: ['ViewReport', 'ViewDashboard', 'ViewArticle'] },
      { key: 'export', label: 'Export', tone: 'amber',   ops: ['ExportReport', 'ExportEntity', 'ExportArtifact'] },
      { key: 'edit',   label: 'Edit',   tone: 'violet',  ops: ['EditDataset', 'EditReport', 'RefreshDataset', 'EditDataflow'] },
      { key: 'share',  label: 'Share',  tone: 'emerald', ops: ['ShareReport', 'ShareDashboard'] },
      { key: 'admin',  label: 'Admin',  tone: 'rose',    ops: ['UpdateTenantSettings', 'CreateApp', 'PublishToWeb'] },
      { key: 'ai',     label: 'AI',     tone: 'violet',  ops: ['GenerateCustomVisualAIInsight'] },
      { key: 'rls',    label: 'RLS',    tone: 'sky',     ops: ['EvaluateRowLevelSecurityRule'] },
    ],
    sensitivities: ['Restricted', 'Confidential', 'Internal'],
    workspaces:    ['Finance-Prod', 'Sales-Prod', 'RetailOps', 'Operations', 'Marketing', 'HR-Data', 'Ops-Score'],
    // Saved-query presets (the "save query" affordance of a Bloomberg-terminal-shaped UI)
    savedQueries: [
      { id: 'sq1', label: 'Off-hours Restricted exports · 30d', icon: 'moon',   tone: 'rose'   },
      { id: 'sq2', label: 'Admin ops on Sales-Prod · 7d',       icon: 'shield', tone: 'rose'   },
      { id: 'sq3', label: 'Failed RLS evaluations · 30d',       icon: 'alert',  tone: 'amber'  },
      { id: 'sq4', label: 'Service-principal activity · 24h',   icon: 'bot',    tone: 'sky'    },
      { id: 'sq5', label: 'Copilot suggestions accepted · 7d',  icon: 'wand',   tone: 'violet' },
    ],
    // 40 fake-but-Fabric-plausible events. ISO-ish strings, mixed times across last ~36h to seed off-hours flagging.
    events: [
      { id: 'e001', at: '2026-05-17T14:42:11Z', upn: 'sara.patel@contoso.onmicrosoft.com',     actor: 'Sara Patel',          group: 'view',   op: 'ViewReport',                       item: 'Sales Analytics · Margin Dashboard', ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.31'   },
      { id: 'e002', at: '2026-05-17T14:38:48Z', upn: 'sara.patel@contoso.onmicrosoft.com',     actor: 'Sara Patel',          group: 'ai',     op: 'GenerateCustomVisualAIInsight',    item: '"trend in EMEA Q1 revenue?"',         ws: 'Finance-Prod', sens: null,           status: 'ok',   ip: '85.144.12.31'   },
      { id: 'e003', at: '2026-05-17T14:21:02Z', upn: 'daniel.o@contoso.onmicrosoft.com',       actor: 'Daniel Okafor',       group: 'export', op: 'ExportReport',                     item: 'Sales Pipeline · top-customers (XLSX)', ws: 'Sales-Prod',   sens: 'Restricted',   status: 'ok',   ip: '94.226.88.4',   flag: true },
      { id: 'e004', at: '2026-05-17T13:55:39Z', upn: 'michiel.v@contoso.onmicrosoft.com',      actor: 'Michiel Vermeer',     group: 'edit',   op: 'EditDataset',                      item: 'Budget Planning · YTD Variance',      ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.18'   },
      { id: 'e005', at: '2026-05-17T13:12:55Z', upn: 'sara.patel@contoso.onmicrosoft.com',     actor: 'Sara Patel',          group: 'view',   op: 'ViewReport',                       item: 'Revenue Forecast · Q2 outlook',       ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.31'   },
      { id: 'e006', at: '2026-05-17T12:08:01Z', upn: 'michiel.v@contoso.onmicrosoft.com',      actor: 'Michiel Vermeer',     group: 'edit',   op: 'RefreshDataset',                   item: 'Budget Planning',                     ws: 'Finance-Prod', sens: null,           status: 'ok',   ip: '85.144.12.18'   },
      { id: 'e007', at: '2026-05-17T11:34:22Z', upn: 'anita.v@contoso.onmicrosoft.com',        actor: 'Anita Velasquez',     group: 'export', op: 'ExportReport',                     item: 'Ops Daily · cycle-times (PDF)',       ws: 'Operations',   sens: 'Internal',     status: 'ok',   ip: '212.45.11.9'    },
      { id: 'e008', at: '2026-05-17T11:02:14Z', upn: 'svc-finance-runner@contoso.onmicrosoft.com', actor: 'svc-finance-runner', group: 'edit',  op: 'RefreshDataset',                   item: 'GL Balances',                         ws: 'Finance-Prod', sens: null,           status: 'fail', ip: 'fabric-service', errCode: 'CapacityThrottle' },
      { id: 'e009', at: '2026-05-17T10:48:30Z', upn: 'maya.g@contoso.onmicrosoft.com',         actor: 'Maya Greenfield',     group: 'view',   op: 'ViewReport',                       item: 'HR Headcount · attrition trend',      ws: 'HR-Data',      sens: 'Restricted',   status: 'ok',   ip: '85.144.12.55'   },
      { id: 'e010', at: '2026-05-17T10:14:08Z', upn: 'daniel.o@contoso.onmicrosoft.com',       actor: 'Daniel Okafor',       group: 'export', op: 'ExportReport',                     item: 'Sales Pipeline · deals-won (CSV)',    ws: 'Sales-Prod',   sens: 'Restricted',   status: 'ok',   ip: '94.226.88.4',   flag: true },
      { id: 'e011', at: '2026-05-17T09:33:18Z', upn: 'priya.s@contoso.onmicrosoft.com',        actor: 'Priya Sharma',        group: 'view',   op: 'ViewDashboard',                    item: 'Sales · EMEA QBR pack',                ws: 'Sales-Prod',   sens: 'Confidential', status: 'ok',   ip: '85.144.12.84'   },
      { id: 'e012', at: '2026-05-17T09:14:51Z', upn: 'michiel.v@contoso.onmicrosoft.com',      actor: 'Michiel Vermeer',     group: 'share',  op: 'ShareReport',                      item: 'Margin Dashboard → felix.b@…',          ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.18'   },
      { id: 'e013', at: '2026-05-17T08:42:09Z', upn: 'felix.b@contoso.onmicrosoft.com',        actor: 'Felix Beaumont',      group: 'view',   op: 'ViewReport',                       item: 'GL Balances · trial balance',         ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '195.34.7.180'   },
      { id: 'e014', at: '2026-05-17T08:18:36Z', upn: 'svc-finance-runner@contoso.onmicrosoft.com', actor: 'svc-finance-runner', group: 'rls',   op: 'EvaluateRowLevelSecurityRule',      item: 'Sales Analytics · RLS [Region=EMEA]', ws: 'Sales-Prod',   sens: null,           status: 'fail', ip: 'fabric-service', errCode: 'RuleNotMatched' },
      { id: 'e015', at: '2026-05-17T06:24:55Z', upn: 'lena.h@contoso.onmicrosoft.com',         actor: 'Lena Hofmann',        group: 'edit',   op: 'EditDataflow',                     item: 'Finance ETL · daily refresh',         ws: 'Finance-Prod', sens: null,           status: 'ok',   ip: '85.144.12.41'   },
      { id: 'e016', at: '2026-05-17T03:11:42Z', upn: 'svc-finance-runner@contoso.onmicrosoft.com', actor: 'svc-finance-runner', group: 'admin', op: 'UpdateTenantSettings',             item: 'TenantSetting: ExportToExcel · enabled', ws: '—',         sens: null,           status: 'ok',   ip: 'fabric-service', flag: true },
      { id: 'e017', at: '2026-05-17T02:48:18Z', upn: 'daniel.o@contoso.onmicrosoft.com',       actor: 'Daniel Okafor',       group: 'export', op: 'ExportEntity',                     item: 'Sales Analytics · raw_transactions',   ws: 'Sales-Prod',   sens: 'Restricted',   status: 'ok',   ip: '92.41.20.118',  flag: true },
      { id: 'e018', at: '2026-05-17T02:24:09Z', upn: 'daniel.o@contoso.onmicrosoft.com',       actor: 'Daniel Okafor',       group: 'view',   op: 'ViewReport',                       item: 'Sales Pipeline · forecasts',          ws: 'Sales-Prod',   sens: 'Restricted',   status: 'ok',   ip: '92.41.20.118',  flag: true },
      { id: 'e019', at: '2026-05-17T00:42:33Z', upn: 'svc-finance-runner@contoso.onmicrosoft.com', actor: 'svc-finance-runner', group: 'edit',   op: 'RefreshDataset',                   item: 'Operations Scorecard',                ws: 'Ops-Score',    sens: null,           status: 'ok',   ip: 'fabric-service' },
      { id: 'e020', at: '2026-05-16T22:11:28Z', upn: 'yuki.t@contoso.onmicrosoft.com',         actor: 'Yuki Tanaka',         group: 'view',   op: 'ViewReport',                       item: 'Budget Planning · YTD Variance',      ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.99'   },
      { id: 'e021', at: '2026-05-16T19:08:11Z', upn: 'hans.b@contoso.onmicrosoft.com',         actor: 'Hans Berg',           group: 'edit',   op: 'EditDataflow',                     item: 'Capacity Telemetry · hourly',         ws: 'Ops-Score',    sens: null,           status: 'ok',   ip: '85.144.12.30'   },
      { id: 'e022', at: '2026-05-16T18:42:50Z', upn: 'sara.patel@contoso.onmicrosoft.com',     actor: 'Sara Patel',          group: 'ai',     op: 'GenerateCustomVisualAIInsight',    item: '"top 3 cost drivers Q1?"',            ws: 'Finance-Prod', sens: null,           status: 'ok',   ip: '85.144.12.31'   },
      { id: 'e023', at: '2026-05-16T17:14:22Z', upn: 'anita.v@contoso.onmicrosoft.com',        actor: 'Anita Velasquez',     group: 'export', op: 'ExportReport',                     item: 'Mooring Dashboard · daily-ops (PDF)', ws: 'Operations',   sens: 'Internal',     status: 'ok',   ip: '212.45.11.9'    },
      { id: 'e024', at: '2026-05-16T16:48:09Z', upn: 'michiel.v@contoso.onmicrosoft.com',      actor: 'Michiel Vermeer',     group: 'admin', op: 'CreateApp',                        item: 'Q2 Executive Pack (new app)',         ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.18'   },
      { id: 'e025', at: '2026-05-16T15:33:01Z', upn: 'svc-finance-runner@contoso.onmicrosoft.com', actor: 'svc-finance-runner', group: 'admin', op: 'PublishToWeb',                     item: 'Sales Pipeline · external dashboard', ws: 'Sales-Prod',   sens: 'Internal',     status: 'ok',   ip: 'fabric-service', flag: true },
      { id: 'e026', at: '2026-05-16T14:08:44Z', upn: 'maya.g@contoso.onmicrosoft.com',         actor: 'Maya Greenfield',     group: 'export', op: 'ExportReport',                     item: 'HR Headcount · attrition (CSV)',       ws: 'HR-Data',      sens: 'Restricted',   status: 'ok',   ip: '85.144.12.55',  flag: true },
      { id: 'e027', at: '2026-05-16T11:21:15Z', upn: 'priya.s@contoso.onmicrosoft.com',        actor: 'Priya Sharma',        group: 'share',  op: 'ShareDashboard',                   item: 'EMEA QBR pack → anita.v@…',             ws: 'Sales-Prod',   sens: 'Confidential', status: 'ok',   ip: '85.144.12.84'   },
      { id: 'e028', at: '2026-05-16T10:54:02Z', upn: 'lena.h@contoso.onmicrosoft.com',         actor: 'Lena Hofmann',        group: 'edit',   op: 'EditDataset',                      item: 'Capacity Telemetry · hourly',         ws: 'Ops-Score',    sens: null,           status: 'ok',   ip: '85.144.12.41'   },
      { id: 'e029', at: '2026-05-16T09:48:31Z', upn: 'hans.b@contoso.onmicrosoft.com',         actor: 'Hans Berg',           group: 'view',   op: 'ViewArticle',                      item: 'Architecture Notes · Fabric mesh',     ws: 'Operations',   sens: null,           status: 'ok',   ip: '85.144.12.30'   },
      { id: 'e030', at: '2026-05-16T08:42:18Z', upn: 'sara.patel@contoso.onmicrosoft.com',     actor: 'Sara Patel',          group: 'view',   op: 'ViewReport',                       item: 'Margin Dashboard',                     ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.31'   },
      { id: 'e031', at: '2026-05-16T07:14:09Z', upn: 'felix.b@contoso.onmicrosoft.com',        actor: 'Felix Beaumont',      group: 'export', op: 'ExportReport',                     item: 'GL Balances · trial balance (XLSX)',  ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '195.34.7.180'   },
      { id: 'e032', at: '2026-05-16T05:32:48Z', upn: 'svc-finance-runner@contoso.onmicrosoft.com', actor: 'svc-finance-runner', group: 'edit',   op: 'RefreshDataset',                   item: 'GL Balances',                         ws: 'Finance-Prod', sens: null,           status: 'ok',   ip: 'fabric-service' },
      { id: 'e033', at: '2026-05-16T04:18:22Z', upn: 'svc-finance-runner@contoso.onmicrosoft.com', actor: 'svc-finance-runner', group: 'edit',   op: 'RefreshDataset',                   item: 'RetailOperations',                    ws: 'RetailOps',    sens: null,           status: 'ok',   ip: 'fabric-service' },
      { id: 'e034', at: '2026-05-15T23:51:42Z', upn: 'daniel.o@contoso.onmicrosoft.com',       actor: 'Daniel Okafor',       group: 'export', op: 'ExportEntity',                     item: 'Sales Pipeline · raw_deals',           ws: 'Sales-Prod',   sens: 'Restricted',   status: 'ok',   ip: '92.41.20.118',  flag: true },
      { id: 'e035', at: '2026-05-15T22:14:08Z', upn: 'maya.g@contoso.onmicrosoft.com',         actor: 'Maya Greenfield',     group: 'view',   op: 'ViewReport',                       item: 'HR Headcount · attrition trend',      ws: 'HR-Data',      sens: 'Restricted',   status: 'ok',   ip: '85.144.12.55'   },
      { id: 'e036', at: '2026-05-15T18:42:00Z', upn: 'anita.v@contoso.onmicrosoft.com',        actor: 'Anita Velasquez',     group: 'share',  op: 'ShareReport',                      item: 'Mooring Dashboard → external@…',        ws: 'Operations',   sens: 'Internal',     status: 'ok',   ip: '212.45.11.9'    },
      { id: 'e037', at: '2026-05-15T17:08:31Z', upn: 'priya.s@contoso.onmicrosoft.com',        actor: 'Priya Sharma',        group: 'export', op: 'ExportReport',                     item: 'EMEA QBR pack (PDF)',                  ws: 'Sales-Prod',   sens: 'Confidential', status: 'ok',   ip: '85.144.12.84'   },
      { id: 'e038', at: '2026-05-15T14:32:14Z', upn: 'hans.b@contoso.onmicrosoft.com',         actor: 'Hans Berg',           group: 'edit',   op: 'EditDataflow',                     item: 'RetailOps ETL · hourly',              ws: 'RetailOps',    sens: null,           status: 'ok',   ip: '85.144.12.30'   },
      { id: 'e039', at: '2026-05-15T11:18:42Z', upn: 'sara.patel@contoso.onmicrosoft.com',     actor: 'Sara Patel',          group: 'view',   op: 'ViewReport',                       item: 'Revenue Forecast · Q2 outlook',       ws: 'Finance-Prod', sens: 'Confidential', status: 'ok',   ip: '85.144.12.31'   },
      { id: 'e040', at: '2026-05-15T09:42:08Z', upn: 'michiel.v@contoso.onmicrosoft.com',      actor: 'Michiel Vermeer',     group: 'view',   op: 'ViewReport',                       item: 'Operations Scorecard · cycle-times',  ws: 'Ops-Score',    sens: 'Confidential', status: 'ok',   ip: '85.144.12.18'   },
    ],
  },

  // /portfolio — F-2 partner wedge (priority #S3). Partner sees ALL their customer Fabric tenants in one pane.
  partnerPortfolio: {
    partner: { name: 'Acme Data Partners', customerCount: 12, invitedPending: 2 },
    summary: {
      customers:       12,
      invitedPending:  2,
      totalCUSpend:    47820,                                                          // €/mo aggregate across portfolio
      spendSpark:      __wkSpark(14, 45, 0.15, 31),                                    // 14d total-spend trend
      throttlingNow:   2,                                                              // active throttling customers
      aggregateHealth: 71,
      healthDelta:     -3,                                                             // week-over-week
      criticalIssues:  7,                                                              // open critical findings across all 12
    },
    customers: [
      { id: 'contoso',   name: 'Contoso Fabric',        tier: 'F64', region: 'west-europe',     env: 'F64-prod-we', health: 74, healthDelta: +3,  cuSpark: __wkSpark(7, 62, 0.4, 11),  cuPercent: 62, monthlySpend: 12400, currency: '€', star: true,  throttling: false, lastSync: '2h ago',  topIssue: { sev: 'critical', text: '3 Import models > 50M rows' } },
      { id: 'nw-trade',  name: 'Northwind Traders',     tier: 'F32', region: 'east-us',         env: 'F32-prod-eu', health: 88, healthDelta: +2,  cuSpark: __wkSpark(7, 38, 0.3, 12),  cuPercent: 38, monthlySpend: 6200,  currency: '€', star: false, throttling: false, lastSync: '14m ago', topIssue: null },
      { id: 'adv-works', name: 'Adventure Works',       tier: 'F16', region: 'south-central-us',env: 'F16-prod-us', health: 62, healthDelta: -1,  cuSpark: __wkSpark(7, 78, 0.6, 13),  cuPercent: 78, monthlySpend: 3100,  currency: '€', star: false, throttling: false, lastSync: '1h ago',  topIssue: { sev: 'warning', text: 'Refresh failure rate 18% / 7d' } },
      { id: 'wwi',       name: 'Wide World Importers',  tier: 'F64', region: 'west-europe',     env: 'F64-prod-we', health: 81, healthDelta: +4,  cuSpark: __wkSpark(7, 55, 0.3, 14),  cuPercent: 55, monthlySpend: 11800, currency: '€', star: true,  throttling: false, lastSync: '6h ago',  topIssue: { sev: 'info',    text: 'Doc coverage 41% — under target' } },
      { id: 'fabrikam',  name: 'Fabrikam',              tier: 'F32', region: 'north-europe',    env: 'F32-prod-ne', health: 54, healthDelta: -8,  cuSpark: __wkSpark(7, 92, 0.3, 15),  cuPercent: 92, monthlySpend: 5900,  currency: '€', star: false, throttling: true,  lastSync: '8h ago',  topIssue: { sev: 'critical', text: 'Throttling 12h/wk on F32' } },
      { id: 'tw-trade',  name: 'Tailwind Traders',      tier: 'F16', region: 'west-europe',     env: 'F16-prod-we', health: 79, healthDelta: 0,   cuSpark: __wkSpark(7, 44, 0.3, 16),  cuPercent: 44, monthlySpend: 2900,  currency: '€', star: false, throttling: false, lastSync: '22m ago', topIssue: null },
      { id: 'litware',   name: 'Litware',               tier: 'F8',  region: 'west-us',         env: 'F8-prod-wus', health: 91, healthDelta: +1,  cuSpark: __wkSpark(7, 41, 0.3, 17),  cuPercent: 41, monthlySpend: 1540,  currency: '$', star: false, throttling: false, lastSync: '3h ago',  topIssue: null },
      { id: 'proseware', name: 'Proseware',             tier: 'F32', region: 'south-europe',    env: 'F32-prod-se', health: 67, healthDelta: -2,  cuSpark: __wkSpark(7, 58, 0.4, 18),  cuPercent: 58, monthlySpend: 6100,  currency: '€', star: false, throttling: false, lastSync: '4h ago',  topIssue: { sev: 'warning', text: '14 dormant Power BI reports' } },
      { id: 'lucerne',   name: 'Lucerne Publishing',    tier: 'F2',  region: 'north-europe',    env: 'F2-prod-ne',  health: 84, healthDelta: +1,  cuSpark: __wkSpark(7, 35, 0.3, 19),  cuPercent: 35, monthlySpend: 380,   currency: '€', star: false, throttling: false, lastSync: '1h ago',  topIssue: null },
      { id: 'margie',    name: "Margie's Travel",        tier: 'F8',  region: 'uk-south',        env: 'F8-prod-uks', health: 58, healthDelta: -4,  cuSpark: __wkSpark(7, 0, 0.0, 20),   cuPercent: 0,  monthlySpend: 1490,  currency: '£', star: false, throttling: false, lastSync: '3d ago',  topIssue: { sev: 'critical', text: 'Partner-read REVOKED · re-invite needed' } },
      { id: 'coho',      name: 'Coho Vineyard',         tier: 'F4',  region: 'west-europe',     env: 'F4-prod-we',  health: 76, healthDelta: 0,   cuSpark: __wkSpark(7, 51, 0.4, 21),  cuPercent: 51, monthlySpend: 760,   currency: '€', star: false, throttling: false, lastSync: '5h ago',  topIssue: null },
      { id: 'trey',      name: 'Trey Research',         tier: 'F16', region: 'brazil-south',    env: 'F16-prod-br', health: 43, healthDelta: -12, cuSpark: __wkSpark(7, 88, 0.6, 22),  cuPercent: 88, monthlySpend: 2900,  currency: '$', star: false, throttling: true,  lastSync: '12m ago', topIssue: { sev: 'critical', text: 'Capacity migration unstable · 4 refresh failures' } },
    ],
    // Worst-N by combined movement (delta of health + cost + wasted-spend). Ammo for the partner's QBR / outbound calls.
    worstMovement: [
      { id: 'trey',     name: 'Trey Research',  env: 'F16-prod-br', healthDelta: -12, costDeltaPct: +8,  wastedSpendDelta: +220, topAction: 'Capacity migration to F16-prod-br destabilized refresh schedule; 4 datasets failing nightly', cta: 'Schedule call' },
      { id: 'fabrikam', name: 'Fabrikam',       env: 'F32-prod-ne', healthDelta: -8,  costDeltaPct: +24, wastedSpendDelta: +840, topAction: 'Throttling 12h/wk on F32 — recommend F64 upgrade OR rebalance workload off peak windows', cta: 'Schedule call' },
      { id: 'margie',   name: "Margie's Travel", env: 'F8-prod-uks', healthDelta: -4,  costDeltaPct: 0,   wastedSpendDelta: 0,   topAction: 'Customer admin revoked partner-read access 3d ago; visibility blocked until re-invite is accepted', cta: 'Re-invite' },
      { id: 'adv-works',name: 'Adventure Works',env: 'F16-prod-us', healthDelta: -1,  costDeltaPct: +6,  wastedSpendDelta: +180, topAction: 'Refresh failure rate climbed 11% → 18% over 7d; root cause traces to one Power BI dataset', cta: 'Open issue' },
      { id: 'proseware',name: 'Proseware',      env: 'F32-prod-se', healthDelta: -2,  costDeltaPct: +3,  wastedSpendDelta: +320, topAction: '14 Power BI reports unopened in 90d still consuming refresh CU — recommend deprecation review', cta: 'Open report' },
    ],
    // Fix-first queue — discrete, typed, €-quantified actions aggregated ACROSS all customer tenants.
    // €-ranked first; non-€ governance/quality actions interleave by a severity-blended priority.
    // Each row: what to do · which customer · € impact · source pillar · one-click CTA. Snooze/resolve are humans-in-the-loop.
    fixFirst: [
      { id: 'ff1',  type: 'throttling', typeLabel: 'Throttling',   icon: 'zap',          sev: 'critical', pillar: 'FinOps',     customerId: 'fabrikam',  customer: 'Fabrikam',             env: 'F32-prod-ne', euro: 840,  euroLabel: '+€840/mo',   what: 'Throttling 12h/wk on F32 — upgrade to F64 or rebalance workload off peak windows.', cta: 'Act as' },
      { id: 'ff2',  type: 'access',     typeLabel: 'Access lost',   icon: 'shield',       sev: 'critical', pillar: 'Governance', customerId: 'margie',    customer: "Margie's Travel",      env: 'F8-prod-uks', euro: null, euroLabel: 'visibility lost', what: 'Partner-read access revoked 3d ago — telemetry blocked until the customer accepts a re-invite.', cta: 'Re-invite' },
      { id: 'ff3',  type: 'dormant',    typeLabel: 'Wasted spend',  icon: 'folders',      sev: 'warning',  pillar: 'FinOps',     customerId: 'proseware', customer: 'Proseware',            env: 'F32-prod-se', euro: 320,  euroLabel: '+€320/mo',   what: '14 Power BI reports unopened in 90d still consuming refresh CU — deprecation review.', cta: 'Act as' },
      { id: 'ff4',  type: 'refresh',    typeLabel: 'Refresh fail',  icon: 'refresh',      sev: 'critical', pillar: 'Quality',    customerId: 'trey',      customer: 'Trey Research',        env: 'F16-prod-br', euro: 220,  euroLabel: '+€220/mo',   what: 'Capacity migration destabilized 4 nightly dataset refreshes — investigate schedule + retries.', cta: 'Open issue' },
      { id: 'ff5',  type: 'refresh',    typeLabel: 'Refresh fail',  icon: 'refresh',      sev: 'warning',  pillar: 'Quality',    customerId: 'adv-works', customer: 'Adventure Works',      env: 'F16-prod-us', euro: 180,  euroLabel: '+€180/mo',   what: 'Refresh failure rate climbed 11% → 18% over 7d — one Power BI dataset is the root cause.', cta: 'Open issue' },
      { id: 'ff6',  type: 'model',      typeLabel: 'Model bloat',   icon: 'database',     sev: 'critical', pillar: 'Quality',    customerId: 'contoso',   customer: 'Contoso Fabric',       env: 'F64-prod-we', euro: 140,  euroLabel: '+€140/mo',   what: '3 Import models > 50M rows bloating refresh + CU — evaluate Direct Lake conversion.', cta: 'Act as' },
      { id: 'ff7',  type: 'throttling', typeLabel: 'Capacity risk', icon: 'gauge',        sev: 'warning',  pillar: 'FinOps',     customerId: 'trey',      customer: 'Trey Research',        env: 'F16-prod-br', euro: 110,  euroLabel: '+€110/mo',   what: 'F16 sustained > 85% CU — right-size or rebalance before the next migration window.', cta: 'Act as' },
      { id: 'ff8',  type: 'ownership',  typeLabel: 'Ownership gap', icon: 'users',        sev: 'warning',  pillar: 'Governance', customerId: 'wwi',       customer: 'Wide World Importers', env: 'F64-prod-we', euro: null, euroLabel: 'audit risk',  what: '3 high-traffic models have no assigned owner — accountability gap before the next audit.', cta: 'Assign owner' },
      { id: 'ff9',  type: 'doc',        typeLabel: 'Doc coverage',  icon: 'file-text',    sev: 'info',     pillar: 'Quality',    customerId: 'wwi',       customer: 'Wide World Importers', env: 'F64-prod-we', euro: null, euroLabel: 'below target', what: 'Doc coverage 41% — under the 60% target for partner-managed models.', cta: 'Generate docs' },
      { id: 'ff10', type: 'cert',       typeLabel: 'Cert expiring', icon: 'shield-check', sev: 'info',     pillar: 'Governance', customerId: 'lucerne',   customer: 'Lucerne Publishing',   env: 'F2-prod-ne',  euro: null, euroLabel: 'expires 21d', what: 'Service-principal credential expires in 21 days — rotate to avoid a sync outage.', cta: 'Open settings' },
    ],
    // F-2 activity feed — invitations, access grants/revocations, capacity changes across the portfolio.
    f2Activity: [
      { id: 'fa1',  at: '2h ago',  atAbs: '2026-05-17 13:08 UTC', tone: 'emerald', type: 'access_granted',     customer: 'Northwind Traders',     detail: 'granted partner-read access',                            icon: 'shield-check' },
      { id: 'fa2',  at: '4h ago',  atAbs: '2026-05-17 11:24 UTC', tone: 'emerald', type: 'invite_accepted',    customer: 'Trey Research',         detail: 'invitation accepted · partner-of-record live',          icon: 'check' },
      { id: 'fa3',  at: '8h ago',  atAbs: '2026-05-17 07:42 UTC', tone: 'rose',    type: 'throttle_event',     customer: 'Fabrikam',              detail: 'capacity hit 100% CU — sustained 22 min',               icon: 'alert' },
      { id: 'fa4',  at: '12h ago', atAbs: '2026-05-17 03:14 UTC', tone: 'sky',     type: 'workspaces_added',   customer: 'Wide World Importers',  detail: '3 new workspaces added under partner-of-record scope',  icon: 'folders' },
      { id: 'fa5',  at: '1d ago',  atAbs: '2026-05-16 14:38 UTC', tone: 'amber',   type: 'invite_expired',     customer: 'Coho Vineyard',         detail: 'invitation expired · ready to re-send',                 icon: 'alert-triangle' },
      { id: 'fa6',  at: 'yesterday', atAbs: '2026-05-16 09:22 UTC', tone: 'sky',   type: 'admin_added',        customer: 'Lucerne Publishing',    detail: 'new customer admin added (jen.k@lucernepublishing.com)',icon: 'users' },
      { id: 'fa7',  at: '2d ago',  atAbs: '2026-05-15 16:12 UTC', tone: 'sky',     type: 'sku_downgrade',      customer: 'Tailwind Traders',      detail: 'F-SKU downgraded F16 → F8 (-€480/mo)',                  icon: 'arrow-down' },
      { id: 'fa8',  at: '3d ago',  atAbs: '2026-05-14 11:48 UTC', tone: 'rose',    type: 'access_revoked',     customer: "Margie's Travel",       detail: 'customer admin revoked partner-read · visibility lost', icon: 'shield' },
      { id: 'fa9',  at: '3d ago',  atAbs: '2026-05-14 09:08 UTC', tone: 'sky',     type: 'invoice_settled',    customer: 'Litware',               detail: 'monthly invoice settled',                                icon: 'check' },
      { id: 'fa10', at: '4d ago',  atAbs: '2026-05-13 18:32 UTC', tone: 'amber',   type: 'refresh_alert',      customer: 'Adventure Works',       detail: 'alert fired — refresh failure rate exceeded 15% / 7d',  icon: 'bell' },
    ],

    // ── Connections — F-2 invitation lifecycle (partner ↔ customer access) ──
    connections: {
      funnel: { sent: 16, accepted: 12, pending: 2, expired: 1, revoked: 1 },
      invitations: [
        { id: 'in1', customer: 'Northwind Traders',    email: 'admin@northwind.onmicrosoft.com',  status: 'accepted', sentAt: '2026-05-02', by: 'Michiel Q.',  attempts: 1, lastEvent: 'accepted 2026-05-03' },
        { id: 'in2', customer: 'Trey Research',         email: 'it@treyresearch.onmicrosoft.com',  status: 'accepted', sentAt: '2026-05-09', by: 'Sara L.',     attempts: 2, lastEvent: 'accepted 2026-05-11' },
        { id: 'in3', customer: 'Coho Vineyard',         email: 'admin@cohovineyard.com',           status: 'pending',  sentAt: '2026-05-15', by: 'Michiel Q.',  attempts: 1, lastEvent: 'opened, not accepted' },
        { id: 'in4', customer: 'Fabrikam',              email: 'fabric-admin@fabrikam.com',        status: 'pending',  sentAt: '2026-05-16', by: 'Sara L.',     attempts: 1, lastEvent: 'delivered' },
        { id: 'in5', customer: "Margie's Travel",       email: 'admin@margiestravel.co.uk',        status: 'revoked',  sentAt: '2026-04-20', by: 'Michiel Q.',  attempts: 3, lastEvent: 'access revoked 2026-05-14' },
        { id: 'in6', customer: 'Lucerne Publishing',    email: 'jen.k@lucernepublishing.com',      status: 'expired',  sentAt: '2026-04-28', by: 'Sara L.',     attempts: 2, lastEvent: 'expired 2026-05-12 · ready to resend' },
        { id: 'in7', customer: 'Adventure Works',       email: 'admin@adventure-works.com',        status: 'accepted', sentAt: '2026-04-15', by: 'Michiel Q.',  attempts: 1, lastEvent: 'accepted 2026-04-16' },
        { id: 'in8', customer: 'Wide World Importers',  email: 'admin@wideworldimporters.com',     status: 'accepted', sentAt: '2026-04-11', by: 'Michiel Q.',  attempts: 1, lastEvent: 'accepted 2026-04-12' },
      ],
    },

    // ── Team & seats — who watches which customers (partner-side accountability) ──
    team: {
      members: [
        { id: 'tm1', name: 'Michiel Quakernaat', email: 'michiel@acmedata.partners', role: 'Owner',   initials: 'MQ', lastActive: 'now',     owns: ['contoso','wwi','fabrikam','trey'] },
        { id: 'tm2', name: 'Sara Lindqvist',      email: 'sara@acmedata.partners',    role: 'Admin',   initials: 'SL', lastActive: '2h ago',  owns: ['nw-trade','adv-works','proseware'] },
        { id: 'tm3', name: 'Daniel Okoro',        email: 'daniel@acmedata.partners',  role: 'Analyst', initials: 'DO', lastActive: '1d ago',  owns: ['litware','lucerne','coho'] },
        { id: 'tm4', name: 'Priya Nair',          email: 'priya@acmedata.partners',   role: 'Analyst', initials: 'PN', lastActive: '4h ago',  owns: ['tw-trade'] },
      ],
      // 'margie' is intentionally unassigned → coverage-gap demo
    },

    // ── Benchmarks — cross-customer comparison dimensions (joins to customers[]) ──
    benchmarks: [
      { id: 'contoso',   health: 74, wastedPct: 12, docCov: 58, costPerCu: 1.92, refreshFail: 4 },
      { id: 'nw-trade',  health: 88, wastedPct: 4,  docCov: 81, costPerCu: 1.41, refreshFail: 1 },
      { id: 'adv-works', health: 62, wastedPct: 19, docCov: 47, costPerCu: 2.18, refreshFail: 18 },
      { id: 'wwi',       health: 81, wastedPct: 9,  docCov: 41, costPerCu: 1.74, refreshFail: 2 },
      { id: 'fabrikam',  health: 54, wastedPct: 27, docCov: 52, costPerCu: 2.61, refreshFail: 6 },
      { id: 'tw-trade',  health: 79, wastedPct: 7,  docCov: 66, costPerCu: 1.55, refreshFail: 2 },
      { id: 'litware',   health: 91, wastedPct: 3,  docCov: 74, costPerCu: 1.33, refreshFail: 0 },
      { id: 'proseware', health: 67, wastedPct: 15, docCov: 49, costPerCu: 1.98, refreshFail: 3 },
      { id: 'lucerne',   health: 84, wastedPct: 5,  docCov: 70, costPerCu: 1.28, refreshFail: 1 },
      { id: 'trey',      health: 43, wastedPct: 31, docCov: 38, costPerCu: 2.94, refreshFail: 12 },
      { id: 'coho',      health: 76, wastedPct: 8,  docCov: 62, costPerCu: 1.61, refreshFail: 0 },
    ],

    // ── Partner's LayerPulse subscription (NOT customer Fabric spend) ──
    billing: {
      plan: 'Partner Pro', mrr: 1490, currency: '€', renewal: '2026-09-01', status: 'active',
      envQuota: { used: 12, total: 15 }, seatQuota: { used: 4, total: 8 }, modelQuota: { used: 387, total: 1000 },
      invoices: [
        { id: 'inv-0526', date: '2026-05-01', amount: 1490, status: 'paid' },
        { id: 'inv-0426', date: '2026-04-01', amount: 1490, status: 'paid' },
        { id: 'inv-0326', date: '2026-03-01', amount: 1190, status: 'paid' },
        { id: 'inv-0226', date: '2026-02-01', amount: 1190, status: 'paid' },
      ],
    },

    // ── QBR builder — selectable evidence sections for a per-customer pack ──
    qbrSections: [
      { id: 'cost',    label: 'Cost & share-of-bill',     desc: 'Monthly spend, CU trend, share of capacity bill', on: true },
      { id: 'saved',   label: 'Savings delivered',        desc: 'Wasted spend reclaimed + SKU right-sizing this quarter', on: true },
      { id: 'risks',   label: 'Risks closed',             desc: 'Throttling, refresh failures, access issues resolved', on: true },
      { id: 'actions', label: 'Open recommendations',     desc: 'The fix-first queue scoped to this customer', on: true },
      { id: 'adoption',label: 'Adoption & engagement',    desc: 'DAU/WAU/MAU, dormant reports, top content', on: false },
      { id: 'quality', label: 'Model quality & docs',     desc: 'Health score, doc coverage, model hygiene', on: false },
      { id: 'next',    label: 'Plan for next quarter',    desc: 'Recommended next actions + capacity outlook', on: true },
    ],
  },

  /* ───────────────────────────────────────────────────────────────────────
     OWNERSHIP — manual data layer (workspace default · per-model override)
     Captures business role assignments that no Fabric API exposes.
     ─────────────────────────────────────────────────────────────────────── */
  ownership: {
    stats: {
      workspaces:        12,
      assignedDefaults:  10,
      missingDefaults:    2,
      modelsWithOverride: 7,
      totalModels:       54,
      stewardsActive:    18,
      lastReviewed:      '2026-05-12',
    },
    roles: [
      { key: 'data-lead',     label: 'Data lead',        tone: 'sky',     desc: 'Accountable owner. First call for any source-of-truth question.' },
      { key: 'bi-steward',    label: 'BI steward',       tone: 'emerald', desc: 'Reviews changes, approves new measures, monitors quality.' },
      { key: 'backup',        label: 'Backup owner',     tone: 'amber',   desc: 'Stand-in when the data lead is unavailable.' },
      { key: 'source-dba',    label: 'Source DBA',       tone: 'violet',  desc: 'Owns the upstream system; consulted on lineage and schema changes.' },
      { key: 'business-owner',label: 'Business owner',   tone: 'rose',    desc: 'Sponsor on the business side. Sign-off on definitions and KPIs.' },
    ],
    workspaceDefaults: [
      { ws: 'Finance-Prod',   env: 'PROD', leadName: 'Alex Rivera',     leadEmail: 'a.rivera@contoso.com',    stewards: 3, overrides: 4, lastReview: '2026-05-15', status: 'current' },
      { ws: 'Operations',     env: 'PROD', leadName: 'Sofia Lindqvist', leadEmail: 's.lindqvist@contoso.com', stewards: 2, overrides: 2, lastReview: '2026-05-09', status: 'current' },
      { ws: 'RetailOps',      env: 'PROD', leadName: 'Sofia Lindqvist', leadEmail: 's.lindqvist@contoso.com', stewards: 1, overrides: 1, lastReview: '2026-05-08', status: 'current' },
      { ws: 'Ops-Score',      env: 'PROD', leadName: 'Karim Andersen',  leadEmail: 'k.andersen@contoso.com',  stewards: 4, overrides: 0, lastReview: '2026-04-30', status: 'current' },
      { ws: 'Exec-Reports',   env: 'PROD', leadName: 'Marc Qureshi',    leadEmail: 'm.qureshi@contoso.com',   stewards: 2, overrides: 0, lastReview: '2026-05-12', status: 'current' },
      { ws: 'Sales-NA',       env: 'PROD', leadName: 'Priya Nair',      leadEmail: 'p.nair@contoso.com',      stewards: 2, overrides: 0, lastReview: '2026-05-11', status: 'current' },
      { ws: 'Sales-EMEA',     env: 'PROD', leadName: 'Tomas Heřmánek',  leadEmail: 't.hermanek@contoso.com',  stewards: 1, overrides: 0, lastReview: '2026-04-28', status: 'stale'   },
      { ws: 'HR-Data',        env: 'DEV',  leadName: 'Janice Patel',    leadEmail: 'j.patel@contoso.com',     stewards: 1, overrides: 0, lastReview: '2026-04-22', status: 'stale'   },
      { ws: 'Marketing',      env: 'DEV',  leadName: 'Peter Nguyen',    leadEmail: 'p.nguyen@contoso.com',    stewards: 2, overrides: 0, lastReview: '2026-05-04', status: 'current' },
      { ws: 'Mobile-BI',      env: 'PROD', leadName: 'Marc Qureshi',    leadEmail: 'm.qureshi@contoso.com',   stewards: 1, overrides: 0, lastReview: '2026-05-10', status: 'current' },
      { ws: 'Supply-Chain',   env: 'UAT',  leadName: null,              leadEmail: null,                      stewards: 0, overrides: 0, lastReview: null,         status: 'missing' },
      { ws: 'Customer-Success', env: 'PROD', leadName: null,            leadEmail: null,                      stewards: 0, overrides: 0, lastReview: null,         status: 'missing' },
    ],
    overrides: [
      // Per-model overrides. The "why" copy is the manual context that justified
      // not inheriting workspace defaults — e.g. report author took ownership.
      { id: 'ov1', ws: 'Finance-Prod', model: 'Revenue Forecast',  leadName: 'Marc Qureshi',    leadEmail: 'm.qureshi@contoso.com',  why: 'Built by forecasting team after Alex (workspace lead) gave them publish rights. They now self-own.', set: '2026-04-19', setBy: 'Alex Rivera' },
      { id: 'ov2', ws: 'Finance-Prod', model: 'Expense P&L',       leadName: 'Priya Nair',      leadEmail: 'p.nair@contoso.com',     why: 'Migrated from Sales-NA. Workspace lead retained for shared dimensions, but P&L is owned downstream.', set: '2026-03-28', setBy: 'Alex Rivera' },
      { id: 'ov3', ws: 'Finance-Prod', model: 'GL Balances',       leadName: 'Tomas Heřmánek',  leadEmail: 't.hermanek@contoso.com', why: 'Built by treasury team in EMEA — cross-region exception.', set: '2026-02-14', setBy: 'Alex Rivera' },
      { id: 'ov4', ws: 'Finance-Prod', model: 'Budget Planning',   leadName: 'Marc Qureshi',    leadEmail: 'm.qureshi@contoso.com',  why: 'Planning cycle owner is BI steward — they request changes faster than the workspace lead can review.', set: '2026-01-22', setBy: 'Alex Rivera' },
      { id: 'ov5', ws: 'Operations',   model: 'Mooring Dashboard', leadName: 'Karim Andersen',  leadEmail: 'k.andersen@contoso.com', why: 'Ops-Score steward also covers this; shared backup pattern.', set: '2026-04-02', setBy: 'Sofia Lindqvist' },
      { id: 'ov6', ws: 'Operations',   model: 'Management of Change', leadName: 'Tomas Heřmánek', leadEmail: 't.hermanek@contoso.com', why: 'Change-management process is owned by compliance team, not Ops.', set: '2026-03-11', setBy: 'Sofia Lindqvist' },
      { id: 'ov7', ws: 'RetailOps',    model: 'RetailOperations',  leadName: 'Janice Patel',    leadEmail: 'j.patel@contoso.com',    why: 'Retail-ops scorecard owner sits in HR-Data org (matrix reporting).', set: '2026-04-04', setBy: 'Sofia Lindqvist' },
    ],
    auditLog: [
      { date: '2026-05-15', who: 'Alex Rivera',     change: 'Set workspace default · Finance-Prod · Alex Rivera as Data lead' },
      { date: '2026-05-12', who: 'Marc Qureshi',    change: 'Reviewed workspace · Exec-Reports · no changes' },
      { date: '2026-05-09', who: 'Sofia Lindqvist', change: 'Reviewed workspace · Operations · stewards updated (+1)' },
      { date: '2026-04-19', who: 'Alex Rivera',     change: 'Override added · Revenue Forecast → Marc Qureshi' },
      { date: '2026-04-04', who: 'Sofia Lindqvist', change: 'Override added · RetailOperations → Janice Patel' },
      { date: '2026-04-02', who: 'Sofia Lindqvist', change: 'Override added · Mooring Dashboard → Karim Andersen' },
      { date: '2026-03-28', who: 'Alex Rivera',     change: 'Override added · Expense P&L → Priya Nair' },
      { date: '2026-03-11', who: 'Sofia Lindqvist', change: 'Override added · Management of Change → Tomas Heřmánek' },
    ],
    aadUsers: [
      { email: 'a.rivera@contoso.com',    name: 'Alex Rivera',      title: 'Director · Finance Data',  groups: ['sg-data-leads', 'sg-fin-data'] },
      { email: 'm.qureshi@contoso.com',   name: 'Marc Qureshi',     title: 'Senior BI engineer',       groups: ['sg-bi-stewards'] },
      { email: 's.lindqvist@contoso.com', name: 'Sofia Lindqvist',  title: 'Ops data lead',            groups: ['sg-data-leads', 'sg-ops'] },
      { email: 'k.andersen@contoso.com',  name: 'Karim Andersen',   title: 'CRM DBA',                  groups: ['sg-source-dbas'] },
      { email: 'j.patel@contoso.com',     name: 'Janice Patel',     title: 'HR analyst',               groups: ['sg-hr-data'] },
      { email: 'p.nguyen@contoso.com',    name: 'Peter Nguyen',     title: 'Marketing analyst',        groups: ['sg-marketing'] },
      { email: 'p.nair@contoso.com',      name: 'Priya Nair',       title: 'Sales BI lead',            groups: ['sg-data-leads', 'sg-sales'] },
      { email: 't.hermanek@contoso.com',  name: 'Tomas Heřmánek',   title: 'EMEA finance analyst',     groups: ['sg-bi-stewards', 'sg-sales-emea'] },
    ],

    /* v2 role taxonomy — Owner lives in workspaceDefaults + overrides;
       SME (singular) and Stewards (multi) live here keyed by model_id.
       Business Owner + Technical Owner deferred to v2 (per analysis doc). */
    rolesPerModel: [
      // Sales Analytics — full role coverage (showcase model)
      { modelId: 'sales-analytics', role: 'sme',     userEmail: 't.hermanek@contoso.com', set: '2026-05-08', setBy: 'Alex Rivera',     why: 'Tomas wrote the original revenue model in EMEA; reference SME for any LCY/FX question.' },
      { modelId: 'sales-analytics', role: 'steward', userEmail: 'm.qureshi@contoso.com',  set: '2026-05-08', setBy: 'Alex Rivera',     why: '' },
      { modelId: 'sales-analytics', role: 'steward', userEmail: 's.lindqvist@contoso.com',set: '2026-05-08', setBy: 'Alex Rivera',     why: '' },

      // Budget Planning — Owner inherits workspace, SME assigned, no stewards yet
      { modelId: 'budget-planning', role: 'sme',     userEmail: 'a.rivera@contoso.com',   set: '2026-04-30', setBy: 'Marc Qureshi',    why: '' },

      // Revenue Forecast — Owner overridden (already in `overrides`); + SME + 1 steward
      { modelId: 'rev-forecast',    role: 'sme',     userEmail: 'a.rivera@contoso.com',   set: '2026-04-22', setBy: 'Marc Qureshi',    why: 'Alex remains the SME even after handing day-to-day owner to Marc.' },
      { modelId: 'rev-forecast',    role: 'steward', userEmail: 't.hermanek@contoso.com', set: '2026-04-22', setBy: 'Marc Qureshi',    why: '' },

      // Operations Scorecard — large model, full coverage
      { modelId: 'ops-scorecard',   role: 'sme',     userEmail: 's.lindqvist@contoso.com',set: '2026-04-30', setBy: 'Karim Andersen',  why: '' },
      { modelId: 'ops-scorecard',   role: 'steward', userEmail: 'k.andersen@contoso.com', set: '2026-04-30', setBy: 'Karim Andersen',  why: '' },
      { modelId: 'ops-scorecard',   role: 'steward', userEmail: 't.hermanek@contoso.com', set: '2026-04-30', setBy: 'Karim Andersen',  why: '' },

      // RetailOperations — single steward
      { modelId: 'retail-ops',      role: 'steward', userEmail: 'j.patel@contoso.com',    set: '2026-04-04', setBy: 'Sofia Lindqvist', why: '' },

      // HR Headcount — SME only (audit-sensitive, dedicated SME)
      { modelId: 'hr-headcount',    role: 'sme',     userEmail: 'j.patel@contoso.com',    set: '2026-05-14', setBy: 'Janice Patel',    why: 'HR data lead is also the SME — same person.' },

      // Marketing Funnel — no roles assigned (orphan case)
      // Supply Chain Pipeline — no roles (UAT model, never scanned)
    ],

    /* Domain assignment per model — controlled vocabulary shared with glossary
       (DATA.glossary.domains). Defaults can be inferred from workspace naming
       but operator can override. */
    modelDomains: {
      'sales-analytics':  'sales',
      'budget-planning':  'finance',
      'kpi-dashboard':    'finance',
      'rev-forecast':     'finance',
      'expense-pnl':      'finance',
      'gl-balances':      'finance',
      'retail-ops':       'ops',
      'mgmt-change':      'compliance',
      'ops-scorecard':    'ops',
      'hr-headcount':     'hr',
      'marketing-funnel': 'marketing',
      // 'supply-pipeline': null  — intentionally unassigned
      // 'mooring-dash':    null
    },

    /* Per-report Owner overrides — only when a report's owner differs from
       its semantic model's owner (e.g. a downstream team built a thin report
       on a shared model). Stays on the same page as model overrides. */
    reportOverrides: [
      { id: 'ro1', reportName: 'Sales Pipeline Dashboard', reportKind: 'Report',    modelId: 'sales-analytics', modelName: 'Sales Analytics', ownerEmail: 'p.nair@contoso.com',  ownerName: 'Priya Nair',     why: 'Built by Sales-NA team after Alex shared the model. They own the dashboard; Alex still owns the underlying model.', set: '2026-04-12', setBy: 'Alex Rivera' },
      { id: 'ro2', reportName: 'CFO Daily Brief',          reportKind: 'Paginated', modelId: 'sales-analytics', modelName: 'Sales Analytics', ownerEmail: 'a.rivera@contoso.com',ownerName: 'Alex Rivera',    why: 'Owner of the model also explicitly owns this CFO-tier brief — separate sign-off responsibility.', set: '2026-03-20', setBy: 'Alex Rivera' },
      { id: 'ro3', reportName: 'EMEA Sales Scorecard',     reportKind: 'Report',    modelId: 'sales-analytics', modelName: 'Sales Analytics', ownerEmail: 't.hermanek@contoso.com', ownerName: 'Tomas Heřmánek', why: 'Built and maintained by EMEA team. Regional reporting requirements differ from the underlying model.', set: '2026-04-08', setBy: 'Alex Rivera' },
    ],

    /* AAD workspace permissions — for smart-suggest in role picker.
       In production this is fetched from Graph; mocked here. */
    workspacePermissions: {
      'Finance-Prod': [
        { email: 'a.rivera@contoso.com',   role: 'admin' },
        { email: 'm.qureshi@contoso.com',  role: 'admin' },
        { email: 'p.nair@contoso.com',     role: 'member' },
        { email: 't.hermanek@contoso.com', role: 'member' },
        { email: 'k.andersen@contoso.com', role: 'member' },
      ],
      'Operations': [
        { email: 's.lindqvist@contoso.com',role: 'admin' },
        { email: 't.hermanek@contoso.com', role: 'member' },
        { email: 'k.andersen@contoso.com', role: 'member' },
      ],
      'RetailOps': [
        { email: 's.lindqvist@contoso.com',role: 'admin' },
        { email: 'j.patel@contoso.com',    role: 'member' },
      ],
      'Ops-Score': [
        { email: 'k.andersen@contoso.com', role: 'admin' },
        { email: 's.lindqvist@contoso.com',role: 'member' },
        { email: 't.hermanek@contoso.com', role: 'member' },
      ],
      'Exec-Reports': [
        { email: 'm.qureshi@contoso.com',  role: 'admin' },
        { email: 'a.rivera@contoso.com',   role: 'member' },
      ],
      'Sales-NA': [
        { email: 'p.nair@contoso.com',     role: 'admin' },
        { email: 'a.rivera@contoso.com',   role: 'member' },
      ],
      'Sales-EMEA': [
        { email: 't.hermanek@contoso.com', role: 'admin' },
      ],
      'HR-Data': [
        { email: 'j.patel@contoso.com',    role: 'admin' },
      ],
      'Marketing': [
        { email: 'p.nguyen@contoso.com',   role: 'admin' },
      ],
      'Mobile-BI': [
        { email: 'm.qureshi@contoso.com',  role: 'admin' },
      ],
      'Supply-Chain': [],
      'Customer-Success': [],
    },

    /* Role taxonomy v1 — Owner + SME + Stewards (per analysis). Business
       Owner + Technical Owner deferred to v2. */
    roleCatalog: [
      { key: 'owner',    label: 'Owner',    tone: 'sky',     cardinality: 'one',  desc: 'Accountable for this artifact. First call for any source-of-truth question.', usedByDoc: 'Cover · Owner field (all audiences). Auditor sign-off.' },
      { key: 'sme',      label: 'SME',      tone: 'emerald', cardinality: 'one',  desc: 'Subject-matter expert. Answers questions; doesn\'t necessarily maintain.',     usedByDoc: 'Analyst doc · "Questions? Contact:" field. Falls back to Owner.' },
      { key: 'steward',  label: 'Stewards', tone: 'amber',   cardinality: 'many', desc: 'Reviews changes, approves new measures, monitors quality. Multiple allowed.', usedByDoc: 'Auditor doc · sign-off block (alongside Owner).' },
    ],
  },

  /* ───────────────────────────────────────────────────────────────────────
     GLOSSARY — manual data layer (tenant-wide single dictionary)
     Conventional shape per DAMA-DMBOK + Atlan/Collibra/Alation:
     term, definition, type, domain, status, owner, SME, source system,
     business-process URL, synonyms, related terms, sensitivity,
     last-reviewed / next-review, linked-to (mapped model objects).
     ─────────────────────────────────────────────────────────────────────── */
  glossary: {
    stats: {
      total:         53,
      approved:      45,
      proposed:       4,
      deprecated:     1,
      underReview:    3,
      domains:        7,
      stewards:       8,
      mappedTerms:   24,
      orphanTerms:   29,
      reviewOverdue:  6,
    },
    types: [
      { key: 'business',  label: 'Business term', tone: 'sky',     desc: 'A noun used in conversation' },
      { key: 'metric',    label: 'Metric',        tone: 'violet',  desc: 'A quantitative measure' },
      { key: 'kpi',       label: 'KPI',           tone: 'amber',   desc: 'A metric tied to a goal' },
      { key: 'dimension', label: 'Dimension',     tone: 'emerald', desc: 'A categorization or grouping' },
      { key: 'acronym',   label: 'Acronym',       tone: 'slate',   desc: 'Short-form of a longer term' },
      { key: 'process',   label: 'Process',       tone: 'rose',    desc: 'A business workflow or procedure' },
    ],
    domains: [
      { key: 'finance',   label: 'Finance' },
      { key: 'sales',     label: 'Sales' },
      { key: 'marketing', label: 'Marketing' },
      { key: 'ops',       label: 'Operations' },
      { key: 'hr',        label: 'HR' },
      { key: 'product',   label: 'Product' },
      { key: 'compliance',label: 'Compliance' },
    ],
    statuses: [
      { key: 'approved',     label: 'Approved',     tone: 'emerald' },
      { key: 'proposed',     label: 'Proposed',     tone: 'sky'     },
      { key: 'under-review', label: 'Under review', tone: 'amber'   },
      { key: 'deprecated',   label: 'Deprecated',   tone: 'slate'   },
    ],
    sensitivities: [
      { key: 'public',       label: 'Public',       tone: 'slate'   },
      { key: 'internal',     label: 'Internal',     tone: 'sky'     },
      { key: 'confidential', label: 'Confidential', tone: 'amber'   },
      { key: 'restricted',   label: 'Restricted',   tone: 'rose'    },
    ],
    items: [
      { id: 'g-lcy', term: 'LCY', type: 'acronym', domain: 'finance', status: 'approved', sensitivity: 'internal',
        definition: 'Local Currency. Revenue is stored in source-transaction currency; conversion to reporting currency happens in the report layer using daily exchange rates from finance.exchange_rates.',
        synonyms: ['Local currency', 'Source currency'],
        related: ['Fiscal Year', 'Exchange rate'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 't.hermanek@contoso.com',
        source: 'Finance policy CO-04 (currency handling)',
        processUrl: 'https://wiki.contoso.com/finance/currency-policy',
        linkedTo: { models: ['Sales Analytics', 'Revenue Forecast', 'Expense P&L'], measures: ['[Total Revenue (LCY)]', '[Revenue YTD (LCY)]', '[AOV (LCY)]'], columns: ['FactSales[NetAmountLCY]', 'FactSales[CostLCY]', 'FactSales[UnitPrice]'], tables: [] },
        lastReviewed: '2026-04-30', nextReview: '2026-07-30',
      },
      { id: 'g-aov', term: 'AOV', type: 'metric', domain: 'sales', status: 'approved', sensitivity: 'internal',
        definition: 'Average Order Value. Computed as total revenue (LCY) divided by the distinct count of SalesKey within the active filter context. Used to compare segments, channels, and periods on a per-order basis.',
        synonyms: ['Average order value', 'Order ticket'],
        related: ['Total Revenue (LCY)', 'Top 10 Customers Share %'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Sales Analytics measure folder · Customers',
        processUrl: 'https://wiki.contoso.com/sales/aov-definition',
        linkedTo: { models: ['Sales Analytics'], measures: ['[AOV (LCY)]', 'Avg Order Value'] },
        lastReviewed: '2026-04-22', nextReview: '2026-07-22',
      },
      { id: 'g-nrr', term: 'NRR', type: 'kpi', domain: 'sales', status: 'approved', sensitivity: 'confidential',
        definition: 'Net Revenue Retention. Revenue from a prior-year cohort, evaluated 12 months later, divided by their original revenue. Excludes new logo revenue. The board KPI; reported quarterly.',
        synonyms: ['Net dollar retention', 'NDR'],
        related: ['AOV', 'Active Customers (90d)', 'Churn rate'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Board-approved KPI · 2026 plan',
        processUrl: 'https://wiki.contoso.com/exec/2026-okrs',
        linkedTo: { models: ['Sales Analytics'], measures: ['[Net Revenue Retention %]'] },
        lastReviewed: '2026-05-02', nextReview: '2026-08-02',
      },
      { id: 'g-fy', term: 'Fiscal Year', type: 'business', domain: 'finance', status: 'approved', sensitivity: 'public',
        definition: 'The Contoso fiscal year runs from Jul 1 through Jun 30 of the following calendar year. Reflected in DimDate[FiscalYear]. Reporting periods (Q1–Q4) align with the fiscal calendar, NOT the calendar year.',
        synonyms: ['FY', 'Financial year'],
        related: ['LCY', 'Quarter'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Finance policy CO-01',
        processUrl: 'https://wiki.contoso.com/finance/fiscal-calendar',
        linkedTo: { models: ['Sales Analytics', 'Budget Planning', 'Revenue Forecast'], measures: [], columns: ['DimDate[FiscalYear]', 'DimDate[CalQuarter]'], tables: ['DimDate'] },
        lastReviewed: '2026-03-15', nextReview: '2026-06-15',
      },
      { id: 'g-seg', term: 'Customer segment', type: 'dimension', domain: 'sales', status: 'approved', sensitivity: 'internal',
        definition: 'Customer size classification: SMB (< $1M ARR), Mid-Market ($1M – $10M), Enterprise ($10M+). Assigned at customer creation and re-evaluated annually. Stored on DimCustomer[Segment].',
        synonyms: ['Segment', 'Customer tier'],
        related: ['ARR', 'Top 10 Customers'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Sales playbook · segment policy',
        processUrl: 'https://wiki.contoso.com/sales/segment-policy',
        linkedTo: { models: ['Sales Analytics'], measures: ['[Top 10 Customers Share %]'], columns: ['DimCustomer[Segment]', 'DimCustomer[TierCode]'], tables: ['DimCustomer'] },
        lastReviewed: '2026-05-08', nextReview: '2026-08-08',
      },
      { id: 'g-gm',  term: 'Gross margin', type: 'metric', domain: 'finance', status: 'approved', sensitivity: 'confidential',
        definition: 'Revenue minus cost of goods sold (COGS), expressed as a share of revenue. Computed at the line level (per-row Quantity × UnitPrice × (1 − DiscountPct) − CostLCY). Reported monthly to the CFO.',
        synonyms: ['GM', 'GM%', 'Margin'],
        related: ['LCY', 'Revenue'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Finance policy CO-08',
        processUrl: 'https://wiki.contoso.com/finance/gross-margin',
        linkedTo: { models: ['Sales Analytics', 'Expense P&L'], measures: ['[Gross Margin %]', 'Gross Margin'] },
        lastReviewed: '2026-05-12', nextReview: '2026-08-12',
      },
      { id: 'g-mcd', term: 'Management of Change', type: 'process', domain: 'compliance', status: 'approved', sensitivity: 'internal',
        definition: 'Formal review workflow for any change to a production asset (model, report, dataset). Requires sign-off from the data lead and BI steward before deployment. Tracked in the Management of Change semantic model.',
        synonyms: ['MoC', 'Change management'],
        related: ['Audit', 'RLS'],
        ownerEmail: 's.lindqvist@contoso.com', smeEmail: 't.hermanek@contoso.com',
        source: 'Compliance runbook 2026-Q1',
        processUrl: 'https://wiki.contoso.com/compliance/moc-process',
        linkedTo: { models: ['Management of Change', 'Sales Analytics', 'Budget Planning', 'GL Balances'], measures: [], columns: [], tables: [] },
        lastReviewed: '2026-04-10', nextReview: '2026-07-10',
      },
      { id: 'g-rls', term: 'RLS', type: 'acronym', domain: 'compliance', status: 'approved', sensitivity: 'internal',
        definition: 'Row-Level Security. DAX-based row filters applied at query time. Scopes data per user/group membership. Evaluated against the caller\'s AAD group membership using USERPRINCIPALNAME().',
        synonyms: ['Row-level security'],
        related: ['Sensitivity label', 'OLS'],
        ownerEmail: 's.lindqvist@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Security policy SEC-12',
        processUrl: 'https://wiki.contoso.com/security/rls-policy',
        linkedTo: { models: ['Sales Analytics', 'HR Headcount', 'Operations Scorecard'], measures: [], columns: ['FactSales[GeographyKey]', 'DimCustomer[Segment]'], tables: ['DimGeography', 'DimCustomer'] },
        lastReviewed: '2026-03-22', nextReview: '2026-06-22',
      },
      { id: 'g-cu',  term: 'CU', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Capacity Unit. The atomic billing unit for Microsoft Fabric. 1 CU ≈ 1 vCore-second of compute. F-SKU tiers determine your CU budget per hour (F2 = 2 CU/s, F2048 = 2048 CU/s).',
        synonyms: ['Capacity unit', 'Compute unit'],
        related: ['F-SKU', 'Throttling'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'MS Fabric documentation',
        processUrl: 'https://learn.microsoft.com/fabric/enterprise/licenses',
        linkedTo: { models: [], measures: [] },
        lastReviewed: '2026-05-01', nextReview: '2026-08-01',
      },
      { id: 'g-ac', term: 'Active Customers', type: 'metric', domain: 'sales', status: 'under-review', sensitivity: 'internal',
        definition: 'Distinct customers with at least one purchase in a rolling time window. Default window: 90 days. Under review: should this include trial-stage customers? Current definition excludes.',
        synonyms: ['Active accounts'],
        related: ['NRR', 'AOV'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Sales BI proposal · 2026-04',
        processUrl: 'https://wiki.contoso.com/sales/active-customer-rfc',
        linkedTo: { models: ['Sales Analytics'], measures: ['[Active Customers (90d)]'] },
        lastReviewed: '2026-04-28', nextReview: '2026-05-28',
      },
      { id: 'g-mrr', term: 'MRR', type: 'kpi', domain: 'finance', status: 'proposed', sensitivity: 'confidential',
        definition: 'Monthly Recurring Revenue. Proposed metric for subscription portion of revenue. Not yet wired into Sales Analytics — pending product split decision (Q3 2026).',
        synonyms: ['Monthly recurring revenue'],
        related: ['ARR', 'NRR'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Finance proposal · 2026-Q2',
        processUrl: 'https://wiki.contoso.com/finance/mrr-rfc',
        linkedTo: { models: [], measures: [] },
        lastReviewed: '2026-05-04', nextReview: '2026-08-04',
      },
      { id: 'g-cs',  term: 'Cost share', type: 'metric', domain: 'finance', status: 'approved', sensitivity: 'internal',
        definition: 'A workspace\'s share of total Fabric capacity cost over the period. Computed from cost_observations_v2 grouped by workspace_id.',
        synonyms: ['Cost attribution', 'Bill share'],
        related: ['CU', 'F-SKU'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'FinOps runbook 2026',
        processUrl: 'https://wiki.contoso.com/finops/cost-share',
        linkedTo: { models: [], measures: [] },
        lastReviewed: '2026-05-06', nextReview: '2026-08-06',
      },
      { id: 'g-hc',  term: 'Headcount', type: 'dimension', domain: 'hr', status: 'deprecated', sensitivity: 'confidential',
        definition: '[DEPRECATED 2026-04] Use "Active FTEs" instead. Original definition was ambiguous on contractors. See HR Headcount model for current logic.',
        synonyms: ['HC'],
        related: ['FTE', 'Contractor'],
        ownerEmail: 'j.patel@contoso.com', smeEmail: 'j.patel@contoso.com',
        source: '— deprecated —',
        processUrl: 'https://wiki.contoso.com/hr/headcount-deprecated',
        linkedTo: { models: ['HR Headcount'], measures: [] },
        lastReviewed: '2026-04-15', nextReview: null,
      },

      /* ── A–Z populate · 2026-05-19 (so the A–Z dictionary view has real
         density across every letter for testing). All Fabric/BI-flavored,
         most approved, sensible defaults; rotated owners across 8 AAD users. */

      // A
      { id: 'g-acid', term: 'ACID', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Atomicity, Consistency, Isolation, Durability. The four properties of a reliable database transaction. Delta-tables in Fabric Lakehouse guarantee ACID semantics.',
        synonyms: [], related: ['Lakehouse'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'k.andersen@contoso.com',
        source: 'Database fundamentals', processUrl: 'https://en.wikipedia.org/wiki/ACID',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-12', nextReview: '2026-09-12' },
      { id: 'g-arr', term: 'ARR', type: 'kpi', domain: 'finance', status: 'approved', sensitivity: 'confidential',
        definition: 'Annual Recurring Revenue. Normalized recurring portion of revenue projected to 12 months. Excludes one-time fees, professional services, and usage overages.',
        synonyms: ['Annualized recurring revenue'], related: ['MRR', 'NRR'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Board-approved KPI · 2026 plan', processUrl: 'https://wiki.contoso.com/finance/arr',
        linkedTo: { models: ['Sales Analytics', 'Revenue Forecast'], measures: [] }, lastReviewed: '2026-05-02', nextReview: '2026-08-02' },

      // B
      { id: 'g-bpa', term: 'BPA', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Best Practice Analyzer. Tabular Editor\'s rule engine that flags model anti-patterns (calc-col bloat, missing summarize-by, etc). LP runs a built-in BPA pass as part of the Health score.',
        synonyms: [], related: ['DAX', 'VertiPaq'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Tabular Editor docs', processUrl: 'https://docs.tabulareditor.com/te2/Best-Practice-Analyzer.html',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-18', nextReview: '2026-10-18' },
      { id: 'g-bv',  term: 'Budget Variance', type: 'metric', domain: 'finance', status: 'approved', sensitivity: 'confidential',
        definition: 'Actual minus planned for a given period. Reported on the Budget Planning model. Positive = over-budget; negative = under.',
        synonyms: ['Variance to budget'], related: ['Fiscal Year', 'P&L'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Finance close runbook', processUrl: 'https://wiki.contoso.com/finance/budget-variance',
        linkedTo: { models: ['Budget Planning'], measures: ['[Budget Variance]'] }, lastReviewed: '2026-04-30', nextReview: '2026-07-30' },

      // C
      { id: 'g-cac', term: 'CAC', type: 'metric', domain: 'sales', status: 'approved', sensitivity: 'confidential',
        definition: 'Customer Acquisition Cost. Total sales + marketing spend divided by net new customers in the period. Pairs with LTV for unit economics.',
        synonyms: ['Acquisition cost'], related: ['LTV', 'Churn rate'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nguyen@contoso.com',
        source: 'GTM unit economics policy', processUrl: 'https://wiki.contoso.com/sales/cac',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-12', nextReview: '2026-07-12' },
      { id: 'g-churn', term: 'Churn rate', type: 'kpi', domain: 'sales', status: 'approved', sensitivity: 'confidential',
        definition: 'Percentage of customers who did not renew within the renewal window. Calculated cohort-weighted; published monthly.',
        synonyms: ['Logo churn'], related: ['Retention rate', 'NRR'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Customer-Success runbook', processUrl: 'https://wiki.contoso.com/sales/churn',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-05-08', nextReview: '2026-08-08' },
      { id: 'g-cc',  term: 'Calculated column', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'A column whose value is computed at refresh time via DAX. Evaluated row-by-row and persisted in the model — bloats memory if used heavily. Prefer Power Query when possible.',
        synonyms: ['Calc column'], related: ['DAX', 'VertiPaq', 'Measure'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'BI modeling guide', processUrl: 'https://wiki.contoso.com/bi/calc-columns',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-02', nextReview: '2026-10-02' },

      // D
      { id: 'g-dax', term: 'DAX', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Data Analysis Expressions. The formula language for Power BI semantic models. Used for measures, calculated columns, RLS filters, and query-time aggregations.',
        synonyms: [], related: ['Measure', 'RLS', 'TMDL'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Microsoft docs', processUrl: 'https://learn.microsoft.com/dax',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-30', nextReview: '2026-09-30' },
      { id: 'g-dau', term: 'DAU', type: 'metric', domain: 'product', status: 'approved', sensitivity: 'internal',
        definition: 'Daily Active Users. Distinct users who took at least one tracked action in the day. Aggregated from activity_events.',
        synonyms: ['Daily actives'], related: ['MAU', 'WAU', 'Stickiness'],
        ownerEmail: 'p.nguyen@contoso.com', smeEmail: 'p.nguyen@contoso.com',
        source: 'Product analytics playbook', processUrl: 'https://wiki.contoso.com/product/dau',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-05-04', nextReview: '2026-08-04' },
      { id: 'g-df2', term: 'Dataflow Gen2', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'Fabric\'s Power Query-based ELT pipeline. Outputs to Lakehouse, Warehouse, or KQL DB. Distinct from Dataflow Gen1 (Power BI service-scoped).',
        synonyms: ['DFG2'], related: ['Lakehouse', 'ETL'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Fabric docs', processUrl: 'https://learn.microsoft.com/fabric/data-factory/dataflows-gen2',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-10', nextReview: '2026-10-10' },

      // E
      { id: 'g-etl', term: 'ETL', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Extract, Transform, Load. The classic data-integration pattern. In Fabric, typically realized via Pipelines + Dataflow Gen2 + Notebooks against Lakehouse.',
        synonyms: ['ELT (variant)'], related: ['Dataflow Gen2', 'Lakehouse'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'k.andersen@contoso.com',
        source: 'Data engineering basics', processUrl: 'https://en.wikipedia.org/wiki/Extract,_transform,_load',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-20', nextReview: '2026-09-20' },
      { id: 'g-erd', term: 'ER diagram', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Entity-Relationship diagram. Visual representation of tables and how they join. Auto-generated by LP from the model lineage graph.',
        synonyms: ['Schema diagram'], related: ['Star schema', 'Semantic model'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Modeling fundamentals', processUrl: 'https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-02-28', nextReview: '2026-08-28' },

      // F
      { id: 'g-fsku', term: 'F-SKU', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Fabric SKU. The capacity-tier identifier (F2 through F2048) that sets your CU budget per second and monthly price. F-SKUs can be paused, scaled, and reserved.',
        synonyms: ['Fabric capacity SKU'], related: ['CU', 'HWM'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'MS Fabric licensing docs', processUrl: 'https://learn.microsoft.com/fabric/enterprise/licenses',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-05-01', nextReview: '2026-08-01' },
      { id: 'g-fact', term: 'Fact table', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'A table that stores quantitative measurements at a chosen grain (e.g. sales order line, daily snapshot). Joined to dimension tables in a star schema.',
        synonyms: [], related: ['Star schema', 'Semantic model'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Kimball methodology', processUrl: 'https://wiki.contoso.com/bi/star-schema',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-03-18', nextReview: '2026-09-18' },
      { id: 'g-fte', term: 'FTE', type: 'acronym', domain: 'hr', status: 'approved', sensitivity: 'confidential',
        definition: 'Full-Time Equivalent. Headcount normalized to full-time hours; part-timers and contractors counted as fractions of an FTE. Replaces the deprecated "Headcount" measure.',
        synonyms: ['Full-time equivalent'], related: ['Headcount'],
        ownerEmail: 'j.patel@contoso.com', smeEmail: 'j.patel@contoso.com',
        source: 'HR policy HR-12', processUrl: 'https://wiki.contoso.com/hr/fte-policy',
        linkedTo: { models: ['HR Headcount'], measures: ['[Active FTEs]'] }, lastReviewed: '2026-05-14', nextReview: '2026-08-14' },

      // G
      { id: 'g-gmv', term: 'GMV', type: 'kpi', domain: 'sales', status: 'approved', sensitivity: 'confidential',
        definition: 'Gross Merchandise Value. Total transaction volume before discounts, returns, refunds, or platform fees. Top-of-funnel scale signal.',
        synonyms: ['Gross volume'], related: ['Total Revenue', 'AOV'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Marketplace metrics policy', processUrl: 'https://wiki.contoso.com/sales/gmv',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-04-22', nextReview: '2026-07-22' },
      { id: 'g-gr',  term: 'Governance review', type: 'process', domain: 'compliance', status: 'approved', sensitivity: 'internal',
        definition: 'Quarterly sweep of tenant settings, RLS rules, sensitivity labels, and ownership assignments for compliance drift. Owned by compliance team; LP auto-flags drift between reviews.',
        synonyms: ['Compliance sweep'], related: ['Tenant settings', 'RLS', 'SOC 2'],
        ownerEmail: 's.lindqvist@contoso.com', smeEmail: 't.hermanek@contoso.com',
        source: 'Compliance runbook 2026', processUrl: 'https://wiki.contoso.com/compliance/quarterly-review',
        linkedTo: { models: ['Sales Analytics', 'HR Headcount', 'Operations Scorecard', 'Budget Planning', 'GL Balances'], measures: [], columns: [], tables: [] }, lastReviewed: '2026-04-15', nextReview: '2026-07-15' },

      // H
      { id: 'g-hwm', term: 'HWM', type: 'acronym', domain: 'ops', status: 'proposed', sensitivity: 'internal',
        definition: 'High Water Mark. The peak CU usage in a billing window. Drives F-SKU sizing decisions and throttling-risk scoring.',
        synonyms: ['Peak CU'], related: ['CU', 'F-SKU'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'FinOps proposal · 2026-Q2', processUrl: 'https://wiki.contoso.com/finops/hwm-rfc',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-05-05', nextReview: '2026-08-05' },

      // I
      { id: 'g-icp', term: 'ICP', type: 'acronym', domain: 'sales', status: 'approved', sensitivity: 'internal',
        definition: 'Ideal Customer Profile. The segment that fits best on product-market-fit + lifetime value. Marketing targets, sales qualifies, success retains against ICP.',
        synonyms: ['Target profile'], related: ['CAC', 'LTV'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nguyen@contoso.com',
        source: 'GTM playbook 2026', processUrl: 'https://wiki.contoso.com/sales/icp',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-25', nextReview: '2026-09-25' },
      { id: 'g-incr', term: 'Incremental refresh', type: 'process', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'Refresh strategy that loads only changed partitions. Reduces refresh time and CU cost; required for tables >10M rows.',
        synonyms: ['Incremental policy'], related: ['Partition', 'Refreshable'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Refresh runbook', processUrl: 'https://wiki.contoso.com/bi/incremental-refresh',
        linkedTo: { models: ['Sales Analytics', 'Budget Planning'], measures: [] }, lastReviewed: '2026-04-08', nextReview: '2026-10-08' },

      // J
      { id: 'g-join', term: 'JOIN', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'A SQL clause that combines rows from two tables based on a related column. Six types: INNER, LEFT, RIGHT, FULL, CROSS, SELF.',
        synonyms: [], related: ['ER diagram', 'Star schema'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'k.andersen@contoso.com',
        source: 'SQL fundamentals', processUrl: 'https://en.wikipedia.org/wiki/Join_(SQL)',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-02-15', nextReview: '2026-08-15' },

      // K
      { id: 'g-kpi', term: 'KPI', type: 'acronym', domain: 'finance', status: 'approved', sensitivity: 'public',
        definition: 'Key Performance Indicator. A metric explicitly tied to a business goal. Subset of all metrics — every KPI is a metric but not vice versa.',
        synonyms: [], related: ['NRR', 'NPS', 'GMV'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Strategy glossary', processUrl: 'https://wiki.contoso.com/strategy/kpis',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-10', nextReview: '2026-09-10' },

      // L
      { id: 'g-ltv', term: 'LTV', type: 'metric', domain: 'sales', status: 'approved', sensitivity: 'confidential',
        definition: 'Customer Lifetime Value. Net revenue expected from a customer over their entire relationship. Used with CAC; healthy ratio is LTV : CAC ≥ 3 : 1.',
        synonyms: ['Lifetime value', 'CLV'], related: ['CAC', 'NRR'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Unit economics policy', processUrl: 'https://wiki.contoso.com/sales/ltv',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-25', nextReview: '2026-07-25' },
      { id: 'g-lake', term: 'Lakehouse', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Fabric\'s unified storage that supports both Delta-table semantics (warehouse-style queries) and file-based access (lake-style scanning). One copy, two interfaces.',
        synonyms: [], related: ['ACID', 'Dataflow Gen2'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'k.andersen@contoso.com',
        source: 'MS Fabric docs', processUrl: 'https://learn.microsoft.com/fabric/data-engineering/lakehouse-overview',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-04-12', nextReview: '2026-10-12' },

      // M
      { id: 'g-mau', term: 'MAU', type: 'metric', domain: 'product', status: 'approved', sensitivity: 'internal',
        definition: 'Monthly Active Users. Distinct users with at least one tracked action in the calendar month. The classic engagement metric.',
        synonyms: ['Monthly actives'], related: ['DAU', 'WAU', 'Stickiness'],
        ownerEmail: 'p.nguyen@contoso.com', smeEmail: 'p.nguyen@contoso.com',
        source: 'Product analytics playbook', processUrl: 'https://wiki.contoso.com/product/mau',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-05-04', nextReview: '2026-08-04' },
      { id: 'g-mom', term: 'MoM', type: 'metric', domain: 'finance', status: 'approved', sensitivity: 'internal',
        definition: 'Month-over-Month growth. Current month divided by prior month. Companion to YoY for shorter-cycle volatility.',
        synonyms: ['Month-on-month'], related: ['YoY', 'QoQ', 'WoW'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Finance reporting standards', processUrl: 'https://wiki.contoso.com/finance/period-comparison',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-05', nextReview: '2026-09-05' },
      { id: 'g-measure', term: 'Measure', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'A DAX expression evaluated in the filter context of a visual or query. Numeric output by default. Distinct from calculated columns (which materialize on the table at refresh).',
        synonyms: [], related: ['DAX', 'Calculated column'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'BI modeling guide', processUrl: 'https://wiki.contoso.com/bi/measures',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-04-01', nextReview: '2026-10-01' },

      // N
      { id: 'g-nps', term: 'NPS', type: 'kpi', domain: 'product', status: 'approved', sensitivity: 'internal',
        definition: 'Net Promoter Score. Percentage of promoters (9-10) minus percentage of detractors (0-6) on the 0-10 "likelihood to recommend" survey. Sampled quarterly.',
        synonyms: [], related: ['Churn rate'],
        ownerEmail: 'p.nguyen@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'CX research protocol', processUrl: 'https://wiki.contoso.com/cx/nps-methodology',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-18', nextReview: '2026-07-18' },
      { id: 'g-ns',  term: 'North Star metric', type: 'kpi', domain: 'product', status: 'under-review', sensitivity: 'confidential',
        definition: 'The single metric that best captures the value the product delivers. Currently proposed: weekly active customers running an automated workflow. Under review pending Q3 board input.',
        synonyms: ['North star'], related: ['DAU', 'MAU'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'p.nguyen@contoso.com',
        source: 'Strategy memo · 2026-Q2', processUrl: 'https://wiki.contoso.com/strategy/north-star-rfc',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-05-10', nextReview: '2026-07-10' },

      // O
      { id: 'g-olap', term: 'OLAP', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Online Analytical Processing. Workload pattern of complex multi-dimensional aggregations against historical data. Power BI tabular models are an OLAP engine.',
        synonyms: [], related: ['OLTP', 'Semantic model'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'k.andersen@contoso.com',
        source: 'Data warehousing fundamentals', processUrl: 'https://en.wikipedia.org/wiki/Online_analytical_processing',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-02-22', nextReview: '2026-08-22' },
      { id: 'g-ols', term: 'OLS', type: 'acronym', domain: 'compliance', status: 'approved', sensitivity: 'internal',
        definition: 'Object-Level Security. Power BI feature that hides entire columns or tables from users based on role membership. DAX-less alternative to RLS for column-level secrets.',
        synonyms: ['Object-level security'], related: ['RLS', 'Sensitivity label'],
        ownerEmail: 's.lindqvist@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Security policy SEC-13', processUrl: 'https://wiki.contoso.com/security/ols-policy',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-28', nextReview: '2026-09-28' },
      { id: 'g-okr', term: 'OKR', type: 'process', domain: 'product', status: 'approved', sensitivity: 'internal',
        definition: 'Objectives and Key Results. Quarterly goal-setting framework with ~3 objectives per team and 3-5 measurable KRs each. Reviewed monthly; scored at quarter-end.',
        synonyms: ['Objectives & KRs'], related: ['KPI', 'QBR'],
        ownerEmail: 'p.nguyen@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Operating cadence playbook', processUrl: 'https://wiki.contoso.com/ops/okrs',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-20', nextReview: '2026-07-20' },

      // P
      { id: 'g-pl',  term: 'P&L', type: 'acronym', domain: 'finance', status: 'approved', sensitivity: 'confidential',
        definition: 'Profit and Loss statement. Revenue minus COGS minus operating expenses. Published monthly to the CFO; the source of EBITDA and operating margin.',
        synonyms: ['Income statement', 'PnL'], related: ['Budget Variance', 'Gross margin'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Finance reporting standards', processUrl: 'https://wiki.contoso.com/finance/p-and-l',
        linkedTo: { models: ['Expense P&L'], measures: [] }, lastReviewed: '2026-05-12', nextReview: '2026-08-12' },
      { id: 'g-part', term: 'Partition', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'A logical slice of a table\'s data (typically by date). Drives incremental refresh and storage optimization. Power BI processes partitions independently.',
        synonyms: [], related: ['Incremental refresh', 'Fact table'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Modeling fundamentals', processUrl: 'https://wiki.contoso.com/bi/partitions',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-03-15', nextReview: '2026-09-15' },

      // Q
      { id: 'g-qbr', term: 'QBR', type: 'process', domain: 'sales', status: 'approved', sensitivity: 'internal',
        definition: 'Quarterly Business Review. A 90-day cadence customer-success meeting w/ data-driven progress recap. Partners use LP\'s Documents output as the deck source.',
        synonyms: ['Quarterly review'], related: ['OKR', 'NRR'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Customer success runbook', processUrl: 'https://wiki.contoso.com/cs/qbr-cadence',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-05-08', nextReview: '2026-08-08' },
      { id: 'g-qoq', term: 'QoQ', type: 'metric', domain: 'finance', status: 'approved', sensitivity: 'internal',
        definition: 'Quarter-over-Quarter growth. Current quarter divided by prior quarter. Companion to YoY for seasonality-aware comparisons.',
        synonyms: ['Quarter-on-quarter'], related: ['YoY', 'MoM'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Finance reporting standards', processUrl: 'https://wiki.contoso.com/finance/period-comparison',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-05', nextReview: '2026-09-05' },

      // R
      { id: 'g-refr', term: 'Refreshable', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'A semantic model or dataflow that can be scheduled for periodic refresh. Surfaced via /admin/capacities/refreshables in the Fabric Admin API.',
        synonyms: [], related: ['Incremental refresh', 'Semantic model'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'k.andersen@contoso.com',
        source: 'Fabric Admin API docs', processUrl: 'https://learn.microsoft.com/rest/api/power-bi/admin/get-refreshables',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-05', nextReview: '2026-10-05' },
      { id: 'g-ret', term: 'Retention rate', type: 'kpi', domain: 'sales', status: 'approved', sensitivity: 'confidential',
        definition: 'Inverse of churn rate. Percentage of customers from a prior cohort who renewed or extended. Customer-Success leading indicator.',
        synonyms: ['Renewal rate'], related: ['Churn rate', 'NRR'],
        ownerEmail: 'p.nair@contoso.com', smeEmail: 'p.nair@contoso.com',
        source: 'Customer-Success policy', processUrl: 'https://wiki.contoso.com/cs/retention',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-05-08', nextReview: '2026-08-08' },
      { id: 'g-roas', term: 'ROAS', type: 'metric', domain: 'marketing', status: 'approved', sensitivity: 'internal',
        definition: 'Return on Ad Spend. Revenue attributable to ads divided by ad spend in the same period. Used to budget paid acquisition.',
        synonyms: [], related: ['CAC'],
        ownerEmail: 'p.nguyen@contoso.com', smeEmail: 'p.nguyen@contoso.com',
        source: 'Marketing analytics handbook', processUrl: 'https://wiki.contoso.com/marketing/roas',
        linkedTo: { models: ['Marketing Funnel'], measures: [] }, lastReviewed: '2026-04-30', nextReview: '2026-07-30' },

      // S
      { id: 'g-sem', term: 'Semantic model', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Power BI\'s modeled view of joined tables, columns, measures, and relationships. The canonical unit of LP governance — ownership and documentation attach here.',
        synonyms: ['Tabular model', 'Power BI dataset'], related: ['Star schema', 'Measure'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'MS Fabric docs', processUrl: 'https://learn.microsoft.com/power-bi/connect-data/service-datasets-understand',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-15', nextReview: '2026-10-15' },
      { id: 'g-star', term: 'Star schema', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Dimensional model pattern: one fact table at the center, dimension tables surrounding. Optimized for analytics queries; the recommended Power BI shape.',
        synonyms: [], related: ['Fact table', 'ER diagram'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'a.rivera@contoso.com',
        source: 'Kimball methodology', processUrl: 'https://wiki.contoso.com/bi/star-schema',
        linkedTo: { models: ['Sales Analytics'], measures: [] }, lastReviewed: '2026-03-18', nextReview: '2026-09-18' },
      { id: 'g-soc2', term: 'SOC 2', type: 'acronym', domain: 'compliance', status: 'approved', sensitivity: 'confidential',
        definition: 'Service Organization Controls 2. Auditing standard for software service providers covering security, availability, processing integrity, confidentiality, and privacy.',
        synonyms: ['SOC2'], related: ['Governance review', 'RLS'],
        ownerEmail: 's.lindqvist@contoso.com', smeEmail: 't.hermanek@contoso.com',
        source: 'AICPA SOC 2 framework', processUrl: 'https://wiki.contoso.com/compliance/soc2',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-10', nextReview: '2026-07-10' },

      // T
      { id: 'g-tmdl', term: 'TMDL', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Tabular Model Definition Language. Microsoft\'s human-readable DSL for serializing Power BI semantic models. Git-friendly alternative to the JSON-based .bim format.',
        synonyms: [], related: ['DAX', 'Semantic model'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'MS docs', processUrl: 'https://learn.microsoft.com/analysis-services/tmdl/tmdl-overview',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-02', nextReview: '2026-10-02' },
      { id: 'g-tset', term: 'Tenant settings', type: 'business', domain: 'compliance', status: 'approved', sensitivity: 'internal',
        definition: '200+ admin-portal toggles that govern Fabric tenant-wide behavior — external sharing, custom visuals, R/Python visuals, etc. Captured nightly by LP.',
        synonyms: ['Admin settings'], related: ['Governance review', 'SOC 2'],
        ownerEmail: 's.lindqvist@contoso.com', smeEmail: 't.hermanek@contoso.com',
        source: 'Fabric admin portal', processUrl: 'https://wiki.contoso.com/compliance/tenant-settings',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-05-12', nextReview: '2026-08-12' },

      // U
      { id: 'g-upn', term: 'UPN', type: 'acronym', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'User Principal Name. The AAD-format login name (often the user\'s email). Used in activity events and RLS rules via USERPRINCIPALNAME().',
        synonyms: [], related: ['RLS'],
        ownerEmail: 'k.andersen@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Microsoft Entra ID docs', processUrl: 'https://learn.microsoft.com/entra/identity/hybrid/connect/plan-connect-userprincipalname',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-12', nextReview: '2026-09-12' },

      // V
      { id: 'g-vp',  term: 'VertiPaq', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'The columnar in-memory storage engine for Power BI tabular models. Compresses by column for fast scans; explains why Power BI is so much faster than row-store databases.',
        synonyms: ['xVelocity engine'], related: ['DAX', 'Semantic model'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'k.andersen@contoso.com',
        source: 'MS Analysis Services docs', processUrl: 'https://learn.microsoft.com/analysis-services/tabular-models/in-memory-mode-tabular',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-22', nextReview: '2026-10-22' },

      // W
      { id: 'g-wsp', term: 'Workspace', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'public',
        definition: 'Fabric\'s logical grouping for content. Has admin/member/contributor/viewer permissions and a capacity assignment. LP\'s default unit for ownership inheritance.',
        synonyms: [], related: ['Semantic model', 'F-SKU'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'MS Fabric docs', processUrl: 'https://learn.microsoft.com/fabric/get-started/workspaces',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-18', nextReview: '2026-10-18' },
      { id: 'g-wow', term: 'WoW', type: 'metric', domain: 'marketing', status: 'approved', sensitivity: 'internal',
        definition: 'Week-over-Week growth. Current week divided by prior week. Useful for high-frequency marketing/product metrics where MoM is too lagged.',
        synonyms: ['Week-on-week'], related: ['MoM', 'YoY', 'QoQ'],
        ownerEmail: 'p.nguyen@contoso.com', smeEmail: 'p.nguyen@contoso.com',
        source: 'Marketing analytics handbook', processUrl: 'https://wiki.contoso.com/marketing/period-comparison',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-05', nextReview: '2026-09-05' },

      // X
      { id: 'g-xmla', term: 'XMLA endpoint', type: 'business', domain: 'ops', status: 'approved', sensitivity: 'internal',
        definition: 'Read/write protocol endpoint for Power BI semantic models. Used by Tabular Editor, ALM Toolkit, and other tools to author/inspect models. Premium-tier feature.',
        synonyms: ['XMLA r/w'], related: ['TMDL', 'Semantic model'],
        ownerEmail: 'm.qureshi@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'MS docs', processUrl: 'https://learn.microsoft.com/power-bi/enterprise/service-premium-connect-tools',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-04-02', nextReview: '2026-10-02' },

      // Y
      { id: 'g-ytd', term: 'YTD', type: 'acronym', domain: 'finance', status: 'approved', sensitivity: 'public',
        definition: 'Year-to-Date. The period from the first day of the current fiscal year through today. Used as a CALCULATE filter in DAX via DATESYTD().',
        synonyms: [], related: ['YoY', 'Fiscal Year', 'MoM'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'DAX time-intelligence reference', processUrl: 'https://learn.microsoft.com/dax/datesytd-function-dax',
        linkedTo: { models: ['Sales Analytics'], measures: ['[Revenue YTD (LCY)]', 'YTD Revenue', 'MTD Revenue'] }, lastReviewed: '2026-04-30', nextReview: '2026-07-30' },
      { id: 'g-yoy', term: 'YoY', type: 'metric', domain: 'finance', status: 'approved', sensitivity: 'internal',
        definition: 'Year-over-Year growth. Current period divided by the same period one year ago. The standard "is the business growing" metric.',
        synonyms: ['Year-on-year'], related: ['YTD', 'QoQ', 'MoM'],
        ownerEmail: 'a.rivera@contoso.com', smeEmail: 'm.qureshi@contoso.com',
        source: 'Finance reporting standards', processUrl: 'https://wiki.contoso.com/finance/period-comparison',
        linkedTo: { models: ['Sales Analytics'], measures: ['[Total Revenue YoY %]', 'Sales Growth %'] }, lastReviewed: '2026-04-30', nextReview: '2026-07-30' },

      // Z
      { id: 'g-zt',  term: 'Zero-trust', type: 'business', domain: 'compliance', status: 'approved', sensitivity: 'internal',
        definition: 'Security model that assumes no implicit trust based on network location. Every request authenticates + authorizes against current identity and policy. Microsoft\'s baseline since 2021.',
        synonyms: ['ZTA', 'Zero-trust architecture'], related: ['RLS', 'OLS', 'SOC 2'],
        ownerEmail: 's.lindqvist@contoso.com', smeEmail: 't.hermanek@contoso.com',
        source: 'NIST SP 800-207', processUrl: 'https://www.nist.gov/publications/zero-trust-architecture',
        linkedTo: { models: [], measures: [] }, lastReviewed: '2026-03-22', nextReview: '2026-09-22' },
    ],
  },
};

export default DATA;
