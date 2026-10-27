from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PlannedExpense(Base):
    __tablename__ = "planned_expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    priority = Column(String(20), default="medium")  # low, medium, high
    status = Column(String(20), default="pending")    # pending, paid, cancelled
    linked_expense_id = Column(Integer, nullable=True) # ID of expense record created when paid
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="planned_expenses")
    category = relationship("Category")
    expense = relationship("Expense", back_populates="planned_expense", uselist=False, foreign_keys="Expense.planned_expense_id")
