import io
import csv
from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.models.expense import Expense
from app.models.category import Category
from app.models.budget import MonthlyBudget, CategoryBudget
from app.models.user import User

def generate_expenses_csv(
    db: Session,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    category_id: Optional[int] = None
) -> str:
    """Generates RFC 4180 compliant CSV string of user's filtered expenses."""
    query = db.query(Expense).join(Category, Expense.category_id == Category.id, isouter=True).filter(
        Expense.user_id == user_id
    )

    if year:
        query = query.filter(extract('year', Expense.date) == year)
    if month:
        query = query.filter(extract('month', Expense.date) == month)
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Description", "Category", "Amount (INR)", "Payment Method", "Recurring", "Notes"])

    for exp in expenses:
        cat_name = exp.category.name if exp.category else "Uncategorized"
        writer.writerow([
            exp.id,
            exp.date.isoformat(),
            exp.description,
            cat_name,
            f"{exp.amount:.2f}",
            exp.payment_method or "UPI",
            "Yes" if exp.is_recurring else "No",
            exp.notes or ""
        ])

    return output.getvalue()
