"""
PYAAZ-VISION: Human-in-the-Loop Verification & Dispute Arbitration API
Enables inspectors and quality officers to:
1. Accept AI Result
2. Request Review (Flag for Dispute Arbitration)
3. Override AI Assessment with manual justifications
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import (
    HumanVerificationDB, ReviewCaseDB, AssessmentSessionDB, BatchDB,
    HumanVerificationCreate, ReviewCaseCreate
)

router = APIRouter(prefix="", tags=["Human Verification & Review"])


@router.post("/verification")
def submit_verification(payload: HumanVerificationCreate, db: Session = Depends(get_db)):
    assessment = db.query(AssessmentSessionDB).filter(AssessmentSessionDB.id == payload.assessment_id).first()
    if not assessment:
        # Create an assessment record for this session if submitting directly from frontend
        assessment = AssessmentSessionDB(
            id=payload.assessment_id,
            batch_id=payload.assessment_id.replace("as-", ""),
            inspector_name=payload.inspector_name,
            stage="COMPLETED"
        )
        db.add(assessment)
        db.commit()

    # Check if verification already exists, if so update it
    hv = db.query(HumanVerificationDB).filter(HumanVerificationDB.assessment_id == payload.assessment_id).first()
    if not hv:
        hv = HumanVerificationDB(
            id=f"hv-{str(uuid.uuid4())[:8]}",
            assessment_id=payload.assessment_id
        )
        db.add(hv)

    hv.inspector_name = payload.inspector_name
    hv.action = payload.action
    hv.ai_grade_a_pct = payload.ai_grade_a_pct
    hv.ai_urs_pct = payload.ai_urs_pct
    hv.ai_defect_pct = payload.ai_defect_pct
    hv.final_grade_a_pct = payload.final_grade_a_pct
    hv.final_urs_pct = payload.final_urs_pct
    hv.final_defect_pct = payload.final_defect_pct
    hv.reason = payload.reason
    hv.timestamp = datetime.utcnow()

    # Update Batch Status
    batch = assessment.batch
    if batch:
        if payload.action == "ACCEPT_AI" or payload.action == "OVERRIDE":
            batch.status = "VERIFIED"
        elif payload.action == "REQUEST_REVIEW":
            batch.status = "UNDER_REVIEW"

    db.commit()

    return {
        "status": "RECORDED",
        "verification_id": hv.id,
        "action": hv.action,
        "inspector": hv.inspector_name,
        "ai_grade_a": hv.ai_grade_a_pct,
        "final_grade_a": hv.final_grade_a_pct,
        "timestamp": str(hv.timestamp)
    }


@router.get("/verification/{assessment_id}")
def get_verification(assessment_id: str, db: Session = Depends(get_db)):
    hv = db.query(HumanVerificationDB).filter(HumanVerificationDB.assessment_id == assessment_id).first()
    if not hv:
        raise HTTPException(status_code=404, detail="No verification record for this assessment")

    return {
        "id": hv.id,
        "assessment_id": hv.assessment_id,
        "inspector_name": hv.inspector_name,
        "action": hv.action,
        "ai_grade_a_pct": hv.ai_grade_a_pct,
        "ai_urs_pct": hv.ai_urs_pct,
        "ai_defect_pct": hv.ai_defect_pct,
        "final_grade_a_pct": hv.final_grade_a_pct,
        "final_urs_pct": hv.final_urs_pct,
        "final_defect_pct": hv.final_defect_pct,
        "reason": hv.reason,
        "timestamp": str(hv.timestamp)
    }


@router.post("/dispute")
def create_dispute_case(payload: ReviewCaseCreate, db: Session = Depends(get_db)):
    assessment = db.query(AssessmentSessionDB).filter(AssessmentSessionDB.id == payload.assessment_id).first()
    if not assessment:
        assessment = AssessmentSessionDB(
            id=payload.assessment_id,
            batch_id=payload.batch_id or payload.assessment_id.replace("as-", ""),
            inspector_name=payload.flagged_by_name,
            stage="UNDER_REVIEW"
        )
        db.add(assessment)
        db.commit()

    rev = db.query(ReviewCaseDB).filter(ReviewCaseDB.assessment_id == payload.assessment_id).first()
    if not rev:
        rev = ReviewCaseDB(
            id=f"rev-{str(uuid.uuid4())[:8]}",
            assessment_id=payload.assessment_id,
            batch_id=payload.batch_id
        )
        db.add(rev)

    rev.flagged_by_name = payload.flagged_by_name
    rev.reason = payload.reason
    rev.explanation = payload.explanation
    rev.status = "Under Review"

    batch = assessment.batch
    if batch:
        batch.status = "UNDER_REVIEW"

    db.commit()

    return {
        "case_id": rev.id,
        "status": rev.status,
        "reason": rev.reason,
        "flagged_by": rev.flagged_by_name,
        "message": "Lot flagged for APMC Dispute Arbitration Committee review"
    }


@router.get("/dispute/{assessment_id}")
def get_dispute_case(assessment_id: str, db: Session = Depends(get_db)):
    rev = db.query(ReviewCaseDB).filter(ReviewCaseDB.assessment_id == assessment_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="No active review case for this assessment")

    return {
        "id": rev.id,
        "assessment_id": rev.assessment_id,
        "batch_id": rev.batch_id,
        "flagged_by_name": rev.flagged_by_name,
        "reason": rev.reason,
        "explanation": rev.explanation,
        "status": rev.status,
        "created_at": str(rev.created_at)
    }
