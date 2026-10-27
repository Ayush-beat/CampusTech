from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.models.notification import Notification
from app.models.achievement import Achievement
from app.schemas.analytics import RecommendationResponse, NotificationResponse, AchievementResponse
from app.core.deps import get_current_user
from app.services.insights import generate_insights_and_alerts

router = APIRouter(prefix="/insights", tags=["Insights & Alerts"])

class RecommendationStatusUpdate(BaseModel):
    status: str # "reviewed" or "dismissed"

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    year: Optional[int] = None,
    month: Optional[int] = None,
    status_filter: Optional[str] = "active",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month = today.month

    # Trigger generation
    generate_insights_and_alerts(db, current_user.id, year, month)

    query = db.query(Recommendation).filter(Recommendation.user_id == current_user.id)
    if status_filter:
        query = query.filter(Recommendation.status == status_filter)
    
    return query.order_by(Recommendation.created_at.desc()).all()

@router.put("/{rec_id}/status", response_model=RecommendationResponse)
def update_recommendation_status(
    rec_id: int,
    status_update: RecommendationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == rec_id,
        Recommendation.user_id == current_user.id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    if status_update.status not in ["active", "reviewed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    rec.status = status_update.status
    db.commit()
    db.refresh(rec)
    return rec

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

@router.put("/notifications/{notif_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.unlocked_at.desc()).all()
