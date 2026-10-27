from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from app.schemas.expense import CategoryResponse

# Planned Expenses (Academic & Semester commitments)
class PlannedExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category_id: Optional[int] = None
    amount: Decimal = Field(..., gt=0)
    due_date: date
    priority: Optional[str] = "medium"  # low, medium, high
    status: Optional[str] = "pending"   # pending, paid, cancelled

class PlannedExpenseCreate(PlannedExpenseBase):
    pass

class PlannedExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[int] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class PlannedExpenseResponse(PlannedExpenseBase):
    id: int
    user_id: int
    linked_expense_id: Optional[int] = None
    created_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

# Savings Goals
class SavingsContributionBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    date: date
    notes: Optional[str] = None

class SavingsContributionCreate(SavingsContributionBase):
    pass

class SavingsContributionResponse(SavingsContributionBase):
    id: int
    goal_id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SavingsGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., gt=0)
    target_date: date
    monthly_contribution: Optional[Decimal] = Decimal("0.00")
    category: Optional[str] = "Education"

class SavingsGoalCreate(SavingsGoalBase):
    current_amount: Optional[Decimal] = Decimal("0.00")

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = Field(None, gt=0)
    current_amount: Optional[Decimal] = Field(None, ge=0)
    target_date: Optional[date] = None
    monthly_contribution: Optional[Decimal] = Field(None, ge=0)
    category: Optional[str] = None
    is_achieved: Optional[bool] = None

class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_id: int
    current_amount: Decimal
    is_achieved: bool
    created_at: Optional[datetime] = None
    contributions: Optional[List[SavingsContributionResponse]] = []
    progress_percentage: Optional[Decimal] = Decimal("0.00")
    months_remaining: Optional[int] = 0

    class Config:
        from_attributes = True

# Recurring Expenses (Subscriptions)
class RecurringExpenseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category_id: Optional[int] = None
    amount: Decimal = Field(..., gt=0)
    frequency: Optional[str] = "monthly"  # weekly, monthly, quarterly, yearly
    next_due_date: date
    is_active: Optional[bool] = True
    notes: Optional[str] = None

class RecurringExpenseCreate(RecurringExpenseBase):
    pass

class RecurringExpenseUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    frequency: Optional[str] = None
    next_due_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class RecurringExpenseResponse(RecurringExpenseBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None
    monthly_cost_equivalent: Optional[Decimal] = Decimal("0.00")
    annual_cost_equivalent: Optional[Decimal] = Decimal("0.00")

    class Config:
        from_attributes = True
