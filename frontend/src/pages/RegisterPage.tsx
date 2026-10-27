import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, School, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateLogin,
  onNavigateHome,
}) => {
  const { register, quickDemoLogin, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        college_name: collegeName.trim() || 'Engineering Institute',
        student_id: studentId.trim() || null,
        currency: 'INR',
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 selection:bg-lime selection:text-ledger-dark">
      {/* Return Home Link */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-ledger"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-ledger flex items-center justify-center text-lime font-bold text-xs">
            L.
          </div>
          <span className="font-semibold text-sm text-ink font-sans">ledger.</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-paper border border-border-subtle rounded-ledger p-8 shadow-elevated">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-ink font-sans">Create your student profile</h2>
          <p className="text-xs text-ink-muted mt-1">
            Start tracking expenses with intelligent student-tailored insights
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-5 p-3.5 rounded-md bg-surface-soft border border-border-subtle flex items-center justify-between">
          <div className="text-xs">
            <span className="font-semibold text-ink block">Evaluating this project?</span>
            <span className="text-ink-muted text-[11px]">Skip typing and test with demo data</span>
          </div>
          <button
            type="button"
            onClick={() => quickDemoLogin()}
            disabled={isLoading}
            className="px-3 py-1.5 rounded bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shrink-0"
          >
            Demo Login
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-terracotta-light text-terracotta rounded-md border border-terracotta/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Nair"
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              College Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              College / University Name
            </label>
            <div className="relative">
              <School className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Delhi Technological University (DTU)"
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Password (min. 6 chars) *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-ink-muted hover:text-ink"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating profile...' : 'Create Student Account'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-lime" />
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-border-subtle text-center">
          <p className="text-xs text-ink-muted">
            Already registered?{' '}
            <button
              onClick={onNavigateLogin}
              className="font-medium text-ledger hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
