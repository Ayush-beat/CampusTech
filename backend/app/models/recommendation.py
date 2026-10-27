from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    detected_pattern = Column(Text, nullable=False)
    impact_amount = Column(Numeric(10, 2), nullable=True)
    impact_percentage = Column(Numeric(5, 2), nullable=True)
    suggested_action = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    status = Column(String(20), default="active")  # active, dismissed, reviewed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendations")
