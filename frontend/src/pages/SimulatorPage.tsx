import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  TrendingDown,
  RotateCcw,
  Check,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { MonthlyBudget, Category } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';

interface SimulatorPageProps {
  categories: Category[];
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ categories }) => {
  const { year, month } = useAuth();
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [simulatedBudgets, setSimulatedBudgets] = useState<Record<number, number>>({});
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  const loadBaseBudget = async () => {
    setIsLoading(true);
    try {
      const b = await api.getBudget(year, month);
      setBudget(b);

      const initialMap: Record<number, number> = {};
      b?.category_budgets?.forEach((cb: any) => {
        initialMap[cb.category_id] = cb.allocated_amount;
      });
      setSimulatedBudgets(initialMap);

      // Run initial simulation
      runSimulation(initialMap, b);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBaseBudget();
  }, [year, month]);

  const runSimulation = async (
    allocationsMap: Record<number, number>,
    baseBudget: MonthlyBudget | null
  ) => {
    if (!baseBudget) return;
    try {
      const adjustments = Object.entries(allocationsMap).map(([catId, amount]) => ({
        category_id: Number(catId),
        proposed_budget: amount,
      }));

      const res = await api.simulateWhatIf({
        year,
        month,
        adjustments,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation calculation error', err);
    }
  };

  const handleSliderChange = (catId: number, newAmount: number) => {
    const updated = { ...simulatedBudgets, [catId]: newAmount };
    setSimulatedBudgets(updated);
    runSimulation(updated, budget);
  };

  const handleReset = () => {
    if (!budget) return;
    const initialMap: Record<number, number> = {};
    budget.category_budgets?.forEach((cb: any) => {
      initialMap[cb.category_id] = cb.allocated_amount;
    });
    setSimulatedBudgets(initialMap);
    runSimulation(initialMap, budget);
  };

  const handleApplyAsBudget = async () => {
    if (!budget) return;
    setIsApplying(true);
    try {
      const catBudgetsList = Object.entries(simulatedBudgets).map(([catId, amount]) => ({
        category_id: Number(catId),
        allocated_amount: amount,
      }));

      await api.saveBudget({
        year,
        month,
        total_budget: simulationResult?.simulated_total_budget || budget.total_budget,
        total_allowance: budget.total_allowance,
        notes: `Simulated scenario applied on ${new Date().toLocaleDateString()}`,
        category_budgets: catBudgetsList,
      });

      setApplySuccess('Simulation applied as your official monthly budget!');
      setTimeout(() => setApplySuccess(null), 3500);
      loadBaseBudget();
    } catch (err: any) {
      alert(err.message || 'Failed to apply budget');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading && !budget) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            What-If Budget Simulator
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Test adjustments to category allocations and immediately see impact on projected savings and daily safe-to-spend
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-border-subtle text-xs font-medium text-ink-muted hover:text-ink transition-ledger"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sliders</span>
          </button>
          <button
            onClick={handleApplyAsBudget}
            disabled={isApplying}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 text-lime" />
            <span>{isApplying ? 'Applying...' : 'Apply as Official Budget'}</span>
          </button>
        </div>
      </div>

      {applySuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>{applySuccess}</span>
        </div>
      )}

      {/* Real-time Calculation Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Original Total Budget
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            <CurrencyDisplay amount={simulationResult?.original_total_budget || budget?.total_budget} />
          </span>
          <span className="text-xs text-ink-muted">Configured limit</span>
        </div>

        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Simulated Total Budget
          </span>
          <span className="text-2xl font-semibold text-ledger font-tabular mt-1 block">
            <CurrencyDisplay amount={simulationResult?.simulated_total_budget} />
          </span>
          <span className="text-xs text-ink-muted font-tabular">
            {simulationResult && simulationResult.budget_delta < 0 ? (
              <span className="text-emerald-700">
                -₹{Math.abs(simulationResult.budget_delta).toLocaleString('en-IN')} reduction
              </span>
            ) : simulationResult && simulationResult.budget_delta > 0 ? (
              <span className="text-amber-800">
                +₹{simulationResult.budget_delta.toLocaleString('en-IN')} increase
              </span>
            ) : (
              'Unchanged'
            )}
          </span>
        </div>

        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Potential Monthly Savings
          </span>
          <span className="text-2xl font-semibold text-emerald-700 font-tabular mt-1 block">
            <CurrencyDisplay amount={simulationResult?.simulated_projected_savings} />
          </span>
          <span className="text-xs text-ink-muted">vs original trajectory</span>
        </div>

        <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle">
          <span className="text-[10px] font-semibold uppercase text-ink-muted block">
            Revised Daily Safe-to-Spend
          </span>
          <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
            <CurrencyDisplay amount={simulationResult?.revised_safe_to_spend_daily} />
          </span>
          <span className="text-xs text-ink-muted">Per day for remaining days</span>
        </div>
      </div>

      {/* Sliders Workspace */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-6 shadow-subtle">
        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-4 h-4 text-ledger" />
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Adjust Category Budget Levers
          </h3>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => {
            const currentAmount = simulatedBudgets[cat.id] ?? 0;
            const origAmount =
              budget?.category_budgets?.find((b) => b.category_id === cat.id)?.allocated_amount || 0;
            const diff = currentAmount - origAmount;
            const maxVal = Math.max(10000, origAmount * 2);

            return (
              <div key={cat.id} className="p-4 rounded-md bg-canvas border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-ink text-sm">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-muted">
                      Original:{' '}
                      <strong className="font-tabular text-ink">
                        ₹{origAmount.toLocaleString('en-IN')}
                      </strong>
                    </span>
                    <span className="text-sm font-semibold text-ledger font-tabular bg-paper px-2.5 py-0.5 rounded border border-border-subtle">
                      ₹{currentAmount.toLocaleString('en-IN')}
                    </span>
                    {diff !== 0 && (
                      <span
                        className={`text-xs font-tabular font-medium ${
                          diff < 0 ? 'text-emerald-700' : 'text-amber-800'
                        }`}
                      >
                        {diff > 0 ? `+₹${diff.toLocaleString('en-IN')}` : `-₹${Math.abs(diff).toLocaleString('en-IN')}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max={maxVal}
                  step="50"
                  value={currentAmount}
                  onChange={(e) => handleSliderChange(cat.id, Number(e.target.value))}
                  className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-ledger"
                />

                <div className="flex justify-between text-[10px] text-ink-muted mt-1 font-tabular">
                  <span>₹0</span>
                  <span>₹{(maxVal / 2).toLocaleString('en-IN')}</span>
                  <span>₹{maxVal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
