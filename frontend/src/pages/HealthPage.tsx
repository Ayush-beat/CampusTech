import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Target,
  GraduationCap,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { FinancialHealth, Achievement } from '../types';

export const HealthPage: React.FC = () => {
  const { year, month } = useAuth();
  const [healthData, setHealthData] = useState<FinancialHealth | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      const [h, a] = await Promise.all([
        api.getFinancialHealth(year, month),
        api.getAchievements(),
      ]);
      setHealthData(h);
      setAchievements(a || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, [year, month]);

  if (isLoading && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger" />
      </div>
    );
  }

  const score = healthData?.overall_score || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-border-subtle">
        <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
          Financial Health Indicator & Habit Badges
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          A transparent index measuring budgeting engagement, tracking consistency, and semester planning
        </p>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ledger-soft text-ledger text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Health Status: {healthData?.grade}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-semibold text-ink font-sans tracking-tight mb-2">
            Budgeting Awareness Index
          </h3>
          <p className="text-sm text-ink-muted leading-relaxed max-w-xl">
            {healthData?.summary}
          </p>

          <p className="text-[11px] text-ink-subtle mt-4 leading-normal italic">
            {healthData?.disclaimer}
          </p>
        </div>

        {/* Circular/Gauge visual representation */}
        <div className="w-36 h-36 rounded-full border-8 border-surface-muted flex flex-col items-center justify-center shrink-0 relative bg-canvas">
          <div
            className="absolute inset-0 rounded-full border-8 border-ledger border-t-lime transition-all duration-700"
            style={{
              clipPath: `polygon(50% 50%, -50% -50%, ${score}% -50%, ${score}% 150%, -50% 150%)`,
            }}
          />
          <span className="text-4xl font-bold text-ink font-tabular z-10">{score}</span>
          <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-wider z-10">
            out of 100
          </span>
        </div>
      </div>

      {/* 4 Health Components Breakdown */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-6 shadow-subtle">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
          Transparent Component Score Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthData?.components.map((comp) => (
            <div
              key={comp.name}
              className="p-4 rounded-md bg-canvas border border-border-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-ink">{comp.name}</h4>
                  <span className="text-xs font-bold font-tabular text-ledger">
                    {comp.score} / {comp.max_score} pts
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden my-2">
                  <div
                    className="h-full bg-ledger rounded-full"
                    style={{ width: `${(comp.score / comp.max_score) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">{comp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Positive Habit Milestones & Challenges */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-6 shadow-subtle">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-ledger" />
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Student Habit Badges & Milestones
            </h3>
            <p className="text-xs text-ink-muted">
              Earned through consistent record-keeping and proactive semester budgeting
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-md bg-surface-soft border border-border-subtle flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-ledger text-lime flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-ink">{a.name}</h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-lime text-ledger-dark font-medium">
                    UNLOCKED
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                  {a.description}
                </p>
                <span className="text-[10px] text-ink-subtle block mt-1">
                  Unlocked on {new Date(a.unlocked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
