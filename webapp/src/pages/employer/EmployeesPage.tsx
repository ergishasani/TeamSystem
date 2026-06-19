import { useEffect, useState } from 'react';
import { Users, Mail } from 'lucide-react';
import { employerApi } from '../../lib/api';
import type { User } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    employerApi.employees()
      .then((res) => setEmployees(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Employees</h1>
          <p className="text-app-muted text-sm mt-1">
            {employees.length} team member{employees.length !== 1 ? 's' : ''} in your company
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="bg-app-card border border-app-border rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-app-accent text-sm w-72 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-app-card border border-app-border rounded-xl p-12 text-center">
          <Users size={40} className="text-app-muted mx-auto mb-3" />
          <p className="text-white font-medium">No employees found</p>
          <p className="text-app-muted text-sm mt-1">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="bg-app-card border border-app-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-border">
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">#</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Name</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Email</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Currency</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr
                  key={emp.id}
                  className={`hover:bg-app-surface transition-colors ${i < filtered.length - 1 ? 'border-b border-app-border' : ''}`}
                >
                  <td className="px-5 py-4 text-app-muted">{emp.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-app-accent-dim flex items-center justify-center flex-shrink-0">
                        <span className="text-app-accent text-xs font-bold">
                          {emp.full_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-white font-medium">{emp.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-app-muted">
                      <Mail size={13} />
                      {emp.email}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-app-muted">{emp.currency}</td>
                  <td className="px-5 py-4 text-app-muted">
                    {new Date(emp.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
