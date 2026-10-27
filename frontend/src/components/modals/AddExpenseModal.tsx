import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Category } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  initialData?: {
    amount?: number;
    description?: string;
    category_id?: number;
    date?: string;
    payment_method?: string;
  };
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialData,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.amount) setAmount(String(initialData.amount));
      if (initialData.description) setDescription(initialData.description);
      if (initialData.category_id) setCategoryId(initialData.category_id);
      if (initialData.date) setDate(initialData.date);
      if (initialData.payment_method) setPaymentMethod(initialData.payment_method);
    } else {
      setAmount('');
      setDescription('');
      if (categories.length > 0) setCategoryId(categories[0].id);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setNotes('');
      setIsRecurring(false);
    }
  }, [initialData, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide an expense description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createExpense({
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        date,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        is_recurring: isRecurring,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-elevated w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Record New Expense
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted transition-ledger"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-terracotta-light text-terracotta rounded-md border border-terracotta/20">
              {error}
            </div>
          )}

          {/* Amount Input */}
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
                placeholder="150.00"
                className="w-full pl-8 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Canteen lunch with study group"
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
          </div>

          {/* Category & Date Grid */}
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

          {/* Payment Method */}
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Split with Rohan"
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
            />
          </div>

          {/* Recurring checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_recurring_expense"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-border-subtle text-ledger focus:ring-ledger cursor-pointer"
            />
            <label htmlFor="is_recurring_expense" className="text-xs text-ink-muted cursor-pointer">
              Mark as recurring regular expense
            </label>
          </div>

          {/* Actions */}
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
              <span>{isSubmitting ? 'Recording...' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
