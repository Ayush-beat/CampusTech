from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models.user import User
from app.models.planned_expense import PlannedExpense
from app.models.savings_goal import SavingsGoal, SavingsContribution
from app.models.recurring_expense import RecurringExpense
from app.models.expense import Expense
from app.models.achievement import Achievement
from app.schemas.planning import (
    PlannedExpenseCreate, PlannedExpenseUpdate, PlannedExpenseResponse,
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse,
    SavingsContributionCreate, SavingsContributionResponse,
    RecurringExpenseCreate, RecurringExpenseUpdate, RecurringExpenseResponse
)
from app.core.deps import get_current_user
from app.services.calculations import round_currency

router = APIRouter(prefix="/planning", tags=["Semester Planning & Goals"])

# --- SEMESTER PLANNED EXPENSES ---

@router.get("/semester", response_model=List[PlannedExpenseResponse])
def get_planned_expenses(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PlannedExpense).filter(PlannedExpense.user_id == current_user.id)
    if status_filter:
        query = query.filter(PlannedExpense.status == status_filter)
    return query.order_by(PlannedExpense.due_date.asc()).all()

@router.post("/semester", response_model=PlannedExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_planned_expense(
    plan_in: PlannedExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    planned = PlannedExpense(
        user_id=current_user.id,
        title=plan_in.title.strip(),
        category_id=plan_in.category_id,
        amount=round_currency(plan_in.amount),
        due_date=plan_in.due_date,
        priority=plan_in.priority or "medium",
        status="pending"
    )
    db.add(planned)

    # Award Semester Planner achievement
    achieve = db.query(Achievement).filter(
        Achievement.user_id == current_user.id,
        Achievement.badge_code == "semester_planner"
    ).first()
    if not achieve:
        db.add(Achievement(
            user_id=current_user.id,
            badge_code="semester_planner",
            name="Academic Foresight",
            description="Created your first semester planned commitment.",
            icon="GraduationCap"
        ))

    db.commit()
    db.refresh(planned)
    return planned

@router.put("/semester/{plan_id}", response_model=PlannedExpenseResponse)
def update_planned_expense(
    plan_id: int,
    plan_in: PlannedExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    planned = db.query(PlannedExpense).filter(
        PlannedExpense.id == plan_id,
        PlannedExpense.user_id == current_user.id
    ).first()
    if not planned:
        raise HTTPException(status_code=404, detail="Planned expense not found")

    if plan_in.title is not None:
        planned.title = plan_in.title.strip()
    if plan_in.category_id is not None:
        planned.category_id = plan_in.category_id
    if plan_in.amount is not None:
        planned.amount = round_currency(plan_in.amount)
    if plan_in.due_date is not None:
        planned.due_date = plan_in.due_date
    if plan_in.priority is not None:
        planned.priority = plan_in.priority
    if plan_in.status is not None:
        planned.status = plan_in.status

    db.commit()
    db.refresh(planned)
    return planned

@router.post("/semester/{plan_id}/pay", response_model=PlannedExpenseResponse)
def mark_planned_expense_paid(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks a planned expense as paid and automatically creates a linked expense transaction,
    preventing double-counting in calculations.
    """
    planned = db.query(PlannedExpense).filter(
        PlannedExpense.id == plan_id,
        PlannedExpense.user_id == current_user.id
    ).first()
    if not planned:
        raise HTTPException(status_code=404, detail="Planned expense not found")

    if planned.status == "paid":
        return planned

    # Create linked Expense transaction
    expense = Expense(
        user_id=current_user.id,
        category_id=planned.category_id,
        amount=planned.amount,
        description=f"Paid: {planned.title}",
        date=date.today(),
        payment_method="UPI",
        notes=f"Linked to planned commitment #{planned.id}",
        planned_expense_id=planned.id
    )
    db.add(expense)
    db.flush()

    planned.status = "paid"
    planned.linked_expense_id = expense.id

    db.commit()
    db.refresh(planned)
    return planned

@router.delete("/semester/{plan_id}", status_code=status.HTTP_200_OK)
def delete_planned_expense(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    planned = db.query(PlannedExpense).filter(
        PlannedExpense.id == plan_id,
        PlannedExpense.user_id == current_user.id
    ).first()
    if not planned:
        raise HTTPException(status_code=404, detail="Planned expense not found")
    db.delete(planned)
    db.commit()
    return {"message": "Planned expense deleted successfully"}

# --- SAVINGS GOALS ---

@router.get("/savings-goals", response_model=List[SavingsGoalResponse])
def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id
    ).order_by(SavingsGoal.target_date.asc()).all()

    today = date.today()
    results = []
    for g in goals:
        pct = round_currency((g.current_amount / g.target_amount * Decimal("100.00"))) if g.target_amount > 0 else Decimal("0.00")
        pct = min(Decimal("100.00"), pct)
        months_left = max(0, (g.target_date.year - today.year) * 12 + (g.target_date.month - today.month))
        
        results.append(
            SavingsGoalResponse(
                id=g.id,
                user_id=g.user_id,
                name=g.name,
                target_amount=g.target_amount,
                current_amount=g.current_amount,
                target_date=g.target_date,
                monthly_contribution=g.monthly_contribution,
                category=g.category,
                is_achieved=g.is_achieved or (g.current_amount >= g.target_amount),
                created_at=g.created_at,
                contributions=g.contributions,
                progress_percentage=pct,
                months_remaining=months_left
            )
        )
    return results

@router.post("/savings-goals", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_in.name.strip(),
        target_amount=round_currency(goal_in.target_amount),
        current_amount=round_currency(goal_in.current_amount or Decimal("0.00")),
        target_date=goal_in.target_date,
        monthly_contribution=round_currency(goal_in.monthly_contribution or Decimal("0.00")),
        category=goal_in.category or "Education"
    )
    db.add(goal)

    # Award savings achievement
    achieve = db.query(Achievement).filter(
        Achievement.user_id == current_user.id,
        Achievement.badge_code == "goal_setter"
    ).first()
    if not achieve:
        db.add(Achievement(
            user_id=current_user.id,
            badge_code="goal_setter",
            name="Future Builder",
            description="Established your first student savings target.",
            icon="Target"
        ))

    db.commit()
    db.refresh(goal)
    return get_savings_goals(db=db, current_user=current_user)[-1]

@router.post("/savings-goals/{goal_id}/contribute", response_model=SavingsGoalResponse)
def add_savings_contribution(
    goal_id: int,
    contrib_in: SavingsContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    amt = round_currency(contrib_in.amount)
    contrib = SavingsContribution(
        goal_id=goal.id,
        user_id=current_user.id,
        amount=amt,
        date=contrib_in.date,
        notes=contrib_in.notes
    )
    db.add(contrib)
    goal.current_amount = round_currency(goal.current_amount + amt)
    if goal.current_amount >= goal.target_amount:
        goal.is_achieved = True

    db.commit()
    db.refresh(goal)
    
    # Return formatted goal
    for g in get_savings_goals(db=db, current_user=current_user):
        if g.id == goal_id:
            return g
    return goal

@router.delete("/savings-goals/{goal_id}", status_code=status.HTTP_200_OK)
def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Savings goal deleted successfully"}

# --- SUBSCRIPTION TRACKER ---

@router.get("/subscriptions", response_model=List[RecurringExpenseResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subs = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == current_user.id
    ).order_by(RecurringExpense.next_due_date.asc()).all()

    results = []
    for s in subs:
        amt = round_currency(s.amount)
        if s.frequency == "monthly":
            m_equiv = amt
            a_equiv = round_currency(amt * Decimal(12))
        elif s.frequency == "yearly":
            m_equiv = round_currency(amt / Decimal(12))
            a_equiv = amt
        elif s.frequency == "quarterly":
            m_equiv = round_currency(amt / Decimal(3))
            a_equiv = round_currency(amt * Decimal(4))
        elif s.frequency == "weekly":
            m_equiv = round_currency(amt * Decimal(4))
            a_equiv = round_currency(amt * Decimal(52))
        else:
            m_equiv = amt
            a_equiv = round_currency(amt * Decimal(12))

        results.append(
            RecurringExpenseResponse(
                id=s.id,
                user_id=s.user_id,
                name=s.name,
                category_id=s.category_id,
                amount=amt,
                frequency=s.frequency,
                next_due_date=s.next_due_date,
                is_active=s.is_active,
                notes=s.notes,
                created_at=s.created_at,
                category=s.category,
                monthly_cost_equivalent=m_equiv,
                annual_cost_equivalent=a_equiv
            )
        )
    return results

@router.post("/subscriptions", response_model=RecurringExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    sub_in: RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = RecurringExpense(
        user_id=current_user.id,
        name=sub_in.name.strip(),
        category_id=sub_in.category_id,
        amount=round_currency(sub_in.amount),
        frequency=sub_in.frequency or "monthly",
        next_due_date=sub_in.next_due_date,
        is_active=sub_in.is_active if sub_in.is_active is not None else True,
        notes=sub_in.notes
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return get_subscriptions(db=db, current_user=current_user)[-1]

@router.delete("/subscriptions/{sub_id}", status_code=status.HTTP_200_OK)
def delete_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(RecurringExpense).filter(
        RecurringExpense.id == sub_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
    return {"message": "Subscription removed successfully"}
