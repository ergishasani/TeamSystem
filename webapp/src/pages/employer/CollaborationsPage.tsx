import { useEffect, useState } from 'react';
import { Plus, Link2, Trash2 } from 'lucide-react';
import { collaborationsApi, offersApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Offer { id: number; title: string; price: number; }
interface CollabItem { id: number; offer_id: number; provider_id: number; price_share: number; }
interface Collab { id: number; title: string; description: string; total_price: number; currency: string; is_active: boolean; items: CollabItem[]; }

export default function CollaborationsPage() {
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    items: [{ offer_id: '', price_share: '' }],
  });

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      collaborationsApi.list().then((r) => setCollabs(r.data)),
      offersApi.list().then((r) => setOffers(r.data.items ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { offer_id: '', price_share: '' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await collaborationsApi.create({
        title: form.title,
        description: form.description || undefined,
        items: form.items.map((it) => ({ offer_id: Number(it.offer_id), price_share: Number(it.price_share) })),
      });
      setCollabs((prev) => [res.data, ...prev]);
      setShowForm(false);
      setForm({ title: '', description: '', items: [{ offer_id: '', price_share: '' }] });
      showToast('Collaboration created!', true);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed', false);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const offerMap = Object.fromEntries(offers.map((o) => [o.id, o]));

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link2 size={24} className="text-app-accent" />
          <h1 className="text-2xl font-bold text-white">Provider Collaborations</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-app-accent text-black font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={15} />
          New Collaboration
        </button>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${toast.ok ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
          {toast.msg}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-app-surface border border-app-border rounded-xl p-5 mb-6">
          <h3 className="text-white font-bold mb-4">Create Collaboration Package</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-app-muted text-sm mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Gym + Healthy Dinner"
                className="w-full bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm placeholder-app-muted"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted text-sm mb-1">Description — optional</label>
              <textarea
                rows={2}
                placeholder="Describe the collaboration..."
                className="w-full bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm placeholder-app-muted resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-app-muted text-sm">Offers & Price Shares</label>
                <button type="button" onClick={addItem} className="text-app-accent text-xs font-bold hover:underline">
                  + Add Offer
                </button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <select
                    className="flex-1 bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm"
                    value={item.offer_id}
                    onChange={(e) => updateItem(i, 'offer_id', e.target.value)}
                    required
                  >
                    <option value="">Select offer...</option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>{o.title} — {o.price.toLocaleString()} ALL</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    required
                    placeholder="Price share (ALL)"
                    className="w-40 bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm placeholder-app-muted"
                    value={item.price_share}
                    onChange={(e) => updateItem(i, 'price_share', e.target.value)}
                  />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-app-danger hover:opacity-70">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-app-muted text-xs">
                Total: {form.items.reduce((s, it) => s + (Number(it.price_share) || 0), 0).toLocaleString()} ALL
              </p>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="bg-app-accent text-black font-bold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm">
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-app-muted text-sm hover:text-white">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {collabs.length === 0 && (
          <div className="bg-app-surface border border-app-border rounded-xl p-6 text-app-muted text-center">
            No collaborations yet. Create the first one!
          </div>
        )}
        {collabs.map((c) => (
          <div key={c.id} className="bg-app-surface border border-app-border rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{c.title}</h3>
                {c.description && <p className="text-app-muted text-sm mt-1">{c.description}</p>}
                <p className="text-app-accent font-black text-xl mt-2">{Number(c.total_price).toLocaleString()} {c.currency}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              {c.items.map((item) => {
                const offer = offerMap[item.offer_id];
                return (
                  <div key={item.id} className="flex justify-between text-sm text-app-muted">
                    <span>{offer ? offer.title : `Offer #${item.offer_id}`}</span>
                    <span>{Number(item.price_share).toLocaleString()} ALL</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
