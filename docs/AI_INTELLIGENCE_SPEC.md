# PYAAZ-VISION: AI & Computer Vision Specification

## 1. Vision Architecture
The AI pipeline in PYAAZ-VISION is built upon a modular contract (`OnionInferenceEngine`) to decouple image acquisition, quality heuristics, bounding box detection, defect classification, metric sizing, and batch-level aggregation.

```
Incoming Image Stream
        │
        ▼
[ Stage 1: Optical Quality Heuristics ]
  • Laplacian Variance (Blur filter, threshold: 80.0)
  • Mean Luminosity (Luminance bounds: 45 - 215)
  • Color Space Coverage (Onion skin area ratio >= 4%)
  • Edge Congestion (Bulb overlap detection)
        │
        ▼
[ Stage 2: Onion Candidate Detection ]
  • HSV + LAB Skin Masking
  • Morphological Ellipse Filtering (Opening/Closing)
  • Contour Aspect Ratio & Area Filtering
        │
        ▼
[ Stage 3: Defect & Pathogen Classification ]
  • Apical Chlorophyll Detection (Sprouting Shoots)
  • Basal Plate Necrosis & Dark Patches (Black Mold / Rot)
  • High-Gradient Local Discontinuities (Mechanical Blade Cuts)
  • Papery Scale Intactness (Grade A vs URS)
        │
        ▼
[ Stage 4: Metric Reference Sizing ]
  • Reference Target: ₹10 Indian Coin (27.0 mm)
  • Pixel Ratio: Pixels per Millimeter calculation
  • APMC Standards:
    - Undersized / Chhata: < 40 mm
    - Standard Medium: 40 - 60 mm
    - Bold / Large: > 60 mm
        │
        ▼
[ Stage 5: Mathematical Grading & APMC Decision ]
  • Exact Count-to-Percentage Parity
  • Procurement Verdicts:
    - ACCEPTED_GRADE_A (Grade A >= 70%, Defect <= 10%)
    - CONDITIONALLY_ACCEPTED_URS (Discounted FAQ rate)
    - REJECTED_HIGH_DEFECTS (Defects > 10% or Rot > 4%)
```

## 2. Transitioning to a Trained YOLOv8 / YOLOv11 Model
The application is pre-architected with `YOLOUltralyticsProvider` in `ai/inference.py`:
1. Train custom YOLO weights on an annotated APMC onion dataset with classes:
   - `grade_a`, `urs`, `damaged`, `rotten`, `sprouted`
2. Save weights file to `ai/weights/best_onion_yolov8.pt`.
3. Install Ultralytics:
   ```bash
   pip install ultralytics
   ```
4. Activate the provider in `ai/inference.py` or switch via the `/settings` UI page.
