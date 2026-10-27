import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Category, Expense } from '../../types';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense | null;
  categories: Category[];
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expense,
  categories,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setDescription(expense.description);
      setCategoryId(expense.category_id || '');
      setDate(expense.date);
      setPaymentMethod(expense.payment_method || 'UPI');
      setNotes(expense.notes || '');
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.updateExpense(expense.id, {
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        date,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-elevated w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Edit Expense #{expense.id}
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
              Amount (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-ink-muted font-tabular">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
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
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
