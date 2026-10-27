import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  Tag,
  BookOpen
} from 'lucide-react';
import { api } from '../api/client';
import { PlannedExpense, Category } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { AddPlannedExpenseModal } from '../components/modals/AddPlannedExpenseModal';
import { EmptyState } from '../components/common/EmptyState';

interface SemesterPlannerPageProps {
  categories: Category[];
}

export const SemesterPlannerPage: React.FC<SemesterPlannerPageProps> = ({ categories }) => {
  const [plannedList, setPlannedList] = useState<PlannedExpense[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPlannedExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPlannedExpenses(filter === 'all' ? undefined : filter);
      setPlannedList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlannedExpenses();
  }, [filter]);

  const handleMarkPaid = async (id: number) => {
    try {
      await api.markPlannedExpensePaid(id);
      loadPlannedExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this academic commitment?')) return;
    try {
      await api.deletePlannedExpense(id);
      loadPlannedExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTotal = plannedList
    .filter((p) => p.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const priorityClasses = {
    high: 'bg-terracotta-light text-terracotta border-terracotta/20',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-surface-muted text-ink-muted border-border-subtle',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Semester Academic Planner
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Plan exam fees, textbooks, hardware kits, and hostel costs without surprise budget crunches
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-paper border border-border-subtle p-1 rounded-md text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded transition-ledger ${
                filter === 'all' ? 'bg-ledger text-paper font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded transition-ledger ${
                filter === 'pending' ? 'bg-ledger text-paper font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-2.5 py-1 rounded transition-ledger ${
                filter === 'paid' ? 'bg-ledger text-paper font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Paid
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-lime" />
            <span>Add Commitment</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-ledger bg-paper border border-border-subtle shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Total Pending Commitments
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            <CurrencyDisplay amount={pendingTotal} />
          </span>
          <p className="text-[11px] text-ink-muted mt-1">
            Automatically reserved in your Safe-to-Spend formula
          </p>
        </div>

        <div className="p-4 rounded-ledger bg-paper border border-border-subtle shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Commitments Count
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            {plannedList.length}
          </span>
          <p className="text-[11px] text-ink-muted mt-1">
            {plannedList.filter((p) => p.status === 'pending').length} pending •{' '}
            {plannedList.filter((p) => p.status === 'paid').length} fulfilled
          </p>
        </div>

        <div className="p-4 rounded-ledger bg-paper border border-border-subtle shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Zero Double-Counting
          </span>
          <span className="text-sm font-semibold text-ledger mt-1 block flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-ledger" />
            <span>Integrated Financial Engine</span>
          </span>
          <p className="text-[11px] text-ink-muted mt-1">
            Marking an item as paid links it to an expense transaction and unfreezes reserved funds.
          </p>
        </div>
      </div>

      {/* Commitments List */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-3">
          Chronological Commitments Schedule
        </h3>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-ledger" />
            <p className="text-xs text-ink-muted mt-2">Loading commitments...</p>
          </div>
        ) : plannedList.length === 0 ? (
          <EmptyState
            title="No semester commitments logged"
            description="Add your upcoming exam fees, lab manuals, textbooks, or hostel fees."
            actionText="Add Academic Commitment"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {plannedList.map((item) => {
              const isPaid = item.status === 'paid';
              const dueDate = new Date(item.due_date);
              const isPast = dueDate < new Date() && !isPaid;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-md border transition-ledger flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isPaid
                      ? 'bg-surface-soft/40 border-border-subtle opacity-75'
                      : isPast
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-paper border-border-subtle hover:border-ledger/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                        isPaid ? 'bg-surface-muted text-ink-muted' : 'bg-ledger text-lime'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold text-ink ${isPaid ? 'line-through' : ''}`}>
                          {item.title}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            priorityClasses[item.priority] || priorityClasses.medium
                          }`}
                        >
                          {item.priority}
                        </span>
                        {isPaid && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-ledger-soft text-ledger border border-ledger/20">
                            PAID & LINKED
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-terracotta-light text-terracotta border border-terracotta/20">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-ink-muted mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Due{' '}
                            {dueDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                        {item.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{item.category.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border-subtle">
                    <div className="text-right">
                      <span className="text-base font-semibold text-ink font-tabular block">
                        <CurrencyDisplay amount={item.amount} />
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {isPaid ? 'Recorded in Expenses' : 'Reserved in Funds'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPaid && (
                        <button
                          onClick={() => handleMarkPaid(item.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-ledger text-paper rounded hover:bg-ledger-light transition-ledger"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-ink-muted hover:text-terracotta rounded"
                        title="Delete Commitment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddPlannedExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadPlannedExpenses}
        categories={categories}
      />
    </div>
  );
};
