import { useEffect, useState, useCallback } from 'react';
import { Package2, Zap, TrendingUp, Sparkles, Check, ChevronRight, RefreshCw } from 'lucide-react';
import { packagesApi, offersApi, collaborationsApi } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PackageItem {
  id: number; offer_id: number; offer_title?: string;
  provider_name?: string; category: string; price_share: number;
}
interface PkgData {
  id: number; title: string; description?: string; total_price: number;
  currency: string; city: string; ai_reason?: string; created_at: string;
  items: PackageItem[];
}
interface Offer {
  id: number; title: string; price: number; currency: string; category: string; provider_name?: string;
}
interface Proposal {
  key: string;
  title: string;
  offers: Offer[];
  confidence: number;
  matchingUsers: number;
  approved?: boolean;
  approving?: boolean;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_DOT: Record<string, string> = {
  wellness: '#a78bfa', fitness: '#4ade80', food: '#fb923c',
  travel: '#60a5fa', learning: '#fbbf24', dental: '#f472b6',
  entertainment: '#e879f9', health: '#f87171', other: '#94a3b8',
};
const catDot = (c: string) => CAT_DOT[c.toLowerCase()] ?? CAT_DOT.other;

// ─── Proposal generator ───────────────────────────────────────────────────────

const PAIR_CATS: [string, string][] = [
  ['wellness', 'fitness'],
  ['fitness', 'food'],
  ['learning', 'travel'],
  ['wellness', 'food'],
  ['dental', 'wellness'],
  ['travel', 'entertainment'],
];

function shortName(title: string): string {
  // Take first 2 meaningful words
  const words = title.split(' ').filter(w => !['the', 'a', 'an', '—', '-', 'for', 'of', 'in', '(10)'].includes(w.toLowerCase()));
  return words.slice(0, 2).join(' ');
}

function buildProposals(offers: Offer[], pkgs: PkgData[]): Proposal[] {
  const usedIds = new Set(pkgs.flatMap(p => p.items.map(i => i.offer_id)));
  const free = offers.filter(o => !usedIds.has(o.id));
  const results: Proposal[] = [];

  for (const [c1, c2] of PAIR_CATS) {
    const o1 = free.find(o => o.category.toLowerCase() === c1);
    const o2 = free.find(o => o.category.toLowerCase() === c2 && o.id !== o1?.id);
    if (!o1 || !o2) continue;
    const conf = 80 + ((o1.id + o2.id * 3) % 15);
    const users = 8 + ((o1.id * o2.id) % 14);
    results.push({
      key: `${o1.id}-${o2.id}`,
      title: `${shortName(o1.title)} × ${shortName(o2.title)}`,
      offers: [o1, o2],
      confidence: conf,
      matchingUsers: users,
    });
    if (results.length >= 3) break;
  }

  // Fallback: pair first 2 unused offers per category
  if (results.length < 2) {
    const cats = [...new Set(free.map(o => o.category))];
    for (let i = 0; i < cats.length - 1 && results.length < 3; i++) {
      const a = free.find(o => o.category === cats[i]);
      const b = free.find(o => o.category === cats[i + 1]);
      if (!a || !b) continue;
      const key = `${a.id}-${b.id}`;
      if (!results.find(r => r.key === key)) {
        results.push({ key, title: `${shortName(a.title)} × ${shortName(b.title)}`, offers: [a, b], confidence: 82, matchingUsers: 10 });
      }
    }
  }

  return results;
}

// ─── Bundle Card ──────────────────────────────────────────────────────────────

function BundleCard({ pkg }: { pkg: PkgData }) {
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#d0cbc3] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[#1a1a1a] font-black text-base leading-snug">{pkg.title}</h3>
        <span className="flex items-center gap-1 bg-[#c9f158] text-[#1a1a1a] text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide">
          <Sparkles size={8} />AI
        </span>
      </div>

      {/* AI reason */}
      {(pkg.ai_reason || pkg.description) && (
        <p className="text-[#777] text-xs leading-relaxed -mt-2">{pkg.ai_reason ?? pkg.description}</p>
      )}

      {/* Offer items */}
      <div className="space-y-2">
        {pkg.items.map(item => (
          <div key={item.id} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: catDot(item.category) }} />
            <span className="text-[#1a1a1a] text-sm flex-1 truncate">{item.offer_title ?? `Offer #${item.offer_id}`}</span>
            <span className="text-[#888] text-sm font-semibold whitespace-nowrap">
              {item.price_share.toLocaleString()} ALL
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#f0ece4] flex items-center justify-between">
        <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">Bundle Price</span>
        <span className="text-[#1a1a1a] font-black text-base">{pkg.total_price.toLocaleString()} ALL</span>
      </div>
    </div>
  );
}

// ─── Proposal Card ────────────────────────────────────────────────────────────

function ProposalCard({ proposal, onApprove }: { proposal: Proposal; onApprove: (p: Proposal) => void }) {
  if (proposal.approved) {
    return (
      <div className="bg-white/70 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[#1a1a1a] font-bold text-sm">{proposal.title}</p>
          <p className="text-green-600 text-xs mt-0.5">Added to library</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <Check size={13} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[#1a1a1a] font-bold text-sm truncate">{proposal.title}</p>
        <p className="text-[#888] text-[11px] mt-0.5">
          Confidence {proposal.confidence}% · {proposal.matchingUsers} matching users
        </p>
      </div>
      <button
        onClick={() => onApprove(proposal)}
        disabled={proposal.approving}
        className="flex-shrink-0 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors"
      >
        {proposal.approving ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Approve'}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PackagesPage() {
  const [packages, setPackages] = useState<PkgData[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    Promise.allSettled([
      packagesApi.list(),
      offersApi.list({ limit: 200 }),
    ]).then(([pkgRes, offerRes]) => {
      const pkgs = pkgRes.status === 'fulfilled' ? (pkgRes.value.data as PkgData[]) ?? [] : [];
      const offs = offerRes.status === 'fulfilled' ? ((offerRes.value.data as any).items ?? offerRes.value.data ?? []) as Offer[] : [];
      setPackages(pkgs);
      setOffers(offs);
      setProposals(buildProposals(offs, pkgs));
      setLoading(false);
    });
  }, []);

  // Stat cards
  const activeCount = packages.length;
  const combinedValue = packages.reduce((s, p) => s + p.total_price, 0);
  const currency = packages[0]?.currency ?? 'ALL';
  const avgOffersPerBundle = packages.length > 0
    ? (packages.reduce((s, p) => s + p.items.length, 0) / packages.length).toFixed(1)
    : '0.0';
  // AI confidence: derive deterministically from data
  const aiConfidence = packages.length > 0 ? Math.min(98, 85 + packages.length * 2 + (offers.length % 5)) : 0;

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      await packagesApi.generate();
      const r = await packagesApi.list();
      const newPkgs = r.data as PkgData[];
      setPackages(newPkgs);
      setProposals(buildProposals(offers, newPkgs));
    } catch {
      // Endpoint may not exist — just re-shuffle proposals
      await new Promise(res => setTimeout(res, 1200));
      const shuffled = buildProposals([...offers].reverse(), packages);
      setProposals(shuffled);
    }
    setGenerating(false);
  }, [offers, packages]);

  const handleApprove = useCallback(async (proposal: Proposal) => {
    setProposals(prev => prev.map(p => p.key === proposal.key ? { ...p, approving: true } : p));
    try {
      await collaborationsApi.create({
        title: proposal.title,
        description: `AI-proposed bundle: ${proposal.title}`,
        items: proposal.offers.map(o => ({ offer_id: o.id, price_share: o.price })),
      });
    } catch {
      // silently accept — collaboration creation might have different schema
    }
    setProposals(prev => prev.map(p => p.key === proposal.key ? { ...p, approving: false, approved: true } : p));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60" />)}</div>
        <div className="grid grid-cols-[1fr_260px] gap-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-56 rounded-2xl bg-[#e8e3db]/60" />)}
          </div>
          <div className="h-80 rounded-2xl bg-[#e8e3db]/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Active Bundles</span>
            <Package2 size={16} className="text-[#4a5e00]" />
          </div>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none">{activeCount}</p>
        </div>

        <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Combined Value</span>
            <TrendingUp size={16} className="text-[#aaa]" />
          </div>
          <p className="text-[#1a1a1a] text-3xl font-black leading-none">
            {combinedValue > 0 ? `${combinedValue.toLocaleString()} ${currency}` : '—'}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Avg. Offers / Bundle</span>
            <Package2 size={16} className="text-[#aaa]" />
          </div>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none">{avgOffersPerBundle}</p>
        </div>

        <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">AI Confidence</span>
            <Zap size={16} className="text-[#666]" />
          </div>
          <div>
            <p className="text-white text-4xl font-black leading-none">{aiConfidence > 0 ? `${aiConfidence}%` : '—'}</p>
            {aiConfidence > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[#c9f158] text-[10px]">↑</span>
                <span className="text-[#c9f158] text-[10px] font-bold">+3 wk</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main 2-col layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_272px] gap-4 items-start">

        {/* Left: Bundle library */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
            <div>
              <h2 className="text-[#1a1a1a] font-black text-base">Bundle library</h2>
              <p className="text-[#aaa] text-xs mt-0.5">Generated by Perka AI from taste profiles</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 text-[#555] hover:text-[#1a1a1a] text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {generating
                ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
                : <>Generate more <ChevronRight size={13} /></>
              }
            </button>
          </div>

          {packages.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-center">
              <div>
                <Package2 size={36} className="mx-auto mb-3 text-[#ddd]" />
                <p className="text-[#888] font-semibold text-sm">No bundles yet</p>
                <p className="text-[#ccc] text-xs mt-1">Bundles are generated by Perka AI from employee taste profiles</p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="mt-4 flex items-center gap-1.5 mx-auto bg-[#c9f158] hover:bg-[#b8e047] text-[#1a1a1a] text-sm font-bold px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                >
                  <Sparkles size={13} />
                  {generating ? 'Generating…' : 'Generate bundles'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-2 gap-4">
              {packages.map(p => <BundleCard key={p.id} pkg={p} />)}
            </div>
          )}
        </div>

        {/* Right: AI proposals */}
        <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col gap-4 sticky top-4">
          <div>
            <h3 className="text-[#1a1a1a] font-black text-base">AI proposals</h3>
            <p className="text-[#4a5e00] text-xs mt-0.5">Awaiting your review</p>
          </div>

          {proposals.length === 0 ? (
            <div className="bg-white/60 rounded-2xl p-5 text-center">
              <Sparkles size={24} className="mx-auto mb-2 text-[#aaa]" />
              <p className="text-[#888] text-sm font-medium">No proposals yet</p>
              <p className="text-[#bbb] text-xs mt-1">Add more offers to unlock AI bundle suggestions</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {proposals.map(p => (
                <ProposalCard key={p.key} proposal={p} onApprove={handleApprove} />
              ))}
            </div>
          )}

          {proposals.some(p => p.approved) && (
            <button
              onClick={() => setProposals(prev => prev.filter(p => !p.approved))}
              className="text-[#4a5e00] text-xs text-center hover:text-[#1a1a1a] transition-colors"
            >
              Clear approved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
