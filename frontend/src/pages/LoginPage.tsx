import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateRegister,
  onNavigateHome,
}) => {
  const { login, quickDemoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    try {
      await quickDemoLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to start demo session');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 selection:bg-lime selection:text-ledger-dark">
      {/* Return Home Link & Theme Toggle */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-campustech"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <ThemeToggle compact={true} />
          <BrandLogo size="sm" />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-paper border border-border-subtle rounded-ledger p-8 shadow-elevated transition-campustech">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-ink font-sans">Sign in to CampusTech</h2>
          <p className="text-xs text-ink-muted mt-1">
            Access your private student financial workspace
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-6 p-4 rounded-md bg-surface-soft border border-border-subtle flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ledger dark:text-lime" />
              Presentation / Evaluator Mode
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-lime text-ledger-dark">
              1-CLICK
            </span>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Instantly load a pre-seeded synthetic student profile with 3 months of analytical history.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full mt-1 py-2 px-3 rounded bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-campustech flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime" />
            <span>{isLoading ? 'Opening Demo...' : 'Open Demo Workspace (Synthetic Profile)'}</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-border-subtle"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-ink-subtle">
            Or sign in with email
          </span>
          <div className="flex-grow border-t border-border-subtle"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-terracotta-light text-terracotta rounded-md border border-terracotta/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-campustech"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-campustech"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-ink-muted hover:text-ink"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-ledger text-paper rounded-md text-xs font-medium hover:bg-ledger-light transition-campustech shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-lime" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border-subtle text-center">
          <p className="text-xs text-ink-muted">
            New to CampusTech?{' '}
            <button
              onClick={onNavigateRegister}
              className="font-medium text-ledger dark:text-lime hover:underline"
            >
              Create student account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
