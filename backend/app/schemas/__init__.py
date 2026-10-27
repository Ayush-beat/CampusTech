from app.schemas.auth import (
    UserRegister, UserLogin, UserResponse, Token, TokenData,
    UserSettingsResponse, UserSettingsUpdate
)
from app.schemas.expense import (
    CategoryBase, CategoryCreate, CategoryResponse,
    ExpenseBase, ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    PaginatedExpensesResponse
)
from app.schemas.budget import (
    CategoryBudgetBase, CategoryBudgetCreate, CategoryBudgetResponse,
    MonthlyBudgetBase, MonthlyBudgetCreate, MonthlyBudgetUpdate,
    MonthlyBudgetResponse, BudgetOverview
)
from app.schemas.planning import (
    PlannedExpenseCreate, PlannedExpenseUpdate, PlannedExpenseResponse,
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse,
    SavingsContributionCreate, SavingsContributionResponse,
    RecurringExpenseCreate, RecurringExpenseUpdate, RecurringExpenseResponse
)
from app.schemas.analytics import (
    SpendingTrendItem, CategoryDistributionItem, BudgetVsActualItem,
    SafeToSpendResponse, OverspendingProjectionResponse,
    WhatIfSimulationRequest, WhatIfSimulationResponse,
    CalendarDayItem, FinancialHealthResponse, RecommendationResponse,
    NotificationResponse, AchievementResponse
)
from app.schemas.assistant import (
    AssistantQueryRequest, AssistantQueryResponse,
    NaturalLanguageExpenseRequest, NaturalLanguageExpenseResponse
)
