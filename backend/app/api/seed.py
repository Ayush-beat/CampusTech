from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.auth import Token, UserResponse
from app.core.security import create_access_token
from app.seed.demo_data import seed_demo_student, DEMO_USER_EMAIL
from app.api.auth import init_default_categories

router = APIRouter(prefix="/seed", tags=["Demonstration Mode"])

@router.post("/demo")
def seed_demo_endpoint(db: Session = Depends(get_db)):
    """
    Seeds realistic synthetic demo student data (Aarav Sharma) across 3 months.
    """
    init_default_categories(db)
    user = seed_demo_student(db)
    return {
        "message": "Demo data populated successfully",
        "demo_email": user.email,
        "demo_password": "Password@123",
        "user_id": user.id,
        "student_name": user.full_name,
        "college": user.college_name
    }

@router.post("/quick-demo-login", response_model=Token)
def quick_demo_login(db: Session = Depends(get_db)):
    """
    1-Click instant demo login for evaluators, professors, and reviewers.
    Seeds synthetic student records if not present, and returns immediate authentication token.
    """
    init_default_categories(db)
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if not user:
        user = seed_demo_student(db)

    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
