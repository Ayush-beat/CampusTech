from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User, UserSettings
from app.models.category import Category
from app.models.expense import Expense
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.planned_expense import PlannedExpense
from app.models.savings_goal import SavingsGoal, SavingsContribution
from app.models.recurring_expense import RecurringExpense
from app.models.notification import Notification
from app.models.achievement import Achievement
from app.core.security import get_password_hash
from app.services.insights import generate_insights_and_alerts

DEMO_USER_EMAIL = "demo.student@campustech.app"
DEMO_USER_PASSWORD = "Password@123"

def seed_demo_student(db: Session) -> User:
    """
    Creates or resets the synthetic demo student profile with realistic multi-month records.
    """
    # 1. Clean up existing demo user records if any
    for old_email in [DEMO_USER_EMAIL, "aarav.student@ledger.app", "aarav.student@campustech.app"]:
        old_user = db.query(User).filter(User.email == old_email).first()
        if old_user:
            db.delete(old_user)
            db.commit()

    # 2. Create Demo User
    demo_user = User(
        email=DEMO_USER_EMAIL,
        full_name="Aarav Sharma",
        hashed_password=get_password_hash(DEMO_USER_PASSWORD),
        college_name="Delhi Technological University (DTU)",
        student_id="2024-CS-042",
        currency="INR"
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    # 3. User Settings
    settings = UserSettings(
        user_id=demo_user.id,
        monthly_allowance=Decimal("18000.00"),
        safe_spend_buffer=Decimal("500.00"),
        alert_threshold_80=True,
        alert_threshold_100=True,
        currency_symbol="₹"
    )
    db.add(settings)

    # 4. Fetch Categories
    categories = {c.name: c for c in db.query(Category).all()}
    cat_food = categories.get("Food and Groceries")
    cat_travel = categories.get("Travel and Transportation")
    cat_edu = categories.get("Education and Stationery")
    cat_rent = categories.get("Accommodation and Rent")
    cat_ent = categories.get("Entertainment")
    cat_shop = categories.get("Shopping")
    cat_sub = categories.get("Subscriptions")
    cat_health = categories.get("Health and Personal Care")
    cat_events = categories.get("College Events and Projects")
    cat_misc = categories.get("Miscellaneous")

    today = date.today()
    curr_year = today.year
    curr_month = today.month

    # Calculate previous months
    m1_year = curr_year if curr_month > 1 else curr_year - 1
    m1_month = curr_month - 1 if curr_month > 1 else 12

    m2_year = m1_year if m1_month > 1 else m1_year - 1
    m2_month = m1_month - 1 if m1_month > 1 else 12

    # 5. Budgets for Current & Past Months
    months_to_budget = [
        (curr_year, curr_month, Decimal("15500.00")),
        (m1_year, m1_month, Decimal("15000.00")),
        (m2_year, m2_month, Decimal("14500.00"))
    ]

    for y, m, total_b in months_to_budget:
        mb = MonthlyBudget(
            user_id=demo_user.id,
            year=y,
            month=m,
            total_budget=total_b,
            total_allowance=Decimal("18000.00"),
            notes=f"Student budget for {date(y, m, 1).strftime('%B %Y')}"
        )
        db.add(mb)
        db.flush()

        cat_allocations = [
            (cat_food, Decimal("4800.00")),
            (cat_rent, Decimal("4500.00")),
            (cat_travel, Decimal("2000.00")),
            (cat_edu, Decimal("1800.00")),
            (cat_ent, Decimal("1000.00")),
            (cat_sub, Decimal("600.00")),
            (cat_health, Decimal("400.00")),
            (cat_misc, Decimal("400.00")),
        ]
        for c, alloc in cat_allocations:
            if c:
                cb = CategoryBudget(
                    monthly_budget_id=mb.id,
                    user_id=demo_user.id,
                    category_id=c.id,
                    allocated_amount=alloc
                )
                db.add(cb)

    # 6. Expenses across 3 months
    expenses_data = []

    # Current Month Expenses (Days 1 up to today)
    cur_days = min(today.day, 28)
    # Fixed monthly hostel contribution
    expenses_data.append((date(curr_year, curr_month, 1), Decimal("4500.00"), "Hostel & Utility Contribution", cat_rent, "Net Banking"))
    expenses_data.append((date(curr_year, curr_month, 2), Decimal("850.00"), "Semester Textbook: Computer Networks", cat_edu, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 3), Decimal("140.00"), "Canteen Thali & Chai", cat_food, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 4), Decimal("650.00"), "Monthly Metro SmartCard Recharge", cat_travel, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 5), Decimal("95.00"), "Chai & Samosa with Study Group", cat_food, "Cash"))
    expenses_data.append((date(curr_year, curr_month, 6), Decimal("59.00"), "Spotify Student Plan Subscription", cat_sub, "Debit Card"))
    expenses_data.append((date(curr_year, curr_month, 7), Decimal("180.00"), "Lab Notebooks & Gel Pens", cat_edu, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 8), Decimal("220.00"), "Cafeteria Lunch & Cold Coffee", cat_food, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 9), Decimal("450.00"), "Weekend Cinema Ticket", cat_ent, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 10), Decimal("110.00"), "Auto fare to Railway Station", cat_travel, "Cash"))
    expenses_data.append((date(curr_year, curr_month, 11), Decimal("320.00"), "Pharmacy: Multivitamins & Paracetamol", cat_health, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 12), Decimal("150.00"), "Campus Canteen Fried Rice", cat_food, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 13), Decimal("780.00"), "Arduino Nano & Sensor Modules for IoT Lab", cat_events, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 14), Decimal("280.00"), "Swiggy Late Night Study Snack", cat_food, "UPI"))
    expenses_data.append((date(curr_year, curr_month, 15), Decimal("85.00"), "Photocopy and Project Binding", cat_edu, "Cash"))

    # If today is past day 15, add more recent entries
    if cur_days > 15:
        for d in range(16, cur_days + 1):
            if d % 3 == 0:
                expenses_data.append((date(curr_year, curr_month, d), Decimal("160.00"), "Campus Canteen Lunch", cat_food, "UPI"))
            elif d % 3 == 1:
                expenses_data.append((date(curr_year, curr_month, d), Decimal("45.00"), "Bus Ticket to Tech Park", cat_travel, "UPI"))
            else:
                expenses_data.append((date(curr_year, curr_month, d), Decimal("80.00"), "Library Tea & Biscuits", cat_food, "Cash"))

    # Previous Month (m1) Realistic Expenses (Total ~₹14,200)
    expenses_data.extend([
        (date(m1_year, m1_month, 1), Decimal("4500.00"), "Hostel & Utility Contribution", cat_rent, "Net Banking"),
        (date(m1_year, m1_month, 2), Decimal("650.00"), "Monthly Metro SmartCard Recharge", cat_travel, "UPI"),
        (date(m1_year, m1_month, 3), Decimal("1250.00"), "Operating Systems Reference Textbook", cat_edu, "Debit Card"),
        (date(m1_year, m1_month, 5), Decimal("59.00"), "Spotify Student Plan Subscription", cat_sub, "Debit Card"),
        (date(m1_year, m1_month, 7), Decimal("420.00"), "Department Dinner with Classmates", cat_food, "UPI"),
        (date(m1_year, m1_month, 10), Decimal("350.00"), "Hackathon Registration Fee", cat_events, "UPI"),
        (date(m1_year, m1_month, 12), Decimal("180.00"), "Canteen Lunch & Juice", cat_food, "UPI"),
        (date(m1_year, m1_month, 15), Decimal("890.00"), "Pair of Campus Sports Shoes", cat_shop, "UPI"),
        (date(m1_year, m1_month, 18), Decimal("250.00"), "Haircut & Grooming", cat_health, "Cash"),
        (date(m1_year, m1_month, 20), Decimal("199.00"), "Mobile Recharge (Monthly Pack)", cat_sub, "UPI"),
        (date(m1_year, m1_month, 22), Decimal("380.00"), "Weekend Cafe with Friends", cat_food, "UPI"),
        (date(m1_year, m1_month, 25), Decimal("160.00"), "Late Night Maggi & Cold Drinks", cat_food, "Cash"),
    ])

    # Month 2 Ago (m2) Realistic Expenses (Total ~₹13,800)
    expenses_data.extend([
        (date(m2_year, m2_month, 1), Decimal("4500.00"), "Hostel & Utility Contribution", cat_rent, "Net Banking"),
        (date(m2_year, m2_month, 3), Decimal("650.00"), "Monthly Metro SmartCard Recharge", cat_travel, "UPI"),
        (date(m2_year, m2_month, 5), Decimal("59.00"), "Spotify Student Plan Subscription", cat_sub, "Debit Card"),
        (date(m2_year, m2_month, 8), Decimal("920.00"), "Algorithm Design by Kleinberg", cat_edu, "UPI"),
        (date(m2_year, m2_month, 12), Decimal("340.00"), "Weekend Movie Ticket", cat_ent, "UPI"),
        (date(m2_year, m2_month, 16), Decimal("210.00"), "Canteen Lunch & Snack", cat_food, "UPI"),
        (date(m2_year, m2_month, 20), Decimal("199.00"), "Mobile Recharge Pack", cat_sub, "UPI"),
        (date(m2_year, m2_month, 24), Decimal("420.00"), "Stationery & Drawing Board", cat_edu, "Cash"),
    ])

    for dt, amt, desc, cat, pay_method in expenses_data:
        exp = Expense(
            user_id=demo_user.id,
            category_id=cat.id if cat else None,
            amount=amt,
            description=desc,
            date=dt,
            payment_method=pay_method,
            is_recurring=(desc.startswith("Spotify") or desc.startswith("Hostel"))
        )
        db.add(exp)

    # 7. Planned Semester Expenses
    planned_items = [
        ("End-Semester Examination Fee", Decimal("2500.00"), today + timedelta(days=12), "high", cat_edu),
        ("Minor Project Prototype Hardware Kit", Decimal("1800.00"), today + timedelta(days=5), "high", cat_events),
        ("IEEE Student Chapter Annual Membership", Decimal("1100.00"), today + timedelta(days=25), "medium", cat_edu),
        ("Campus Placement Formal Attire Tailoring", Decimal("3200.00"), today + timedelta(days=40), "medium", cat_shop),
        ("Hostel Security Deposit Advance", Decimal("5000.00"), today + timedelta(days=60), "low", cat_rent),
    ]

    for title, amt, due, prio, cat in planned_items:
        pe = PlannedExpense(
            user_id=demo_user.id,
            title=title,
            amount=amt,
            due_date=due,
            priority=prio,
            category_id=cat.id if cat else None,
            status="pending"
        )
        db.add(pe)

    # 8. Savings Goals
    goal1 = SavingsGoal(
        user_id=demo_user.id,
        name="MacBook / M-Series Coding Laptop",
        target_amount=Decimal("68000.00"),
        current_amount=Decimal("26000.00"),
        target_date=today + timedelta(days=180),
        monthly_contribution=Decimal("3500.00"),
        category="Tech & Hardware"
    )
    db.add(goal1)
    db.flush()

    contrib1 = SavingsContribution(
        goal_id=goal1.id,
        user_id=demo_user.id,
        amount=Decimal("3500.00"),
        date=today - timedelta(days=15),
        notes="Monthly savings from freelancing stipend"
    )
    db.add(contrib1)

    goal2 = SavingsGoal(
        user_id=demo_user.id,
        name="AWS Certified Cloud Practitioner Exam",
        target_amount=Decimal("8500.00"),
        current_amount=Decimal("5500.00"),
        target_date=today + timedelta(days=45),
        monthly_contribution=Decimal("1500.00"),
        category="Certification"
    )
    db.add(goal2)

    # 9. Active Subscriptions
    subs = [
        ("Spotify Premium Student", Decimal("59.00"), "monthly", today + timedelta(days=18), cat_sub),
        ("Airtel 5G Unlimited Recharge", Decimal("299.00"), "monthly", today + timedelta(days=8), cat_sub),
        ("GitHub Student Developer Pack", Decimal("0.00"), "yearly", today + timedelta(days=120), cat_edu),
    ]
    for s_name, s_amt, s_freq, s_next, s_cat in subs:
        re_exp = RecurringExpense(
            user_id=demo_user.id,
            name=s_name,
            amount=s_amt,
            frequency=s_freq,
            next_due_date=s_next,
            category_id=s_cat.id if s_cat else None,
            is_active=True
        )
        db.add(re_exp)

    # 10. Achievements
    achievements = [
        ("first_step", "Financial Pioneer", "Joined CampusTech and took control of student finances.", "Award"),
        ("first_expense", "CampusTech Initiate", "Recorded your first student expense entry.", "CheckCircle"),
        ("budget_master", "Budget Strategist", "Configured an intentional monthly budget allocation.", "Compass"),
        ("semester_planner", "Academic Foresight", "Created your first semester planned commitment.", "GraduationCap"),
        ("goal_setter", "Future Builder", "Established your first student savings target.", "Target"),
    ]
    for b_code, b_name, b_desc, b_icon in achievements:
        db.add(Achievement(
            user_id=demo_user.id,
            badge_code=b_code,
            name=b_name,
            description=b_desc,
            icon=b_icon
        ))

    db.commit()

    # Trigger insights engine so recommendations are generated for Aarav
    generate_insights_and_alerts(db, demo_user.id, curr_year, curr_month)

    return demo_user
