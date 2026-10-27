import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../api/client';

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddSavingsGoalModal: React.FC<AddSavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [category, setCategory] = useState('Education & Tech');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const initial = parseFloat(currentAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;

    if (isNaN(target) || target <= 0) {
      setError('Please specify a positive target amount.');
      return;
    }
    if (!name.trim() || !targetDate) {
      setError('Goal name and target completion date are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createSavingsGoal({
        name: name.trim(),
        target_amount: target,
        current_amount: initial,
        target_date: targetDate,
        monthly_contribution: monthly,
        category,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create savings goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-elevated w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Create Student Savings Goal
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted transition-ledger"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-terracotta-light text-terracotta rounded-md border border-terracotta/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coding Laptop / Certification Exam"
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Target Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="60000"
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Initial Saved (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Target Date *
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Monthly Contribution (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="2500"
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
            >
              <option value="Education & Tech">Education & Tech Hardware</option>
              <option value="Course & Certification">Course & Certification</option>
              <option value="Emergency Fund">Emergency Student Buffer</option>
              <option value="Travel & Relocation">Travel & Summer Relocation</option>
              <option value="Personal Project">Personal Engineering Project</option>
            </select>
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
              <span>{isSubmitting ? 'Creating...' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
