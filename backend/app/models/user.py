from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    college_name = Column(String(255), default="Engineering & Tech Institute")
    student_id = Column(String(100), nullable=True)
    currency = Column(String(10), default="INR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    monthly_budgets = relationship("MonthlyBudget", back_populates="user", cascade="all, delete-orphan")
    planned_expenses = relationship("PlannedExpense", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    recurring_expenses = relationship("RecurringExpense", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    monthly_allowance = Column(Numeric(10, 2), default=15000.00)
    safe_spend_buffer = Column(Numeric(10, 2), default=500.00)
    alert_threshold_80 = Column(Boolean, default=True)
    alert_threshold_100 = Column(Boolean, default=True)
    currency_symbol = Column(String(10), default="₹")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="settings")
