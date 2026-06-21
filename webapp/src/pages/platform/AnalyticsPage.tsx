import { useEffect, useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight, Download, ArrowRight,
  AlertTriangle, TrendingUp, Repeat2,
} from 'lucide-react';
import { analyticsApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WeekPoint { label: string; value: number; }
interface PeakDay { date: string; label: string; weekday: string; value: number; }
interface SpendVelocity {
  weeks: WeekPoint[]; approved_total: number; wow_pct: number;
  peak_day: PeakDay | null; avg_7d: number; variance_pct: number; forecast_30d: number;
}
interface TopCategory { category: string; share_pct: number; wow_delta: number; }
interface FunnelStage { label: string; value: number; pct_change: number | null; }
interface ConversionFunnel { stages: FunnelStage[]; overall_conv_pct: number; wow_pts: number; }
interface RedeemHeatmap { weekdays: string[]; hours: number[]; grid: number[][]; peak_label: string; }
interface GeoItem { label: string; amount: number; share_pct: number; }
interface TopProvider {
  name: string; city: string; gmv: number; redemptions: number;
  rate_pct: number; wow_pct: number; health_status: string;
}
interface TopOffer { title: string; provider_name: string; value: number; rate_pct: number; rank: number; }
interface RetentionCohort { label: string; size: number; weeks: (number | null)[]; }
interface RetentionCohorts { cohorts: RetentionCohort[]; median_w4_retention: number; }
interface AiInsight { type: string; title: string; body: string; }

interface Overview {
  spend_velocity: SpendVelocity;
  top_categories: TopCategory[];
  conversion_funnel: ConversionFunnel;
  redeem_heatmap: RedeemHeatmap;
  geography: GeoItem[];
  top_providers: TopProvider[];
  top_offers: TopOffer[];
  retention_cohorts: RetentionCohorts;
  ai_insights: AiInsight[];
}

const CAT_COLOR: Record<string, string> = {
  wellness: '#a78bfa', fitness: '#4ade80', food: '#fb923c',
  travel: '#60a5fa', learning: '#fbbf24', health: '#f472b6', other: '#94a3b8',
};

const HEALTH_COLOR: Record<string, string> = {
  healthy: '#4ade80', watch: '#fbbf24', down: '#f87171',
};

const AI_ICON: Record<string, React.ElementType> = {
  anomaly: AlertTriangle, opportunity: TrendingUp, retention: Repeat2,
};

function fmtALL(n: number) { return `${Math.round(n).toLocaleString()} ALL`; }
function fmtDelta(n: number, suffix = '%') {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}${suffix}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.overview()
      .then((r) => setData(r.data as Overview))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Top-bar action: export a CSV analytics report (categories + top providers/offers).
  usePageAction({
    label: 'Export report',
    icon: <Download size={15} strokeWidth={2.5} />,
    onClick: () => {
      if (!data) return;
      const lines: string[] = [];
      lines.push('Top Categories');
      lines.push('Category,Share%,WoW Delta');
      data.top_categories.forEach(c => lines.push(`${c.category},${c.share_pct}%,${c.wow_delta}`));
      lines.push('');
      lines.push('Top Providers');
      lines.push('Provider,City,GMV,Redemptions,Rate%');
      data.top_providers.forEach(p => lines.push(`${p.name},${p.city},${p.gmv},${p.redemptions},${p.rate_pct}%`));
      lines.push('');
      lines.push('Top Offers');
      lines.push('Rank,Title,Provider,Value,Rate%');
      data.top_offers.forEach(o => lines.push(`${o.rank},"${o.title}",${o.provider_name},${o.value},${o.rate_pct}%`));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); a.download = 'analytics-report.csv'; a.click();
    },
    disabled: loading || !data,
  }, [data, loading]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-72 bg-[#e8e3db]/60 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-[#ede9e2] rounded-2xl p-10 text-center text-[#aaa]">
        Couldn't load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1a1a1a] text-2xl font-black tracking-tight">Analytics</h2>
        <p className="text-[#aaa] text-sm mt-0.5">Platform-wide performance, spend, and engagement trends</p>
      </div>

      {/* Row 1: Spend velocity + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SpendVelocityCard d={data.spend_velocity} /></div>
        <TopCategoriesCard items={data.top_categories} />
      </div>

      {/* Row 2: Conversion funnel + Heatmap + Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ConversionFunnelCard d={data.conversion_funnel} />
        <HeatmapCard d={data.redeem_heatmap} />
        <GeographyCard items={data.geography} />
      </div>

      {/* Row 3: Top providers + Perka AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><TopProvidersCard items={data.top_providers} /></div>
        <PerkaAiCard items={data.ai_insights} />
      </div>

      {/* Row 4: Top offers + Retention cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopOffersCard items={data.top_offers} />
        <div className="lg:col-span-2"><RetentionCohortsCard d={data.retention_cohorts} /></div>
      </div>
    </div>
  );
}

// ─── Spend velocity ───────────────────────────────────────────────────────────

function SpendVelocityCard({ d }: { d: SpendVelocity }) {
  const weeks = d.weeks;
  const max = Math.max(...weeks.map((w) => w.value), 1);
  const W = 560, H = 160, pad = 8;
  const stepX = weeks.length > 1 ? (W - pad * 2) / (weeks.length - 1) : 0;
  const pointFor = (i: number, v: number) => {
    const x = pad + i * stepX;
    const y = pad + (H - pad * 2) * (1 - v / max);
    return [x, y];
  };
  const linePoints = weeks.map((w, i) => pointFor(i, w.value));
  const linePath = linePoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${linePoints[linePoints.length - 1][0]},${H - pad} L${linePoints[0][0]},${H - pad} Z`;

  // Smoothed "previous/forecast" dashed trend (3-point moving average)
  const trendPoints = weeks.map((_, i) => {
    const lo = Math.max(0, i - 1), hi = Math.min(weeks.length - 1, i + 1);
    let sum = 0, count = 0;
    for (let j = lo; j <= hi; j++) { sum += weeks[j].value; count++; }
    return pointFor(i, (sum / count) * 0.88);
  });
  const trendPath = trendPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  const wowUp = d.wow_pct >= 0;

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#888] text-[11px] font-bold uppercase tracking-wider">Spend velocity</p>
          <p className="text-white text-3xl font-black mt-2">{fmtALL(d.approved_total)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${wowUp ? 'bg-[#c9f158]/15 text-[#c9f158]' : 'bg-red-500/15 text-red-400'}`}>
              {wowUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {fmtDelta(d.wow_pct)} WoW
            </span>
          </div>
        </div>
        <button className="flex items-center gap-1 text-[#888] hover:text-white text-xs font-semibold transition-colors">
          <Download size={13} /> Export PDF
        </button>
      </div>

      <div className="mt-4 flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" preserveAspectRatio="none">
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9f158" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#c9f158" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#spendFill)" />
          <path d={trendPath} fill="none" stroke="#666" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d={linePath} fill="none" stroke="#c9f158" strokeWidth="2.5" />
          {linePoints.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#c9f158" />
          ))}
        </svg>
        <div className="flex justify-between mt-1 px-1">
          {weeks.map((w) => (
            <span key={w.label} className="text-[#666] text-[10px] font-medium">{w.label}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[#2a2a2a]">
        <StatCell label="Peak Day" value={d.peak_day?.label ?? '—'} sub={d.peak_day ? `${d.peak_day.weekday} · ${fmtALL(d.peak_day.value)}` : ''} />
        <StatCell label="7D Avg" value={fmtALL(d.avg_7d)} />
        <StatCell label="Variance" value={`${d.variance_pct}%`} />
        <StatCell label="Forecast" value={fmtALL(d.forecast_30d)} lime />
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, lime }: { label: string; value: string; sub?: string; lime?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${lime ? 'bg-[#c9f158]' : 'bg-[#222]'}`}>
      <p className={`text-[9px] font-bold uppercase tracking-wider ${lime ? 'text-[#4a5e00]' : 'text-[#777]'}`}>{label}</p>
      <p className={`text-sm font-black mt-1 truncate ${lime ? 'text-[#1a1a1a]' : 'text-white'}`}>{value}</p>
      {sub && <p className={`text-[10px] mt-0.5 truncate ${lime ? 'text-[#4a5e00]' : 'text-[#777]'}`}>{sub}</p>}
    </div>
  );
}

// ─── Top categories ───────────────────────────────────────────────────────────

function TopCategoriesCard({ items }: { items: TopCategory[] }) {
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a1a1a] font-black uppercase tracking-wide text-sm">Top categories</h3>
        <button className="flex items-center gap-1 text-[#aaa] hover:text-[#1a1a1a] text-xs font-semibold transition-colors">
          Drill in <ArrowRight size={12} />
        </button>
      </div>
      <div className="space-y-3.5 flex-1">
        {items.map((c) => {
          const col = CAT_COLOR[c.category] ?? '#94a3b8';
          const up = c.wow_delta >= 0;
          return (
            <div key={c.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }} />
                  <span className="text-[#333] text-sm font-semibold capitalize">{c.category}</span>
                  <span className={`flex items-center text-[10px] font-bold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                    {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {Math.abs(c.wow_delta)}pt
                  </span>
                </div>
                <span className="text-[#1a1a1a] font-bold text-sm">{c.share_pct}%</span>
              </div>
              <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.share_pct}%`, background: col }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Conversion funnel ────────────────────────────────────────────────────────

function ConversionFunnelCard({ d }: { d: ConversionFunnel }) {
  const max = Math.max(...d.stages.map((s) => s.value), 1);
  return (
    <div className="bg-[#c9f158] rounded-2xl p-6 flex flex-col">
      <h3 className="text-[#1a1a1a] font-black uppercase tracking-wide text-sm mb-4">Conversion funnel</h3>
      <div className="space-y-2.5 flex-1">
        {d.stages.map((s) => {
          const widthPct = Math.max((s.value / max) * 100, 6);
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#1a1a1a] text-xs font-bold">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#1a1a1a] font-black text-sm">{s.value.toLocaleString()}</span>
                  {s.pct_change != null && (
                    <span className="text-[#4a5e00] text-[10px] font-bold bg-[#1a1a1a]/10 px-1.5 py-0.5 rounded-md">
                      {fmtDelta(s.pct_change)}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2.5 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#1a1a1a]" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[#3f4d00] text-xs font-semibold mt-4 pt-3 border-t border-[#1a1a1a]/10">
        Overall conv. {d.overall_conv_pct}% · {fmtDelta(d.wow_pts, ' pts')} WoW
      </p>
    </div>
  );
}

// ─── Redeem heatmap ────────────────────────────────────────────────────────────

function HeatmapCard({ d }: { d: RedeemHeatmap }) {
  const max = Math.max(...d.grid.flat(), 1);
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-6 flex flex-col">
      <h3 className="text-[#1a1a1a] font-black uppercase tracking-wide text-sm">When users redeem</h3>
      <p className="text-[#aaa] text-xs mt-0.5 mb-4">last 30 days</p>

      <div className="flex-1">
        <div className="grid gap-1" style={{ gridTemplateColumns: `28px repeat(${d.hours.length}, 1fr)` }}>
          <div />
          {d.hours.map((h) => (
            <span key={h} className="text-[#bbb] text-[9px] text-center font-medium">{h}</span>
          ))}
          {d.weekdays.map((wd, ri) => (
            <>
              <span key={`label-${wd}`} className="text-[#888] text-[10px] font-semibold flex items-center">{wd}</span>
              {d.grid[ri].map((v, ci) => {
                const intensity = v / max;
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="aspect-square rounded-[3px]"
                    style={{ background: intensity === 0 ? '#f5f2ec' : `rgba(160, 200, 30, ${0.25 + intensity * 0.75})` }}
                    title={`${wd} ${d.hours[ci]}:00 — ${v}`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0ece4]">
        <span className="text-[#1a1a1a] text-xs font-bold">Peak: {d.peak_label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[#bbb] text-[10px]">Less</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
              <span key={o} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: `rgba(160, 200, 30, ${o})` }} />
            ))}
          </div>
          <span className="text-[#bbb] text-[10px]">More</span>
        </div>
      </div>
    </div>
  );
}

// ─── Geography ─────────────────────────────────────────────────────────────────

function GeographyCard({ items }: { items: GeoItem[] }) {
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
      <h3 className="text-[#1a1a1a] font-black uppercase tracking-wide text-sm mb-4">Geography</h3>
      <div className="space-y-3.5">
        {items.map((g) => (
          <div key={g.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#333] text-sm font-semibold">{g.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[#aaa] text-xs">{fmtALL(g.amount)}</span>
                <span className="text-[#1a1a1a] font-bold text-xs w-9 text-right">{g.share_pct}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#1a1a1a]" style={{ width: `${g.share_pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top providers ─────────────────────────────────────────────────────────────

function TopProvidersCard({ items }: { items: TopProvider[] }) {
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h3 className="text-[#1a1a1a] font-black uppercase tracking-wide text-sm">Top providers</h3>
        <button className="flex items-center gap-1 text-[#aaa] hover:text-[#1a1a1a] text-xs font-semibold transition-colors">
          See all <ArrowRight size={12} />
        </button>
      </div>
      <div className="px-6 py-2.5 bg-[#faf8f5] border-y border-[#f0ece4] grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3">
        {['PROVIDER', 'GMV', 'REDEMP.', 'RATE', 'Δ WOW', 'HEALTH'].map((h) => (
          <span key={h} className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">{h}</span>
        ))}
      </div>
      <div className="divide-y divide-[#f8f5f0] flex-1">
        {items.map((p) => {
          const up = p.wow_pct >= 0;
          return (
            <div key={p.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-6 py-3 items-center hover:bg-[#faf8f5] transition-colors">
              <div className="min-w-0">
                <p className="text-[#1a1a1a] text-sm font-semibold truncate">{p.name}</p>
                <p className="text-[#aaa] text-[11px]">{p.city}</p>
              </div>
              <span className="text-[#333] text-sm font-medium">{fmtALL(p.gmv)}</span>
              <span className="text-[#333] text-sm font-medium">{p.redemptions}</span>
              <span className="text-[#333] text-sm font-medium">{p.rate_pct}%</span>
              <span className={`text-xs font-bold ${up ? 'text-emerald-600' : 'text-red-500'}`}>{fmtDelta(p.wow_pct)}</span>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: HEALTH_COLOR[p.health_status] ?? '#ccc' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Perka AI ───────────────────────────────────────────────────────────────────

function PerkaAiCard({ items }: { items: AiInsight[] }) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 h-full flex flex-col">
      <h3 className="text-white font-black uppercase tracking-wide text-sm mb-4 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#c9f158]" /> Perka AI
      </h3>
      <div className="space-y-4 flex-1">
        {items.map((insight, i) => {
          const Icon = AI_ICON[insight.type] ?? TrendingUp;
          return (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#252525] flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-[#c9f158]" />
              </div>
              <div className="min-w-0">
                <p className="text-[#888] text-[10px] font-bold uppercase tracking-wider">{insight.title}</p>
                <p className="text-[#ddd] text-xs leading-relaxed mt-0.5">{insight.body}</p>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-[#666] text-sm">Not enough data yet for insights.</p>}
      </div>
    </div>
  );
}

// ─── Top performing offers ─────────────────────────────────────────────────────

function TopOffersCard({ items }: { items: TopOffer[] }) {
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  const Row = ({ o }: { o: TopOffer }) => (
    <div className="flex items-center gap-2.5 py-2">
      <span className="text-[#ccc] text-xs font-black w-5 flex-shrink-0">#{o.rank}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[#1a1a1a] text-sm font-semibold truncate">{o.title}</p>
        <p className="text-[#aaa] text-[11px] truncate">{o.provider_name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[#1a1a1a] text-sm font-bold">{o.value}</p>
        <p className="text-[#aaa] text-[10px]">{o.rate_pct}% redeem</p>
      </div>
    </div>
  );
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
      <h3 className="text-[#1a1a1a] font-black uppercase tracking-wide text-sm mb-3">Top performing offers</h3>
      <div className="grid grid-cols-2 gap-x-4 divide-y divide-[#f8f5f0]">
        <div className="divide-y divide-[#f8f5f0]">{left.map((o) => <Row key={o.rank} o={o} />)}</div>
        <div className="divide-y divide-[#f8f5f0]">{right.map((o) => <Row key={o.rank} o={o} />)}</div>
      </div>
    </div>
  );
}

// ─── Retention cohorts ──────────────────────────────────────────────────────────

function RetentionCohortsCard({ d }: { d: RetentionCohorts }) {
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a1a1a] font-black uppercase tracking-wide text-sm">Retention cohorts</h3>
        <button className="flex items-center gap-1 text-[#aaa] hover:text-[#1a1a1a] text-xs font-semibold transition-colors">
          <Download size={12} /> Export CSV
        </button>
      </div>
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr>
            <th className="text-left text-[#aaa] text-[10px] font-bold uppercase tracking-wider pb-2">Cohort</th>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((w) => (
              <th key={w} className="text-center text-[#aaa] text-[10px] font-bold uppercase tracking-wider pb-2">W{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.cohorts.map((c) => (
            <tr key={c.label}>
              <td className="text-[#333] text-xs font-semibold py-1 pr-2 whitespace-nowrap">{c.label} <span className="text-[#bbb]">({c.size})</span></td>
              {c.weeks.map((v, i) => (
                <td key={i} className="py-1 px-0.5">
                  {v == null ? (
                    <div className="h-7 rounded-md bg-[#f7f5f0]" />
                  ) : (
                    <div
                      className="h-7 rounded-md flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: `rgba(160, 200, 30, ${0.15 + (v / 100) * 0.7})`,
                        color: v > 60 ? '#2c3a00' : '#6b7a2e',
                      }}
                    >
                      {v}%
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[#aaa] text-xs font-medium mt-3 pt-3 border-t border-[#f0ece4]">
        Median W4 retention: <span className="text-[#1a1a1a] font-bold">{d.median_w4_retention}%</span>
      </p>
    </div>
  );
}
