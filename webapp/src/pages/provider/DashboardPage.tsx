import { useEffect, useState } from 'react';
import { Tag, QrCode } from 'lucide-react';
import { providerApi } from '../../lib/api';
import type { ProviderDashboard, Redemption } from '../../types';
import StatCard from '../../components/StatCard';
import Badge, { statusBadge } from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProviderDashboardPage() {
  const [stats, setStats] = useState<ProviderDashboard | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([providerApi.dashboard(), providerApi.redemptions()])
      .then(([dashRes, redRes]) => {
        setStats(dashRes.data);
        setRedemptions(redRes.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-app-muted text-sm mt-1">Overview of your offers and redemptions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Offers"
          value={stats?.total_offers ?? 0}
          icon={Tag}
          accent
        />
        <StatCard
          title="Pending Redemptions"
          value={stats?.pending_redemptions ?? 0}
          icon={QrCode}
        />
      </div>

      {/* Recent redemptions */}
      <div>
        <h2 className="text-white font-semibold mb-4">Recent Redemptions</h2>
        <div className="bg-app-card border border-app-border rounded-xl overflow-hidden">
          {redemptions.length === 0 ? (
            <div className="p-8 text-center text-app-muted text-sm">No redemptions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border">
                  <th className="text-left px-5 py-3 text-app-muted font-medium">QR Code</th>
                  <th className="text-left px-5 py-3 text-app-muted font-medium">Offer</th>
                  <th className="text-left px-5 py-3 text-app-muted font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-app-muted font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r, i) => {
                  const badge = statusBadge(r.status);
                  return (
                    <tr
                      key={r.id}
                      className={i < redemptions.length - 1 ? 'border-b border-app-border' : ''}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-app-muted">{r.qr_code}</td>
                      <td className="px-5 py-3 text-white">Offer #{r.offer_id}</td>
                      <td className="px-5 py-3">
                        <Badge label={badge.label} variant={badge.variant} />
                      </td>
                      <td className="px-5 py-3 text-app-muted">
                        {r.expires_at
                          ? new Date(r.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
