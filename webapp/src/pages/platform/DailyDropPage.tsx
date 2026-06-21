import { useEffect, useState, useCallback } from 'react';
import { Flame, TrendingUp, Clock, Calendar, ChevronRight, X, Plus } from 'lucide-react';
import { dealsApi, offersApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OfferSnap {
  id: number; title: string; price: number; currency: string;
  provider_name?: string; category: string; city?: string;
}
interface Deal {
  id: number; deal_price: number | null; quantity_limit: number | null;
  quantity_claimed: number; deal_date: string; is_active?: boolean;
  offer: OfferSnap;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CAT: Record<string, { abbr: string; bg: string; text: string; dot: string }> = {
  wellness:      { abbr: 'WE', bg: '#ede0ff', text: '#7c3aed', dot: '#a78bfa' },
  fitness:       { abbr: 'FI', bg: '#dcfce7', text: '#166534', dot: '#4ade80' },
  food:          { abbr: 'FO', bg: '#ffedd5', text: '#c2410c', dot: '#fb923c' },
  travel:        { abbr: 'TR', bg: '#dbeafe', text: '#1d4ed8', dot: '#60a5fa' },
  learning:      { abbr: 'LE', bg: '#fef9c3', text: '#854d0e', dot: '#fbbf24' },
  dental:        { abbr: 'DE', bg: '#fce7f3', text: '#9d174d', dot: '#f472b6' },
  entertainment: { abbr: 'EN', bg: '#fae8ff', text: '#7e22ce', dot: '#e879f9' },
  health:        { abbr: 'HE', bg: '#fee2e2', text: '#b91c1c', dot: '#f87171' },
  other:         { abbr: 'OT', bg: '#f3f4f6', text: '#4b5563', dot: '#94a3b8' },
};
const catCfg = (c: string) => CAT[c?.toLowerCase()] ?? CAT.other;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function discountPct(deal: Deal): number {
  const orig = deal.offer.price;
  const dp = deal.deal_price;
  if (!dp || dp >= orig) return 0;
  return Math.round((1 - dp / orig) * 100);
}

function dayLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

function hoursLeft(): number {
  return 24 - new Date().getHours();
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────

interface ScheduleModalProps {
  open: boolean; onClose: () => void;
  offers: { id: number; title: string; price: number; currency: string }[];
  onCreated: (d: Deal) => void;
}
function ScheduleModal({ open, onClose, offers, onCreated }: ScheduleModalProps) {
  const [form, setForm] = useState({ offer_id: '', deal_date: '', deal_price: '', quantity_limit: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.offer_id) { setError('Select an offer.'); return; }
    if (!form.deal_date) { setError('Pick a date.'); return; }
    setSaving(true); setError('');
    try {
      const r = await dealsApi.create({
        offer_id: parseInt(form.offer_id),
        deal_date: form.deal_date,
        deal_price: form.deal_price ? parseFloat(form.deal_price) : undefined,
        quantity_limit: form.quantity_limit ? parseInt(form.quantity_limit) : undefined,
      });
      onCreated(r.data as Deal);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to schedule drop.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#f0ece4]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f2ed]">
          <h2 className="text-[#1a1a1a] font-black text-base">Schedule Drop</h2>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed]"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="lf-label">Offer *</label>
            <select className="lf-input" value={form.offer_id} onChange={e => set('offer_id', e.target.value)}>
              <option value="">— Select offer —</option>
              {offers.map(o => <option key={o.id} value={o.id}>{o.title} — {o.price.toLocaleString()} {o.currency}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lf-label">Drop Date *</label>
              <input type="date" className="lf-input" value={form.deal_date} onChange={e => set('deal_date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="lf-label">Deal Price</label>
              <input type="number" className="lf-input" value={form.deal_price} onChange={e => set('deal_price', e.target.value)} placeholder="Leave blank = offer price" min="0" />
            </div>
          </div>
          <div>
            <label className="lf-label">Quantity Limit</label>
            <input type="number" className="lf-input" value={form.quantity_limit} onChange={e => set('quantity_limit', e.target.value)} placeholder="Unlimited" min="1" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0]">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold">
            {saving ? 'Scheduling…' : 'Schedule Drop'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DailyDropPage() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [upcoming, setUpcoming] = useState<Deal[]>([]);
  const [offers, setOffers] = useState<{ id: number; title: string; price: number; currency: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    Promise.allSettled([
      dealsApi.today(),
      dealsApi.upcoming(),
      offersApi.list({ limit: 100 }),
    ]).then(([todayR, upcomingR, offersR]) => {
      if (todayR.status === 'fulfilled') setDeal(todayR.value.data as Deal);
      if (upcomingR.status === 'fulfilled') setUpcoming((upcomingR.value.data as Deal[]) ?? []);
      if (offersR.status === 'fulfilled') setOffers((offersR.value.data as any).items ?? []);
      setLoading(false);
    });
  }, []);

  // Top-bar action: schedule a new daily drop.
  usePageAction({
    label: 'Schedule drop',
    onClick: () => setScheduleOpen(true),
  });

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePause = useCallback(async () => {
    if (!deal) return;
    setPausing(true);
    try {
      await dealsApi.pause(deal.id);
      setDeal(null);
      showToast('Drop paused.', true);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to pause.', false);
    }
    setPausing(false);
  }, [deal]);

  const handleBoost = useCallback(async () => {
    if (!deal) return;
    setBoosting(true);
    try {
      const r = await dealsApi.boost(deal.id);
      setDeal(r.data as Deal);
      showToast('Boosted! Price dropped 20%.', true);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to boost.', false);
    }
    setBoosting(false);
  }, [deal]);

  const handleCreated = (d: Deal) => {
    const today = new Date().toISOString().split('T')[0];
    if (d.deal_date === today) setDeal(d);
    else setUpcoming(prev => [...prev, d].sort((a, b) => a.deal_date.localeCompare(b.deal_date)));
    showToast('Drop scheduled!', true);
  };

  // ── Stats derived from data ─────────────────────────────────────────────
  const todayDiscount = deal ? discountPct(deal) : null;
  const claimedCount = deal?.quantity_claimed ?? 0;
  const limitCount = deal?.quantity_limit ?? null;
  const claimedPct = limitCount ? Math.round((claimedCount / limitCount) * 100) : null;
  const timeLeft = hoursLeft();
  const scheduledCount = upcoming.length;
  const dealPrice = deal ? (deal.deal_price ?? deal.offer.price) : 0;
  const origPrice = deal?.offer.price ?? 0;
  const savedAmount = origPrice - dealPrice;
  const claimedProgress = limitCount ? Math.min(100, (claimedCount / limitCount) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60" />)}</div>
        <div className="grid grid-cols-[1fr_280px] gap-4"><div className="h-80 rounded-2xl bg-[#e8e3db]/60" /><div className="h-80 rounded-2xl bg-[#e8e3db]/60" /></div>
      </div>
    );
  }

  const cfg = deal ? catCfg(deal.offer.category) : CAT.other;

  return (
    <div className="space-y-5">
      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${toast.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Today's Discount</span>
            <Flame size={16} className="text-[#4a5e00]" />
          </div>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none">
            {todayDiscount !== null && todayDiscount > 0 ? `-${todayDiscount}%` : deal ? 'Live' : '—'}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Claimed</span>
            <TrendingUp size={16} className="text-[#aaa]" />
          </div>
          <div>
            <p className="text-[#1a1a1a] text-3xl font-black leading-none">
              {limitCount ? `${claimedCount}/${limitCount}` : claimedCount > 0 ? claimedCount : '—'}
            </p>
            {claimedPct !== null && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={10} className="text-green-500" />
                <span className="text-green-600 text-xs font-bold">{claimedPct}% sold</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Time Remaining</span>
            <Clock size={16} className="text-[#aaa]" />
          </div>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none">{deal ? `${timeLeft}h` : '—'}</p>
        </div>

        <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Drops Scheduled</span>
            <Calendar size={16} className="text-[#666]" />
          </div>
          <div>
            <p className="text-white text-4xl font-black leading-none">{scheduledCount}</p>
            <p className="text-[#666] text-xs mt-1">next 7 days</p>
          </div>
        </div>
      </div>

      {/* ── Main 2-col layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_280px] gap-4 items-start">

        {/* Left: Live drop */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
            <div>
              <h2 className="text-[#1a1a1a] font-black text-base">Live drop</h2>
              {deal && (
                <p className="text-[#aaa] text-xs mt-0.5">{deal.offer.title} · {deal.offer.provider_name}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {deal && (
                <button
                  onClick={handlePause}
                  disabled={pausing}
                  className="flex items-center gap-1 text-[#e55] hover:text-red-600 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  End drop <ChevronRight size={14} />
                </button>
              )}
              <button
                onClick={() => setScheduleOpen(true)}
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
              >
                <Plus size={12} /> Schedule drop
              </button>
            </div>
          </div>

          {deal ? (
            <div className="p-6">
              <div className="bg-[#faf8f5] rounded-2xl p-6 space-y-5">
                {/* Deal header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    <Flame size={24} style={{ color: cfg.dot }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1a1a1a] font-black text-xl leading-tight">{deal.offer.title}</h3>
                    <p className="text-[#888] text-sm mt-0.5">
                      {deal.offer.provider_name}
                      {deal.offer.city ? ` · ${deal.offer.city}` : ''}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-4 flex-wrap">
                  <p className="text-[#1a1a1a] text-4xl font-black">
                    {dealPrice.toLocaleString()} <span className="text-2xl">{deal.offer.currency}</span>
                  </p>
                  {savedAmount > 0 && (
                    <>
                      <p className="text-[#bbb] text-lg font-semibold line-through">
                        {origPrice.toLocaleString()} {deal.offer.currency}
                      </p>
                      <span className="bg-[#1a1a1a] text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                        save {savedAmount.toLocaleString()} {deal.offer.currency}
                      </span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                {limitCount !== null && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#888] text-sm">{claimedCount} claimed</span>
                      <span className="text-[#555] text-sm font-semibold">{limitCount - claimedCount} left</span>
                    </div>
                    <div className="h-3 bg-[#e8e3db] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a1a1a] rounded-full transition-all"
                        style={{ width: `${claimedProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handlePause}
                    disabled={pausing}
                    className="flex-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
                  >
                    {pausing ? 'Pausing…' : 'Pause drop'}
                  </button>
                  <button
                    onClick={handleBoost}
                    disabled={boosting}
                    className="flex-1 bg-[#c9f158] hover:bg-[#b8e047] disabled:opacity-50 text-[#1a1a1a] font-bold py-3.5 rounded-2xl transition-colors text-sm"
                  >
                    {boosting ? 'Boosting…' : 'Boost +20%'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-[#f5f2ed] flex items-center justify-center mb-4">
                <Flame size={24} className="text-[#ccc]" />
              </div>
              <p className="text-[#888] font-semibold">No active drop today</p>
              <p className="text-[#ccc] text-sm mt-1">Schedule a drop to start selling</p>
              <button
                onClick={() => setScheduleOpen(true)}
                className="mt-5 flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
              >
                <Plus size={13} /> Schedule Drop
              </button>
            </div>
          )}
        </div>

        {/* Right: Upcoming schedule */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f5f2ed]">
            <h3 className="text-[#1a1a1a] font-black text-sm">Upcoming schedule</h3>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
              <Calendar size={28} className="text-[#ddd] mb-2" />
              <p className="text-[#bbb] text-sm font-medium">No drops scheduled</p>
              <p className="text-[#ccc] text-xs mt-1">Next 7 days are open</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f8f5f0]">
              {upcoming.map(d => {
                const ucfg = catCfg(d.offer.category);
                const disc = discountPct(d);
                return (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#faf8f5] transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ background: ucfg.bg, color: ucfg.text }}>
                      {ucfg.abbr}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1a1a1a] text-sm font-semibold truncate">{d.offer.title}</p>
                      <p className="text-[#aaa] text-xs">{dayLabel(d.deal_date)} · 09:00</p>
                    </div>
                    {disc > 0 && (
                      <span className="text-[#888] text-sm font-bold flex-shrink-0">-{disc}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-5 py-3 border-t border-[#f5f2ed]">
            <button onClick={() => setScheduleOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[#888] hover:text-[#1a1a1a] text-xs font-semibold transition-colors py-1">
              <Plus size={12} /> Add to schedule
            </button>
          </div>
        </div>
      </div>

      <ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        offers={offers}
        onCreated={handleCreated}
      />
    </div>
  );
}
