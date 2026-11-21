import re
from datetime import date
from decimal import Decimal
from typing import Dict, Any, List, Optional
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
