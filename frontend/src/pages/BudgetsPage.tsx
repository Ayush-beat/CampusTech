import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Save,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  History,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { MonthlyBudget, Category, CategoryBudget } from '../types';
import { CurrencyDisplay, toNum, roundPaise, formatINR } from '../components/common/CurrencyDisplay';

interface BudgetsPageProps {
  categories: Category[];
  onRefreshCategories: () => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  categories,
  onRefreshCategories,
}) => {
  const { year, month } = useAuth();
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Editable category allocations map { categoryId: amount } (strictly numbers, never strings)
  const [allocations, setAllocations] = useState<Record<number, number>>({});
  const [totalBudgetInput, setTotalBudgetInput] = useState<string>('');
  const [allowanceInput, setAllowanceInput] = useState<string>('');

  // Add category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#163D32');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const loadBudgetData = async () => {
    setIsLoading(true);
    try {
      const [bData, hData] = await Promise.all([
        api.getBudget(year, month),
        api.getBudgetHistory(),
      ]);
      setBudget(bData);
      setHistoryData(hData || []);

      if (bData) {
        setTotalBudgetInput(String(roundPaise(bData.total_budget)));
        setAllowanceInput(String(roundPaise(bData.total_allowance)));
        const allocMap: Record<number, number> = {};
        bData.category_budgets?.forEach((cb: CategoryBudget) => {
          // Strictly parse as float and round to paise to prevent string concatenation bugs
          allocMap[cb.category_id] = roundPaise(cb.allocated_amount);
        });
        setAllocations(allocMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [year, month]);

  const handleAllocationChange = (catId: number, val: string) => {
    // Prevent string concatenation, NaN, infinity, and negative numbers
    if (val.trim() === '') {
      setAllocations((prev) => ({
        ...prev,
        [catId]: 0,
      }));
      return;
    }
    const parsed = parseFloat(val);
    const sanitized = isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, roundPaise(parsed));
    setAllocations((prev) => ({
      ...prev,
      [catId]: sanitized,
    }));
  };

  const handleSaveBudget = async () => {
    setIsSaving(true);
    try {
      const catBudgetsList = Object.entries(allocations).map(([catId, amount]) => ({
        category_id: Number(catId),
        allocated_amount: roundPaise(amount),
      }));

      const parsedTotal = parseFloat(totalBudgetInput);
      const parsedAllowance = parseFloat(allowanceInput);

      const res = await api.saveBudget({
        year,
        month,
        total_budget: isNaN(parsedTotal) || parsedTotal < 0 ? 0 : roundPaise(parsedTotal),
        total_allowance: isNaN(parsedAllowance) || parsedAllowance < 0 ? 0 : roundPaise(parsedAllowance),
        notes: `Updated budget for ${year}-${month}`,
        category_budgets: catBudgetsList,
      });

      setBudget(res);
      setSaveMessage('Budget saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
      loadBudgetData();
    } catch (err: any) {
      alert(err.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      await api.createCategory({
        name: newCatName.trim(),
        color: newCatColor,
        icon: 'Tag',
      });
      setNewCatName('');
      onRefreshCategories();
      loadBudgetData();
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    } finally {
      setIsAddingCat(false);
    }
  };

  if (isLoading && !budget) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger" />
      </div>
    );
  }

  const sumOfAllocations = Object.values(allocations).reduce(
    (acc, curr) => roundPaise(acc + toNum(curr)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Student Budget Planner
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure monthly targets, track category limits, and review planned vs actual spending
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-xs text-emerald-800 dark:text-sage font-medium bg-emerald-50 dark:bg-surface-muted px-2.5 py-1 rounded border border-emerald-200 dark:border-border-subtle">
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSaveBudget}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-campustech shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-lime dark:text-sage" />
            <span>{isSaving ? 'Saving...' : 'Save Budget Allocations'}</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Allowance */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Monthly Allowance (Funds In)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-ink font-tabular">₹</span>
            <input
              type="number"
              step="100"
              min="0"
              value={allowanceInput}
              onChange={(e) => setAllowanceInput(e.target.value)}
              className="text-2xl font-semibold text-ink font-tabular bg-transparent border-b border-border-subtle focus:border-ledger w-full focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-ink-muted mt-2">
            Total funds received from parents/stipend
          </p>
        </div>

        {/* Total Planned Budget */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Total Monthly Budget Limit
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-ink font-tabular">₹</span>
            <input
              type="number"
              step="100"
              min="0"
              value={totalBudgetInput}
              onChange={(e) => setTotalBudgetInput(e.target.value)}
              className="text-2xl font-semibold text-ink font-tabular bg-transparent border-b border-border-subtle focus:border-ledger w-full focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-ink-muted mt-2">
            <span>
              Category Sum: <strong className="font-tabular text-ink">{formatINR(sumOfAllocations)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setTotalBudgetInput(String(sumOfAllocations))}
              className="text-ledger dark:text-sage font-medium hover:underline text-[10px]"
              title="Set total budget equal to sum of category allocations"
            >
              Sync to Sum
            </button>
          </div>
        </div>

        {/* Current Month Spent & Utilization */}
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Actual Spent MTD
          </label>
          <div className="text-2xl font-semibold text-ink font-tabular">
            <CurrencyDisplay amount={budget?.total_spent} />
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-ink-muted">Overall Utilization</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                (budget?.overall_utilization || 0) > 100
                  ? 'bg-terracotta-light text-terracotta'
                  : 'bg-ledger-soft text-ledger'
              }`}
            >
              {toNum(budget?.overall_utilization).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Allocations & Actuals Table */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Category Spending Limits & Utilization
            </h3>
            <p className="text-xs text-ink-muted">
              Define maximum monthly budget per student category
            </p>
          </div>

          {/* Quick Add Custom Category */}
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category..."
              className="px-2.5 py-1 text-xs bg-canvas border border-border-subtle rounded-md text-ink focus:border-ledger"
            />
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-7 h-7 p-0.5 border border-border-subtle rounded cursor-pointer"
              title="Pick Category Color"
            />
            <button
              type="submit"
              disabled={isAddingCat || !newCatName.trim()}
              className="px-2.5 py-1 bg-surface-muted border border-border-subtle rounded-md text-xs font-medium text-ink hover:text-ledger hover:border-ledger/30 disabled:opacity-40 transition-ledger"
            >
              + Add
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-ink-muted font-medium bg-surface-muted/50">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 w-44">Allocated Budget (₹)</th>
                <th className="py-2.5 px-3 text-right">Actual Spent</th>
                <th className="py-2.5 px-3 text-right">Remaining</th>
                <th className="py-2.5 px-3 w-48">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {categories.map((cat) => {
                const cb = budget?.category_budgets?.find((b) => b.category_id === cat.id);
                const currentAlloc = allocations[cat.id] !== undefined ? roundPaise(allocations[cat.id]) : roundPaise(cb?.allocated_amount);
                const spent = roundPaise(cb?.spent_amount);
                const remaining = roundPaise(currentAlloc - spent);
                const utilPct = currentAlloc > 0 ? (spent / currentAlloc) * 100 : (spent > 0 ? 100 : 0);
                const isOver = utilPct > 100;
                const isWarn = utilPct >= 80 && !isOver;

                return (
                  <tr key={cat.id} className="hover:bg-surface-soft/60 transition-ledger">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium text-ink">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-ink-muted">₹</span>
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={currentAlloc}
                          onChange={(e) => handleAllocationChange(cat.id, e.target.value)}
                          className="w-full pl-6 pr-2 py-1 bg-canvas border border-border-subtle rounded text-xs font-tabular font-medium text-ink focus:border-ledger focus:bg-paper"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-ink font-tabular">
                      <CurrencyDisplay amount={spent} />
                    </td>
                    <td className="py-3 px-3 text-right font-semibold font-tabular">
                      <span className={remaining < 0 ? 'text-terracotta' : 'text-ink'}>
                        <CurrencyDisplay amount={remaining} />
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-tabular">
                          <span
                            className={`font-semibold ${
                              isOver ? 'text-terracotta' : isWarn ? 'text-amber-800' : 'text-ink'
                            }`}
                          >
                            {utilPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOver ? 'bg-terracotta' : isWarn ? 'bg-amber-500' : 'bg-ledger'
                            }`}
                            style={{ width: `${Math.min(100, utilPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Budget Adherence Chart */}
      {historyData.length > 0 && (
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-ledger" />
            <div>
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Historical Budget vs Actual (Last 6 Months)
              </h3>
              <p className="text-xs text-ink-muted">
                Track how closely you adhere to student budget targets over time
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#76807A' }} />
                <YAxis tick={{ fontSize: 11, fill: '#76807A' }} tickFormatter={(v) => `₹${v}`} />
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
                <Bar dataKey="budget" name="Planned Budget" fill="#235A4B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Actual Spent" fill="#D8FF65" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
