from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models.user import User, UserSettings
from app.models.expense import Expense
from app.models.category import Category
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.planned_expense import PlannedExpense
from app.models.recommendation import Recommendation
from app.core.deps import get_current_user
from app.services.export_service import generate_expenses_csv
from app.services.calculations import round_currency, calculate_safe_to_spend

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/csv")
def export_csv(
    year: Optional[int] = None,
    month: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csv_data = generate_expenses_csv(
        db=db,
        user_id=current_user.id,
        year=year,
        month=month,
        category_id=category_id
    )

    filename = f"campustech_expenses_{year or 'all'}_{month or 'all'}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/summary")
def get_report_summary(
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

    # 1. Total spent
    spent_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).scalar()
    total_spent = round_currency(Decimal(str(spent_scalar)))

    # 2. Budget
    budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == current_user.id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).first()

    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    allowance = settings.monthly_allowance if settings and settings.monthly_allowance else Decimal("15000.00")
    total_budget = budget.total_budget if budget else round_currency(allowance * Decimal("0.85"))
    remaining_budget = round_currency(total_budget - total_spent)

    # 3. Category Breakdown
    cat_records = db.query(
        Category.name,
        Category.color,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).join(Expense, Expense.category_id == Category.id).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).group_by(Category.name, Category.color).order_by(func.sum(Expense.amount).desc()).all()

    categories_list = [
        {
            "name": r.name,
            "color": r.color,
            "amount": round_currency(Decimal(str(r.total))),
            "count": r.count,
            "percentage": round_currency((Decimal(str(r.total)) / total_spent * Decimal("100.00"))) if total_spent > 0 else Decimal("0.00")
        }
        for r in cat_records
    ]

    # 4. Safe to spend
    safe_data = calculate_safe_to_spend(db, current_user.id, today)

    # 5. Pending commitments
    pending_planned = db.query(PlannedExpense).filter(
        PlannedExpense.user_id == current_user.id,
        PlannedExpense.status == "pending",
        extract('year', PlannedExpense.due_date) == year,
        extract('month', PlannedExpense.due_date) == month
    ).all()

    commitments_list = [
        {
            "title": p.title,
            "amount": p.amount,
            "due_date": p.due_date.isoformat(),
            "priority": p.priority
        }
        for p in pending_planned
    ]

    return {
        "report_title": f"Student Financial Statement — {date(year, month, 1).strftime('%B %Y')}",
        "generated_on": today.isoformat(),
        "user_profile": {
            "name": current_user.full_name,
            "email": current_user.email,
            "college": current_user.college_name,
            "student_id": current_user.student_id,
            "currency": current_user.currency
        },
        "financial_overview": {
            "monthly_allowance": allowance,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "remaining_budget": remaining_budget,
            "utilization_percentage": round_currency((total_spent / total_budget * Decimal("100.00"))) if total_budget > 0 else Decimal("0.00"),
            "safe_to_spend_daily": safe_data["safe_to_spend_daily"]
        },
        "categories": categories_list,
        "upcoming_commitments": commitments_list
    }
