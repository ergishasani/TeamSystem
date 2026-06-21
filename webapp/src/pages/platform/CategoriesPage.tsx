import { useEffect, useState, useMemo } from 'react';
import { Layers, Star, TrendingDown, CheckCircle2, Plus, Pencil, X, GripVertical } from 'lucide-react';
import { offersApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Offer { id: number; category: string; price: number; status: string; }

interface CategoryMeta {
  key: string;
  symbol: string;
  color: string;
  hidden?: boolean;
  order: number;
}

const DEFAULT_COLORS = ['#a78bfa', '#4ade80', '#fb923c', '#60a5fa', '#fbbf24', '#f472b6', '#e879f9', '#f87171', '#94a3b8'];

const STORAGE_KEY = 'perka_category_meta';

function loadMeta(): Record<string, CategoryMeta> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMeta(meta: Record<string, CategoryMeta>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
}

function defaultMetaFor(cat: string, index: number): CategoryMeta {
  return {
    key: cat.toLowerCase().replace(/\s+/g, '_'),
    symbol: cat.slice(0, 2).toUpperCase(),
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    order: index,
  };
}

// ─── Edit category modal ───────────────────────────────────────────────────────

function EditCategoryModal({ name, meta, onClose, onSaved }:
  { name: string; meta: CategoryMeta; onClose: () => void; onSaved: (m: CategoryMeta) => void }) {
  const [key, setKey] = useState(meta.key);
  const [symbol, setSymbol] = useState(meta.symbol);
  const [color, setColor] = useState(meta.color);
  const [hidden, setHidden] = useState(!!meta.hidden);

  const submit = () => {
    onSaved({ ...meta, key, symbol: symbol.slice(0, 3).toUpperCase(), color, hidden });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#f0ece4]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-base">Manage category</h2>
            <p className="text-[#aaa] text-xs mt-0.5 capitalize">{name}</p>
          </div>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Key</label>
              <input className="lf-input" value={key} onChange={e => setKey(e.target.value)} />
            </div>
            <div>
              <label className="lf-label">Symbol</label>
              <input className="lf-input" value={symbol} onChange={e => setSymbol(e.target.value)} maxLength={3} />
            </div>
          </div>
          <div>
            <label className="lf-label">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {DEFAULT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-[#1a1a1a] scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="lf-label">Visibility</label>
            <div className="flex gap-2">
              {[{ v: false, label: 'Visible' }, { v: true, label: 'Hidden' }].map(o => (
                <button key={o.label} onClick={() => setHidden(o.v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${hidden === o.v ? 'bg-[#1a1a1a] text-white' : 'border border-[#e5e0d8] text-[#888] hover:bg-[#f8f5f0]'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0] transition-colors">Cancel</button>
          <button onClick={submit} className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── New category modal ────────────────────────────────────────────────────────

function NewCategoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: (name: string, meta: CategoryMeta) => void }) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) { setError('Name is required'); return; }
    onCreated(name.trim().toLowerCase(), {
      key: name.trim().toLowerCase().replace(/\s+/g, '_'),
      symbol: (symbol || name.slice(0, 2)).slice(0, 3).toUpperCase(),
      color, order: 999,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#f0ece4]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <h2 className="text-[#1a1a1a] font-black text-base">New category</h2>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="lf-label">Name</label>
            <input className="lf-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Beauty" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Symbol</label>
              <input className="lf-input" value={symbol} onChange={e => setSymbol(e.target.value)} maxLength={3} placeholder="BE" />
            </div>
            <div>
              <label className="lf-label">Color</label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                {DEFAULT_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-[#1a1a1a] scale-110' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
          <p className="text-[#bbb] text-xs">New categories appear in the mix once an offer is tagged with them.</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0] transition-colors">Cancel</button>
          <button onClick={submit} className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Create</button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<Record<string, CategoryMeta>>(() => loadMeta());
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    offersApi.list({ limit: 100 })
      .then(r => setOffers(r.data.items ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  // Top-bar action: create a new category.
  usePageAction({
    label: 'New category',
    onClick: () => setShowNew(true),
  });

  const catMap: Record<string, Offer[]> = {};
  offers.forEach(o => { catMap[o.category] = [...(catMap[o.category] ?? []), o]; });

  // Ensure every category (real + custom-added) has metadata, persisted.
  const allNames = useMemo(() => {
    const fromOffers = Object.keys(catMap);
    const fromMeta = Object.keys(meta);
    return [...new Set([...fromOffers, ...fromMeta])];
  }, [offers, meta]);

  useEffect(() => {
    let changed = false;
    const next = { ...meta };
    allNames.forEach((name, i) => {
      if (!next[name]) { next[name] = defaultMetaFor(name, i); changed = true; }
    });
    if (changed) { setMeta(next); saveMeta(next); }
  }, [allNames]);

  const updateMeta = (name: string, m: CategoryMeta) => {
    const next = { ...meta, [name]: m };
    setMeta(next);
    saveMeta(next);
  };

  const createCategory = (name: string, m: CategoryMeta) => {
    if (meta[name]) return;
    updateMeta(name, m);
  };

  const moveCategory = (name: string, dir: -1 | 1) => {
    const sorted = [...allNames].sort((a, b) => (meta[a]?.order ?? 0) - (meta[b]?.order ?? 0));
    const idx = sorted.indexOf(name);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    const next = { ...meta };
    const tmp = next[a].order;
    next[a] = { ...next[a], order: next[b].order };
    next[b] = { ...next[b], order: tmp };
    setMeta(next);
    saveMeta(next);
  };

  const totalOffers = offers.length;
  const rows = allNames
    .map(name => {
      const items = catMap[name] ?? [];
      const share = totalOffers ? Math.round((items.length / totalOffers) * 100) : 0;
      return { name, items, share, m: meta[name] ?? defaultMetaFor(name, 0) };
    })
    .filter(r => !r.m.hidden || r.items.length > 0);

  const visibleMixRows = rows.filter(r => r.items.length > 0).sort((a, b) => b.share - a.share);
  const manageRows = [...rows].sort((a, b) => (a.m.order ?? 0) - (b.m.order ?? 0));
  const maxShare = Math.max(1, ...visibleMixRows.map(r => r.share));

  const topCat = visibleMixRows[0];
  const lowestCat = visibleMixRows[visibleMixRows.length - 1];
  const coveragePct = totalOffers ? 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1a1a1a] text-2xl font-black tracking-tight">Categories</h2>
          <p className="text-[#aaa] text-sm mt-0.5">{totalOffers} offers across {visibleMixRows.length} categories</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors">
          <Plus size={15} /> New category
        </button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Total</span>
              <Layers size={16} className="text-[#4a5e00]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{visibleMixRows.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Top Category</span>
              <Star size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-xl font-black leading-none capitalize">{topCat?.name ?? '—'}</p>
              <p className="text-[#aaa] text-xs mt-1">{topCat ? `${topCat.share}% share` : 'no data'}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Lowest</span>
              <TrendingDown size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-xl font-black leading-none capitalize">{lowestCat?.name ?? '—'}</p>
              <p className="text-[#aaa] text-xs mt-1">{lowestCat ? `${lowestCat.share}% share` : 'no data'}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Coverage</span>
              <CheckCircle2 size={16} className="text-[#666]" />
            </div>
            <p className="text-white text-4xl font-black leading-none">{coveragePct}%</p>
          </div>
        </div>
      )}

      {/* Main 2-col layout */}
      <div className="grid grid-cols-2 gap-4 items-start">

        {/* Category mix */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 space-y-4">
          <h3 className="text-[#1a1a1a] font-black text-base">Category mix</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
          ) : visibleMixRows.length === 0 ? (
            <p className="text-[#ccc] text-sm py-6 text-center">No offers yet</p>
          ) : (
            <div className="space-y-3.5">
              {visibleMixRows.map(r => (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.m.color }} />
                      <span className="text-[#1a1a1a] text-sm font-medium capitalize truncate">{r.name}</span>
                      <span className="text-[#aaa] text-xs flex-shrink-0">{r.items.length} offers</span>
                    </div>
                    <span className="text-[#888] text-sm font-semibold flex-shrink-0">{r.share}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((r.share / maxShare) * 100)}%`, background: r.m.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage panel */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#1a1a1a] font-black text-base">Manage</h3>
            <button onClick={() => setReordering(v => !v)} className={`text-xs font-semibold ${reordering ? 'text-[#1a1a1a]' : 'text-[#aaa] hover:text-[#555]'}`}>
              {reordering ? 'Done' : 'Reorder'}
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-1.5">
              {manageRows.map(r => (
                <div key={r.name} className="flex items-center justify-between gap-2 px-2 py-2 rounded-xl hover:bg-[#faf8f5] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {reordering && (
                      <div className="flex flex-col">
                        <button onClick={() => moveCategory(r.name, -1)} className="text-[#ccc] hover:text-[#888] leading-none text-[10px]">▲</button>
                        <button onClick={() => moveCategory(r.name, 1)} className="text-[#ccc] hover:text-[#888] leading-none text-[10px]">▼</button>
                      </div>
                    )}
                    {!reordering && <GripVertical size={14} className="text-[#ddd] flex-shrink-0" />}
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.m.color }} />
                    <div className="min-w-0">
                      <p className="text-[#1a1a1a] text-sm font-medium capitalize truncate">{r.name}{r.m.hidden && <span className="text-[#bbb] font-normal"> · hidden</span>}</p>
                      <p className="text-[#aaa] text-xs truncate">key: {r.m.key} · symbol: {r.m.symbol}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditTarget(r.name)}
                    className="w-8 h-8 rounded-full bg-[#f0ece4] text-[#888] hover:bg-[#e8e3db] flex items-center justify-center flex-shrink-0 transition-colors">
                    <Pencil size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editTarget && (
        <EditCategoryModal
          name={editTarget}
          meta={meta[editTarget] ?? defaultMetaFor(editTarget, 0)}
          onClose={() => setEditTarget(null)}
          onSaved={m => updateMeta(editTarget, m)}
        />
      )}
      {showNew && <NewCategoryModal onClose={() => setShowNew(false)} onCreated={createCategory} />}
    </div>
  );
}
