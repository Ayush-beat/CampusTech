import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle,
  Calendar,
  Trash2,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { SavingsGoal } from '../types';
import { CurrencyDisplay, toNum } from '../components/common/CurrencyDisplay';
import { AddSavingsGoalModal } from '../components/modals/AddSavingsGoalModal';
import { ContributeGoalModal } from '../components/modals/ContributeGoalModal';
import { EmptyState } from '../components/common/EmptyState';

export const SavingsGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSavingsGoals();
      setGoals(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.deleteSavingsGoal(id);
      loadGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const totalTarget = goals.reduce((acc, curr) => acc + toNum(curr.target_amount), 0);
  const totalSaved = goals.reduce((acc, curr) => acc + toNum(curr.current_amount), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Student Savings Goals
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Plan for future tech purchases, certifications, and project funds intentionally
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-lime" />
          <span>New Savings Target</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Total Saved Across Goals
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            <CurrencyDisplay amount={totalSaved} />
          </span>
          <span className="text-xs text-ink-muted">
            Target sum: <CurrencyDisplay amount={totalTarget} />
          </span>
        </div>

        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Overall Completion
          </span>
          <span className="text-2xl font-semibold text-ledger font-tabular mt-1 block">
            {overallProgress.toFixed(0)}%
          </span>
          <div className="w-full h-1.5 bg-surface-muted rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-ledger rounded-full transition-all"
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </div>

        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Active Targets
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            {goals.length} Goals
          </span>
          <span className="text-xs text-ink-muted">
            {goals.filter((g) => g.is_achieved).length} goals achieved
          </span>
        </div>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-ledger" />
          <p className="text-xs text-ink-muted mt-2">Loading savings goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="No savings goals established"
          description="Create a goal to save for a laptop, coding course, or campus relocation."
          actionText="Establish First Goal"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g) => {
            const isFinished = g.is_achieved || toNum(g.current_amount) >= toNum(g.target_amount);
            const remaining = Math.max(0, toNum(g.target_amount) - toNum(g.current_amount));

            return (
              <div
                key={g.id}
                className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle flex flex-col justify-between hover:border-ledger/30 transition-ledger"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-ledger-soft text-ledger flex items-center justify-center">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{g.name}</h3>
                        <span className="text-[10px] text-ink-muted uppercase tracking-wider">
                          {g.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isFinished ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-lime text-ledger-dark border border-lime-dark/30">
                          ACHIEVED
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-muted text-ink-muted">
                          {g.months_remaining} mo. left
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1 text-ink-muted hover:text-terracotta rounded ml-1"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mt-4">
                    <div>
                      <span className="text-[10px] text-ink-muted uppercase block">Saved</span>
                      <span className="text-xl font-semibold text-ink font-tabular">
                        <CurrencyDisplay amount={g.current_amount} />
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-ink-muted uppercase block">Target</span>
                      <span className="text-sm font-medium text-ink-muted font-tabular">
                        <CurrencyDisplay amount={g.target_amount} />
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ledger rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, toNum(g.progress_percentage))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-muted">
                      <span>{toNum(g.progress_percentage).toFixed(0)}% reached</span>
                      <span>₹{remaining.toLocaleString('en-IN')} remaining</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                  <span className="text-ink-muted text-[11px]">
                    Target: {new Date(g.target_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setContributeGoal(g)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-surface-muted hover:bg-ledger hover:text-paper text-ink font-medium transition-ledger border border-border-subtle"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Contribute Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimers */}
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-md text-[11px] text-ink-muted">
        <strong>Transparency Notice:</strong> Savings goals track self-allocated student funds. 
        They do not represent bank deposits, investments, or yield guaranteed returns.
      </div>

      <AddSavingsGoalModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadGoals}
      />

      <ContributeGoalModal
        isOpen={!!contributeGoal}
        onClose={() => setContributeGoal(null)}
        onSuccess={loadGoals}
        goal={contributeGoal}
      />
    </div>
  );
};
