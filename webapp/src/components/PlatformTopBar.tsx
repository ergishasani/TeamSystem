import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Bell, ArrowUpRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchModal from './platform/SearchModal';
import NotificationsDropdown from './platform/NotificationsDropdown';
import { usePageActionStore } from '../store/pageActionStore';

// ─── Route meta ───────────────────────────────────────────────────────────────

type RouteMeta = { section: string; title: string };

const ROUTE_MAP: Record<string, RouteMeta> = {
  '/platform':              { section: '', title: 'Operations' },
  '/platform/offers':       { section: 'CATALOG', title: 'Offers' },
  '/platform/packages':     { section: 'CATALOG', title: 'Packages' },
  '/platform/daily-drop':   { section: 'CATALOG', title: 'Daily Drop' },
  '/platform/collabs':      { section: 'CATALOG', title: 'Collabs' },
  '/platform/requests':     { section: 'OPERATIONS', title: 'Requests' },
  '/platform/redemptions':  { section: 'OPERATIONS', title: 'Redemptions' },
  '/platform/users':        { section: 'OPERATIONS', title: 'Users' },
  '/platform/wallets':      { section: 'OPERATIONS', title: 'Wallets' },
  '/platform/providers':    { section: 'NETWORK', title: 'Providers' },
  '/platform/categories':   { section: 'NETWORK', title: 'Categories' },
  '/platform/analytics':    { section: 'NETWORK', title: 'Analytics' },
  '/platform/campaigns':    { section: 'GROWTH', title: 'Campaigns' },
  '/platform/notifications':{ section: 'GROWTH', title: 'Notifications' },
  '/platform/team-roles':   { section: 'WORKSPACE', title: 'Team & Roles' },
  '/platform/settings':     { section: 'WORKSPACE', title: 'Settings' },
};

function getDateLabel() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${day} · ${month} ${now.getDate()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlatformTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);
  const pageAction = usePageActionStore((s) => s.action);

  const meta = ROUTE_MAP[location.pathname] ?? { section: '', title: 'Platform' };
  const isOverview = location.pathname === '/platform';
  const topLabel = isOverview ? getDateLabel() : meta.section;

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="flex items-center justify-between gap-6 px-8 py-5 flex-shrink-0">
        {/* Left: breadcrumb + title */}
        <div className="flex-shrink-0">
          {topLabel && (
            <p className="text-[#aaa] text-[11px] font-bold uppercase tracking-[0.18em] mb-0.5">
              {topLabel}
            </p>
          )}
          <h1 className="text-[#1a1a1a] text-[34px] font-black leading-none tracking-tight">
            {meta.title}
          </h1>
        </div>

        {/* Right: search + actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 bg-white border border-[#e5e0d8] rounded-full px-4 py-2.5 w-[340px] shadow-sm hover:border-[#ccc] transition-colors text-left"
          >
            <Search size={14} className="text-[#bbb] flex-shrink-0" />
            <span className="text-[#bbb] text-sm flex-1 select-none whitespace-nowrap">
              Search offers, users, requests...
            </span>
            <span className="text-[#ccc] text-[10px] border border-[#e5e0d8] px-1.5 py-0.5 rounded-md font-mono leading-none flex-shrink-0">
              ⌘K
            </span>
          </button>

          {pageAction && !pageAction.hidden && (
            <button
              onClick={pageAction.onClick}
              disabled={pageAction.disabled}
              className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#2e2e2e] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
            >
              {pageAction.icon ?? <Plus size={15} strokeWidth={2.5} />}
              {pageAction.label}
            </button>
          )}

          <div className="relative">
            <button
              ref={bellRef}
              onClick={() => setNotifOpen(o => !o)}
              className="w-[42px] h-[42px] flex items-center justify-center bg-white border border-[#e5e0d8] rounded-full text-[#666] hover:bg-[#f5f0e8] transition-colors shadow-sm flex-shrink-0"
            >
              <Bell size={17} />
              <span className="absolute top-[9px] right-[9px] w-[7px] h-[7px] bg-[#c9f158] rounded-full ring-[1.5px] ring-white" style={{ opacity: unreadCount > 0 ? 1 : 0.6 }} />
            </button>
            <NotificationsDropdown
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              onUnreadChange={setUnreadCount}
              anchorRef={bellRef}
            />
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[#444] hover:text-[#1a1a1a] text-sm font-medium px-4 py-2.5 rounded-full border border-[#e5e0d8] bg-white hover:bg-[#f5f0e8] transition-colors shadow-sm whitespace-nowrap"
          >
            Exit to app
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
