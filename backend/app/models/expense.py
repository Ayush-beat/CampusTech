from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(50), default="UPI")  # UPI, Cash, Debit Card, Credit Card, Net Banking
    notes = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False)
    planned_expense_id = Column(Integer, ForeignKey("planned_expenses.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")
    planned_expense = relationship("PlannedExpense", back_populates="expense", foreign_keys=[planned_expense_id])
