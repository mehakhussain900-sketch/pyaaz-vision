"""
PYAAZ-VISION: AI Inference API Endpoints
Provides direct access to image quality heuristics, modular AI vision analysis,
and reference-object millimeter calibration.
"""
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import cv2
import numpy as np

import sys
import os
# Ensure root workspace can import `ai` package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from ai import get_inference_engine
from ..models.schemas import CalibrateRequest

router = APIRouter(prefix="/ai", tags=["AI Quality Intelligence"])


@router.post("/quality-check")
async def check_image_quality(
    file: Optional[UploadFile] = File(None),
    scenario: Optional[str] = Form(None)
):
    """
    Evaluates image suitability:
    - Blur (Laplacian variance)
    - Brightness / exposure
    - Framing & onion visibility
    - Overlap congestion
    """
    engine = get_inference_engine()

    if file and file.filename:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image stream")
        return engine.check_quality(img, scenario=scenario)

    # If no file provided, evaluate using demo standard tray image
    dummy_tray = np.full((600, 800, 3), 180, dtype=np.uint8)
    return engine.check_quality(dummy_tray, scenario=scenario)


@router.post("/analyze")
async def analyze_onion_image(
    file: Optional[UploadFile] = File(None),
    scenario: Optional[str] = Form("standard"),
    reference_diameter_mm: Optional[float] = Form(27.0)
):
    """
    Runs full modular vision pipeline:
    - Image quality pre-check
    - Bounding box candidate localization
    - Defect & class categorization (Grade A, URS, Damaged, Rotten, Sprouted)
    - Metric diameter calculation in mm
    - APMC batch grade recommendation
    """
    engine = get_inference_engine()

    if file and file.filename:
        image_bytes = await file.read()
    else:
        # Generate representative sample image bytes
        dummy = np.full((600, 800, 3), (120, 140, 180), dtype=np.uint8)
        _, buf = cv2.imencode('.jpg', dummy)
        image_bytes = buf.tobytes()

    result = engine.analyze_image(
        image_bytes=image_bytes,
        scenario=scenario,
        reference_mm=reference_diameter_mm
    )
    return result


@router.post("/calibrate")
def calibrate_scale(payload: CalibrateRequest):
    """
    Calibrates pixels_per_mm using a known reference object (e.g. ₹10 coin = 27mm).
    """
    engine = get_inference_engine()
    px_per_mm = engine.size_estimator.calibrate(
        reference_pixel_width=payload.measured_pixel_diameter,
        reference_pixel_height=payload.measured_pixel_diameter,
        actual_diameter_mm=payload.reference_object_diameter_mm
    )

    return {
        "status": "CALIBRATED",
        "reference_diameter_mm": payload.reference_object_diameter_mm,
        "measured_pixel_diameter": payload.measured_pixel_diameter,
        "pixels_per_mm": px_per_mm,
        "undersize_threshold_mm": engine.size_estimator.undersize_threshold_mm,
        "bold_threshold_mm": engine.size_estimator.bold_threshold_mm
    }
