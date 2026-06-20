import { useEffect, useState } from 'react';
import { X, Flame } from 'lucide-react';
import { adminApi, providersApi } from '../../lib/api';

const CATEGORIES = ['wellness', 'fitness', 'food', 'travel', 'learning', 'dental', 'entertainment', 'health', 'other'];

interface Provider { id: number; name: string; category: string; city: string; }

type Form = {
  provider_id: string;
  title: string; description: string; category: string; price: string;
  currency: string; city: string; country: string; discount_percent: string;
  quantity_available: string; valid_until: string; is_limited_drop: boolean;
};

const empty = (): Form => ({
  provider_id: '', title: '', description: '', category: 'wellness', price: '',
  currency: 'ALL', city: 'Tirana', country: 'AL', discount_percent: '0',
  quantity_available: '', valid_until: '', is_limited_drop: false,
});

interface Props { open: boolean; onClose: () => void; }

export default function NewOfferModal({ open, onClose }: Props) {
  const [form, setForm] = useState<Form>(empty());
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(empty());
    setToast(null);
    setLoadingProviders(true);
    providersApi.list({ limit: 100 } as any)
      .then(r => {
        const data = r.data;
        setProviders(Array.isArray(data) ? data : (data?.items ?? []));
      })
      .catch(() => setProviders([]))
      .finally(() => setLoadingProviders(false));
  }, [open]);

  const set = (k: keyof Form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    if (ok) setTimeout(onClose, 1400);
    else setTimeout(() => setToast(null), 4500);
  };

  const submit = async () => {
    if (!form.provider_id) { showToast('Select a provider first.', false); return; }
    if (!form.title.trim()) { showToast('Title is required.', false); return; }
    if (!form.price || parseFloat(form.price) <= 0) { showToast('Enter a valid price.', false); return; }

    setSaving(true);
    try {
      await adminApi.createOffer({
        provider_id: parseInt(form.provider_id),
        title: form.title.trim(),
        description: form.description || undefined,
        category: form.category,
        price: parseFloat(form.price),
        currency: form.currency,
        city: form.city,
        country: form.country,
        discount_percent: parseFloat(form.discount_percent) || 0,
        quantity_available: form.quantity_available ? parseInt(form.quantity_available) : undefined,
        valid_until: form.valid_until || undefined,
        is_limited_drop: form.is_limited_drop,
      });
      showToast('Offer created successfully!', true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      showToast(typeof detail === 'string' ? detail : 'Failed to create offer.', false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#f0ece4]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-lg">New Offer</h2>
            <p className="text-[#aaa] text-xs mt-0.5">Published to the employee marketplace</p>
          </div>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Provider selector — required */}
          <div>
            <label className="lf-label">
              Provider *
              {loadingProviders && <span className="ml-2 text-[#ccc] normal-case font-normal">loading…</span>}
            </label>
            <select
              className="lf-input"
              value={form.provider_id}
              onChange={e => {
                const p = providers.find(pr => String(pr.id) === e.target.value);
                set('provider_id', e.target.value);
                if (p) set('city', p.city);
              }}
            >
              <option value="">— Choose a provider —</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name} · {p.city}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="lf-label">Title *</label>
            <input
              className="lf-input"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Monthly Gym Pass"
            />
          </div>

          {/* Description */}
          <div>
            <label className="lf-label">Description</label>
            <textarea
              className="lf-input resize-none"
              rows={2}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What's included…"
            />
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Category *</label>
              <select className="lf-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="lf-label">Price *</label>
              <input
                type="number" className="lf-input" value={form.price}
                onChange={e => set('price', e.target.value)} placeholder="3 500" min="0"
              />
            </div>
          </div>

          {/* Currency + Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Currency</label>
              <input className="lf-input" value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="ALL" />
            </div>
            <div>
              <label className="lf-label">Discount %</label>
              <input
                type="number" className="lf-input" value={form.discount_percent}
                onChange={e => set('discount_percent', e.target.value)} min="0" max="100"
              />
            </div>
          </div>

          {/* City + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">City</label>
              <input className="lf-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Tirana" />
            </div>
            <div>
              <label className="lf-label">Country</label>
              <input className="lf-input" value={form.country} onChange={e => set('country', e.target.value)} placeholder="AL" maxLength={2} />
            </div>
          </div>

          {/* Qty + Valid until */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Qty Available</label>
              <input
                type="number" className="lf-input" value={form.quantity_available}
                onChange={e => set('quantity_available', e.target.value)} placeholder="Unlimited" min="1"
              />
            </div>
            <div>
              <label className="lf-label">Valid Until</label>
              <input type="date" className="lf-input" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} />
            </div>
          </div>

          {/* Limited drop toggle */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none py-1"
            onClick={() => set('is_limited_drop', !form.is_limited_drop)}
          >
            <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${form.is_limited_drop ? 'bg-[#1a1a1a]' : 'bg-[#e5e0d8]'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.is_limited_drop ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <Flame size={13} className={form.is_limited_drop ? 'text-[#f97316]' : 'text-[#ccc]'} />
              <span className="text-[#555] text-sm">Limited drop — auto-expires when quantity runs out</span>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mb-3 px-4 py-3 rounded-xl text-sm font-medium ${toast.ok ? 'bg-[#f0fce8] text-[#2d6a00] border border-[#c6f09b]' : 'bg-[#fff0f0] text-[#c00] border border-[#fcc]'}`}>
            {toast.msg}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-[#e5e0d8] text-[#888] text-sm font-medium py-2.5 rounded-xl hover:bg-[#f8f5f0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.provider_id}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Creating…' : 'Create Offer'}
          </button>
        </div>
      </div>
    </div>
  );
}
