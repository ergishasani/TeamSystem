import { useCallback, useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, TrendingUp, Filter, Download } from 'lucide-react';
import { employerApi } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Req {
  id: number; employee_name: string; employee_initials: string;
  item_title?: string; request_type: string;
  total_amount: number; currency: string; status: string;
  ai_reason?: string; submitted_at: string;
  approved_at?: string; rejected_at?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function avgHandleTime(reqs: Req[]): string {
  const resolved = reqs.filter(r => r.approved_at || r.rejected_at);
  if (!resolved.length) return '—';
  const avgMs = resolved.reduce((s, r) => {
    const end = new Date(r.approved_at ?? r.rejected_at!).getTime();
    return s + (end - new Date(r.submitted_at).getTime());
  }, 0) / resolved.length;
  const h = Math.floor(avgMs / 3_600_000);
  const m = Math.floor((avgMs % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-green-50 text-green-700 border border-green-200',
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    review: 'bg-blue-50 text-blue-700 border border-blue-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}

function exportCSV(reqs: Req[]) {
  const rows = reqs.map(r => [r.id, r.employee_name, r.item_title ?? '', r.request_type, r.total_amount, r.currency, r.status, fmtDate(r.submitted_at)]);
  const csv = [['ID','Employee','Item','Type','Amount','Currency','Status','Submitted'], ...rows].map(r => r.join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'requests.csv'; a.click();
}

// ─── Quick rules ──────────────────────────────────────────────────────────────

const DEFAULT_RULES = [
  { id: 1, label: 'Auto-approve under 3,000 ALL', on: true },
  { id: 2, label: 'Flag if budget > 80%', on: true },
  { id: 3, label: 'Require notes for travel', on: false },
  { id: 4, label: 'Approve repeat redemptions', on: true },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<number, 'approving' | 'rejecting'>>({});
  const [rules, setRules] = useState(DEFAULT_RULES);

  useEffect(() => {
    employerApi.allRequests()
      .then(r => setReqs(r.data as Req[]))
      .catch(() => employerApi.approvals().then(r => setReqs(r.data as Req[])).catch(() => {}))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = useCallback(async (id: number) => {
    setActing(a => ({ ...a, [id]: 'approving' }));
    try {
      await employerApi.approve(id);
      setReqs(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', approved_at: new Date().toISOString() } : r));
    } catch {}
    setActing(a => { const n = { ...a }; delete n[id]; return n; });
  }, []);

  const handleReject = useCallback(async (id: number) => {
    setActing(a => ({ ...a, [id]: 'rejecting' }));
    try {
      await employerApi.reject(id, 'Rejected by admin');
      setReqs(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', rejected_at: new Date().toISOString() } : r));
    } catch {}
    setActing(a => { const n = { ...a }; delete n[id]; return n; });
  }, []);

  const toggleRule = (id: number) => setRules(prev => prev.map(r => r.id === id ? { ...r, on: !r.on } : r));

  // Stats
  const pending = reqs.filter(r => r.status === 'pending').length;
  const approved = reqs.filter(r => r.status === 'approved').length;
  const rejected = reqs.filter(r => r.status === 'rejected').length;
  const slaBreached = reqs.filter(r => r.status === 'pending' && (Date.now() - new Date(r.submitted_at).getTime()) / 3_600_000 > 48).length;
  const handleTime = avgHandleTime(reqs);

  return (
    <div className="space-y-5">
      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Pending</span>
              <Clock size={16} className="text-[#4a5e00]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-4xl font-black leading-none">{pending}</p>
              {slaBreached > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-orange-600 text-[10px] font-bold">{slaBreached} over SLA</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Approved</span>
              <CheckCircle2 size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-4xl font-black leading-none">{approved}</p>
              {approved > 0 && <p className="text-green-500 text-[10px] font-bold mt-1">↑ +{approved} wk</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Rejected</span>
              <XCircle size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{rejected}</p>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Avg. Handle Time</span>
              <TrendingUp size={16} className="text-[#666]" />
            </div>
            <div>
              <p className="text-white text-3xl font-black leading-none">{handleTime}</p>
              <p className="text-[#c9f158] text-[10px] font-bold mt-1">↓ -18m</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main 2-col ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_272px] gap-4 items-start">

        {/* Approval queue */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
            <div>
              <h2 className="text-[#1a1a1a] font-black text-base">Approval queue</h2>
              <p className="text-[#aaa] text-xs mt-0.5">{reqs.length} requests · sorted by oldest</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc]">
                <Filter size={12} /> Filter
              </button>
              <button onClick={() => exportCSV(reqs)} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc]">
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[160px_1fr_100px_90px_110px_140px] gap-2 px-6 py-2.5 bg-[#faf8f5] border-b border-[#f0ece4]">
            {['User', 'Item', 'Amount', 'Submitted', 'Status', 'Action'].map(h => (
              <span key={h} className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
          ) : reqs.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-center">
              <div><CheckCircle2 size={36} className="mx-auto mb-2 text-[#ddd]" /><p className="text-[#888] font-medium text-sm">All caught up!</p></div>
            </div>
          ) : (
            <div className="divide-y divide-[#f8f5f0]">
              {reqs.map(r => {
                const canAct = r.status === 'pending' || r.status === 'review';
                const isAct = acting[r.id];
                return (
                  <div key={r.id} className="grid grid-cols-[160px_1fr_100px_90px_110px_140px] gap-2 px-6 py-3.5 items-center hover:bg-[#faf8f5] transition-colors">
                    {/* User */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#c9f158] flex items-center justify-center text-[10px] font-black text-[#1a1a1a] flex-shrink-0">
                        {r.employee_initials}
                      </div>
                      <p className="text-[#1a1a1a] text-sm font-semibold truncate">{r.employee_name.split(' ')[0]} {r.employee_name.split(' ')[1]?.[0]}.</p>
                    </div>

                    {/* Item */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#f0ece4] text-[#888]">
                          {r.request_type === 'package' ? 'PACKAGE' : 'OFFER'}
                        </span>
                        <span className="text-[#555] text-sm truncate">{r.item_title ?? `${r.request_type} request`}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <span className="text-[#1a1a1a] font-bold text-sm">{r.total_amount.toLocaleString()} {r.currency}</span>

                    {/* Submitted */}
                    <span className="text-[#888] text-sm">{fmtDate(r.submitted_at)}</span>

                    {/* Status */}
                    <StatusBadge status={r.status} />

                    {/* Action */}
                    {canAct ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleApprove(r.id)} disabled={!!isAct}
                          className="flex items-center gap-1 bg-[#c9f158] hover:bg-[#b8e047] disabled:opacity-50 text-[#1a1a1a] text-[10px] font-black px-3 py-1.5 rounded-full transition-colors">
                          <CheckCircle2 size={11} /> {isAct === 'approving' ? '…' : 'Approve'}
                        </button>
                        <button onClick={() => handleReject(r.id)} disabled={!!isAct}
                          className="flex items-center gap-1 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white text-[10px] font-black px-3 py-1.5 rounded-full transition-colors">
                          <XCircle size={11} /> {isAct === 'rejecting' ? '…' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <button className="text-[#aaa] text-xs font-semibold hover:text-[#555] transition-colors">View</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick rules */}
        <div className="bg-[#c9f158] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-[#1a1a1a] font-black text-base">Quick rules</h3>
            <p className="text-[#4a5e00] text-xs mt-0.5">Auto-decision policies</p>
          </div>
          <div className="space-y-2.5">
            {rules.map(rule => (
              <div key={rule.id} className="bg-[#1a1a1a] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-white text-sm font-medium leading-snug">{rule.label}</span>
                <button onClick={() => toggleRule(rule.id)}
                  className={`flex-shrink-0 text-[9px] font-black px-2 py-1 rounded-full transition-colors ${rule.on ? 'bg-[#c9f158] text-[#1a1a1a]' : 'bg-[#333] text-[#666]'}`}>
                  {rule.on ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
