# PYAAZ-VISION: System Architecture & Technical Design

## 1. Overview
**PYAAZ-VISION** is an AI-powered enterprise procurement quality intelligence platform designed for Agricultural Produce Market Committees (APMCs), central buffer agencies (NAFED, NCCF), and onion dehydration clusters. It eliminates subjective, inspector-dependent disputes through standardized optical scanning, automated defect detection, reference-calibrated sizing, and tamper-evident digital quality certificates.

```
+-----------------------------------------------------------------------------------+
|                              PYAAZ-VISION PLATFORM                                |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ PRESENTATION LAYER (React + Vite + Tailwind + Lucide + Recharts) ]             |
|  • Dashboard (Command Center & Real-time KPIs)                                   |
|  • 5-Step Assessment Workflow (Batch Info -> Sampling -> Quality -> AI -> Result)|
|  • AI Vision Inspection (Interactive Bounding Boxes & Evidence Drawer)            |
|  • Batch Intelligence (Multi-tray Variance & Sizing Distribution)                 |
|  • Tamper-Evident Digital Certificates (QR Audit Token & Verification)           |
|                                     |                                             |
|                                     v (REST API / CORS)                           |
|                                                                                   |
|  [ BACKEND CORE (FastAPI + Pydantic + Uvicorn) ]                                 |
|  • /api/auth       - Inspector session identity & RBAC                           |
|  • /api/centers    - APMC yard intake management                                 |
|  • /api/batches    - Inward farm delivery lots & metadata                        |
|  • /api/assessments- Multi-sample session orchestration                          |
|  • /api/ai         - Vision pipeline, quality heuristics, calibration            |
|  • /api/verification- Human-in-the-loop override & dispute arbitration           |
|  • /api/reports    - Digital certificate generation & verification               |
|  • /api/analytics  - Aggregated time-series quality trajectories                 |
|                                     |                                             |
|                   +-----------------+-----------------+                           |
|                   |                                   |                           |
|                   v                                   v                           |
|  [ MODULAR AI ENGINE ]               [ DATA PERSISTENCE LAYER ]                  |
|  • OnionInferenceEngine (ABC)         • PostgreSQL / Supabase Architecture        |
|  • DemoInferenceProvider (CV)         • SQLite Local Fallback Engine             |
|  • OnionDetector (HSV / Contours)     • Relational Tables:                       |
|  • DefectClassifier (Rot/Sprout/Cut)    - users, centers, batches                |
|  • SizeEstimator (mm Calibration)       - sessions, sample_images                |
|  • QualityChecker (Blur / Exposure)     - detections, quality_results            |
|  • BatchQualityGrader (Parity Engine)   - verifications, reviews, reports        |
|  • YOLOUltralyticsProvider (Ready)                                                |
+-----------------------------------------------------------------------------------+
```

## 2. Core Modules

### 2.1 Modular AI Layer (`ai/`)
- **`OnionInferenceEngine`**: Abstract Base Class defining standard contracts for `analyze_image`, `detect_onions`, `classify_defects`, `estimate_size`, and `calculate_quality`.
- **`DemoInferenceProvider`**: Implemented using OpenCV for morphological candidate segmentation, Laplacian focus validation, color-space HSV vegetative shoot detection, and deterministic scenario generation for pitch demonstrations.
- **`SizeEstimator`**: Uses a known reference object (e.g. standard ₹10 coin = 27mm or 50mm reference disk) to compute real-world millimeter diameters from pixel bounding boxes.
- **`YOLOUltralyticsProvider`**: Production skeleton ready to load custom trained YOLOv8 / YOLOv11 weights without rewriting client code.

### 2.2 Human-in-the-Loop & Dispute Arbitration
- **Accept AI Result**: Validates computer vision outputs and signs off on procurement lot.
- **Override Values**: Allows inspectors to provide adjusted manual grades with mandatory technical justifications.
- **Flag for Review**: Escalates borderline lots to the APMC Dispute Arbitration Committee for secondary sampling.

### 2.3 Data Integrity & Mathematical Parity
All category counts ($N_{\text{Grade A}} + N_{\text{URS}} + N_{\text{Damaged}} + N_{\text{Rotten}} + N_{\text{Sprouted}}$) mathematically equal total bulbs detected ($N_{\text{total}}$), ensuring 100% accounting transparency.
