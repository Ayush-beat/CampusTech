from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class MonthlyBudget(Base):
    __tablename__ = "monthly_budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    total_budget = Column(Numeric(10, 2), nullable=False)
    total_allowance = Column(Numeric(10, 2), default=0.00)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="uq_user_monthly_budget"),
    )

    user = relationship("User", back_populates="monthly_budgets")
    category_budgets = relationship("CategoryBudget", back_populates="monthly_budget", cascade="all, delete-orphan")

class CategoryBudget(Base):
    __tablename__ = "category_budgets"

    id = Column(Integer, primary_key=True, index=True)
    monthly_budget_id = Column(Integer, ForeignKey("monthly_budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    allocated_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("monthly_budget_id", "category_id", name="uq_budget_category"),
    )

    monthly_budget = relationship("MonthlyBudget", back_populates="category_budgets")
    category = relationship("Category", back_populates="category_budgets")
