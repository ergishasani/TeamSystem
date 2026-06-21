import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import PlatformLayout from './components/PlatformLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Provider pages
import ProviderDashboard from './pages/provider/DashboardPage';
import OffersPage from './pages/provider/OffersPage';
import RedemptionsPage from './pages/provider/RedemptionsPage';
import ProviderPaymentsPage from './pages/provider/PaymentsPage';

// Platform pages
import PlatformOverview from './pages/platform/OverviewPage';
import PlatformOffersPage from './pages/platform/OffersPage';
import PackagesPage from './pages/platform/PackagesPage';
import DailyDropPage from './pages/platform/DailyDropPage';
import CollabsPage from './pages/platform/CollabsPage';
import PlatformRequestsPage from './pages/platform/RequestsPage';
import RedemptionsPlatformPage from './pages/platform/RedemptionsPage';
import UsersPage from './pages/platform/UsersPage';
import WalletsPage from './pages/platform/WalletsPage';
import DonationsPage from './pages/platform/DonationsPage';
import ProvidersPage from './pages/platform/ProvidersPage';
import CategoriesPage from './pages/platform/CategoriesPage';
import AnalyticsPage from './pages/platform/AnalyticsPage';
import SettingsPage from './pages/platform/SettingsPage';
import CampaignsPage from './pages/platform/CampaignsPage';
import NotificationsPage from './pages/platform/NotificationsPage';
import TeamRolesPage from './pages/platform/TeamRolesPage';

const ADMIN_ROLES = ['employer_admin', 'platform_admin'];

function RootRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (ADMIN_ROLES.includes(user.role)) return <Navigate to="/platform" replace />;
  if (user.role === 'provider_admin') return <Navigate to="/provider" replace />;
  return <Navigate to="/login" replace />;
}

function RequireAuth({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <LoadingSpinner fullScreen />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadUser, token } = useAuthStore();

  useEffect(() => {
    if (token) loadUser();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Platform Admin — accessible by employer_admin and platform_admin */}
        <Route
          path="/platform"
          element={
            <RequireAuth roles={ADMIN_ROLES}>
              <PlatformLayout />
            </RequireAuth>
          }
        >
          <Route index element={<PlatformOverview />} />
          <Route path="offers" element={<PlatformOffersPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="daily-drop" element={<DailyDropPage />} />
          <Route path="collabs" element={<CollabsPage />} />
          <Route path="requests" element={<PlatformRequestsPage />} />
          <Route path="redemptions" element={<RedemptionsPlatformPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="wallets" element={<WalletsPage />} />
          <Route path="donations" element={<DonationsPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="team-roles" element={<TeamRolesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Provider Admin */}
        <Route
          path="/provider"
          element={
            <RequireAuth roles={['provider_admin']}>
              <Layout role="provider_admin" />
            </RequireAuth>
          }
        >
          <Route index element={<ProviderDashboard />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="redemptions" element={<RedemptionsPage />} />
          <Route path="payments" element={<ProviderPaymentsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
