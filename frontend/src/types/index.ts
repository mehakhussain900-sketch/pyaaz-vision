export type QualityClass = 'GRADE A' | 'URS' | 'DAMAGED' | 'ROTTEN' | 'SPROUTED';

export type BatchStatus = 
  | 'PENDING_ASSESSMENT'
  | 'ASSESSMENT_IN_PROGRESS'
  | 'ASSESSED'
  | 'VERIFIED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONDITIONALLY_ACCEPTED';

export type DemoScenario = 
  | 'high_quality'
  | 'high_undersized'
  | 'high_damage'
  | 'high_sprouting'
  | 'poor_image'
  | 'ai_human_disagreement'
  | 'standard';

export interface ProcurementCenter {
  id: string;
  code: string;
  name: string;
  district: string;
  state: string;
  capacity_mt: number;
  active_intake: boolean;
  total_batches: number;
  avg_grade_a: number;
  avg_urs: number;
  avg_defect_rate: number;
  assessments_count: number;
  review_rate: number;
}

export interface Batch {
  id: string;
  batch_number: string;
  center_id: string;
  center_name?: string;
  supplier_farmer_id: string;
  farmer_name: string;
  farmer_contact?: string;
  variety: string;
  total_lot_weight_kg: number;
  vehicle_number?: string;
  arrival_date: string;
  status: BatchStatus;
  grade_a_pct?: number;
  urs_pct?: number;
  defect_rate_pct?: number;
  sample_size?: number;
  confidence?: number;
  created_at: string;
}

export interface Detection {
  onion_id: string;
  bbox_px: [number, number, number, number]; // [x, y, w, h]
  bbox_norm: [number, number, number, number]; // [x, y, w, h] in 0..1
  label: QualityClass;
  defect_type?: string;
  diameter_mm: number;
  size_category: string;
  is_undersized: boolean;
  confidence: number;
  evidence: string;
}

export interface QualityResult {
  id?: string;
  total_onions_detected: number;
  total_detected?: number;
  grade_a_count: number;
  grade_a_pct: number;
  urs_count: number;
  urs_pct: number;
  damaged_count: number;
  damaged_pct: number;
  rotten_count: number;
  rotten_pct: number;
  sprouted_count: number;
  sprouted_pct: number;
  undersized_count: number;
  undersized_pct: number;
  defect_count: number;
  defect_rate_pct: number;
  average_diameter_mm: number;
  average_confidence: number;
  procurement_verdict: string;
  recommended_action: string;
}

export interface HumanVerification {
  id?: string;
  inspector_name: string;
  action: 'ACCEPT_AI' | 'REQUEST_REVIEW' | 'OVERRIDE';
  ai_grade_a_pct: number;
  ai_urs_pct: number;
  ai_defect_pct: number;
  final_grade_a_pct: number;
  final_urs_pct: number;
  final_defect_pct: number;
  reason?: string;
  timestamp?: string;
}

export interface ReviewCase {
  id?: string;
  assessment_id: string;
  batch_id: string;
  flagged_by_name: string;
  reason: string;
  explanation?: string;
  status: 'Pending' | 'Under Review' | 'Resolved';
  created_at?: string;
}

export interface QualityCheckDetail {
  metric: string;
  value: string | number;
  threshold?: number;
  status: string;
  score: number;
  message: string;
}

export interface ImageQualityEvaluation {
  is_acceptable: boolean;
  overall_score: number;
  recommendation: 'Acceptable for Inference' | 'Recapture Recommended';
  summary: string;
  checks: {
    blur: QualityCheckDetail;
    brightness: QualityCheckDetail;
    framing: QualityCheckDetail;
    overlap: QualityCheckDetail;
  };
}

export interface DigitalReport {
  report_id: string;
  report_code: string;
  document_title: string;
  prototype_label: string;
  is_certified_claim: boolean;
  disclaimer: string;
  qr_verification_code: string;
  created_at: string;
  batch_info: {
    batch_id: string;
    batch_number: string;
    supplier_farmer_id: string;
    farmer_name: string;
    farmer_contact?: string;
    variety: string;
    total_lot_weight_kg: number;
    vehicle_number?: string;
    arrival_date: string;
    final_status: string;
  };
  procurement_center: {
    id: string;
    code: string;
    name: string;
    district: string;
    state: string;
  };
  sampling_info: {
    inspector_name: string;
    sample_tray_count: number;
    sample_size_count: number;
    reference_object_diameter_mm: number;
  };
  ai_findings: QualityResult;
  human_verification: {
    action: string;
    inspector: string;
    final_grade_a: number;
    final_urs: number;
    final_defect: number;
    reason?: string;
    timestamp: string;
  };
}

export interface AlertItem {
  id: string;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CalibrationData {
  reference_object_diameter_mm: number;
  measured_pixel_diameter: number;
  pixels_per_mm: number;
}
