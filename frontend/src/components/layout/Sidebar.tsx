import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Lightbulb,
  GraduationCap,
  Target,
  Repeat,
  Sliders,
  Calendar,
  ShieldCheck,
  MessageSquare,
  FileText,
  Settings,
  X,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'overview'
  | 'transactions'
  | 'budgets'
  | 'analytics'
  | 'insights'
  | 'semester'
  | 'savings'
  | 'subscriptions'
  | 'simulator'
  | 'calendar'
  | 'health'
  | 'assistant'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();

  const navItems: Array<{ id: NavTab; label: string; icon: React.ElementType; section?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'insights', label: 'Smart Insights', icon: Lightbulb },
    { id: 'semester', label: 'Semester Planner', icon: GraduationCap, section: 'Student OS' },
    { id: 'savings', label: 'Savings Goals', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders, section: 'Tools' },
    { id: 'calendar', label: 'Spending Calendar', icon: Calendar },
    { id: 'health', label: 'Financial Health', icon: ShieldCheck },
    { id: 'assistant', label: 'Ask Assistant', icon: MessageSquare },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'Account' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-paper border-r border-border-subtle flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ledger flex items-center justify-center text-lime font-bold text-sm tracking-tight shadow-sm">
              L.
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-ledger-dark font-sans">
                ledger<span className="text-lime-dark">.</span>
              </span>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted -mt-0.5 font-medium">
                Student Financial OS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const showSection = item.section && (idx === 0 || navItems[idx - 1].section !== item.section);

            return (
              <React.Fragment key={item.id}>
                {showSection && (
                  <div className="pt-4 pb-1.5 px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                      {item.section}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-ledger text-left ${
                    isActive
                      ? 'bg-ledger text-paper shadow-sm'
                      : 'text-ink-light hover:bg-surface-muted hover:text-ink'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-lime' : 'text-ink-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-border-subtle bg-surface-soft/60">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-ledger-soft text-ledger font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-ink truncate leading-tight">
                  {user?.full_name || 'Student User'}
                </p>
                <p className="text-[10px] text-ink-muted truncate">
                  {user?.college_name || 'Engineering Campus'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-ink-muted hover:text-terracotta hover:bg-terracotta-light rounded transition-ledger"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
