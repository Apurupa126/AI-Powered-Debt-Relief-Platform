from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app import models

from app.routers import auth
from app.routers import loan
from app.routers import dashboard
from app.routers import ai
from app.routers import profile
from app.routers import reports

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="AI Powered Debt Relief Platform")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(loan.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(profile.router)
app.include_router(reports.router)

@app.get("/")
def home():
    return {
        "message": "AI Powered Debt Relief API Running Successfully"
    }