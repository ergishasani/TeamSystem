import { useEffect, useState, useCallback } from 'react';
import { Tag, TrendingUp, MapPin, Flame, Eye, Pencil, Filter, Download, X, Search, Check } from 'lucide-react';
import { offersApi, providerApi } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Offer {
  id: number; title: string; description?: string; category: string;
  price: number; currency: string; city: string; country: string;
  discount_percent: number; quantity_available?: number; valid_until?: string;
  is_limited_drop: boolean; status: string; provider_name?: string;
  provider_id: number; created_at: string;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CAT: Record<string, { abbr: string; bg: string; text: string; bar: string }> = {
  wellness:      { abbr: 'WE', bg: '#ede0ff', text: '#7c3aed', bar: '#a78bfa' },
  fitness:       { abbr: 'FI', bg: '#dcfce7', text: '#166534', bar: '#4ade80' },
  food:          { abbr: 'FO', bg: '#ffedd5', text: '#c2410c', bar: '#fb923c' },
  travel:        { abbr: 'TR', bg: '#dbeafe', text: '#1d4ed8', bar: '#60a5fa' },
  learning:      { abbr: 'LE', bg: '#fef9c3', text: '#854d0e', bar: '#fbbf24' },
  dental:        { abbr: 'DE', bg: '#fce7f3', text: '#9d174d', bar: '#f472b6' },
  entertainment: { abbr: 'EN', bg: '#fae8ff', text: '#7e22ce', bar: '#e879f9' },
  health:        { abbr: 'HE', bg: '#fee2e2', text: '#b91c1c', bar: '#f87171' },
  other:         { abbr: 'OT', bg: '#f3f4f6', text: '#4b5563', bar: '#94a3b8' },
};
const catCfg = (cat: string) => CAT[cat.toLowerCase()] ?? CAT.other;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function exportCSV(offers: Offer[]) {
  const headers = ['ID', 'Title', 'Provider', 'Category', 'City', 'Price', 'Currency', 'Discount%', 'Limited Drop', 'Valid Until', 'Status'];
  const rows = offers.map(o => [
    o.id, o.title, o.provider_name ?? '', o.category, o.city, o.price,
    o.currency, o.discount_percent, o.is_limited_drop ? 'Yes' : 'No',
    o.valid_until ? fmtDate(o.valid_until) : '', o.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `perka-offers-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ offer, onClose, onSaved }: { offer: Offer; onClose: () => void; onSaved: (o: Offer) => void }) {
  const [price, setPrice] = useState(String(offer.price));
  const [discount, setDiscount] = useState(String(offer.discount_percent));
  const [qty, setQty] = useState(String(offer.quantity_available ?? ''));
  const [validUntil, setValidUntil] = useState(offer.valid_until ? offer.valid_until.split('T')[0] : '');
  const [status, setStatus] = useState(offer.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true); setError('');
    try {
      const r = await providerApi.updateOffer(offer.id, {
        price: parseFloat(price) || offer.price,
        discount_percent: parseFloat(discount) || 0,
        quantity_available: qty ? parseInt(qty) : undefined,
        valid_until: validUntil || undefined,
        status,
      });
      onSaved({ ...offer, ...r.data });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Update failed. Offer management requires provider access.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#f0ece4]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-base">Edit Offer</h2>
            <p className="text-[#aaa] text-xs mt-0.5 truncate max-w-[280px]">{offer.title}</p>
          </div>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lf-label">Price ({offer.currency})</label>
              <input type="number" className="lf-input" value={price} onChange={e => setPrice(e.target.value)} min="0" /></div>
            <div><label className="lf-label">Discount %</label>
              <input type="number" className="lf-input" value={discount} onChange={e => setDiscount(e.target.value)} min="0" max="100" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lf-label">Qty Available</label>
              <input type="number" className="lf-input" value={qty} onChange={e => setQty(e.target.value)} placeholder="Unlimited" min="0" /></div>
            <div><label className="lf-label">Valid Until</label>
              <input type="date" className="lf-input" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
          </div>
          <div>
            <label className="lf-label">Status</label>
            <div className="flex gap-2">
              {['active', 'inactive'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${status === s ? 'bg-[#1a1a1a] text-white' : 'border border-[#e5e0d8] text-[#888] hover:bg-[#f8f5f0]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0] transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({ offers, cats, cities, activeCat, activeCity, onChange, onClear }:
  { offers: Offer[]; cats: string[]; cities: string[]; activeCat: string; activeCity: string;
    onChange: (cat: string, city: string) => void; onClear: () => void }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#ede9e2] rounded-2xl shadow-xl p-4 z-20 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[#1a1a1a] text-sm font-bold">Filters</span>
        <button onClick={onClear} className="text-[#aaa] text-xs hover:text-[#555]">Clear</button>
      </div>
      <div>
        <p className="lf-label">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...cats].map(c => {
            const cfg = c === 'all' ? null : catCfg(c);
            return (
              <button key={c} onClick={() => onChange(c, activeCity)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${activeCat === c ? 'bg-[#1a1a1a] text-white' : 'border border-[#e5e0d8] text-[#666] hover:border-[#ccc]'}`}>
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="lf-label">City</p>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...cities].map(c => (
            <button key={c} onClick={() => onChange(activeCat, c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${activeCity === c ? 'bg-[#1a1a1a] text-white' : 'border border-[#e5e0d8] text-[#666] hover:border-[#ccc]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [activeCity, setActiveCity] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    offersApi.list({ limit: 200 })
      .then(r => setOffers(r.data.items ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (updated: Offer) => setOffers(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));

  const toggleStatus = useCallback(async (offer: Offer) => {
    setToggling(offer.id);
    const next = offer.status === 'active' ? 'inactive' : 'active';
    try {
      await providerApi.updateOffer(offer.id, { status: next });
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: next } : o));
    } catch {}
    setToggling(null);
  }, []);

  // Derived stats
  const limitedDrops = offers.filter(o => o.is_limited_drop).length;
  const avgPrice = offers.length ? Math.round(offers.reduce((s, o) => s + o.price, 0) / offers.length) : 0;
  const currency = offers[0]?.currency ?? 'ALL';
  const uniqueCities = [...new Set(offers.map(o => o.city))];
  const uniqueCats = [...new Set(offers.map(o => o.category))];

  // Category counts for sidebar
  const catCounts: Record<string, number> = {};
  offers.forEach(o => { catCounts[o.category] = (catCounts[o.category] ?? 0) + 1; });
  const catRows = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const maxCatCount = Math.max(1, ...catRows.map(([, n]) => n));

  // Filtered list
  const filtered = offers.filter(o => {
    if (activeCat !== 'all' && o.category !== activeCat) return false;
    if (activeCity !== 'all' && o.city !== activeCity) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.provider_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeFilters = (activeCat !== 'all' ? 1 : 0) + (activeCity !== 'all' ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#e8e3db]/60 animate-pulse rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Total Offers</span>
              <Tag size={16} className="text-[#4a5e00]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-4xl font-black leading-none">{offers.length}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Limited Drops</span>
              <TrendingUp size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-4xl font-black leading-none">{limitedDrops}</p>
              <p className="text-[#aaa] text-xs mt-1">auto-expires</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Avg. Price</span>
              <TrendingUp size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-3xl font-black leading-none">{avgPrice.toLocaleString()} {currency}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Cities</span>
              <MapPin size={16} className="text-[#666]" />
            </div>
            <div>
              <p className="text-white text-4xl font-black leading-none">{uniqueCities.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main 2-col layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_260px] gap-4 items-start">

        {/* Left: offers table */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#f5f2ed]">
            <div>
              <h2 className="text-[#1a1a1a] font-black text-base">All offers</h2>
              <p className="text-[#aaa] text-xs mt-0.5">Tap a row to manage availability, pricing or imagery</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  className="bg-[#f8f5f0] border border-[#ede9e2] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#ccc] w-36 transition-all focus:w-44" />
                {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ccc]"><X size={11} /></button>}
              </div>

              {/* Filter */}
              <div className="relative">
                <button onClick={() => setShowFilter(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${showFilter ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e5e0d8] text-[#555] hover:border-[#ccc]'}`}>
                  <Filter size={12} />
                  Filter
                  {activeFilters > 0 && <span className="bg-[#c9f158] text-[#1a1a1a] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>}
                </button>
                {showFilter && (
                  <FilterPanel
                    offers={offers} cats={uniqueCats} cities={uniqueCities}
                    activeCat={activeCat} activeCity={activeCity}
                    onChange={(c, ci) => { setActiveCat(c); setActiveCity(ci); setShowFilter(false); }}
                    onClear={() => { setActiveCat('all'); setActiveCity('all'); setShowFilter(false); }}
                  />
                )}
              </div>

              {/* Export */}
              <button onClick={() => exportCSV(filtered)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc] transition-colors">
                <Download size={12} />
                Export
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[40px_1fr_100px_90px_120px_90px_80px] gap-2 px-6 py-2.5 bg-[#faf8f5] border-b border-[#f0ece4]">
            <span />
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">Offer</span>
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">Category</span>
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">City</span>
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">Price</span>
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider leading-tight">Valid Until</span>
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider text-center">Actions</span>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[#ccc]">
              <div className="text-center"><Tag size={36} className="mx-auto mb-2 opacity-40" /><p className="text-sm font-medium">{search || activeFilters ? 'No matching offers' : 'No offers yet'}</p></div>
            </div>
          ) : (
            <div className="divide-y divide-[#f8f5f0]">
              {filtered.map(o => {
                const cfg = catCfg(o.category);
                const isTogg = toggling === o.id;
                return (
                  <div key={o.id}
                    className="grid grid-cols-[40px_1fr_100px_90px_120px_90px_80px] gap-2 px-6 py-3 items-center hover:bg-[#faf8f5] transition-colors group">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.text }}>
                      {cfg.abbr}
                    </div>

                    {/* Title + provider */}
                    <div className="min-w-0">
                      <p className="text-[#1a1a1a] font-semibold text-sm leading-snug truncate">{o.title}</p>
                      {o.provider_name && <p className="text-[#aaa] text-xs truncate">{o.provider_name}</p>}
                    </div>

                    {/* Category */}
                    <span className="text-[#555] text-sm capitalize">{o.category}</span>

                    {/* City */}
                    <span className="text-[#555] text-sm">{o.city}</span>

                    {/* Price */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#1a1a1a] font-bold text-sm">{o.price.toLocaleString()} {o.currency}</span>
                      {o.is_limited_drop && <Flame size={11} className="text-[#f97316] flex-shrink-0" />}
                    </div>

                    {/* Valid until */}
                    <span className={`text-sm ${o.valid_until ? 'text-[#555]' : 'text-[#ccc]'}`}>
                      {fmtDate(o.valid_until)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => toggleStatus(o)}
                        disabled={isTogg}
                        title={o.status === 'active' ? 'Deactivate' : 'Activate'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          o.status === 'active'
                            ? 'bg-[#f0ece4] text-[#888] hover:bg-[#e8e3db]'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {isTogg ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : o.status === 'active' ? <Eye size={13} /> : <Check size={13} />}
                      </button>
                      <button
                        onClick={() => setEditOffer(o)}
                        title="Edit offer"
                        className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#2e2e2e] transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer row count */}
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-[#f5f2ed] bg-[#faf8f5]">
              <p className="text-[#bbb] text-xs">Showing {filtered.length} of {offers.length} offers</p>
            </div>
          )}
        </div>

        {/* Right: By category sidebar */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 space-y-4">
          <h3 className="text-[#1a1a1a] font-black text-sm">By category</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {catRows.map(([cat, count]) => {
                const cfg = catCfg(cat);
                const pct = Math.round((count / maxCatCount) * 100);
                const isActive = activeCat === cat;
                return (
                  <button key={cat} onClick={() => setActiveCat(isActive ? 'all' : cat)}
                    className={`w-full text-left transition-opacity ${isActive ? 'opacity-100' : activeCat !== 'all' ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.bar }} />
                        <span className="text-[#1a1a1a] text-sm font-medium capitalize">{cat}</span>
                      </div>
                      <span className="text-[#888] text-sm font-semibold">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.bar }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeCat !== 'all' && (
            <button onClick={() => setActiveCat('all')} className="w-full text-center text-xs text-[#aaa] hover:text-[#555] transition-colors pt-1">
              Clear filter ×
            </button>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editOffer && <EditModal offer={editOffer} onClose={() => setEditOffer(null)} onSaved={handleSaved} />}

      {/* Close filter on outside click */}
      {showFilter && <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />}
    </div>
  );
}
