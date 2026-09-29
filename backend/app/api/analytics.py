"""
PYAAZ-VISION: Analytics & Intelligence API Routes
Provides aggregated KPIs, trends, defect distributions, alerts, and center comparisons.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.schemas import AlertDB, BatchDB, QualityResultDB

router = APIRouter(prefix="", tags=["Analytics & Monitoring"])


@router.get("/analytics/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    """
    Returns executive KPI cards and summaries for the Quality Intelligence Dashboard.
    """
    return {
        "kpis": {
            "batches_assessed": {"value": 542, "unit": "batches", "change": "+14.2% vs last week"},
            "onions_analysed": {"value": 32840, "unit": "bulbs", "change": "+8.5% throughput"},
            "avg_grade_a": {"value": 78.4, "unit": "%", "status": "healthy"},
            "avg_urs": {"value": 15.6, "unit": "%", "status": "warning"},
            "defect_rate": {"value": 6.0, "unit": "%", "status": "critical_low"},
            "assessments_today": {"value": 24, "unit": "sessions", "status": "normal"}
        },
        "quality_distribution": [
            {"name": "Grade A (Prime)", "value": 78.4, "color": "#16A34A"},
            {"name": "URS (Borderline)", "value": 15.6, "color": "#D97706"},
            {"name": "Mechanical Damage", "value": 3.4, "color": "#DC2626"},
            {"name": "Rotten / Mold", "value": 1.2, "color": "#991B1B"},
            {"name": "Sprouted (Broken Dormancy)", "value": 1.4, "color": "#7C3AED"}
        ],
        "size_distribution": [
            {"range": "< 35 mm (Severe Under)", "percentage": 4.2},
            {"range": "35 - 40 mm (Chhata)", "percentage": 8.1},
            {"range": "40 - 50 mm (Medium A)", "percentage": 34.5},
            {"range": "50 - 65 mm (Bold A)", "percentage": 42.8},
            {"range": "> 65 mm (Extra Bold)", "percentage": 10.4}
        ],
        "center_comparison": [
            {"center": "Lasalgaon Yard", "batches": 142, "grade_a": 81.2, "defect_rate": 4.5},
            {"center": "Pimpalgaon Hub", "batches": 118, "grade_a": 76.4, "defect_rate": 5.8},
            {"center": "Yeola Sub-Yard", "batches": 89, "grade_a": 69.8, "defect_rate": 8.8},
            {"center": "Mahuva Cluster", "batches": 96, "grade_a": 84.1, "defect_rate": 3.9},
            {"center": "Dindori Center", "batches": 64, "grade_a": 73.5, "defect_rate": 6.4}
        ]
    }


@router.get("/analytics/trends")
def get_analytics_trends(timeframe: str = Query("30d", enum=["7d", "30d", "90d"])):
    """
    Returns time-series trend curves for Grade A, URS, defects, sprouting, and AI vs human difference.
    """
    if timeframe == "7d":
        points = [
            {"date": "22 Sep", "grade_a": 81.5, "urs": 13.5, "defects": 5.0, "sprouting": 1.2, "volume": 18, "ai_human_diff": 1.1},
            {"date": "23 Sep", "grade_a": 79.0, "urs": 16.0, "defects": 5.0, "sprouting": 1.4, "volume": 22, "ai_human_diff": 1.4},
            {"date": "24 Sep", "date_label": "24 Sep", "grade_a": 82.0, "urs": 13.0, "defects": 5.0, "sprouting": 0.9, "volume": 25, "ai_human_diff": 0.8},
            {"date": "25 Sep", "grade_a": 76.5, "urs": 17.5, "defects": 6.0, "sprouting": 2.1, "volume": 20, "ai_human_diff": 2.0},
            {"date": "26 Sep", "grade_a": 74.0, "urs": 18.0, "defects": 8.0, "sprouting": 2.8, "volume": 19, "ai_human_diff": 2.5},
            {"date": "27 Sep", "grade_a": 80.2, "urs": 14.8, "defects": 5.0, "sprouting": 1.5, "volume": 28, "ai_human_diff": 1.2},
            {"date": "28 Sep", "grade_a": 83.3, "urs": 13.3, "defects": 3.4, "sprouting": 1.1, "volume": 24, "ai_human_diff": 0.9}
        ]
    elif timeframe == "90d":
        points = [
            {"date": "Jul W1", "grade_a": 85.0, "urs": 11.0, "defects": 4.0, "sprouting": 0.5, "volume": 120, "ai_human_diff": 1.2},
            {"date": "Jul W3", "grade_a": 83.4, "urs": 12.6, "defects": 4.0, "sprouting": 0.8, "volume": 145, "ai_human_diff": 1.5},
            {"date": "Aug W1", "grade_a": 78.2, "urs": 16.0, "defects": 5.8, "sprouting": 1.8, "volume": 160, "ai_human_diff": 2.1},
            {"date": "Aug W3", "grade_a": 75.1, "urs": 17.9, "defects": 7.0, "sprouting": 2.5, "volume": 175, "ai_human_diff": 2.4},
            {"date": "Sep W1", "grade_a": 76.8, "urs": 16.2, "defects": 7.0, "sprouting": 2.1, "volume": 190, "ai_human_diff": 1.8},
            {"date": "Sep W3", "grade_a": 79.5, "urs": 15.0, "defects": 5.5, "sprouting": 1.4, "volume": 210, "ai_human_diff": 1.1}
        ]
    else:  # 30d
        points = [
            {"date": "01 Sep", "grade_a": 84.0, "urs": 12.0, "defects": 4.0, "sprouting": 0.8, "volume": 16, "ai_human_diff": 1.1},
            {"date": "05 Sep", "grade_a": 82.5, "urs": 13.5, "defects": 4.0, "sprouting": 1.0, "volume": 20, "ai_human_diff": 1.3},
            {"date": "10 Sep", "grade_a": 79.0, "urs": 15.5, "defects": 5.5, "sprouting": 1.6, "volume": 23, "ai_human_diff": 1.8},
            {"date": "15 Sep", "grade_a": 77.2, "urs": 16.8, "defects": 6.0, "sprouting": 2.2, "volume": 21, "ai_human_diff": 2.2},
            {"date": "20 Sep", "grade_a": 75.0, "urs": 17.5, "defects": 7.5, "sprouting": 2.9, "volume": 24, "ai_human_diff": 2.6},
            {"date": "25 Sep", "grade_a": 78.4, "urs": 15.6, "defects": 6.0, "sprouting": 1.8, "volume": 27, "ai_human_diff": 1.5},
            {"date": "28 Sep", "grade_a": 83.3, "urs": 13.3, "defects": 3.4, "sprouting": 1.1, "volume": 24, "ai_human_diff": 0.9}
        ]

    return {
        "timeframe": timeframe,
        "data": points
    }


@router.get("/alerts")
def get_active_alerts(db: Session = Depends(get_db)):
    alerts = db.query(AlertDB).order_by(AlertDB.created_at.desc()).all()
    results = []
    for a in alerts:
        results.append({
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "is_read": a.is_read,
            "created_at": str(a.created_at)
        })
    return results
