import { useEffect, useState } from 'react';
import { Megaphone, Filter, GitCompareArrows, Download } from 'lucide-react';
import { campaignsApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

interface Stats { live: number; scheduled: number; avg_conversion_pct: number; spend_mtd: number; }
interface CampaignRow {
  id: number; name: string; status: string; description: string | null; audience: string | null;
  reach: number; conversion_pct: number; budget: number; spend: number; starts_at: string | null;
}
interface Funnel {
  campaign_id: number; campaign_name: string; delivered: number; opened: number; tapped: number;
  redeemed: number; cac: number | null; roas: number | null;
}
interface CalendarDay { date: string; campaigns: { id: number; name: string; status: string }[]; }
interface Overview { stats: Stats; campaigns: CampaignRow[]; funnel: Funnel | null; calendar: CalendarDay[]; }

const STATUS_COLOR: Record<string, string> = { live: '#22c55e', scheduled: '#fbbf24', draft: '#aaa', ended: '#888' };

function fmtALL(n: number) { return `${Math.round(n).toLocaleString()} ALL`; }
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`; }

function weekdayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' });
}
function dayLabel(iso: string) {
  return new Date(iso).getDate();
}

export default function CampaignsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [focalId, setFocalId] = useState<number | null>(null);

  useEffect(() => {
    campaignsApi.overview()
      .then((r) => setData(r.data as Overview))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Top-bar action: export the campaign roster.
  usePageAction({
    label: 'Export CSV',
    icon: <Download size={15} strokeWidth={2.5} />,
    onClick: () => {
      const rows = data?.campaigns ?? [];
      const csv = [['Name', 'Status', 'Audience', 'Reach', 'Conversion%', 'Budget', 'Spend'],
        ...rows.map(c => [c.name, c.status, c.audience ?? '', c.reach, c.conversion_pct + '%', c.budget, c.spend])
      ].map(r => r.join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'campaigns.csv'; a.click();
    },
    disabled: loading || !data?.campaigns?.length,
  }, [data, loading]);

  const selectFocal = (id: number) => {
    if (compareMode) {
      setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]));
      return;
    }
    setFocalId(id);
    campaignsApi.funnel(id).then((r) => {
      if (!data) return;
      setData({ ...data, funnel: r.data as Funnel });
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="rounded-3xl bg-[#e8e3db]/60 h-36" />)}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="bg-white border border-[#ede9e2] rounded-2xl p-10 text-center text-[#aaa]">Couldn't load campaigns data.</div>;
  }

  const { stats, calendar } = data;
  const campaigns = statusFilter ? data.campaigns.filter((c) => c.status === statusFilter) : data.campaigns;
  const compared = compareMode ? data.campaigns.filter((c) => compareIds.includes(c.id)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1a1a1a] text-2xl font-black tracking-tight">Campaigns</h2>
        <p className="text-[#aaa] text-sm mt-0.5">Run growth campaigns and promotional events</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-[#c9f158] p-6 flex flex-col justify-between h-36">
          <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Live</span>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.live}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Scheduled</span>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.scheduled}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Avg Conversion</span>
          <div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.avg_conversion_pct}%</p>
            <p className="text-[#22c55e] text-xs mt-1.5 font-semibold">+6pts</p>
          </div>
        </div>
        <div className="rounded-3xl bg-[#1a1a1a] p-6 flex flex-col justify-between h-36">
          <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Spend MTD</span>
          <p className="text-white text-3xl font-black leading-none tracking-tight">{fmtK(stats.spend_mtd)} ALL</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* All campaigns */}
        <div className="lg:col-span-2 bg-white border border-[#ede9e2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1a1a1a] font-black text-lg">All campaigns</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter(statusFilter ? null : 'live')}
                className="flex items-center gap-1.5 text-[#888] text-xs font-bold border border-[#ede9e2] px-3 py-1.5 rounded-full hover:bg-[#faf8f5]"
              >
                <Filter size={12} /> {statusFilter ? `Filter: ${statusFilter}` : 'Filter'}
              </button>
              <button
                onClick={() => { setCompareMode(!compareMode); setCompareIds([]); }}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-full transition-colors ${compareMode ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'text-[#888] border-[#ede9e2] hover:bg-[#faf8f5]'}`}
              >
                <GitCompareArrows size={12} /> Compare
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {campaigns.map((c) => {
              const selected = compareMode ? compareIds.includes(c.id) : focalId === c.id || (!focalId && data.funnel?.campaign_id === c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => selectFocal(c.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${selected ? 'bg-[#faf8f5] ring-1 ring-[#1a1a1a]/10' : 'hover:bg-[#faf8f5]'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                    <Megaphone size={15} className="text-[#c9f158]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[#1a1a1a] text-sm font-bold truncate">{c.name}</p>
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${STATUS_COLOR[c.status]}1a`, color: STATUS_COLOR[c.status] }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[#aaa] text-xs mt-0.5 truncate">{c.description} · {c.audience}</p>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0 text-right">
                    <div><p className="text-[#1a1a1a] text-sm font-bold">{fmtK(c.reach)}</p><p className="text-[#ccc] text-[9px] font-bold uppercase">Reach</p></div>
                    <div><p className="text-[#1a1a1a] text-sm font-bold">{c.conversion_pct}%</p><p className="text-[#ccc] text-[9px] font-bold uppercase">Conv</p></div>
                    <div><p className="text-[#1a1a1a] text-sm font-bold">{fmtK(c.budget)}</p><p className="text-[#ccc] text-[9px] font-bold uppercase">Budget</p></div>
                  </div>
                </button>
              );
            })}
          </div>

          {compareMode && compared.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {compared.map((c) => (
                <div key={c.id} className="bg-[#faf8f5] rounded-xl p-4">
                  <p className="text-[#1a1a1a] text-sm font-bold">{c.name}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div><p className="text-[#1a1a1a] text-sm font-black">{fmtK(c.reach)}</p><p className="text-[#aaa] text-[9px] uppercase font-bold">Reach</p></div>
                    <div><p className="text-[#1a1a1a] text-sm font-black">{c.conversion_pct}%</p><p className="text-[#aaa] text-[9px] uppercase font-bold">Conv</p></div>
                    <div><p className="text-[#1a1a1a] text-sm font-black">{fmtALL(c.spend)}</p><p className="text-[#aaa] text-[9px] uppercase font-bold">Spend</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Funnel */}
        <div className="bg-[#0b1416] rounded-2xl p-6">
          <h3 className="text-white font-black text-lg mb-4">Funnel · {data.funnel?.campaign_name ?? '—'}</h3>
          {data.funnel ? (
            <>
              <div className="space-y-3 mb-5">
                {([
                  ['Delivered', data.funnel.delivered, '#60a5fa'],
                  ['Opened', data.funnel.opened, '#a78bfa'],
                  ['Tapped', data.funnel.tapped, '#fbbf24'],
                  ['Redeemed', data.funnel.redeemed, '#c9f158'],
                ] as [string, number, string][]).map(([label, value, color]) => {
                  const pct = data.funnel!.delivered > 0 ? (value / data.funnel!.delivered) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[rgba(255,255,255,0.5)] text-[11px] font-semibold">{label}</span>
                        <span className="text-white text-xs font-bold">{value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3.5">
                  <p className="text-[rgba(255,255,255,0.4)] text-[9px] font-bold uppercase tracking-wider">CAC</p>
                  <p className="text-white text-xl font-black mt-1">{data.funnel.cac != null ? `${data.funnel.cac} ALL` : '—'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3.5">
                  <p className="text-[rgba(255,255,255,0.4)] text-[9px] font-bold uppercase tracking-wider">ROAS</p>
                  <p className="text-white text-xl font-black mt-1">{data.funnel.roas != null ? `${data.funnel.roas}×` : '—'}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[rgba(255,255,255,0.3)] text-sm">No live campaigns yet.</p>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
        <h3 className="text-[#1a1a1a] font-black text-lg mb-4">Calendar · next 7 days</h3>
        <div className="grid grid-cols-7 gap-3">
          {calendar.map((day) => (
            <div key={day.date} className="bg-[#faf8f5] rounded-xl p-3 min-h-[110px]">
              <p className="text-[#aaa] text-[10px] font-bold uppercase">{weekdayLabel(day.date)}</p>
              <p className="text-[#1a1a1a] text-lg font-black mb-2">{dayLabel(day.date)}</p>
              <div className="space-y-1">
                {day.campaigns.map((c) => (
                  <span
                    key={c.id}
                    className="block text-[10px] font-bold px-2 py-1 rounded-full truncate"
                    style={{ background: `${STATUS_COLOR[c.status]}1a`, color: STATUS_COLOR[c.status] }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
