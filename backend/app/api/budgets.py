from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models.user import User, UserSettings
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.category import Category
from app.models.expense import Expense
from app.models.achievement import Achievement
from app.schemas.budget import (
    MonthlyBudgetCreate, MonthlyBudgetUpdate, MonthlyBudgetResponse,
    CategoryBudgetResponse, BudgetOverview
)
from app.core.deps import get_current_user
from app.services.calculations import round_currency, calculate_safe_to_spend

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=MonthlyBudgetResponse)
def get_monthly_budget(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month = today.month

    budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).first()

    # If no budget exists yet for this month, initialize a default one based on user settings
    if not budget:
        settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        allowance = settings.monthly_allowance if settings and settings.monthly_allowance else Decimal("15000.00")
        total_budget = round_currency(allowance * Decimal("0.85")) # default 85% of allowance as budget
        
        budget = MonthlyBudget(
            user_id=current_user.id,
            year=year,
            month=month,
            total_budget=total_budget,
            total_allowance=allowance,
            notes=f"Budget for {date(year, month, 1).strftime('%B %Y')}"
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)

        # Pre-seed default category budgets across common categories
        categories = db.query(Category).filter(
            (Category.user_id == None) | (Category.user_id == current_user.id)
        ).all()

        default_weights = {
            "Food and Groceries": Decimal("0.30"),
            "Travel and Transportation": Decimal("0.15"),
            "Education and Stationery": Decimal("0.15"),
            "Accommodation and Rent": Decimal("0.20"),
            "Entertainment": Decimal("0.08"),
            "Subscriptions": Decimal("0.04"),
            "Health and Personal Care": Decimal("0.04"),
            "Miscellaneous": Decimal("0.04"),
        }

        for cat in categories:
            weight = default_weights.get(cat.name, Decimal("0.05"))
            cb = CategoryBudget(
                monthly_budget_id=budget.id,
                user_id=current_user.id,
                category_id=cat.id,
                allocated_amount=round_currency(total_budget * weight)
            )
            db.add(cb)
        db.commit()
        db.refresh(budget)

    # Calculate actual spending per category
    cat_budgets_response = []
    total_spent = Decimal("0.00")

    for cb in budget.category_budgets:
        spent_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == current_user.id,
            Expense.category_id == cb.category_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).scalar()
        spent = round_currency(Decimal(str(spent_scalar)))
        remaining = round_currency(cb.allocated_amount - spent)
        utilization = round_currency((spent / cb.allocated_amount * Decimal("100.00"))) if cb.allocated_amount > 0 else Decimal("0.00")
        total_spent += spent

        cat_budgets_response.append(
            CategoryBudgetResponse(
                id=cb.id,
                monthly_budget_id=cb.monthly_budget_id,
                category_id=cb.category_id,
                allocated_amount=cb.allocated_amount,
                category=cb.category,
                spent_amount=spent,
                remaining_amount=remaining,
                utilization_percentage=utilization
            )
        )

    # Sort categories by allocated amount descending
    cat_budgets_response.sort(key=lambda x: x.allocated_amount, reverse=True)

    rem_budget = round_currency(budget.total_budget - total_spent)
    overall_util = round_currency((total_spent / budget.total_budget * Decimal("100.00"))) if budget.total_budget > 0 else Decimal("0.00")

    return MonthlyBudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        year=budget.year,
        month=budget.month,
        total_budget=budget.total_budget,
        total_allowance=budget.total_allowance or Decimal("0.00"),
        notes=budget.notes,
        created_at=budget.created_at,
        category_budgets=cat_budgets_response,
        total_spent=total_spent,
        remaining_budget=rem_budget,
        overall_utilization=overall_util
    )

@router.post("", response_model=MonthlyBudgetResponse)
def save_monthly_budget(
    budget_in: MonthlyBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate non-negative numbers
    if budget_in.total_budget < 0 or (budget_in.total_allowance and budget_in.total_allowance < 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget limit and monthly allowance must be non-negative."
        )

    for cb in (budget_in.category_budgets or []):
        if cb.allocated_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category allocation cannot be negative."
            )

    budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.year == budget_in.year,
        MonthlyBudget.month == budget_in.month
    ).first()

    if not budget:
        budget = MonthlyBudget(
            user_id=current_user.id,
            year=budget_in.year,
            month=budget_in.month,
            total_budget=round_currency(budget_in.total_budget),
            total_allowance=round_currency(budget_in.total_allowance or Decimal("0.00")),
            notes=budget_in.notes
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
    else:
        budget.total_budget = round_currency(budget_in.total_budget)
        if budget_in.total_allowance is not None:
            budget.total_allowance = round_currency(budget_in.total_allowance)
        if budget_in.notes is not None:
            budget.notes = budget_in.notes

    # Update or add category budgets
    if budget_in.category_budgets:
        for cb_in in budget_in.category_budgets:
            existing_cb = db.query(CategoryBudget).filter(
                CategoryBudget.monthly_budget_id == budget.id,
                CategoryBudget.category_id == cb_in.category_id
            ).first()
            if existing_cb:
                existing_cb.allocated_amount = round_currency(cb_in.allocated_amount)
            else:
                new_cb = CategoryBudget(
                    monthly_budget_id=budget.id,
                    user_id=current_user.id,
                    category_id=cb_in.category_id,
                    allocated_amount=round_currency(cb_in.allocated_amount)
                )
                db.add(new_cb)

    # Award budget creator achievement if first time
    achieve = db.query(Achievement).filter(
        Achievement.user_id == current_user.id,
        Achievement.badge_code == "budget_master"
    ).first()
    if not achieve:
        db.add(Achievement(
            user_id=current_user.id,
            badge_code="budget_master",
            name="Budget Strategist",
            description="Configured an intentional monthly budget allocation.",
            icon="Compass"
        ))

    db.commit()
    db.refresh(budget)
    return get_monthly_budget(year=budget.year, month=budget.month, db=db, current_user=current_user)

@router.get("/overview", response_model=BudgetOverview)
def get_budget_overview(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month = today.month

    budget_resp = get_monthly_budget(year=year, month=month, db=db, current_user=current_user)
    safe_data = calculate_safe_to_spend(db, current_user.id, today)

    util = budget_resp.overall_utilization or Decimal("0.00")
    if util >= Decimal("100.00"):
        status_code = "exceeded"
    elif util >= Decimal("80.00"):
        status_code = "warning"
    else:
        status_code = "healthy"

    return BudgetOverview(
        year=year,
        month=month,
        monthly_allowance=budget_resp.total_allowance,
        total_budget=budget_resp.total_budget,
        total_expenses=budget_resp.total_spent or Decimal("0.00"),
        remaining_budget=budget_resp.remaining_budget or Decimal("0.00"),
        utilization_percentage=util,
        reserved_commitments=safe_data["reserved_upcoming_commitments"],
        safe_to_spend_daily=safe_data["safe_to_spend_daily"],
        status=status_code
    )

@router.get("/history")
def get_budget_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(6, ge=1, le=12)
):
    budgets = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id
    ).order_by(MonthlyBudget.year.desc(), MonthlyBudget.month.desc()).limit(limit).all()

    results = []
    for b in reversed(budgets):
        spent_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == current_user.id,
            extract('year', Expense.date) == b.year,
            extract('month', Expense.date) == b.month
        ).scalar()
        spent = round_currency(Decimal(str(spent_scalar)))
        util = round_currency((spent / b.total_budget * Decimal("100.00"))) if b.total_budget > 0 else Decimal("0.00")
        month_label = date(b.year, b.month, 1).strftime("%b %Y")

        results.append({
            "year": b.year,
            "month": b.month,
            "label": month_label,
            "budget": b.total_budget,
            "spent": spent,
            "utilization": util,
            "savings": round_currency(b.total_budget - spent)
        })

    return results
