import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Building,
  Calendar,
  User,
  Scale,
  ExternalLink,
  QrCode,
  Search,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { DigitalReport } from '../types';

export const QRVerify: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState(code || 'PV-VERIFY-2026-NSK-0941-VALID');
  const [activeToken, setActiveToken] = useState(code || 'PV-VERIFY-2026-NSK-0941-VALID');
  const [report, setReport] = useState<DigitalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(true);

  const performVerification = async (tok: string) => {
    setLoading(true);
    try {
      const data = await api.verifyToken(tok);
      if (data) {
        setReport(data);
        setVerified(true);
      } else {
        // Fallback check by report id if token matches
        const direct = await api.getReport(tok);
        if (direct) {
          setReport(direct);
          setVerified(true);
        } else {
          setReport(null);
          setVerified(false);
        }
      }
    } catch {
      setReport(null);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentCode = code || 'PV-VERIFY-2026-NSK-0941-VALID';
    setActiveToken(currentCode);
    setTokenInput(currentCode);
    performVerification(currentCode);
  }, [code]);

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setActiveToken(tokenInput.trim());
      performVerification(tokenInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-8 sm:py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-5">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>

          <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            National APMC Verification Ledger
          </span>
        </div>

        {/* Verification Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">

          {/* Verification Status Header */}
          <div className="text-center space-y-2 border-b border-[#E2E8F0] pb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${
              verified && report ? 'bg-emerald-100 border border-emerald-200 text-emerald-700' : 'bg-red-100 border border-red-200 text-red-700'
            }`}>
              {verified && report ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
            </div>
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                verified && report ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-red-50 text-red-800 border border-red-300'
              }`}>
                {verified && report ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Cryptographically Verified Token
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Unverified / Invalid Token
                  </>
                )}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                Digital Assessment Verification
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1 break-all">
                Token Digest: <span className="font-semibold text-slate-800">{activeToken}</span>
              </p>
            </div>
          </div>

          {/* Live Token Tester Search Bar */}
          <form onSubmit={handleManualVerify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Enter or scan QR Verification Token / Batch ID..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-xs shrink-0"
            >
              Verify Token
            </button>
          </form>

          {/* Prototype Verification Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Tamper-Evident Verification Ledger (Prototype)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This verification interface confirms that the digital quality assessment certificate matches the immutable audit entry stored on the PYAAZ-VISION platform. This is a prototype verification demonstration and does not constitute statutory government certification.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Verifying audit record from central ledger...
            </div>
          ) : report && verified ? (
            <div className="space-y-4 text-xs">
              {/* Batch & Center Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Batch Number</span>
                  <span className="font-mono font-bold text-slate-900">{report.batch_info.batch_number}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Procurement Center</span>
                  <span className="font-semibold text-slate-900">{report.procurement_center.name} ({report.procurement_center.code})</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Farmer / Supplier</span>
                  <span className="font-semibold text-slate-900">{report.batch_info.farmer_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Lot Inward Weight</span>
                  <span className="font-semibold text-slate-900">{report.batch_info.total_lot_weight_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Assessment Timestamp</span>
                  <span className="font-medium text-slate-700">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Inspector Sign-off</span>
                  <span className="font-semibold text-indigo-700">{report.human_verification.inspector}</span>
                </div>
              </div>

              {/* Quality Outcome Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Official Assessed Quality Metrics</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Passed Quality Audit
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-800 block">Grade A</span>
                    <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">{report.ai_findings.grade_a_pct}%</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-800 block">URS (FAQ)</span>
                    <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">{report.ai_findings.urs_pct}%</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-red-800 block">Defects</span>
                    <span className="text-xl font-extrabold text-red-600 mt-0.5 block">{report.ai_findings.defect_rate_pct}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
                  <span>Procurement Verdict: <strong className="text-emerald-700">{report.ai_findings.procurement_verdict.replace(/_/g, ' ')}</strong></span>
                  <span>Model Confidence: <strong>{(report.ai_findings.average_confidence * 100).toFixed(0)}%</strong></span>
                </div>
              </div>

              {/* View Full Report Button */}
              <button
                onClick={() => navigate(`/reports/${report.report_id}`)}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                View Full Digital Quality Report Certificate
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-800">Verification Token Not Found</p>
              <p className="text-[11px] text-slate-500">The provided token does not match an active assessment record in this APMC grid.</p>
              <div className="pt-3">
                <span className="text-[11px] text-slate-400 block mb-1">Try Default Sample Token:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sampleTok = 'PV-VERIFY-2026-NSK-0941-VALID';
                    setTokenInput(sampleTok);
                    setActiveToken(sampleTok);
                    performVerification(sampleTok);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-700 font-mono text-xs rounded-lg cursor-pointer"
                >
                  PV-VERIFY-2026-NSK-0941-VALID
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-[#E2E8F0] pt-4 text-center text-[10px] text-slate-400">
            PYAAZ-VISION Public Verification Protocol • National Onion Procurement Quality Intelligence
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRVerify;
