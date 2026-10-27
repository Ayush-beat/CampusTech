import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Category } from '../../types';

interface AddPlannedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const AddPlannedExpenseModal: React.FC<AddPlannedExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!title.trim() || !dueDate) {
      setError('Title and due date are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createPlannedExpense({
        title: title.trim(),
        amount: val,
        due_date: dueDate,
        priority,
        category_id: categoryId ? Number(categoryId) : null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add planned expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-elevated w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Add Semester Commitment
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
              Commitment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End-Semester Examination Fee"
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Estimated Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
              >
                <option value="">Academic / General</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
              >
                <option value="high">High (Mandatory)</option>
                <option value="medium">Medium</option>
                <option value="low">Low (Discretionary)</option>
              </select>
            </div>
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
              <span>{isSubmitting ? 'Adding...' : 'Add Commitment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
