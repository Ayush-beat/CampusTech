import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  CreditCard,
  Calendar,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { RecurringExpense, Category } from '../types';
import { CurrencyDisplay, toNum } from '../components/common/CurrencyDisplay';
import { AddSubscriptionModal } from '../components/modals/AddSubscriptionModal';
import { EmptyState } from '../components/common/EmptyState';

interface SubscriptionsPageProps {
  categories: Category[];
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ categories }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSubscriptions();
      setSubscriptions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Stop tracking this subscription?')) return;
    try {
      await api.deleteSubscription(id);
      loadSubscriptions();
    } catch (err) {
      console.error(err);
    }
  };

  const totalMonthlyCost = subscriptions.reduce((acc, curr) => acc + toNum(curr.monthly_cost_equivalent), 0);
  const totalAnnualCost = subscriptions.reduce((acc, curr) => acc + toNum(curr.annual_cost_equivalent), 0);
  const allowance = toNum(user?.settings?.monthly_allowance) || 15000;
  const overheadPct = allowance > 0 ? (totalMonthlyCost / allowance) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Subscription & Recurring Expenses
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Monitor digital services, telecom recharges, and memberships to prevent stealth cost creep
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-lime" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Monthly Equivalent Burn
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            <CurrencyDisplay amount={totalMonthlyCost} />
          </span>
          <span className="text-xs text-ink-muted">
            Recurring every 30 days
          </span>
        </div>

        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Annualized Impact
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            <CurrencyDisplay amount={totalAnnualCost} />
          </span>
          <span className="text-xs text-ink-muted">
            12-month projected subscription cost
          </span>
        </div>

        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Allowance Overhead
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            {overheadPct.toFixed(1)}%
          </span>
          <span className="text-xs text-ink-muted">
            Percentage of ₹{allowance.toLocaleString('en-IN')} monthly funds
          </span>
        </div>
      </div>

      {/* Subscription Cards List */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
          Active Student Subscriptions ({subscriptions.length})
        </h3>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-ledger" />
            <p className="text-xs text-ink-muted mt-2">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions tracked"
            description="Track Spotify, Netflix, mobile phone recharge, or cloud services."
            actionText="Track Subscription"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-border-subtle">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-soft/40 px-2 rounded transition-ledger"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-surface-muted text-ledger flex items-center justify-center shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-ink">{sub.name}</h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-surface-muted text-ink-muted border border-border-subtle">
                        {sub.frequency}
                      </span>
                      {sub.category && (
                        <span className="text-[10px] text-ink-muted flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{sub.category.name}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Next billing:{' '}
                          {new Date(sub.next_due_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                      {sub.notes && <span>• {sub.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-base font-semibold text-ink font-tabular block">
                      <CurrencyDisplay amount={sub.amount} />
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      ₹{toNum(sub.annual_cost_equivalent).toFixed(0)}/yr
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-1.5 text-ink-muted hover:text-terracotta rounded transition-ledger"
                    title="Remove from tracking"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadSubscriptions}
        categories={categories}
      />
    </div>
  );
};
