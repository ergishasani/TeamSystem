import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Employer pages
import EmployerDashboard from './pages/employer/DashboardPage';
import ApprovalsPage from './pages/employer/ApprovalsPage';
import EmployeesPage from './pages/employer/EmployeesPage';
import EmployerPaymentsPage from './pages/employer/PaymentsPage';
import InsightsPage from './pages/employer/InsightsPage';
import DealOfDayPage from './pages/employer/DealOfDayPage';
import CollaborationsPage from './pages/employer/CollaborationsPage';

// Provider pages
import ProviderDashboard from './pages/provider/DashboardPage';
import OffersPage from './pages/provider/OffersPage';
import RedemptionsPage from './pages/provider/RedemptionsPage';
import ProviderPaymentsPage from './pages/provider/PaymentsPage';

function RootRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'employer_admin') return <Navigate to="/employer" replace />;
  if (user.role === 'provider_admin') return <Navigate to="/provider" replace />;
  return <Navigate to="/login" replace />;
}

function RequireAuth({ children, role }: { children: React.ReactNode; role: string }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <LoadingSpinner fullScreen />;
  if (user.role !== role) return <Navigate to="/" replace />;
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

        {/* Employer Admin */}
        <Route
          path="/employer"
          element={
            <RequireAuth role="employer_admin">
              <Layout role="employer_admin" />
            </RequireAuth>
          }
        >
          <Route index element={<EmployerDashboard />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="payments" element={<EmployerPaymentsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="deal-of-day" element={<DealOfDayPage />} />
          <Route path="collaborations" element={<CollaborationsPage />} />
        </Route>

        {/* Provider Admin */}
        <Route
          path="/provider"
          element={
            <RequireAuth role="provider_admin">
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
