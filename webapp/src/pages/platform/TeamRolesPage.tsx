import { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, ShieldCheck, PenSquare, Eye, Filter, Download, ShieldQuestion, UserPlus, X, Loader2, Check } from 'lucide-react';
import { teamApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

interface Stats { members: number; admins: number; two_factor_coverage_pct: number; pending_invites: number; }
interface RoleRow { key: string; label: string; count: number; description: string; }
interface MemberRow {
  id: number; name: string; email: string; role: string; role_label: string;
  two_factor_enabled: boolean; last_active: string;
}
interface MatrixCapability { capability: string; roles: Record<string, boolean>; }
interface Matrix { roles: string[]; capabilities: MatrixCapability[]; }
interface Overview {
  stats: Stats; roles: RoleRow[]; members_table: MemberRow[]; permission_matrix: Matrix;
}

const ROLE_ICON: Record<string, React.ElementType> = {
  owner: Crown, admin: ShieldCheck, approver: ShieldQuestion, editor: PenSquare, viewer: Eye,
};

const ROLE_OPTIONS = ['owner', 'admin', 'approver', 'editor', 'viewer'];

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function TeamRolesPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(() => {
    teamApi.overview()
      .then((r) => setData(r.data as Overview))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Top-bar action: invite a new teammate.
  usePageAction({
    label: 'Invite teammate',
    icon: <UserPlus size={15} strokeWidth={2.5} />,
    onClick: () => setInviteOpen(true),
  });

  const updateRole = (id: number, role: string) => {
    if (!data) return;
    setData({
      ...data,
      members_table: data.members_table.map((m) => (m.id === id ? { ...m, role, role_label: role[0].toUpperCase() + role.slice(1) } : m)),
    });
    teamApi.updateMember(id, { permission_role: role });
  };

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    return roleFilter ? data.members_table.filter((m) => m.role === roleFilter) : data.members_table;
  }, [data, roleFilter]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [['Name', 'Email', 'Role', '2FA', 'Last Active'], ...filteredMembers.map((m) => [m.name, m.email, m.role_label, m.two_factor_enabled ? 'Enabled' : 'Off', m.last_active])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'team-members.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="rounded-3xl bg-[#e8e3db]/60 h-36" />)}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="bg-white border border-[#ede9e2] rounded-2xl p-10 text-center text-[#aaa]">Couldn't load team data.</div>;
  }

  const { stats, roles, permission_matrix } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1a1a1a] text-2xl font-black tracking-tight">Team & Roles</h2>
        <p className="text-[#aaa] text-sm mt-0.5">Manage admin accounts and their access permissions</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-[#c9f158] p-6 flex flex-col justify-between h-36">
          <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Members</span>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.members}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Admins</span>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.admins}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">2FA Coverage</span>
          <div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.two_factor_coverage_pct}%</p>
            <p className="text-[#22c55e] text-xs mt-1.5 font-semibold">+12pts vs last quarter</p>
          </div>
        </div>
        <div className="rounded-3xl bg-[#1a1a1a] p-6 flex flex-col justify-between h-36">
          <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Pending Invites</span>
          <p className="text-white text-4xl font-black leading-none tracking-tight">{stats.pending_invites}</p>
        </div>
      </div>

      {/* Roles + Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
          <h3 className="text-[#1a1a1a] font-black text-lg mb-4">Roles</h3>
          <div className="space-y-2">
            {roles.map((r) => {
              const Icon = ROLE_ICON[r.key] ?? Eye;
              const active = roleFilter === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setRoleFilter(active ? null : r.key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${active ? 'bg-[#1a1a1a]' : 'bg-[#faf8f5] hover:bg-[#f3efe8]'}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/10' : 'bg-white'}`}>
                    <Icon size={15} className={active ? 'text-[#c9f158]' : 'text-[#888]'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${active ? 'text-white' : 'text-[#1a1a1a]'}`}>{r.label}</p>
                    <p className={`text-[11px] mt-0.5 ${active ? 'text-white/50' : 'text-[#aaa]'}`}>Click to edit permissions</p>
                  </div>
                  <span className={`text-sm font-black px-2 py-0.5 rounded-full ${active ? 'bg-white/10 text-[#c9f158]' : 'bg-white text-[#1a1a1a]'}`}>{r.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#ede9e2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1a1a1a] font-black text-lg">Members</h3>
            <div className="flex items-center gap-2">
              {roleFilter && (
                <button onClick={() => setRoleFilter(null)} className="text-[#888] text-xs font-semibold hover:text-[#1a1a1a]">Clear filter</button>
              )}
              <button className="flex items-center gap-1.5 text-[#888] text-xs font-bold border border-[#ede9e2] px-3 py-1.5 rounded-full hover:bg-[#faf8f5]">
                <Filter size={12} /> Filter
              </button>
              <button onClick={exportCsv} className="flex items-center gap-1.5 text-[#888] text-xs font-bold border border-[#ede9e2] px-3 py-1.5 rounded-full hover:bg-[#faf8f5]">
                <Download size={12} /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">
                  <th className="text-left px-2 pb-2">Person</th>
                  <th className="text-left px-2 pb-2">Role</th>
                  <th className="text-left px-2 pb-2">2FA</th>
                  <th className="text-left px-2 pb-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="border-t border-[#f3efe8]">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-black">{initials(m.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#1a1a1a] font-bold truncate">{m.name}</p>
                          <p className="text-[#aaa] text-xs truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <select
                        value={m.role}
                        onChange={(e) => updateRole(m.id, e.target.value)}
                        className="bg-[#faf8f5] text-[#1a1a1a] text-xs font-bold rounded-full px-3 py-1.5 outline-none capitalize"
                      >
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2.5">
                      {m.two_factor_enabled
                        ? <span className="text-emerald-600 text-xs font-bold">Enabled</span>
                        : <span className="text-[#aaa] text-xs font-bold">Off</span>}
                    </td>
                    <td className="px-2 py-2.5 text-[#888] text-xs">{m.last_active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvited={load}
        />
      )}

      {/* Permission matrix */}
      <div className="bg-[#0b1416] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-lg">Permission matrix</h3>
          <button className="text-[#c9f158] text-xs font-bold hover:underline">Customize</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left text-[rgba(255,255,255,0.4)] text-[10px] font-bold uppercase tracking-wider pb-3">Capability</th>
                {permission_matrix.roles.map((r) => (
                  <th key={r} className="text-center text-[rgba(255,255,255,0.4)] text-[10px] font-bold uppercase tracking-wider pb-3 capitalize">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permission_matrix.capabilities.map((cap) => (
                <tr key={cap.capability} className="border-t border-white/5">
                  <td className="text-white text-sm font-semibold py-3">{cap.capability}</td>
                  {permission_matrix.roles.map((r) => (
                    <td key={r} className="text-center py-3">
                      {cap.roles[r]
                        ? <span className="inline-block w-2 h-2 rounded-full bg-[#c9f158] mx-auto" />
                        : <span className="inline-block w-2.5 h-px bg-white/15 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    if (!valid) { setError('Enter a valid email address'); return; }
    setSaving(true); setError(null);
    try {
      await teamApi.createInvite({ email: email.trim(), role });
      setDone(true);
      onInvited();
      setTimeout(onClose, 1100);
    } catch {
      setError('Could not send the invite. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#f0ece4]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f2ed]">
          <h3 className="font-black text-[#1a1a1a]">Invite teammate</h3>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"><X size={18} /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-12 h-12 rounded-full bg-[#c9f158] flex items-center justify-center"><Check size={22} className="text-[#1a1a1a]" /></div>
            <p className="text-[#1a1a1a] font-bold">Invite sent</p>
            <p className="text-[#aaa] text-sm">{email.trim()}</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">Email address</span>
              <input type="email" value={email} autoFocus onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder="teammate@company.al"
                className="mt-1.5 w-full bg-[#f8f5f0] border border-[#ede9e2] rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:border-[#1a1a1a]" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">Role</span>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="mt-1.5 w-full bg-[#f8f5f0] border border-[#ede9e2] rounded-xl px-3 py-2.5 text-sm text-[#1a1a1a] capitalize focus:outline-none focus:border-[#1a1a1a]">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border border-[#e5e0d8] text-[#888] py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f5f0] transition-colors">Cancel</button>
              <button onClick={submit} disabled={saving || !valid}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                Send invite
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
