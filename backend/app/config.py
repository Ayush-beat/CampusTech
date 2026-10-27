from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "ledger. — Student Financial OS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database URL: default to SQLite for instant local dev, switchable to MySQL seamlessly
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ledger.db")
    
    # JWT & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ledger-super-secret-production-key-2026-student-finance-os")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Currency
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
