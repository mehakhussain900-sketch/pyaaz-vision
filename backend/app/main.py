"""
PYAAZ-VISION FastAPI Backend Application
Main application entry point configuring routers, CORS middleware, static file serving,
and database lifecycle seeding.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .core.config import settings
from .services.data_seed import seed_database_if_empty
from .api import auth, centers, batches, assessments, ai, results, verification, reports, analytics

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart India Hackathon Prototype: AI-Powered Onion Quality Intelligence & Procurement Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads
os.makedirs(settings.STATIC_UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.STATIC_UPLOADS_DIR), name="uploads")

# Include Modular API Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(centers.router, prefix=settings.API_V1_PREFIX)
app.include_router(batches.router, prefix=settings.API_V1_PREFIX)
app.include_router(assessments.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(results.router, prefix=settings.API_V1_PREFIX)
app.include_router(verification.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
def on_startup():
    """Initializes SQLite/Postgres schemas and seeds mock APMC entities."""
    seed_database_if_empty()


@app.get("/")
def health_check():
    return {
        "status": "ONLINE",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "DEMO_PROTOTYPE_MODE",
        "api_docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
