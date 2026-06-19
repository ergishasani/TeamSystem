import { useEffect, useState } from 'react';
import { Plus, Edit2, Tag } from 'lucide-react';
import { providerApi } from '../../lib/api';
import type { Offer } from '../../types';
import Badge, { statusBadge } from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES = ['wellness', 'food', 'travel', 'learning', 'fitness', 'dental', 'entertainment', 'other'];

type OfferForm = {
  title: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  city: string;
  country: string;
  discount_percent: string;
  quantity_available: string;
  valid_until: string;
  is_limited_drop: boolean;
};

const emptyForm = (): OfferForm => ({
  title: '',
  description: '',
  category: 'wellness',
  price: '',
  currency: 'ALL',
  city: 'Tirana',
  country: 'AL',
  discount_percent: '0',
  quantity_available: '',
  valid_until: '',
  is_limited_drop: false,
});

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; offer?: Offer } | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = () => {
    providerApi.offers()
      .then((res) => setOffers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setForm(emptyForm());
    setModal({ mode: 'create' });
  };

  const openEdit = (offer: Offer) => {
    setForm({
      title: offer.title,
      description: offer.description ?? '',
      category: offer.category,
      price: String(offer.price),
      currency: offer.currency,
      city: offer.city,
      country: offer.country,
      discount_percent: String(offer.discount_percent),
      quantity_available: offer.quantity_available != null ? String(offer.quantity_available) : '',
      valid_until: offer.valid_until ? offer.valid_until.slice(0, 10) : '',
      is_limited_drop: offer.is_limited_drop,
    });
    setModal({ mode: 'edit', offer });
  };

  const handleSave = async () => {
    if (!form.title || !form.price || !form.category) {
      showToast('Title, category and price are required.', false);
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
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
    };
    try {
      if (modal?.mode === 'create') {
        await providerApi.createOffer(payload);
        showToast('Offer created.', true);
      } else if (modal?.offer) {
        await providerApi.updateOffer(modal.offer.id, payload);
        showToast('Offer updated.', true);
      }
      setModal(null);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save offer.', false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Offers</h1>
          <p className="text-app-muted text-sm mt-1">{offers.length} offer{offers.length !== 1 ? 's' : ''} published</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-app-accent hover:bg-app-accent-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          New Offer
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="bg-app-card border border-app-border rounded-xl p-12 text-center">
          <Tag size={40} className="text-app-muted mx-auto mb-3" />
          <p className="text-white font-medium">No offers yet</p>
          <p className="text-app-muted text-sm mt-1">Create your first offer to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const badge = statusBadge(offer.status);
            return (
              <div key={offer.id} className="bg-app-card border border-app-border rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{offer.title}</p>
                    <p className="text-app-muted text-xs capitalize mt-0.5">{offer.category} · {offer.city}</p>
                  </div>
                  <Badge label={badge.label} variant={badge.variant} />
                </div>

                {offer.description && (
                  <p className="text-app-muted text-xs line-clamp-2">{offer.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-app-accent font-bold text-lg">
                      {offer.price.toLocaleString()} {offer.currency}
                    </p>
                    {offer.discount_percent > 0 && (
                      <p className="text-yellow-400 text-xs">{offer.discount_percent}% off</p>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(offer)}
                    className="flex items-center gap-1.5 text-app-muted hover:text-white text-xs px-3 py-1.5 rounded-lg bg-app-surface hover:bg-app-border transition-colors"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                </div>

                {offer.is_limited_drop && (
                  <p className="text-yellow-400 text-xs font-medium">⚡ Limited drop</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-app-card border border-app-border rounded-2xl p-6 w-full max-w-lg my-auto">
            <h3 className="text-white font-bold text-lg mb-5">
              {modal.mode === 'create' ? 'New Offer' : 'Edit Offer'}
            </h3>

            <div className="space-y-4">
              <Field label="Title *">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                  placeholder="Spa Access Pass"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="What's included..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category *">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-app-card capitalize">{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Price *">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="form-input"
                    placeholder="3500"
                    min="0"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Currency">
                  <input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="form-input"
                    placeholder="ALL"
                  />
                </Field>
                <Field label="Discount %">
                  <input
                    type="number"
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                    className="form-input"
                    min="0"
                    max="100"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="form-input"
                    placeholder="Tirana"
                  />
                </Field>
                <Field label="Country">
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="form-input"
                    placeholder="AL"
                    maxLength={2}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Qty Available">
                  <input
                    type="number"
                    value={form.quantity_available}
                    onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                    className="form-input"
                    placeholder="Unlimited"
                    min="1"
                  />
                </Field>
                <Field label="Valid Until">
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="form-input"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm({ ...form, is_limited_drop: !form.is_limited_drop })}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form.is_limited_drop ? 'bg-app-accent' : 'bg-app-surface'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.is_limited_drop ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-app-muted text-sm">Limited drop ⚡</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 bg-app-surface hover:bg-app-border text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-app-accent hover:bg-app-accent-dark disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Offer' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-xl z-50 ${toast.ok ? 'bg-app-accent text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-app-muted text-xs font-medium mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
