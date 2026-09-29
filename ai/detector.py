"""
PYAAZ-VISION: Onion Detector Module
Detects individual onions from sample imagery using computer-vision contour segmentation
and color-space morphology, formatted identically to modern object detection models (YOLO).
"""
from typing import List, Dict, Any, Tuple
import cv2
import numpy as np


class OnionDetector:
    def __init__(self, min_area_ratio: float = 0.0015, max_area_ratio: float = 0.25):
        self.min_area_ratio = min_area_ratio
        self.max_area_ratio = max_area_ratio

    def detect_candidates(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        """
        Locates onion candidates using OpenCV color masking and contour filtering.
        Returns a list of candidate dictionaries with bounding boxes and crops.
        """
        if image_np is None or image_np.size == 0:
            return []

        height, width = image_np.shape[:2]
        img_area = height * width

        # Convert to HSV & LAB for robust onion skin segmentation
        hsv = cv2.cvtColor(image_np, cv2.COLOR_BGR2HSV)
        
        # Red/purple onion hues + copper skin
        mask1 = cv2.inRange(hsv, np.array([0, 30, 30]), np.array([25, 255, 255]))
        mask2 = cv2.inRange(hsv, np.array([140, 20, 20]), np.array([180, 255, 255]))
        combined_mask = cv2.bitwise_or(mask1, mask2)

        # Morphological smoothing to consolidate separate bulbs
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        cleaned = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel, iterations=1)

        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        candidates = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            area_ratio = area / img_area
            if self.min_area_ratio <= area_ratio <= self.max_area_ratio:
                x, y, w, h = cv2.boundingRect(cnt)
                # Ensure aspect ratio is somewhat round/elliptical like an onion
                aspect = float(w) / max(1, h)
                if 0.5 <= aspect <= 2.0:
                    candidates.append({
                        "bbox_px": [int(x), int(y), int(w), int(h)],
                        "bbox_norm": [
                            round(x / width, 4),
                            round(y / height, 4),
                            round(w / width, 4),
                            round(h / height, 4)
                        ],
                        "contour_area": int(area),
                        "aspect_ratio": round(aspect, 2)
                    })

        # Sort candidates spatially top-to-bottom, left-to-right
        candidates.sort(key=lambda c: (c["bbox_px"][1] // 50, c["bbox_px"][0]))
        return candidates
