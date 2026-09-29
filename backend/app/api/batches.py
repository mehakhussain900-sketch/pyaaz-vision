"""
PYAAZ-VISION: Batches API Routes
Handles inward onion delivery lots, status tracking, and lot-level summaries.
"""
import uuid
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import BatchDB, ProcurementCenterDB, QualityResultDB, AssessmentSessionDB, BatchCreate, BatchResponse

router = APIRouter(prefix="/batches", tags=["Batches"])


@router.get("", response_model=List[BatchResponse])
def list_batches(
    center_id: Optional[str] = None,
    status: Optional[str] = None,
    variety: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(BatchDB)
    if center_id:
        query = query.filter(BatchDB.center_id == center_id)
    if status:
        query = query.filter(BatchDB.status == status)
    if variety:
        query = query.filter(BatchDB.variety == variety)

    batches = query.order_by(BatchDB.created_at.desc()).all()
    results = []

    for b in batches:
        # Search filter
        if search:
            s = search.lower()
            if not (s in b.batch_number.lower() or s in b.farmer_name.lower() or s in b.supplier_farmer_id.lower()):
                continue

        center_name = b.center.name if b.center else "Lasalgaon Main Yard"
        
        # Pull associated latest assessment quality results
        grade_a = None
        urs = None
        defect = None
        confidence = None
        sample_size = 60

        if b.assessments:
            latest_sess = b.assessments[-1]
            sample_size = latest_sess.sample_size_count
            if latest_sess.quality_result:
                grade_a = latest_sess.quality_result.grade_a_pct
                urs = latest_sess.quality_result.urs_pct
                defect = latest_sess.quality_result.defect_rate_pct
                confidence = latest_sess.quality_result.average_confidence

        results.append(
            BatchResponse(
                id=b.id,
                batch_number=b.batch_number,
                center_id=b.center_id,
                center_name=center_name,
                supplier_farmer_id=b.supplier_farmer_id,
                farmer_name=b.farmer_name,
                farmer_contact=b.farmer_contact,
                variety=b.variety,
                total_lot_weight_kg=b.total_lot_weight_kg,
                vehicle_number=b.vehicle_number,
                arrival_date=str(b.arrival_date),
                status=b.status,
                grade_a_pct=grade_a,
                urs_pct=urs,
                defect_rate_pct=defect,
                sample_size=sample_size,
                confidence=confidence,
                created_at=str(b.created_at)
            )
        )
    return results


@router.post("", response_model=BatchResponse)
def create_batch(payload: BatchCreate, db: Session = Depends(get_db)):
    batch_num = payload.batch_number or f"BATCH-{date.today().year}-NSK-{str(uuid.uuid4())[:4].upper()}"
    new_batch = BatchDB(
        batch_number=batch_num,
        center_id=payload.center_id,
        supplier_farmer_id=payload.supplier_farmer_id,
        farmer_name=payload.farmer_name,
        farmer_contact=payload.farmer_contact,
        variety=payload.variety,
        total_lot_weight_kg=payload.total_lot_weight_kg,
        vehicle_number=payload.vehicle_number,
        arrival_date=date.today(),
        status="PENDING_ASSESSMENT"
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    center = db.query(ProcurementCenterDB).filter(ProcurementCenterDB.id == payload.center_id).first()
    center_name = center.name if center else "Lasalgaon Main Yard"

    return BatchResponse(
        id=new_batch.id,
        batch_number=new_batch.batch_number,
        center_id=new_batch.center_id,
        center_name=center_name,
        supplier_farmer_id=new_batch.supplier_farmer_id,
        farmer_name=new_batch.farmer_name,
        farmer_contact=new_batch.farmer_contact,
        variety=new_batch.variety,
        total_lot_weight_kg=new_batch.total_lot_weight_kg,
        vehicle_number=new_batch.vehicle_number,
        arrival_date=str(new_batch.arrival_date),
        status=new_batch.status,
        created_at=str(new_batch.created_at)
    )


@router.get("/{id}")
def get_batch_details(id: str, db: Session = Depends(get_db)):
    batch = db.query(BatchDB).filter(BatchDB.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    assessments = []
    for a in batch.assessments:
        qr = a.quality_result
        assessments.append({
            "id": a.id,
            "inspector_name": a.inspector_name,
            "sample_size": a.sample_size_count,
            "stage": a.stage,
            "scenario": a.scenario,
            "created_at": str(a.created_at),
            "quality_result": {
                "total_onions_detected": qr.total_onions_detected,
                "grade_a_pct": qr.grade_a_pct,
                "urs_pct": qr.urs_pct,
                "damaged_pct": qr.damaged_pct,
                "rotten_pct": qr.rotten_pct,
                "sprouted_pct": qr.sprouted_pct,
                "undersized_pct": qr.undersized_pct,
                "defect_rate_pct": qr.defect_rate_pct,
                "procurement_verdict": qr.procurement_verdict,
                "recommended_action": qr.recommended_action
            } if qr else None
        })

    return {
        "id": batch.id,
        "batch_number": batch.batch_number,
        "center_id": batch.center_id,
        "center_name": batch.center.name if batch.center else "APMC Center",
        "supplier_farmer_id": batch.supplier_farmer_id,
        "farmer_name": batch.farmer_name,
        "farmer_contact": batch.farmer_contact,
        "variety": batch.variety,
        "total_lot_weight_kg": batch.total_lot_weight_kg,
        "vehicle_number": batch.vehicle_number,
        "arrival_date": str(batch.arrival_date),
        "status": batch.status,
        "created_at": str(batch.created_at),
        "assessments": assessments
    }
