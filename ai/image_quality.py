"""
PYAAZ-VISION: Image Quality Assessment Module
Performs non-referential quality heuristics on input onion sample images:
- Blur detection (Laplacian variance)
- Brightness & illumination distribution
- Framing & onion visibility
- Overlap & crowding heuristics
"""
from typing import Dict, Any, Tuple
import cv2
import numpy as np


class ImageQualityChecker:
    def __init__(
        self,
        blur_threshold: float = 80.0,
        min_brightness: float = 45.0,
        max_brightness: float = 215.0,
        min_coverage: float = 0.04
    ):
        self.blur_threshold = blur_threshold
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness
        self.min_coverage = min_coverage

    def evaluate(self, image_np: np.ndarray) -> Dict[str, Any]:
        """
        Evaluates the quality of an onion sample image.
        Returns detailed check results, overall score, and whether recapture is recommended.
        """
        if image_np is None or image_np.size == 0:
            return {
                "is_acceptable": False,
                "overall_score": 0.0,
                "recommendation": "Recapture Recommended",
                "summary": "Invalid or unreadable image stream.",
                "checks": {}
            }

        height, width = image_np.shape[:2]
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if len(image_np.shape) == 3 else image_np

        # 1. Blur Detection using Laplacian Variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        blur_status = "PASS" if laplacian_var >= self.blur_threshold else "FAIL"
        blur_score = min(100.0, max(0.0, (laplacian_var / 180.0) * 100.0))

        # 2. Brightness & Exposure check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < self.min_brightness:
            brightness_status = "TOO_DARK"
            brightness_score = max(10.0, (mean_brightness / self.min_brightness) * 50.0)
        elif mean_brightness > self.max_brightness:
            brightness_status = "OVEREXPOSED"
            brightness_score = max(10.0, ((255 - mean_brightness) / (255 - self.max_brightness)) * 50.0)
        else:
            brightness_status = "PASS"
            brightness_score = 100.0 - abs(mean_brightness - 128.0) * 0.4

        # 3. Framing & Onion Color/Contour Coverage
        # Convert to HSV to detect onion-like hues (red/purple/yellow/brownish skin)
        if len(image_np.shape) == 3:
            hsv = cv2.cvtColor(image_np, cv2.COLOR_BGR2HSV)
            # Red/purple onion & yellow skin mask
            lower_red1 = np.array([0, 40, 40])
            upper_red1 = np.array([25, 255, 255])
            lower_red2 = np.array([160, 40, 40])
            upper_red2 = np.array([180, 255, 255])
            mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            onion_mask = cv2.bitwise_or(mask1, mask2)
            coverage_ratio = float(np.count_nonzero(onion_mask) / (height * width))
        else:
            coverage_ratio = 0.15

        framing_pass = coverage_ratio >= self.min_coverage
        framing_status = "PASS" if framing_pass else "POOR_COVERAGE"
        framing_score = min(100.0, (coverage_ratio / 0.12) * 100.0)

        # 4. Overlap & Cluttering heuristic
        # Based on contour density vs image area
        blur_smooth = cv2.GaussianBlur(gray, (7, 7), 0)
        edges = cv2.Canny(blur_smooth, 40, 140)
        edge_density = float(np.count_nonzero(edges) / (height * width))
        overlap_status = "PASS" if edge_density < 0.22 else "HIGH_CLUTTER"
        overlap_score = 100.0 - (max(0.0, edge_density - 0.10) * 400.0)
        overlap_score = min(100.0, max(20.0, overlap_score))

        # Overall weighted score
        overall_score = round(
            0.35 * blur_score + 0.25 * brightness_score + 0.25 * framing_score + 0.15 * overlap_score,
            1
        )

        critical_failures = []
        if blur_status == "FAIL":
            critical_failures.append("Motion blur or out-of-focus detected")
        if brightness_status in ("TOO_DARK", "OVEREXPOSED"):
            critical_failures.append(f"Sub-optimal lighting conditions ({brightness_status})")
        if framing_status == "POOR_COVERAGE":
            critical_failures.append("Insufficient onion visibility or framing")

        is_acceptable = len(critical_failures) == 0 and overall_score >= 60.0
        recommendation = "Acceptable for Inference" if is_acceptable else "Recapture Recommended"

        return {
            "is_acceptable": is_acceptable,
            "overall_score": overall_score,
            "recommendation": recommendation,
            "summary": "Sample image meets quality thresholds for automated grading." if is_acceptable else " ".join(critical_failures),
            "checks": {
                "blur": {
                    "metric": "Laplacian Variance",
                    "value": round(laplacian_var, 1),
                    "threshold": self.blur_threshold,
                    "status": blur_status,
                    "score": round(blur_score, 1),
                    "message": "Focus is sharp" if blur_status == "PASS" else "Image appears blurred; hold camera steady"
                },
                "brightness": {
                    "metric": "Mean Luminance (0-255)",
                    "value": round(mean_brightness, 1),
                    "status": brightness_status,
                    "score": round(brightness_score, 1),
                    "message": "Illumination is balanced" if brightness_status == "PASS" else f"Lighting is {brightness_status.lower()}"
                },
                "framing": {
                    "metric": "Sample Area Coverage",
                    "value": f"{round(coverage_ratio * 100, 1)}%",
                    "status": framing_status,
                    "score": round(framing_score, 1),
                    "message": "Onion lot is centered and clearly visible" if framing_pass else "Ensure onions occupy the main frame"
                },
                "overlap": {
                    "metric": "Edge Congestion Index",
                    "value": round(edge_density, 3),
                    "status": overlap_status,
                    "score": round(overlap_score, 1),
                    "message": "Acceptable layer separation" if overlap_status == "PASS" else "Onions are heavily overlapped; spread out slightly"
                }
            }
        }
