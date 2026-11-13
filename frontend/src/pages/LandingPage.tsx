import React from 'react';
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Lock,
  ChevronRight,
  PieChart,
  Target,
  Sliders,
  Calendar,
  Layers,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const { quickDemoLogin, isLoading } = useAuth();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-lime selection:text-ledger-dark">
      {/* Public Top Navigation */}
      <header className="h-18 px-6 sm:px-12 border-b border-border-subtle flex items-center justify-between bg-paper/90 backdrop-blur-md sticky top-0 z-40 transition-campustech">
        <div className="flex items-center gap-6">
          <BrandLogo size="md" showDescriptor={false} />

          {/* Public Nav Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-ink-muted">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-ink transition-campustech"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('methodology')}
              className="hover:text-ink transition-campustech"
            >
              Methodology
            </button>
            <button
              onClick={() => scrollToSection('privacy')}
              className="hover:text-ink transition-campustech"
            >
              Privacy & Security
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Selector */}
          <ThemeToggle compact={false} />

          <button
            onClick={onNavigateLogin}
            className="text-xs font-medium text-ink hover:text-ledger dark:hover:text-lime px-3 py-1.5 rounded transition-campustech"
          >
            Sign In
          </button>
          <button
            onClick={onNavigateRegister}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-ledger text-paper hover:bg-ledger-light px-4 py-1.5 rounded-md transition-campustech shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3 h-3 text-lime" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 sm:px-12 pt-16 pb-16 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-muted border border-border-subtle text-xs font-medium text-ledger dark:text-lime mb-6">
          <span className="w-2 h-2 rounded-full bg-lime-dark shrink-0" />
          <span>CampusTech — Student Financial Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-ink font-editorial max-w-3xl leading-[1.12] mb-6">
          Your money, your semester, <br />
          <span className="italic font-serif text-ledger dark:text-lime">your perspective.</span>
        </h1>

        <p className="text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed mb-8">
          Intelligent expense analytics and budgeting engineered for the financial realities of college life.
          Make informed spending choices, plan semester fee commitments, and build disciplined habits with explainable data.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onNavigateRegister}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-ledger text-paper text-sm font-medium hover:bg-ledger-light transition-campustech shadow-md"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 text-lime" />
          </button>
          <button
            onClick={onNavigateLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-paper border border-border-subtle text-ink text-sm font-medium hover:border-ledger/40 hover:bg-surface-soft transition-campustech"
          >
            <span>Sign In to Workspace</span>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </button>
          <button
            onClick={() => quickDemoLogin()}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-surface-muted border border-border-subtle text-xs font-medium text-ink hover:border-ledger/40 transition-campustech"
            title="Explore synthetic presentation account"
          >
            <Sparkles className="w-3.5 h-3.5 text-ledger dark:text-lime" />
            <span>{isLoading ? 'Opening Demo...' : 'Explore Demo Workspace'}</span>
          </button>
        </div>

        {/* Privacy Assurance Pill */}
        <div className="mt-6 p-2.5 px-4 rounded-md bg-surface-soft border border-border-subtle text-xs text-ink-muted flex items-center justify-center gap-2 max-w-xl">
          <ShieldCheck className="w-4 h-4 text-ledger dark:text-lime shrink-0" />
          <span>
            <strong>Zero Bank Credentials Required:</strong> Your personal financial data is isolated and accessible strictly after authentication.
          </span>
        </div>

        {/* Synthetic Illustrative Interface Preview (No personal records) */}
        <div className="w-full max-w-4xl mt-12 bg-paper border border-border-subtle rounded-ledger p-6 shadow-elevated text-left">
          {/* Header Bar with explicit synthetic label */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ledger-soft dark:bg-surface-muted text-ledger dark:text-lime font-semibold text-xs flex items-center justify-center border border-border-subtle">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Academic Semester Overview</h3>
                <p className="text-xs text-ink-muted">Predictive Budget Pace & Daily Allowance Simulation</p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded bg-surface-muted text-ink-muted border border-border-subtle font-medium self-start sm:self-auto">
              Illustrative preview — sample synthetic model
            </span>
          </div>

          {/* Sample Metrics (Generic conceptual numbers, no real user name) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <span className="text-[10px] font-semibold uppercase text-ink-muted block">
                Daily Safe-to-Spend Calculus
              </span>
              <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
                ₹385.00 <span className="text-xs font-normal text-ink-muted">/ day</span>
              </span>
              <span className="text-[11px] text-ledger dark:text-lime font-medium block mt-0.5">
                Calculated after reserving planned fees
              </span>
            </div>

            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <span className="text-[10px] font-semibold uppercase text-ink-muted block">
                Projected Month-End Pacing
              </span>
              <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
                92.4% <span className="text-xs font-normal text-ink-muted">of budget</span>
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block mt-0.5">
                On Track (Projected Surplus Available)
              </span>
            </div>

            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <span className="text-[10px] font-semibold uppercase text-ink-muted block">
                Reserved Academic Milestones
              </span>
              <span className="text-2xl font-semibold text-ink font-tabular mt-1 block">
                ₹2,400.00
              </span>
              <span className="text-[11px] text-terracotta font-medium block mt-0.5">
                Exam fee commitment protected
              </span>
            </div>
          </div>

          {/* Illustrative Explanation Callout */}
          <div className="p-3.5 bg-surface-muted rounded-md border border-border-subtle flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-ledger dark:text-lime shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-ink">Explainable Financial Intelligence:</span>{' '}
              <span className="text-ink-light">
                CampusTech transparently estimates daily allowances using arithmetic rule sets:
                <code className="mx-1 px-1.5 py-0.5 bg-paper rounded border border-border-subtle text-[11px] font-mono">
                  (Remaining Usable Funds - Reserved Commitments) / Days Left
                </code>.
                No ungrounded AI claims, no opaque predictions, and no surprise deficits.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section id="features" className="px-6 sm:px-12 py-16 bg-paper border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-ledger dark:text-lime block mb-2">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-normal font-editorial text-ink">
              Engineered for the realities of student cash flow.
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-2 max-w-xl mx-auto">
              From pocket money and canteen spending to lab kits and exam fees, CampusTech provides clarity across every rupee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas hover:border-ledger/40 transition-campustech">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1.5">Semester Academic Planner</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Coordinate upcoming exam fees, lab prototypes, textbooks, and hostel commitments chronologically.
                Marking a commitment as paid automatically links to an expense record, preventing double-counting against your daily safe-to-spend allowance.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas hover:border-ledger/40 transition-campustech">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1.5">Safe-to-Spend Daily Calculus</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Unlike simple division that leaves you broke before rent is due, CampusTech subtracts upcoming reserved commitments
                first before deriving your daily allowance. All assumptions are disclosed with zero fabricated guarantees.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas hover:border-ledger/40 transition-campustech">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1.5">Interactive What-If Simulator</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Test adjustments to category budgets with interactive sliders. See immediate real-time recalculated
                projected savings and safe-to-spend changes without corrupting your real financial records.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-ledger border border-border-subtle bg-canvas hover:border-ledger/40 transition-campustech">
              <div className="w-9 h-9 rounded-md bg-ledger text-lime flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1.5">Natural-Language Quick Entry</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Record quick transactions on the go using plain English phrases like <em>"Spent ₹140 on canteen lunch today"</em>.
                Deterministic parser maps the amount, date, and suggested category with a confirmation review step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="px-6 sm:px-12 py-16 bg-canvas border-t border-border-subtle">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-ledger dark:text-lime block mb-2">
              Financial Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-normal font-editorial text-ink">
              Deterministic, explainable mathematics.
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-ledger bg-paper border border-border-subtle">
              <h4 className="text-sm font-semibold text-ink mb-1">1. Usable Funds vs Monthly Budget</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                CampusTech strictly separates your real pocket money/allowance from planned spending targets.
                A budget is a guideline; usable funds represent real solvency.
              </p>
            </div>

            <div className="p-5 rounded-ledger bg-paper border border-border-subtle">
              <h4 className="text-sm font-semibold text-ink mb-1">2. Month-End Overspending Projection</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Calculated dynamically from elapsed days: <code className="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-[11px]">(Month-to-Date Spending / Elapsed Days) × Total Days in Month</code>.
                Displays confidence indicators and accounts for leap years and dynamic month lengths.
              </p>
            </div>

            <div className="p-5 rounded-ledger bg-paper border border-border-subtle">
              <h4 className="text-sm font-semibold text-ink mb-1">3. Deterministic Assistant</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Ask analytical queries like <em>"How much did I spend on food this month?"</em> or <em>"What is my safe to spend today?"</em>.
                All answers are computed directly from authenticated database queries—never invented by a generative model.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section id="privacy" className="px-6 sm:px-12 py-16 bg-paper border-t border-border-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-ledger-soft dark:bg-surface-muted text-ledger dark:text-lime flex items-center justify-center mx-auto mb-4 border border-border-subtle">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-normal font-editorial text-ink mb-3">
            Privacy by design. No public leaks.
          </h2>

          <p className="text-xs sm:text-sm text-ink-muted max-w-2xl mx-auto leading-relaxed mb-8">
            CampusTech enforces strict user-level data isolation on every API request.
            Financial records, budgets, savings targets, and insights are accessible strictly after authentication.
            No visitor can inspect another student's balances or transaction history.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <CheckCircle2 className="w-4 h-4 text-ledger dark:text-lime mb-2" />
              <h4 className="text-xs font-semibold text-ink mb-1">Strict User Ownership</h4>
              <p className="text-[11px] text-ink-muted">
                Every database transaction checks verified JWT session claims before returning or altering financial data.
              </p>
            </div>

            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <CheckCircle2 className="w-4 h-4 text-ledger dark:text-lime mb-2" />
              <h4 className="text-xs font-semibold text-ink mb-1">Decimal-Safe Precision</h4>
              <p className="text-[11px] text-ink-muted">
                Zero floating-point inaccuracies. All monetary values use exact decimal storage and rounding.
              </p>
            </div>

            <div className="p-4 rounded-md bg-canvas border border-border-subtle">
              <CheckCircle2 className="w-4 h-4 text-ledger dark:text-lime mb-2" />
              <h4 className="text-xs font-semibold text-ink mb-1">Zero Real Bank Credentials</h4>
              <p className="text-[11px] text-ink-muted">
                Designed for educational and personal finance tracking without requesting banking passwords or OTPs.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={onNavigateRegister}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-ledger text-paper text-sm font-medium hover:bg-ledger-light transition-campustech shadow-md"
            >
              <span>Create Your Student Account</span>
              <ArrowRight className="w-4 h-4 text-lime" />
            </button>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="mt-auto px-6 sm:px-12 py-8 border-t border-border-subtle bg-paper text-center text-xs text-ink-muted">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" showDescriptor={true} />
          <p>© 2026 CampusTech • Student Financial Intelligence Platform.</p>
          <div className="flex items-center gap-4 text-ink-muted text-xs">
            <button onClick={() => scrollToSection('features')} className="hover:text-ink">Features</button>
            <button onClick={() => scrollToSection('privacy')} className="hover:text-ink">Privacy</button>
            <button onClick={onNavigateLogin} className="hover:text-ink">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
