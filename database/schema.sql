-- PYAAZ-VISION: Database Architecture Schema
-- Compatible with PostgreSQL 14+ / Supabase
-- Enterprise Procurement & AI Quality Intelligence Platform

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'inspector', -- inspector, supervisor, center_manager, admin
    badge_number VARCHAR(50) UNIQUE,
    center_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROCUREMENT CENTERS (APMCs, NAFED, NCCF Collection Hubs)
CREATE TABLE IF NOT EXISTS procurement_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. APMC-LASALGAON-01
    name VARCHAR(200) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    capacity_mt NUMERIC(10, 2) DEFAULT 5000.0,
    active_intake BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BATCHES (Inward farm delivery lots)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. BATCH-2026-NSK-0941
    center_id UUID NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
    supplier_farmer_id VARCHAR(100) NOT NULL,
    farmer_name VARCHAR(200) NOT NULL,
    farmer_contact VARCHAR(20),
    variety VARCHAR(100) NOT NULL DEFAULT 'Nashik Red / Garwa', -- Garwa, Pol, Rangda, Late Kharif, White
    total_lot_weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 5000.0,
    vehicle_number VARCHAR(50),
    arrival_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_ASSESSMENT', -- PENDING_ASSESSMENT, ASSESSED, VERIFIED, UNDER_REVIEW, APPROVED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSESSMENT SESSIONS
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES users(id),
    inspector_name VARCHAR(150) NOT NULL,
    sample_size_count INTEGER NOT NULL DEFAULT 60,
    reference_object_diameter_mm NUMERIC(5, 2) DEFAULT 27.0,
    stage VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- SAMPLING, QUALITY_CHECK, AI_ANALYZING, COMPLETED
    is_demo_mode BOOLEAN NOT NULL DEFAULT TRUE,
    scenario VARCHAR(50) DEFAULT 'standard',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SAMPLE IMAGES (Sample 01, Sample 02, etc.)
CREATE TABLE IF NOT EXISTS sample_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    sample_index INTEGER NOT NULL, -- 1, 2, 3, 4
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    blur_score NUMERIC(5, 2),
    brightness_score NUMERIC(5, 2),
    framing_score NUMERIC(5, 2),
    is_acceptable BOOLEAN NOT NULL DEFAULT TRUE,
    quality_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DETECTIONS (Individual detected onions)
CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_image_id UUID NOT NULL REFERENCES sample_images(id) ON DELETE CASCADE,
    onion_code VARCHAR(50) NOT NULL, -- ONION-01, ONION-02
    bbox_x INTEGER NOT NULL,
    bbox_y INTEGER NOT NULL,
    bbox_w INTEGER NOT NULL,
    bbox_h INTEGER NOT NULL,
    diameter_mm NUMERIC(5, 2) NOT NULL,
    size_category VARCHAR(50) NOT NULL, -- UNDERSIZED, STANDARD_MEDIUM, BOLD_LARGE
    quality_class VARCHAR(50) NOT NULL, -- GRADE A, URS, DAMAGED, ROTTEN, SPROUTED
    defect_type VARCHAR(100),
    confidence NUMERIC(4, 3) NOT NULL, -- Demo inference confidence
    evidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. QUALITY RESULTS (Batch & Assessment aggregate metrics)
CREATE TABLE IF NOT EXISTS quality_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID UNIQUE NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    total_onions_detected INTEGER NOT NULL,
    grade_a_count INTEGER NOT NULL,
    grade_a_pct NUMERIC(5, 2) NOT NULL,
    urs_count INTEGER NOT NULL,
    urs_pct NUMERIC(5, 2) NOT NULL,
    damaged_count INTEGER NOT NULL,
    damaged_pct NUMERIC(5, 2) NOT NULL,
    rotten_count INTEGER NOT NULL,
    rotten_pct NUMERIC(5, 2) NOT NULL,
    sprouted_count INTEGER NOT NULL,
    sprouted_pct NUMERIC(5, 2) NOT NULL,
    undersized_count INTEGER NOT NULL,
    undersized_pct NUMERIC(5, 2) NOT NULL,
    defect_count INTEGER NOT NULL,
    defect_rate_pct NUMERIC(5, 2) NOT NULL,
    average_diameter_mm NUMERIC(5, 2),
    average_confidence NUMERIC(4, 3),
    procurement_verdict VARCHAR(100) NOT NULL,
    recommended_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. HUMAN VERIFICATIONS (Dual AI + Human workflow)
CREATE TABLE IF NOT EXISTS human_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES users(id),
    inspector_name VARCHAR(150) NOT NULL,
    action VARCHAR(50) NOT NULL, -- ACCEPT_AI, REQUEST_REVIEW, OVERRIDE
    ai_grade_a_pct NUMERIC(5, 2) NOT NULL,
    ai_urs_pct NUMERIC(5, 2) NOT NULL,
    ai_defect_pct NUMERIC(5, 2) NOT NULL,
    final_grade_a_pct NUMERIC(5, 2) NOT NULL,
    final_urs_pct NUMERIC(5, 2) NOT NULL,
    final_defect_pct NUMERIC(5, 2) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. REVIEW CASES (Disputes and manual arbitration)
CREATE TABLE IF NOT EXISTS review_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    flagged_by_name VARCHAR(150) NOT NULL,
    reason VARCHAR(100) NOT NULL, -- AI result appears inconsistent, Poor image, Sampling concern, Manual verification required, Other
    explanation TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Under Review, Resolved
    resolution_notes TEXT,
    resolved_by_name VARCHAR(150),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. DIGITAL QUALITY REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_code VARCHAR(100) UNIQUE NOT NULL, -- e.g. RPT-PV-2026-9812
    assessment_id UUID UNIQUE NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title VARCHAR(200) DEFAULT 'Prototype Digital Quality Assessment Report',
    qr_verification_code VARCHAR(255) NOT NULL,
    is_certified_claim BOOLEAN DEFAULT FALSE, -- Must never claim official government certification in prototype
    disclaimer TEXT NOT NULL,
    pdf_download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ALERTS & SYSTEM WARNINGS
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES procurement_centers(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- LOW_IMAGE_QUALITY, HIGH_DEFECT_RATE, HIGH_SPROUTING, ASSESSMENT_REQUIRES_REVIEW, LOW_AI_CONFIDENCE, INCOMPLETE_SAMPLING
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- INFO, WARNING, CRITICAL
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_batches_center ON batches(center_id);
CREATE INDEX IF NOT EXISTS idx_batches_arrival ON batches(arrival_date);
CREATE INDEX IF NOT EXISTS idx_assessment_batch ON assessment_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_detections_sample ON detections(sample_image_id);
CREATE INDEX IF NOT EXISTS idx_alerts_center ON alerts(center_id);
CREATE INDEX IF NOT EXISTS idx_reports_batch ON reports(batch_id);
