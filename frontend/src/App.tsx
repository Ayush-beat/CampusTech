import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import { Category } from './types';
import { NavTab } from './components/layout/Sidebar';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SemesterPlannerPage } from './pages/SemesterPlannerPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { CalendarPage } from './pages/CalendarPage';
import { HealthPage } from './pages/HealthPage';
import { AssistantPage } from './pages/AssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Tab to URL path mapping
const TAB_TO_PATH: Record<NavTab, string> = {
  overview: 'dashboard',
  transactions: 'transactions',
  budgets: 'budgets',
  analytics: 'analytics',
  insights: 'insights',
  semester: 'semester-planner',
  savings: 'savings-goals',
  subscriptions: 'subscriptions',
  simulator: 'simulator',
  calendar: 'calendar',
  health: 'health',
  assistant: 'assistant',
  reports: 'reports',
  settings: 'settings',
};

// URL path to Tab mapping
const PATH_TO_TAB: Record<string, NavTab> = {
  dashboard: 'overview',
  overview: 'overview',
  transactions: 'transactions',
  budgets: 'budgets',
  analytics: 'analytics',
  insights: 'insights',
  'semester-planner': 'semester',
  semester: 'semester',
  'savings-goals': 'savings',
  savings: 'savings',
  subscriptions: 'subscriptions',
  simulator: 'simulator',
  calendar: 'calendar',
  health: 'health',
  assistant: 'assistant',
  reports: 'reports',
  settings: 'settings',
};

const PROTECTED_PATHS = new Set(Object.keys(PATH_TO_TAB));

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Initialize and synchronize with browser URL
  useEffect(() => {
    const handleLocationChange = () => {
      const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

      if (!rawPath || rawPath === '') {
        setAuthView('landing');
        return;
      }

      if (rawPath === 'login') {
        setAuthView('login');
        return;
      }

      if (rawPath === 'register') {
        setAuthView('register');
        return;
      }

      // Check if it's a protected financial route
      if (PROTECTED_PATHS.has(rawPath)) {
        const tab = PATH_TO_TAB[rawPath] || 'overview';
        setCurrentTab(tab);

        // If user is not authenticated yet, record redirect target and show login
        if (!user && !isLoading) {
          setRedirectPath(rawPath);
          setAuthView('login');
          window.history.replaceState(null, '', '/login');
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [user, isLoading]);

  // When user successfully signs in, navigate to redirect target or dashboard
  useEffect(() => {
    if (user && !isLoading) {
      if (redirectPath && PATH_TO_TAB[redirectPath]) {
        const targetTab = PATH_TO_TAB[redirectPath];
        setCurrentTab(targetTab);
        window.history.replaceState(null, '', `/${TAB_TO_PATH[targetTab]}`);
        setRedirectPath(null);
      } else if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/') {
        setCurrentTab('overview');
        window.history.replaceState(null, '', '/dashboard');
      }
    }
  }, [user, isLoading]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const handleRefreshData = () => {
    setRefreshKey((k) => k + 1);
    loadCategories();
  };

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    const path = TAB_TO_PATH[tab] || 'dashboard';
    window.history.pushState(null, '', `/${path}`);
  };

  const navigateToAuthView = (view: 'landing' | 'login' | 'register') => {
    setAuthView(view);
    const path = view === 'landing' ? '/' : `/${view}`;
    window.history.pushState(null, '', path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-ledger text-lime flex items-center justify-center font-bold text-base shadow-sm animate-pulse border border-ledger-light/30">
          CT
        </div>
        <div className="text-xs text-ink-muted">Loading CampusTech Financial Intelligence...</div>
      </div>
    );
  }

  // Not authenticated: Only public routes allowed
  if (!user) {
    if (authView === 'login') {
      return (
        <LoginPage
          onNavigateRegister={() => navigateToAuthView('register')}
          onNavigateHome={() => navigateToAuthView('landing')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateLogin={() => navigateToAuthView('login')}
          onNavigateHome={() => navigateToAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onNavigateLogin={() => navigateToAuthView('login')}
        onNavigateRegister={() => navigateToAuthView('register')}
      />
    );
  }

  // Authenticated: Render Protected Workspace
  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      categories={categories}
      onRefreshData={handleRefreshData}
    >
      <div key={refreshKey}>
        {currentTab === 'overview' && (
          <DashboardPage
            onNavigateTab={handleSelectTab}
            onOpenAddExpense={() => {
              const addBtn = document.querySelector('header button[class*="bg-ledger"]') as HTMLButtonElement;
              if (addBtn) addBtn.click();
            }}
          />
        )}
        {currentTab === 'transactions' && <TransactionsPage categories={categories} />}
        {currentTab === 'budgets' && (
          <BudgetsPage categories={categories} onRefreshCategories={loadCategories} />
        )}
        {currentTab === 'analytics' && <AnalyticsPage />}
        {currentTab === 'insights' && <InsightsPage />}
        {currentTab === 'semester' && <SemesterPlannerPage categories={categories} />}
        {currentTab === 'savings' && <SavingsGoalsPage />}
        {currentTab === 'subscriptions' && <SubscriptionsPage categories={categories} />}
        {currentTab === 'simulator' && <SimulatorPage categories={categories} />}
        {currentTab === 'calendar' && <CalendarPage />}
        {currentTab === 'health' && <HealthPage />}
        {currentTab === 'assistant' && <AssistantPage />}
        {currentTab === 'reports' && <ReportsPage />}
        {currentTab === 'settings' && <SettingsPage />}
      </div>
    </AppLayout>
  );
};

export default function App() {
  return <AppContent />;
}
