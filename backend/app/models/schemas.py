"""
PYAAZ-VISION Database Models & Pydantic Schemas
Defines all SQLAlchemy ORM Entities and Pydantic DTOs for API validation.
"""
import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

from ..core.database import Base


# ============================================================================
# SQLAlchemy ORM Models
# ============================================================================

def gen_uuid():
    return str(uuid.uuid4())


class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="inspector")
    badge_number = Column(String(50), unique=True)
    center_id = Column(String(36), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProcurementCenterDB(Base):
    __tablename__ = "procurement_centers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    capacity_mt = Column(Float, default=5000.0)
    active_intake = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batches = relationship("BatchDB", back_populates="center", cascade="all, delete-orphan")


class BatchDB(Base):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    batch_number = Column(String(100), unique=True, nullable=False)
    center_id = Column(String(36), ForeignKey("procurement_centers.id"), nullable=False)
    supplier_farmer_id = Column(String(100), nullable=False)
    farmer_name = Column(String(200), nullable=False)
    farmer_contact = Column(String(20), nullable=True)
    variety = Column(String(100), default="Nashik Red / Garwa")
    total_lot_weight_kg = Column(Float, default=4500.0)
    vehicle_number = Column(String(50), default="MH-15-EG-8291")
    arrival_date = Column(Date, default=date.today)
    status = Column(String(50), default="PENDING_ASSESSMENT")
    created_at = Column(DateTime, default=datetime.utcnow)

    center = relationship("ProcurementCenterDB", back_populates="batches")
    assessments = relationship("AssessmentSessionDB", back_populates="batch", cascade="all, delete-orphan")
    reports = relationship("ReportDB", back_populates="batch", cascade="all, delete-orphan")


class AssessmentSessionDB(Base):
    __tablename__ = "assessment_sessions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    batch_id = Column(String(36), ForeignKey("batches.id"), nullable=False)
    inspector_id = Column(String(36), nullable=True)
    inspector_name = Column(String(150), default="Inspector A. K. Deshmukh")
    sample_size_count = Column(Integer, default=60)
    reference_object_diameter_mm = Column(Float, default=27.0)
    stage = Column(String(50), default="COMPLETED")
    is_demo_mode = Column(Boolean, default=True)
    scenario = Column(String(50), default="standard")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("BatchDB", back_populates="assessments")
    samples = relationship("SampleImageDB", back_populates="assessment", cascade="all, delete-orphan")
    quality_result = relationship("QualityResultDB", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    human_verification = relationship("HumanVerificationDB", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    review_case = relationship("ReviewCaseDB", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    report = relationship("ReportDB", back_populates="assessment", uselist=False, cascade="all, delete-orphan")


class SampleImageDB(Base):
    __tablename__ = "sample_images"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessment_sessions.id"), nullable=False)
    sample_index = Column(Integer, nullable=False)
    image_url = Column(Text, nullable=False)
    blur_score = Column(Float, default=92.0)
    brightness_score = Column(Float, default=88.5)
    framing_score = Column(Float, default=95.0)
    is_acceptable = Column(Boolean, default=True)
    quality_summary = Column(Text, default="Meets optical sharpness requirements")
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentSessionDB", back_populates="samples")
    detections = relationship("DetectionDB", back_populates="sample", cascade="all, delete-orphan")


class DetectionDB(Base):
    __tablename__ = "detections"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    sample_image_id = Column(String(36), ForeignKey("sample_images.id"), nullable=False)
    onion_code = Column(String(50), nullable=False)
    bbox_x = Column(Integer, default=0)
    bbox_y = Column(Integer, default=0)
    bbox_w = Column(Integer, default=0)
    bbox_h = Column(Integer, default=0)
    diameter_mm = Column(Float, default=52.0)
    size_category = Column(String(50), default="STANDARD_MEDIUM")
    quality_class = Column(String(50), default="GRADE A")
    defect_type = Column(String(100), default="None (Healthy)")
    confidence = Column(Float, default=0.92)
    evidence = Column(Text, default="Dry outer papery skin intact")
    created_at = Column(DateTime, default=datetime.utcnow)

    sample = relationship("SampleImageDB", back_populates="detections")


class QualityResultDB(Base):
    __tablename__ = "quality_results"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessment_sessions.id"), unique=True, nullable=False)
    total_onions_detected = Column(Integer, default=0)
    grade_a_count = Column(Integer, default=0)
    grade_a_pct = Column(Float, default=0.0)
    urs_count = Column(Integer, default=0)
    urs_pct = Column(Float, default=0.0)
    damaged_count = Column(Integer, default=0)
    damaged_pct = Column(Float, default=0.0)
    rotten_count = Column(Integer, default=0)
    rotten_pct = Column(Float, default=0.0)
    sprouted_count = Column(Integer, default=0)
    sprouted_pct = Column(Float, default=0.0)
    undersized_count = Column(Integer, default=0)
    undersized_pct = Column(Float, default=0.0)
    defect_count = Column(Integer, default=0)
    defect_rate_pct = Column(Float, default=0.0)
    average_diameter_mm = Column(Float, default=52.0)
    average_confidence = Column(Float, default=0.92)
    procurement_verdict = Column(String(100), default="ACCEPTED_GRADE_A")
    recommended_action = Column(Text, default="Approve batch for procurement")
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentSessionDB", back_populates="quality_result")


class HumanVerificationDB(Base):
    __tablename__ = "human_verifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessment_sessions.id"), unique=True, nullable=False)
    inspector_id = Column(String(36), nullable=True)
    inspector_name = Column(String(150), default="Inspector A. K. Deshmukh")
    action = Column(String(50), default="ACCEPT_AI")  # ACCEPT_AI, REQUEST_REVIEW, OVERRIDE
    ai_grade_a_pct = Column(Float, default=0.0)
    ai_urs_pct = Column(Float, default=0.0)
    ai_defect_pct = Column(Float, default=0.0)
    final_grade_a_pct = Column(Float, default=0.0)
    final_urs_pct = Column(Float, default=0.0)
    final_defect_pct = Column(Float, default=0.0)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentSessionDB", back_populates="human_verification")


class ReviewCaseDB(Base):
    __tablename__ = "review_cases"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessment_sessions.id"), unique=True, nullable=False)
    batch_id = Column(String(36), nullable=False)
    flagged_by_name = Column(String(150), default="Inspector")
    reason = Column(String(100), default="AI result appears inconsistent")
    explanation = Column(Text, default="Visual spot-check indicated potential discrepancies.")
    status = Column(String(50), default="Pending")  # Pending, Under Review, Resolved
    resolution_notes = Column(Text, nullable=True)
    resolved_by_name = Column(String(150), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentSessionDB", back_populates="review_case")


class ReportDB(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    report_code = Column(String(100), unique=True, nullable=False)
    assessment_id = Column(String(36), ForeignKey("assessment_sessions.id"), unique=True, nullable=False)
    batch_id = Column(String(36), ForeignKey("batches.id"), nullable=False)
    title = Column(String(200), default="Prototype Digital Quality Assessment Report")
    qr_verification_code = Column(String(255), default="QR-DEMO-PYAAZ-2026")
    is_certified_claim = Column(Boolean, default=False)
    disclaimer = Column(Text, default="Prototype Digital Quality Assessment Report. Do not present as official certification.")
    pdf_download_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("BatchDB", back_populates="reports")
    assessment = relationship("AssessmentSessionDB", back_populates="report")


class AlertDB(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    center_id = Column(String(36), nullable=True)
    batch_id = Column(String(36), nullable=True)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="WARNING")  # INFO, WARNING, CRITICAL
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Pydantic Schemas for Request / Response Serialization
# ============================================================================

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    badge_number: Optional[str] = None
    is_active: bool

class ProcurementCenterResponse(BaseModel):
    id: str
    code: str
    name: str
    district: str
    state: str
    capacity_mt: float
    active_intake: bool
    total_batches: Optional[int] = 0
    avg_grade_a: Optional[float] = 0.0
    avg_urs: Optional[float] = 0.0
    avg_defect_rate: Optional[float] = 0.0
    assessments_count: Optional[int] = 0
    review_rate: Optional[float] = 0.0

class BatchCreate(BaseModel):
    batch_number: Optional[str] = None
    center_id: str
    supplier_farmer_id: str
    farmer_name: str
    farmer_contact: Optional[str] = None
    variety: str = "Nashik Red / Garwa"
    total_lot_weight_kg: float = 4500.0
    vehicle_number: Optional[str] = "MH-15-EG-8291"

class BatchResponse(BaseModel):
    id: str
    batch_number: str
    center_id: str
    center_name: Optional[str] = None
    supplier_farmer_id: str
    farmer_name: str
    farmer_contact: Optional[str] = None
    variety: str
    total_lot_weight_kg: float
    vehicle_number: Optional[str] = None
    arrival_date: str
    status: str
    grade_a_pct: Optional[float] = None
    urs_pct: Optional[float] = None
    defect_rate_pct: Optional[float] = None
    sample_size: Optional[int] = None
    confidence: Optional[float] = None
    created_at: str

class AssessmentCreate(BaseModel):
    batch_id: str
    inspector_name: str = "Inspector A. K. Deshmukh"
    sample_size_count: int = 60
    reference_object_diameter_mm: float = 27.0
    scenario: Optional[str] = "standard"
    notes: Optional[str] = None

class DetectionItem(BaseModel):
    onion_id: str
    bbox_px: List[int]
    bbox_norm: List[float]
    label: str
    defect_type: Optional[str] = None
    diameter_mm: float
    size_category: str
    is_undersized: bool
    confidence: float
    evidence: str

class QualityResultResponse(BaseModel):
    id: Optional[str] = None
    total_onions_detected: int
    grade_a_count: int
    grade_a_pct: float
    urs_count: int
    urs_pct: float
    damaged_count: int
    damaged_pct: float
    rotten_count: int
    rotten_pct: float
    sprouted_count: int
    sprouted_pct: float
    undersized_count: int
    undersized_pct: float
    defect_count: int
    defect_rate_pct: float
    average_diameter_mm: float
    average_confidence: float
    procurement_verdict: str
    recommended_action: str

class HumanVerificationCreate(BaseModel):
    assessment_id: str
    inspector_name: str
    action: str  # ACCEPT_AI, REQUEST_REVIEW, OVERRIDE
    ai_grade_a_pct: float
    ai_urs_pct: float
    ai_defect_pct: float
    final_grade_a_pct: float
    final_urs_pct: float
    final_defect_pct: float
    reason: Optional[str] = None

class ReviewCaseCreate(BaseModel):
    assessment_id: str
    batch_id: str
    flagged_by_name: str
    reason: str
    explanation: Optional[str] = None

class CalibrateRequest(BaseModel):
    reference_object_diameter_mm: float
    measured_pixel_diameter: float

class QualityCheckRequest(BaseModel):
    scenario: Optional[str] = None
