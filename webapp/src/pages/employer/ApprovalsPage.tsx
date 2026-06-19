import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { employerApi } from '../../lib/api';
import type { BenefitRequest } from '../../types';
import Badge, { statusBadge } from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = () => {
    setLoading(true);
    employerApi.approvals()
      .then((res) => setRequests(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await employerApi.approve(id);
      showToast('Request approved.', true);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to approve.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      await employerApi.reject(rejectModal.id, rejectReason || undefined);
      showToast('Request rejected.', true);
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to reject.', false);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Pending Approvals</h1>
        <p className="text-app-muted text-sm mt-1">Review and act on benefit requests from your employees</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-app-card border border-app-border rounded-xl p-12 text-center">
          <CheckCircle size={40} className="text-app-accent mx-auto mb-3" />
          <p className="text-white font-medium">All caught up!</p>
          <p className="text-app-muted text-sm mt-1">No pending requests at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const badge = statusBadge(req.status);
            return (
              <div key={req.id} className="bg-app-card border border-app-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">
                        Request #{req.id}
                      </span>
                      <Badge label={badge.label} variant={badge.variant} />
                      <span className="text-app-muted text-xs capitalize">{req.request_type}</span>
                    </div>
                    <p className="text-app-muted text-sm">
                      Employee ID: {req.employee_id} ·{' '}
                      {new Date(req.submitted_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {req.ai_reason && (
                      <p className="text-app-muted text-xs italic">"{req.ai_reason}"</p>
                    )}
                    {req.rejection_reason && (
                      <p className="text-red-400 text-xs">Reason: {req.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right mr-2">
                      <p className="text-app-accent font-bold text-lg">
                        {req.total_amount.toLocaleString()} {req.currency}
                      </p>
                    </div>
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1.5 bg-app-accent hover:bg-app-accent-dark disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          <CheckCircle size={15} />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: req.id })}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-red-500/30"
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-app-card border border-app-border rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-1">Reject Request</h3>
            <p className="text-app-muted text-sm mb-4">
              Optionally provide a reason for the employee.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason (optional)"
              rows={3}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-app-accent text-sm resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 bg-app-surface hover:bg-app-border text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {actionLoading !== null ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-xl z-50 ${toast.ok ? 'bg-app-accent text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
