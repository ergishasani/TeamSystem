import { useState, useEffect, useRef } from 'react';
import { Search, Tag, Building2, Box, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { offersApi, providersApi } from '../../lib/api';

interface Result {
  type: 'offer' | 'provider' | 'package';
  id: number;
  title: string;
  subtitle?: string;
  to: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICON = { offer: Tag, provider: Building2, package: Box };
const TYPE_LABEL = { offer: 'Offer', provider: 'Provider', package: 'Package' };

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const hits: Result[] = [];
      const [offersR, providersR] = await Promise.allSettled([
        offersApi.list({ search: query, limit: 5 }),
        providersApi.list({ q: query }),
      ]);
      if (offersR.status === 'fulfilled') {
        for (const o of (offersR.value.data.items ?? []) as any[]) {
          hits.push({ type: 'offer', id: o.id, title: o.title, subtitle: o.category, to: '/platform/offers' });
        }
      }
      if (providersR.status === 'fulfilled') {
        for (const p of (providersR.value.data as any[]).slice(0, 4)) {
          hits.push({ type: 'provider', id: p.id, title: p.name, subtitle: p.category, to: '/platform/providers' });
        }
      }
      setResults(hits);
      setActiveIdx(0);
      setLoading(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (to: string) => { navigate(to); onClose(); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) { go(results[activeIdx].to); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden border border-[#f0ece4]"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f5f2ed]">
          <Search size={16} className="text-[#bbb] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search offers, users, requests..."
            className="flex-1 text-[#1a1a1a] text-sm outline-none placeholder-[#ccc] bg-transparent"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-[#ccc] hover:text-[#999] transition-colors">
              <X size={14} />
            </button>
          ) : (
            <span className="text-[11px] text-[#ccc] border border-[#eee] px-1.5 py-0.5 rounded-md font-mono">ESC</span>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {loading && (
            <p className="text-center text-[#bbb] text-sm py-8">Searching…</p>
          )}

          {!loading && !query && (
            <div className="px-5 py-8 text-center">
              <p className="text-[#ccc] text-sm">Type to search offers, providers and more</p>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-[#1a1a1a] text-sm font-medium">No results for "{query}"</p>
              <p className="text-[#bbb] text-xs mt-1">Try a different keyword</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((r, i) => {
                const Icon = TYPE_ICON[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => go(r.to)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 transition-colors text-left ${
                      i === activeIdx ? 'bg-[#f8f5f0]' : 'hover:bg-[#f8f5f0]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#f0ece4] flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-[#888]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1a1a1a] text-sm font-medium truncate">{r.title}</p>
                      {r.subtitle && (
                        <p className="text-[#aaa] text-xs capitalize">{r.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[#ccc] text-[10px] font-medium">{TYPE_LABEL[r.type]}</span>
                      <ArrowRight size={12} className="text-[#ddd]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[#f5f2ed] bg-[#fafaf9]">
          <span className="text-[10px] text-[#ccc]">↑↓ navigate</span>
          <span className="text-[10px] text-[#ccc]">↵ open</span>
          <span className="text-[10px] text-[#ccc]">ESC close</span>
        </div>
      </div>
    </div>
  );
}
