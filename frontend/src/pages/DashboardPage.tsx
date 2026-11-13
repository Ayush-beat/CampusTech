import React, { useState, useEffect } from 'react';
import {
  Wallet,
  PieChart as PieIcon,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  Plus,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { DashboardData, CategoryDistributionItem, SpendingTrendItem } from '../types';
import { StatCard } from '../components/common/StatCard';
import { CurrencyDisplay, formatINR, toNum } from '../components/common/CurrencyDisplay';
import { EmptyState } from '../components/common/EmptyState';

interface DashboardPageProps {
  onNavigateTab: (tab: any) => void;
  onOpenAddExpense: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateTab,
  onOpenAddExpense,
}) => {
  const { user, year, month } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const chartBorder = isDark ? '#242E28' : '#E5E5DF';
  const chartTick = isDark ? '#8E9A93' : '#76807A';
  const chartTooltipBg = isDark ? '#161D1A' : '#FFFFFF';
  const chartAreaStroke = isDark ? '#307B65' : '#163D32';

  const [data, setData] = useState<DashboardData | null>(null);
  const [trendData, setTrendData] = useState<SpendingTrendItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dash, trend, cats] = await Promise.all([
        api.getDashboard(year, month),
        api.getSpendingTrend(year, month),
        api.getCategoryBreakdown(year, month),
      ]);
      setData(dash);
      setTrendData(trend || []);
      setCategoryData(cats || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [year, month]);

  const handleMarkPaid = async (id: number) => {
    try {
      await api.markPlannedExpensePaid(id);
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger" />
      </div>
    );
  }

  if (error || !data) {
    const isNoExpenseError =
      error &&
      (error.toLowerCase().includes('no expense') ||
        error.toLowerCase().includes('empty') ||
        error.toLowerCase().includes('not found'));

    if (isNoExpenseError) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight font-sans">
                Welcome, {user?.full_name?.split(' ')[0] || 'Student'}.
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Ready to track your campus finances.
              </p>
            </div>
          </div>
          <EmptyState
            title="No expenses recorded yet"
            description="You don't have any recorded expenses for this account yet. Add your first expense to activate your financial dashboard."
            actionText="Add Expense"
            onAction={onOpenAddExpense}
          />
        </div>
      );
    }

    return (
      <div className="p-6 bg-terracotta-light text-terracotta rounded-ledger border border-terracotta/20">
        <h3 className="font-semibold text-sm">Failed to load dashboard</h3>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-3 px-3 py-1.5 bg-terracotta text-paper text-xs rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  const { financial_summary, safe_to_spend, projection, period } = data;
  const hasNoExpenses =
    toNum(financial_summary.total_expenses) === 0 && data.recent_transactions.length === 0;

  const projectionBadgeVariant =
    projection.status === 'on_track'
      ? 'positive'
      : projection.status === 'likely_overrun'
      ? 'warning'
      : projection.status === 'no_budget_set'
      ? 'neutral'
      : 'alert';

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight font-sans">
            Good spending pace, {user?.full_name?.split(' ')[0] || 'Student'}.
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {period.month_name} Financial Statement • Today is{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-lime" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* If user has no expenses yet, show a welcoming empty state banner */}
      {hasNoExpenses && (
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ledger/10 text-ledger flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-ledger" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">No expenses recorded yet</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Start logging your campus spending to calculate daily safe-to-spend allowances and track category budgets.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-lime" />
            <span>Add Expense</span>
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards: Distinguish Available Balance from Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Usable Balance */}
        <StatCard
          label="Available Usable Funds"
          amount={financial_summary.available_balance}
          icon={Wallet}
          subtext={`Monthly allowance: ₹${financial_summary.monthly_allowance.toLocaleString('en-IN')}`}
          badge={{
            text: financial_summary.available_balance >= 0 ? 'Liquid' : 'Deficit',
            variant: financial_summary.available_balance >= 0 ? 'positive' : 'alert',
          }}
        />

        {/* Total Budget & MTD Spent */}
        <StatCard
          label="Remaining Monthly Budget"
          amount={financial_summary.remaining_budget}
          icon={PieIcon}
          subtext={`Spent: ₹${toNum(financial_summary.total_expenses).toLocaleString('en-IN')} of ₹${toNum(financial_summary.total_budget).toLocaleString('en-IN')}`}
          badge={{
            text: `${toNum(financial_summary.utilization_percentage).toFixed(0)}% Used`,
            variant: toNum(financial_summary.utilization_percentage) > 100 ? 'alert' : 'neutral',
          }}
        />

        {/* Daily Safe-to-Spend */}
        <StatCard
          label="Daily Safe-to-Spend"
          amount={safe_to_spend.safe_to_spend_daily}
          icon={ShieldCheck}
          subtext={`${safe_to_spend.days_remaining} days remaining (reserves ₹${safe_to_spend.reserved_upcoming_commitments.toLocaleString('en-IN')})`}
          badge={{
            text: safe_to_spend.is_negative_warning ? 'Tight Buffer' : 'Calculated',
            variant: safe_to_spend.is_negative_warning ? 'warning' : 'lime',
          }}
        />

        {/* Projected Month-End */}
        <StatCard
          label="Projected Month-End"
          amount={projection.projected_month_end}
          icon={TrendingUp}
          subtext={
            projection.projected_difference >= 0
              ? `Estimated Surplus: ₹${Math.abs(projection.projected_difference).toLocaleString('en-IN')}`
              : `Estimated Overrun: ₹${Math.abs(projection.projected_difference).toLocaleString('en-IN')}`
          }
          badge={{
            text:
              projection.status === 'on_track'
                ? 'On Track'
                : projection.status === 'no_budget_set'
                ? 'No Budget'
                : 'Pacing Alert',
            variant: projectionBadgeVariant,
          }}
        />
      </div>

      {/* 3. Charts Section: Spending Trend + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Monthly Spending Timeline
              </h3>
              <p className="text-xs text-ink-muted">
                Daily expenditure across {period.month_name}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-ledger font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="ledgerGreenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartAreaStroke} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartAreaStroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: chartTick }}
                  tickLine={false}
                  axisLine={{ stroke: chartBorder }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: chartTick }}
                  tickLine={false}
                  axisLine={{ stroke: chartBorder }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDark ? '#EFF2EE' : '#252A27',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={chartAreaStroke}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ledgerGreenGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (Donut Chart) */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Category Split
              </h3>
              <p className="text-xs text-ink-muted">Spending distribution</p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-ledger font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>Budgets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-4">
              <EmptyState
                title="No expenses this month"
                description="Add your first transaction to see category breakdown."
                actionText="Add Expense"
                onAction={onOpenAddExpense}
              />
            </div>
          ) : (
            <>
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total_amount"
                      nameKey="category_name"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#163D32'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        borderColor: chartBorder,
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: isDark ? '#EFF2EE' : '#252A27',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase text-ink-muted">Total MTD</span>
                  <span className="text-sm font-semibold text-ink font-tabular">
                    ₹{toNum(financial_summary.total_expenses).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Top 4 Legend list */}
              <div className="mt-3 space-y-1.5 flex-1">
                {categoryData.slice(0, 4).map((c) => (
                  <div
                    key={c.category_name}
                    className="flex items-center justify-between text-xs py-1 border-b border-border-subtle/50"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-ink truncate">{c.category_name}</span>
                    </div>
                    <span className="font-semibold text-ink font-tabular">
                      ₹{toNum(c.total_amount).toFixed(0)} ({toNum(c.percentage).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Category Budget Progress + Upcoming Academic Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Budget Utilization */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Category Budget Utilization
              </h3>
              <p className="text-xs text-ink-muted">Tracking against allocated limits</p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-ledger font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Budgets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {data.category_utilization.length === 0 ? (
              <p className="text-xs text-ink-muted py-6 text-center">
                No category budgets configured for this month.
              </p>
            ) : (
              data.category_utilization.map((item) => {
                const util = toNum(item.utilization);
                const isOver = util > 100;
                const isWarning = util >= 80 && !isOver;
                const barColor = isOver
                  ? 'bg-terracotta'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-ledger';

                return (
                  <div key={item.category_name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-ink">{item.category_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-ink-muted font-tabular text-[11px]">
                          ₹{toNum(item.spent).toFixed(0)} / ₹{toNum(item.allocated).toFixed(0)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            isOver
                              ? 'bg-terracotta-light text-terracotta'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-surface-muted text-ink-muted'
                          }`}
                        >
                          {util.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Track */}
                    <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Academic Commitments (Semester Planner) */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Upcoming Academic Commitments
              </h3>
              <p className="text-xs text-ink-muted">Reserved in Safe-to-Spend calculation</p>
            </div>
            <button
              onClick={() => onNavigateTab('semester')}
              className="text-xs text-ledger font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {data.upcoming_expenses.length === 0 ? (
              <p className="text-xs text-ink-muted py-6 text-center">
                No upcoming commitments pending. Add exam fees or project costs in the Semester Planner.
              </p>
            ) : (
              data.upcoming_expenses.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-surface-soft border border-border-subtle rounded-md flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="w-4 h-4 text-ledger shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-ink leading-tight">{item.title}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Due {new Date(item.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • {item.priority.toUpperCase()} priority
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-ink font-tabular text-sm">
                      <CurrencyDisplay amount={item.amount} />
                    </span>
                    <button
                      onClick={() => handleMarkPaid(item.id)}
                      title="Mark as paid (creates linked transaction without double counting)"
                      className="px-2 py-1 bg-paper border border-border-subtle hover:border-ledger/40 text-[11px] font-medium text-ledger rounded transition-ledger"
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Smart Financial Insights Feed */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-ledger flex items-center justify-center text-lime">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Intelligent Spending Insights
              </h3>
              <p className="text-xs text-ink-muted">
                Deterministic recommendations generated from your transaction patterns
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('insights')}
            className="text-xs text-ledger font-medium hover:underline inline-flex items-center gap-1"
          >
            <span>View All Insights</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.insights.length === 0 ? (
            <p className="text-xs text-ink-muted col-span-3 py-4 text-center">
              No recommendations active. Log more transactions to enable pattern detection.
            </p>
          ) : (
            data.insights.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-md bg-canvas border border-border-subtle flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase text-ink-subtle tracking-wider block mb-1">
                    {rec.category || 'Financial Alert'}
                  </span>
                  <h4 className="text-xs font-semibold text-ink mb-1.5">{rec.title}</h4>
                  <p className="text-[11px] text-ink-muted leading-relaxed mb-3">
                    {rec.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-[10px] font-medium text-ledger block mb-0.5">
                    Suggested Action:
                  </span>
                  <p className="text-[11px] text-ink font-medium leading-normal">
                    {rec.suggested_action}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Recent Transactions Table */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Recent Transactions
            </h3>
            <p className="text-xs text-ink-muted">Latest expense entries recorded</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-ledger font-medium hover:underline inline-flex items-center gap-1"
          >
            <span>All Transactions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-ink-muted font-medium bg-surface-muted/50">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-muted">
                    <EmptyState
                      title="No expenses recorded yet"
                      description="Log your daily campus purchases to monitor budget utilization."
                      actionText="Add Expense"
                      onAction={onOpenAddExpense}
                    />
                  </td>
                </tr>
              ) : (
                data.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-soft/60 transition-ledger">
                    <td className="py-3 px-3 text-ink-muted whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-3 font-medium text-ink">{tx.description}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-muted text-ink text-[11px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tx.category_color }}
                        />
                        <span>{tx.category_name}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-ink-muted">{tx.payment_method}</td>
                    <td className="py-3 px-3 text-right font-semibold text-ink font-tabular text-sm">
                      <CurrencyDisplay amount={tx.amount} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
