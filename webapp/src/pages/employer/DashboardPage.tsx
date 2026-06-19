import { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { employerApi } from '../../lib/api';
import type { EmployerDashboard, User } from '../../types';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EmployerDashboardPage() {
  const [stats, setStats] = useState<EmployerDashboard | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([employerApi.dashboard(), employerApi.employees()])
      .then(([dashRes, empRes]) => {
        setStats(dashRes.data);
        setEmployees(empRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const rejected = (stats?.total_requests ?? 0) - (stats?.pending ?? 0) - (stats?.approved ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-app-muted text-sm mt-1">Overview of your company's benefit activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.total_requests ?? 0}
          icon={Clock}
        />
        <StatCard
          title="Pending"
          value={stats?.pending ?? 0}
          icon={Clock}
          accent
        />
        <StatCard
          title="Approved"
          value={stats?.approved ?? 0}
          icon={CheckCircle}
        />
        <StatCard
          title="Employees"
          value={employees.length}
          icon={Users}
        />
      </div>

      {/* Recent employees */}
      <div>
        <h2 className="text-white font-semibold mb-4">Team Members</h2>
        <div className="bg-app-card border border-app-border rounded-xl overflow-hidden">
          {employees.length === 0 ? (
            <div className="p-8 text-center text-app-muted text-sm">No employees found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border">
                  <th className="text-left px-5 py-3 text-app-muted font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-app-muted font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-app-muted font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr
                    key={emp.id}
                    className={i < employees.length - 1 ? 'border-b border-app-border' : ''}
                  >
                    <td className="px-5 py-3 text-white font-medium">{emp.full_name}</td>
                    <td className="px-5 py-3 text-app-muted">{emp.email}</td>
                    <td className="px-5 py-3 text-app-muted">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
