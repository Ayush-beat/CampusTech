import re
from datetime import date
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from app.models.expense import Expense
from app.models.category import Category
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.planned_expense import PlannedExpense
from app.services.calculations import (
    round_currency, calculate_safe_to_spend, calculate_overspending_projection
)

def answer_financial_query(
    db: Session,
    user_id: int,
    query_text: str,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> Dict[str, Any]:
    """
    Deterministic analytical question answering engine over authenticated student financial records.
    Distinguishes facts (historical transactions) from estimates (projections, safe-to-spend).
    """
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month = today.month

    q = query_text.lower().strip()
    facts = []
    is_prediction = False
    suggested = [
        "How much did I spend on food this month?",
        "What is my safe to spend today?",
        "Compare my spending with last month",
        "What are my upcoming planned expenses?",
        "Which category has the highest spending?"
    ]

    # 1. Safe to spend query
    if any(k in q for k in ["safe to spend", "daily budget", "how much can i spend", "daily allowance"]):
        res = calculate_safe_to_spend(db, user_id, today)
        daily = res["safe_to_spend_daily"]
        remaining = res["remaining_usable_funds"]
        reserved = res["reserved_upcoming_commitments"]
        days = res["days_remaining"]
        is_prediction = True

        facts.append({"label": "Daily Safe-to-Spend", "value": f"₹{daily:,.2f}"})
        facts.append({"label": "Remaining Usable Funds", "value": f"₹{remaining:,.2f}"})
        facts.append({"label": "Reserved Commitments", "value": f"₹{reserved:,.2f}"})
        facts.append({"label": "Days Remaining", "value": str(days)})

        if res["is_negative_warning"]:
            answer = (
                f"Caution: Your reserved upcoming commitments (₹{reserved:,.2f}) exceed your remaining usable funds "
                f"(₹{remaining:,.2f}). We recommend reducing discretionary spending to cover commitments."
            )
        else:
            answer = (
                f"Your estimated safe-to-spend allowance is ₹{daily:,.2f} per day for the remaining {days} days of the month. "
                f"This reserves ₹{reserved:,.2f} for upcoming commitments and assumes you maintain your planned pace."
            )

        return {
            "query": query_text,
            "answer": answer,
            "facts": facts,
            "is_prediction": True,
            "suggested_followups": [
                "What are my upcoming planned expenses?",
                "Will I exceed my budget this month?",
                "How much did I spend on food this month?"
            ]
        }

    # 2. Upcoming planned expenses
    if any(k in q for k in ["upcoming", "planned", "due", "fees", "commitments", "semester plan"]):
        upcoming = db.query(PlannedExpense).filter(
            PlannedExpense.user_id == user_id,
            PlannedExpense.status == "pending",
            PlannedExpense.due_date >= today
        ).order_by(PlannedExpense.due_date.asc()).limit(5).all()

        if not upcoming:
            answer = "You have no pending planned expenses recorded for upcoming dates."
        else:
            total_up = round_currency(sum(Decimal(str(p.amount)) for p in upcoming))
            facts.append({"label": "Pending Commitments Count", "value": str(len(upcoming))})
            facts.append({"label": "Total Upcoming Amount", "value": f"₹{total_up:,.2f}"})
            items_str = ", ".join([f"{p.title} (₹{p.amount:,.2f} on {p.due_date.strftime('%b %d')})" for p in upcoming])
            answer = f"You have {len(upcoming)} upcoming commitments totaling ₹{total_up:,.2f}: {items_str}."

        return {
            "query": query_text,
            "answer": answer,
            "facts": facts,
            "is_prediction": False,
            "suggested_followups": [
                "What is my safe to spend today?",
                "How much budget remains for education?"
            ]
        }

    # 3. Overspending / End-of-month projection
    if any(k in q for k in ["overspend", "projected", "month end", "exceed", "forecast"]):
        proj = calculate_overspending_projection(db, user_id, year, month)
        is_prediction = True
        facts.append({"label": "Projected Month-End", "value": f"₹{proj['projected_month_end']:,.2f}"})
        facts.append({"label": "Configured Budget", "value": f"₹{proj['monthly_budget']:,.2f}"})
        diff = proj["projected_difference"]
        facts.append({"label": "Projected Difference", "value": f"{'+' if diff >= 0 else '-'}₹{abs(diff):,.2f}"})
        facts.append({"label": "Confidence Level", "value": proj["confidence"].capitalize()})

        if proj["status"] in ["likely_overrun", "high_risk"]:
            answer = (
                f"Prediction: Based on your current pace of ₹{proj['average_daily_spending']:,.2f}/day across {proj['elapsed_days']} elapsed days, "
                f"you are projected to spend ₹{proj['projected_month_end']:,.2f}, exceeding your ₹{proj['monthly_budget']:,.2f} budget by ₹{abs(diff):,.2f}."
            )
        else:
            answer = (
                f"Prediction: You are currently on track! Projected month-end spending is ₹{proj['projected_month_end']:,.2f}, "
                f"which leaves a projected surplus of ₹{diff:,.2f} against your ₹{proj['monthly_budget']:,.2f} budget."
            )

        return {
            "query": query_text,
            "answer": answer,
            "facts": facts,
            "is_prediction": True,
            "suggested_followups": [
                "What is my safe to spend today?",
                "Which category has the highest spending?"
            ]
        }

    # 4. Specific Category Spending or Remaining Budget
    categories = db.query(Category).all()
    matched_cat = None
    for c in categories:
        if c.name.lower() in q or c.name.lower().split()[0] in q:
            matched_cat = c
            break

    if matched_cat:
        # Category spending in current month
        spent_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            Expense.category_id == matched_cat.id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).scalar()
        spent = round_currency(Decimal(str(spent_query)))
        tx_count = db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.category_id == matched_cat.id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).count()

        # Category budget
        cb = db.query(CategoryBudget).join(MonthlyBudget).filter(
            MonthlyBudget.user_id == user_id,
            MonthlyBudget.year == year,
            MonthlyBudget.month == month,
            CategoryBudget.category_id == matched_cat.id
        ).first()

        facts.append({"label": f"{matched_cat.name} Total Spent", "value": f"₹{spent:,.2f}"})
        facts.append({"label": "Transactions Count", "value": str(tx_count)})

        if cb and cb.allocated_amount > Decimal("0.00"):
            remaining = cb.allocated_amount - spent
            util = round_currency((spent / cb.allocated_amount) * Decimal("100.00"))
            facts.append({"label": "Allocated Budget", "value": f"₹{cb.allocated_amount:,.2f}"})
            facts.append({"label": "Remaining Budget", "value": f"₹{remaining:,.2f}"})
            facts.append({"label": "Utilization", "value": f"{util:.1f}%"})
            
            if "remain" in q or "left" in q:
                answer = f"You have ₹{remaining:,.2f} remaining out of your ₹{cb.allocated_amount:,.2f} budget for {matched_cat.name} ({util:.0f}% utilized)."
            else:
                answer = f"You have recorded ₹{spent:,.2f} across {tx_count} transactions for {matched_cat.name} this month. Your budget utilization is {util:.0f}% with ₹{remaining:,.2f} remaining."
        else:
            answer = f"You have spent ₹{spent:,.2f} across {tx_count} transactions on {matched_cat.name} this month. (No specific category budget configured)."

        return {
            "query": query_text,
            "answer": answer,
            "facts": facts,
            "is_prediction": False,
            "suggested_followups": [
                f"Compare {matched_cat.name} with last month",
                "What is my highest expense this month?",
                "What is my safe to spend today?"
            ]
        }

    # 5. Month-over-month comparison
    if any(k in q for k in ["compare", "last month", "increase", "change"]):
        prev_year = year if month > 1 else year - 1
        prev_month = month - 1 if month > 1 else 12

        curr_total_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).scalar()
        curr_total = round_currency(Decimal(str(curr_total_query)))

        prev_total_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            extract('year', Expense.date) == prev_year,
            extract('month', Expense.date) == prev_month
        ).scalar()
        prev_total = round_currency(Decimal(str(prev_total_query)))

        facts.append({"label": "This Month Total", "value": f"₹{curr_total:,.2f}"})
        facts.append({"label": "Last Month Total", "value": f"₹{prev_total:,.2f}"})

        diff = curr_total - prev_total
        if prev_total > 0:
            pct = round_currency((diff / prev_total) * Decimal("100.00"))
            facts.append({"label": "Net Change", "value": f"{'+' if diff >= 0 else ''}{pct:.1f}%"})
            if diff >= 0:
                answer = f"Your spending this month (₹{curr_total:,.2f}) is ₹{diff:,.2f} (+{pct:.1f}%) higher than last month's total of ₹{prev_total:,.2f}."
            else:
                answer = f"Your spending this month (₹{curr_total:,.2f}) is ₹{abs(diff):,.2f} ({pct:.1f}%) lower than last month's total of ₹{prev_total:,.2f}."
        else:
            answer = f"This month's recorded expenditure is ₹{curr_total:,.2f}."

        return {
            "query": query_text,
            "answer": answer,
            "facts": facts,
            "is_prediction": False,
            "suggested_followups": [
                "Which category has the highest spending?",
                "What is my safe to spend today?"
            ]
        }

    # 6. Highest category or largest expense
    if any(k in q for k in ["highest", "largest", "maximum", "most expensive", "top category"]):
        top_cat = db.query(
            Category.name,
            func.sum(Expense.amount).label("total")
        ).join(Expense, Expense.category_id == Category.id).filter(
            Expense.user_id == user_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).group_by(Category.name).order_by(desc("total")).first()

        top_exp = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).order_by(Expense.amount.desc()).first()

        if top_cat:
            facts.append({"label": "Highest Category", "value": f"{top_cat[0]} (₹{top_cat[1]:,.2f})"})
        if top_exp:
            facts.append({"label": "Largest Single Expense", "value": f"{top_exp.description} (₹{top_exp.amount:,.2f})"})

        if top_cat and top_exp:
            answer = f"Your highest spending category this month is {top_cat[0]} with ₹{top_cat[1]:,.2f}. Your largest single recorded expense was '{top_exp.description}' for ₹{top_exp.amount:,.2f} on {top_exp.date.strftime('%b %d')}."
        else:
            answer = "Not enough transactions recorded in the current period to determine top expenses."

        return {
            "query": query_text,
            "answer": answer,
            "facts": facts,
            "is_prediction": False,
            "suggested_followups": [
                "How much did I spend on food this month?",
                "What is my safe to spend today?"
            ]
        }

    # Default fallback: overall month summary
    curr_total_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).scalar()
    curr_total = round_currency(Decimal(str(curr_total_query)))
    tx_count = db.query(Expense).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).count()

    facts.append({"label": "Current Month Total", "value": f"₹{curr_total:,.2f}"})
    facts.append({"label": "Total Transactions", "value": str(tx_count)})
    
    answer = f"You have recorded {tx_count} transactions totaling ₹{curr_total:,.2f} for this month. You can ask for category breakdowns, safe-to-spend limits, upcoming fees, or month-over-month comparisons."

    return {
        "query": query_text,
        "answer": answer,
        "facts": facts,
        "is_prediction": False,
        "suggested_followups": suggested
    }
