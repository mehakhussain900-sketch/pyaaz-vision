"""
PYAAZ-VISION: Size Calibration and Estimation Module
Uses metric reference calibration (e.g., standard calibration coin/card in mm)
to calculate real-world diameter of detected onions from pixel dimensions.
"""
from typing import Dict, Any, Optional, Tuple


class SizeEstimator:
    def __init__(
        self,
        reference_object_diameter_mm: float = 27.0,  # e.g., ₹10 coin (27mm) or standard 30mm/50mm reference disk
        default_pixels_per_mm: float = 4.2,         # Fallback when no reference target is in frame
        undersize_threshold_mm: float = 40.0,       # Government/APMC standard: < 40mm is typically undersized / chhata
        bold_threshold_mm: float = 60.0             # > 60mm is Bold / Large Grade A
    ):
        self.reference_object_diameter_mm = reference_object_diameter_mm
        self.pixels_per_mm = default_pixels_per_mm
        self.undersize_threshold_mm = undersize_threshold_mm
        self.bold_threshold_mm = bold_threshold_mm

    def calibrate(self, reference_pixel_width: float, reference_pixel_height: float, actual_diameter_mm: Optional[float] = None) -> float:
        """
        Calibrates pixels_per_mm based on a detected or manually selected reference object.
        """
        target_mm = actual_diameter_mm or self.reference_object_diameter_mm
        avg_pixel_diameter = (reference_pixel_width + reference_pixel_height) / 2.0
        if avg_pixel_diameter > 0 and target_mm > 0:
            self.pixels_per_mm = avg_pixel_diameter / target_mm
        return round(self.pixels_per_mm, 3)

    def estimate_onion_size(self, box_width_px: float, box_height_px: float) -> Dict[str, Any]:
        """
        Estimates the physical diameter of an onion from its pixel bounding box.
        Returns diameter in mm, size category, and whether it is undersized.
        """
        # Average dimension to approximate spherical onion diameter
        diameter_px = (box_width_px + box_height_px) / 2.0
        diameter_mm = round(diameter_px / max(0.1, self.pixels_per_mm), 1)

        if diameter_mm < self.undersize_threshold_mm:
            size_category = "UNDERSIZED"
            is_undersized = True
        elif diameter_mm <= self.bold_threshold_mm:
            size_category = "STANDARD_MEDIUM"
            is_undersized = False
        else:
            size_category = "BOLD_LARGE"
            is_undersized = False

        return {
            "diameter_px": round(diameter_px, 1),
            "diameter_mm": diameter_mm,
            "category": size_category,
            "is_undersized": is_undersized,
            "pixels_per_mm": round(self.pixels_per_mm, 2)
        }
