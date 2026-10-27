from datetime import date, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.expense import Expense
from app.models.category import Category
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.recurring_expense import RecurringExpense
from app.models.planned_expense import PlannedExpense
from app.models.user import UserSettings
from app.models.recommendation import Recommendation
from app.models.notification import Notification
from app.services.calculations import round_currency, calculate_overspending_projection

def generate_insights_and_alerts(
    db: Session,
    user_id: int,
    year: int,
    month: int
) -> List[Recommendation]:
    """
    Evaluates student financial records and produces explainable recommendations.
    Does not use black-box ML; relies on deterministic rules and transparent arithmetic.
    """
    new_recommendations = []
    
    # Existing active recommendations to avoid duplicate spam
    existing_titles = set(
        r.title for r in db.query(Recommendation).filter(
            Recommendation.user_id == user_id,
            Recommendation.status == "active"
        ).all()
    )

    # 1. Category Pace & Month-over-Month Comparison
    prev_year = year if month > 1 else year - 1
    prev_month = month - 1 if month > 1 else 12

    current_cat_spent = db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month
    ).group_by(Expense.category_id).all()

    prev_cat_spent = dict(db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == prev_year,
        extract('month', Expense.date) == prev_month
    ).group_by(Expense.category_id).all())

    categories_map = {c.id: c.name for c in db.query(Category).all()}

    for cat_id, curr_total in current_cat_spent:
        if not cat_id or cat_id not in categories_map:
            continue
        cat_name = categories_map[cat_id]
        curr_val = round_currency(Decimal(str(curr_total)))
        prev_val = round_currency(Decimal(str(prev_cat_spent.get(cat_id, 0))))

        if prev_val > Decimal("200.00"):
            percent_change = round_currency(((curr_val - prev_val) / prev_val) * Decimal("100.00"))
            if percent_change >= Decimal("20.00"):
                title = f"{cat_name} spending surge (+{percent_change:.0f}%)"
                if title not in existing_titles:
                    diff_amount = curr_val - prev_val
                    rec = Recommendation(
                        user_id=user_id,
                        title=title,
                        description=f"Your {cat_name.lower()} expenditure is {percent_change:.0f}% higher than last month.",
                        detected_pattern=f"Recorded ₹{curr_val:,.2f} this month compared to ₹{prev_val:,.2f} last month.",
                        impact_amount=diff_amount,
                        impact_percentage=percent_change,
                        suggested_action=f"Review recent transactions in {cat_name} to check for non-essential or frequent discretionary charges.",
                        category=cat_name,
                        status="active"
                    )
                    db.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

    # 2. Category Budget Utilization Alerts (80% and 100%)
    cat_budgets = db.query(CategoryBudget).join(MonthlyBudget).filter(
        MonthlyBudget.user_id == user_id,
        MonthlyBudget.year == year,
        MonthlyBudget.month == month
    ).all()

    for cb in cat_budgets:
        cat_name = categories_map.get(cb.category_id, "Category")
        spent_in_cat_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            Expense.category_id == cb.category_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).scalar()
        cat_spent = round_currency(Decimal(str(spent_in_cat_query)))
        allocated = cb.allocated_amount

        if allocated > Decimal("0.00"):
            utilization = round_currency((cat_spent / allocated) * Decimal("100.00"))
            if utilization >= Decimal("100.00"):
                title = f"Exceeded {cat_name} budget limit"
                if title not in existing_titles:
                    over_amount = cat_spent - allocated
                    rec = Recommendation(
                        user_id=user_id,
                        title=title,
                        description=f"You have used 100% of your allocated {cat_name} budget.",
                        detected_pattern=f"Spent ₹{cat_spent:,.2f} against a limit of ₹{allocated:,.2f} ({utilization:.0f}%).",
                        impact_amount=over_amount,
                        impact_percentage=utilization,
                        suggested_action=f"Pause non-urgent spending in {cat_name} or reallocate funds from an underutilized category.",
                        category=cat_name,
                        status="active"
                    )
                    db.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

                    # Trigger alert notification
                    alert = Notification(
                        user_id=user_id,
                        title=f"Budget Exceeded: {cat_name}",
                        message=f"You have spent ₹{cat_spent:,.2f} out of your ₹{allocated:,.2f} budget for {cat_name}.",
                        type="alert",
                        link="/budgets"
                    )
                    db.add(alert)

            elif utilization >= Decimal("80.00"):
                title = f"{cat_name} nearing limit ({utilization:.0f}%)"
                if title not in existing_titles:
                    remaining = allocated - cat_spent
                    rec = Recommendation(
                        user_id=user_id,
                        title=title,
                        description=f"{cat_name} budget is at {utilization:.0f}% capacity.",
                        detected_pattern=f"₹{cat_spent:,.2f} of ₹{allocated:,.2f} used with ₹{remaining:,.2f} remaining.",
                        impact_amount=remaining,
                        impact_percentage=utilization,
                        suggested_action=f"Pace out your {cat_name.lower()} expenses over the remaining days of the month.",
                        category=cat_name,
                        status="active"
                    )
                    db.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

    # 3. Frequent Small Purchases Pattern
    small_txs = db.query(Expense).filter(
        Expense.user_id == user_id,
        extract('year', Expense.date) == year,
        extract('month', Expense.date) == month,
        Expense.amount <= Decimal("250.00")
    ).all()

    if len(small_txs) >= 8:
        small_total = round_currency(sum(Decimal(str(e.amount)) for e in small_txs))
        title = "Cumulative impact of frequent small expenses"
        if title not in existing_titles and small_total >= Decimal("1500.00"):
            rec = Recommendation(
                user_id=user_id,
                title=title,
                description=f"You made {len(small_txs)} micro-transactions (under ₹250), totaling ₹{small_total:,.2f}.",
                detected_pattern=f"{len(small_txs)} cafeteria, snack, or quick purchases adding up to a substantial portion of your monthly spend.",
                impact_amount=small_total,
                impact_percentage=None,
                suggested_action="Try setting a weekly cash or UPI allowance for snacks to prevent micro-leaks.",
                category="Food and Groceries",
                status="active"
            )
            db.add(rec)
            new_recommendations.append(rec)
            existing_titles.add(title)

    # 4. Subscription Creep Evaluation
    subscriptions = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == user_id,
        RecurringExpense.is_active == True
    ).all()

    if subscriptions:
        sub_monthly_total = Decimal("0.00")
        for s in subscriptions:
            amt = Decimal(str(s.amount))
            if s.frequency == "monthly":
                sub_monthly_total += amt
            elif s.frequency == "yearly":
                sub_monthly_total += amt / Decimal(12)
            elif s.frequency == "quarterly":
                sub_monthly_total += amt / Decimal(3)
            elif s.frequency == "weekly":
                sub_monthly_total += amt * Decimal(4)

        sub_monthly_total = round_currency(sub_monthly_total)
        settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        allowance = settings.monthly_allowance if settings and settings.monthly_allowance else Decimal("15000.00")
        
        sub_pct = round_currency((sub_monthly_total / allowance) * Decimal("100.00"))
        if sub_pct >= Decimal("12.00"):
            title = f"Subscription overhead: {sub_pct:.0f}% of monthly funds"
            if title not in existing_titles:
                rec = Recommendation(
                    user_id=user_id,
                    title=title,
                    description=f"Active recurring commitments total ₹{sub_monthly_total:,.2f}/month.",
                    detected_pattern=f"{len(subscriptions)} active subscriptions consume {sub_pct:.0f}% of your monthly allowance.",
                    impact_amount=sub_monthly_total,
                    impact_percentage=sub_pct,
                    suggested_action="Review your active subscriptions in the Subscriptions tab. Consider sharing family plans or pausing unused services.",
                    category="Subscriptions",
                    status="active"
                )
                db.add(rec)
                new_recommendations.append(rec)
                existing_titles.add(title)

    # 5. Overspending Projection Check
    projection = calculate_overspending_projection(db, user_id, year, month)
    if projection["status"] in ["likely_overrun", "high_risk"]:
        title = "Pacing warning: Projected month-end budget overrun"
        if title not in existing_titles:
            overrun = abs(projection["projected_difference"])
            rec = Recommendation(
                user_id=user_id,
                title=title,
                description=f"Current daily spending rate indicates a potential overrun of ₹{overrun:,.2f}.",
                detected_pattern=projection["explanation"],
                impact_amount=overrun,
                impact_percentage=None,
                suggested_action="Use the What-If Simulator to calibrate discretionary spending for the remaining days.",
                category="General",
                status="active"
            )
            db.add(rec)
            new_recommendations.append(rec)
            existing_titles.add(title)

    # 6. Upcoming Semester Commitments Check (Due within 7 days)
    upcoming_commitments = db.query(PlannedExpense).filter(
        PlannedExpense.user_id == user_id,
        PlannedExpense.status == "pending",
        PlannedExpense.due_date >= date.today(),
        PlannedExpense.due_date <= date.today() + timedelta(days=7)
    ).all()

    for item in upcoming_commitments:
        alert_title = f"Upcoming Due Date: {item.title}"
        existing_alert = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.title == alert_title
        ).first()
        if not existing_alert:
            notification = Notification(
                user_id=user_id,
                title=alert_title,
                message=f"₹{item.amount:,.2f} is due on {item.due_date.strftime('%b %d, %Y')} ({item.priority.upper()} priority).",
                type="warning",
                link="/semester-planner"
            )
            db.add(notification)

    db.commit()
    
    # Return all active recommendations for this user
    return db.query(Recommendation).filter(
        Recommendation.user_id == user_id,
        Recommendation.status == "active"
    ).order_by(Recommendation.created_at.desc()).all()
