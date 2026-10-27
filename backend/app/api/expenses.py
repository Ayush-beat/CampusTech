from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, extract, or_, func
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.category import Category
from app.models.achievement import Achievement
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse, PaginatedExpensesResponse,
    CategoryResponse, CategoryCreate
)
from app.core.deps import get_current_user
from app.services.calculations import round_currency

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Returns system categories (user_id is None) and user's custom categories
    return db.query(Category).filter(
        or_(Category.user_id == None, Category.user_id == current_user.id)
    ).order_by(Category.name.asc()).all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if duplicate name exists for this user
    existing = db.query(Category).filter(
        or_(Category.user_id == None, Category.user_id == current_user.id),
        Category.name.ilike(cat_in.name.strip())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{cat_in.name}' already exists"
        )

    cat = Category(
        name=cat_in.name.strip(),
        icon=cat_in.icon or "Tag",
        color=cat_in.color or "#163D32",
        is_default=False,
        user_id=current_user.id
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("", response_model=PaginatedExpensesResponse)
def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    sort_by: str = Query("date", pattern="^(date|amount|description|id)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Expense.description.ilike(search_filter),
                Expense.notes.ilike(search_filter),
                Expense.payment_method.ilike(search_filter)
            )
        )

    if category_id:
        query = query.filter(Expense.category_id == category_id)

    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    if year:
        query = query.filter(extract('year', Expense.date) == year)
    if month:
        query = query.filter(extract('month', Expense.date) == month)

    # Calculate total matching count and sum
    total_count = query.count()
    total_amount_scalar = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        query.whereclause if query.whereclause is not None else True
    ).scalar() if total_count > 0 else Decimal("0.00")
    
    total_amount = round_currency(Decimal(str(total_amount_scalar)))

    # Order by
    order_column = getattr(Expense, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(order_column), desc(Expense.id))
    else:
        query = query.order_by(asc(order_column), asc(Expense.id))

    # Pagination
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total_count,
        "items": items,
        "page": page,
        "page_size": page_size,
        "total_amount": total_amount
    }

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate category belongs to user or is default
    if exp_in.category_id:
        cat = db.query(Category).filter(
            Category.id == exp_in.category_id,
            or_(Category.user_id == None, Category.user_id == current_user.id)
        ).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected category is invalid"
            )

    expense = Expense(
        user_id=current_user.id,
        category_id=exp_in.category_id,
        amount=round_currency(exp_in.amount),
        description=exp_in.description.strip(),
        date=exp_in.date,
        payment_method=exp_in.payment_method or "UPI",
        notes=exp_in.notes,
        is_recurring=exp_in.is_recurring or False,
        planned_expense_id=exp_in.planned_expense_id
    )
    db.add(expense)

    # Check streak or count for habit achievements
    tx_count = db.query(Expense).filter(Expense.user_id == current_user.id).count()
    if tx_count == 0:
        achieve = Achievement(
            user_id=current_user.id,
            badge_code="first_expense",
            name="Ledger Initiate",
            description="Recorded your very first expense entry.",
            icon="CheckCircle"
        )
        db.add(achieve)

    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    return exp

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    exp_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    if exp_in.amount is not None:
        exp.amount = round_currency(exp_in.amount)
    if exp_in.description is not None:
        exp.description = exp_in.description.strip()
    if exp_in.date is not None:
        exp.date = exp_in.date
    if exp_in.category_id is not None:
        cat = db.query(Category).filter(
            Category.id == exp_in.category_id,
            or_(Category.user_id == None, Category.user_id == current_user.id)
        ).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected category is invalid"
            )
        exp.category_id = exp_in.category_id
    if exp_in.payment_method is not None:
        exp.payment_method = exp_in.payment_method
    if exp_in.notes is not None:
        exp.notes = exp_in.notes
    if exp_in.is_recurring is not None:
        exp.is_recurring = exp_in.is_recurring

    db.commit()
    db.refresh(exp)
    return exp

@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    db.delete(exp)
    db.commit()
    return {"message": "Expense deleted successfully"}
