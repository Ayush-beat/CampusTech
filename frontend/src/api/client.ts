const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes(':5173')
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:8000/api');

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('campustech_token') || localStorage.getItem('ledger_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        localStorage.removeItem('campustech_token');
        localStorage.removeItem('campustech_user');
        localStorage.removeItem('ledger_token');
        localStorage.removeItem('ledger_user');
        window.dispatchEvent(new Event('auth_change'));
        throw new Error('Session expired or unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth
  register(data: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  login(data: any) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  quickDemoLogin() {
    return this.request<any>('/seed/quick-demo-login', {
      method: 'POST',
    });
  }

  logout() {
    return this.request<any>('/auth/logout', {
      method: 'POST',
    }).catch(() => ({}));
  }

  resetDemoData() {
    return this.request<any>('/seed/demo', {
      method: 'POST',
    });
  }

  getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  updateSettings(data: any) {
    return this.request<any>('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Expenses
  getCategories() {
    return this.request<any[]>('/expenses/categories');
  }

  createCategory(data: any) {
    return this.request<any>('/expenses/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getExpenses(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return this.request<any>(`/expenses?${query.toString()}`);
  }

  createExpense(data: any) {
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateExpense(id: number, data: any) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteExpense(id: number) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Budgets
  getBudget(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any>(`/budgets?${query.toString()}`);
  }

  saveBudget(data: any) {
    return this.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getBudgetOverview(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any>(`/budgets/overview?${query.toString()}`);
  }

  getBudgetHistory() {
    return this.request<any[]>('/budgets/history');
  }

  // Analytics
  getDashboard(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any>(`/analytics/dashboard?${query.toString()}`);
  }

  getSpendingTrend(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any[]>(`/analytics/trend?${query.toString()}`);
  }

  getCategoryBreakdown(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any[]>(`/analytics/category-breakdown?${query.toString()}`);
  }

  getBudgetVsActual(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any[]>(`/analytics/budget-vs-actual?${query.toString()}`);
  }

  getSafeToSpend() {
    return this.request<any>('/analytics/safe-to-spend');
  }

  getProjection(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any>(`/analytics/projection?${query.toString()}`);
  }

  simulateWhatIf(data: any) {
    return this.request<any>('/analytics/what-if', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getCalendar(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any[]>(`/analytics/calendar?${query.toString()}`);
  }

  getFinancialHealth(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any>(`/analytics/health?${query.toString()}`);
  }

  // Semester Planning
  getPlannedExpenses(status?: string) {
    const query = status ? `?status_filter=${status}` : '';
    return this.request<any[]>(`/planning/semester${query}`);
  }

  createPlannedExpense(data: any) {
    return this.request<any>('/planning/semester', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updatePlannedExpense(id: number, data: any) {
    return this.request<any>(`/planning/semester/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  markPlannedExpensePaid(id: number) {
    return this.request<any>(`/planning/semester/${id}/pay`, {
      method: 'POST',
    });
  }

  deletePlannedExpense(id: number) {
    return this.request<any>(`/planning/semester/${id}`, {
      method: 'DELETE',
    });
  }

  // Savings Goals
  getSavingsGoals() {
    return this.request<any[]>('/planning/savings-goals');
  }

  createSavingsGoal(data: any) {
    return this.request<any>('/planning/savings-goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  contributeToGoal(id: number, data: any) {
    return this.request<any>(`/planning/savings-goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteSavingsGoal(id: number) {
    return this.request<any>(`/planning/savings-goals/${id}`, {
      method: 'DELETE',
    });
  }

  // Subscriptions
  getSubscriptions() {
    return this.request<any[]>('/planning/subscriptions');
  }

  createSubscription(data: any) {
    return this.request<any>('/planning/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteSubscription(id: number) {
    return this.request<any>(`/planning/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  // Insights & Alerts
  getRecommendations(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any[]>(`/insights?${query.toString()}`);
  }

  updateRecommendationStatus(id: number, status: 'reviewed' | 'dismissed') {
    return this.request<any>(`/insights/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  getNotifications() {
    return this.request<any[]>('/insights/notifications');
  }

  markNotificationRead(id: number) {
    return this.request<any>(`/insights/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  getAchievements() {
    return this.request<any[]>('/insights/achievements');
  }

  // Assistant & NLP
  askAssistant(query: string, year?: number, month?: number) {
    return this.request<any>('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ query, year, month }),
    });
  }

  parseNLPExpense(input_text: string) {
    return this.request<any>('/assistant/parse-nlp', {
      method: 'POST',
      body: JSON.stringify({ input_text }),
    });
  }

  // Reports
  getReportSummary(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return this.request<any>(`/reports/summary?${query.toString()}`);
  }

  getCSVDownloadUrl(year?: number, month?: number, category_id?: number) {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    if (category_id) query.append('category_id', String(category_id));
    return `${API_BASE_URL}/reports/csv?${query.toString()}`;
  }
}

export const api = new ApiClient();
