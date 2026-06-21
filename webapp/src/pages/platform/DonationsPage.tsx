import { useEffect, useState } from 'react';
import {
  Heart, HandCoins, Users, Clock, Sparkles, Plus, Check, X, Lightbulb, Building2,
} from 'lucide-react';
import { donationsApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

interface CharityBreakdown {
  charity_id: number | null;
  charity_name: string;
  category: string;
  total: number;
  count: number;
}
interface DonationStats {
  currency: string;
  total_donated_this_month: number;
  total_donated_all_time: number;
  donor_count: number;
  pending_count: number;
  pending_amount: number;
  employer_match_paid: number;
  by_charity: CharityBreakdown[];
  by_category: CharityBreakdown[];
}
interface Charity {
  id: number;
  name: string;
  description: string | null;
  category: string;
  company_id: number | null;
  is_platform_wide: boolean;
  is_active: boolean;
}
interface Suggestion {
  id: number;
  charity_name: string;
  charity_website: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  environment: '#6db347', education: '#4a85e8', health: '#ff9aa8',
  community: '#c9a8ff', animals: '#ffb86b', children: '#ffd66b', other: '#aaa',
};
const CATEGORIES = ['community', 'environment', 'education', 'health', 'animals', 'children', 'other'];

function fmt(n: number) {
  return n.toLocaleString();
}

export default function DonationsPage() {
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'community' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.allSettled([
      donationsApi.stats(),
      donationsApi.charities(),
      donationsApi.suggestions(),
    ]).then(([s, c, sug]) => {
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (c.status === 'fulfilled') setCharities(c.value.data);
      if (sug.status === 'fulfilled') setSuggestions(sug.value.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Top-bar action: add a new charity.
  usePageAction({
    label: 'Add charity',
    onClick: () => setShowForm(true),
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await donationsApi.createCharity(form);
      setForm({ name: '', description: '', category: 'community' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Charity) => {
    await donationsApi.updateCharity(c.id, { is_active: !c.is_active });
    load();
  };

  const reviewSuggestion = async (id: number, status: 'approved' | 'rejected') => {
    await donationsApi.reviewSuggestion(id, status);
    load();
  };

  const ccy = stats?.currency ?? 'ALL';
  const maxCharity = Math.max(1, ...(stats?.by_charity ?? []).map((b) => b.total));
  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1a1a1a] text-2xl font-black">Donations</h1>
          <p className="text-[#888] text-sm mt-0.5">Charity giving funded from employee wallet budgets</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#000] text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors"
        >
          <Plus size={15} /> Add charity
        </button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Donated This Month</span>
              <Heart size={16} className="text-[#4a5e00]" />
            </div>
            <p className="text-[#1a1a1a] text-3xl font-black leading-none">{fmt(stats?.total_donated_this_month ?? 0)} <span className="text-base">{ccy}</span></p>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">All Time</span>
              <HandCoins size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-3xl font-black leading-none">{fmt(stats?.total_donated_all_time ?? 0)} <span className="text-base">{ccy}</span></p>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Employees Donated</span>
              <Users size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{stats?.donor_count ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Employer Match Paid</span>
              <Sparkles size={16} className="text-[#666]" />
            </div>
            <p className="text-white text-3xl font-black leading-none">{fmt(stats?.employer_match_paid ?? 0)} <span className="text-base text-[#888]">{ccy}</span></p>
          </div>
        </div>
      )}

      {/* Add charity form */}
      {showForm && (
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 space-y-3">
          <h2 className="text-[#1a1a1a] font-black text-sm">New company charity</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Charity name"
              className="px-4 py-2.5 rounded-xl border border-[#ede9e2] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9f158]"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-[#ede9e2] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9f158] capitalize"
            >
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description (optional)"
            className="w-full px-4 py-2.5 rounded-xl border border-[#ede9e2] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#c9f158]"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-[#888] text-sm font-semibold px-4 py-2">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="bg-[#c9f158] hover:bg-[#b8e047] disabled:opacity-50 text-[#1a1a1a] text-sm font-bold px-5 py-2 rounded-full transition-colors"
            >
              {saving ? 'Saving…' : 'Create charity'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Breakdown by charity */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5f2ed] flex items-center justify-between">
            <h2 className="text-[#1a1a1a] font-black text-base">Top charities</h2>
            {stats && stats.pending_count > 0 && (
              <span className="flex items-center gap-1 text-[#b8860b] text-xs font-bold">
                <Clock size={12} /> {stats.pending_count} pending · {fmt(stats.pending_amount)} {ccy}
              </span>
            )}
          </div>
          <div className="p-5 space-y-4">
            {(stats?.by_charity ?? []).length === 0 ? (
              <p className="text-[#aaa] text-sm py-6 text-center">No approved donations yet.</p>
            ) : (
              stats!.by_charity.map((b) => (
                <div key={b.charity_id ?? b.charity_name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#1a1a1a] text-sm font-semibold">{b.charity_name}</span>
                    <span className="text-[#555] text-sm font-bold">{fmt(b.total)} {ccy}</span>
                  </div>
                  <div className="h-2 bg-[#f0ece4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(b.total / maxCharity) * 100}%`, background: CATEGORY_COLORS[b.category] ?? '#aaa' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Breakdown by category */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5f2ed]">
            <h2 className="text-[#1a1a1a] font-black text-base">By category</h2>
          </div>
          <div className="p-5 space-y-3">
            {(stats?.by_category ?? []).length === 0 ? (
              <p className="text-[#aaa] text-sm py-6 text-center">No data yet.</p>
            ) : (
              stats!.by_category.map((b) => (
                <div key={b.category} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[b.category] ?? '#aaa' }} />
                  <span className="text-[#1a1a1a] text-sm font-medium capitalize flex-1">{b.category}</span>
                  <span className="text-[#888] text-xs">{b.count} donation{b.count === 1 ? '' : 's'}</span>
                  <span className="text-[#1a1a1a] text-sm font-bold w-28 text-right">{fmt(b.total)} {ccy}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Employee charity suggestions */}
      {pendingSuggestions.length > 0 && (
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5f2ed] flex items-center gap-2">
            <Lightbulb size={16} className="text-[#fbbf24]" />
            <h2 className="text-[#1a1a1a] font-black text-base">Employee charity suggestions</h2>
            <span className="text-[10px] font-bold bg-[#fff4d6] text-[#b8860b] px-2 py-0.5 rounded-full">{pendingSuggestions.length}</span>
          </div>
          <div className="divide-y divide-[#f8f5f0]">
            {pendingSuggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[#1a1a1a] font-semibold text-sm">{s.charity_name}</p>
                  {s.reason && <p className="text-[#888] text-xs mt-0.5 truncate">{s.reason}</p>}
                  {s.charity_website && <p className="text-[#4a85e8] text-xs mt-0.5 truncate">{s.charity_website}</p>}
                </div>
                <button
                  onClick={() => reviewSuggestion(s.id, 'approved')}
                  className="flex items-center gap-1 bg-[#c9f158] hover:bg-[#b8e047] text-[#1a1a1a] text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  onClick={() => reviewSuggestion(s.id, 'rejected')}
                  className="flex items-center gap-1 bg-[#f5f2ed] hover:bg-[#ece7df] text-[#888] text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                >
                  <X size={13} /> Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charities list */}
      <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f5f2ed]">
          <h2 className="text-[#1a1a1a] font-black text-base">Available charities</h2>
          <p className="text-[#aaa] text-xs mt-0.5">Platform-wide and your company's charities</p>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
        ) : charities.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center"><Building2 size={36} className="mx-auto mb-2 text-[#ddd]" /><p className="text-[#888] text-sm font-medium">No charities yet</p></div>
          </div>
        ) : (
          <div className="divide-y divide-[#f8f5f0]">
            {charities.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (CATEGORY_COLORS[c.category] ?? '#aaa') + '33' }}>
                  <Heart size={16} style={{ color: CATEGORY_COLORS[c.category] ?? '#888' }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[#1a1a1a] font-semibold text-sm">{c.name}</p>
                    {c.is_platform_wide && <span className="text-[9px] font-bold bg-[#eef2ff] text-[#4a85e8] px-2 py-0.5 rounded-full uppercase tracking-wide">Platform</span>}
                    {!c.is_active && <span className="text-[9px] font-bold bg-[#f5f2ed] text-[#aaa] px-2 py-0.5 rounded-full uppercase tracking-wide">Disabled</span>}
                  </div>
                  {c.description && <p className="text-[#888] text-xs mt-0.5 truncate">{c.description}</p>}
                </div>
                <span className="text-[#aaa] text-xs capitalize">{c.category}</span>
                {!c.is_platform_wide && (
                  <button
                    onClick={() => toggleActive(c)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                      c.is_active ? 'bg-[#f5f2ed] hover:bg-[#ece7df] text-[#888]' : 'bg-[#c9f158] hover:bg-[#b8e047] text-[#1a1a1a]'
                    }`}
                  >
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
