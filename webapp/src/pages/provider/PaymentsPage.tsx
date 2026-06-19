import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { providerApi } from '../../lib/api';
import type { Payment } from '../../types';
import Badge, { statusBadge } from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProviderPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerApi.payments()
      .then((res) => setPayments(res.data))
      .finally(() => setLoading(false));
  }, []);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const currency = payments[0]?.currency ?? 'ALL';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Payments Received</h1>
        <p className="text-app-muted text-sm mt-1">Payments from approved benefit requests</p>
      </div>

      {/* Summary */}
      <div className="bg-app-accent-dim border border-app-accent/30 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-app-muted text-sm">Total received</p>
          <p className="text-app-accent text-2xl font-bold mt-0.5">
            {total.toLocaleString()} {currency}
          </p>
        </div>
        <Wallet size={32} className="text-app-accent opacity-50" />
      </div>

      {payments.length === 0 ? (
        <div className="bg-app-card border border-app-border rounded-xl p-12 text-center">
          <Wallet size={40} className="text-app-muted mx-auto mb-3" />
          <p className="text-white font-medium">No payments yet</p>
          <p className="text-app-muted text-sm mt-1">Payments appear when offers are approved and redeemed.</p>
        </div>
      ) : (
        <div className="bg-app-card border border-app-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-border">
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">ID</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Request</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Amount</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Status</th>
                <th className="text-left px-5 py-3.5 text-app-muted font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const badge = statusBadge(p.status);
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-app-surface transition-colors ${i < payments.length - 1 ? 'border-b border-app-border' : ''}`}
                  >
                    <td className="px-5 py-3.5 text-app-muted">#{p.id}</td>
                    <td className="px-5 py-3.5 text-white">Request #{p.request_id}</td>
                    <td className="px-5 py-3.5 text-app-accent font-semibold">
                      {p.amount.toLocaleString()} {p.currency}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={badge.label} variant={badge.variant} />
                    </td>
                    <td className="px-5 py-3.5 text-app-muted">
                      {new Date(p.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
