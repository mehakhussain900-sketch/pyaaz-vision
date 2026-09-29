"""
PYAAZ-VISION: Results API Route
Returns aggregated assessment quality results and detections breakdown.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import AssessmentSessionDB, QualityResultDB

router = APIRouter(prefix="/results", tags=["Quality Results"])


@router.get("/{assessment_id}")
def get_assessment_result(assessment_id: str, db: Session = Depends(get_db)):
    assessment = db.query(AssessmentSessionDB).filter(AssessmentSessionDB.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    qr = assessment.quality_result
    if not qr:
        raise HTTPException(status_code=404, detail="Quality results not yet calculated for this assessment")

    return {
        "assessment_id": assessment_id,
        "batch_id": assessment.batch_id,
        "batch_number": assessment.batch.batch_number if assessment.batch else None,
        "total_onions_detected": qr.total_onions_detected,
        "grade_a_count": qr.grade_a_count,
        "grade_a_pct": qr.grade_a_pct,
        "urs_count": qr.urs_count,
        "urs_pct": qr.urs_pct,
        "damaged_count": qr.damaged_count,
        "damaged_pct": qr.damaged_pct,
        "rotten_count": qr.rotten_count,
        "rotten_pct": qr.rotten_pct,
        "sprouted_count": qr.sprouted_count,
        "sprouted_pct": qr.sprouted_pct,
        "undersized_count": qr.undersized_count,
        "undersized_pct": qr.undersized_pct,
        "defect_count": qr.defect_count,
        "defect_rate_pct": qr.defect_rate_pct,
        "average_diameter_mm": qr.average_diameter_mm,
        "average_confidence": qr.average_confidence,
        "procurement_verdict": qr.procurement_verdict,
        "recommended_action": qr.recommended_action
    }
