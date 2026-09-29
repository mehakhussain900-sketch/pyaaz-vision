"""
PYAAZ-VISION: Procurement Centers API Routes
Lists APMC collection hubs, intake capacity, and historical quality KPIs.
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import ProcurementCenterDB, BatchDB, ProcurementCenterResponse

router = APIRouter(prefix="/centers", tags=["Procurement Centers"])


@router.get("", response_model=List[ProcurementCenterResponse])
def list_procurement_centers(db: Session = Depends(get_db)):
    """Retrieves all procurement centers with live intake metrics."""
    centers = db.query(ProcurementCenterDB).all()
    results = []

    # KPI mock averages for centers
    kpi_map = {
        "c-lasalgaon": {"batches": 142, "grade_a": 81.2, "urs": 14.3, "defect": 4.5, "reviews": 2.1},
        "c-pimpalgaon": {"batches": 118, "grade_a": 76.4, "urs": 17.8, "defect": 5.8, "reviews": 3.4},
        "c-yeola": {"batches": 89, "grade_a": 69.8, "urs": 21.4, "defect": 8.8, "reviews": 7.8},
        "c-mahuva": {"batches": 96, "grade_a": 84.1, "urs": 12.0, "defect": 3.9, "reviews": 1.9},
        "c-dindori": {"batches": 64, "grade_a": 73.5, "urs": 20.1, "defect": 6.4, "reviews": 4.2}
    }

    for c in centers:
        data = kpi_map.get(c.id, {"batches": 45, "grade_a": 75.0, "urs": 18.0, "defect": 7.0, "reviews": 3.0})
        results.append(
            ProcurementCenterResponse(
                id=c.id,
                code=c.code,
                name=c.name,
                district=c.district,
                state=c.state,
                capacity_mt=c.capacity_mt,
                active_intake=c.active_intake,
                total_batches=data["batches"],
                avg_grade_a=data["grade_a"],
                avg_urs=data["urs"],
                avg_defect_rate=data["defect"],
                assessments_count=data["batches"],
                review_rate=data["reviews"]
            )
        )
    return results


@router.get("/{id}", response_model=ProcurementCenterResponse)
def get_procurement_center(id: str, db: Session = Depends(get_db)):
    c = db.query(ProcurementCenterDB).filter(ProcurementCenterDB.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Procurement center not found")

    return ProcurementCenterResponse(
        id=c.id,
        code=c.code,
        name=c.name,
        district=c.district,
        state=c.state,
        capacity_mt=c.capacity_mt,
        active_intake=c.active_intake,
        total_batches=142,
        avg_grade_a=81.2,
        avg_urs=14.3,
        avg_defect_rate=4.5,
        assessments_count=142,
        review_rate=2.1
    )
