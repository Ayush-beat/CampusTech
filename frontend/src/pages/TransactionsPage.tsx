import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Sparkles,
  Download,
  Trash2,
  Edit2,
  Calendar,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Expense, Category } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { EditExpenseModal } from '../components/modals/EditExpenseModal';
import { NLPEntryModal } from '../components/modals/NLPEntryModal';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { EmptyState } from '../components/common/EmptyState';

interface TransactionsPageProps {
  categories: Category[];
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ categories }) => {
  const { year, month } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNLPOpen, setIsNLPOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExpenses({
        page,
        page_size: 50,
        search: search.trim() || undefined,
        category_id: selectedCategory || undefined,
        year,
        month,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setExpenses(data.items || []);
      setTotalCount(data.total || 0);
      setTotalAmount(data.total_amount || 0);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [year, month, selectedCategory, sortBy, sortOrder, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadExpenses();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      await api.deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
      loadExpenses();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadCSV = () => {
    const url = api.getCSVDownloadUrl(year, month, selectedCategory || undefined);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Expense Records
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Total recorded for selected period: <strong className="text-ink font-tabular font-semibold"><CurrencyDisplay amount={totalAmount} /></strong> ({totalCount} transactions)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-border-subtle text-xs font-medium text-ink hover:border-ledger/40 hover:bg-surface-soft transition-ledger shadow-subtle"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsNLPOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-border-subtle text-xs font-medium text-ink hover:border-ledger/40 hover:bg-surface-soft transition-ledger shadow-subtle"
          >
            <Sparkles className="w-3.5 h-3.5 text-ledger" />
            <span className="hidden sm:inline">Natural Entry</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-lime" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-4 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, notes, method..."
            className="w-full pl-9 pr-3 py-1.5 bg-canvas border border-border-subtle rounded-md text-xs text-ink focus:border-ledger focus:bg-paper transition-ledger"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-muted">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? Number(e.target.value) : '');
                setPage(1);
              }}
              className="bg-canvas border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-ink focus:border-ledger cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-muted">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-canvas border border-border-subtle rounded-md px-2 py-1.5 text-xs text-ink focus:border-ledger cursor-pointer"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 bg-canvas border border-border-subtle rounded-md text-ink-muted hover:text-ink transition-ledger"
              title={`Switch to ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-ledger" />
            <p className="text-xs text-ink-muted mt-2">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No transactions found"
              description="No expense records match the active search or filters."
              actionText="Add New Expense"
              onAction={() => setIsAddOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-ink-muted font-medium bg-surface-muted/50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-surface-soft/60 transition-ledger">
                    <td className="py-3 px-4 text-ink-muted whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-ink">
                      <span>{exp.description}</span>
                      {exp.is_recurring && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-ink-muted border border-border-subtle">
                          Recurring
                        </span>
                      )}
                      {exp.planned_expense_id && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-ledger-soft text-ledger border border-ledger/20">
                          Semester Linked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-muted text-ink text-[11px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: exp.category?.color || '#163D32' }}
                        />
                        <span>{exp.category?.name || 'Uncategorized'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-muted whitespace-nowrap">
                      {exp.payment_method || 'UPI'}
                    </td>
                    <td className="py-3 px-4 text-ink-muted truncate max-w-xs">
                      {exp.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-ink font-tabular text-sm whitespace-nowrap">
                      <CurrencyDisplay amount={exp.amount} />
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 text-ink-muted hover:text-ledger hover:bg-surface-muted rounded transition-ledger"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          className="p-1.5 text-ink-muted hover:text-terracotta hover:bg-terracotta-light rounded transition-ledger"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadExpenses}
        categories={categories}
      />

      <NLPEntryModal
        isOpen={isNLPOpen}
        onClose={() => setIsNLPOpen(false)}
        onSuccess={loadExpenses}
      />

      <EditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSuccess={loadExpenses}
        expense={editingExpense}
        categories={categories}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Delete Expense Transaction"
        message={`Are you sure you want to delete "${deletingExpense?.description}" for ₹${deletingExpense?.amount}? This action will permanently remove the record and update your budget calculations.`}
      />
    </div>
  );
};
