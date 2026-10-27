import calendar
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.user import User, UserSettings
from app.models.expense import Expense
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.planned_expense import PlannedExpense
from app.models.savings_goal import SavingsGoal

def round_currency(val: Decimal) -> Decimal:
    """Rounds a decimal value to 2 decimal places using standard financial round half up."""
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def get_month_days(year: int, month: int) -> int:
    """Returns exact number of days in the specified year and month."""
    _, num_days = calendar.monthrange(year, month)
    return num_days

def calculate_safe_to_spend(
    db: Session,
    user_id: int,
    target_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Computes Safe-to-Spend per day using formula:
    (Remaining usable funds - Reserved upcoming commitments) / Days remaining
    """
    if target_date is None:
        target_date = date.today()
        
    year = target_date.year
    month = target_date.month
    total_days = get_month_days(year, month)
    
    # Days remaining including today
    if target_date.year == date.today().year and target_date.month == date.today().month:
        elapsed_days = max(1, target_date.day)
        days_remaining = max(1, total_days - target_date.day + 1)
    else:
        # If looking at another month
        elapsed_days = total_days
        days_remaining = 1

    # 1. Monthly Allowance / Usable Funds
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    allowance = Decimal("0.00")
    if user_settings and user_settings.monthly_allowance:
        allowance = user_settings.monthly_allowance

    # If monthly budget exists and has total_allowance, prioritize budget's allowance if set
    monthly_budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user_id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).first()

    if monthly_budget and monthly_budget.total_allowance and monthly_budget.total_allowance > 0:
        allowance = monthly_budget.total_allowance

    # 2. Month-to-date recorded spending
    total_spent_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month,
        Expense.date <= target_date
    ).scalar()
    
    total_spent_mtd = round_currency(Decimal(str(total_spent_query)))

    # Remaining usable funds
    remaining_usable_funds = round_currency(allowance - total_spent_mtd)

    # 3. Reserved upcoming commitments (Pending planned expenses in the same month)
    reserved_commitments_query = db.query(func.coalesce(func.sum(PlannedExpense.amount), 0)).filter(
        PlannedExpense.user_id == user_id,
        PlannedExpense.status == "pending",
        extract('year', PlannedExpense.due_date) == year,
        extract('month', PlannedExpense.due_date) == month,
        PlannedExpense.due_date >= target_date
    ).scalar()

    reserved_commitments = round_currency(Decimal(str(reserved_commitments_query)))

    # Available pool for daily spend
    net_available = remaining_usable_funds - reserved_commitments
    
    is_negative = net_available < Decimal("0.00")
    
    if is_negative or days_remaining <= 0:
        daily_safe = Decimal("0.00")
    else:
        daily_safe = round_currency(net_available / Decimal(days_remaining))

    explanation = (
        f"Based on ₹{allowance:,.2f} monthly allowance, minus ₹{total_spent_mtd:,.2f} spent so far "
        f"and ₹{reserved_commitments:,.2f} reserved for pending commitments, you have "
        f"₹{net_available:,.2f} across {days_remaining} remaining days."
    )

    return {
        "safe_to_spend_daily": daily_safe,
        "remaining_usable_funds": remaining_usable_funds,
        "reserved_upcoming_commitments": reserved_commitments,
        "total_allowance": allowance,
        "total_spent_mtd": total_spent_mtd,
        "days_remaining": days_remaining,
        "total_days_in_month": total_days,
        "is_negative_warning": is_negative,
        "explanation": explanation
    }

def calculate_overspending_projection(
    db: Session,
    user_id: int,
    year: int,
    month: int,
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Computes Projected Month-End Spending using formula:
    Projected = (Month-to-date spending / Elapsed days) * Total days in month
    """
    total_days = get_month_days(year, month)
    today = date.today()
    
    if reference_date is None:
        reference_date = today

    if year == today.year and month == today.month:
        elapsed_days = max(1, min(reference_date.day, total_days))
    else:
        elapsed_days = total_days

    # 1. Total spent in this month up to reference date
    spent_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month,
        Expense.date <= reference_date
    ).scalar()
    
    spent_mtd = round_currency(Decimal(str(spent_query)))
    
    # 2. Daily average
    daily_avg = round_currency(spent_mtd / Decimal(elapsed_days))
    
    # 3. Projected month-end
    projected = round_currency(daily_avg * Decimal(total_days))

    # 4. Monthly budget
    budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user_id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).first()
    
    budget_amount = round_currency(budget.total_budget) if budget else Decimal("0.00")
    diff = round_currency(budget_amount - projected)

    # 5. Status & Confidence
    if elapsed_days < 5:
        confidence = "low"
    elif elapsed_days < 15:
        confidence = "medium"
    else:
        confidence = "high"

    if budget_amount == Decimal("0.00"):
        status = "no_budget_set"
    elif projected <= budget_amount:
        status = "on_track"
    elif projected <= budget_amount * Decimal("1.10"):
        status = "likely_overrun"
    else:
        status = "high_risk"

    explanation = (
        f"At your current average pace of ₹{daily_avg:,.2f}/day across {elapsed_days} elapsed days, "
        f"projected month-end spending is ₹{projected:,.2f} against a budget of ₹{budget_amount:,.2f}."
    )

    return {
        "month_to_date_spending": spent_mtd,
        "elapsed_days": elapsed_days,
        "total_days": total_days,
        "average_daily_spending": daily_avg,
        "projected_month_end": projected,
        "monthly_budget": budget_amount,
        "projected_difference": diff,
        "status": status,
        "confidence": confidence,
        "explanation": explanation
    }

def calculate_financial_health_score(
    db: Session,
    user_id: int,
    year: int,
    month: int
) -> Dict[str, Any]:
    """
    Computes transparent 0-100 Financial Health Indicator:
    - Budget Adherence (35 pts)
    - Tracking Consistency (25 pts)
    - Savings Goal Engagement (20 pts)
    - Profile & Setup Completeness (20 pts)
    """
    components = []
    
    # 1. Budget Adherence (max 35)
    budget = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user_id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).first()
    
    spent_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).scalar()
    spent = round_currency(Decimal(str(spent_query)))
    
    if not budget or budget.total_budget == Decimal("0.00"):
        budget_score = 15
        budget_desc = "No budget configured for this month. Set spending limits to track adherence."
        budget_status = "warning"
    else:
        total_budget = budget.total_budget
        if spent <= total_budget:
            budget_score = 35
            budget_desc = f"Well within planned budget (₹{spent:,.2f} of ₹{total_budget:,.2f})."
            budget_status = "good"
        elif spent <= total_budget * Decimal("1.15"):
            budget_score = 22
            budget_desc = f"Slightly exceeded budget by {((spent/total_budget - 1)*100):.1f}%."
            budget_status = "warning"
        else:
            budget_score = 10
            budget_desc = f"Significantly exceeded monthly budget allocation."
            budget_status = "alert"
            
    components.append({
        "name": "Budget Adherence",
        "score": budget_score,
        "max_score": 35,
        "description": budget_desc,
        "status": budget_status
    })

    # 2. Tracking Consistency (max 25)
    distinct_days = db.query(func.count(func.distinct(Expense.date))).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).scalar() or 0
    
    if distinct_days >= 15:
        tracking_score = 25
        tracking_desc = f"Excellent consistency: expenses logged across {distinct_days} distinct days."
        tracking_status = "good"
    elif distinct_days >= 7:
        tracking_score = 18
        tracking_desc = f"Good tracking: active on {distinct_days} days this month."
        tracking_status = "good"
    elif distinct_days >= 2:
        tracking_score = 12
        tracking_desc = f"Logged on {distinct_days} days. Log daily for more accurate insights."
        tracking_status = "warning"
    else:
        tracking_score = 5
        tracking_desc = "Few expenses logged this month."
        tracking_status = "alert"
        
    components.append({
        "name": "Tracking Consistency",
        "score": tracking_score,
        "max_score": 25,
        "description": tracking_desc,
        "status": tracking_status
    })

    # 3. Savings Goal Engagement (max 20)
    goals_count = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).count()
    if goals_count > 0:
        funded_goals = db.query(SavingsGoal).filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.current_amount > 0
        ).count()
        if funded_goals > 0:
            savings_score = 20
            savings_desc = f"Actively saving towards {goals_count} academic and personal goals."
            savings_status = "good"
        else:
            savings_score = 12
            savings_desc = f"{goals_count} savings goals established. Start contributing to make progress."
            savings_status = "warning"
    else:
        savings_score = 6
        savings_desc = "No active savings goals. Create a goal to plan future purchases."
        savings_status = "warning"
        
    components.append({
        "name": "Savings & Goal Planning",
        "score": savings_score,
        "max_score": 20,
        "description": savings_desc,
        "status": savings_status
    })

    # 4. Financial Setup & Completeness (max 20)
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    planned_count = db.query(PlannedExpense).filter(PlannedExpense.user_id == user_id).count()
    setup_score = 0
    
    if settings and settings.monthly_allowance and settings.monthly_allowance > 0:
        setup_score += 10
    if planned_count > 0:
        setup_score += 10
        
    if setup_score == 20:
        setup_desc = "Complete profile with monthly allowance and semester commitments."
        setup_status = "good"
    elif setup_score >= 10:
        setup_desc = "Partially configured financial profile."
        setup_status = "warning"
    else:
        setup_desc = "Set your monthly allowance and upcoming academic commitments for full analysis."
        setup_status = "alert"
        
    components.append({
        "name": "Profile & Setup Completeness",
        "score": setup_score,
        "max_score": 20,
        "description": setup_desc,
        "status": setup_status
    })

    total_score = sum(c["score"] for c in components)
    
    if total_score >= 80:
        grade = "Excellent"
        summary = "Your financial habits show strong discipline, proactive planning, and consistent tracking."
    elif total_score >= 65:
        grade = "Strong"
        summary = "You maintain steady financial awareness with minor room to improve category budgeting."
    elif total_score >= 45:
        grade = "Moderate"
        summary = "Good start on expense tracking. Establish structured category budgets to improve visibility."
    else:
        grade = "Needs Attention"
        summary = "Configure your monthly funds and log regular expenses to unlock actionable insights."

    disclaimer = (
        "This score is a transparent measure of budgeting engagement and record completeness. "
        "It is not a credit score, risk rating, or evaluation of personal worth."
    )

    return {
        "overall_score": total_score,
        "grade": grade,
        "summary": summary,
        "components": components,
        "disclaimer": disclaimer
    }
