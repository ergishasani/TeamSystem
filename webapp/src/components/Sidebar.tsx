import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  CreditCard,
  BarChart2,
  Tag,
  QrCode,
  Wallet,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type Role = 'employer_admin' | 'provider_admin';

const employerNav = [
  { to: '/employer', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employer/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/employer/employees', label: 'Employees', icon: Users },
  { to: '/employer/payments', label: 'Payments', icon: CreditCard },
  { to: '/employer/insights', label: 'Insights', icon: BarChart2 },
];

const providerNav = [
  { to: '/provider', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/provider/offers', label: 'Offers', icon: Tag },
  { to: '/provider/redemptions', label: 'Redemptions', icon: QrCode },
  { to: '/provider/payments', label: 'Payments', icon: Wallet },
];

interface Props {
  role: Role;
}

export default function Sidebar({ role }: Props) {
  const { user, logout } = useAuthStore();
  const nav = role === 'employer_admin' ? employerNav : providerNav;

  return (
    <aside className="w-60 bg-app-surface border-r border-app-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-app-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-app-accent flex items-center justify-center">
            <span className="text-white font-black text-sm">P</span>
          </div>
          <span className="text-white font-bold text-lg">Perka</span>
          <span className="text-app-muted text-xs ml-1">Admin</span>
        </div>
      </div>

      {/* Role label */}
      <div className="px-6 py-3 border-b border-app-border">
        <p className="text-app-muted text-xs uppercase tracking-widest font-medium">
          {role === 'employer_admin' ? 'Employer Portal' : 'Provider Portal'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-app-accent-dim text-app-accent'
                  : 'text-app-muted hover:text-white hover:bg-app-card'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-app-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-app-accent-dim flex items-center justify-center flex-shrink-0">
            <span className="text-app-accent text-xs font-bold">
              {user?.full_name?.charAt(0) ?? '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-app-muted text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-app-muted hover:text-app-danger text-sm w-full transition-colors px-1 py-1"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
