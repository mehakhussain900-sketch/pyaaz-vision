import {
  ProcurementCenter,
  Batch,
  DigitalReport,
  AlertItem,
  Detection,
  QualityResult,
  HumanVerification,
  ReviewCase
} from '../types';
import { MOCK_CENTERS, MOCK_BATCHES, MOCK_REPORT_0941, MOCK_ALERTS } from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`Backend fetch failed for ${endpoint}, using resilient fallback:`, error);
    throw error;
  }
}

// In-memory dynamic reports storage with localStorage persistence
const STORAGE_KEY_REPORTS = 'pyaaz_vision_reports';

function loadStoredReports(): DigitalReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function persistReports(reports: DigitalReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch {}
}

const DYNAMIC_REPORTS: DigitalReport[] = loadStoredReports();

export const api = {
  // Centers
  async getCenters(): Promise<ProcurementCenter[]> {
    try {
      return await fetchJson<ProcurementCenter[]>('/centers');
    } catch {
      return MOCK_CENTERS;
    }
  },

  async getCenter(id: string): Promise<ProcurementCenter> {
    try {
      return await fetchJson<ProcurementCenter>(`/centers/${id}`);
    } catch {
      return MOCK_CENTERS.find(c => c.id === id) || MOCK_CENTERS[0];
    }
  },

  // Batches
  async getBatches(params?: { center_id?: string; status?: string; search?: string }): Promise<Batch[]> {
    try {
      const q = new URLSearchParams();
      if (params?.center_id) q.set('center_id', params.center_id);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return await fetchJson<Batch[]>(`/batches?${q.toString()}`);
    } catch {
      let filtered = [...MOCK_BATCHES];
      if (params?.center_id && params.center_id !== 'ALL') {
        filtered = filtered.filter(b => b.center_id === params.center_id);
      }
      if (params?.status && params.status !== 'ALL') {
        filtered = filtered.filter(b => b.status === params.status);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(b => b.batch_number.toLowerCase().includes(s) || b.farmer_name.toLowerCase().includes(s));
      }
      return filtered;
    }
  },

  async getBatch(id: string): Promise<any> {
    try {
      return await fetchJson(`/batches/${id}`);
    } catch {
      const b = MOCK_BATCHES.find(x => x.id === id || x.batch_number === id) || MOCK_BATCHES[0];
      return {
        ...b,
        assessments: [
          {
            id: `as-${b.id}`,
            inspector_name: "Inspector Anand K. Deshmukh",
            sample_size: 60,
            stage: "COMPLETED",
            scenario: "standard",
            quality_result: {
              total_onions_detected: 60,
              grade_a_count: Math.round(60 * ((b.grade_a_pct || 83.3) / 100)),
              grade_a_pct: b.grade_a_pct || 83.3,
              urs_count: Math.round(60 * ((b.urs_pct || 13.3) / 100)),
              urs_pct: b.urs_pct || 13.3,
              damaged_count: 1,
              damaged_pct: 1.7,
              rotten_count: 0,
              rotten_pct: 0.0,
              sprouted_count: 1,
              sprouted_pct: 1.7,
              undersized_count: 5,
              undersized_pct: 8.3,
              defect_count: Math.round(60 * ((b.defect_rate_pct || 3.3) / 100)),
              defect_rate_pct: b.defect_rate_pct || 3.3,
              average_diameter_mm: 54.2,
              average_confidence: 0.94,
              procurement_verdict: b.status === 'REJECTED' ? 'REJECTED_HIGH_DEFECTS' : 'ACCEPTED_GRADE_A',
              recommended_action: 'Proceed with standard APMC procurement workflow'
            }
          }
        ]
      };
    }
  },

  async createBatch(data: Partial<Batch>): Promise<Batch> {
    try {
      return await fetchJson<Batch>('/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch {
      const centerObj = MOCK_CENTERS.find(c => c.id === data.center_id);
      const newB: Batch = {
        id: `b-${Date.now().toString().slice(-4)}`,
        batch_number: data.batch_number || `BATCH-2026-NSK-${Date.now().toString().slice(-4)}`,
        center_id: data.center_id || 'c-lasalgaon',
        center_name: centerObj?.name || 'Lasalgaon APMC Main Yard',
        supplier_farmer_id: data.supplier_farmer_id || 'MH-NSK-FRM-9999',
        farmer_name: data.farmer_name || 'Demo Farmer',
        farmer_contact: data.farmer_contact || '+91 98000 00000',
        variety: data.variety || 'Nashik Red / Garwa',
        total_lot_weight_kg: data.total_lot_weight_kg || 5000,
        vehicle_number: data.vehicle_number || 'MH-15-EG-8291',
        arrival_date: data.arrival_date || new Date().toISOString().split('T')[0],
        status: data.status || 'PENDING_ASSESSMENT',
        grade_a_pct: data.grade_a_pct,
        urs_pct: data.urs_pct,
        defect_rate_pct: data.defect_rate_pct,
        sample_size: data.sample_size || 60,
        confidence: 0.94,
        created_at: new Date().toISOString()
      };
      MOCK_BATCHES.unshift(newB);
      return newB;
    }
  },

  // Assessments
  async createAssessment(payload: {
    batch_id: string;
    inspector_name?: string;
    sample_size_count?: number;
    reference_object_diameter_mm?: number;
    scenario?: string;
  }): Promise<{ assessment_id: string; batch_id: string; stage: string }> {
    try {
      return await fetchJson('/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      return {
        assessment_id: `as-${Date.now().toString().slice(-4)}`,
        batch_id: payload.batch_id,
        stage: 'SAMPLING'
      };
    }
  },

  async analyzeAssessment(id: string, scenario?: string, reference_mm?: number): Promise<any> {
    try {
      const formData = new FormData();
      if (scenario) formData.append('scenario', scenario);
      if (reference_mm) formData.append('reference_diameter_mm', reference_mm.toString());

      return await fetchJson(`/assessments/${id}/analyze`, {
        method: 'POST',
        body: formData
      });
    } catch {
      return api.analyzeImage(undefined, scenario, reference_mm);
    }
  },

  async getAssessment(id: string): Promise<any> {
    try {
      return await fetchJson(`/assessments/${id}`);
    } catch {
      return {
        id,
        batch_id: "b-0941",
        batch_number: "BATCH-2026-NSK-0941",
        variety: "Nashik Red / Garwa",
        farmer_name: "Rameshwar Eknath Patil",
        supplier_farmer_id: "MH-NSK-FRM-4892",
        center_name: "Lasalgaon APMC Main Yard",
        district: "Nashik",
        state: "Maharashtra",
        inspector_name: "Inspector Anand K. Deshmukh",
        sample_size_count: 60,
        stage: "COMPLETED",
        scenario: "standard",
        created_at: new Date().toISOString(),
        samples: [
          { id: "s-1", sample_index: 1, image_url: "/assets/sample-onion-tray-01.jpg", is_acceptable: true },
          { id: "s-2", sample_index: 2, image_url: "/assets/sample-onion-tray-02.jpg", is_acceptable: true },
          { id: "s-3", sample_index: 3, image_url: "/assets/sample-onion-tray-03.jpg", is_acceptable: true },
          { id: "s-4", sample_index: 4, image_url: "/assets/sample-onion-tray-04.jpg", is_acceptable: true }
        ],
        quality_result: MOCK_REPORT_0941.ai_findings,
        human_verification: MOCK_REPORT_0941.human_verification,
        report: {
          id: "rpt-0941",
          report_code: "RPT-PV-2026-0941",
          qr_verification_code: "PV-VERIFY-2026-NSK-0941-VALID"
        }
      };
    }
  },

  // Direct AI analysis
  async checkImageQuality(file?: File, scenario?: string): Promise<any> {
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (scenario) formData.append('scenario', scenario);

      return await fetchJson('/ai/quality-check', {
        method: 'POST',
        body: formData
      });
    } catch {
      const isPoor = scenario === 'poor_image';
      const statusOverall: 'PASS' | 'WARNING' | 'RECAPTURE REQUIRED' = isPoor ? 'RECAPTURE REQUIRED' : 'PASS';
      
      let resText = "1920 x 1080 px (FHD)";
      let laplacian = isPoor ? 38.2 : 142.5;
      let luminance = isPoor ? 41.0 : 124.8;
      
      if (file) {
        const kb = Math.round(file.size / 1024);
        if (kb < 100) {
          resText = "800 x 600 px (Standard)";
        } else if (kb > 2000) {
          resText = "3840 x 2160 px (4K UHD)";
        }
      }

      return {
        status: statusOverall,
        is_acceptable: !isPoor,
        overall_score: isPoor ? 42.5 : 94.0,
        recommendation: isPoor ? 'Recapture Recommended' : 'Acceptable for Inference',
        summary: isPoor
          ? 'Critical optical failure: Motion blur detected (Laplacian: 38.2) and lighting is sub-optimal.'
          : 'All optical parameters meet APMC screening requirements. Sharp focus and balanced illumination confirmed.',
        resolution: resText,
        checks: {
          blur: {
            metric: 'Sharpness (Laplacian Var)',
            value: laplacian,
            threshold: 80.0,
            status: isPoor ? 'FAIL' : 'PASS',
            score: isPoor ? 38 : 96,
            message: isPoor ? 'Motion blur detected; hold device steady' : 'Focus is crisp and defined'
          },
          brightness: {
            metric: 'Luminance (0-255)',
            value: luminance,
            status: isPoor ? 'TOO_DARK' : 'PASS',
            score: isPoor ? 35 : 92,
            message: isPoor ? 'Lighting is too dim (< 45 lux)' : 'Illumination evenly distributed'
          },
          framing: {
            metric: 'Sample Coverage',
            value: isPoor ? '2.1%' : '14.2%',
            status: isPoor ? 'POOR_COVERAGE' : 'PASS',
            score: isPoor ? 25 : 95,
            message: isPoor ? 'Sample is off-center or partially cut off' : 'Onion lot centered in viewfinder'
          },
          overlap: {
            metric: 'Bulb Congestion Index',
            value: isPoor ? 0.28 : 0.08,
            status: isPoor ? 'HIGH_CLUTTER' : 'PASS',
            score: isPoor ? 35 : 92,
            message: isPoor ? 'Excessive bulb stacking; spread into single layer' : 'Optimal single-layer spacing'
          }
        }
      };
    }
  },

  async analyzeImage(file?: File, scenario?: string, reference_mm?: number): Promise<any> {
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (scenario) formData.append('scenario', scenario || 'standard');
      if (reference_mm) formData.append('reference_diameter_mm', (reference_mm || 27.0).toString());

      return await fetchJson('/ai/analyze', {
        method: 'POST',
        body: formData
      });
    } catch {
      // Deterministic prototype detections matching scenario with exact mathematical parity
      const targetScenario = scenario || 'standard';
      let gradeA = 10, urs = 3, damaged = 1, sprouted = 1, rotten = 0;
      if (targetScenario === 'high_quality') { gradeA = 13; urs = 1; damaged = 1; sprouted = 0; rotten = 0; }
      else if (targetScenario === 'high_undersized') { gradeA = 5; urs = 8; damaged = 2; sprouted = 0; rotten = 0; }
      else if (targetScenario === 'high_damage') { gradeA = 6; urs = 3; damaged = 5; rotten = 1; sprouted = 0; }
      else if (targetScenario === 'high_sprouting') { gradeA = 5; urs = 3; damaged = 0; rotten = 1; sprouted = 6; }
      else if (targetScenario === 'ai_human_disagreement') { gradeA = 8; urs = 4; damaged = 2; rotten = 1; sprouted = 0; }
      
      const total = gradeA + urs + damaged + sprouted + rotten;
      const detections: Detection[] = [];

      let cur = 0;
      const addOnions = (count: number, label: any, defType: string, evidence: string, isUnder = false) => {
        for (let i = 0; i < count; i++) {
          cur++;
          const col = (cur - 1) % 5;
          const row = Math.floor((cur - 1) / 5);
          const x = 50 + col * 140;
          const y = 40 + row * 130;
          const diam = isUnder ? Number((33.5 + (cur % 4) * 1.5).toFixed(1)) : (label === 'GRADE A' ? Number((52.0 + (cur % 6) * 2.1).toFixed(1)) : Number((44.0 + (cur % 5) * 1.2).toFixed(1)));
          detections.push({
            onion_id: `ONION-${cur.toString().padStart(2, '0')}`,
            bbox_px: [x, y, 90, 90],
            bbox_norm: [x / 800, y / 600, 90 / 800, 90 / 600],
            label,
            defect_type: defType,
            diameter_mm: diam,
            size_category: isUnder ? 'UNDERSIZED (Chhata)' : (diam >= 55 ? 'BOLD_LARGE' : 'STANDARD_MEDIUM'),
            is_undersized: isUnder,
            confidence: Number((0.91 + (cur % 5) * 0.015).toFixed(2)),
            evidence
          });
        }
      };

      addOnions(gradeA, 'GRADE A', 'None (Healthy)', 'Intact dry tunic, firm globe shape, clear neck');
      addOnions(urs, 'URS', targetScenario === 'high_undersized' ? 'Undersized (< 40mm)' : 'Scale Peeling', targetScenario === 'high_undersized' ? 'Bulb diameter sub-40mm' : 'Tunic partially detached', targetScenario === 'high_undersized');
      addOnions(damaged, 'DAMAGED', 'Mechanical Harvest Cut', 'Transverse blade slice across outer fleshy scales');
      addOnions(rotten, 'ROTTEN', 'Black Mold / Soft Rot', 'Basal plate necrotic discoloration with Aspergillus spores');
      addOnions(sprouted, 'SPROUTED', 'Apical Shoot Growth', 'Active green vegetative shoot emergence (14-20mm length)');

      const defectCount = damaged + rotten + sprouted;
      const gradeAPct = Number(((gradeA / total) * 100).toFixed(1));
      const ursPct = Number(((urs / total) * 100).toFixed(1));
      const defectPct = Number(((defectCount / total) * 100).toFixed(1));
      const damagedPct = Number(((damaged / total) * 100).toFixed(1));
      const rottenPct = Number(((rotten / total) * 100).toFixed(1));
      const sproutedPct = Number(((sprouted / total) * 100).toFixed(1));
      const undersizedCount = targetScenario === 'high_undersized' ? urs : 2;
      const undersizedPct = Number(((undersizedCount / total) * 100).toFixed(1));

      return {
        provider: "PYAAZ-VISION Hybrid CV (Demo Mode)",
        is_demo_mode: true,
        scenario: targetScenario,
        detections,
        summary_metrics: {
          total_detected: total,
          total_onions_detected: total,
          grade_a_count: gradeA,
          grade_a_pct: gradeAPct,
          urs_count: urs,
          urs_pct: ursPct,
          damaged_count: damaged,
          damaged_pct: damagedPct,
          rotten_count: rotten,
          rotten_pct: rottenPct,
          sprouted_count: sprouted,
          sprouted_pct: sproutedPct,
          undersized_count: undersizedCount,
          undersized_pct: undersizedPct,
          defect_count: defectCount,
          defect_rate_pct: defectPct,
          average_diameter_mm: 52.4,
          average_confidence: 0.93,
          procurement_verdict: defectPct > 12 ? 'REJECTED_HIGH_DEFECTS' : (gradeAPct >= 70 ? 'ACCEPTED_GRADE_A' : 'CONDITIONALLY_ACCEPTED_URS'),
          recommended_action: defectPct > 12
            ? 'Reject inward lot or require mandatory re-sorting before APMC acceptance'
            : (gradeAPct >= 70 ? 'Approve for Grade A procurement and issuance of digital audit certificate' : 'Conditional procurement under URS price discount')
        },
        disclaimer: "DEMO INFERENCE PROVIDER: Output generated for SIH prototype validation."
      };
    }
  },

  // Calibration
  async calibrate(reference_mm: number, measured_px: number): Promise<any> {
    try {
      return await fetchJson('/ai/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_object_diameter_mm: reference_mm,
          measured_pixel_diameter: measured_px
        })
      });
    } catch {
      return {
        status: "CALIBRATED",
        reference_diameter_mm: reference_mm,
        measured_pixel_diameter: measured_px,
        pixels_per_mm: Number((measured_px / reference_mm).toFixed(3)),
        undersize_threshold_mm: 40.0,
        bold_threshold_mm: 60.0
      };
    }
  },

  // Human Verification
  async submitVerification(payload: any): Promise<any> {
    try {
      return await fetchJson('/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      return { status: "RECORDED", ...payload, timestamp: new Date().toISOString() };
    }
  },

  // Dispute Arbitration
  async flagDispute(payload: any): Promise<any> {
    try {
      return await fetchJson('/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      return { case_id: `rev-${Date.now().toString().slice(-4)}`, status: 'Under Review', ...payload };
    }
  },

  // Dynamic Digital Report Storage
  saveReport(report: DigitalReport): void {
    const existingIdx = DYNAMIC_REPORTS.findIndex(r => r.report_id === report.report_id);
    if (existingIdx >= 0) {
      DYNAMIC_REPORTS[existingIdx] = report;
    } else {
      DYNAMIC_REPORTS.unshift(report);
    }
    persistReports(DYNAMIC_REPORTS);
  },

  async getReport(id: string): Promise<DigitalReport> {
    // Check dynamic reports first
    const found = DYNAMIC_REPORTS.find(
      r => r.report_id === id || r.report_code === id || r.batch_info?.batch_id === id || r.batch_info?.batch_number === id
    );
    if (found) return found;

    try {
      return await fetchJson<DigitalReport>(`/reports/${id}`);
    } catch {
      if (id === 'rpt-0941' || id === 'b-0941') {
        return MOCK_REPORT_0941;
      }
      return {
        ...MOCK_REPORT_0941,
        report_id: id,
        report_code: `RPT-PV-2026-${id.slice(-4).toUpperCase()}`
      };
    }
  },

  async getReports(): Promise<any[]> {
    const defaultReports = [
      {
        id: "rpt-0941",
        report_code: "RPT-PV-2026-0941",
        batch_id: "b-0941",
        batch_number: "BATCH-2026-NSK-0941",
        farmer_name: "Rameshwar Eknath Patil",
        center_name: "Lasalgaon APMC Main Yard",
        status: "APPROVED",
        created_at: "2026-09-28T09:42:15Z"
      },
      {
        id: "rpt-1102",
        report_code: "RPT-PV-2026-1102",
        batch_id: "b-1102",
        batch_number: "BATCH-2026-PMP-1102",
        farmer_name: "Balasaheb Kisan Shinde",
        center_name: "Pimpalgaon Baswant Hub",
        status: "VERIFIED",
        created_at: "2026-09-27T11:45:00Z"
      },
      {
        id: "rpt-0431",
        report_code: "RPT-PV-2026-0431",
        batch_id: "b-0431",
        batch_number: "BATCH-2026-MHV-0431",
        farmer_name: "Dilipbhai Manjibhai Patel",
        center_name: "Mahuva APMC Dehydration Cluster",
        status: "APPROVED",
        created_at: "2026-09-26T16:15:00Z"
      }
    ];

    const dynamicSummaries = DYNAMIC_REPORTS.map(r => ({
      id: r.report_id,
      report_code: r.report_code,
      batch_id: r.batch_info.batch_id,
      batch_number: r.batch_info.batch_number,
      farmer_name: r.batch_info.farmer_name,
      center_name: r.procurement_center.name,
      status: r.batch_info.final_status,
      created_at: r.created_at
    }));

    try {
      const serverReports = await fetchJson<any[]>('/reports');
      return [...dynamicSummaries, ...serverReports];
    } catch {
      return [...dynamicSummaries, ...defaultReports];
    }
  },

  async verifyToken(token: string): Promise<DigitalReport | null> {
    const cleaned = token.trim();
    // Look up in dynamic reports
    const dyn = DYNAMIC_REPORTS.find(
      r => r.qr_verification_code === cleaned || r.report_code === cleaned || r.batch_info.batch_number === cleaned
    );
    if (dyn) return dyn;

    // Look up in standard mock
    if (
      cleaned === MOCK_REPORT_0941.qr_verification_code ||
      cleaned === MOCK_REPORT_0941.report_code ||
      cleaned === MOCK_REPORT_0941.batch_info.batch_number ||
      cleaned.includes('0941')
    ) {
      return MOCK_REPORT_0941;
    }

    try {
      return await fetchJson<DigitalReport>(`/verify/${encodeURIComponent(cleaned)}`);
    } catch {
      return null;
    }
  },

  // Analytics
  async getAnalyticsOverview(): Promise<any> {
    try {
      return await fetchJson('/analytics/overview');
    } catch {
      return {
        kpis: {
          batches_assessed: { value: 542 + DYNAMIC_REPORTS.length, unit: "batches", change: "+14.2% vs last week" },
          onions_analysed: { value: 32840 + DYNAMIC_REPORTS.length * 60, unit: "bulbs", change: "+8.5% throughput" },
          avg_grade_a: { value: 78.4, unit: "%", status: "healthy" },
          avg_urs: { value: 15.6, unit: "%", status: "warning" },
          defect_rate: { value: 6.0, unit: "%", status: "critical_low" },
          assessments_today: { value: 24 + DYNAMIC_REPORTS.length, unit: "sessions", status: "normal" }
        },
        quality_distribution: [
          { name: "Grade A (Prime)", value: 78.4, color: "#16A34A" },
          { name: "URS (Borderline)", value: 15.6, color: "#D97706" },
          { name: "Mechanical Damage", value: 3.4, color: "#DC2626" },
          { name: "Rotten / Mold", value: 1.2, color: "#991B1B" },
          { name: "Sprouted (Broken Dormancy)", value: 1.4, color: "#7C3AED" }
        ],
        size_distribution: [
          { range: "< 35 mm (Severe Under)", percentage: 4.2 },
          { range: "35 - 40 mm (Chhata)", percentage: 8.1 },
          { range: "40 - 50 mm (Medium A)", percentage: 34.5 },
          { range: "50 - 65 mm (Bold A)", percentage: 42.8 },
          { range: "> 65 mm (Extra Bold)", percentage: 10.4 }
        ],
        center_comparison: [
          { center: "Lasalgaon Yard", batches: 142, grade_a: 81.2, defect_rate: 4.5 },
          { center: "Pimpalgaon Hub", batches: 118, grade_a: 76.4, defect_rate: 5.8 },
          { center: "Yeola Sub-Yard", batches: 89, grade_a: 69.8, defect_rate: 8.8 },
          { center: "Mahuva Cluster", batches: 96, grade_a: 84.1, defect_rate: 3.9 },
          { center: "Dindori Center", batches: 64, grade_a: 73.5, defect_rate: 6.4 }
        ]
      };
    }
  },

  async getAnalyticsTrends(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    try {
      return await fetchJson(`/analytics/trends?timeframe=${timeframe}`);
    } catch {
      const data7d = [
        { date: "22 Sep", grade_a: 81.5, urs: 13.5, defects: 5.0, sprouting: 1.2, volume: 18, ai_human_diff: 1.1 },
        { date: "23 Sep", grade_a: 79.0, urs: 16.0, defects: 5.0, sprouting: 1.4, volume: 22, ai_human_diff: 1.4 },
        { date: "24 Sep", grade_a: 82.0, urs: 13.0, defects: 5.0, sprouting: 0.9, volume: 25, ai_human_diff: 0.8 },
        { date: "25 Sep", grade_a: 76.5, urs: 17.5, defects: 6.0, sprouting: 2.1, volume: 20, ai_human_diff: 2.0 },
        { date: "26 Sep", grade_a: 74.0, urs: 18.0, defects: 8.0, sprouting: 2.8, volume: 19, ai_human_diff: 2.5 },
        { date: "27 Sep", grade_a: 80.2, urs: 14.8, defects: 5.0, sprouting: 1.5, volume: 28, ai_human_diff: 1.2 },
        { date: "28 Sep", grade_a: 83.3, urs: 13.3, defects: 3.4, sprouting: 1.1, volume: 24, ai_human_diff: 0.9 }
      ];
      return { timeframe, data: data7d };
    }
  },

  async getAlerts(): Promise<AlertItem[]> {
    try {
      return await fetchJson<AlertItem[]>('/alerts');
    } catch {
      return MOCK_ALERTS;
    }
  }
};
