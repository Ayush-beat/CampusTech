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

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-ledger text-lime flex items-center justify-center font-bold text-base shadow-sm animate-pulse">
          L.
        </div>
        <div className="text-xs text-ink-muted">Loading Ledger. Student OS...</div>
      </div>
    );
  }

  // Not authenticated: Show Landing, Login or Register
  if (!user) {
    if (authView === 'login') {
      return (
        <LoginPage
          onNavigateRegister={() => setAuthView('register')}
          onNavigateHome={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateLogin={() => setAuthView('login')}
          onNavigateHome={() => setAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onNavigateLogin={() => setAuthView('login')}
        onNavigateRegister={() => setAuthView('register')}
      />
    );
  }

  // Authenticated: Render App Layout & Active Tab Page
  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      categories={categories}
      onRefreshData={handleRefreshData}
    >
      <div key={refreshKey}>
        {currentTab === 'overview' && (
          <DashboardPage
            onNavigateTab={setCurrentTab}
            onOpenAddExpense={() => {
              // Trigger add expense modal via layout
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
