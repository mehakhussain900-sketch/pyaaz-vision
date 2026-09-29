"""
PYAAZ-VISION: Modular Onion Quality AI Inference Engine
Provides a decoupled inference interface compatible with both the
built-in OpenCV DemoInferenceProvider and production YOLO/Ultralytics models.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import cv2
import numpy as np
import io
from PIL import Image

from .detector import OnionDetector
from .classifier import DefectClassifier
from .size_estimator import SizeEstimator
from .image_quality import ImageQualityChecker
from .grading import BatchQualityGrader


class OnionInferenceEngine(ABC):
    """
    Abstract Base Class for all Onion Vision AI Inference Providers.
    Allows seamlessly swapping the Demo Provider for a trained YOLOv8/v11 model.
    """

    @abstractmethod
    def analyze_image(
        self,
        image_bytes: bytes,
        scenario: Optional[str] = None,
        reference_mm: Optional[float] = None
    ) -> Dict[str, Any]:
        """Runs the complete end-to-end vision pipeline on an image."""
        pass

    @abstractmethod
    def detect_onions(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        """Locates onion bounding boxes in the sample."""
        pass

    @abstractmethod
    def classify_defects(self, crop_np: np.ndarray, is_undersized: bool = False) -> Dict[str, Any]:
        """Classifies onion condition (Grade A, URS, Damaged, Rotten, Sprouted)."""
        pass

    @abstractmethod
    def estimate_size(self, bbox_px: List[int]) -> Dict[str, Any]:
        """Estimates onion diameter in millimeters."""
        pass

    @abstractmethod
    def calculate_quality(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Computes aggregate batch percentages and APMC recommendation."""
        pass


class DemoInferenceProvider(OnionInferenceEngine):
    """
    High-fidelity Demo Provider using OpenCV image processing combined with
    configurable SIH presentation scenarios.
    
    IMPORTANT: Clearly marked as an inference prototype for SIH demonstrations.
    """

    def __init__(self, reference_diameter_mm: float = 27.0):
        self.detector = OnionDetector()
        self.classifier = DefectClassifier()
        self.size_estimator = SizeEstimator(reference_object_diameter_mm=reference_diameter_mm)
        self.quality_checker = ImageQualityChecker()
        self.grader = BatchQualityGrader()
        self.provider_name = "PYAAZ-VISION Hybrid CV (Demo Mode)"

    def decode_image(self, image_bytes: bytes) -> np.ndarray:
        """Converts raw byte stream into an OpenCV BGR numpy array."""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is not None:
                return img
        except Exception:
            pass

        # Fallback using PIL
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    def check_quality(self, image_np: np.ndarray, scenario: Optional[str] = None) -> Dict[str, Any]:
        """Evaluates image suitability (blur, lighting, framing, overlap)."""
        if scenario == "poor_image":
            # Simulate low quality scenario for demonstration
            return {
                "is_acceptable": False,
                "overall_score": 42.5,
                "recommendation": "Recapture Recommended",
                "summary": "Motion blur detected (Laplacian Variance: 38.2) & severe shadow occlusion.",
                "checks": {
                    "blur": {
                        "metric": "Laplacian Variance",
                        "value": 38.2,
                        "threshold": 80.0,
                        "status": "FAIL",
                        "score": 38.2,
                        "message": "Heavy camera motion blur detected; keep device stationary"
                    },
                    "brightness": {
                        "metric": "Mean Luminance (0-255)",
                        "value": 41.0,
                        "status": "TOO_DARK",
                        "score": 35.0,
                        "message": "Lighting is too dark; increase ambient lighting"
                    },
                    "framing": {
                        "metric": "Sample Area Coverage",
                        "value": "2.1%",
                        "status": "POOR_COVERAGE",
                        "score": 25.0,
                        "message": "Onions are far from center frame"
                    },
                    "overlap": {
                        "metric": "Edge Congestion Index",
                        "value": 0.28,
                        "status": "HIGH_CLUTTER",
                        "score": 35.0,
                        "message": "Multiple layers stacked"
                    }
                }
            }
        return self.quality_checker.evaluate(image_np)

    def detect_onions(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        return self.detector.detect_candidates(image_np)

    def classify_defects(self, crop_np: np.ndarray, is_undersized: bool = False, scenario_hint: str = None) -> Dict[str, Any]:
        return self.classifier.classify_crop(crop_np, is_undersized=is_undersized, scenario_hint=scenario_hint)

    def estimate_size(self, bbox_px: List[int]) -> Dict[str, Any]:
        w, h = bbox_px[2], bbox_px[3]
        return self.size_estimator.estimate_onion_size(w, h)

    def calculate_quality(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.grader.compute_metrics(detections)

    def analyze_image(
        self,
        image_bytes: bytes,
        scenario: Optional[str] = None,
        reference_mm: Optional[float] = None
    ) -> Dict[str, Any]:
        if reference_mm:
            self.size_estimator.reference_object_diameter_mm = reference_mm

        image_np = self.decode_image(image_bytes)
        height, width = image_np.shape[:2]

        # 1. Quality pre-check
        quality_eval = self.check_quality(image_np, scenario=scenario)

        # 2. Candidate Detection
        raw_candidates = self.detect_onions(image_np)

        # If image has fewer than 5 natural contours or an explicit scenario is set,
        # generate realistic simulated grid detections tailored to the demonstration scenario
        detections = []
        target_count = 14  # Standard representative sample tray size

        if len(raw_candidates) >= 6 and scenario not in (
            "high_quality", "high_undersized", "high_damage", "high_sprouting", "ai_human_disagreement"
        ):
            # Use real CV detected contours
            for i, cand in enumerate(raw_candidates[:24]):
                x, y, w, h = cand["bbox_px"]
                crop = image_np[max(0, y):min(height, y + h), max(0, x):min(width, x + w)]
                size_info = self.size_estimator.estimate_onion_size(w, h)
                cls_info = self.classify_defects(crop, is_undersized=size_info["is_undersized"])

                detections.append({
                    "onion_id": f"ONION-{i+1:02d}",
                    "bbox_px": [x, y, w, h],
                    "bbox_norm": cand["bbox_norm"],
                    "label": cls_info["label"],
                    "defect_type": cls_info["defect_type"],
                    "diameter_mm": size_info["diameter_mm"],
                    "size_category": size_info["category"],
                    "is_undersized": size_info["is_undersized"],
                    "confidence": cls_info["confidence"],
                    "evidence": cls_info["evidence"]
                })
        else:
            # Generate mathematically consistent demo scenario bounding boxes
            detections = self._generate_scenario_detections(width, height, scenario)

        # 3. Aggregate Batch Metrics
        batch_metrics = self.calculate_quality(detections)

        return {
            "provider": self.provider_name,
            "is_demo_mode": True,
            "scenario": scenario or "standard",
            "image_dimensions": {"width": width, "height": height},
            "quality_check": quality_eval,
            "detections": detections,
            "summary_metrics": batch_metrics,
            "disclaimer": "DEMO INFERENCE PROVIDER: Confidence values and detections are generated for SIH validation testing and do not represent a certified model."
        }

    def _generate_scenario_detections(self, width: int, height: int, scenario: Optional[str]) -> List[Dict[str, Any]]:
        """
        Synthesizes a realistic distribution of bounding boxes across the tray
        matching the desired demonstration narrative with exact mathematical consistency.
        """
        cols = 5
        rows = 3
        total_slots = cols * rows  # 15 onions
        
        # Scenarios distribution setup:
        # labels sequence
        if scenario == "high_quality":
            # 13 Grade A, 1 URS, 1 Damaged
            label_plan = ["GRADE A"] * 13 + ["URS", "DAMAGED"]
        elif scenario == "high_undersized":
            # 5 Grade A, 8 Undersized URS, 2 Damaged
            label_plan = ["GRADE A"] * 5 + ["URS"] * 8 + ["DAMAGED"] * 2
        elif scenario == "high_damage":
            # 6 Grade A, 3 URS, 5 Damaged, 1 Rotten
            label_plan = ["GRADE A"] * 6 + ["URS"] * 3 + ["DAMAGED"] * 5 + ["ROTTEN"]
        elif scenario == "high_sprouting":
            # 5 Grade A, 3 URS, 6 Sprouted, 1 Rotten
            label_plan = ["GRADE A"] * 5 + ["URS"] * 3 + ["SPROUTED"] * 6 + ["ROTTEN"]
        elif scenario == "ai_human_disagreement":
            # Borderline batch where AI detects subtle internal rot / sprouting risk
            label_plan = ["GRADE A"] * 8 + ["URS"] * 4 + ["DAMAGED"] * 2 + ["ROTTEN"]
        else:
            # Standard balanced harvest: 10 Grade A, 3 URS, 1 Damaged, 1 Sprouted
            label_plan = ["GRADE A"] * 10 + ["URS"] * 3 + ["DAMAGED"] * 1 + ["SPROUTED"] * 1

        margin_x = int(width * 0.08)
        margin_y = int(height * 0.10)
        usable_w = width - (2 * margin_x)
        usable_h = height - (2 * margin_y)
        cell_w = usable_w // cols
        cell_h = usable_h // rows

        detections = []
        for idx, label in enumerate(label_plan[:total_slots]):
            r = idx // cols
            c = idx % cols
            
            # Add subtle natural jitter to boxes
            jitter_x = int((hash(f"jx{idx}") % 15) - 7)
            jitter_y = int((hash(f"jy{idx}") % 15) - 7)
            
            box_w = int(cell_w * 0.72)
            box_h = int(cell_h * 0.72)
            box_x = margin_x + c * cell_w + (cell_w - box_w) // 2 + jitter_x
            box_y = margin_y + r * cell_h + (cell_h - box_h) // 2 + jitter_y

            # Keep inside bounds
            box_x = max(5, min(width - box_w - 5, box_x))
            box_y = max(5, min(height - box_h - 5, box_y))

            is_undersized = (label == "URS" and (scenario == "high_undersized" or idx % 2 == 0))
            if is_undersized:
                diameter_mm = round(34.0 + (idx % 5), 1)
                size_cat = "UNDERSIZED"
            elif label == "GRADE A":
                diameter_mm = round(52.0 + (idx % 14), 1)
                size_cat = "BOLD_LARGE" if diameter_mm > 60 else "STANDARD_MEDIUM"
            else:
                diameter_mm = round(44.0 + (idx % 10), 1)
                size_cat = "STANDARD_MEDIUM"

            # Classification evidence
            if label == "GRADE A":
                defect_type = "None (Healthy)"
                evidence = "Uniform globe shape, dry outer papery scales, dry neck collar"
                confidence = round(0.92 + (idx % 6) * 0.01, 2)
            elif label == "URS":
                defect_type = "Undersized / Minor Peeling" if is_undersized else "Partial Scale Peeling"
                evidence = "Bulb diameter below 40mm APMC standard" if is_undersized else "Outer skin partially detached; flesh intact"
                confidence = round(0.89 + (idx % 5) * 0.01, 2)
            elif label == "DAMAGED":
                defect_type = "Mechanical Harvest Cut"
                evidence = "Transverse blade slice across second fleshy scale"
                confidence = round(0.87 + (idx % 4) * 0.02, 2)
            elif label == "ROTTEN":
                defect_type = "Black Mold (Aspergillus niger)"
                evidence = "Dark necrotic sporulation cluster detected at basal plate"
                confidence = round(0.91 + (idx % 3) * 0.02, 2)
            elif label == "SPROUTED":
                defect_type = "Apical Shoot Emergence"
                evidence = "Active green chlorophyll shoot emergent from apex (length 18mm)"
                confidence = round(0.94 + (idx % 4) * 0.01, 2)

            detections.append({
                "onion_id": f"ONION-{idx+1:02d}",
                "bbox_px": [box_x, box_y, box_w, box_h],
                "bbox_norm": [
                    round(box_x / width, 4),
                    round(box_y / height, 4),
                    round(box_w / width, 4),
                    round(box_h / height, 4)
                ],
                "label": label,
                "defect_type": defect_type,
                "diameter_mm": diameter_mm,
                "size_category": size_cat,
                "is_undersized": is_undersized,
                "confidence": confidence,
                "evidence": evidence
            })

        return detections


class YOLOUltralyticsProvider(OnionInferenceEngine):
    """
    Production-ready skeleton for Ultralytics YOLOv8 / YOLOv11 integration.
    Allows seamlessly dropping in a `best.pt` weights file without altering API consumers.
    """

    def __init__(self, model_weights_path: str = "ai/weights/best_onion_yolov8.pt"):
        self.weights_path = model_weights_path
        self.model = None  # Loaded lazily when ultralytics is installed

    def load_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.weights_path)
        except ImportError:
            raise RuntimeError(
                "Ultralytics is not installed. To activate real YOLO inference, run: pip install ultralytics"
            )

    def analyze_image(self, image_bytes: bytes, scenario: Optional[str] = None, reference_mm: Optional[float] = None) -> Dict[str, Any]:
        if not self.model:
            self.load_model()
        # In production:
        # results = self.model.predict(image)
        # Parse detections and calculate quality
        raise NotImplementedError("Real YOLO weights not yet provisioned. Use DemoInferenceProvider.")

    def detect_onions(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        raise NotImplementedError()

    def classify_defects(self, crop_np: np.ndarray, is_undersized: bool = False) -> Dict[str, Any]:
        raise NotImplementedError()

    def estimate_size(self, bbox_px: List[int]) -> Dict[str, Any]:
        raise NotImplementedError()

    def calculate_quality(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        raise NotImplementedError()


# Global Singleton / Factory
_engine_instance: Optional[OnionInferenceEngine] = None

def get_inference_engine(provider: str = "demo") -> OnionInferenceEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = DemoInferenceProvider()
    return _engine_instance
