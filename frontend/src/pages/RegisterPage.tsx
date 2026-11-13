import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, School, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';

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
        college_name: collegeName.trim() || 'College of Engineering & Tech',
        student_id: studentId.trim() || null,
        currency: 'INR',
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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

      <div className="w-full max-w-md bg-paper border border-border-subtle rounded-ledger p-8 shadow-elevated transition-campustech">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-ink font-sans">Create your CampusTech account</h2>
          <p className="text-xs text-ink-muted mt-1">
            Student financial intelligence, isolated and private to you
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
            className="px-3 py-1.5 rounded bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-campustech shrink-0"
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
                placeholder="Aarav Sharma"
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-campustech"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              College Email Address *
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
              College / University Name
            </label>
            <div className="relative">
              <School className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Delhi Technological University"
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-campustech"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Roll / Student ID (Optional)
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 2024-CS-042"
              className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-campustech"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
            <span>{isLoading ? 'Creating account...' : 'Create Student Account'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-lime" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-border-subtle text-center">
          <p className="text-xs text-ink-muted">
            Already have an account?{' '}
            <button
              onClick={onNavigateLogin}
              className="font-medium text-ledger dark:text-lime hover:underline"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
