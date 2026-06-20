import { useEffect, useState } from 'react';
import { CalendarDays, TrendingUp, Building2, ChevronRight } from 'lucide-react';
import { employerApi } from '../../lib/api';

interface WalletRow {
  company_id: number; company_name: string; seats: number;
  budget: number; used: number; utilization_pct: number; currency: string;
}

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employerApi.wallets()
      .then(r => setWallets(r.data as WalletRow[]))
      .catch(() => setWallets([]))
      .finally(() => setLoading(false));
  }, []);

  const totalBudget = wallets.reduce((s, w) => s + w.budget, 0);
  const totalUsed = wallets.reduce((s, w) => s + w.used, 0);
  const totalSeats = wallets.reduce((s, w) => s + w.seats, 0);
  const avgPerSeat = totalSeats > 0 ? Math.round(totalBudget / totalSeats) : 0;
  const usagePct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  const currency = wallets[0]?.currency ?? 'ALL';

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Pooled Budget</span>
              <CalendarDays size={16} className="text-[#4a5e00]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{fmtM(totalBudget)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Used This Month</span>
              <TrendingUp size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-3xl font-black leading-none">{fmtM(totalUsed)}</p>
              {usagePct > 0 && <p className="text-green-500 text-[10px] font-bold mt-1">↑ {usagePct}%</p>}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Companies</span>
              <Building2 size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{wallets.length}</p>
          </div>
          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Avg. Per Seat</span>
              <TrendingUp size={16} className="text-[#666]" />
            </div>
            <p className="text-white text-3xl font-black leading-none">
              {avgPerSeat > 0 ? `${avgPerSeat.toLocaleString()} ${currency}` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Company wallets table */}
      <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-base">Company wallets</h2>
            <p className="text-[#aaa] text-xs mt-0.5">Budgets and utilization</p>
          </div>
          <button className="flex items-center gap-1 text-[#555] hover:text-[#1a1a1a] text-sm font-semibold transition-colors">
            New top-up <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_60px_140px_140px_1fr_100px] gap-4 px-6 py-2.5 bg-[#faf8f5] border-b border-[#f0ece4]">
          {['Company','Seats','Budget','Used','Utilization','Action'].map(h => (
            <span key={h} className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
        ) : wallets.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center"><Building2 size={36} className="mx-auto mb-2 text-[#ddd]" /><p className="text-[#888] text-sm font-medium">No wallet data yet</p></div>
          </div>
        ) : (
          <div className="divide-y divide-[#f8f5f0]">
            {wallets.map(w => {
              const left = w.budget - w.used;
              const barColor = w.utilization_pct >= 85 ? '#fb923c' : w.utilization_pct >= 70 ? '#fbbf24' : '#1a1a1a';
              return (
                <div key={w.company_id} className="grid grid-cols-[1fr_60px_140px_140px_1fr_100px] gap-4 px-6 py-4 items-center hover:bg-[#faf8f5] transition-colors">
                  <span className="text-[#1a1a1a] font-semibold text-sm">{w.company_name}</span>
                  <span className="text-[#555] text-sm">{w.seats}</span>
                  <span className="text-[#555] text-sm">{w.budget.toLocaleString()} {w.currency}</span>
                  <span className="text-[#555] text-sm">{w.used.toLocaleString()} {w.currency}</span>
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-[#888] font-bold">{w.utilization_pct}%</span>
                      <span className="text-[#bbb]">{left.toLocaleString()} {w.currency} left</span>
                    </div>
                    <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, w.utilization_pct)}%`, background: barColor }} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="bg-[#c9f158] hover:bg-[#b8e047] text-[#1a1a1a] text-xs font-bold px-4 py-2 rounded-full transition-colors">
                      Top up
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
