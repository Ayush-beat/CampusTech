import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Sparkles,
  Bell,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

interface TopbarProps {
  title: string;
  onOpenSidebar: () => void;
  onOpenAddExpense: () => void;
  onOpenNLP: () => void;
  onRefreshData?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Topbar: React.FC<TopbarProps> = ({
  title,
  onOpenSidebar,
  onOpenAddExpense,
  onOpenNLP,
  onRefreshData,
}) => {
  const { year, month, setYear, setMonth, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [month, year]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      // ignore
    }
  };

  const handleResetDemoData = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await api.resetDemoData();
      setResetMessage('Demo data reset successfully!');
      setTimeout(() => setResetMessage(null), 3000);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      setResetMessage('Failed to reset demo data.');
      setTimeout(() => setResetMessage(null), 3000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-paper/95 backdrop-blur-md border-b border-border-subtle px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu + Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-ink tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Period Selector, Quick Actions, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Period Selector (Month/Year) */}
        <div className="hidden md:flex items-center gap-1.5 bg-surface-muted px-2.5 py-1.5 rounded-md border border-border-subtle text-xs">
          <CalendarIcon className="w-3.5 h-3.5 text-ink-muted" />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent font-medium text-ink focus:outline-none cursor-pointer"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent font-medium text-ink focus:outline-none cursor-pointer"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {/* Demo Data Reset Badge */}
        <button
          onClick={handleResetDemoData}
          disabled={isResetting}
          title="Reset demonstration records to clean multi-month student state"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-muted border border-border-subtle text-xs font-medium text-ink-muted hover:text-ink hover:border-ledger/30 transition-ledger"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-ledger' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* Natural Language Quick Entry Button */}
        <button
          onClick={onOpenNLP}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-border-subtle text-xs font-medium text-ink hover:border-ledger/40 hover:bg-surface-soft transition-ledger shadow-subtle"
          title="Type in plain text like 'Spent 120 on lunch today'"
        >
          <Sparkles className="w-3.5 h-3.5 text-ledger" />
          <span className="hidden sm:inline">Natural Entry</span>
        </button>

        {/* Primary Add Expense Action */}
        <button
          onClick={onOpenAddExpense}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm"
        >
          <Plus className="w-4 h-4 text-lime" />
          <span>Add Expense</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted transition-ledger"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-terracotta ring-2 ring-paper" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-paper border border-border-subtle rounded-ledger shadow-elevated p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Notifications & Alerts
                </span>
                <span className="text-[11px] text-ink-muted">
                  {unreadCount} unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-ink-muted text-center py-4">
                    No new alerts
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-2.5 rounded-md text-xs cursor-pointer transition-ledger ${
                        n.is_read
                          ? 'bg-surface-soft/40 text-ink-muted'
                          : 'bg-surface-muted text-ink font-medium border border-border-subtle'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'alert' || n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-ledger shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-ink text-xs">{n.title}</p>
                          <p className="text-[11px] text-ink-muted mt-0.5 leading-normal">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating feedback notification toast */}
      {resetMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ledger text-paper px-4 py-2.5 rounded-md shadow-elevated text-xs flex items-center gap-2 border border-lime/30">
          <Check className="w-4 h-4 text-lime" />
          <span>{resetMessage}</span>
        </div>
      )}
    </header>
  );
};
