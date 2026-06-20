import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Tag,
  Box,
  Flame,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Users,
  Wallet,
  Building2,
  Grid3X3,
  BarChart2,
  Megaphone,
  Bell,
  UserCog,
  Settings2,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';

type Item = {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badgeKey?: string;
};

const NAV: { section: string; items: Item[] }[] = [
  {
    section: 'CATALOG',
    items: [
      { to: '/platform', label: 'Overview', icon: Sparkles, end: true },
      { to: '/platform/offers', label: 'Offers', icon: Tag, badgeKey: 'offers' },
      { to: '/platform/packages', label: 'Packages', icon: Box, badgeKey: 'packages' },
      { to: '/platform/daily-drop', label: 'Daily Drop', icon: Flame },
      { to: '/platform/collabs', label: 'Collabs', icon: Layers, badgeKey: 'collabs' },
    ],
  },
  {
    section: 'OPERATIONS',
    items: [
      { to: '/platform/requests', label: 'Requests', icon: CheckCircle2, badgeKey: 'requests' },
      { to: '/platform/redemptions', label: 'Redemptions', icon: ShieldCheck },
      { to: '/platform/users', label: 'Users', icon: Users },
      { to: '/platform/wallets', label: 'Wallets', icon: Wallet },
    ],
  },
  {
    section: 'NETWORK',
    items: [
      { to: '/platform/providers', label: 'Providers', icon: Building2 },
      { to: '/platform/categories', label: 'Categories', icon: Grid3X3, badgeKey: 'categories' },
      { to: '/platform/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    section: 'GROWTH',
    items: [
      { to: '/platform/campaigns', label: 'Campaigns', icon: Megaphone },
      { to: '/platform/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    section: 'WORKSPACE',
    items: [
      { to: '/platform/team-roles', label: 'Team & Roles', icon: UserCog },
      { to: '/platform/settings', label: 'Settings', icon: Settings2 },
    ],
  },
];

export default function PlatformSidebar() {
  const { user, logout } = useAuthStore();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.allSettled([
      apiClient
        .get('/offers', { params: { limit: 1 } })
        .then((r) => ['offers', r.data.total as number] as const),
      apiClient
        .get('/packages')
        .then((r) => ['packages', (r.data as unknown[]).length] as const),
      apiClient
        .get('/collaborations')
        .then((r) => ['collabs', (r.data as unknown[]).length] as const),
    ]).then((results) => {
      const b: Record<string, number> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const [key, val] = r.value;
          b[key] = val;
        }
      }
      setBadges(b);
    });
  }, []);

  const initials = (user?.full_name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PA';

  return (
    <aside className="w-60 bg-[#161616] border-r border-[#252525] flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-app-lime flex items-center justify-center flex-shrink-0">
            <span className="font-black text-sm text-[#111]">P</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Perka Admin</p>
            <p className="text-[#555] text-xs">Operations Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-5">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon, end, badgeKey }) => {
                const badgeVal = badgeKey != null ? badges[badgeKey] : undefined;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-app-lime text-[#111]'
                          : 'text-[#999] hover:text-white hover:bg-[#212121]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                          <span>{label}</span>
                        </div>
                        {badgeVal != null && badgeVal > 0 && (
                          <span
                            className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isActive
                                ? 'bg-[#111]/15 text-[#111]'
                                : 'bg-[#2a2a2a] text-[#bbb]'
                            }`}
                          >
                            {badgeVal}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-[#252525] flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#212121] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-app-lime flex items-center justify-center flex-shrink-0">
            <span className="text-[#111] text-xs font-black">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {user?.full_name ?? 'Platform Admin'}
            </p>
            <p className="text-[#555] text-xs">Ops Admin</p>
          </div>
          <ChevronRight size={14} className="text-[#444] flex-shrink-0" />
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-[#555] hover:text-red-400 text-xs w-full mt-1 px-3 py-1.5 rounded-lg transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
