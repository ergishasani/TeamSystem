import { useEffect, useState } from 'react';
import { Bell, Mail, Slack, Filter, Plus, Moon } from 'lucide-react';
import { broadcastsApi } from '../../lib/api';
import { usePageAction } from '../../store/pageActionStore';

interface Stats { sent_this_week: number; avg_open_rate_pct: number; unsubscribes: number; scheduled: number; }
interface BroadcastRow {
  id: number; name: string; channel: string; audience: string; sent_count: number;
  open_rate_pct: number; status: string; sent_at: string | null; scheduled_at: string | null;
}
interface Channels { volume_7d: Record<string, number>; quiet_hours_start: string; quiet_hours_end: string; push_muted_during_quiet_hours: boolean; }
interface Template { id: number; name: string; channel: string; sends_count: number; last_used_at: string | null; }
interface Overview { stats: Stats; recent_broadcasts: BroadcastRow[]; channels: Channels; templates: Template[]; }

const CHANNEL_ICON: Record<string, React.ElementType> = { push: Bell, email: Mail, slack: Slack };
const CHANNEL_COLOR: Record<string, string> = { push: '#60a5fa', email: '#fbbf24', slack: '#a78bfa' };
const STATUS_COLOR: Record<string, string> = { sent: '#22c55e', scheduled: '#fbbf24', draft: '#aaa' };

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function NotificationsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [editingCadence, setEditingCadence] = useState(false);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  useEffect(() => {
    broadcastsApi.overview()
      .then((r) => setData(r.data as Overview))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Top-bar action: start a new notification template.
  usePageAction({
    label: 'New template',
    onClick: () => setNewTemplateOpen(true),
  });

  const saveCadence = (start: string, end: string, muted: boolean) => {
    if (!data) return;
    setData({ ...data, channels: { ...data.channels, quiet_hours_start: start, quiet_hours_end: end, push_muted_during_quiet_hours: muted } });
    broadcastsApi.updateCadence({ quiet_hours_start: start, quiet_hours_end: end, push_muted_during_quiet_hours: muted });
    setEditingCadence(false);
  };

  const createTemplate = () => {
    if (!data || !newTemplateName.trim()) return;
    broadcastsApi.createTemplate({ name: newTemplateName.trim(), channel: 'push' }).then((r) => {
      setData({ ...data, templates: [r.data as Template, ...data.templates] });
    });
    setNewTemplateName('');
    setNewTemplateOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="rounded-3xl bg-[#e8e3db]/60 h-36" />)}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="bg-white border border-[#ede9e2] rounded-2xl p-10 text-center text-[#aaa]">Couldn't load notifications data.</div>;
  }

  const { stats, channels, templates } = data;
  const broadcasts = (channelFilter ? data.recent_broadcasts.filter((b) => b.channel === channelFilter) : data.recent_broadcasts)
    .slice(0, showAll ? undefined : 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1a1a1a] text-2xl font-black tracking-tight">Notifications</h2>
        <p className="text-[#aaa] text-sm mt-0.5">Send and schedule platform notifications</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-[#c9f158] p-6 flex flex-col justify-between h-36">
          <span className="text-[#4a5e00] text-[10px] font-bold uppercase tracking-[0.15em]">Sent This Week</span>
          <div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.sent_this_week.toLocaleString()}</p>
            <p className="text-[#4a5e00] text-xs mt-1.5 font-medium">+18% vs last week</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Avg Open Rate</span>
          <div>
            <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.avg_open_rate_pct}%</p>
            <p className="text-[#22c55e] text-xs mt-1.5 font-semibold">+4pts</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 flex flex-col justify-between h-36 border border-[#ede9e2]">
          <span className="text-[#aaa] text-[10px] font-bold uppercase tracking-[0.15em]">Unsubscribes</span>
          <p className="text-[#1a1a1a] text-4xl font-black leading-none tracking-tight">{stats.unsubscribes}</p>
        </div>
        <div className="rounded-3xl bg-[#1a1a1a] p-6 flex flex-col justify-between h-36">
          <span className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em]">Scheduled</span>
          <p className="text-white text-4xl font-black leading-none tracking-tight">{stats.scheduled}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent broadcasts */}
        <div className="lg:col-span-2 bg-white border border-[#ede9e2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1a1a1a] font-black text-lg">Recent broadcasts</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChannelFilter(channelFilter ? null : 'push')}
                className="flex items-center gap-1.5 text-[#888] text-xs font-bold border border-[#ede9e2] px-3 py-1.5 rounded-full hover:bg-[#faf8f5]"
              >
                <Filter size={12} /> {channelFilter ? `Filter: ${channelFilter}` : 'Filter'}
              </button>
              <button onClick={() => setShowAll(!showAll)} className="text-[#888] text-xs font-bold hover:text-[#1a1a1a]">
                {showAll ? 'Show less' : 'View all'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#aaa] text-[10px] font-bold uppercase tracking-wider">
                  <th className="text-left px-2 pb-2">Name</th>
                  <th className="text-left px-2 pb-2">Channel</th>
                  <th className="text-left px-2 pb-2">Audience</th>
                  <th className="text-left px-2 pb-2">Sent</th>
                  <th className="text-left px-2 pb-2">Open</th>
                  <th className="text-left px-2 pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b) => (
                  <tr key={b.id} className="border-t border-[#f3efe8]">
                    <td className="px-2 py-2.5 text-[#1a1a1a] font-bold">{b.name}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                        style={{ background: `${CHANNEL_COLOR[b.channel]}1a`, color: CHANNEL_COLOR[b.channel] }}
                      >
                        {b.channel}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[#888] text-xs">{b.audience}</td>
                    <td className="px-2 py-2.5 text-[#1a1a1a] text-xs font-semibold">{b.sent_count.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-[#1a1a1a] text-xs font-semibold">{b.status === 'sent' ? `${b.open_rate_pct}%` : '—'}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                        style={{ background: `${STATUS_COLOR[b.status]}1a`, color: STATUS_COLOR[b.status] }}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channels */}
        <div className="bg-[#0b1416] rounded-2xl p-6">
          <h3 className="text-white font-black text-lg mb-4">Channels</h3>
          <div className="space-y-2.5 mb-5">
            {Object.entries(channels.volume_7d).map(([ch, vol]) => {
              const Icon = CHANNEL_ICON[ch] ?? Bell;
              return (
                <div key={ch} className="flex items-center justify-between bg-white/5 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color: CHANNEL_COLOR[ch] }} />
                    <span className="text-white text-xs font-semibold capitalize">{ch}</span>
                  </div>
                  <span className="text-white text-sm font-black">{vol.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[rgba(255,255,255,0.4)] text-[10px] font-bold uppercase tracking-wider mb-2">Quiet hours</p>
          {editingCadence ? (
            <CadenceEditor channels={channels} onSave={saveCadence} onCancel={() => setEditingCadence(false)} />
          ) : (
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3.5 py-3 mb-2">
              <Moon size={13} className="text-[#c9f158]" />
              <span className="text-white text-sm font-bold">{channels.quiet_hours_start} → {channels.quiet_hours_end}</span>
            </div>
          )}
          <p className="text-[rgba(255,255,255,0.35)] text-[11px] mb-4">Push muted; transactional always allowed</p>
          <button
            onClick={() => setEditingCadence(true)}
            className="w-full bg-[#c9f158] text-[#1a1a1a] text-xs font-bold py-2.5 rounded-full hover:bg-[#bce64a] transition-colors"
          >
            Edit cadence rules
          </button>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#1a1a1a] font-black text-lg">Templates</h3>
          {newTemplateOpen ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createTemplate()}
                placeholder="Template name"
                className="bg-[#faf8f5] rounded-full px-3 py-1.5 text-xs outline-none"
              />
              <button onClick={createTemplate} className="text-[#1a1a1a] text-xs font-bold hover:underline">Save</button>
              <button onClick={() => setNewTemplateOpen(false)} className="text-[#aaa] text-xs font-bold hover:underline">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setNewTemplateOpen(true)} className="flex items-center gap-1.5 text-[#888] hover:text-[#1a1a1a] text-xs font-bold">
              <Plus size={13} /> New template
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {templates.map((t) => {
            const Icon = CHANNEL_ICON[t.channel] ?? Bell;
            return (
              <div key={t.id} className="bg-[#faf8f5] rounded-2xl p-4">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full mb-3"
                  style={{ background: `${CHANNEL_COLOR[t.channel]}1a`, color: CHANNEL_COLOR[t.channel] }}
                >
                  <Icon size={10} /> {t.channel}
                </span>
                <p className="text-[#1a1a1a] text-sm font-bold">{t.name}</p>
                <p className="text-[#aaa] text-xs mt-1">{t.sends_count} sends · last {fmtDate(t.last_used_at)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CadenceEditor({
  channels, onSave, onCancel,
}: { channels: Channels; onSave: (start: string, end: string, muted: boolean) => void; onCancel: () => void }) {
  const [start, setStart] = useState(channels.quiet_hours_start);
  const [end, setEnd] = useState(channels.quiet_hours_end);
  const [muted, setMuted] = useState(channels.push_muted_during_quiet_hours);
  return (
    <div className="bg-white/5 rounded-xl px-3.5 py-3 mb-2 space-y-2">
      <div className="flex items-center gap-2">
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 outline-none" />
        <span className="text-white/40 text-xs">→</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 outline-none" />
      </div>
      <label className="flex items-center gap-2 text-white/60 text-[11px]">
        <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} /> Mute push during quiet hours
      </label>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onSave(start, end, muted)} className="text-[#c9f158] text-xs font-bold hover:underline">Save</button>
        <button onClick={onCancel} className="text-white/40 text-xs font-bold hover:underline">Cancel</button>
      </div>
    </div>
  );
}
