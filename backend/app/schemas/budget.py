from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.expense import CategoryResponse

class CategoryBudgetBase(BaseModel):
    category_id: int
    allocated_amount: Decimal = Field(..., ge=0)

class CategoryBudgetCreate(CategoryBudgetBase):
    pass

class CategoryBudgetResponse(CategoryBudgetBase):
    id: int
    monthly_budget_id: int
    category: Optional[CategoryResponse] = None
    spent_amount: Optional[Decimal] = Decimal("0.00")
    remaining_amount: Optional[Decimal] = Decimal("0.00")
    utilization_percentage: Optional[Decimal] = Decimal("0.00")

    class Config:
        from_attributes = True

class MonthlyBudgetBase(BaseModel):
    year: int
    month: int = Field(..., ge=1, le=12)
    total_budget: Decimal = Field(..., ge=0)
    total_allowance: Optional[Decimal] = Decimal("0.00")
    notes: Optional[str] = None

class MonthlyBudgetCreate(MonthlyBudgetBase):
    category_budgets: Optional[List[CategoryBudgetBase]] = []

class MonthlyBudgetUpdate(BaseModel):
    total_budget: Optional[Decimal] = None
    total_allowance: Optional[Decimal] = None
    notes: Optional[str] = None
    category_budgets: Optional[List[CategoryBudgetBase]] = None

class MonthlyBudgetResponse(MonthlyBudgetBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    category_budgets: List[CategoryBudgetResponse] = []
    total_spent: Optional[Decimal] = Decimal("0.00")
    remaining_budget: Optional[Decimal] = Decimal("0.00")
    overall_utilization: Optional[Decimal] = Decimal("0.00")

    class Config:
        from_attributes = True

class BudgetOverview(BaseModel):
    year: int
    month: int
    monthly_allowance: Decimal
    total_budget: Decimal
    total_expenses: Decimal
    remaining_budget: Decimal
    utilization_percentage: Decimal
    reserved_commitments: Decimal
    safe_to_spend_daily: Decimal
    status: str # "healthy", "warning", "exceeded"
