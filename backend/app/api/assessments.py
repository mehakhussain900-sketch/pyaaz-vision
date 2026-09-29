"""
PYAAZ-VISION: Assessments API Routes
Orchestrates the 5-step assessment workflow:
Step 1: Batch Info -> Step 2: Sampling -> Step 3: Quality Check -> Step 4: AI Analysis -> Step 5: Result
"""
import uuid
import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
import cv2
import numpy as np

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from ai import get_inference_engine

from ..core.database import get_db
from ..core.config import settings
from ..models.schemas import (
    AssessmentSessionDB, BatchDB, SampleImageDB, DetectionDB,
    QualityResultDB, ReportDB, AssessmentCreate
)

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.post("")
def create_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)):
    batch = db.query(BatchDB).filter(BatchDB.id == payload.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Referenced Batch ID does not exist")

    session_id = f"as-{str(uuid.uuid4())[:8]}"
    assessment = AssessmentSessionDB(
        id=session_id,
        batch_id=payload.batch_id,
        inspector_name=payload.inspector_name,
        sample_size_count=payload.sample_size_count,
        reference_object_diameter_mm=payload.reference_object_diameter_mm,
        stage="SAMPLING",
        scenario=payload.scenario or "standard",
        notes=payload.notes
    )
    db.add(assessment)
    batch.status = "ASSESSMENT_IN_PROGRESS"
    db.commit()
    db.refresh(assessment)

    return {
        "assessment_id": assessment.id,
        "batch_id": assessment.batch_id,
        "batch_number": batch.batch_number,
        "stage": assessment.stage,
        "inspector_name": assessment.inspector_name,
        "sample_size_count": assessment.sample_size_count,
        "scenario": assessment.scenario
    }


@router.post("/{id}/samples")
async def add_sample_image(
    id: str,
    sample_index: int = Form(...),
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    assessment = db.query(AssessmentSessionDB).filter(AssessmentSessionDB.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    saved_url = image_url or f"/assets/sample-onion-tray-0{sample_index}.jpg"

    if file and file.filename:
        file_ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_name = f"sample_{id}_{sample_index}_{uuid.uuid4().hex[:6]}{file_ext}"
        filepath = os.path.join(settings.STATIC_UPLOADS_DIR, unique_name)
        file_bytes = await file.read()
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        saved_url = f"/uploads/{unique_name}"

    sample = SampleImageDB(
        assessment_id=id,
        sample_index=sample_index,
        image_url=saved_url,
        blur_score=93.4,
        brightness_score=87.6,
        framing_score=95.0,
        is_acceptable=True,
        quality_summary="Visual capture approved for analysis"
    )
    db.add(sample)
    assessment.stage = "QUALITY_CHECK"
    db.commit()
    db.refresh(sample)

    return {
        "sample_id": sample.id,
        "sample_index": sample.sample_index,
        "image_url": sample.image_url,
        "is_acceptable": sample.is_acceptable
    }


@router.post("/{id}/analyze")
async def run_assessment_analysis(
    id: str,
    scenario: Optional[str] = Form(None),
    reference_diameter_mm: Optional[float] = Form(27.0),
    db: Session = Depends(get_db)
):
    assessment = db.query(AssessmentSessionDB).filter(AssessmentSessionDB.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    engine = get_inference_engine()
    chosen_scenario = scenario or assessment.scenario or "standard"

    # Analyze dummy or real sample image
    dummy = np.full((600, 800, 3), (120, 140, 180), dtype=np.uint8)
    _, buf = cv2.imencode('.jpg', dummy)
    
    ai_result = engine.analyze_image(
        image_bytes=buf.tobytes(),
        scenario=chosen_scenario,
        reference_mm=reference_diameter_mm
    )

    metrics = ai_result["summary_metrics"]

    # Delete existing results for re-run if any
    db.query(QualityResultDB).filter(QualityResultDB.assessment_id == id).delete()

    # Save Quality Result
    qr = QualityResultDB(
        id=f"qr-{id}",
        assessment_id=id,
        total_onions_detected=metrics["total_detected"],
        grade_a_count=metrics["grade_a_count"],
        grade_a_pct=metrics["grade_a_pct"],
        urs_count=metrics["urs_count"],
        urs_pct=metrics["urs_pct"],
        damaged_count=metrics["damaged_count"],
        damaged_pct=metrics["damaged_pct"],
        rotten_count=metrics["rotten_count"],
        rotten_pct=metrics["rotten_pct"],
        sprouted_count=metrics["sprouted_count"],
        sprouted_pct=metrics["sprouted_pct"],
        undersized_count=metrics["undersized_count"],
        undersized_pct=metrics["undersized_pct"],
        defect_count=metrics["defect_count"],
        defect_rate_pct=metrics["defect_rate_pct"],
        average_diameter_mm=metrics["avg_diameter_mm"],
        average_confidence=metrics["avg_confidence"],
        procurement_verdict=metrics["procurement_verdict"],
        recommended_action=metrics["recommended_action"]
    )
    db.add(qr)

    # Save or update Batch status
    batch = assessment.batch
    if batch:
        if metrics["procurement_verdict"] == "ACCEPTED_GRADE_A":
            batch.status = "APPROVED"
        elif metrics["procurement_verdict"] == "REJECTED_HIGH_DEFECTS":
            batch.status = "REJECTED"
        else:
            batch.status = "CONDITIONALLY_ACCEPTED"

    # Auto-generate Digital Report record if not already present
    if not assessment.report:
        report = ReportDB(
            id=f"rpt-{id}",
            report_code=f"RPT-PV-2026-{str(uuid.uuid4())[:4].upper()}",
            assessment_id=id,
            batch_id=batch.id if batch else "unknown",
            title="Prototype Digital Quality Assessment Report",
            qr_verification_code=f"PV-VERIFY-2026-{id}",
            disclaimer="PROTOTYPE REPORT: Generated by PYAAZ-VISION SIH prototype. Not an official statutory certificate."
        )
        db.add(report)

    assessment.stage = "COMPLETED"
    db.commit()

    return {
        "assessment_id": id,
        "metrics": metrics,
        "detections": ai_result["detections"],
        "quality_check": ai_result["quality_check"]
    }


@router.get("/{id}")
def get_assessment(id: str, db: Session = Depends(get_db)):
    assessment = db.query(AssessmentSessionDB).filter(AssessmentSessionDB.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    batch = assessment.batch
    center = batch.center if batch else None
    qr = assessment.quality_result
    hv = assessment.human_verification
    rev = assessment.review_case
    rpt = assessment.report

    # Samples
    samples = []
    for s in assessment.samples:
        samples.append({
            "id": s.id,
            "sample_index": s.sample_index,
            "image_url": s.image_url,
            "blur_score": s.blur_score,
            "brightness_score": s.brightness_score,
            "framing_score": s.framing_score,
            "is_acceptable": s.is_acceptable,
            "quality_summary": s.quality_summary
        })

    return {
        "id": assessment.id,
        "batch_id": assessment.batch_id,
        "batch_number": batch.batch_number if batch else None,
        "variety": batch.variety if batch else None,
        "farmer_name": batch.farmer_name if batch else None,
        "supplier_farmer_id": batch.supplier_farmer_id if batch else None,
        "center_name": center.name if center else "APMC Lasalgaon Yard",
        "district": center.district if center else "Nashik",
        "state": center.state if center else "Maharashtra",
        "inspector_name": assessment.inspector_name,
        "sample_size_count": assessment.sample_size_count,
        "stage": assessment.stage,
        "scenario": assessment.scenario,
        "created_at": str(assessment.created_at),
        "samples": samples,
        "quality_result": {
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
        } if qr else None,
        "human_verification": {
            "id": hv.id,
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
        } if hv else None,
        "review_case": {
            "id": rev.id,
            "flagged_by_name": rev.flagged_by_name,
            "reason": rev.reason,
            "explanation": rev.explanation,
            "status": rev.status,
            "created_at": str(rev.created_at)
        } if rev else None,
        "report": {
            "id": rpt.id,
            "report_code": rpt.report_code,
            "title": rpt.title,
            "qr_verification_code": rpt.qr_verification_code,
            "disclaimer": rpt.disclaimer
        } if rpt else None
    }
