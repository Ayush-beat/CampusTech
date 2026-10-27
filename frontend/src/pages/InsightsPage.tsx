import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Recommendation, NotificationItem } from '../types';
import { CurrencyDisplay, toNum } from '../components/common/CurrencyDisplay';
import { EmptyState } from '../components/common/EmptyState';

export const InsightsPage: React.FC = () => {
  const { year, month } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'active' | 'reviewed' | 'dismissed'>('active');
  const [isLoading, setIsLoading] = useState(true);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const [recs, notifs] = await Promise.all([
        api.getRecommendations(year, month),
        api.getNotifications(),
      ]);
      setRecommendations(recs || []);
      setNotifications(notifs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [year, month]);

  const handleUpdateStatus = async (id: number, newStatus: 'reviewed' | 'dismissed') => {
    try {
      await api.updateRecommendationStatus(id, newStatus);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecs = recommendations.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Intelligent Spending Recommendations
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Transparent, rule-based financial guidance derived from your transaction history
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-paper border border-border-subtle p-1 rounded-md text-xs">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded transition-ledger font-medium ${
              statusFilter === 'active'
                ? 'bg-ledger text-paper shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Active ({recommendations.filter((r) => r.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('reviewed')}
            className={`px-3 py-1 rounded transition-ledger font-medium ${
              statusFilter === 'reviewed'
                ? 'bg-ledger text-paper shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Reviewed
          </button>
          <button
            onClick={() => setStatusFilter('dismissed')}
            className={`px-3 py-1 rounded transition-ledger font-medium ${
              statusFilter === 'dismissed'
                ? 'bg-ledger text-paper shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Dismissed
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-4 rounded-ledger bg-surface-soft border border-border-subtle flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-ledger shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-ink">Explainable Recommendation Engine:</span>{' '}
          <span className="text-ink-muted">
            All suggestions are calculated deterministically using Python financial rules over your actual database records. 
            We explain precisely what pattern was detected, why it affects your budget, the exact rupee or percentage impact, and an actionable next step.
          </span>
        </div>
      </div>

      {/* Recommendations Cards List */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-ledger" />
          <p className="text-xs text-ink-muted mt-2">Evaluating financial rules...</p>
        </div>
      ) : filteredRecs.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter} recommendations`}
          description="Your financial pace looks stable or more transaction data is needed to detect subtle spending patterns."
        />
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec) => (
            <div
              key={rec.id}
              className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle hover:border-ledger/30 transition-ledger"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-ledger-soft text-ledger flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{rec.title}</h3>
                      {rec.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-ink-muted border border-border-subtle">
                          {rec.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">{rec.description}</p>
                  </div>
                </div>

                {/* Status action buttons */}
                {rec.status === 'active' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'reviewed')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-surface-muted hover:bg-ledger hover:text-paper rounded border border-border-subtle transition-ledger"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Reviewed</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'dismissed')}
                      className="p-1 text-ink-muted hover:text-terracotta rounded"
                      title="Dismiss Recommendation"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 4-Part Explainability Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-md bg-canvas border border-border-subtle text-xs mb-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-ink-subtle tracking-wider block mb-0.5">
                    1. What Was Detected
                  </span>
                  <p className="text-ink font-medium leading-relaxed">
                    {rec.detected_pattern}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-ink-subtle tracking-wider block mb-0.5">
                    2. Impact & Magnitude
                  </span>
                  <p className="text-ink font-medium leading-relaxed">
                    {rec.impact_amount ? (
                      <>
                        Financial variance of <span className="font-semibold font-tabular"><CurrencyDisplay amount={rec.impact_amount} /></span>
                        {rec.impact_percentage && ` (${toNum(rec.impact_percentage).toFixed(0)}%)`}
                      </>
                    ) : (
                      'Pacing and category allocation factor'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-ink-subtle tracking-wider block mb-0.5">
                    3. Recommended Move
                  </span>
                  <p className="text-ledger font-medium leading-relaxed">
                    {rec.suggested_action}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications & System Alerts Section */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-2">
          System Alerts History
        </h3>
        <p className="text-xs text-ink-muted mb-4">
          Threshold alerts triggered by automated rules (80% limit warnings, due dates, achievements)
        </p>

        <div className="divide-y divide-border-subtle">
          {notifications.length === 0 ? (
            <p className="text-xs text-ink-muted py-4 text-center">
              No system alerts recorded.
            </p>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="py-3 flex items-start gap-3 text-xs">
                {notif.type === 'alert' || notif.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-ledger shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{notif.title}</span>
                    <span className="text-[10px] text-ink-muted">
                      {new Date(notif.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-ink-muted mt-0.5">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
