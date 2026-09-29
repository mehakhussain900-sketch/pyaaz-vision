"""
PYAAZ-VISION: Batch Quality Grading & Statistical Aggregator
Computes batch-level metrics, mathematically verified percentages,
and procurement quality tier classifications.
"""
from typing import List, Dict, Any


class BatchQualityGrader:
    def __init__(
        self,
        min_grade_a_pct: float = 70.0,
        max_defect_rate_pct: float = 10.0,
        max_rotten_pct: float = 4.0
    ):
        self.min_grade_a_pct = min_grade_a_pct
        self.max_defect_rate_pct = max_defect_rate_pct
        self.max_rotten_pct = max_rotten_pct

    def compute_metrics(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates exact percentages and quality classifications from individual detections.
        Ensures percentages are mathematically consistent with detected counts.
        """
        total = len(detections)
        if total == 0:
            return {
                "total_detected": 0,
                "grade_a_count": 0,
                "grade_a_pct": 0.0,
                "urs_count": 0,
                "urs_pct": 0.0,
                "damaged_count": 0,
                "damaged_pct": 0.0,
                "rotten_count": 0,
                "rotten_pct": 0.0,
                "sprouted_count": 0,
                "sprouted_pct": 0.0,
                "undersized_count": 0,
                "undersized_pct": 0.0,
                "defect_count": 0,
                "defect_rate_pct": 0.0,
                "procurement_verdict": "INSUFFICIENT_DATA",
                "recommended_action": "Resample and recapture lot"
            }

        grade_a_cnt = sum(1 for d in detections if d.get("label") == "GRADE A")
        urs_cnt = sum(1 for d in detections if d.get("label") == "URS")
        damaged_cnt = sum(1 for d in detections if d.get("label") == "DAMAGED")
        rotten_cnt = sum(1 for d in detections if d.get("label") == "ROTTEN")
        sprouted_cnt = sum(1 for d in detections if d.get("label") == "SPROUTED")
        undersized_cnt = sum(1 for d in detections if d.get("is_undersized") is True)

        # Total defects = damaged + rotten + sprouted
        defect_cnt = damaged_cnt + rotten_cnt + sprouted_cnt

        grade_a_pct = round((grade_a_cnt / total) * 100.0, 1)
        urs_pct = round((urs_cnt / total) * 100.0, 1)
        damaged_pct = round((damaged_cnt / total) * 100.0, 1)
        rotten_pct = round((rotten_cnt / total) * 100.0, 1)
        sprouted_pct = round((sprouted_cnt / total) * 100.0, 1)
        undersized_pct = round((undersized_cnt / total) * 100.0, 1)
        defect_rate_pct = round((defect_cnt / total) * 100.0, 1)

        # Average diameter
        diameters = [d.get("diameter_mm") for d in detections if d.get("diameter_mm")]
        avg_diameter_mm = round(sum(diameters) / len(diameters), 1) if diameters else 52.0

        # Mean confidence
        confidences = [d.get("confidence", 0.90) for d in detections]
        avg_confidence = round(sum(confidences) / len(confidences), 2) if confidences else 0.92

        # APMC Procurement Verdict
        if rotten_pct > self.max_rotten_pct or defect_rate_pct > self.max_defect_rate_pct:
            verdict = "REJECTED_HIGH_DEFECTS"
            action = "Reject lot or require rigorous re-sorting by farmer before acceptance"
        elif grade_a_pct >= self.min_grade_a_pct:
            verdict = "ACCEPTED_GRADE_A"
            action = "Approve for Grade A standard procurement price"
        else:
            verdict = "CONDITIONALLY_ACCEPTED_URS"
            action = "Accept at discounted Under-Rated / Fair Average Quality (FAQ) rate"

        return {
            "total_detected": total,
            "grade_a_count": grade_a_cnt,
            "grade_a_pct": grade_a_pct,
            "urs_count": urs_cnt,
            "urs_pct": urs_pct,
            "damaged_count": damaged_cnt,
            "damaged_pct": damaged_pct,
            "rotten_count": rotten_cnt,
            "rotten_pct": rotten_pct,
            "sprouted_count": sprouted_cnt,
            "sprouted_pct": sprouted_pct,
            "undersized_count": undersized_cnt,
            "undersized_pct": undersized_pct,
            "defect_count": defect_cnt,
            "defect_rate_pct": defect_rate_pct,
            "avg_diameter_mm": avg_diameter_mm,
            "avg_confidence": avg_confidence,
            "procurement_verdict": verdict,
            "recommended_action": action
        }
