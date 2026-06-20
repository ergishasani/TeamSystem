import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  CreditCard,
  BarChart2,
  Flame,
  Link2,
  Tag,
  QrCode,
  Wallet,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type Role = 'employer_admin' | 'provider_admin';

const employerNav = [
  {
    section: 'CATALOG',
    items: [
      { to: '/employer', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/employer/deal-of-day', label: 'Deal of the Day', icon: Flame },
      { to: '/employer/collaborations', label: 'Collaborations', icon: Link2 },
    ],
  },
  {
    section: 'OPERATIONS',
    items: [
      { to: '/employer/approvals', label: 'Approvals', icon: CheckSquare },
      { to: '/employer/employees', label: 'Employees', icon: Users },
      { to: '/employer/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    section: 'INSIGHTS',
    items: [
      { to: '/employer/insights', label: 'AI Insights', icon: BarChart2 },
    ],
  },
];

const providerNav = [
  {
    section: 'CATALOG',
    items: [
      { to: '/provider', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/provider/offers', label: 'Offers', icon: Tag },
    ],
  },
  {
    section: 'OPERATIONS',
    items: [
      { to: '/provider/redemptions', label: 'Redemptions', icon: QrCode },
      { to: '/provider/payments', label: 'Payments', icon: Wallet },
    ],
  },
];

interface Props {
  role: Role;
}

export default function Sidebar({ role }: Props) {
  const { user, logout } = useAuthStore();
  const sections = role === 'employer_admin' ? employerNav : providerNav;
  const portalLabel = role === 'employer_admin' ? 'Employer Portal' : 'Provider Portal';

  const initials = (user?.full_name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <aside className="w-60 bg-[#161616] border-r border-[#252525] flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-app-lime flex items-center justify-center flex-shrink-0">
            <span className="font-black text-sm text-[#111]">P</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Perka Admin</p>
            <p className="text-[#555] text-xs">{portalLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-5">
        {sections.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-app-lime text-[#111]'
                        : 'text-[#999] hover:text-white hover:bg-[#212121]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-[#252525] flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#212121] transition-colors">
          <div className="w-8 h-8 rounded-full bg-app-lime flex items-center justify-center flex-shrink-0">
            <span className="text-[#111] text-xs font-black">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {user?.full_name ?? 'Admin'}
            </p>
            <p className="text-[#555] text-xs truncate">{user?.email}</p>
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
