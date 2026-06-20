import { useEffect, useState, useCallback } from 'react';
import { Layers, TrendingUp, ShieldCheck, ChevronRight, X, Plus, Trash2 } from 'lucide-react';
import { collaborationsApi, offersApi } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CollabItem {
  id: number; offer_id: number; provider_id: number; price_share: number;
  provider_name?: string; offer_title?: string; offer_price?: number; offer_category?: string;
}
interface Collab {
  id: number; title: string; description?: string;
  total_price: number; original_price: number; save_percent: number;
  currency: string; city: string; is_active: boolean; items: CollabItem[];
}
interface Offer { id: number; title: string; price: number; currency: string; category: string; provider_name?: string; }

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_DOT: Record<string, string> = {
  wellness: '#a78bfa', fitness: '#4ade80', food: '#fb923c',
  travel: '#60a5fa', learning: '#fbbf24', dental: '#f472b6',
  entertainment: '#e879f9', health: '#f87171', other: '#94a3b8',
};
const dot = (c?: string) => CAT_DOT[(c ?? '').toLowerCase()] ?? CAT_DOT.other;

// ─── Manage Modal ─────────────────────────────────────────────────────────────

function ManageModal({ collab, onClose, onUpdated, onRemoved }:
  { collab: Collab; onClose: () => void; onUpdated: (c: Collab) => void; onRemoved: (id: number) => void }) {
  const [title, setTitle] = useState(collab.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const r = await collaborationsApi.update(collab.id, { title });
      onUpdated(r.data as Collab);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update.');
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setSaving(true); setError('');
    try {
      await collaborationsApi.update(collab.id, { is_active: false });
      onRemoved(collab.id);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to deactivate.');
      setSaving(false);
    }
  };

  const providers = [...new Set(collab.items.map(i => i.provider_name).filter(Boolean))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#f0ece4]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <h2 className="text-[#1a1a1a] font-black text-base">Manage Collab</h2>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed]"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="lf-label">Title</label>
            <input className="lf-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <p className="lf-label">Providers</p>
            <p className="text-[#555] text-sm">{providers.join(' × ')}</p>
          </div>
          <div>
            <p className="lf-label">Items</p>
            <div className="space-y-1.5">
              {collab.items.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 bg-[#f8f5f0] rounded-xl px-3 py-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot(item.offer_category) }} />
                  <span className="text-[#555] text-sm flex-1 truncate">{item.offer_title ?? `Offer #${item.offer_id}`}</span>
                  <span className="text-[#888] text-sm font-semibold whitespace-nowrap">{item.price_share.toLocaleString()} ALL</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#faf8f5] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-[#888] text-sm">Bundle total</span>
            <div className="text-right">
              <span className="text-[#1a1a1a] font-black">{collab.total_price.toLocaleString()} {collab.currency}</span>
              <span className="text-[#bbb] text-xs line-through ml-2">{collab.original_price.toLocaleString()}</span>
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={deactivate} disabled={saving}
            className="flex items-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            <Trash2 size={14} /> Remove
          </button>
          <button onClick={save} disabled={saving || !title.trim()}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Propose Modal ────────────────────────────────────────────────────────────

function ProposeModal({ offers, onClose, onCreated }:
  { offers: Offer[]; onClose: () => void; onCreated: (c: Collab) => void }) {
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState([{ offer_id: '', price_share: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addRow = () => setRows(r => [...r, { offer_id: '', price_share: '' }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const setRow = (i: number, k: 'offer_id' | 'price_share', v: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const submit = async () => {
    if (!title.trim()) { setError('Enter a title.'); return; }
    const items = rows.filter(r => r.offer_id && r.price_share);
    if (items.length < 2) { setError('Add at least 2 offers.'); return; }
    setSaving(true); setError('');
    try {
      const r = await collaborationsApi.create({
        title: title.trim(),
        items: items.map(i => ({ offer_id: parseInt(i.offer_id), price_share: parseFloat(i.price_share) })),
      });
      onCreated(r.data as Collab);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create collab.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#f0ece4] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-base">Propose Collab</h2>
            <p className="text-[#aaa] text-xs mt-0.5">Bundle offers from multiple providers</p>
          </div>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed]"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="lf-label">Collab Title *</label>
            <input className="lf-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Gym + Healthy Dinner" />
          </div>
          <div>
            <label className="lf-label">Offers *</label>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="lf-input flex-1" value={row.offer_id} onChange={e => {
                    const o = offers.find(of => String(of.id) === e.target.value);
                    setRow(i, 'offer_id', e.target.value);
                    if (o) setRow(i, 'price_share', String(o.price));
                  }}>
                    <option value="">— Select offer —</option>
                    {offers.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                  </select>
                  <input type="number" className="lf-input w-28" placeholder="Price" value={row.price_share}
                    onChange={e => setRow(i, 'price_share', e.target.value)} min="0" />
                  {rows.length > 2 && (
                    <button onClick={() => removeRow(i)} className="text-[#ccc] hover:text-red-400 flex-shrink-0"><X size={15} /></button>
                  )}
                </div>
              ))}
              <button onClick={addRow} className="flex items-center gap-1.5 text-[#aaa] hover:text-[#555] text-sm transition-colors">
                <Plus size={13} /> Add offer
              </button>
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0]">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold">
            {saving ? 'Creating…' : 'Create Collab'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Collab Card ──────────────────────────────────────────────────────────────

function CollabCard({ collab, onManage }: { collab: Collab; onManage: (c: Collab) => void }) {
  const providers = [...new Set(collab.items.map(i => i.provider_name).filter(Boolean))];
  const savingsAmount = collab.original_price - collab.total_price;

  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#d0cbc3] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#f5f2ed] flex items-center justify-center flex-shrink-0">
            <Layers size={14} className="text-[#888]" />
          </div>
          {collab.save_percent > 0 && (
            <span className="bg-[#c9f158] text-[#1a1a1a] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
              Save {collab.save_percent}%
            </span>
          )}
        </div>
      </div>

      {/* Title + providers */}
      <div>
        <h3 className="text-[#1a1a1a] font-black text-lg leading-snug">{collab.title}</h3>
        {providers.length > 0 && (
          <p className="text-[#aaa] text-xs mt-0.5">{providers.join(' × ')}</p>
        )}
      </div>

      {/* Offer items */}
      <div className="space-y-2">
        {collab.items.map(item => (
          <div key={item.id} className="flex items-center gap-2.5 bg-[#f8f5f0] rounded-xl px-3.5 py-2.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot(item.offer_category) }} />
            <span className="text-[#1a1a1a] text-sm truncate">{item.offer_title ?? `Offer #${item.offer_id}`}</span>
          </div>
        ))}
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[#1a1a1a] font-black text-xl">{collab.total_price.toLocaleString()} {collab.currency}</span>
          {savingsAmount > 0 && (
            <span className="text-[#bbb] text-sm line-through ml-2">{collab.original_price.toLocaleString()} ALL</span>
          )}
        </div>
        <button
          onClick={() => onManage(collab)}
          className="bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
        >
          Manage
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollabsPage() {
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingCollab, setManagingCollab] = useState<Collab | null>(null);
  const [proposeOpen, setProposeOpen] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      collaborationsApi.list(),
      offersApi.list({ limit: 200 }),
    ]).then(([collabRes, offerRes]) => {
      if (collabRes.status === 'fulfilled') setCollabs(collabRes.value.data as Collab[]);
      if (offerRes.status === 'fulfilled') setOffers((offerRes.value.data as any).items ?? []);
      setLoading(false);
    });
  }, []);

  const handleUpdated = useCallback((updated: Collab) =>
    setCollabs(prev => prev.map(c => c.id === updated.id ? updated : c)), []);

  const handleRemoved = useCallback((id: number) =>
    setCollabs(prev => prev.filter(c => c.id !== id)), []);

  const handleCreated = useCallback((c: Collab) =>
    setCollabs(prev => [c, ...prev]), []);

  // Derived stats
  const activeCount = collabs.length;
  const avgSavings = activeCount > 0
    ? Math.round(collabs.reduce((s, c) => s + c.save_percent, 0) / activeCount)
    : 0;
  const totalSaved = collabs.reduce((s, c) => s + (c.original_price - c.total_price), 0);
  const currency = collabs[0]?.currency ?? 'ALL';
  const providersPaired = new Set(collabs.flatMap(c => c.items.map(i => i.provider_id))).size;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60" />)}</div>
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-[#e8e3db]/60" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Active Collabs</span>
            <Layers size={16} className="text-[#4a5e00]" />
          </div>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none">{activeCount}</p>
        </div>

        <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Avg. Savings</span>
            <TrendingUp size={16} className="text-[#aaa]" />
          </div>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none">{avgSavings > 0 ? `${avgSavings}%` : '—'}</p>
        </div>

        <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Total Saved</span>
            <TrendingUp size={16} className="text-[#aaa]" />
          </div>
          <p className="text-[#1a1a1a] text-3xl font-black leading-none">
            {totalSaved > 0 ? `${totalSaved.toLocaleString()} ${currency}` : '—'}
          </p>
        </div>

        <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Providers Paired</span>
            <ShieldCheck size={16} className="text-[#666]" />
          </div>
          <p className="text-white text-4xl font-black leading-none">{providersPaired}</p>
        </div>
      </div>

      {/* ── Collab library ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-base">Collab library</h2>
            <p className="text-[#aaa] text-xs mt-0.5">Two providers, one bundle</p>
          </div>
          <button
            onClick={() => setProposeOpen(true)}
            className="flex items-center gap-1 text-[#555] hover:text-[#1a1a1a] text-sm font-semibold transition-colors"
          >
            Propose collab <ChevronRight size={14} />
          </button>
        </div>

        {collabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f2ed] flex items-center justify-center mb-4">
              <Layers size={24} className="text-[#ccc]" />
            </div>
            <p className="text-[#888] font-semibold">No collaborations yet</p>
            <p className="text-[#ccc] text-sm mt-1">Bundle offers from two providers into one deal</p>
            <button onClick={() => setProposeOpen(true)}
              className="mt-5 flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors">
              <Plus size={13} /> Propose Collab
            </button>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-3 gap-4">
            {collabs.map(c => (
              <CollabCard key={c.id} collab={c} onManage={setManagingCollab} />
            ))}
          </div>
        )}
      </div>

      {managingCollab && (
        <ManageModal
          collab={managingCollab}
          onClose={() => setManagingCollab(null)}
          onUpdated={updated => { handleUpdated(updated); setManagingCollab(null); }}
          onRemoved={id => { handleRemoved(id); setManagingCollab(null); }}
        />
      )}

      {proposeOpen && (
        <ProposeModal
          offers={offers}
          onClose={() => setProposeOpen(false)}
          onCreated={c => { handleCreated(c); setProposeOpen(false); }}
        />
      )}
    </div>
  );
}
