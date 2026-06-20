import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { notificationsApi } from '../../lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export default function NotificationsDropdown({ open, onClose, onUnreadChange, anchorRef }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    notificationsApi.list()
      .then(r => {
        const data = r.data as Notification[];
        setItems(data);
        onUnreadChange(data.filter(n => !n.is_read).length);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const markRead = async (id: number) => {
    await notificationsApi.markRead(id).catch(() => {});
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    onUnreadChange(items.filter(n => !n.is_read && n.id !== id).length);
  };

  const markAll = async () => {
    await notificationsApi.markAllRead().catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    onUnreadChange(0);
  };

  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!open) return null;

  const unread = items.filter(n => !n.is_read).length;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-80 bg-white border border-[#f0ece4] rounded-2xl shadow-xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f2ed]">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[#888]" />
          <span className="text-[#1a1a1a] text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <span className="bg-app-lime text-[#111] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={markAll}
              title="Mark all read"
              className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[#bbb] hover:text-[#888] p-1 rounded-lg hover:bg-[#f5f2ed] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <p className="text-center text-[#bbb] text-sm py-8">Loading…</p>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-10">
            <Bell size={28} className="text-[#ddd] mx-auto mb-2" />
            <p className="text-[#bbb] text-sm">No notifications</p>
          </div>
        )}
        {!loading && items.map(n => (
          <div
            key={n.id}
            className={`px-4 py-3 border-b border-[#f8f5f0] last:border-0 flex items-start gap-3 transition-colors ${
              n.is_read ? 'bg-white' : 'bg-[#fdfcfb]'
            }`}
          >
            {/* Dot */}
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-app-lime'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${n.is_read ? 'text-[#888]' : 'text-[#1a1a1a] font-medium'}`}>
                {n.title}
              </p>
              {n.message && (
                <p className="text-xs text-[#aaa] mt-0.5 line-clamp-2">{n.message}</p>
              )}
              <p className="text-[10px] text-[#ccc] mt-1">{timeAgo(n.created_at)}</p>
            </div>
            {!n.is_read && (
              <button
                onClick={() => markRead(n.id)}
                title="Mark read"
                className="text-[#ccc] hover:text-[#888] flex-shrink-0 mt-0.5 transition-colors"
              >
                <Check size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
