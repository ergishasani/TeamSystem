import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users, TrendingUp, Mail, AlertTriangle, Filter, Download, Search,
  X, Check, Bell, Wallet, Award, Flame, Loader2,
} from 'lucide-react';
import { employerApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

interface UserRow {
  id: number; full_name: string; email: string; initials: string;
  company_name?: string; department?: string | null;
  wallet_used: number; wallet_cap: number;
  usage_pct: number; status: string; joined?: string;
}

interface UserDetail extends UserRow {
  phone?: string | null; level: number; xp: number; streak: number;
  benefit_style?: string | null; interests: string[];
  wallet_pending: number; wallet_remaining: number;
  requests_count: number; last_active?: string | null;
}

const STATUSES = [
  { key: 'active', label: 'Active' },
  { key: 'near_cap', label: 'Near Cap' },
  { key: 'invited', label: 'Invited' },
] as const;

function fmtDate(iso?: string | null) {
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
const AVATAR_COLORS = ['#c9f158', '#a78bfa', '#4ade80', '#60a5fa', '#fb923c', '#f472b6', '#fbbf24', '#e879f9'];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

function exportCSV(rows: UserRow[]) {
  const csv = [['Name', 'Email', 'Company', 'Department', 'Wallet Used', 'Wallet Cap', 'Usage%', 'Status', 'Joined'],
    ...rows.map(r => [r.full_name, r.email, r.company_name ?? '', r.department ?? '', r.wallet_used, r.wallet_cap, r.usage_pct + '%', r.status, r.joined ?? ''])
  ].map(r => r.join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'users.csv'; a.click();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>('');
  const filterRef = useRef<HTMLDivElement>(null);

  // Manage drawer state
  const [manageId, setManageId] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2600); };

  const load = () => {
    setLoading(true);
    employerApi.usersWallets()
      .then(r => setUsers(r.data as UserRow[]))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Close filter popover on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [filterOpen]);

  const departments = useMemo(
    () => Array.from(new Set(users.map(u => u.department).filter(Boolean) as string[])).sort(),
    [users],
  );

  const total = users.length;
  const active = users.filter(u => u.status === 'active').length;
  const invited = users.filter(u => u.status === 'invited').length;
  const nearCap = users.filter(u => u.status === 'near_cap').length;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(u.status);
    const matchesDept = !deptFilter || u.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const activeFilterCount = statusFilter.length + (deptFilter ? 1 : 0);

  // Top-bar action: export the currently filtered directory.
  usePageAction({
    label: 'Export CSV',
    icon: <Download size={15} strokeWidth={2.5} />,
    onClick: () => exportCSV(filtered),
    disabled: loading || filtered.length === 0,
  }, [filtered, loading]);

  const toggleStatus = (key: string) =>
    setStatusFilter(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  const clearFilters = () => { setStatusFilter([]); setDeptFilter(''); };

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
              {active > 0 && total > 0 && <p className="text-green-500 text-[10px] font-bold mt-1">↑ {Math.round(active / total * 100)}%</p>}
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
            <p className="text-[#aaa] text-xs mt-0.5">
              {filtered.length} of {total} {total === 1 ? 'user' : 'users'}
              {activeFilterCount > 0 ? ' · filtered' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                className="bg-[#f8f5f0] border border-[#ede9e2] rounded-full pl-8 pr-3 py-1.5 text-xs placeholder-[#bbb] focus:outline-none focus:border-[#ccc] w-36 transition-all focus:w-48" />
            </div>

            {/* Filter popover */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(o => !o)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                  activeFilterCount > 0 || filterOpen
                    ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                    : 'border-[#e5e0d8] text-[#555] hover:border-[#ccc]'
                }`}
              >
                <Filter size={12} /> Filter
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 bg-[#c9f158] text-[#1a1a1a] text-[10px] font-black rounded-full px-1.5 leading-tight">{activeFilterCount}</span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#ede9e2] rounded-2xl shadow-xl z-20 p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#aaa]">Status</span>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-[11px] font-semibold text-[#888] hover:text-[#1a1a1a]">Clear all</button>
                    )}
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {STATUSES.map(s => {
                      const on = statusFilter.includes(s.key);
                      return (
                        <button key={s.key} onClick={() => toggleStatus(s.key)}
                          className="flex items-center gap-2.5 w-full text-left group">
                          <span className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${on ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-[#d8d3ca] group-hover:border-[#aaa]'}`}>
                            {on && <Check size={11} className="text-[#c9f158]" />}
                          </span>
                          <span className="text-sm text-[#333]">{s.label}</span>
                          <span className="ml-auto text-xs text-[#bbb]">{users.filter(u => u.status === s.key).length}</span>
                        </button>
                      );
                    })}
                  </div>
                  {departments.length > 0 && (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#aaa] block mb-1.5">Department</span>
                      <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                        className="w-full bg-[#f8f5f0] border border-[#ede9e2] rounded-lg px-2.5 py-2 text-sm text-[#333] focus:outline-none focus:border-[#ccc]">
                        <option value="">All departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => exportCSV(filtered)} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e5e0d8] text-[#555] hover:border-[#ccc] transition-colors">
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_120px_220px_100px_100px_80px] gap-2 px-6 py-2.5 bg-[#faf8f5] border-b border-[#f0ece4]">
          {['User', 'Company', 'Wallet Usage', 'Status', 'Joined', 'Action'].map(h => (
            <span key={h} className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#e8e3db]/60 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center"><Users size={36} className="mx-auto mb-2 text-[#ddd]" /><p className="text-[#888] text-sm font-medium">{search || activeFilterCount ? 'No users match your filters' : 'No users yet'}</p></div>
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
                  <button onClick={() => setManageId(u.id)} className="text-xs font-semibold text-[#555] border border-[#e5e0d8] px-3 py-1.5 rounded-full hover:bg-[#f5f0e8] transition-colors">Manage</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {manageId !== null && (
        <ManageUserDrawer
          userId={manageId}
          onClose={() => setManageId(null)}
          onSaved={() => { load(); }}
          onToast={showToast}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a1a] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-[fadeIn_0.15s_ease]">
          <Check size={15} className="text-[#c9f158]" /> {toast}
        </div>
      )}
    </div>
  );
}

// ─── Manage drawer ──────────────────────────────────────────────────────────

function ManageUserDrawer({ userId, onClose, onSaved, onToast }: {
  userId: number; onClose: () => void; onSaved: () => void; onToast: (m: string) => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nudging, setNudging] = useState(false);

  const [budget, setBudget] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    setLoading(true);
    employerApi.userDetail(userId)
      .then(r => {
        const d = r.data as UserDetail;
        setDetail(d);
        setBudget(String(d.wallet_cap));
        setDepartment(d.department ?? '');
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [userId]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dirty = detail !== null && (
    Number(budget) !== detail.wallet_cap || (department.trim() || '') !== (detail.department ?? '')
  );

  const save = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const payload: { monthly_budget?: number; department?: string } = {};
      if (Number(budget) !== detail.wallet_cap) payload.monthly_budget = Number(budget);
      if ((department.trim() || '') !== (detail.department ?? '')) payload.department = department.trim();
      const r = await employerApi.updateUser(userId, payload);
      const d = r.data as UserDetail;
      setDetail(d);
      setBudget(String(d.wallet_cap));
      setDepartment(d.department ?? '');
      onSaved();
      onToast('Changes saved');
    } catch {
      onToast('Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const nudge = async () => {
    setNudging(true);
    try {
      await employerApi.nudgeUser(userId);
      onToast(`Reminder sent to ${detail?.full_name.split(' ')[0] ?? 'user'}`);
    } catch {
      onToast('Could not send reminder');
    } finally {
      setNudging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#faf8f5] h-full shadow-2xl overflow-y-auto animate-[slideIn_0.2s_ease]">
        {/* Header */}
        <div className="sticky top-0 bg-[#faf8f5] border-b border-[#ede9e2] px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-black text-[#1a1a1a]">Manage user</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#ede9e2] transition-colors">
            <X size={16} className="text-[#555]" />
          </button>
        </div>

        {loading || !detail ? (
          <div className="flex items-center justify-center h-64">
            {loading ? <Loader2 size={22} className="animate-spin text-[#bbb]" /> : <p className="text-[#888] text-sm">Could not load user.</p>}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: avatarColor(detail.id), color: '#1a1a1a' }}>
                {detail.initials || initials(detail.full_name)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#1a1a1a] truncate">{detail.full_name}</p>
                <p className="text-[#999] text-xs truncate">{detail.email}</p>
              </div>
              <div className="ml-auto"><StatusBadge status={detail.status} /></div>
            </div>

            {/* Gamification chips */}
            <div className="grid grid-cols-3 gap-2">
              <Chip icon={<Award size={13} />} label="Level" value={String(detail.level)} />
              <Chip icon={<TrendingUp size={13} />} label="XP" value={detail.xp.toLocaleString()} />
              <Chip icon={<Flame size={13} />} label="Streak" value={`${detail.streak}d`} />
            </div>

            {/* Wallet summary */}
            <div className="bg-white border border-[#ede9e2] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={14} className="text-[#888]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">Wallet this month</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-black text-[#1a1a1a]">{detail.wallet_used.toLocaleString()}<span className="text-sm font-bold text-[#bbb]"> / {detail.wallet_cap.toLocaleString()} ALL</span></span>
                <span className="text-sm font-bold text-[#888]">{detail.usage_pct}%</span>
              </div>
              <div className="h-2 bg-[#f0ece4] rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, detail.usage_pct)}%`, background: detail.usage_pct >= 80 ? '#fb923c' : '#1a1a1a' }} />
              </div>
              <div className="grid grid-cols-3 text-center text-xs">
                <div><p className="text-[#aaa]">Used</p><p className="font-bold text-[#1a1a1a]">{detail.wallet_used.toLocaleString()}</p></div>
                <div><p className="text-[#aaa]">Pending</p><p className="font-bold text-[#1a1a1a]">{detail.wallet_pending.toLocaleString()}</p></div>
                <div><p className="text-[#aaa]">Left</p><p className="font-bold text-[#1a1a1a]">{detail.wallet_remaining.toLocaleString()}</p></div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">Monthly wallet cap (ALL)</span>
                <input type="number" min={0} value={budget} onChange={e => setBudget(e.target.value)}
                  className="mt-1.5 w-full bg-white border border-[#ede9e2] rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]" />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">Department</span>
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering"
                  className="mt-1.5 w-full bg-white border border-[#ede9e2] rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:border-[#1a1a1a]" />
              </label>
            </div>

            {/* Meta */}
            <div className="text-xs text-[#999] space-y-1">
              <div className="flex justify-between"><span>Requests submitted</span><span className="font-semibold text-[#555]">{detail.requests_count}</span></div>
              <div className="flex justify-between"><span>Joined</span><span className="font-semibold text-[#555]">{fmtDate(detail.joined)}</span></div>
              <div className="flex justify-between"><span>Last active</span><span className="font-semibold text-[#555]">{fmtDate(detail.last_active)}</span></div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={save} disabled={!dirty || saving}
                className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition-colors">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={nudge} disabled={nudging}
                className="w-full flex items-center justify-center gap-2 bg-white border border-[#e5e0d8] text-[#1a1a1a] text-sm font-bold py-3 rounded-xl hover:border-[#1a1a1a] transition-colors disabled:opacity-50">
                {nudging ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
                Send wallet reminder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-[#ede9e2] rounded-xl px-2 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-[#aaa] mb-0.5">{icon}<span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
      <p className="font-black text-[#1a1a1a] text-sm">{value}</p>
    </div>
  );
}
