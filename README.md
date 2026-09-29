# PYAAZ-VISION: AI-Powered Onion Quality Intelligence & Procurement Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)

---

## Executive Overview

**PYAAZ-VISION** is an enterprise-grade digital quality assessment and procurement platform designed to standardize onion grading at Agricultural Produce Market Committee (APMC) mandis and central buffer procurement centers.

Traditional quality grading of onions is manual, subjective, and prone to disputes. PYAAZ-VISION introduces computer-vision-assisted batch assessment, objective metric diameter calibration, multi-sample aggregation, human-in-the-loop verification, and cryptographic digital audit reports.

---

## Key Features & Modules

1. **Role-Based Authentication & Access Control**
   - Built-in profiles for **Administrator**, **Procurement Officer**, **Quality Reviewer**, and **Inspecting Officer**.
   - Session tokens, protected routes, and credential validation.

2. **End-to-End 5-Step Assessment Workflow**
   - **Step 1: Inward Batch Identification**: Farmer details, APMC yard registration, inward lot weight, and vehicle tracking.
   - **Step 2: Optical Sampling Trays**: Support for multi-tray sample capture (add/remove trays, upload high-res images, camera capture).
   - **Step 3: Automated Optical Quality Screening**: Laplacian blur variance, illumination/brightness levels, sample framing coverage, and bulb separation/congestion checks (PASS / WARNING / RECAPTURE REQUIRED).
   - **Step 4: AI Quality Intelligence Pipeline**: Modular candidate segmentation, defect classification (rot, apical sprouting, mechanical harvest cuts), metric diameter sizing, and APMC grade aggregation.
   - **Step 5: Batch Quality Composition & Parity**: Mathematical consistency check ensuring counts directly match reported percentages.

3. **Human-in-the-Loop Verification & Arbitration**
   - **Accept AI Result**: Validates computer vision detections and records officer sign-off.
   - **Manual Override**: Requires formal technical justification and logs AI vs. human variance.
   - **Dispute Flagging**: Direct escalation to the APMC Dispute Arbitration Committee.

4. **Digital Quality Certificate & QR Verification**
   - Printable certificate with cryptographic QR audit token.
   - Dedicated QR Verification Portal (`/verify/:code`) displaying lot authenticity, parameters, and inspector sign-off.

5. **Batch Intelligence & Analytics**
   - Multi-tray cross-consistency comparisons, variance analysis, defect trends, and APMC center intake statistics.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v6 |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn |
| **Database** | SQLite (development) / PostgreSQL (enterprise schema included) |
| **Computer Vision / AI** | OpenCV (cv2), NumPy, Modular `OnionInferenceEngine` interface |

---

## Quick Start / Local Installation

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### 1. Backend Setup
```bash
# From project root
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev
```
Platform UI will be live at: `http://localhost:5173`

---

## Demo Credentials

For testing and evaluation, pre-configured roles are available on the login page:

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@pyaazvision.gov.in` | `admin123` |
| **Procurement Officer** | `officer@pyaazvision.gov.in` | `officer123` |
| **Quality Reviewer** | `reviewer@pyaazvision.gov.in` | `reviewer123` |
| **Inspecting Officer** | `inspector@pyaazvision.gov.in` | `inspect123` |

---

## Modular AI Engine Architecture

The AI layer is structured around an abstract base class (`ai/inference.py`):
```python
class OnionInferenceEngine(ABC):
    @abstractmethod
    def analyze_tray(self, image_input, reference_diameter_mm: float = 27.0) -> Dict[str, Any]:
        pass
```

- **`DemoInferenceProvider`**: Fast, deterministic hybrid computer-vision fallback provider using HSV color thresholding, contour extraction, Laplacian gradient sharpness, and metric reference calibration.
- **`YOLOUltralyticsProvider`**: Production skeleton ready for weights (`best.pt`) trained on annotated onion datasets.

---

## Project Structure

```
pyaaz-vision/
├── ai/                      # Computer vision & inference engine modules
│   ├── classifier.py        # Defect feature classification (rot, sprouting, cuts)
│   ├── detector.py          # Onion contour segmentation & localization
│   ├── grading.py           # APMC grade composition & mathematical parity
│   ├── image_quality.py     # Optical screening (blur, brightness, framing)
│   ├── inference.py         # Modular inference engine ABC & providers
│   └── size_estimator.py    # Metric diameter calibration
├── backend/                 # FastAPI REST API
│   ├── app/
│   │   ├── api/             # Routers (auth, centers, batches, assessments, reports...)
│   │   ├── core/            # Config & SQLAlchemy database engine
│   │   ├── models/          # Schemas and DB ORM models
│   │   └── services/        # Database seeders & demo data
│   └── requirements.txt
├── database/
│   └── schema.sql           # Production PostgreSQL DDL
├── docs/                    # Architecture & API specifications
└── frontend/                # React Vite TypeScript frontend
    ├── src/
    │   ├── components/      # UI components (Navbar, Sidebar, Layout...)
    │   ├── context/         # AuthContext & DemoContext
    │   ├── pages/           # All application routes (Dashboard, NewAssessment, QRVerify...)
    │   └── services/        # Resilient API client & mock datasets
    └── package.json
```

---

## License & Evaluation Notice

Built for the **Smart India Hackathon (SIH)**. This prototype platform demonstrates computer vision and data architecture capabilities. All QR verification tokens and audit certificates are representative prototypes for platform validation.
