from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class CategoryBase(BaseModel):
    name: str
    icon: Optional[str] = "Tag"
    color: Optional[str] = "#163D32"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    user_id: Optional[int] = None
    is_default: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Amount must be positive")
    description: str = Field(..., min_length=1, max_length=255)
    date: date
    category_id: Optional[int] = None
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None
    is_recurring: Optional[bool] = False
    planned_expense_id: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[date] = None
    category_id: Optional[int] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None

class ExpenseResponse(ExpenseBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class PaginatedExpensesResponse(BaseModel):
    total: int
    items: list[ExpenseResponse]
    page: int
    page_size: int
    total_amount: Decimal
