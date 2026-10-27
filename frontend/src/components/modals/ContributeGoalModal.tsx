import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../api/client';
import { SavingsGoal } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';

interface ContributeGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: SavingsGoal | null;
}

export const ContributeGoalModal: React.FC<ContributeGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  goal,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid contribution amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.contributeToGoal(goal.id, {
        amount: val,
        date,
        notes: notes.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-elevated w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Contribute to Goal
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted transition-ledger"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-surface-muted p-3 rounded-md text-xs">
            <span className="text-ink-muted block text-[11px]">Contributing to:</span>
            <span className="font-semibold text-ink text-sm block mt-0.5">{goal.name}</span>
            <div className="flex justify-between items-center text-[11px] text-ink-muted mt-2 pt-2 border-t border-border-subtle">
              <span>Saved so far:</span>
              <span className="font-medium text-ink"><CurrencyDisplay amount={goal.current_amount} /></span>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs bg-terracotta-light text-terracotta rounded-md border border-terracotta/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Contribution Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-ink-muted font-tabular">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full pl-8 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Freelancing stipend / allowance savings"
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-muted rounded-md transition-ledger"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-ledger text-paper rounded-md hover:bg-ledger-light transition-ledger disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 text-lime" />
              <span>{isSubmitting ? 'Recording...' : 'Add Contribution'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
