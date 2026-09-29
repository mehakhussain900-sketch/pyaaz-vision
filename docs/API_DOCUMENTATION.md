# PYAAZ-VISION: API Documentation

Base URL: `http://localhost:8000/api`  
Interactive Swagger Docs: `http://localhost:8000/docs`

---

## 1. Authentication
- `POST /api/auth/login`: Authenticate inspector credentials.
- `GET /api/auth/me`: Retrieve active session and badge credentials.

## 2. Procurement Centers
- `GET /api/centers`: Returns all active APMC centers with intake capacity, average Grade A, defect rates, and dispute rates.
- `GET /api/centers/{id}`: Detailed center profile.

## 3. Batches
- `GET /api/batches`: List incoming farm delivery lots with optional query filters:
  - `center_id`
  - `status`
  - `search`
- `POST /api/batches`: Register inward farmer truckload.
- `GET /api/batches/{id}`: Retrieve full batch lifecycle, assessments, and quality results.

## 4. Quality Assessments Workflow
- `POST /api/assessments`: Initialize new assessment session.
- `POST /api/assessments/{id}/samples`: Upload sample tray image (Sample 01, 02, etc.).
- `POST /api/assessments/{id}/analyze`: Run modular vision pipeline across sample trays.
- `GET /api/assessments/{id}`: Retrieve session details and findings.

## 5. Modular AI Engine
- `POST /api/ai/quality-check`: Evaluates image for blur (Laplacian variance), exposure, framing coverage, and bulb clustering.
- `POST /api/ai/analyze`: End-to-end computer-vision analysis with bounding box coordinates, class categorizations, and millimeter diameter estimation.
- `POST /api/ai/calibrate`: Computes `pixels_per_mm` scale factor given a known reference object diameter.

## 6. Human Verification & Disputes
- `POST /api/verification`: Record inspector sign-off (`ACCEPT_AI`, `REQUEST_REVIEW`, or `OVERRIDE` with mandatory justifications).
- `GET /api/verification/{assessment_id}`: Retrieve verification log.
- `POST /api/dispute`: Flag batch for APMC Dispute Arbitration Committee review.
- `GET /api/dispute/{assessment_id}`: Retrieve dispute case status (`Pending`, `Under Review`, `Resolved`).

## 7. Digital Quality Reports
- `GET /api/reports`: List generated digital assessment certificates.
- `GET /api/reports/{id}`: Retrieve full digital certificate with QR verification token.

## 8. Analytics & Monitoring
- `GET /api/analytics/overview`: Real-time KPI summaries for command center.
- `GET /api/analytics/trends`: Multi-metric time-series curves (`7d`, `30d`, `90d`).
- `GET /api/alerts`: Active operational notifications.
