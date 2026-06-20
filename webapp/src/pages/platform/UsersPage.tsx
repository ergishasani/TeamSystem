import { useEffect, useState } from 'react';
import { Users, TrendingUp, Mail, AlertTriangle, Filter, Download, Search } from 'lucide-react';
import { employerApi } from '../../lib/api';

interface UserRow {
  id: number; full_name: string; email: string; initials: string;
  company_name?: string; wallet_used: number; wallet_cap: number;
  usage_pct: number; status: string; joined?: string;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA');
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border border-green-200',
    near_cap: 'bg-orange-50 text-orange-700 border border-orange-200',
    invited: 'bg-blue-50 text-blue-700 border border-blue-200',
  };
  const labels: Record<string, string> = { active: 'ACTIVE', near_cap: 'NEAR CAP', invited: 'INVITED' };
  return <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${s[status] ?? s.active}`}>{labels[status] ?? status}</span>;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// deterministic avatar color per user
const AVATAR_COLORS = ['#c9f158','#a78bfa','#4ade80','#60a5fa','#fb923c','#f472b6','#fbbf24','#e879f9'];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

function exportCSV(rows: UserRow[]) {
  const csv = [['Name','Email','Company','Wallet Used','Wallet Cap','Usage%','Status','Joined'],
    ...rows.map(r => [r.full_name, r.email, r.company_name ?? '', r.wallet_used, r.wallet_cap, r.usage_pct+'%', r.status, r.joined ?? ''])
  ].map(r => r.join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'users.csv'; a.click();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    employerApi.usersWallets()
      .then(r => setUsers(r.data as UserRow[]))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const total = users.length;
  const active = users.filter(u => u.status === 'active').length;
  const invited = users.filter(u => u.status === 'invited').length;
  const nearCap = users.filter(u => u.status === 'near_cap').length;

  const filtered = users.filter(u =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#e8e3db]/60 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#c9f158] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Total Users</span>
              <Users size={16} className="text-[#4a5e00]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-4xl font-black leading-none">{total}</p>
              {total > 0 && <p className="text-[#4a5e00] text-[10px] font-bold mt-1">↑ +{total} wk</p>}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Active This Week</span>
              <TrendingUp size={16} className="text-[#aaa]" />
            </div>
            <div>
              <p className="text-[#1a1a1a] text-4xl font-black leading-none">{active}</p>
              {active > 0 && total > 0 && <p className="text-green-500 text-[10px] font-bold mt-1">↑ {Math.round(active/total*100)}%</p>}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#ede9e2] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Invited</span>
              <Mail size={16} className="text-[#aaa]" />
            </div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none">{invited}</p>
          </div>
          <div className="rounded-2xl bg-[#1a1a1a] p-5 flex flex-col justify-between h-32">
            <div className="flex items-start justify-between">
              <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Near Cap</span>
              <TrendingUp size={16} className="text-[#666]" />
            </div>
            <div>
              <p className="text-white text-4xl font-black leading-none">{nearCap}</p>
              {nearCap > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle size={10} className="text-yellow-400" />
                  <span className="text-yellow-400 text-[10px] font-bold">Watch</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Directory table */}
      <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
          <div>
            <h2 className="text-[#1a1a1a] font-black text-base">Directory</h2>
            <p className="text-[#aaa] text-xs mt-0.5">Users across all companies</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                className="bg-[#f8f5f0] border border-[#ede9e2] rounded-full pl-8 pr-3 py-1.5 text-xs placeholder-[#bbb] focus:outline-none focus:border-[#ccc] w-36 transition-all focus:w-48" />
            </div>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc] transition-colors">
              <Filter size={12} /> Filter
            </button>
            <button onClick={() => exportCSV(filtered)} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc] transition-colors">
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_120px_220px_100px_100px_80px] gap-2 px-6 py-2.5 bg-[#faf8f5] border-b border-[#f0ece4]">
          {['User','Company','Wallet Usage','Status','Joined','Action'].map(h => (
            <span key={h} className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center"><Users size={36} className="mx-auto mb-2 text-[#ddd]" /><p className="text-[#888] text-sm font-medium">{search ? 'No users found' : 'No users yet'}</p></div>
          </div>
        ) : (
          <div className="divide-y divide-[#f8f5f0]">
            {filtered.map(u => {
              const barColor = u.usage_pct >= 90 ? '#fb923c' : u.usage_pct >= 80 ? '#f97316' : '#1a1a1a';
              return (
                <div key={u.id} className="grid grid-cols-[1fr_120px_220px_100px_100px_80px] gap-2 px-6 py-3.5 items-center hover:bg-[#faf8f5] transition-colors">
                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                      style={{ background: avatarColor(u.id), color: '#1a1a1a' }}>
                      {u.initials || initials(u.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#1a1a1a] font-semibold text-sm leading-snug truncate">{u.full_name}</p>
                      <p className="text-[#aaa] text-xs truncate">{u.email}</p>
                    </div>
                  </div>
                  {/* Company */}
                  <span className="text-[#555] text-sm truncate">{u.company_name ?? '—'}</span>
                  {/* Wallet usage */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-[#555]">{u.wallet_used.toLocaleString()} ALL / {u.wallet_cap.toLocaleString()} ALL</span>
                      <span className="text-[#888] font-bold">{u.usage_pct}%</span>
                    </div>
                    <div className="h-1.5 bg-[#f0ece4] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, u.usage_pct)}%`, background: barColor }} />
                    </div>
                  </div>
                  {/* Status */}
                  <StatusBadge status={u.status} />
                  {/* Joined */}
                  <span className="text-[#888] text-sm">{fmtDate(u.joined)}</span>
                  {/* Action */}
                  <button className="text-xs font-semibold text-[#555] border border-[#e5e0d8] px-3 py-1.5 rounded-full hover:bg-[#f5f0e8] transition-colors">Manage</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
