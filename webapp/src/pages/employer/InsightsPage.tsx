import { useState } from 'react';
import { BarChart2, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { aiApi } from '../../lib/api';
import type { EmployerInsights } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORY_COLORS = [
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-cyan-500',
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<EmployerInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    aiApi.employerInsights()
      .then((res) => setInsights(res.data))
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to load insights.');
      })
      .finally(() => setLoading(false));
  };

  const maxSpend = insights
    ? Math.max(...insights.category_spend.map((c) => c.total), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">AI Insights</h1>
          <p className="text-app-muted text-sm mt-1">Aggregated analytics for your company's benefit usage</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 bg-app-accent hover:bg-app-accent-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {insights ? 'Refresh' : 'Generate Insights'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="bg-app-card border border-app-border rounded-xl p-12 text-center">
          <BarChart2 size={48} className="text-app-muted mx-auto mb-4" />
          <p className="text-white font-medium text-lg">No insights yet</p>
          <p className="text-app-muted text-sm mt-2 mb-6">
            Click "Generate Insights" to analyse your company's benefit activity.
          </p>
        </div>
      )}

      {loading && <LoadingSpinner />}

      {insights && !loading && (
        <div className="space-y-4">
          {/* AI Insight highlight */}
          <div className="bg-app-accent-dim border border-app-accent/30 rounded-xl px-5 py-4 flex gap-3">
            <Zap size={20} className="text-app-accent flex-shrink-0 mt-0.5" />
            <p className="text-white text-sm leading-relaxed">{insights.insight}</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="Total Requests" value={`${insights.total_requests}`} />
            <MetricCard label="Approval Rate" value={`${(insights.approval_rate * 100).toFixed(0)}%`} />
            <MetricCard label="Avg Spend / Request" value={`${insights.avg_spend.toLocaleString()} ALL`} />
            <MetricCard label="Total Approved" value={`${insights.approved_total.toLocaleString()} ALL`} />
            <MetricCard label="Budget Utilisation" value={`${(insights.avg_budget_utilization * 100).toFixed(0)}%`} />
          </div>

          {/* Category spend chart */}
          {insights.category_spend.length > 0 && (
            <div className="bg-app-card border border-app-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={18} className="text-app-accent" />
                <h3 className="text-white font-semibold">Spend by Category</h3>
              </div>
              <div className="space-y-3">
                {[...insights.category_spend]
                  .sort((a, b) => b.total - a.total)
                  .map((c, i) => (
                    <div key={c.category}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white capitalize">{c.category}</span>
                        <span className="text-app-muted">{c.total.toLocaleString()} ALL</span>
                      </div>
                      <div className="h-2 bg-app-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                          style={{ width: `${(c.total / maxSpend) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top categories */}
          {insights.top_categories.length > 0 && (
            <div className="bg-app-card border border-app-border rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Top Categories</h3>
              <div className="flex flex-wrap gap-2">
                {insights.top_categories.map((cat, i) => (
                  <span
                    key={cat}
                    className="bg-app-accent-dim border border-app-accent/20 text-app-accent text-xs px-3 py-1 rounded-full capitalize font-medium"
                  >
                    #{i + 1} {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-app-card border border-app-border rounded-xl px-4 py-4">
      <p className="text-app-muted text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-xl">{value}</p>
    </div>
  );
}
