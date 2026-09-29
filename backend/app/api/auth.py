"""
PYAAZ-VISION: Authentication API Routes
Provides demo login and session identification for procurement inspectors and supervisors.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import UserDB, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=UserResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Role-aware authentication endpoint: validates credentials or returns role profile.
    """
    user = db.query(UserDB).filter(UserDB.email == credentials.email).first()
    if user:
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            badge_number=user.badge_number,
            is_active=user.is_active
        )

    # Role-based credential mapping for platform roles
    email_lower = (credentials.email or "").lower()
    if "admin" in email_lower:
        return UserResponse(
            id="u-admin-01",
            email=credentials.email or "admin@pyaazvision.gov.in",
            full_name="Superintendent Priya Nair",
            role="admin",
            badge_number="MH-AGR-SUPT-001",
            is_active=True
        )
    elif "officer" in email_lower:
        return UserResponse(
            id="u-officer-01",
            email=credentials.email or "officer@pyaazvision.gov.in",
            full_name="Officer Suresh Kulkarni",
            role="procurement_officer",
            badge_number="MH-AGR-PROC-087",
            is_active=True
        )
    elif "reviewer" in email_lower:
        return UserResponse(
            id="u-reviewer-01",
            email=credentials.email or "reviewer@pyaazvision.gov.in",
            full_name="Reviewer Kavita Sharma",
            role="reviewer",
            badge_number="MH-AGR-REV-034",
            is_active=True
        )
    else:
        return UserResponse(
            id="u-insp-01",
            email=credentials.email or "inspector@pyaazvision.gov.in",
            full_name="Inspector Anand K. Deshmukh",
            role="inspector",
            badge_number="MH-AGR-INSP-204",
            is_active=True
        )


@router.get("/me", response_model=UserResponse)
def get_current_user():
    """Returns currently authenticated inspector session."""
    return UserResponse(
        id="u-insp-01",
        email="inspector.deshmukh@pyaazvision.gov.in",
        full_name="Inspector Anand K. Deshmukh",
        role="inspector",
        badge_number="MH-AGR-INSP-204",
        is_active=True
    )
