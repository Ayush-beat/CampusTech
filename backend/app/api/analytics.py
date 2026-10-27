from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
import calendar
from app.database import get_db
from app.models.user import User, UserSettings
from app.models.expense import Expense
from app.models.category import Category
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.planned_expense import PlannedExpense
from app.models.recurring_expense import RecurringExpense
from app.models.recommendation import Recommendation
from app.schemas.analytics import (
    SpendingTrendItem, CategoryDistributionItem, BudgetVsActualItem,
    SafeToSpendResponse, OverspendingProjectionResponse,
    WhatIfSimulationRequest, WhatIfSimulationResponse,
    CalendarDayItem, FinancialHealthResponse
)
from app.core.deps import get_current_user
from app.services.calculations import (
    round_currency, calculate_safe_to_spend, calculate_overspending_projection,
    calculate_financial_health_score, get_month_days
)
from app.services.insights import generate_insights_and_alerts

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])

@router.get("/dashboard")
def get_dashboard_summary(
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

    # Trigger insights engine update in the background for fresh recommendations
    generate_insights_and_alerts(db, current_user.id, year, month)

    # 1. Total spent this month
    spent_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).scalar()
    total_spent = round_currency(Decimal(str(spent_scalar)))

    # 2. Budget and Allowance
    budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).first()

    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    allowance = settings.monthly_allowance if settings and settings.monthly_allowance else Decimal("15000.00")
    
    if budget:
        total_budget = budget.total_budget
        if budget.total_allowance and budget.total_allowance > 0:
            allowance = budget.total_allowance
    else:
        total_budget = round_currency(allowance * Decimal("0.85"))

    remaining_budget = round_currency(total_budget - total_spent)
    utilization_pct = round_currency((total_spent / total_budget * Decimal("100.00"))) if total_budget > 0 else Decimal("0.00")
    
    # Distinguish remaining budget from available funds / balance
    available_balance = round_currency(allowance - total_spent)

    # 3. Safe to spend
    safe_data = calculate_safe_to_spend(db, current_user.id, today)

    # 4. Projected end of month
    projection = calculate_overspending_projection(db, current_user.id, year, month)

    # 5. Recent transactions (last 6)
    recent_expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).order_by(Expense.date.desc(), Expense.id.desc()).limit(6).all()

    recent_txs = [
        {
            "id": e.id,
            "description": e.description,
            "amount": e.amount,
            "date": e.date.isoformat(),
            "category_name": e.category.name if e.category else "Uncategorized",
            "category_color": e.category.color if e.category else "#163D32",
            "payment_method": e.payment_method
        }
        for e in recent_expenses
    ]

    # 6. Upcoming academic expenses (next 4)
    upcoming_planned = db.query(PlannedExpense).filter(
        PlannedExpense.user_id == current_user.id,
        PlannedExpense.status == "pending",
        PlannedExpense.due_date >= today
    ).order_by(PlannedExpense.due_date.asc()).limit(4).all()

    upcoming_list = [
        {
            "id": p.id,
            "title": p.title,
            "amount": p.amount,
            "due_date": p.due_date.isoformat(),
            "priority": p.priority,
            "category_name": p.category.name if p.category else "Academic"
        }
        for p in upcoming_planned
    ]

    # 7. Category Budget Utilization (Top 5 categories)
    cat_budgets = db.query(CategoryBudget).join(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).limit(5).all()

    cat_util_list = []
    for cb in cat_budgets:
        cat_spent_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == current_user.id,
            Expense.category_id == cb.category_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).scalar()
        c_spent = round_currency(Decimal(str(cat_spent_scalar)))
        c_alloc = cb.allocated_amount
        c_util = round_currency((c_spent / c_alloc * Decimal("100.00"))) if c_alloc > 0 else Decimal("0.00")
        cat_util_list.append({
            "category_name": cb.category.name if cb.category else "Category",
            "allocated": c_alloc,
            "spent": c_spent,
            "remaining": round_currency(c_alloc - c_spent),
            "utilization": c_util
        })

    # 8. Top 3 Smart Recommendations
    top_recs = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id,
        Recommendation.status == "active"
    ).order_by(Recommendation.created_at.desc()).limit(3).all()

    recs_list = [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "detected_pattern": r.detected_pattern,
            "suggested_action": r.suggested_action,
            "impact_amount": r.impact_amount,
            "category": r.category
        }
        for r in top_recs
    ]

    return {
        "period": {
            "year": year,
            "month": month,
            "month_name": date(year, month, 1).strftime("%B %Y"),
            "today": today.isoformat()
        },
        "financial_summary": {
            "monthly_allowance": allowance,
            "total_budget": total_budget,
            "total_expenses": total_spent,
            "remaining_budget": remaining_budget,
            "available_balance": available_balance,
            "utilization_percentage": utilization_pct,
            "reserved_commitments": safe_data["reserved_upcoming_commitments"]
        },
        "safe_to_spend": safe_data,
        "projection": projection,
        "recent_transactions": recent_txs,
        "upcoming_expenses": upcoming_list,
        "category_utilization": cat_util_list,
        "insights": recs_list
    }

@router.get("/trend", response_model=List[SpendingTrendItem])
def get_spending_trend(
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

    total_days = get_month_days(year, month)
    
    # Query daily aggregates
    daily_records = db.query(
        Expense.date,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).group_by(Expense.date).all()

    daily_map = {r.date: (round_currency(Decimal(str(r.total))), r.count) for r in daily_records}

    # Generate full sequence of days for the month so charts don't have broken gaps
    result = []
    # If viewing current month, only go up to today or whole month
    max_day = total_days
    for day in range(1, max_day + 1):
        cur_d = date(year, month, day)
        amount, count = daily_map.get(cur_d, (Decimal("0.00"), 0))
        result.append(
            SpendingTrendItem(
                date=cur_d.strftime("%d %b"),
                amount=amount,
                transaction_count=count
            )
        )

    return result

@router.get("/category-breakdown", response_model=List[CategoryDistributionItem])
def get_category_breakdown(
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

    # Query sum and count per category
    records = db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).group_by(Expense.category_id).all()

    total_spent = sum(Decimal(str(r.total)) for r in records) if records else Decimal("0.00")
    total_spent = round_currency(total_spent)

    categories_map = {c.id: c for c in db.query(Category).all()}

    results = []
    for r in records:
        cat = categories_map.get(r.category_id)
        amt = round_currency(Decimal(str(r.total)))
        pct = round_currency((amt / total_spent * Decimal("100.00"))) if total_spent > 0 else Decimal("0.00")
        results.append(
            CategoryDistributionItem(
                category_id=r.category_id,
                category_name=cat.name if cat else "Uncategorized",
                color=cat.color if cat else "#163D32",
                total_amount=amt,
                percentage=pct,
                transaction_count=r.count
            )
        )

    # Sort by amount descending
    results.sort(key=lambda x: x.total_amount, reverse=True)
    return results

@router.get("/budget-vs-actual", response_model=List[BudgetVsActualItem])
def get_budget_vs_actual(
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

    cat_budgets = db.query(CategoryBudget).join(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).all()

    categories_map = {c.id: c for c in db.query(Category).all()}
    results = []

    for cb in cat_budgets:
        cat = categories_map.get(cb.category_id)
        spent_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == current_user.id,
            Expense.category_id == cb.category_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).scalar()
        spent = round_currency(Decimal(str(spent_scalar)))
        allocated = cb.allocated_amount
        diff = round_currency(allocated - spent)
        util = round_currency((spent / allocated * Decimal("100.00"))) if allocated > 0 else Decimal("0.00")

        if util > Decimal("100.00"):
            status_str = "over_budget"
        elif util >= Decimal("80.00"):
            status_str = "warning"
        else:
            status_str = "on_track"

        results.append(
            BudgetVsActualItem(
                category_name=cat.name if cat else "Category",
                budgeted=allocated,
                actual=spent,
                difference=diff,
                utilization_percentage=util,
                status=status_str
            )
        )

    results.sort(key=lambda x: x.budgeted, reverse=True)
    return results

@router.get("/safe-to-spend", response_model=SafeToSpendResponse)
def get_safe_to_spend_metric(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = calculate_safe_to_spend(db, current_user.id)
    return SafeToSpendResponse(**data)

@router.get("/projection", response_model=OverspendingProjectionResponse)
def get_overspending_projection_metric(
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

    data = calculate_overspending_projection(db, current_user.id, year, month)
    return OverspendingProjectionResponse(**data)

@router.post("/what-if", response_model=WhatIfSimulationResponse)
def simulate_what_if_budget(
    request: WhatIfSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates adjusted category spending without altering real transactions or database state.
    """
    year = request.year
    month = request.month
    
    # 1. Get original budget
    budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).first()

    orig_total = budget.total_budget if budget else Decimal("15000.00")
    
    # Map proposed adjustments
    adjustments_map = {adj.category_id: round_currency(adj.proposed_budget) for adj in request.adjustments}

    # Current month's actual spend
    spent_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).scalar()
    total_spent = round_currency(Decimal(str(spent_scalar)))

    proj_data = calculate_overspending_projection(db, current_user.id, year, month)
    orig_proj_spend = proj_data["projected_month_end"]

    # Calculate simulated category breakdown
    categories = db.query(Category).all()
    categories_map = {c.id: c.name for c in categories}

    simulated_total = Decimal("0.00")
    category_breakdown = []

    for cb in (budget.category_budgets if budget else []):
        cat_name = categories_map.get(cb.category_id, "Category")
        orig_alloc = cb.allocated_amount
        sim_alloc = adjustments_map.get(cb.category_id, orig_alloc)
        simulated_total += sim_alloc

        category_breakdown.append({
            "category_id": cb.category_id,
            "category_name": cat_name,
            "original_budget": orig_alloc,
            "simulated_budget": sim_alloc,
            "delta": round_currency(sim_alloc - orig_alloc)
        })

    simulated_total = round_currency(simulated_total)
    budget_delta = round_currency(simulated_total - orig_total)
    
    # Potential monthly savings = original projected spend - simulated total if lower
    potential_savings = max(Decimal("0.00"), round_currency(orig_proj_spend - simulated_total))

    # Revised safe to spend daily
    total_days = get_month_days(year, month)
    days_rem = max(1, total_days - date.today().day + 1) if (year == date.today().year and month == date.today().month) else 1
    safe_data = calculate_safe_to_spend(db, current_user.id)
    rem_usable = simulated_total - total_spent
    revised_safe_daily = max(Decimal("0.00"), round_currency(rem_usable / Decimal(days_rem)))

    return WhatIfSimulationResponse(
        original_total_budget=orig_total,
        simulated_total_budget=simulated_total,
        budget_delta=budget_delta,
        original_projected_spend=orig_proj_spend,
        simulated_projected_savings=potential_savings,
        revised_safe_to_spend_daily=revised_safe_daily,
        category_breakdown=category_breakdown
    )

@router.get("/calendar", response_model=List[CalendarDayItem])
def get_spending_calendar(
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

    total_days = get_month_days(year, month)

    daily_sums = db.query(
        Expense.date,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).group_by(Expense.date).all()

    daily_map = {r.date: (round_currency(Decimal(str(r.total))), r.count) for r in daily_sums}

    results = []
    for day in range(1, total_days + 1):
        d = date(year, month, day)
        amt, count = daily_map.get(d, (Decimal("0.00"), 0))
        
        # Heatmap level calculation:
        # 0 = zero spend
        # 1 = light (< ₹300)
        # 2 = moderate (₹300 - ₹1000)
        # 3 = high (> ₹1000)
        if amt == Decimal("0.00"):
            level = 0
        elif amt <= Decimal("300.00"):
            level = 1
        elif amt <= Decimal("1000.00"):
            level = 2
        else:
            level = 3

        results.append(
            CalendarDayItem(
                date=d.isoformat(),
                day_number=day,
                total_amount=amt,
                expense_count=count,
                level=level
            )
        )

    return results

@router.get("/health", response_model=FinancialHealthResponse)
def get_financial_health(
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

    data = calculate_financial_health_score(db, current_user.id, year, month)
    return FinancialHealthResponse(**data)
