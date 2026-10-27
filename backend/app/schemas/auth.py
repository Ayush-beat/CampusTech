from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    college_name: Optional[str] = "Engineering & Tech Institute"
    student_id: Optional[str] = None
    currency: Optional[str] = "INR"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSettingsResponse(BaseModel):
    id: int
    monthly_allowance: Decimal
    safe_spend_buffer: Decimal
    alert_threshold_80: bool
    alert_threshold_100: bool
    currency_symbol: str

    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    monthly_allowance: Optional[Decimal] = None
    safe_spend_buffer: Optional[Decimal] = None
    alert_threshold_80: Optional[bool] = None
    alert_threshold_100: Optional[bool] = None
    currency_symbol: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    college_name: Optional[str]
    student_id: Optional[str]
    currency: str
    created_at: Optional[datetime]
    settings: Optional[UserSettingsResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
