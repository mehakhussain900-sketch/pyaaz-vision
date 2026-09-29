"""
PYAAZ-VISION Backend Configuration
Handles environment variables, CORS, database settings, and system limits.
"""
import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "PYAAZ-VISION: AI-Powered Onion Quality Intelligence Platform"
    VERSION: str = "1.0.0-hackathon-rc1"
    API_V1_PREFIX: str = "/api"
    
    # Environment & Database
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pyaaz_vision.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pyaaz-vision-sih-prototype-secret-key-2026")
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    
    # Upload and AI defaults
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    DEFAULT_REFERENCE_MM: float = 27.0
    IS_DEMO_MODE: bool = True
    STATIC_UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", "uploads")


settings = Settings()
os.makedirs(settings.STATIC_UPLOADS_DIR, exist_ok=True)
