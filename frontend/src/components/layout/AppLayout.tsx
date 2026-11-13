import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Topbar } from './Topbar';
import { AddExpenseModal } from '../modals/AddExpenseModal';
import { NLPEntryModal } from '../modals/NLPEntryModal';
import { Category } from '../../types';

interface AppLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  categories: Category[];
  onRefreshData?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  categories,
  onRefreshData,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [nlpOpen, setNlpOpen] = useState(false);

  const getPageTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'overview':
        return 'Financial Overview';
      case 'transactions':
        return 'Expense Transactions';
      case 'budgets':
        return 'Student Budget Planner';
      case 'analytics':
        return 'Expense Analytics';
      case 'insights':
        return 'Smart Financial Insights';
      case 'semester':
        return 'Semester Expense Planner';
      case 'savings':
        return 'Savings Goals';
      case 'subscriptions':
        return 'Subscription Tracker';
      case 'simulator':
        return 'What-If Budget Simulator';
      case 'calendar':
        return 'Spending Habit Calendar';
      case 'health':
        return 'Financial Health & Badges';
      case 'assistant':
        return 'Ask Your Expenses Assistant';
      case 'reports':
        return 'Financial Reports & Statements';
      case 'settings':
        return 'Settings & Profile';
      default:
        return 'CampusTech';
    }
  };

  const handleExpenseSuccess = () => {
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Topbar
          title={getPageTitle(currentTab)}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenAddExpense={() => setAddExpenseOpen(true)}
          onOpenNLP={() => setNlpOpen(true)}
          onRefreshData={onRefreshData}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Global Add Expense Modal */}
      <AddExpenseModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSuccess={handleExpenseSuccess}
        categories={categories}
      />

      {/* Global NLP Quick Entry Modal */}
      <NLPEntryModal
        isOpen={nlpOpen}
        onClose={() => setNlpOpen(false)}
        onSuccess={handleExpenseSuccess}
      />
    </div>
  );
};
