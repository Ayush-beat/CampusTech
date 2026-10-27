from datetime import date
from decimal import Decimal
from app.models.user import User, UserSettings
from app.models.expense import Expense
from app.models.budget import MonthlyBudget
from app.models.planned_expense import PlannedExpense
from app.core.security import get_password_hash
from app.services.calculations import (
    calculate_safe_to_spend,
    calculate_overspending_projection,
    calculate_financial_health_score,
    get_month_days
)

def test_month_days_calculation():
    # February 2024 is leap year (29 days)
    assert get_month_days(2024, 2) == 29
    # February 2025 is not leap year (28 days)
    assert get_month_days(2025, 2) == 28
    # October is 31 days
    assert get_month_days(2026, 10) == 31

def test_safe_to_spend_and_overrun(db_session):
    # 1. Create a student user
    user = User(
        email="test_calc@student.com",
        full_name="Test Student",
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user)
    db_session.commit()

    settings = UserSettings(
        user_id=user.id,
        monthly_allowance=Decimal("15000.00")
    )
    db_session.add(settings)

    # 2. Add Monthly Budget for 2026-10 (₹12,000)
    budget = MonthlyBudget(
        user_id=user.id,
        year=2026,
        month=10,
        total_budget=Decimal("12000.00"),
        total_allowance=Decimal("15000.00")
    )
    db_session.add(budget)

    # 3. Add Expense of ₹3,000 on Oct 10
    exp = Expense(
        user_id=user.id,
        amount=Decimal("3000.00"),
        description="Textbooks",
        date=date(2026, 10, 10)
    )
    db_session.add(exp)

    # 4. Add Planned commitment of ₹2,000 due on Oct 25
    planned = PlannedExpense(
        user_id=user.id,
        title="Exam Registration",
        amount=Decimal("2000.00"),
        due_date=date(2026, 10, 25),
        status="pending"
    )
    db_session.add(planned)
    db_session.commit()

    # 5. Evaluate Safe-to-Spend on Oct 10
    # Usable: 15,000 - 3,000 = 12,000
    # Reserved: 2,000
    # Net: 10,000
    # Days in Oct: 31. If target_date is Oct 10:
    # Days remaining: 31 - 10 + 1 = 22 days
    # Safe to spend: 10,000 / 22 = ₹454.55
    res = calculate_safe_to_spend(db_session, user.id, target_date=date(2026, 10, 10))
    assert res["remaining_usable_funds"] == Decimal("12000.00")
    assert res["reserved_upcoming_commitments"] == Decimal("2000.00")
    assert res["is_negative_warning"] is False

    # 6. Evaluate Overspending projection
    # Elapsed days: 10
    # Spent: 3,000
    # Daily average: 300
    # Projected: 300 * 31 = ₹9,300
    # Budget: 12,000 -> on track!
    proj = calculate_overspending_projection(db_session, user.id, 2026, 10, reference_date=date(2026, 10, 10))
    assert proj["month_to_date_spending"] == Decimal("3000.00")
    assert proj["average_daily_spending"] == Decimal("300.00")
    assert proj["projected_month_end"] == Decimal("9300.00")
    assert proj["status"] == "on_track"
    assert proj["projected_difference"] == Decimal("2700.00")

def test_financial_health_score(db_session):
    user = User(
        email="test_health@student.com",
        full_name="Health Student",
        hashed_password=get_password_hash("password123")
    )
    db_session.add(user)
    db_session.commit()

    health = calculate_financial_health_score(db_session, user.id, 2026, 10)
    assert "overall_score" in health
    assert "grade" in health
    assert len(health["components"]) == 4
    assert health["overall_score"] >= 0 and health["overall_score"] <= 100
