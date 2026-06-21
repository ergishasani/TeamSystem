import { useEffect, useState } from 'react';
import { QrCode, ShieldCheck, Clock, TrendingUp, Filter, Download } from 'lucide-react';
import { employerApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

interface Redemption {
  id: number; code: string; offer_title?: string; provider_name?: string;
  status: string; expires_at?: string; redeemed_at?: string;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border border-green-200',
    redeemed: 'bg-teal-50 text-teal-700 border border-teal-200',
    expired: 'bg-red-50 text-red-600 border border-red-200',
  };
  return <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${s[status] ?? s.expired}`}>{status}</span>;
}

function exportCSV(rows: Redemption[]) {
  const csv = [['Code', 'Offer', 'Provider', 'Status', 'Expires', 'Redeemed'],
    ...rows.map(r => [r.code, r.offer_title ?? '', r.provider_name ?? '', r.status, fmtDate(r.expires_at), fmtDate(r.redeemed_at)])
  ].map(r => r.join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'redemptions.csv'; a.click();
}

export default function RedemptionsPage() {
  const [data, setData] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employerApi.redemptions()
      .then(r => setData(r.data as Redemption[]))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  // Top-bar action: export all redemptions.
  usePageAction({
    label: 'Export CSV',
    icon: <Download size={15} strokeWidth={2.5} />,
    onClick: () => exportCSV(data),
    disabled: loading || data.length === 0,
  }, [data, loading]);

  const active = data.filter(r => r.status === 'active').length;
  const redeemed = data.filter(r => r.status === 'redeemed').length;
  const expired = data.filter(r => r.status === 'expired').length;
  const rate = data.length > 0 ? Math.round((redeemed / data.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Active Codes</span>
              <QrCode size={16} className="text-[#4a5e00]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{active}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Redeemed</span>
              <ShieldCheck size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-4xl font-black leading-none">{redeemed}</p>
              {redeemed > 0 && <p className="text-green-500 text-[10px] font-bold mt-1">↑ +{redeemed * 8} wk</p>}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Expired</span>
              <Clock size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{expired}</p>
          </div>
          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Redemption Rate</span>
              <TrendingUp size={16} className="text-[#666]" />
            </div>
            <div>
              <p className="text-white text-4xl font-black leading-none">{rate > 0 ? `${rate}%` : '—'}</p>
              {rate > 0 && <p className="text-[#c9f158] text-[10px] font-bold mt-1">↑ +4 pts</p>}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-base">Redemption ledger</h2>
            <p className="text-[#aaa] text-xs mt-0.5">All codes issued to employees</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc] transition-colors">
              <Filter size={12} /> Filter
            </button>
            <button onClick={() => exportCSV(data)} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc] transition-colors">
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-[160px_1fr_160px_100px_90px_100px] gap-2 px-6 py-2.5 bg-[#faf8f5] border-b border-[#f0ece4]">
          {['Code','Offer','Provider','Status','Expires','Redeemed'].map(h => (
            <span key={h} className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center"><QrCode size={36} className="mx-auto mb-2 text-[#ddd]" /><p className="text-[#888] text-sm font-medium">No redemptions yet</p></div>
          </div>
        ) : (
          <div className="divide-y divide-[#f8f5f0]">
            {data.map(r => (
              <div key={r.id} className="grid grid-cols-[160px_1fr_160px_100px_90px_100px] gap-2 px-6 py-4 items-center hover:bg-[#faf8f5] transition-colors">
                <span className="font-mono text-[#1a1a1a] text-sm font-bold tracking-wide">{r.code}</span>
                <span className="text-[#555] text-sm truncate">{r.offer_title ?? '—'}</span>
                <span className="text-[#888] text-sm truncate">{r.provider_name ?? '—'}</span>
                <StatusBadge status={r.status} />
                <span className="text-[#888] text-sm">{fmtDate(r.expires_at)}</span>
                <span className="text-[#888] text-sm">{fmtDate(r.redeemed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
