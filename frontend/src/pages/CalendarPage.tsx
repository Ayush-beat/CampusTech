import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Receipt,
  X,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { CalendarDayItem, Expense } from '../types';
import { CurrencyDisplay, toNum } from '../components/common/CurrencyDisplay';

export const CalendarPage: React.FC = () => {
  const { year, month, setMonth, setYear } = useAuth();
  const [calendarDays, setCalendarDays] = useState<CalendarDayItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDayItem | null>(null);
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDay, setIsLoadingDay] = useState(false);

  const loadCalendar = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCalendar(year, month);
      setCalendarDays(data || []);
      // Auto-select today if in current month
      const todayStr = new Date().toISOString().split('T')[0];
      const match = data?.find((d) => d.date === todayStr);
      if (match) {
        handleDayClick(match);
      } else if (data && data.length > 0) {
        handleDayClick(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [year, month]);

  const handleDayClick = async (day: CalendarDayItem) => {
    setSelectedDay(day);
    setIsLoadingDay(true);
    try {
      const res = await api.getExpenses({
        start_date: day.date,
        end_date: day.date,
      });
      setDayExpenses(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDay(false);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const levelClasses = {
    0: 'bg-canvas hover:bg-surface-soft border-border-subtle text-ink-muted',
    1: 'bg-ledger-soft/80 hover:bg-ledger-soft border-ledger/20 text-ink',
    2: 'bg-lime-soft hover:bg-lime/30 border-lime-dark/30 text-ink',
    3: 'bg-terracotta-light hover:bg-terracotta-light/80 border-terracotta/30 text-ink',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Spending Habit Calendar
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Visualize your daily transaction intensity and inspect detailed records by date
          </p>
        </div>

        {/* Month Stepper */}
        <div className="flex items-center gap-2 bg-paper border border-border-subtle rounded-md p-1 text-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-ink px-2">{monthName}</span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-end gap-3 text-xs text-ink-muted">
        <span>Intensity:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-canvas border border-border-subtle" />
          <span className="text-[11px]">Zero</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-ledger-soft border border-ledger/20" />
          <span className="text-[11px]">&lt; ₹300</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-lime-soft border border-lime-dark/30" />
          <span className="text-[11px]">₹300 - ₹1,000</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-terracotta-light border border-terracotta/30" />
          <span className="text-[11px]">&gt; ₹1,000</span>
        </div>
      </div>

      {/* Calendar & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Days Matrix */}
        <div className="lg:col-span-2 bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-ink-subtle uppercase mb-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((d) => {
              const isSelected = selectedDay?.date === d.date;
              return (
                <button
                  key={d.date}
                  onClick={() => handleDayClick(d)}
                  className={`p-2.5 rounded-md border text-left flex flex-col justify-between h-20 transition-ledger ${
                    levelClasses[d.level as 0 | 1 | 2 | 3]
                  } ${
                    isSelected
                      ? 'ring-2 ring-ledger font-semibold shadow-sm'
                      : 'hover:border-ledger/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-tabular">{d.day_number}</span>
                    {d.expense_count > 0 && (
                      <span className="text-[10px] text-ink-muted">
                        {d.expense_count} tx
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-ink font-tabular truncate">
                    {toNum(d.total_amount) > 0 ? `₹${toNum(d.total_amount).toFixed(0)}` : '—'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Transaction Inspector */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle flex flex-col">
          <div className="pb-3 border-b border-border-subtle mb-4">
            <span className="text-[10px] font-semibold uppercase text-ink-muted tracking-wider block">
              Day Inspector
            </span>
            <div className="flex items-baseline justify-between mt-0.5">
              <h3 className="text-base font-semibold text-ink">
                {selectedDay
                  ? new Date(selectedDay.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Select a Date'}
              </h3>
              <span className="text-sm font-semibold text-ledger font-tabular">
                <CurrencyDisplay amount={selectedDay?.total_amount || 0} />
              </span>
            </div>
          </div>

          {isLoadingDay ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ledger" />
            </div>
          ) : dayExpenses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-6 text-xs text-ink-muted">
              <div>
                <Receipt className="w-8 h-8 text-ink-subtle mx-auto mb-2" />
                <p className="font-medium text-ink">No recorded expenses</p>
                <p className="text-[11px] mt-1">Zero spending recorded on this calendar day.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
              {dayExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-md bg-canvas border border-border-subtle flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-ink">{exp.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-1">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: exp.category?.color || '#163D32' }}
                        />
                        <span>{exp.category?.name || 'Uncategorized'}</span>
                      </span>
                      <span>• {exp.payment_method}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-ink font-tabular text-sm">
                    <CurrencyDisplay amount={exp.amount} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
