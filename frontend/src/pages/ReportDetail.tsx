import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  Building,
  User,
  Check,
  ExternalLink,
  Code
} from 'lucide-react';
import { api } from '../services/api';
import { DigitalReport } from '../types';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<DigitalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.getReport(id)
        .then(setReport)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    if (!report) return;

    const r = report;
    const b = r.batch_info;
    const c = r.procurement_center;
    const s = r.sampling_info;
    const a = r.ai_findings;
    const h = r.human_verification;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${r.report_code} - PYAaz-Vision Official Assessment Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { font-size: 13px; color: #475569; margin-top: 4px; }
    .report-id { text-align: right; font-family: monospace; font-size: 14px; font-weight: bold; color: #4338ca; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; font-size: 13px; }
    .meta-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px; }
    .meta-val { font-size: 14px; font-weight: 700; color: #0f172a; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 28px; }
    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin: 16px 0; text-align: center; }
    .stat-card { border-radius: 8px; padding: 12px 8px; border: 1px solid #e2e8f0; }
    .stat-gradeA { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    .stat-urs { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .stat-defect { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .stat-val { font-size: 22px; font-weight: 800; margin: 4px 0; }
    .stat-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .stat-cnt { font-size: 11px; opacity: 0.85; }
    .audit-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-top: 24px; font-size: 12px; }
    .audit-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
    .qr-box { margin-top: 24px; padding: 16px; border: 2px dashed #94a3b8; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; }
    .qr-token { font-family: monospace; font-size: 13px; font-weight: bold; color: #1e1b4b; background: #e0e7ff; padding: 4px 8px; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:28px;">🧅</span>
        <h1 class="title">PYAAZ-VISION ASSESSMENT CERTIFICATE</h1>
      </div>
      <p class="subtitle">National Smart Procurement Quality Intelligence System • APMC Mandi Ledger</p>
    </div>
    <div class="report-id">
      <span>REPORT CODE</span>
      <div style="font-size:16px;">${r.report_code}</div>
      <div style="font-size:11px; font-weight:normal; color:#64748b; margin-top:4px;">Date: ${new Date(r.created_at).toLocaleDateString()}</div>
    </div>
  </div>

  <div style="background:#f1f5f9; padding:8px 12px; border-radius:6px; margin:16px 0; font-size:11px; color:#475569;">
    <strong>Verification Notice:</strong> Computer vision-assisted batch grading report issued under APMC quality standards for SIH demonstration.
  </div>

  <div class="section-title">1. Lot & Procurement Center Details</div>
  <div class="meta-grid">
    <div class="meta-item"><span class="meta-label">Batch ID</span><span class="meta-val">${b.batch_number}</span></div>
    <div class="meta-item"><span class="meta-label">Procurement Center</span><span class="meta-val">${c.name} (${c.code})</span></div>
    <div class="meta-item"><span class="meta-label">Farmer / Grower</span><span class="meta-val">${b.farmer_name}</span></div>
    <div class="meta-item"><span class="meta-label">Farmer Identifier</span><span class="meta-val">${b.supplier_farmer_id}</span></div>
    <div class="meta-item"><span class="meta-label">Harvest Variety</span><span class="meta-val">${b.variety}</span></div>
    <div class="meta-item"><span class="meta-label">Inward Lot Weight</span><span class="meta-val">${b.total_lot_weight_kg.toLocaleString()} kg</span></div>
    <div class="meta-item"><span class="meta-label">Vehicle Registration</span><span class="meta-val">${b.vehicle_number || 'MH-15-EG-8291'}</span></div>
    <div class="meta-item"><span class="meta-label">Arrival Date</span><span class="meta-val">${b.arrival_date}</span></div>
    <div class="meta-item"><span class="meta-label">Final Outcome</span><span class="meta-val">${b.final_status}</span></div>
  </div>

  <div class="section-title">2. Sampling & Vision Metrics</div>
  <div class="meta-grid" style="grid-template-columns: repeat(4, 1fr);">
    <div class="meta-item"><span class="meta-label">Inspector Name</span><span class="meta-val">${s.inspector_name}</span></div>
    <div class="meta-item"><span class="meta-label">Trays Scanned</span><span class="meta-val">${s.sample_tray_count} Trays</span></div>
    <div class="meta-item"><span class="meta-label">Bulbs Analyzed</span><span class="meta-val">${s.sample_size_count} Bulbs</span></div>
    <div class="meta-item"><span class="meta-label">Reference Disc</span><span class="meta-val">${s.reference_object_diameter_mm} mm (₹10 Coin)</span></div>
  </div>

  <div class="section-title">3. Assessed Quality Composition (Mathematical Parity)</div>
  <div class="stats-grid">
    <div class="stat-card stat-gradeA">
      <div class="stat-lbl">Grade A (Prime)</div>
      <div class="stat-val">${a.grade_a_pct}%</div>
      <div class="stat-cnt">${a.grade_a_count} Bulbs</div>
    </div>
    <div class="stat-card stat-urs">
      <div class="stat-lbl">URS (FAQ)</div>
      <div class="stat-val">${a.urs_pct}%</div>
      <div class="stat-cnt">${a.urs_count} Bulbs</div>
    </div>
    <div class="stat-card stat-defect">
      <div class="stat-lbl">Damaged</div>
      <div class="stat-val">${a.damaged_pct}%</div>
      <div class="stat-cnt">${a.damaged_count} Bulbs</div>
    </div>
    <div class="stat-card stat-defect">
      <div class="stat-lbl">Rotten</div>
      <div class="stat-val">${a.rotten_pct}%</div>
      <div class="stat-cnt">${a.rotten_count} Bulbs</div>
    </div>
    <div class="stat-card stat-urs">
      <div class="stat-lbl">Sprouted</div>
      <div class="stat-val">${a.sprouted_pct}%</div>
      <div class="stat-cnt">${a.sprouted_count} Bulbs</div>
    </div>
    <div class="stat-card" style="background:#f8fafc;">
      <div class="stat-lbl">Undersized</div>
      <div class="stat-val">${a.undersized_pct}%</div>
      <div class="stat-cnt">${a.undersized_count} Bulbs</div>
    </div>
  </div>

  <div style="font-size:12px; margin: 8px 0; color:#334155;">
    <strong>Procurement Verdict:</strong> ${a.procurement_verdict.replace(/_/g, ' ')} &nbsp;|&nbsp;
    <strong>Defect Rate:</strong> ${a.defect_rate_pct}% &nbsp;|&nbsp;
    <strong>Average Bulb Size:</strong> ${a.average_diameter_mm} mm &nbsp;|&nbsp;
    <strong>Mean AI Confidence:</strong> ${(a.average_confidence * 100).toFixed(0)}%
  </div>

  <div class="section-title">4. Human-in-the-Loop Sign-off & Audit Log</div>
  <div class="audit-box">
    <div class="audit-header">
      <span>SIGN-OFF OFFICER: ${h.inspector}</span>
      <span>ACTION: ${h.action}</span>
      <span>TIMESTAMP: ${new Date(h.timestamp).toLocaleString()}</span>
    </div>
    <p><strong>Remarks / Justification:</strong> ${h.reason || 'Verified and approved by inspecting officer.'}</p>
    <div style="margin-top:8px; display:flex; gap:16px;">
      <span>AI Grade A: <strong>${a.grade_a_pct}%</strong></span>
      <span>Final Certified Grade A: <strong style="color:#166534;">${h.final_grade_a}%</strong></span>
      <span>Final Certified Defect: <strong style="color:#991b1b;">${h.final_defect}%</strong></span>
    </div>
  </div>

  <div class="qr-box">
    <div>
      <div style="font-weight:bold; font-size:13px;">CRYPTOGRAPHIC QR AUDIT DIGEST</div>
      <div style="font-size:11px; color:#64748b; margin-top:2px;">Verify at: http://localhost:5173/verify/${r.qr_verification_code}</div>
    </div>
    <div class="qr-token">${r.qr_verification_code}</div>
  </div>

  <div class="footer">
    PYAAZ-VISION National Onion Quality Intelligence Platform • Prototype Demonstration Document • APMC Grid
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${r.report_code}_Quality_Certificate.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Certificate downloaded as standalone HTML file!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.report_code}_Audit_Payload.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Audit payload downloaded as JSON file!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  if (loading || !report) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-semibold text-primary">Generating Digital Assessment Report...</p>
      </div>
    );
  }

  const { batch_info, procurement_center, sampling_info, ai_findings, human_verification } = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-border shadow-xs">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Download Raw Cryptographic Audit JSON"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            Audit JSON
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            title="Download Standalone HTML Quality Certificate"
          >
            <Download className="w-3.5 h-3.5" />
            Download Report (.html)
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Formal Digital Report Document */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-elevated p-8 sm:p-12 space-y-8 text-primary print:border-none print:shadow-none print:p-0">
        
        {/* Certificate Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-900 flex items-center justify-center text-white text-2xl shadow-sm shrink-0">
              🧅
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-extrabold tracking-tight text-primary">PYAAZ-VISION</span>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  OFFICIAL MANDI ASSESSMENT CERTIFICATE
                </span>
              </div>
              <h1 className="text-sm font-bold text-slate-800 mt-1 uppercase tracking-wide">
                AI-Assisted Onion Quality Assessment &amp; Grading Report
              </h1>
              <p className="text-[11px] text-secondary font-medium">
                National Smart Procurement Quality Intelligence System • APMC Protocol
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 text-xs shrink-0">
            <span className="text-secondary font-mono text-[10px] block">REPORT IDENTIFIER</span>
            <span className="font-mono font-extrabold text-indigo-700 text-sm">{report.report_code}</span>
            <span className="text-[11px] text-secondary block mt-1">
              Issued: {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Prototype Disclaimer Label */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Digital Quality Assessment Report:</strong> Computer vision-assisted batch grading report generated under APMC quality standards for Smart India Hackathon prototype evaluation.
          </span>
        </div>

        {/* Section 1: Batch & Center Identification */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-border pb-1">
            1. Batch &amp; Procurement Center Identification
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-secondary">Batch ID:</span>
              <p className="font-mono font-bold text-primary mt-0.5">{batch_info.batch_number}</p>
            </div>
            <div>
              <span className="text-secondary">Procurement Center:</span>
              <p className="font-bold text-primary mt-0.5">{procurement_center.name}</p>
            </div>
            <div>
              <span className="text-secondary">Mandi Yard Code:</span>
              <p className="font-bold text-primary mt-0.5">{procurement_center.code}</p>
            </div>
            <div>
              <span className="text-secondary">Farmer Name:</span>
              <p className="font-bold text-primary mt-0.5">{batch_info.farmer_name}</p>
            </div>
            <div>
              <span className="text-secondary">Farmer ID / Aadhaar Hash:</span>
              <p className="font-mono font-semibold text-primary mt-0.5">{batch_info.supplier_farmer_id}</p>
            </div>
            <div>
              <span className="text-secondary">Harvest Variety:</span>
              <p className="font-semibold text-primary mt-0.5">{batch_info.variety}</p>
            </div>
            <div>
              <span className="text-secondary">Total Inward Weight:</span>
              <p className="font-semibold text-primary mt-0.5">{batch_info.total_lot_weight_kg.toLocaleString()} kg</p>
            </div>
            <div>
              <span className="text-secondary">Vehicle Number:</span>
              <p className="font-semibold text-primary mt-0.5 font-mono">{batch_info.vehicle_number || 'MH-15-EG-8291'}</p>
            </div>
            <div>
              <span className="text-secondary">Arrival Date:</span>
              <p className="font-semibold text-primary mt-0.5">{batch_info.arrival_date}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Sampling & Optical Setup */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-border pb-1">
            2. Sampling Protocol &amp; Vision Setup
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-secondary">Inspector Name:</span>
              <p className="font-semibold text-primary mt-0.5">{sampling_info.inspector_name}</p>
            </div>
            <div>
              <span className="text-secondary">Sample Trays Scanned:</span>
              <p className="font-semibold text-primary mt-0.5">{sampling_info.sample_tray_count} Trays</p>
            </div>
            <div>
              <span className="text-secondary">Bulbs Analyzed:</span>
              <p className="font-semibold text-primary mt-0.5">{sampling_info.sample_size_count} Bulbs</p>
            </div>
            <div>
              <span className="text-secondary">Metric Reference Target:</span>
              <p className="font-semibold text-primary mt-0.5">{sampling_info.reference_object_diameter_mm} mm (₹10 Coin)</p>
            </div>
          </div>
        </div>

        {/* Section 3: AI Quality Intelligence Findings */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-border pb-1">
            3. AI Quality Findings (Exact Mathematical Composition)
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-800">Grade A (Prime)</span>
              <p className="text-xl font-extrabold text-gradeA mt-1">{ai_findings.grade_a_pct}%</p>
              <span className="text-[10px] text-emerald-700">{ai_findings.grade_a_count} bulbs</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-amber-800">URS (FAQ)</span>
              <p className="text-xl font-extrabold text-urs mt-1">{ai_findings.urs_pct}%</p>
              <span className="text-[10px] text-amber-700">{ai_findings.urs_count} bulbs</span>
            </div>
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-red-800">Damaged</span>
              <p className="text-xl font-extrabold text-defect mt-1">{ai_findings.damaged_pct}%</p>
              <span className="text-[10px] text-red-700">{ai_findings.damaged_count} bulbs</span>
            </div>
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-red-900">Rotten</span>
              <p className="text-xl font-extrabold text-red-900 mt-1">{ai_findings.rotten_pct}%</p>
              <span className="text-[10px] text-red-700">{ai_findings.rotten_count} bulbs</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-purple-800">Sprouted</span>
              <p className="text-xl font-extrabold text-purple-700 mt-1">{ai_findings.sprouted_pct}%</p>
              <span className="text-[10px] text-purple-700">{ai_findings.sprouted_count} bulbs</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-slate-700">Undersized</span>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{ai_findings.undersized_pct}%</p>
              <span className="text-[10px] text-secondary">{ai_findings.undersized_count} bulbs</span>
            </div>
          </div>
        </div>

        {/* Section 4: Human-in-the-Loop Sign-off & Final Status */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">FINAL PROCUREMENT OUTCOME</span>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {batch_info.final_status} • {ai_findings.procurement_verdict.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-secondary font-medium">
                  Recommendation: {ai_findings.recommended_action}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-secondary">Inspector Sign-off</span>
              <p className="text-xs font-bold text-primary">{human_verification.inspector}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Verification Mode:</strong> {human_verification.action}</p>
              <p><strong>Inspector Remarks:</strong> {human_verification.reason || 'Visual audit confirms computer vision detection boundaries.'}</p>
              <p className="text-[11px] text-secondary">Validated on {new Date(human_verification.timestamp).toLocaleString()}</p>
            </div>

            {/* QR Verification Card */}
            <div
              onClick={() => navigate(`/verify/${report.qr_verification_code}`)}
              className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs shrink-0 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
              title="Click to open cryptographic verification portal"
            >
              <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-white group-hover:bg-indigo-700 transition-colors">
                <QrCode className="w-12 h-12" />
              </div>
              <div className="text-[10px]">
                <span className="font-bold text-slate-900 block group-hover:text-indigo-700">QR AUDIT TOKEN</span>
                <span className="font-mono text-slate-500 block truncate max-w-[140px]">{report.qr_verification_code}</span>
                <span className="text-emerald-700 font-semibold mt-1 block flex items-center gap-1">
                  ✓ Verify Digitally &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-secondary gap-2">
          <span>PYAAZ-VISION Engine v1.0.0-rc1 • Modular Computer Vision Architecture</span>
          <span>APMC Mandi Yard Digital Quality Audit Record</span>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
