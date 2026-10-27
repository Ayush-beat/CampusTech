import React from 'react';
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  PieChart,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const { quickDemoLogin, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-lime selection:text-ledger-dark">
      {/* Top Navigation */}
      <header className="h-18 px-6 sm:px-12 border-b border-border-subtle flex items-center justify-between bg-paper/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ledger flex items-center justify-center text-lime font-bold text-sm">
            L.
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight text-ledger-dark font-sans">
              ledger<span className="text-lime-dark">.</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider text-ink-muted font-medium bg-surface-muted px-2 py-0.5 rounded">
              Student Financial OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateLogin}
            className="text-xs font-medium text-ink hover:text-ledger px-3 py-1.5 rounded transition-ledger"
          >
            Sign In
          </button>
          <button
            onClick={() => quickDemoLogin()}
            disabled={isLoading}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-surface-muted border border-border-subtle hover:border-ledger/40 px-3.5 py-1.5 rounded-md transition-ledger"
          >
            <Sparkles className="w-3.5 h-3.5 text-ledger" />
            <span>Explore Demo</span>
          </button>
          <button
            onClick={onNavigateRegister}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-ledger text-paper hover:bg-ledger-light px-4 py-1.5 rounded-md transition-ledger shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3 h-3 text-lime" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 sm:px-12 pt-16 pb-20 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-muted border border-border-subtle text-xs font-medium text-ledger mb-6">
          <span className="w-2 h-2 rounded-full bg-lime-dark" />
          <span>Designed specifically for Indian college students</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-ink font-editorial max-w-3xl leading-[1.15] mb-6">
          Your money, <br />
          <span className="italic font-serif text-ledger">in perspective.</span>
        </h1>

        <p className="text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed mb-8">
          Understand your spending, plan your semester, and make every rupee work more intentionally.
          Deterministic calculations, explainable recommendations, and zero guesswork.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => quickDemoLogin()}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-ledger text-paper text-sm font-medium hover:bg-ledger-light transition-ledger shadow-md"
          >
            <Sparkles className="w-4 h-4 text-lime" />
            <span>{isLoading ? 'Opening Demo...' : 'Explore Live Demo Account'}</span>
          </button>
          <button
            onClick={onNavigateRegister}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-paper border border-border-subtle text-ink text-sm font-medium hover:border-ledger/40 hover:bg-surface-soft transition-ledger"
          >
            <span>Create New Profile</span>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </button>
        </div>

        {/* Credibility Notice */}
        <p className="mt-4 text-xs text-ink-subtle flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Zero real bank credentials required • Educational & personal analytics platform</span>
        </p>

        {/* Dashboard Preview Mock Card */}
        <div className="w-full max-w-4xl mt-14 bg-paper border border-border-subtle rounded-ledger p-6 shadow-elevated text-left">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-ledger-soft text-ledger font-semibold text-xs flex items-center justify-center">
                AS
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">Aarav Sharma — DTU Campus</h4>
                <p className="text-xs text-ink-muted">October 2026 Overview • Monthly Allowance ₹18,000</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-lime text-ledger-dark font-medium border border-lime-dark/30">
              SAFE TO SPEND: ₹412 / day
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <span className="text-[10px] font-semibold uppercase text-ink-muted block">Remaining Budget</span>
              <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">₹6,840.00</span>
              <span className="text-[11px] text-ledger font-medium">56% of ₹15,500 limit used</span>
            </div>
            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <span className="text-[10px] font-semibold uppercase text-ink-muted block">Projected Month-End</span>
              <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">₹14,280.00</span>
              <span className="text-[11px] text-emerald-700 font-medium">On Track (₹1,220 Surplus)</span>
            </div>
            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <span className="text-[10px] font-semibold uppercase text-ink-muted block">Reserved Commitments</span>
              <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">₹2,500.00</span>
              <span className="text-[11px] text-amber-800 font-medium">End-Sem Exam Fee (Oct 28)</span>
            </div>
          </div>

          <div className="p-3.5 bg-surface-muted rounded-md border border-border-subtle flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-ledger shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-ink">Explainable Financial Insight:</span>{' '}
              <span className="text-ink-light">
                At your current pace of ₹340/day across 18 elapsed days, you are projected to finish the month with ₹1,220 surplus. 
                Your upcoming ₹2,500 exam fee is already reserved in your daily safe-to-spend allowance.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="px-6 sm:px-12 py-16 bg-paper border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-ledger block mb-2">
              System Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-normal font-editorial text-ink">
              Engineered for the realities of student life.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Semester Academic Planner</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Track exam fees, lab prototypes, textbooks, and hostel deposits. Marking a commitment as paid automatically links to an expense record, preventing double-counting in your safe-to-spend allowance.
              </p>
            </div>

            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Explainable Safe-to-Spend Daily Calculus</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Uses transparent arithmetic: <code className="bg-paper px-1 rounded text-[11px]">(Usable Funds - Reserved Commitments) / Days Remaining</code>. Discloses all assumptions and never displays misleading negative allowances.
              </p>
            </div>

            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Deterministic Intelligence Engine</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Runs locally using Python rule evaluation. Detects micro-expense leaks, subscription creep, and pace spikes with 4 clear points: What was detected, Why it matters, Amount or %, and Actionable remedy.
              </p>
            </div>

            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Interactive What-If Simulation</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Simulate adjusting category allocations with real-time recalculated projected savings and daily safe-to-spend without corrupting actual transaction records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 sm:px-12 py-8 border-t border-border-subtle bg-paper text-center text-xs text-ink-muted">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ledger">ledger.</span>
            <span>— Intelligent Student Expense Analytics & Budgeting Platform</span>
          </div>
          <p>© 2026 College Mini-Project. Built with Python FastAPI, SQLAlchemy, React & TypeScript.</p>
        </div>
      </footer>
    </div>
  );
};
