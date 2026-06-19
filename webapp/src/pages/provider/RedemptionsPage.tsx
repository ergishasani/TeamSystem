import { useEffect, useState } from 'react';
import { QrCode, CheckCircle } from 'lucide-react';
import { providerApi } from '../../lib/api';
import type { Redemption } from '../../types';
import Badge, { statusBadge } from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = () => {
    providerApi.redemptions()
      .then((res) => setRedemptions(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirm = async (id: number) => {
    setConfirming(id);
    try {
      await providerApi.confirmRedemption(id);
      showToast('Redemption confirmed.', true);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to confirm.', false);
    } finally {
      setConfirming(null);
    }
  };

  const filtered = filter === 'all' ? redemptions : redemptions.filter((r) => r.status === filter);

  const counts = {
    all: redemptions.length,
    active: redemptions.filter((r) => r.status === 'active').length,
    redeemed: redemptions.filter((r) => r.status === 'redeemed').length,
    expired: redemptions.filter((r) => r.status === 'expired').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Redemptions</h1>
        <p className="text-app-muted text-sm mt-1">Confirm QR codes when customers redeem offers in person</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'redeemed', 'expired'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === tab
                ? 'bg-app-accent text-white'
                : 'bg-app-card border border-app-border text-app-muted hover:text-white'
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-app-card border border-app-border rounded-xl p-12 text-center">
          <QrCode size={40} className="text-app-muted mx-auto mb-3" />
          <p className="text-white font-medium">No redemptions found</p>
          <p className="text-app-muted text-sm mt-1">Redemptions appear when customers request your offers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const badge = statusBadge(r.status);
            return (
              <div key={r.id} className="bg-app-card border border-app-border rounded-xl p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">Offer #{r.offer_id}</span>
                      <Badge label={badge.label} variant={badge.variant} />
                    </div>
                    <p className="font-mono text-xs text-app-accent bg-app-accent-dim px-2 py-1 rounded-lg inline-block">
                      {r.qr_code}
                    </p>
                    <p className="text-app-muted text-xs">
                      Request #{r.request_id}
                      {r.expires_at && (
                        <> · Expires {new Date(r.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      )}
                      {r.redeemed_at && (
                        <> · Redeemed {new Date(r.redeemed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      )}
                    </p>
                  </div>

                  {r.status === 'active' && (
                    <button
                      onClick={() => handleConfirm(r.id)}
                      disabled={confirming === r.id}
                      className="flex items-center gap-2 bg-app-accent hover:bg-app-accent-dark disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                    >
                      <CheckCircle size={15} />
                      {confirming === r.id ? 'Confirming...' : 'Confirm Redemption'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-xl z-50 ${toast.ok ? 'bg-app-accent text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
