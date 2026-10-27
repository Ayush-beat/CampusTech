export interface UserSettings {
  id: number;
  monthly_allowance: number;
  safe_spend_buffer: number;
  alert_threshold_80: boolean;
  alert_threshold_100: boolean;
  currency_symbol: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  college_name?: string;
  student_id?: string;
  currency: string;
  created_at?: string;
  settings?: UserSettings;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  user_id?: number;
}

export interface Expense {
  id: number;
  user_id: number;
  category_id?: number;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  notes?: string;
  is_recurring: boolean;
  planned_expense_id?: number;
  created_at?: string;
  category?: Category;
}

export interface CategoryBudget {
  id: number;
  monthly_budget_id: number;
  category_id: number;
  allocated_amount: number;
  category?: Category;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
}

export interface MonthlyBudget {
  id: number;
  user_id: number;
  year: number;
  month: number;
  total_budget: number;
  total_allowance: number;
  notes?: string;
  category_budgets: CategoryBudget[];
  total_spent: number;
  remaining_budget: number;
  overall_utilization: number;
}

export interface PlannedExpense {
  id: number;
  user_id: number;
  title: string;
  category_id?: number;
  amount: number;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'paid' | 'cancelled';
  linked_expense_id?: number;
  category?: Category;
}

export interface SavingsContribution {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  notes?: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  category: string;
  is_achieved: boolean;
  progress_percentage: number;
  months_remaining: number;
  contributions?: SavingsContribution[];
}

export interface RecurringExpense {
  id: number;
  name: string;
  category_id?: number;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_due_date: string;
  is_active: boolean;
  notes?: string;
  category?: Category;
  monthly_cost_equivalent: number;
  annual_cost_equivalent: number;
}

export interface SafeToSpend {
  safe_to_spend_daily: number;
  remaining_usable_funds: number;
  reserved_upcoming_commitments: number;
  total_allowance: number;
  total_spent_mtd: number;
  days_remaining: number;
  total_days_in_month: number;
  is_negative_warning: boolean;
  explanation: string;
}

export interface OverspendingProjection {
  month_to_date_spending: number;
  elapsed_days: number;
  total_days: number;
  average_daily_spending: number;
  projected_month_end: number;
  monthly_budget: number;
  projected_difference: number;
  status: 'on_track' | 'likely_overrun' | 'high_risk' | 'no_budget_set';
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  detected_pattern: string;
  impact_amount?: number;
  impact_percentage?: number;
  suggested_action: string;
  category?: string;
  status: 'active' | 'dismissed' | 'reviewed';
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'achievement';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface Achievement {
  id: number;
  badge_code: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface FinancialHealthComponent {
  name: string;
  score: number;
  max_score: number;
  description: string;
  status: string;
}

export interface FinancialHealth {
  overall_score: number;
  grade: string;
  summary: string;
  components: FinancialHealthComponent[];
  disclaimer: string;
}

export interface SpendingTrendItem {
  date: string;
  amount: number;
  transaction_count: number;
}

export interface CategoryDistributionItem {
  category_id?: number;
  category_name: string;
  color: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface BudgetVsActualItem {
  category_name: string;
  budgeted: number;
  actual: number;
  difference: number;
  utilization_percentage: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

export interface CalendarDayItem {
  date: string;
  day_number: number;
  total_amount: number;
  expense_count: number;
  level: number;
}

export interface DashboardData {
  period: {
    year: number;
    month: number;
    month_name: string;
    today: string;
  };
  financial_summary: {
    monthly_allowance: number;
    total_budget: number;
    total_expenses: number;
    remaining_budget: number;
    available_balance: number;
    utilization_percentage: number;
    reserved_commitments: number;
  };
  safe_to_spend: SafeToSpend;
  projection: OverspendingProjection;
  recent_transactions: Array<{
    id: number;
    description: string;
    amount: number;
    date: string;
    category_name: string;
    category_color: string;
    payment_method: string;
  }>;
  upcoming_expenses: Array<{
    id: number;
    title: string;
    amount: number;
    due_date: string;
    priority: string;
    category_name: string;
  }>;
  category_utilization: Array<{
    category_name: string;
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
  }>;
  insights: Array<{
    id: number;
    title: string;
    description: string;
    detected_pattern: string;
    suggested_action: string;
    impact_amount?: number;
    category?: string;
  }>;
}
