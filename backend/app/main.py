from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db, SessionLocal
from app.api.auth import router as auth_router, init_default_categories
from app.api.expenses import router as expenses_router
from app.api.budgets import router as budgets_router
from app.api.analytics import router as analytics_router
from app.api.planning import router as planning_router
from app.api.insights import router as insights_router
from app.api.assistant import router as assistant_router
from app.api.reports import router as reports_router
from app.api.seed import router as seed_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed default categories
    init_db()
    db = SessionLocal()
    try:
        init_default_categories(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CampusTech — Student Financial Intelligence Platform API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(expenses_router, prefix=settings.API_V1_STR)
app.include_router(budgets_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(planning_router, prefix=settings.API_V1_STR)
app.include_router(insights_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(seed_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "campustech-api",
        "version": settings.VERSION
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # In production, avoid leaking raw internal stack traces
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again."}
    )
