import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Check,
  RefreshCw,
  Shield,
  School,
  Wallet,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [monthlyAllowance, setMonthlyAllowance] = useState('15000');
  const [safeSpendBuffer, setSafeSpendBuffer] = useState('500');
  const [alert80, setAlert80] = useState(true);
  const [alert100, setAlert100] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Demo reset
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.settings) {
      setMonthlyAllowance(String(user.settings.monthly_allowance));
      setSafeSpendBuffer(String(user.settings.safe_spend_buffer));
      setAlert80(user.settings.alert_threshold_80);
      setAlert100(user.settings.alert_threshold_100);
      setCurrencySymbol(user.settings.currency_symbol || '₹');
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings({
        monthly_allowance: parseFloat(monthlyAllowance) || 0,
        safe_spend_buffer: parseFloat(safeSpendBuffer) || 0,
        alert_threshold_80: alert80,
        alert_threshold_100: alert100,
        currency_symbol: currencySymbol,
      });
      await refreshUser();
      setSaveMessage('Settings updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Reset demonstration data to clean 3-month synthetic student profile?')) return;
    setIsResetting(true);
    try {
      await api.resetDemoData();
      await refreshUser();
      setResetMessage('Demo data reset successfully!');
      setTimeout(() => setResetMessage(null), 3000);
    } catch (err) {
      alert('Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-border-subtle">
        <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
          Preferences & Student Profile
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Configure financial allowances, alert triggers, and demonstration data
        </p>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <School className="w-4 h-4 text-ledger" />
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Student Profile Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-ink-muted block text-[11px] mb-1">Full Name</span>
            <span className="font-semibold text-ink text-sm bg-canvas px-3 py-2 rounded-md block border border-border-subtle">
              {user?.full_name}
            </span>
          </div>

          <div>
            <span className="text-ink-muted block text-[11px] mb-1">College Email</span>
            <span className="font-semibold text-ink text-sm bg-canvas px-3 py-2 rounded-md block border border-border-subtle">
              {user?.email}
            </span>
          </div>

          <div>
            <span className="text-ink-muted block text-[11px] mb-1">College / University</span>
            <span className="font-medium text-ink bg-canvas px-3 py-2 rounded-md block border border-border-subtle">
              {user?.college_name || 'Engineering Campus'}
            </span>
          </div>

          <div>
            <span className="text-ink-muted block text-[11px] mb-1">Student Roll / ID</span>
            <span className="font-medium text-ink bg-canvas px-3 py-2 rounded-md block border border-border-subtle">
              {user?.student_id || 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Preferences Form */}
      <form onSubmit={handleSaveSettings} className="bg-paper border border-border-subtle rounded-ledger p-6 shadow-subtle space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <Wallet className="w-4 h-4 text-ledger" />
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Financial Calculation Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Monthly Allowance / Funds (₹ INR) *
            </label>
            <input
              type="number"
              step="100"
              required
              value={monthlyAllowance}
              onChange={(e) => setMonthlyAllowance(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger"
            />
            <span className="text-[11px] text-ink-muted mt-1 block">
              Default baseline funds for safe-to-spend calculations
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Safe-to-Spend Daily Reserve Buffer (₹ INR)
            </label>
            <input
              type="number"
              step="50"
              value={safeSpendBuffer}
              onChange={(e) => setSafeSpendBuffer(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-sm font-tabular text-ink focus:border-ledger"
            />
            <span className="text-[11px] text-ink-muted mt-1 block">
              Cushion reserved to prevent zero-fund emergencies
            </span>
          </div>
        </div>

        {/* Alert Toggles */}
        <div className="pt-3 border-t border-border-subtle space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-ledger" />
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
              Automated Alert Triggers
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alert80}
                onChange={(e) => setAlert80(e.target.checked)}
                className="rounded border-border-subtle text-ledger focus:ring-ledger cursor-pointer"
              />
              <span className="text-ink">Notify when a category budget reaches 80% utilization</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alert100}
                onChange={(e) => setAlert100(e.target.checked)}
                className="rounded border-border-subtle text-ledger focus:ring-ledger cursor-pointer"
              />
              <span className="text-ink">Notify immediately when any category budget is exceeded (100%+)</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-lime" />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Demonstration Reset Card */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-6 shadow-subtle space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <Shield className="w-4 h-4 text-ledger" />
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Presentation & Evaluation Controls
          </h3>
        </div>

        <p className="text-xs text-ink-muted leading-relaxed">
          Need to reset records for a fresh evaluator demonstration? This reloads Aarav Sharma's 3-month synthetic transaction history, budgets, and semester commitments.
        </p>

        {resetMessage && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
            {resetMessage}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleResetDemoData}
            disabled={isResetting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface-muted border border-border-subtle text-xs font-medium text-ink hover:text-ledger hover:border-ledger/30 transition-ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Synthetic Demo Records'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
