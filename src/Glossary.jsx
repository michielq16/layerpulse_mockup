import React from 'react';
import Icon from './Icon';
import DATA from './data';
import { StatCard } from './components';

/* ── Helpers — glossary attachments to semantic-model objects ──────────── */

// Return ALL glossary terms attached to a given model, optionally filtered by
// the attachment level (model / measure / column / table).
export function getModelGlossaryAttachments(modelName) {
  if (!modelName) return [];
  return DATA.glossary.items.filter(t => {
    const lt = t.linkedTo;
    if (!lt) return false;
    if ((lt.models || []).includes(modelName)) return true;
    // Models with measures attached count as attached at model level too
    if ((lt.measures || []).length > 0 && (lt.models || []).includes(modelName)) return true;
    return false;
  });
}

// Group attached terms by type (returns { metric: [...], kpi: [...], ... })
export function groupAttachmentsByType(items) {
  const byType = {};
  items.forEach(it => {
    const k = it.type || 'other';
    if (!byType[k]) byType[k] = [];
    byType[k].push(it);
  });
  return byType;
}

// Terms attached specifically to a measure (by DAX name e.g. '[AOV (LCY)]').
export function getMeasureGlossaryAttachments(measureName) {
  if (!measureName) return [];
  return DATA.glossary.items.filter(t => (t.linkedTo?.measures || []).includes(measureName));
}

// Terms attached to a column (by 'Table[Column]' notation).
export function getColumnGlossaryAttachments(columnRef) {
  if (!columnRef) return [];
  return DATA.glossary.items.filter(t => (t.linkedTo?.columns || []).includes(columnRef));
}

/* ─────────────────────────────────────────────────────────────────────────
   /glossary — tenant-wide single dictionary
   DAMA-DMBOK-ish shape: term · definition · type · domain · status ·
   owner · SME · source · business-process URL · synonyms · related ·
   sensitivity · last-reviewed / next-review · linked-to models/measures.
   ───────────────────────────────────────────────────────────────────────── */

export function Glossary() {
  const g = DATA.glossary;
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('all');
  const [domain, setDomain] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [sensitivity, setSensitivity] = React.useState('all');
  const [owner, setOwner] = React.useState('all');
  const [sort, setSort] = React.useState('alpha');
  const [view, setView] = React.useState('az');
  const [openTerm, setOpenTerm] = React.useState(null);
  const [adding, setAdding] = React.useState(false);

  const allOwners = Array.from(new Set(g.items.map(i => i.ownerEmail)));

  const filtered = g.items.filter(it => {
    if (type !== 'all'        && it.type !== type)               return false;
    if (domain !== 'all'      && it.domain !== domain)           return false;
    if (status !== 'all'      && it.status !== status)           return false;
    if (sensitivity !== 'all' && it.sensitivity !== sensitivity) return false;
    if (owner !== 'all'       && it.ownerEmail !== owner)        return false;
    if (search && !(it.term + ' ' + it.definition + ' ' + (it.synonyms || []).join(' ')).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'alpha')        return a.term.localeCompare(b.term);
    if (sort === 'recent')       return (b.lastReviewed || '').localeCompare(a.lastReviewed || '');
    if (sort === 'review-due')   return (a.nextReview || 'z').localeCompare(b.nextReview || 'z');
    if (sort === 'status')       return a.status.localeCompare(b.status);
    return 0;
  });

  const counts = {
    all:      g.items.length,
    approved: g.items.filter(i => i.status === 'approved').length,
    proposed: g.items.filter(i => i.status === 'proposed').length,
    review:   g.items.filter(i => i.status === 'under-review').length,
  };

  // Stat cards derive from g.items (single source of truth) so they can never
  // drift from the term list / filter chips. (Replaced hardcoded g.stats.)
  const GLOSSARY_REF_DATE = '2026-05-24';
  const gStats = {
    total:         g.items.length,
    approved:      counts.approved,
    proposed:      counts.proposed,
    reviewOverdue: g.items.filter(i => i.nextReview && i.nextReview < GLOSSARY_REF_DATE).length,
    orphanTerms:   g.items.filter(i => !(((i.linkedTo || {}).models) || []).length).length,
  };

  const userName = (email) => DATA.ownership.aadUsers.find(u => u.email === email)?.name || email;

  return (
    <>
      <div className="lp-page-head">
        <div className="fade-in">
          <h1 className="lp-page-title">Business glossary</h1>
          <p className="lp-page-sub">Tenant-wide single dictionary. Every metric, KPI, and business term in one place. Owned by stewards; linked to the models that use them. No Fabric API exposes this — captured in LP and joined into every auto-generated document.</p>
        </div>
        <div className="fade-in d2" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><Icon name="external" size={14}/>Export</button>
          <button className="btn btn-sm doc-gen-cta" onClick={() => setAdding(true)}><Icon name="plus" size={14}/>Add term</button>
        </div>
      </div>

      <div className="lp-grid-5 fade-in">
        <StatCard label="Total terms"    value={gStats.total}        icon="folders"        tone="sky"/>
        <StatCard label="Approved"       value={gStats.approved}     sub={`${Math.round(gStats.approved / gStats.total * 100)}% of total`} icon="shield-check" tone="emerald"/>
        <StatCard label="Proposed"       value={gStats.proposed}     sub="Pending review" icon="zap"          tone="violet"/>
        <StatCard label="Review overdue" value={gStats.reviewOverdue} sub="Past review date" icon="alert-triangle" tone="amber"/>
        <StatCard label="Orphan terms"   value={gStats.orphanTerms}  sub="No model linked"  icon="git-branch"   tone="rose"/>
      </div>

      <div className="gloss-shell fade-in d2" style={{ marginTop: 22 }}>

        {/* ── Filter rail ─────────────────────────────────────────────── */}
        <aside className="gloss-rail">
          <div className="lp-search gloss-rail-search">
            <Icon name="search" size={14}/>
            <input placeholder="Search terms, definitions…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          <FilterGroup label="Type" value={type} onChange={setType}
            options={[['all', 'All', g.items.length, 'slate']].concat(g.types.map(t => [t.key, t.label, g.items.filter(i => i.type === t.key).length, t.tone]))}
          />
          <FilterGroup label="Domain" value={domain} onChange={setDomain}
            options={[['all', 'All', g.items.length, 'slate']].concat(g.domains.map(d => [d.key, d.label, g.items.filter(i => i.domain === d.key).length, 'sky']))}
          />
          <FilterGroup label="Status" value={status} onChange={setStatus}
            options={[['all', 'All', g.items.length, 'slate']].concat(g.statuses.map(s => [s.key, s.label, g.items.filter(i => i.status === s.key).length, s.tone]))}
          />
          <FilterGroup label="Sensitivity" value={sensitivity} onChange={setSensitivity}
            options={[['all', 'All', g.items.length, 'slate']].concat(g.sensitivities.map(s => [s.key, s.label, g.items.filter(i => i.sensitivity === s.key).length, s.tone]))}
          />

          <div className="gloss-rail-group">
            <div className="lp-eyebrow gloss-rail-group-label">Owner</div>
            <select className="input input-sm" value={owner} onChange={e => setOwner(e.target.value)} style={{ width: '100%' }}>
              <option value="all">All owners</option>
              {allOwners.map(email => <option key={email} value={email}>{userName(email)}</option>)}
            </select>
          </div>
        </aside>

        {/* ── Main list ────────────────────────────────────────────────── */}
        <section className="gloss-main">
          <div className="lp-section-head" style={{ marginTop: 0 }}>
            <h2>Terms <span className="count">{sorted.length} of {g.items.length}</span></h2>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="seg-tabs" title="Switch view">
                <button className={'seg-tab' + (view === 'az' ? ' active' : '')} onClick={() => setView('az')}>
                  <Icon name="list-rows" size={12}/>A–Z
                </button>
                <button className={'seg-tab' + (view === 'cards' ? ' active' : '')} onClick={() => setView('cards')}>
                  <Icon name="grid" size={12}/>Cards
                </button>
              </div>
              {view === 'cards' && (
                <select className="input input-sm" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="alpha">Alphabetical</option>
                  <option value="recent">Recently reviewed</option>
                  <option value="review-due">Review due first</option>
                  <option value="status">Status</option>
                </select>
              )}
            </div>
          </div>

          {view === 'cards' && (
            <div className="gloss-grid">
              {sorted.map(it => (
                <GlossaryCard key={it.id} item={it} onOpen={() => setOpenTerm(it.id)}/>
              ))}
              {sorted.length === 0 && (
                <div className="empty" style={{ padding: 28 }}>
                  No terms match. <a onClick={() => { setSearch(''); setType('all'); setDomain('all'); setStatus('all'); setSensitivity('all'); setOwner('all'); }}>Clear filters</a> or <a onClick={() => setAdding(true)}>add the first term</a>.
                </div>
              )}
            </div>
          )}

          {view === 'az' && (
            <GlossaryAZView items={sorted} onOpenTerm={setOpenTerm}/>
          )}
        </section>
      </div>

      {openTerm && <GlossaryDrawer termId={openTerm} onClose={() => setOpenTerm(null)} onNavigate={(id) => setOpenTerm(id)}/>}
      {adding && <GlossaryDrawer adding onClose={() => setAdding(false)}/>}
    </>
  );
}

function FilterGroup({ label, value, onChange, options }) {
  return (
    <div className="gloss-rail-group">
      <div className="lp-eyebrow gloss-rail-group-label">{label}</div>
      <div className="gloss-rail-chips">
        {options.map(([k, l, n, tone]) => (
          <button key={k} className={'gloss-rail-chip gloss-rail-chip-' + (value === k ? 'active ' : '') + tone} onClick={() => onChange(k)}>
            <span>{l}</span>
            <span className="count mono">{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── A–Z dictionary view ─────────────────────────────────────────────
   Toggleable alternative to the card grid. Renders terms grouped by
   first letter w/ a sticky letter anchor on the left, like a print
   dictionary. The one-liner is context-sensitive per type:
   acronyms expand on first reference; metrics/KPIs lead with the
   formula; processes describe the workflow.
   ──────────────────────────────────────────────────────────────────── */

/* Extract the canonical one-line summary from a term's definition.
   Most definitions start with "Expansion. Description..." — first
   sentence is the dictionary-style summary. */
function oneLineFor(item) {
  const def = (item.definition || '').trim();
  if (!def) return '—';
  const m = def.match(/^([^.!?]+[.!?])(\s|$)/);
  if (m) return m[1];
  return def.length > 160 ? def.slice(0, 160).trim() + '…' : def;
}

function GlossaryAZView({ items, onOpenTerm }) {
  // Group by first letter (uppercased). Sort within group alphabetically.
  const groups = React.useMemo(() => {
    const map = new Map();
    items.forEach(it => {
      const letter = (it.term || '').trim().charAt(0).toUpperCase() || '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(it);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, list]) => ({ letter, items: list.sort((a, b) => a.term.localeCompare(b.term)) }));
  }, [items]);

  if (groups.length === 0) {
    return <div className="empty" style={{ padding: 28 }}>No terms match. Adjust filters above.</div>;
  }

  return (
    <div className="gloss-az">
      {/* Letter-index thumb strip at the top */}
      <div className="gloss-az-index">
        {groups.map(g => (
          <a
            key={g.letter}
            className="gloss-az-index-letter"
            onClick={() => document.getElementById('az-' + g.letter)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            {g.letter}
          </a>
        ))}
      </div>

      {/* Alphabetical groups */}
      {groups.map(g => (
        <div key={g.letter} id={'az-' + g.letter} className="gloss-az-group">
          <div className="gloss-az-letter">{g.letter}</div>
          <div className="gloss-az-items">
            {g.items.map(it => <GlossaryAZRow key={it.id} item={it} onClick={() => onOpenTerm(it.id)}/>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function GlossaryAZRow({ item, onClick }) {
  const g = DATA.glossary;
  const typeMeta   = g.types.find(t => t.key === item.type)      || { label: item.type,   tone: 'slate' };
  const statusMeta = g.statuses.find(s => s.key === item.status) || { label: item.status, tone: 'slate' };
  const line = oneLineFor(item);
  return (
    <button className="gloss-az-row" onClick={onClick}>
      <span className="gloss-az-term">{item.term}</span>
      <span className={'gloss-type-pill gloss-type-pill-' + typeMeta.tone}>{typeMeta.label}</span>
      {item.status !== 'approved' && (
        <span className={'gloss-status gloss-status-' + statusMeta.tone}><span className="dot"/>{statusMeta.label}</span>
      )}
      <span className="gloss-az-em">—</span>
      <span className="gloss-az-line">{line}</span>
    </button>
  );
}

function GlossaryCard({ item, onOpen }) {
  const g = DATA.glossary;
  const typeMeta   = g.types.find(t => t.key === item.type)             || { label: item.type,   tone: 'slate' };
  const statusMeta = g.statuses.find(s => s.key === item.status)        || { label: item.status, tone: 'slate' };
  const sensMeta   = g.sensitivities.find(s => s.key === item.sensitivity);
  const domainMeta = g.domains.find(d => d.key === item.domain);
  const userName   = (email) => DATA.ownership.aadUsers.find(u => u.email === email)?.name || email;
  const linkedCount = (item.linkedTo?.models?.length || 0) + (item.linkedTo?.measures?.length || 0);
  const reviewDue = item.nextReview && new Date(item.nextReview) < new Date();

  return (
    <button className="gloss-card" onClick={onOpen}>
      <div className="gloss-card-head">
        <div className="gloss-card-term">
          <span className="gloss-card-name">{item.term}</span>
          <span className={'gloss-type-pill gloss-type-pill-' + typeMeta.tone}>{typeMeta.label}</span>
        </div>
        <span className={'gloss-status gloss-status-' + statusMeta.tone}><span className="dot"/>{statusMeta.label}</span>
      </div>

      <div className="gloss-card-def">{item.definition}</div>

      <div className="gloss-card-meta">
        <span><Icon name="folders" size={11}/> {domainMeta?.label || item.domain}</span>
        <span className="sep">·</span>
        <span><Icon name="shield" size={11}/> {sensMeta?.label}</span>
        <span className="sep">·</span>
        <span><Icon name="users" size={11}/> {userName(item.ownerEmail)}</span>
        {linkedCount > 0 && <>
          <span className="sep">·</span>
          <span><Icon name="git-branch" size={11}/> linked to <b>{linkedCount}</b></span>
        </>}
        {reviewDue && <>
          <span className="sep">·</span>
          <span className="gloss-card-overdue"><Icon name="alert" size={11}/> review overdue</span>
        </>}
      </div>
    </button>
  );
}

/* ── Drawer (detail / add / edit) ──────────────────────────────────────── */

/* ── VocabularyPanel — read-only chips, used on /models/[id]/overview ─── */

export function VocabularyPanel({ modelName }) {
  const g = DATA.glossary;
  const attachments = React.useMemo(() => getModelGlossaryAttachments(modelName), [modelName]);
  const byType      = React.useMemo(() => groupAttachmentsByType(attachments), [attachments]);
  const [openTerm, setOpenTerm] = React.useState(null);
  const [adding, setAdding]     = React.useState(false);

  // Display order — most-semantic first
  const displayOrder = ['metric', 'kpi', 'dimension', 'business', 'acronym', 'process'];

  const sections = displayOrder.map(typeKey => {
    const meta = g.types.find(t => t.key === typeKey);
    return { typeKey, meta, items: byType[typeKey] || [] };
  });

  const total = attachments.length;

  return (
    <div className="vocab-panel fade-in">
      <div className="vocab-head">
        <div className="lp-eyebrow">Business vocabulary</div>
        <div className="vocab-head-meta">
          <span>{total} term{total === 1 ? '' : 's'} attached</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={11}/>Attach term</button>
        </div>
      </div>

      <div className="vocab-sections">
        {sections.map(({ typeKey, meta, items }) => (
          <div key={typeKey} className="vocab-section">
            <div className="vocab-section-head">
              <span className={'gloss-type-pill gloss-type-pill-' + (meta?.tone || 'slate')}>{meta?.label || typeKey}</span>
              <span className="vocab-section-count mono">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <div className="vocab-empty">
                <span>No {meta?.label?.toLowerCase() || typeKey} attached yet · </span>
                <a onClick={() => setAdding(true)}>Attach →</a>
              </div>
            ) : (
              <div className="vocab-chip-row">
                {items.map(it => (
                  <button key={it.id} className="vocab-chip" title={it.definition?.split('. ')[0]} onClick={() => setOpenTerm(it.id)}>
                    <span>{it.term}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {openTerm && <GlossaryDrawer termId={openTerm} onClose={() => setOpenTerm(null)} onNavigate={(id) => setOpenTerm(id)}/>}
      {adding && (
        <AttachTermDrawer
          modelName={modelName}
          onClose={() => setAdding(false)}
          onAttach={(termId) => { setAdding(false); setOpenTerm(termId); }}
        />
      )}
    </div>
  );
}

/* AttachTermDrawer — drawer w/ glossary search + type filter; user picks
   a term to attach to the current object (model / measure / column).
   Mockup-only: no actual mutation; selecting opens the term's detail drawer. */
function AttachTermDrawer({ modelName, measureName, columnRef, onClose, onAttach }) {
  const g = DATA.glossary;
  const [q, setQ]     = React.useState('');
  const [type, setType] = React.useState('all');
  const target = measureName ? `measure ${measureName}` : columnRef ? `column ${columnRef}` : `model ${modelName}`;

  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const filtered = g.items.filter(it => {
    if (type !== 'all' && it.type !== type) return false;
    if (q && !(it.term + ' ' + it.definition + ' ' + (it.synonyms || []).join(' ')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="own-drawer-backdrop" onClick={onClose}>
      <div className="own-drawer gloss-drawer" onClick={e => e.stopPropagation()}>
        <div className="own-drawer-head">
          <div>
            <div className="own-drawer-title">Attach a glossary term</div>
            <div className="gloss-drawer-sub">to <b>{target}</b></div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close (Esc)"><Icon name="x" size={14}/></button>
        </div>
        <div className="own-drawer-body" style={{ paddingTop: 12 }}>
          <div className="lp-search" style={{ width: '100%', marginBottom: 12 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search terms…" value={q} onChange={e => setQ(e.target.value)} autoFocus/>
          </div>
          <div className="chip-row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
            <button className={'chip chip-sm' + (type === 'all' ? ' active' : '')} onClick={() => setType('all')}>All<span className="count">{g.items.length}</span></button>
            {g.types.map(t => (
              <button key={t.key} className={'chip chip-sm' + (type === t.key ? ' active' : '')} onClick={() => setType(t.key)}>{t.label}<span className="count">{g.items.filter(i => i.type === t.key).length}</span></button>
            ))}
          </div>
          <div className="vocab-attach-list">
            {filtered.map(it => {
              const typeMeta = g.types.find(t => t.key === it.type);
              return (
                <button key={it.id} className="vocab-attach-row" onClick={() => onAttach?.(it.id)}>
                  <div className="vocab-attach-row-head">
                    <span className="vocab-attach-row-term">{it.term}</span>
                    <span className={'gloss-type-pill gloss-type-pill-' + (typeMeta?.tone || 'slate')}>{typeMeta?.label}</span>
                  </div>
                  <div className="vocab-attach-row-def">{(it.definition || '').split('. ')[0]}.</div>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="empty" style={{ padding: 16 }}>No terms match · <a onClick={() => { setQ(''); setType('all'); }}>clear filters</a></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Export the AttachTermDrawer too so other surfaces (e.g. ModelMeasures
   selected-measure pane) can reuse the same affordance. */
export { AttachTermDrawer, GlossaryDrawer as GlossaryDetailDrawer };

function GlossaryDrawer({ termId, adding, onClose, onNavigate }) {
  const g = DATA.glossary;
  const item = !adding ? g.items.find(i => i.id === termId) : null;
  const [editing, setEditing] = React.useState(!!adding);

  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const userName  = (email) => DATA.ownership.aadUsers.find(u => u.email === email)?.name || email;
  const typeMeta  = item ? g.types.find(t => t.key === item.type) : null;
  const statusMeta= item ? g.statuses.find(s => s.key === item.status) : null;
  const sensMeta  = item ? g.sensitivities.find(s => s.key === item.sensitivity) : null;
  const domainMeta= item ? g.domains.find(d => d.key === item.domain) : null;

  return (
    <div className="own-drawer-backdrop" onClick={onClose}>
      <div className="own-drawer gloss-drawer" onClick={e => e.stopPropagation()}>

        <div className="own-drawer-head">
          <div className="gloss-drawer-title-block">
            {adding ? (
              <div className="own-drawer-title">Add new term</div>
            ) : (
              <>
                <div className="gloss-drawer-term">
                  <span className="gloss-drawer-name">{item.term}</span>
                  <span className={'gloss-type-pill gloss-type-pill-' + typeMeta.tone}>{typeMeta.label}</span>
                  <span className={'gloss-status gloss-status-' + statusMeta.tone}><span className="dot"/>{statusMeta.label}</span>
                </div>
                <div className="gloss-drawer-sub">
                  <span>{domainMeta?.label}</span>
                  <span className="sep">·</span>
                  <span><Icon name="shield" size={11}/> {sensMeta?.label}</span>
                  <span className="sep">·</span>
                  <span>Last reviewed {item.lastReviewed}</span>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!adding && !editing && <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Icon name="settings" size={13}/>Edit</button>}
            <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close (Esc)"><Icon name="x" size={14}/></button>
          </div>
        </div>

        <div className="own-drawer-body gloss-drawer-body">
          {adding ? <GlossaryForm/> : (
            <>
              <FieldBlock label="Definition">
                {editing ? <textarea className="input" rows={5} defaultValue={item.definition}/>
                         : <p className="gloss-def-text">{item.definition}</p>}
              </FieldBlock>

              <div className="gloss-drawer-grid">
                <FieldBlock label="Owner">
                  <div className="gloss-person"><span className="own-avatar">{userName(item.ownerEmail).split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                    <span><div>{userName(item.ownerEmail)}</div><div className="mono gloss-person-mail">{item.ownerEmail}</div></span>
                  </div>
                </FieldBlock>
                <FieldBlock label="Subject-matter expert">
                  <div className="gloss-person"><span className="own-avatar">{userName(item.smeEmail).split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                    <span><div>{userName(item.smeEmail)}</div><div className="mono gloss-person-mail">{item.smeEmail}</div></span>
                  </div>
                </FieldBlock>
                <FieldBlock label="Source / authority">
                  <div>{item.source}</div>
                </FieldBlock>
                <FieldBlock label="Business process">
                  {item.processUrl ? <a href={item.processUrl} target="_blank" rel="noreferrer" className="gloss-link">{item.processUrl} <Icon name="external" size={11}/></a> : <span className="own-empty">— none —</span>}
                </FieldBlock>
                <FieldBlock label="Last reviewed">
                  <span className="mono">{item.lastReviewed}</span>
                </FieldBlock>
                <FieldBlock label="Next review">
                  <span className="mono">{item.nextReview || '—'}</span>
                </FieldBlock>
              </div>

              {item.synonyms?.length > 0 && (
                <FieldBlock label="Synonyms">
                  <div className="gloss-chip-row">
                    {item.synonyms.map(s => <span key={s} className="gloss-chip">{s}</span>)}
                  </div>
                </FieldBlock>
              )}

              {item.related?.length > 0 && (
                <FieldBlock label="Related terms">
                  <div className="gloss-chip-row">
                    {item.related.map(r => {
                      const target = g.items.find(t => t.term === r);
                      return target
                        ? <button key={r} className="gloss-chip gloss-chip-link" onClick={() => onNavigate?.(target.id)}>{r} <Icon name="external" size={10}/></button>
                        : <span key={r} className="gloss-chip">{r}</span>;
                    })}
                  </div>
                </FieldBlock>
              )}

              <FieldBlock label="Linked to">
                {(item.linkedTo?.models?.length || 0) + (item.linkedTo?.measures?.length || 0) === 0 ? (
                  <span className="own-empty">No model or measure references this term yet. <a>Map manually →</a></span>
                ) : (
                  <div className="gloss-linked-block">
                    {item.linkedTo?.models?.length > 0 && (
                      <div className="gloss-linked-group">
                        <div className="lp-eyebrow">Models</div>
                        <div className="gloss-chip-row">{item.linkedTo.models.map(m => <span key={m} className="gloss-chip gloss-chip-model">{m}</span>)}</div>
                      </div>
                    )}
                    {item.linkedTo?.measures?.length > 0 && (
                      <div className="gloss-linked-group">
                        <div className="lp-eyebrow">Measures</div>
                        <div className="gloss-chip-row">{item.linkedTo.measures.map(m => <span key={m} className="gloss-chip mono gloss-chip-measure">{m}</span>)}</div>
                      </div>
                    )}
                  </div>
                )}
              </FieldBlock>
            </>
          )}
        </div>

        {(adding || editing) && (
          <div className="own-drawer-foot">
            <button className="btn btn-outline btn-sm" onClick={() => { if (adding) onClose(); else setEditing(false); }}>Cancel</button>
            <button className="btn btn-sm">Save term</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div className="gloss-field">
      <div className="lp-eyebrow gloss-field-label">{label}</div>
      <div className="gloss-field-body">{children}</div>
    </div>
  );
}

function GlossaryForm() {
  const g = DATA.glossary;
  return (
    <>
      <FieldBlock label="Term">
        <input className="input" placeholder="e.g. Annual Recurring Revenue"/>
        <div className="gloss-form-hint">Capitalize as you'd write it in a report.</div>
      </FieldBlock>

      <FieldBlock label="Definition">
        <textarea className="input" rows={5} placeholder="Plain-language definition. Include formula if it's a metric. Reference source-of-truth tables/measures where possible."/>
      </FieldBlock>

      <div className="gloss-drawer-grid">
        <FieldBlock label="Type">
          <select className="input">{g.types.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
        </FieldBlock>
        <FieldBlock label="Domain">
          <select className="input">{g.domains.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select>
        </FieldBlock>
        <FieldBlock label="Status">
          <select className="input" defaultValue="proposed">{g.statuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </FieldBlock>
        <FieldBlock label="Sensitivity">
          <select className="input" defaultValue="internal">{g.sensitivities.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </FieldBlock>
        <FieldBlock label="Owner">
          <select className="input">{DATA.ownership.aadUsers.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}</select>
        </FieldBlock>
        <FieldBlock label="SME">
          <select className="input">{DATA.ownership.aadUsers.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}</select>
        </FieldBlock>
        <FieldBlock label="Source">
          <input className="input" placeholder="e.g. Finance policy CO-04"/>
        </FieldBlock>
        <FieldBlock label="Business process URL">
          <input className="input" placeholder="https://wiki.contoso.com/…"/>
        </FieldBlock>
      </div>

      <FieldBlock label="Synonyms (comma-separated)">
        <input className="input" placeholder="e.g. ARR, Annualized recurring revenue"/>
      </FieldBlock>

      <FieldBlock label="Related terms (comma-separated)">
        <input className="input" placeholder="e.g. MRR, NRR, Active Customers"/>
      </FieldBlock>

      <FieldBlock label="Review cadence">
        <select className="input"><option>Quarterly (default)</option><option>Monthly</option><option>Semi-annually</option><option>Annually</option></select>
      </FieldBlock>
    </>
  );
}
