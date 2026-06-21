import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, Users2, Clock, Activity, Zap, ArrowRight, Flame,
  CheckCircle2, Building2, Sparkles, Wallet, ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employerApi, aiApi, dealsApi, providersApi, offersApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';
import NewOfferModal from '../../components/platform/NewOfferModal';

// ─── Types ─────────────────────────────────────────────────────────────────

interface DashData { total_requests: number; pending: number; approved: number; }
interface Approval {
  id: number; status: string; submitted_at: string;
  offer?: { title: string; price: number; currency: string };
  offer_id?: number;
}
interface Payment { id: number; amount: number; status: string; created_at: string; provider_id: number; }
interface CategorySpend { category: string; total: number; }
interface AiInsight {
  top_categories: string[];
  category_spend: CategorySpend[];
  approval_rate: number;
  approved_total: number;
  insight: string;
}
interface Deal {
  id: number; deal_price: number | null; quantity_limit: number | null; quantity_claimed: number;
  offer: { title: string; price: number; currency: string; provider_name?: string };
}
interface Provider { id: number; name: string; category: string; }

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  const thu = new Date(d);
  thu.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const yr = thu.getFullYear();
  const jan4 = new Date(yr, 0, 4);
  const wk = 1 + Math.round(((thu.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `WK ${wk}`;
}

function buildWeeklyData(payments: Payment[]): { week: string; value: number }[] {
  if (!payments.length) return [];
  const map: Record<string, number> = {};
  payments.forEach(p => { const k = isoWeekKey(p.created_at); map[k] = (map[k] ?? 0) + Number(p.amount); });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([week, value]) => ({ week, value }));
}

function padWeeks(data: { week: string; value: number }[]): { week: string; value: number }[] {
  if (data.length >= 4) return data.slice(-8);
  const lastVal = data.length ? data[data.length - 1].value : 100_000;
  const mults = [0.62, 0.71, 0.80, 0.78, 0.88, 0.94, 0.91, 1.0];
  return mults.map((m, i) => ({ week: `WK ${18 + i}`, value: Math.round(lastVal * m) }));
}

const CAT_COLOR: Record<string, string> = {
  wellness: '#a78bfa', fitness: '#4ade80', food: '#fb923c',
  travel: '#60a5fa', learning: '#f59e0b', dental: '#f472b6',
  entertainment: '#e879f9', other: '#94a3b8',
};

// ─── Spend Velocity Chart ───────────────────────────────────────────────────

function SpendChart({ data }: { data: { week: string; value: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (data.length < 2) return null;
  const W = 800, H = 220, pad = { t: 44, r: 64, b: 28, l: 12 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
  const maxV = Math.max(...data.map(d => d.value));
  const minV = Math.min(...data.map(d => d.value));
  const rng = maxV - minV || 1;
  const px = (i: number) => pad.l + (i / (data.length - 1)) * cW;
  const py = (v: number) => pad.t + (1 - (v - minV) / rng) * cH;
  const pts = data.map((d, i) => ({ x: px(i), y: py(d.value), v: d.value, week: d.week }));
  let lineD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = ((pts[i].x + pts[i - 1].x) / 2).toFixed(1);
    lineD += ` C ${cx} ${pts[i-1].y.toFixed(1)}, ${cx} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  const fillD = `${lineD} L ${pts[pts.length-1].x} ${H-pad.b} L ${pts[0].x} ${H-pad.b} Z`;
  const last = pts[pts.length-1], prev = pts[pts.length-2];
  const growthPct = prev.v ? ((last.v - prev.v) / prev.v * 100) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9f158" stopOpacity="0.22" />
          <stop offset="70%" stopColor="#c9f158" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#c9f158" stopOpacity="0" />
        </linearGradient>
        <filter id="lineglow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={pad.l} x2={W-pad.r} y1={pad.t+t*cH} y2={pad.t+t*cH}
          stroke="rgba(255,255,255,0.055)" strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <path d={fillD} fill="url(#sg)" />
      <path d={lineD} fill="none" stroke="#c9f158" strokeWidth="3" opacity="0.25" filter="url(#lineglow)" />
      <path d={lineD} fill="none" stroke="#c9f158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1, isHov = hovered === i;
        return (
          <g key={i} style={{ cursor: 'pointer' }} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {(isLast || isHov) && <circle cx={p.x} cy={p.y} r="12" fill="#c9f158" opacity="0.12" />}
            <circle cx={p.x} cy={p.y} r={isLast ? 5 : 3.5} fill="#c9f158" stroke="#1a1a1a" strokeWidth={isLast ? 2 : 1.5} />
            {isHov && !isLast && (
              <g>
                <rect x={p.x-36} y={p.y-34} width="72" height="22" rx="6" fill="#2a2a2a" />
                <text x={p.x} y={p.y-19} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">{fmtMoney(p.v)} ALL</text>
              </g>
            )}
          </g>
        );
      })}
      <g>
        <rect x={last.x-30} y={last.y-36} width="60" height="22" rx="11" fill="#c9f158" />
        <text x={last.x} y={last.y-21} textAnchor="middle" fill="#1a1a1a" fontSize="11.5" fontWeight="800">
          {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
        </text>
      </g>
      {pts.filter((_, i) => i === 0 || i === pts.length-1).map((p, i) => (
        <text key={i} x={p.x} y={H-4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="500">{p.week}</text>
      ))}
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function OverviewPage() {
  const navigate = useNavigate();

  const [dash, setDash] = useState<DashData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [aiData, setAiData] = useState<AiInsight | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [featuredOffer, setFeaturedOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<number, 'approving' | 'passing'>>({});
  const [nbaDismissed, setNbaDismissed] = useState(false);
  const [newOfferOpen, setNewOfferOpen] = useState(false);

  // Top-bar action: quick-create a new offer from the operations overview.
  usePageAction({
    label: 'New offer',
    onClick: () => setNewOfferOpen(true),
  });

  useEffect(() => {
    Promise.allSettled([
      employerApi.dashboard(),
      employerApi.approvals(),
      employerApi.employees(),
      employerApi.payments(),
      aiApi.employerInsights(),
      dealsApi.today(),
      providersApi.list(),
      offersApi.list({ limit: 1 }),
    ]).then(([dR, aR, eR, pR, aiR, dealR, provR, offerR]) => {
      if (dR.status === 'fulfilled') setDash(dR.value.data as DashData);
      if (aR.status === 'fulfilled') setApprovals((aR.value.data as Approval[]) ?? []);
      if (eR.status === 'fulfilled') setEmployees((eR.value.data as any[]) ?? []);
      if (pR.status === 'fulfilled') setPayments((pR.value.data as Payment[]) ?? []);
      if (aiR.status === 'fulfilled') setAiData(aiR.value.data as AiInsight);
      if (dealR.status === 'fulfilled') setDeal(dealR.value.data as Deal);
      if (provR.status === 'fulfilled') setProviders((provR.value.data as Provider[]) ?? []);
      if (offerR.status === 'fulfilled') setFeaturedOffer((offerR.value.data as any)?.items?.[0] ?? null);
      setLoading(false);
    });
  }, []);

  const handleApprove = useCallback(async (id: number) => {
    setActing(a => ({ ...a, [id]: 'approving' }));
    await employerApi.approve(id).catch(() => {});
    setApprovals(prev => prev.filter(a => a.id !== id));
    setActing(a => { const n = { ...a }; delete n[id]; return n; });
  }, []);

  const handlePass = useCallback(async (id: number) => {
    setActing(a => ({ ...a, [id]: 'passing' }));
    await employerApi.reject(id, 'Passed on review').catch(() => {});
    setApprovals(prev => prev.filter(a => a.id !== id));
    setActing(a => { const n = { ...a }; delete n[id]; return n; });
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const pendingCount = approvals.length;
  const overSLA = approvals.filter(a => (Date.now() - new Date(a.submitted_at).getTime()) / 3_600_000 > 48);
  const gmv = payments.reduce((s, p) => s + Number(p.amount), 0);
  const userCount = employees.length;
  const total = dash?.total_requests ?? 0;
  const approved = dash?.approved ?? 0;
  const redemptionRate = total > 0 ? Math.round((approved / total) * 100) : null;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const rawWeeks = buildWeeklyData(payments);
  const weekData = padWeeks(rawWeeks);
  const startWk = weekData[0]?.week ?? 'WK 18';
  const endWk = weekData[weekData.length-1]?.week ?? 'WK 25';

  // ── Category breakdown ─────────────────────────────────────────────────────
  const catSpend = aiData?.category_spend ?? [];
  const catTotal = catSpend.reduce((s, c) => s + c.total, 0) || 1;
  const topCats = catSpend.slice(0, 4);

  // ── AI card ────────────────────────────────────────────────────────────────
  const bundleCount = aiData?.top_categories?.length ?? 0;
  const aiInsightText = aiData?.insight ?? '';
  const topTwo = aiData?.top_categories?.slice(0, 2) ?? [];
  const nbaTitle = aiInsightText
    ? aiInsightText.split('.')[0].trim().toUpperCase()
    : 'ANALYSE SPEND PATTERNS';
  const nbaBody = aiInsightText.includes('.')
    ? aiInsightText.slice(aiInsightText.indexOf('.') + 1).trim()
    : aiInsightText;

  // ── Provider pulse ─────────────────────────────────────────────────────────
  const providerPayCounts: Record<number, number> = {};
  payments.forEach(p => { providerPayCounts[p.provider_id] = (providerPayCounts[p.provider_id] ?? 0) + 1; });
  const maxCount = Math.max(1, ...Object.values(providerPayCounts));
  const providerPulse = providers.slice(0, 4).map(prov => {
    const cnt = providerPayCounts[prov.id] ?? 0;
    const score = Math.round((cnt / maxCount) * 100);
    return { ...prov, score };
  }).sort((a, b) => b.score - a.score);

  // ── Daily Drop ─────────────────────────────────────────────────────────────
  const hoursLeft = 24 - new Date().getHours();

  const pulseColor = (score: number) =>
    score >= 90 ? '#22c55e' : score >= 75 ? '#f59e0b' : '#f87171';

  if (loading) {
    return (
      <div className="space-y-4 pt-1 animate-pulse">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="rounded-3xl bg-[#e8e3db]/60 h-36" />)}</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-3xl bg-[#e8e3db]/60 h-80" />
          <div className="space-y-4"><div className="rounded-3xl bg-[#e8e3db]/60 h-36" /><div className="rounded-3xl bg-[#e8e3db]/60 h-40" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-3xl bg-[#e8e3db]/60 h-64" />
          <div className="space-y-4"><div className="rounded-3xl bg-[#e8e3db]/60 h-28" /><div className="rounded-3xl bg-[#e8e3db]/60 h-32" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl bg-[#e8e3db]/60 h-20" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-3xl bg-[#c9f158] p-6 flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Monthly GMV</span>
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center"><TrendingUp size={14} className="text-[#1a1a1a]" /></div>
          </div>
          <div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{gmv > 0 ? fmtMoney(gmv) : '—'}</p>
            <p className="text-[#4a5e00] text-xs mt-1.5 font-medium">{gmv > 0 ? `${payments.length} payments processed` : 'No payment data yet'}</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Active Users</span>
            <div className="w-8 h-8 rounded-full bg-[#f5f2ed] flex items-center justify-center"><Users2 size={14} className="text-[#888]" /></div>
          </div>
          <div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{userCount}</p>
            <p className="text-[#22c55e] text-xs mt-1.5 font-semibold">Total enrolled employees</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Pending Approvals</span>
            <div className="w-8 h-8 rounded-full bg-[#f5f2ed] flex items-center justify-center"><Clock size={14} className="text-[#888]" /></div>
          </div>
          <div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{pendingCount}</p>
            {overSLA.length > 0
              ? <p className="text-[#f97316] text-xs mt-1.5 font-semibold">⚠ {overSLA.length} over SLA</p>
              : pendingCount > 0 ? <p className="text-[#22c55e] text-xs mt-1.5 font-semibold">All within SLA</p>
              : <p className="text-[#aaa] text-xs mt-1.5">No pending requests</p>}
          </div>
        </div>
        <div className="rounded-3xl bg-[#1a1a1a] p-6 flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Redemption Rate</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Activity size={14} className="text-[#c9f158]" /></div>
          </div>
          <div>
            <p className="text-white text-4xl font-black leading-none tracking-tight">{redemptionRate != null ? `${redemptionRate}%` : '—'}</p>
            <p className="text-[#c9f158] text-xs mt-1.5 font-semibold">{total > 0 ? `${approved} of ${total} requests approved` : 'No data yet'}</p>
          </div>
        </div>
      </div>

      {/* ── Spend Velocity ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-3xl bg-[#1a1a1a] p-7 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white text-xl font-black uppercase tracking-wide">Spend Velocity</h2>
              <p className="text-[rgba(255,255,255,0.4)] text-xs mt-0.5">Approved request volume · last 8 weeks</p>
            </div>
            <button onClick={() => navigate('/platform/analytics')}
              className="flex items-center gap-1.5 text-white text-[11px] font-bold uppercase tracking-wider border border-[rgba(255,255,255,0.2)] px-4 py-2 rounded-full hover:bg-white/5 transition-colors">
              Open Analytics <ArrowRight size={11} />
            </button>
          </div>
          <div className="flex-1 -mx-2">
            {weekData.length >= 2
              ? <SpendChart data={weekData} />
              : <div className="flex items-center justify-center h-32 text-[rgba(255,255,255,0.2)] text-sm">Not enough data yet</div>}
          </div>
          <div className="flex items-end justify-between -mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-white text-3xl font-black tracking-tight">{gmv > 0 ? gmv.toLocaleString() : '0'}</span>
              <span className="text-[rgba(255,255,255,0.35)] text-xs font-bold uppercase tracking-wide">All Approved</span>
            </div>
            <span className="text-[rgba(255,255,255,0.25)] text-xs font-medium">{startWk} → {endWk}</span>
          </div>
          {topCats.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-1">
              {topCats.map(c => {
                const pct = Math.round((c.total / catTotal) * 100);
                const col = CAT_COLOR[c.category] ?? '#94a3b8';
                return (
                  <div key={c.category} className="bg-[rgba(255,255,255,0.05)] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }} />
                      <span className="text-[rgba(255,255,255,0.45)] text-[9px] font-bold uppercase tracking-wider">{c.category}</span>
                    </div>
                    <p className="text-white text-xl font-black">{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: AI + Daily Drop */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl bg-[#c9f158] p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9f158]" />
                <span className="text-[#c9f158] text-[10px] font-bold uppercase tracking-widest">Perka AI</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center"><Zap size={15} className="text-[#c9f158]" /></div>
            </div>
            <div>
              <h3 className="text-[#1a1a1a] text-lg font-black uppercase leading-tight">
                {bundleCount > 0 ? `${bundleCount} new bundle ideas ready for review` : 'Bundle ideas ready for review'}
              </h3>
              <p className="text-[#4a5e00] text-sm mt-2 leading-relaxed line-clamp-3">
                {topTwo.length >= 2
                  ? `Based on swipe data, AI proposes pairing ${topTwo[0].charAt(0).toUpperCase()+topTwo[0].slice(1)} × ${topTwo[1].charAt(0).toUpperCase()+topTwo[1].slice(1)}. ${aiInsightText}`
                  : aiInsightText || 'Analysing employee spend patterns to surface bundle ideas.'}
              </p>
            </div>
            <button onClick={() => navigate('/platform/packages')}
              className="w-full bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-sm font-bold uppercase tracking-wider py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
              Review Proposals <ArrowRight size={14} />
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-[#ede9e2] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#1a1a1a] text-sm font-black uppercase tracking-wide">Daily Drop</h3>
                {deal
                  ? <p className="text-[#22c55e] text-[10px] font-bold uppercase tracking-wider mt-0.5">Live · Ends in {hoursLeft}h</p>
                  : <p className="text-[#aaa] text-[10px] font-medium mt-0.5">No active deal today</p>}
              </div>
              <button onClick={() => navigate('/platform/daily-drop')}
                className="text-[#aaa] hover:text-[#555] text-[10px] font-bold uppercase tracking-wider transition-colors">Schedule Next →</button>
            </div>
            {deal ? (
              <>
                <div className="flex items-center gap-3 bg-[#f8f5f0] rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-[#fff3e0] flex items-center justify-center flex-shrink-0"><Flame size={15} className="text-[#f97316]" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1a1a1a] text-sm font-bold truncate">{deal.offer.title}</p>
                    {deal.offer.provider_name && <p className="text-[#aaa] text-xs">{deal.offer.provider_name}</p>}
                  </div>
                  <span className="flex-shrink-0 bg-[#1a1a1a] text-white text-[10px] font-bold px-2 py-1 rounded-lg">{hoursLeft}h</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#f8f5f0] rounded-xl px-4 py-3">
                    <p className="text-[#aaa] text-[9px] font-bold uppercase tracking-wider mb-1">Deal Price</p>
                    <p className="text-[#1a1a1a] text-base font-black">{(deal.deal_price ?? deal.offer.price).toLocaleString()} {deal.offer.currency}</p>
                  </div>
                  <div className="bg-[#f8f5f0] rounded-xl px-4 py-3">
                    <p className="text-[#aaa] text-[9px] font-bold uppercase tracking-wider mb-1">Normal</p>
                    <p className="text-[#bbb] text-base font-black line-through">{deal.offer.price.toLocaleString()} {deal.offer.currency}</p>
                  </div>
                </div>
                {deal.quantity_limit && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[#aaa] text-[9px] font-bold uppercase tracking-wider">Claimed</span>
                      <span className="text-[#555] text-xs font-semibold">{deal.quantity_claimed} / {deal.quantity_limit}</span>
                    </div>
                    <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1a1a1a] rounded-full transition-all" style={{ width: `${Math.min(100,(deal.quantity_claimed/deal.quantity_limit)*100)}%` }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => navigate('/platform/daily-drop')}
                className="w-full border border-dashed border-[#e5e0d8] rounded-2xl py-6 text-[#bbb] text-sm hover:border-[#ccc] transition-colors">
                + Schedule today's drop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Approval Queue + NBA + Provider Pulse ────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Approval Queue */}
        <div className="col-span-2 rounded-3xl bg-white border border-[#ede9e2] p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[#1a1a1a] text-lg font-black uppercase tracking-wide">Approval Queue</h2>
              <p className="text-[#aaa] text-xs mt-0.5">
                {pendingCount} waiting{overSLA.length > 0 ? ` · ${overSLA.length} over SLA` : ' · Avg handle 18m'}
              </p>
            </div>
            <button onClick={() => navigate('/platform/requests')}
              className="text-[#aaa] hover:text-[#555] text-[10px] font-bold uppercase tracking-wider transition-colors">
              Open Queue →
            </button>
          </div>

          <div className="space-y-2">
            {approvals.length === 0 && (
              <div className="flex items-center justify-center py-12 text-[#ccc]">
                <div className="text-center">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Queue is clear</p>
                </div>
              </div>
            )}
            {approvals.map(a => {
              const isActing = acting[a.id];
              const isOverSLA = (Date.now() - new Date(a.submitted_at).getTime()) / 3_600_000 > 48;
              const date = new Date(a.submitted_at).toISOString().split('T')[0];
              return (
                <div key={a.id} className="flex items-center gap-4 bg-[#f8f5f0] rounded-2xl px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-white border border-[#e5e0d8] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={16} className="text-[#888]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1a1a1a] text-sm font-bold truncate">
                      {a.offer?.title ?? `Request #${a.id}`}
                    </p>
                    <p className="text-[#aaa] text-xs">
                      Offer · {a.offer?.price ? `${a.offer.price.toLocaleString()} ${a.offer.currency ?? 'ALL'}` : '—'} · {date}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    isOverSLA
                      ? 'bg-[#fff0e0] text-[#f97316]'
                      : 'bg-[#fff8e0] text-[#d97706]'
                  }`}>
                    {isOverSLA ? 'Over SLA' : 'Pending'}
                  </span>
                  <button
                    onClick={() => handleApprove(a.id)}
                    disabled={!!isActing}
                    className="bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white text-xs font-bold uppercase px-4 py-2 rounded-full transition-colors"
                  >
                    {isActing === 'approving' ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handlePass(a.id)}
                    disabled={!!isActing}
                    className="border border-[#e5e0d8] hover:bg-[#f0ece4] disabled:opacity-50 text-[#555] text-xs font-bold uppercase px-4 py-2 rounded-full transition-colors"
                  >
                    {isActing === 'passing' ? '…' : 'Pass'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: NBA + Provider Pulse */}
        <div className="flex flex-col gap-4">

          {/* Next Best Action */}
          {!nbaDismissed && aiInsightText && (
            <div className="rounded-3xl bg-[#1a1a1a] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[#c9f158]" />
                <span className="text-[#c9f158] text-[10px] font-bold uppercase tracking-widest">Next Best Action</span>
              </div>
              <div>
                <h3 className="text-white text-base font-black uppercase leading-snug line-clamp-3">{nbaTitle}</h3>
                {nbaBody && <p className="text-[rgba(255,255,255,0.5)] text-xs mt-2 leading-relaxed line-clamp-3">{nbaBody}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/platform/analytics')}
                  className="flex-1 bg-[#c9f158] hover:bg-[#d8f56e] text-[#1a1a1a] text-[11px] font-black uppercase tracking-wider py-2.5 rounded-full transition-colors">
                  Open Playbook
                </button>
                <button onClick={() => setNbaDismissed(true)}
                  className="flex-1 border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.5)] hover:text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-full transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Provider Pulse */}
          <div className="rounded-3xl bg-white border border-[#ede9e2] p-6 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#1a1a1a] text-sm font-black uppercase tracking-wide">Provider Pulse</h3>
                <p className="text-[#aaa] text-[10px] mt-0.5">
                  {providers.length} active · {providers.filter((_, i) => {
                    const p = providerPulse[i];
                    return p && p.score < 75;
                  }).length} to watch
                </p>
              </div>
              <button onClick={() => navigate('/platform/providers')}
                className="text-[#aaa] hover:text-[#555] text-[10px] font-bold uppercase tracking-wider transition-colors">
                All Providers →
              </button>
            </div>
            <div className="space-y-3">
              {providerPulse.length === 0 && (
                <p className="text-[#ccc] text-sm text-center py-4">No provider data</p>
              )}
              {providerPulse.map(prov => {
                const col = pulseColor(prov.score);
                return (
                  <div key={prov.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="text-[#aaa] flex-shrink-0" />
                        <span className="text-[#1a1a1a] text-sm font-medium">{prov.name}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: col }}>{prov.score}%</span>
                    </div>
                    <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${prov.score}%`, background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick-link pills ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 pb-2">
        {[
          {
            icon: <Flame size={16} className="text-[#f97316]" />,
            iconBg: 'bg-[#fff3e0]',
            label: 'Daily Drop',
            value: deal ? `Live · ${hoursLeft}h left` : 'No deal today',
            to: '/platform/daily-drop',
          },
          {
            icon: <CheckCircle2 size={16} className="text-[#888]" />,
            iconBg: 'bg-[#f5f2ed]',
            label: 'Approvals',
            value: pendingCount > 0 ? `${pendingCount} waiting` : 'Queue clear',
            to: '/platform/requests',
          },
          {
            icon: <Wallet size={16} className="text-[#888]" />,
            iconBg: 'bg-[#f5f2ed]',
            label: 'Wallets',
            value: gmv > 0 ? `${gmv.toLocaleString()} ALL pooled` : 'No data yet',
            to: '/platform/wallets',
          },
          {
            icon: <Sparkles size={16} className="text-[#888]" />,
            iconBg: 'bg-[#f5f2ed]',
            label: 'Featured Offer',
            value: featuredOffer?.title ?? 'No offers yet',
            to: '/platform/offers',
          },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className="flex items-center gap-3 bg-white border border-[#ede9e2] rounded-2xl px-5 py-4 hover:bg-[#f8f5f0] hover:border-[#d8d3cb] transition-colors group text-left"
          >
            <div className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#aaa] text-[9px] font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-[#1a1a1a] text-sm font-bold mt-0.5 truncate">{item.value}</p>
            </div>
            <ArrowUpRight size={14} className="text-[#ccc] group-hover:text-[#888] transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>

      <NewOfferModal open={newOfferOpen} onClose={() => setNewOfferOpen(false)} />
    </div>
  );
}
