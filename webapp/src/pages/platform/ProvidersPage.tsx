import { useEffect, useState, useCallback } from 'react';
import { Building2, Activity, MapPin, TrendingUp, Filter, Download, X, Search, Plus } from 'lucide-react';
import { providersApi } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Provider {
  id: number; name: string; category: string; city: string; country: string;
  description?: string; logo_url?: string; rating: number; status: string;
  offer_count: number; redemption_count: number; uptime_pct: number; health_status: string;
}

// ─── Category config (shared palette across admin pages) ─────────────────────

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

const HEALTH_STYLE: Record<string, { bg: string; text: string; bar: string; label: string }> = {
  healthy: { bg: 'bg-green-50', text: 'text-green-700', bar: '#22c55e', label: 'Healthy' },
  watch:   { bg: 'bg-orange-50', text: 'text-orange-700', bar: '#f97316', label: 'Watch' },
  down:    { bg: 'bg-red-50', text: 'text-red-600', bar: '#ef4444', label: 'Down' },
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function exportCSV(rows: Provider[]) {
  const headers = ['ID', 'Name', 'City', 'Category', 'Uptime%', 'Redemptions', 'Status'];
  const csv = [headers, ...rows.map(p => [p.id, p.name, p.city, p.category, p.uptime_pct, p.redemption_count, p.health_status])]
    .map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `perka-providers-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// ─── Add provider modal ────────────────────────────────────────────────────────

function AddProviderModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Provider) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('wellness');
  const [city, setCity] = useState('Tirana');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const r = await providersApi.create({ name, category, city, description: description || undefined });
      onCreated(r.data as Provider);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not create provider.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#f0ece4]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <h2 className="text-[#1a1a1a] font-black text-base">Add provider</h2>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="lf-label">Name</label>
            <input className="lf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Provider name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Category</label>
              <select className="lf-input" value={category} onChange={e => setCategory(e.target.value)}>
                {Object.keys(CAT).filter(c => c !== 'other').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="lf-label">City</label>
              <input className="lf-input" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="lf-label">Description</label>
            <textarea className="lf-input resize-none" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0] transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
            {saving ? 'Adding…' : 'Add provider'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manage provider modal ────────────────────────────────────────────────────

function ManageModal({ provider, onClose, onSaved }: { provider: Provider; onClose: () => void; onSaved: (p: Provider) => void }) {
  const [category, setCategory] = useState(provider.category);
  const [city, setCity] = useState(provider.city);
  const [status, setStatus] = useState(provider.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true); setError('');
    try {
      const r = await providersApi.update(provider.id, { category, city, status });
      onSaved({ ...provider, ...r.data });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Update failed.');
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
            <h2 className="text-[#1a1a1a] font-black text-base">Manage provider</h2>
            <p className="text-[#aaa] text-xs mt-0.5">{provider.name}</p>
          </div>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Category</label>
              <select className="lf-input" value={category} onChange={e => setCategory(e.target.value)}>
                {Object.keys(CAT).filter(c => c !== 'other').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="lf-label">City</label>
              <input className="lf-input" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="lf-label">Contract status</label>
            <div className="flex gap-2">
              {['active', 'inactive', 'pending'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${status === s ? 'bg-[#1a1a1a] text-white' : 'border border-[#e5e0d8] text-[#888] hover:bg-[#f8f5f0]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-[#faf8f5] rounded-xl p-3 text-center">
              <p className="text-[#1a1a1a] font-black text-lg">{provider.offer_count}</p>
              <p className="text-[#aaa] text-[10px] font-bold uppercase mt-0.5">Offers</p>
            </div>
            <div className="bg-[#faf8f5] rounded-xl p-3 text-center">
              <p className="text-[#1a1a1a] font-black text-lg">{provider.redemption_count}</p>
              <p className="text-[#aaa] text-[10px] font-bold uppercase mt-0.5">Redemptions</p>
            </div>
            <div className="bg-[#faf8f5] rounded-xl p-3 text-center">
              <p className="text-[#1a1a1a] font-black text-lg">{provider.uptime_pct}%</p>
              <p className="text-[#aaa] text-[10px] font-bold uppercase mt-0.5">Uptime</p>
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0] transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({ cats, cities, activeCat, activeCity, onChange, onClear }:
  { cats: string[]; cities: string[]; activeCat: string; activeCity: string;
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
          {['all', ...cats].map(c => (
            <button key={c} onClick={() => onChange(c, activeCity)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${activeCat === c ? 'bg-[#1a1a1a] text-white' : 'border border-[#e5e0d8] text-[#666] hover:border-[#ccc]'}`}>
              {c}
            </button>
          ))}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [activeCity, setActiveCity] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [manageProvider, setManageProvider] = useState<Provider | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    providersApi.adminList()
      .then(r => setProviders(r.data as Provider[]))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (p: Provider) => setProviders(prev => [...prev, p]);
  const handleSaved = (updated: Provider) => setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));

  const activeCount = providers.filter(p => p.status === 'active').length;
  const avgUptime = providers.length ? Math.round(providers.reduce((s, p) => s + p.uptime_pct, 0) / providers.length) : 0;
  const uniqueCities = [...new Set(providers.map(p => p.city))];
  const uniqueCats = [...new Set(providers.map(p => p.category))];
  const watchlistCount = providers.filter(p => p.health_status === 'watch' || p.health_status === 'down').length;

  const filtered = providers.filter(p => {
    if (activeCat !== 'all' && p.category !== activeCat) return false;
    if (activeCity !== 'all' && p.city !== activeCity) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeFilters = (activeCat !== 'all' ? 1 : 0) + (activeCity !== 'all' ? 1 : 0);
  const healthSorted = [...providers].sort((a, b) => b.uptime_pct - a.uptime_pct).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1a1a1a] text-2xl font-black tracking-tight">Providers</h2>
          <p className="text-[#aaa] text-sm mt-0.5">{providers.length} providers on the network</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors">
          <Plus size={15} /> Add provider
        </button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Active Providers</span>
              <Building2 size={16} className="text-[#4a5e00]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{activeCount}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Avg. Uptime</span>
              <Activity size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{avgUptime}%</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Cities</span>
              <MapPin size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{uniqueCities.length}</p>
          </div>
          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Watchlist</span>
              <TrendingUp size={16} className="text-[#666]" />
            </div>
            <p className="text-white text-4xl font-black leading-none">{watchlistCount}</p>
          </div>
        </div>
      )}

      {/* Main 2-col layout */}
      <div className="grid grid-cols-[1fr_300px] gap-4 items-start">

        {/* Network roster */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#f5f2ed]">
            <div>
              <h2 className="text-[#1a1a1a] font-black text-base">Network roster</h2>
              <p className="text-[#aaa] text-xs mt-0.5">Tap a provider to manage offers and contract</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  className="bg-[#f8f5f0] border border-[#ede9e2] rounded-full pl-8 pr-3 py-1.5 text-xs placeholder-[#bbb] focus:outline-none focus:border-[#ccc] w-32 transition-all focus:w-44" />
                {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ccc]"><X size={11} /></button>}
              </div>
              <div className="relative">
                <button onClick={() => setShowFilter(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${showFilter ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e5e0d8] text-[#555] hover:border-[#ccc]'}`}>
                  <Filter size={12} /> Filter
                  {activeFilters > 0 && <span className="bg-[#c9f158] text-[#1a1a1a] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>}
                </button>
                {showFilter && (
                  <FilterPanel
                    cats={uniqueCats} cities={uniqueCities}
                    activeCat={activeCat} activeCity={activeCity}
                    onChange={(c, ci) => { setActiveCat(c); setActiveCity(ci); setShowFilter(false); }}
                    onClear={() => { setActiveCat('all'); setActiveCity('all'); setShowFilter(false); }}
                  />
                )}
              </div>
              <button onClick={() => exportCSV(filtered)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc] transition-colors">
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[44px_1fr_90px_90px_70px_90px_90px] gap-2 px-6 py-2.5 bg-[#faf8f5] border-b border-[#f0ece4]">
            <span />
            {['Provider', 'City', 'Category', 'Uptime', 'Redemptions', 'Status'].map(h => (
              <span key={h} className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[#ccc]">
              <div className="text-center"><Building2 size={36} className="mx-auto mb-2 opacity-40" /><p className="text-sm font-medium">{search || activeFilters ? 'No matching providers' : 'No providers yet'}</p></div>
            </div>
          ) : (
            <div className="divide-y divide-[#f8f5f0]">
              {filtered.map(p => {
                const cfg = catCfg(p.category);
                const hs = HEALTH_STYLE[p.health_status] ?? HEALTH_STYLE.healthy;
                return (
                  <button key={p.id} onClick={() => setManageProvider(p)}
                    className="w-full grid grid-cols-[44px_1fr_90px_90px_70px_90px_90px] gap-2 px-6 py-3 items-center hover:bg-[#faf8f5] transition-colors text-left">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0" style={{ background: cfg.bg, color: cfg.text }}>
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#1a1a1a] font-semibold text-sm leading-snug truncate">{p.name}</p>
                      <p className="text-[#aaa] text-xs truncate">{p.offer_count} offer{p.offer_count !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-[#555] text-sm">{p.city}</span>
                    <span className="text-[#555] text-sm capitalize">{p.category}</span>
                    <span className="text-[#1a1a1a] font-bold text-sm">{p.uptime_pct}%</span>
                    <span className="text-[#555] text-sm">{p.redemption_count}</span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full w-fit ${hs.bg} ${hs.text}`}>{hs.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Health monitor */}
        <div className="bg-[#1a1a1a] rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-black text-base">Health monitor</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-white/10 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3.5">
              {healthSorted.map(p => {
                const hs = HEALTH_STYLE[p.health_status] ?? HEALTH_STYLE.healthy;
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white text-sm font-medium truncate">{p.name}</span>
                      <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: hs.bar }}>{p.uptime_pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.uptime_pct}%`, background: hs.bar }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddProviderModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {manageProvider && <ManageModal provider={manageProvider} onClose={() => setManageProvider(null)} onSaved={handleSaved} />}
      {showFilter && <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />}
    </div>
  );
}
