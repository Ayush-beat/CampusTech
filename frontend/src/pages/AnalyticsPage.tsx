import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { SpendingTrendItem, CategoryDistributionItem, BudgetVsActualItem } from '../types';
import { StatCard } from '../components/common/StatCard';
import { CurrencyDisplay, toNum } from '../components/common/CurrencyDisplay';
import { EmptyState } from '../components/common/EmptyState';

export const AnalyticsPage: React.FC = () => {
  const { year, month } = useAuth();
  const [trendData, setTrendData] = useState<SpendingTrendItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistributionItem[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActualItem[]>([]);
  const [dashData, setDashData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [trend, cats, bva, dash] = await Promise.all([
        api.getSpendingTrend(year, month),
        api.getCategoryBreakdown(year, month),
        api.getBudgetVsActual(year, month),
        api.getDashboard(year, month),
      ]);
      setTrendData(trend || []);
      setCategoryData(cats || []);
      setBudgetVsActual(bva || []);
      setDashData(dash);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [year, month]);

  if (isLoading && !dashData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger" />
      </div>
    );
  }

  const highestCat = categoryData.length > 0 ? categoryData[0] : null;
  const avgDaily = dashData?.projection?.average_daily_spending || 0;
  const mtdTotal = dashData?.financial_summary?.total_expenses || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-border-subtle">
        <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
          Expense Analytics & Trends
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Detailed metrics, category distributions, and planned vs actual budget comparisons
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Month-to-Date"
          amount={mtdTotal}
          icon={Layers}
          subtext={`Recorded in ${dashData?.period?.month_name || 'selected month'}`}
          badge={{ text: 'Recorded', variant: 'neutral' }}
        />

        <StatCard
          label="Average Daily Spend"
          amount={avgDaily}
          icon={Zap}
          subtext={`Paced across ${dashData?.projection?.elapsed_days || 1} elapsed days`}
          badge={{ text: 'Daily Rate', variant: 'lime' }}
        />

        <StatCard
          label="Top Spending Category"
          valueText={highestCat ? highestCat.category_name : 'None'}
          icon={Award}
          subtext={
            highestCat
              ? `₹${toNum(highestCat.total_amount).toLocaleString('en-IN')} (${toNum(highestCat.percentage).toFixed(0)}% of total)`
              : 'No expenses recorded'
          }
          badge={{ text: 'Highest Outflow', variant: 'neutral' }}
        />

        <StatCard
          label="Projected Total"
          amount={dashData?.projection?.projected_month_end}
          icon={TrendingUp}
          subtext={dashData?.projection?.explanation}
          badge={{
            text: dashData?.projection?.status === 'on_track' ? 'Within Budget' : 'Exceeding Target',
            variant: dashData?.projection?.status === 'on_track' ? 'positive' : 'warning',
          }}
        />
      </div>

      {/* Planned vs Actual Bar Chart */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Planned vs Actual Budget Comparison
          </h3>
          <p className="text-xs text-ink-muted">
            Inspect category allocation limits against real student expenditures
          </p>
        </div>

        {budgetVsActual.length === 0 ? (
          <EmptyState
            title="No budget comparison data"
            description="Configure category budgets in the Budget Planner to compare against actual spending."
          />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActual}>
                <XAxis dataKey="category_name" tick={{ fontSize: 10, fill: '#76807A' }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: '#76807A' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E5DF',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="budgeted" name="Budgeted Limit" fill="#235A4B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Spent" fill="#D8FF65" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trend & Category Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend Line Chart */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Daily Spending Pace
            </h3>
            <p className="text-xs text-ink-muted">Day-by-day fluctuation across the month</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="analyticsTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#163D32" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#163D32" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#76807A' }} />
                <YAxis tick={{ fontSize: 10, fill: '#76807A' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E5DF',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#163D32" strokeWidth={2} fill="url(#analyticsTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Category Expense Share
            </h3>
            <p className="text-xs text-ink-muted">Proportion of student budget consumed</p>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total_amount"
                  nameKey="category_name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#163D32'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E5DF',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border-subtle text-xs">
            {categoryData.map((c) => (
              <div key={c.category_name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-ink truncate">{c.category_name}</span>
                </div>
                <span className="font-semibold text-ink font-tabular text-[11px]">
                  {toNum(c.percentage).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
