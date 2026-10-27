from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class SpendingTrendItem(BaseModel):
    date: str
    amount: Decimal
    transaction_count: int

class CategoryDistributionItem(BaseModel):
    category_id: Optional[int]
    category_name: str
    color: str
    total_amount: Decimal
    percentage: Decimal
    transaction_count: int

class BudgetVsActualItem(BaseModel):
    category_name: str
    budgeted: Decimal
    actual: Decimal
    difference: Decimal
    utilization_percentage: Decimal
    status: str  # on_track, warning, over_budget

class SafeToSpendResponse(BaseModel):
    safe_to_spend_daily: Decimal
    remaining_usable_funds: Decimal
    reserved_upcoming_commitments: Decimal
    total_allowance: Decimal
    total_spent_mtd: Decimal
    days_remaining: int
    total_days_in_month: int
    is_negative_warning: bool
    explanation: str

class OverspendingProjectionResponse(BaseModel):
    month_to_date_spending: Decimal
    elapsed_days: int
    total_days: int
    average_daily_spending: Decimal
    projected_month_end: Decimal
    monthly_budget: Decimal
    projected_difference: Decimal  # positive = surplus, negative = overrun
    status: str  # on_track, likely_overrun, high_risk
    confidence: str  # low, medium, high
    explanation: str

class WhatIfCategoryAdjustment(BaseModel):
    category_id: int
    proposed_budget: Decimal

class WhatIfSimulationRequest(BaseModel):
    year: int
    month: int
    adjustments: List[WhatIfCategoryAdjustment]

class WhatIfSimulationResponse(BaseModel):
    original_total_budget: Decimal
    simulated_total_budget: Decimal
    budget_delta: Decimal
    original_projected_spend: Decimal
    simulated_projected_savings: Decimal
    revised_safe_to_spend_daily: Decimal
    category_breakdown: List[dict]

class CalendarDayItem(BaseModel):
    date: str
    day_number: int
    total_amount: Decimal
    expense_count: int
    level: int # 0=no spending, 1=light, 2=medium, 3=heavy

class FinancialHealthComponent(BaseModel):
    name: str
    score: int
    max_score: int
    description: str
    status: str

class FinancialHealthResponse(BaseModel):
    overall_score: int  # 0 to 100
    grade: str          # Excellent, Strong, Moderate, Needs Attention
    summary: str
    components: List[FinancialHealthComponent]
    disclaimer: str

class RecommendationResponse(BaseModel):
    id: int
    title: str
    description: str
    detected_pattern: str
    impact_amount: Optional[Decimal]
    impact_percentage: Optional[Decimal]
    suggested_action: str
    category: Optional[str]
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class AchievementResponse(BaseModel):
    id: int
    badge_code: str
    name: str
    description: str
    icon: str
    unlocked_at: Optional[datetime]

    class Config:
        from_attributes = True
