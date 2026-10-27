import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Category } from '../../types';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'quarterly' | 'weekly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!name.trim() || !nextDueDate) {
      setError('Name and next billing date are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createSubscription({
        name: name.trim(),
        amount: val,
        frequency,
        next_due_date: nextDueDate,
        category_id: categoryId ? Number(categoryId) : null,
        notes: notes.trim() || null,
        is_active: true,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-elevated w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Track Recurring Subscription
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
              Subscription Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spotify Premium Student / Mobile Recharge"
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="59.00"
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Billing Cycle
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Next Due Date *
              </label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
              >
                <option value="">Subscriptions / Digital</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Student discount applied"
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
              <span>{isSubmitting ? 'Tracking...' : 'Track Subscription'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
