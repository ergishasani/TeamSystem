import { useEffect, useState } from 'react';
import { Calendar, Flame, Package } from 'lucide-react';
import { dealsApi, offersApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Offer { id: number; title: string; category: string; price: number; currency: string; }
interface Deal { id: number; offer: Offer; deal_date: string; deal_price: number | null; quantity_limit: number | null; quantity_claimed: number; is_active: boolean; }

export default function DealOfDayPage() {
  const [today, setToday] = useState<Deal | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    offer_id: '',
    deal_date: new Date().toISOString().slice(0, 10),
    deal_price: '',
    quantity_limit: '',
  });

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      dealsApi.today().then((r) => setToday(r.data)).catch(() => setToday(null)),
      offersApi.list().then((r) => setOffers(r.data.items ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.offer_id) return;
    setCreating(true);
    try {
      const res = await dealsApi.create({
        offer_id: Number(form.offer_id),
        deal_date: form.deal_date,
        deal_price: form.deal_price ? Number(form.deal_price) : undefined,
        quantity_limit: form.quantity_limit ? Number(form.quantity_limit) : undefined,
      });
      setToday(res.data);
      showToast('Deal of the day created!', true);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create deal', false);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Flame size={24} className="text-app-accent" />
        <h1 className="text-2xl font-bold text-white">Deal of the Day</h1>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${toast.ok ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
          {toast.msg}
        </div>
      )}

      {/* Today's active deal */}
      {today ? (
        <div className="bg-app-surface border border-app-accent/30 rounded-xl p-5 mb-8">
          <p className="text-xs text-app-accent font-bold uppercase tracking-widest mb-2">Today's Active Deal</p>
          <h2 className="text-xl font-bold text-white">{today.offer.title}</h2>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-2xl font-black text-app-accent">
              {(today.deal_price ?? today.offer.price).toLocaleString()} ALL
            </span>
            {today.deal_price && today.deal_price < today.offer.price && (
              <span className="text-app-muted line-through text-sm">{today.offer.price.toLocaleString()} ALL</span>
            )}
          </div>
          <div className="flex gap-4 mt-3 text-sm text-app-muted">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {today.deal_date}
            </span>
            {today.quantity_limit && (
              <span className="flex items-center gap-1">
                <Package size={13} />
                {today.quantity_limit - today.quantity_claimed} / {today.quantity_limit} remaining
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-app-surface border border-app-border rounded-xl p-5 mb-8 text-app-muted">
          No deal set for today yet.
        </div>
      )}

      {/* Create new deal form */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Schedule a Deal</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-app-muted text-sm mb-1">Offer</label>
            <select
              className="w-full bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm"
              value={form.offer_id}
              onChange={(e) => setForm({ ...form, offer_id: e.target.value })}
              required
            >
              <option value="">Select an offer...</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>{o.title} — {o.price.toLocaleString()} ALL</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-app-muted text-sm mb-1">Date</label>
              <input
                type="date"
                className="w-full bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm"
                value={form.deal_date}
                onChange={(e) => setForm({ ...form, deal_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-app-muted text-sm mb-1">Deal Price (ALL) — optional</label>
              <input
                type="number"
                placeholder="Leave blank to use original price"
                className="w-full bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm placeholder-app-muted"
                value={form.deal_price}
                onChange={(e) => setForm({ ...form, deal_price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted text-sm mb-1">Quantity Limit — optional</label>
            <input
              type="number"
              placeholder="e.g. 30"
              className="w-full bg-app-card border border-app-border rounded-lg px-3 py-2 text-white text-sm placeholder-app-muted"
              value={form.quantity_limit}
              onChange={(e) => setForm({ ...form, quantity_limit: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-app-accent text-black font-bold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {creating ? 'Creating...' : 'Create Deal'}
          </button>
        </form>
      </div>
    </div>
  );
}
