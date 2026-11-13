from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserSettings
from app.models.category import Category
from app.models.achievement import Achievement
from app.schemas.auth import (
    UserRegister, UserLogin, UserResponse, Token, UserSettingsUpdate, UserSettingsResponse
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEFAULT_CATEGORIES = [
    ("Food and Groceries", "Utensils", "#163D32"),
    ("Travel and Transportation", "Bus", "#235A4B"),
    ("Education and Stationery", "BookOpen", "#163D32"),
    ("Accommodation and Rent", "Home", "#B95D43"),
    ("Entertainment", "Film", "#3B5A50"),
    ("Shopping", "ShoppingBag", "#8A9A86"),
    ("Subscriptions", "CreditCard", "#B95D43"),
    ("Health and Personal Care", "HeartPulse", "#235A4B"),
    ("College Events and Projects", "Sparkles", "#163D32"),
    ("Miscellaneous", "MoreHorizontal", "#76807A"),
]

def init_default_categories(db: Session):
    existing = db.query(Category).filter(Category.user_id == None).count()
    if existing == 0:
        for name, icon, color in DEFAULT_CATEGORIES:
            cat = Category(name=name, icon=icon, color=color, is_default=True, user_id=None)
            db.add(cat)
        db.commit()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    init_default_categories(db)
    
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    hashed = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hashed,
        college_name=user_in.college_name or "Engineering & Tech Institute",
        student_id=user_in.student_id,
        currency=user_in.currency or "INR"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default UserSettings
    settings = UserSettings(
        user_id=user.id,
        monthly_allowance=15000.00,
        safe_spend_buffer=500.00,
        alert_threshold_80=True,
        alert_threshold_100=True,
        currency_symbol="₹"
    )
    db.add(settings)

    # Add Welcome Achievement
    achievement = Achievement(
        user_id=user.id,
        badge_code="first_step",
        name="Financial Pioneer",
        description="Joined CampusTech and took control of your student finances.",
        icon="Award"
    )
    db.add(achievement)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    init_default_categories(db)
    
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/settings", response_model=UserSettingsResponse)
def update_user_settings(
    settings_in: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    if settings_in.monthly_allowance is not None:
        settings.monthly_allowance = settings_in.monthly_allowance
    if settings_in.safe_spend_buffer is not None:
        settings.safe_spend_buffer = settings_in.safe_spend_buffer
    if settings_in.alert_threshold_80 is not None:
        settings.alert_threshold_80 = settings_in.alert_threshold_80
    if settings_in.alert_threshold_100 is not None:
        settings.alert_threshold_100 = settings_in.alert_threshold_100
    if settings_in.currency_symbol is not None:
        settings.currency_symbol = settings_in.currency_symbol

    db.commit()
    db.refresh(settings)
    return settings

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
