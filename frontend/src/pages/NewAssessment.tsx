import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileCheck2,
  ShieldCheck,
  Sliders,
  Scale,
  Eye,
  Info,
  Trash2,
  Plus,
  X,
  Layers,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { QualityCheckDetail, Detection, QualityResult, DigitalReport } from '../types';

export const NewAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scenario, referenceMm } = useDemo();

  // Wizard state: 1: Batch Info, 2: Sampling, 3: Quality Check, 4: AI Analysis, 5: Result
  const [step, setStep] = useState<number>(1);

  // Step 1: Batch Information
  const [batchInfo, setBatchInfo] = useState({
    batchId: `BATCH-2026-NSK-${Math.floor(1000 + Math.random() * 9000)}`,
    center: 'c-lasalgaon',
    farmerId: 'MH-NSK-FRM-4892',
    farmerName: 'Rameshwar Eknath Patil',
    farmerContact: '+91 98224 81920',
    variety: 'Nashik Red / Garwa',
    date: new Date().toISOString().split('T')[0],
    lotWeightKg: 5800,
    vehicleNumber: 'MH-15-EG-8291',
    sampleSize: 60,
    inspector: user?.full_name || 'Inspector Anand K. Deshmukh'
  });

  // Step 2: Sampling Trays
  const [samples, setSamples] = useState([
    { id: 1, name: 'Sample Tray 01', file: null as File | null, preview: '/assets/sample-onion-tray-01.jpg', ready: true },
    { id: 2, name: 'Sample Tray 02', file: null as File | null, preview: '/assets/sample-onion-tray-02.jpg', ready: true },
    { id: 3, name: 'Sample Tray 03', file: null as File | null, preview: '/assets/sample-onion-tray-03.jpg', ready: true },
    { id: 4, name: 'Sample Tray 04', file: null as File | null, preview: '/assets/sample-onion-tray-04.jpg', ready: true },
    { id: 5, name: 'Sample Tray 05', file: null as File | null, preview: '/assets/sample-onion-tray-05.jpg', ready: true },
    { id: 6, name: 'Sample Tray 06', file: null as File | null, preview: '/assets/sample-onion-tray-06.jpg', ready: true },
    { id: 7, name: 'Sample Tray 07', file: null as File | null, preview: '/assets/sample-onion-tray-07.jpg', ready: true },
    { id: 8, name: 'Sample Tray 08', file: null as File | null, preview: '/assets/sample-onion-tray-08.jpg', ready: true },
  ]);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real Camera Capture State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 3: Quality Check State
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);
  const [qualityResult, setQualityResult] = useState<any>(null);

  // Step 4: AI Analysis Progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentPipelineStage, setCurrentPipelineStage] = useState('Initializing');

  // Step 5: AI Result & Detections
  const [aiOutput, setAiOutput] = useState<{
    detections: Detection[];
    summary: QualityResult;
  } | null>(null);

  // Interactive Detection View State
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [selectedOnionId, setSelectedOnionId] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>('ALL');

  // Human Verification Modal / Override State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    gradeA: 80,
    urs: 15,
    defects: 5,
    reason: ''
  });
  const [disputeReason, setDisputeReason] = useState('AI result appears inconsistent');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [verificationDone, setVerificationDone] = useState<string | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<{
    action: string;
    inspector: string;
    timestamp: string;
    ai_grade_a: number;
    final_grade_a: number;
    final_urs: number;
    final_defect: number;
    reason?: string;
  } | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);

  // ================= CAMERA HANDLERS =================
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera access failed or unavailable:", err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions in your browser or use file upload.'
          : 'No camera hardware found or video device in use. Please upload an image file instead.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `tray-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setSamples(prev =>
          prev.map((s, idx) =>
            idx === activeSampleIndex ? { ...s, file, preview: previewUrl, ready: true } : s
          )
        );
      }
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ================= IMAGE UPLOAD / REMOVAL =================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate by MIME type (primary) OR file extension (fallback)
      // Some browsers/OS report 'image/jpg' instead of 'image/jpeg' — we accept both
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const validExtensions = /\.(jpe?g|png|webp)$/i;
      const mimeOk = validMimeTypes.includes(file.type) || file.type === 'image/jpg';
      const extOk = validExtensions.test(file.name);
      if (!mimeOk && !extOk) {
        setUploadError('Unsupported file format. Please upload a JPG, PNG, or WEBP image.');
        return;
      }

      // Validate file size (max 15 MB)
      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('File is too large. Maximum allowed size is 15 MB.');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setSamples(prev =>
        prev.map((s, idx) =>
          idx === activeSampleIndex ? { ...s, file, preview: previewUrl, ready: true } : s
        )
      );
    }
  };

  const handleRemoveSample = (idx: number) => {
    if (samples.length <= 1) {
      alert("At least one sample tray is required for assessment.");
      return;
    }
    const updated = samples.filter((_, i) => i !== idx);
    setSamples(updated);
    if (activeSampleIndex >= updated.length) {
      setActiveSampleIndex(updated.length - 1);
    }
  };

  const handleRevertSampleImage = () => {
    setSamples(prev =>
      prev.map((s, idx) =>
        idx === activeSampleIndex
          ? {
              ...s,
              file: null,
              preview: `/assets/sample-onion-tray-0${(idx % 8) + 1}.jpg`
            }
          : s
      )
    );
  };

  const handleAddSample = () => {
    const nextId = samples.length + 1;
    const trayNum = ((nextId - 1) % 8) + 1;
    setSamples(prev => [
      ...prev,
      {
        id: nextId,
        name: `Sample Tray 0${nextId}`,
        file: null,
        preview: `/assets/sample-onion-tray-0${trayNum}.jpg`,
        ready: true
      }
    ]);
  };

  // ================= STEP 3: QUALITY CHECK =================
  const runQualityCheck = async () => {
    setIsCheckingQuality(true);
    try {
      const activeSample = samples[activeSampleIndex];
      const res = await api.checkImageQuality(activeSample.file || undefined, scenario);
      setQualityResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingQuality(false);
    }
  };

  // ================= STEP 4: AI ANALYSIS PIPELINE =================
  const runAIAnalysis = async () => {
    setStep(4);
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setCurrentPipelineStage('Image preprocessing & illumination normalization');

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    await sleep(400);
    setAnalysisProgress(30);
    setCurrentPipelineStage('Detecting onions & segmenting individual bulbs');

    await sleep(450);
    setAnalysisProgress(55);
    setCurrentPipelineStage('Analyzing visual defects (rot, sprouting, cuts)');

    await sleep(400);
    setAnalysisProgress(75);
    setCurrentPipelineStage('Estimating diameter in mm via reference calibration');

    await sleep(400);
    setAnalysisProgress(90);
    setCurrentPipelineStage('Calculating exact batch quality composition & parity');

    try {
      const activeSample = samples[activeSampleIndex];
      const res = await api.analyzeImage(activeSample.file || undefined, scenario, referenceMm);
      setAiOutput({
        detections: res.detections,
        summary: res.summary_metrics
      });
      setOverrideData({
        gradeA: res.summary_metrics.grade_a_pct,
        urs: res.summary_metrics.urs_pct,
        defects: res.summary_metrics.defect_rate_pct,
        reason: ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      await sleep(300);
      setAnalysisProgress(100);
      setIsAnalyzing(false);
      advanceStep(5);
    }
  };

  // ================= HUMAN VERIFICATION =================
  const handleAcceptAI = async () => {
    const aiG = aiOutput?.summary.grade_a_pct || 83.3;
    const aiU = aiOutput?.summary.urs_pct || 13.3;
    const aiD = aiOutput?.summary.defect_rate_pct || 3.3;
    const now = new Date().toISOString();

    await api.submitVerification({
      assessment_id: `as-${batchInfo.batchId}`,
      inspector_name: batchInfo.inspector,
      action: 'ACCEPT_AI',
      ai_grade_a_pct: aiG,
      ai_urs_pct: aiU,
      ai_defect_pct: aiD,
      final_grade_a_pct: aiG,
      final_urs_pct: aiU,
      final_defect_pct: aiD,
      reason: 'AI grading validated by procurement inspector'
    });
    setVerificationDone('ACCEPTED');
    setVerificationDetails({
      action: 'ACCEPTED (AI Validated)',
      inspector: batchInfo.inspector,
      timestamp: now,
      ai_grade_a: aiG,
      final_grade_a: aiG,
      final_urs: aiU,
      final_defect: aiD,
      reason: 'AI grading validated by procurement inspector'
    });
  };

  const handleOverrideSubmit = async () => {
    if (!overrideData.reason.trim()) {
      setOverrideError("Technical justification is mandatory for auditing and regulatory compliance.");
      return;
    }
    setOverrideError(null);
    const aiG = aiOutput?.summary.grade_a_pct || 83.3;
    const aiU = aiOutput?.summary.urs_pct || 13.3;
    const aiD = aiOutput?.summary.defect_rate_pct || 3.3;
    const now = new Date().toISOString();

    await api.submitVerification({
      assessment_id: `as-${batchInfo.batchId}`,
      inspector_name: batchInfo.inspector,
      action: 'OVERRIDE',
      ai_grade_a_pct: aiG,
      ai_urs_pct: aiU,
      ai_defect_pct: aiD,
      final_grade_a_pct: Number(overrideData.gradeA),
      final_urs_pct: Number(overrideData.urs),
      final_defect_pct: Number(overrideData.defects),
      reason: overrideData.reason
    });
    setShowOverrideModal(false);
    setVerificationDone('OVERRIDDEN');
    setVerificationDetails({
      action: 'MANUAL OVERRIDE',
      inspector: batchInfo.inspector,
      timestamp: now,
      ai_grade_a: aiG,
      final_grade_a: Number(overrideData.gradeA),
      final_urs: Number(overrideData.urs),
      final_defect: Number(overrideData.defects),
      reason: overrideData.reason
    });
  };

  const handleDisputeSubmit = async () => {
    const aiG = aiOutput?.summary.grade_a_pct || 83.3;
    const aiU = aiOutput?.summary.urs_pct || 13.3;
    const aiD = aiOutput?.summary.defect_rate_pct || 3.3;
    const now = new Date().toISOString();

    await api.flagDispute({
      assessment_id: `as-${batchInfo.batchId}`,
      batch_id: batchInfo.batchId,
      flagged_by_name: batchInfo.inspector,
      reason: disputeReason,
      explanation: disputeNotes
    });
    setShowDisputeModal(false);
    setVerificationDone('DISPUTED');
    setVerificationDetails({
      action: 'ARBITRATION REQUESTED',
      inspector: batchInfo.inspector,
      timestamp: now,
      ai_grade_a: aiG,
      final_grade_a: aiG,
      final_urs: aiU,
      final_defect: aiD,
      reason: `${disputeReason}${disputeNotes ? `: ${disputeNotes}` : ''}`
    });
  };

  // ================= GENERATE DIGITAL QUALITY REPORT =================
  const handleGenerateReport = async () => {
    const cleanId = batchInfo.batchId.replace(/[^a-zA-Z0-9]/g, '').slice(-4);
    const reportId = `rpt-${cleanId}`;
    const reportCode = `RPT-PV-2026-${cleanId}`;
    const qrCode = `PV-VERIFY-2026-${cleanId}-VALID`;

    const finalStatus =
      verificationDone === 'OVERRIDDEN'
        ? 'VERIFIED'
        : verificationDone === 'DISPUTED'
        ? 'UNDER_REVIEW'
        : (aiOutput?.summary.procurement_verdict === 'REJECTED_HIGH_DEFECTS' ? 'REJECTED' : 'APPROVED');

    const centerNames: Record<string, string> = {
      'c-lasalgaon': 'Lasalgaon APMC Main Yard',
      'c-pimpalgaon': 'Pimpalgaon Baswant Hub',
      'c-yeola': 'Yeola Sub-Market Yard',
      'c-mahuva': 'Mahuva APMC Dehydration Cluster',
      'c-dindori': 'Dindori Direct Procurement Center'
    };

    const finalGradeA = verificationDetails?.final_grade_a ?? (aiOutput?.summary.grade_a_pct || 83.3);
    const finalUrs = verificationDetails?.final_urs ?? (aiOutput?.summary.urs_pct || 13.3);
    const finalDefect = verificationDetails?.final_defect ?? (aiOutput?.summary.defect_rate_pct || 3.3);

    // Save batch in mock state
    await api.createBatch({
      batch_number: batchInfo.batchId,
      farmer_name: batchInfo.farmerName,
      supplier_farmer_id: batchInfo.farmerId,
      farmer_contact: batchInfo.farmerContact,
      variety: batchInfo.variety,
      center_id: batchInfo.center,
      center_name: centerNames[batchInfo.center] || 'Lasalgaon APMC Main Yard',
      total_lot_weight_kg: batchInfo.lotWeightKg,
      vehicle_number: batchInfo.vehicleNumber,
      arrival_date: batchInfo.date,
      sample_size: batchInfo.sampleSize,
      status: finalStatus,
      grade_a_pct: finalGradeA,
      urs_pct: finalUrs,
      defect_rate_pct: finalDefect,
    });

    // Build complete formal DigitalReport object
    const newReport: DigitalReport = {
      report_id: reportId,
      report_code: reportCode,
      document_title: "AI-Assisted Onion Quality Assessment Report",
      prototype_label: "Prototype Digital Quality Assessment Report",
      is_certified_claim: false,
      disclaimer: "PROTOTYPE DEMONSTRATION RECORD: Generated by PYAAZ-VISION SIH prototype. This digital report is based on analyzed sample trays and represents a prototype verification record for Smart India Hackathon evaluation.",
      qr_verification_code: qrCode,
      created_at: new Date().toISOString(),
      batch_info: {
        batch_id: batchInfo.batchId,
        batch_number: batchInfo.batchId,
        supplier_farmer_id: batchInfo.farmerId,
        farmer_name: batchInfo.farmerName,
        farmer_contact: batchInfo.farmerContact,
        variety: batchInfo.variety,
        total_lot_weight_kg: batchInfo.lotWeightKg,
        vehicle_number: batchInfo.vehicleNumber,
        arrival_date: batchInfo.date,
        final_status: finalStatus
      },
      procurement_center: {
        id: batchInfo.center,
        code: batchInfo.center === 'c-lasalgaon' ? 'APMC-LASALGAON-01' : (batchInfo.center === 'c-pimpalgaon' ? 'APMC-PIMPALGAON-02' : 'APMC-MANDI-03'),
        name: centerNames[batchInfo.center] || 'Lasalgaon APMC Main Yard',
        district: batchInfo.center === 'c-mahuva' ? 'Bhavnagar' : 'Nashik',
        state: batchInfo.center === 'c-mahuva' ? 'Gujarat' : 'Maharashtra'
      },
      sampling_info: {
        inspector_name: batchInfo.inspector,
        sample_tray_count: samples.length,
        sample_size_count: aiOutput?.summary.total_detected || batchInfo.sampleSize,
        reference_object_diameter_mm: referenceMm || 27.0
      },
      ai_findings: aiOutput?.summary || {
        total_onions_detected: 60,
        grade_a_count: 50,
        grade_a_pct: 83.3,
        urs_count: 8,
        urs_pct: 13.3,
        damaged_count: 1,
        damaged_pct: 1.7,
        rotten_count: 0,
        rotten_pct: 0.0,
        sprouted_count: 1,
        sprouted_pct: 1.7,
        undersized_count: 5,
        undersized_pct: 8.3,
        defect_count: 2,
        defect_rate_pct: 3.3,
        average_diameter_mm: 54.2,
        average_confidence: 0.94,
        procurement_verdict: "ACCEPTED_GRADE_A",
        recommended_action: "Approved for Grade A procurement"
      },
      human_verification: {
        action: verificationDetails?.action || (verificationDone ? 'ACCEPTED' : 'ACCEPT_AI'),
        inspector: batchInfo.inspector,
        final_grade_a: finalGradeA,
        final_urs: finalUrs,
        final_defect: finalDefect,
        reason: verificationDetails?.reason || 'AI grading validated by procurement inspector',
        timestamp: verificationDetails?.timestamp || new Date().toISOString()
      }
    };

    // Save in dynamic storage
    api.saveReport(newReport);

    // Navigate directly to the newly generated report
    navigate(`/reports/${reportId}`);
  };

  const advanceStep = (nextStep: number) => {
    setStep(nextStep);
    setMaxStepReached(prev => Math.max(prev, nextStep));
  };

  const getColorClass = (label: string) => {
    switch (label) {
      case 'GRADE A':
        return { border: 'border-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' };
      case 'URS':
        return { border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' };
      case 'DAMAGED':
        return { border: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
      case 'ROTTEN':
        return { border: 'border-red-800', bg: 'bg-red-900/30', text: 'text-red-900', badge: 'bg-red-200 text-red-900' };
      case 'SPROUTED':
        return { border: 'border-purple-600', bg: 'bg-purple-600/20', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' };
      default:
        return { border: 'border-slate-500', bg: 'bg-slate-500/20', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  const stepLabels = [
    '1. Batch Info',
    '2. Sampling Trays',
    '3. Quality Check',
    '4. AI Analysis',
    '5. Assessment Result'
  ];

  const activeSample = samples[activeSampleIndex] || samples[0];

  const filteredDetections = (aiOutput?.detections || []).filter(d =>
    filterClass === 'ALL' ? true : d.label === filterClass
  );

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-card border border-border p-5 rounded-card shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase tracking-wider">
                Procurement Workflow
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                APMC Mandi Yard Intake
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary mt-1">New Onion Quality Assessment</h1>
          </div>
          <span className="text-xs text-secondary font-medium">
            Step {step} of 5 • Session: <span className="font-mono text-slate-700 font-semibold">{batchInfo.batchId}</span>
          </span>
        </div>

        {/* Stepper Navigation */}
        <div className="grid grid-cols-5 gap-2 border-t border-border pt-4">
          {stepLabels.map((lbl, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;
            const isAccessible = stepNum <= maxStepReached;
            return (
              <div
                key={lbl}
                onClick={() => isAccessible && setStep(stepNum)}
                className={`flex flex-col items-center text-center transition-all ${
                  isAccessible ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'
                }`}
                title={isAccessible ? `Jump to ${lbl}` : 'Complete prior steps to unlock'}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:inline ${
                    isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {lbl}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= STEP 1: BATCH INFORMATION ================= */}
      {step === 1 && (
        <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-bold text-primary">Step 1: Inward Batch & Farmer Identification</h2>
            <p className="text-xs text-secondary">Record vehicle arrival details, grower credentials, and assign inspector session.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch / Lot Tracking Number</label>
              <input
                type="text"
                value={batchInfo.batchId}
                onChange={e => setBatchInfo({ ...batchInfo, batchId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 font-mono text-primary focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Procurement Center (APMC Mandi)</label>
              <select
                value={batchInfo.center}
                onChange={e => setBatchInfo({ ...batchInfo, center: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary focus:ring-1 focus:ring-indigo-500"
              >
                <option value="c-lasalgaon">Lasalgaon APMC Main Yard (Nashik)</option>
                <option value="c-pimpalgaon">Pimpalgaon Baswant Hub (Nashik)</option>
                <option value="c-yeola">Yeola Sub-Market Yard (Nashik)</option>
                <option value="c-mahuva">Mahuva APMC Dehydration Cluster (Gujarat)</option>
                <option value="c-dindori">Dindori Direct Procurement Center</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Farmer / Supplier ID</label>
              <input
                type="text"
                value={batchInfo.farmerId}
                onChange={e => setBatchInfo({ ...batchInfo, farmerId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Farmer Full Name</label>
              <input
                type="text"
                value={batchInfo.farmerName}
                onChange={e => setBatchInfo({ ...batchInfo, farmerName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Farmer Mobile Contact</label>
              <input
                type="text"
                value={batchInfo.farmerContact}
                onChange={e => setBatchInfo({ ...batchInfo, farmerContact: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Onion Harvest Variety</label>
              <select
                value={batchInfo.variety}
                onChange={e => setBatchInfo({ ...batchInfo, variety: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary"
              >
                <option value="Nashik Red / Garwa">Nashik Red / Garwa (Rabi Harvest)</option>
                <option value="Late Kharif (Rangda)">Late Kharif (Rangda Red)</option>
                <option value="Early Kharif (Pol)">Early Kharif (Pol)</option>
                <option value="White Onion">White Onion (Dehydration Processing)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Inward Lot Weight (Kg)</label>
              <input
                type="number"
                value={batchInfo.lotWeightKg}
                onChange={e => setBatchInfo({ ...batchInfo, lotWeightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Registration Number</label>
              <input
                type="text"
                value={batchInfo.vehicleNumber}
                onChange={e => setBatchInfo({ ...batchInfo, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Arrival Date</label>
              <input
                type="date"
                value={batchInfo.date}
                onChange={e => setBatchInfo({ ...batchInfo, date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Representative Sample Size (Bulbs)</label>
              <input
                type="number"
                value={batchInfo.sampleSize}
                onChange={e => setBatchInfo({ ...batchInfo, sampleSize: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary"
              />
              <span className="text-[11px] text-secondary">Recommended: 60 bulbs across 4 sampling trays</span>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Inspecting Officer</label>
              <input
                type="text"
                value={batchInfo.inspector}
                onChange={e => setBatchInfo({ ...batchInfo, inspector: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 font-medium text-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={() => advanceStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            >
              Proceed to Optical Sampling
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: SAMPLING & IMAGE INPUT ================= */}
      {step === 2 && (
        <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-6">
          <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-primary">Step 2: Sample Image Capture &amp; Loading</h2>
              <p className="text-xs text-secondary">
                Upload or photograph representative sample trays for batch-level computer-vision grading.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {samples.length} Trays Configured
              </span>
              <button
                type="button"
                onClick={handleAddSample}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tray
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Sample Trays Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {samples.map((s, idx) => {
              const isSelected = activeSampleIndex === idx;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSampleIndex(idx)}
                  className={`relative cursor-pointer rounded-xl border p-3 text-center transition-all group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                      : 'border-border bg-white hover:border-slate-300'
                  }`}
                >
                  {samples.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSample(idx);
                      }}
                      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/90 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove sample tray"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200 relative">
                    <img
                      src={s.preview}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80";
                      }}
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Tray 0{idx + 1}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-primary">{s.name}</p>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {s.file ? `${(s.file.size / 1024).toFixed(0)} KB Uploaded` : 'Standard Tray Ready'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Sample Tray Preview & Upload Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-primary flex items-center gap-2">
                  <span>Active Focus: {activeSample.name}</span>
                  {activeSample.file ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Custom File: {(activeSample.file.size / 1024).toFixed(0)} KB
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                      Reference Lot Sample
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-secondary mt-0.5">
                  Capture directly via live browser camera or pick a high-res optical tray photo (JPG, PNG, WEBP &le; 15MB)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                {activeSample.file ? 'Replace File' : 'Upload Image File'}
              </button>

              {activeSample.file && (
                <button
                  type="button"
                  onClick={handleRevertSampleImage}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                  title="Remove uploaded image and revert to default tray"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Image
                </button>
              )}

              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                Live Camera Capture
              </button>
            </div>
          </div>

          {/* REAL BROWSER CAMERA CAPTURE MODAL */}
          {isCameraOpen && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-bold text-primary">Live Optical Tray Capture</h3>
                      <p className="text-[11px] text-secondary">Align the onion lot within the frame</p>
                    </div>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {cameraError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Camera Access Issue</span>
                    </div>
                    <p>{cameraError}</p>
                    <button
                      onClick={() => {
                        stopCamera();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 px-3 py-1.5 bg-white border border-red-300 rounded-lg text-red-800 font-semibold text-xs"
                    >
                      Use File Upload Instead
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-4/3 bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Viewfinder reticle overlay */}
                      <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none flex items-center justify-center">
                        <span className="text-[11px] bg-black/60 text-white px-2 py-1 rounded">
                          Center onion lot in frame
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={stopCamera}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 cursor-pointer shadow-md"
                      >
                        <Camera className="w-4 h-4" />
                        Snap Photo &amp; Use Tray
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-border">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-secondary hover:text-primary cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => {
                advanceStep(3);
                runQualityCheck();
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            >
              Run Image Quality Check
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: IMAGE QUALITY CHECK ================= */}
      {step === 3 && (
        <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-6">
          <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-primary">Step 3: Automated Optical Quality Screening</h2>
              <p className="text-xs text-secondary">
                Pre-inference validation of focus, illumination, framing, resolution, and bulb overlap.
              </p>
            </div>
            <button
              onClick={runQualityCheck}
              disabled={isCheckingQuality}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-border rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingQuality ? 'animate-spin' : ''}`} />
              Re-verify Quality
            </button>
          </div>

          {isCheckingQuality ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-primary">Evaluating optical criteria...</p>
              <p className="text-xs text-secondary">Computing Laplacian variance &amp; color space illumination histograms</p>
            </div>
          ) : qualityResult ? (
            <div className="space-y-6">
              {/* Verdict Status Banner (PASS / WARNING / RECAPTURE REQUIRED) */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  qualityResult.status === 'RECAPTURE REQUIRED' || !qualityResult.is_acceptable
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : qualityResult.status === 'WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {qualityResult.is_acceptable ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                        qualityResult.status === 'RECAPTURE REQUIRED' || !qualityResult.is_acceptable
                          ? 'bg-red-200 text-red-900'
                          : qualityResult.status === 'WARNING'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}>
                        STATUS: {qualityResult.status || (qualityResult.is_acceptable ? 'PASS' : 'RECAPTURE REQUIRED')}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 text-slate-800">
                        Score: {qualityResult.overall_score}/100
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 text-slate-800">
                        Resolution: {qualityResult.resolution || '1920 x 1080 px'}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5 text-slate-700">{qualityResult.summary}</p>
                  </div>
                </div>

                {(!qualityResult.is_acceptable || qualityResult.status === 'RECAPTURE REQUIRED') && (
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-xs shrink-0 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Recapture / Replace Image
                  </button>
                )}
              </div>

              {/* 4 Quality Check Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Blur Check */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">Sharpness / Focus</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      qualityResult.checks.blur.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {qualityResult.checks.blur.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">Laplacian: {qualityResult.checks.blur.value}</p>
                  <p className="text-xs font-medium text-slate-700 mt-2">{qualityResult.checks.blur.message}</p>
                </div>

                {/* Brightness Check */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">Illumination</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      qualityResult.checks.brightness.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {qualityResult.checks.brightness.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">Luminance: {qualityResult.checks.brightness.value}/255</p>
                  <p className="text-xs font-medium text-slate-700 mt-2">{qualityResult.checks.brightness.message}</p>
                </div>

                {/* Framing Check */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">Tray Framing</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      qualityResult.checks.framing.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {qualityResult.checks.framing.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">Coverage: {qualityResult.checks.framing.value}</p>
                  <p className="text-xs font-medium text-slate-700 mt-2">{qualityResult.checks.framing.message}</p>
                </div>

                {/* Overlap Check */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">Bulb Separation</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      qualityResult.checks.overlap.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {qualityResult.checks.overlap.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">Congestion: {qualityResult.checks.overlap.value}</p>
                  <p className="text-xs font-medium text-slate-700 mt-2">{qualityResult.checks.overlap.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-between pt-4 border-t border-border">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-secondary hover:text-primary cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Sampling
            </button>

            <button
              onClick={runAIAnalysis}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Execute AI Quality Pipeline
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: AI PIPELINE EXECUTION ================= */}
      {step === 4 && (
        <div className="bg-card border border-border p-8 rounded-card shadow-card text-center space-y-6">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-primary">Executing AI Quality Intelligence Pipeline</h2>
            <p className="text-xs text-secondary">{currentPipelineStage}</p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-indigo-700">{analysisProgress}% Complete</span>

            {/* Pipeline checklist */}
            <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Check className={`w-3.5 h-3.5 ${analysisProgress >= 25 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={analysisProgress >= 25 ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Laplacian edge &amp; illumination normalization
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`w-3.5 h-3.5 ${analysisProgress >= 50 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={analysisProgress >= 50 ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Candidate bulb localization &amp; bounding box assignment
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`w-3.5 h-3.5 ${analysisProgress >= 70 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={analysisProgress >= 70 ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Defect classification (rot, sprouting, mechanical cuts)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`w-3.5 h-3.5 ${analysisProgress >= 90 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={analysisProgress >= 90 ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Metric diameter sizing &amp; APMC grade aggregation
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 5: ASSESSMENT RESULT & VISUAL OVERLAYS ================= */}
      {step === 5 && aiOutput && (
        <div className="space-y-6">
          {/* VISUAL DETECTION ANALYSIS SCREEN (OVERLAYS ON UPLOADED IMAGE) */}
          <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-5">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Computer Vision Analysis
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Prototype Inference Engine
                  </span>
                </div>
                <h2 className="text-xl font-bold text-primary mt-1">Optical Detection &amp; Bounding Overlay</h2>
                <p className="text-xs text-secondary">
                  Detected {aiOutput.summary.total_detected} individual bulbs with metric diameter calibration and defect condition tagging.
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    showOverlays
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-border hover:bg-slate-50'
                  }`}
                >
                  {showOverlays ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
                </button>
              </div>
            </div>

            {/* Condition Legend */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">
                Condition Legend:
              </span>
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600 inline-block" />
                  Healthy / Grade A
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 border border-amber-600 inline-block" />
                  Undersized / URS
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span className="w-3 h-3 rounded-sm bg-red-500 border border-red-600 inline-block" />
                  Damaged (Harvest Cut)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span className="w-3 h-3 rounded-sm bg-red-900 border border-red-950 inline-block" />
                  Rotten (Black Mold)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span className="w-3 h-3 rounded-sm bg-purple-600 border border-purple-700 inline-block" />
                  Sprouted (Apical Shoot)
                </span>
              </div>
            </div>

            {/* PRIMARY VISUAL DETECTION CANVAS */}
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
              <img
                src={activeSample.preview}
                alt="Analyzed Tray"
                className="w-full h-full object-cover opacity-90"
                onError={(e: any) => {
                  e.target.src = "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=1000&auto=format&fit=crop&q=80";
                }}
              />

              {/* Reference Disc Indicator */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span>Ref Disk Calibration: {referenceMm || 27.0} mm (Standard ₹10 Coin)</span>
              </div>

              {/* Interactive Bounding Boxes Overlay */}
              {showOverlays &&
                aiOutput.detections.map((det) => {
                  const isSelected = selectedOnionId === det.onion_id;
                  const colors = getColorClass(det.label);
                  const [normX, normY, normW, normH] = det.bbox_norm;

                  return (
                    <div
                      key={det.onion_id}
                      onClick={() => setSelectedOnionId(det.onion_id)}
                      style={{
                        left: `${normX * 100}%`,
                        top: `${normY * 100}%`,
                        width: `${normW * 100}%`,
                        height: `${normH * 100}%`
                      }}
                      className={`absolute cursor-pointer border-2 transition-all rounded-md flex flex-col justify-between ${
                        colors.border
                      } ${
                        isSelected
                          ? 'ring-4 ring-white bg-white/30 z-20 scale-105 shadow-lg'
                          : colors.bg + ' hover:border-white'
                      }`}
                    >
                      {/* Top Tag */}
                      <div className="flex items-center justify-between p-1">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs ${colors.badge}`}>
                          {det.label}
                        </span>
                      </div>

                      {/* Bottom Tag */}
                      <div className="p-0.5 flex justify-between items-center text-[9px] font-bold text-white bg-black/75 px-1 rounded-b">
                        <span>{det.onion_id}</span>
                        <span>{det.diameter_mm} mm</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Individual Onion Detection Diagnostics List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Individual Onion Detections ({aiOutput.detections.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Click any row to highlight its bounding box on the image
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-border rounded-xl bg-white divide-y divide-border">
                {aiOutput.detections.map((d) => {
                  const isSelected = selectedOnionId === d.onion_id;
                  const colors = getColorClass(d.label);
                  return (
                    <div
                      key={d.onion_id}
                      onClick={() => setSelectedOnionId(d.onion_id)}
                      className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-primary">{d.onion_id}</span>
                        <span>&rarr;</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${colors.badge}`}>
                          {d.label}
                        </span>
                        <span>&rarr;</span>
                        <span className="font-bold text-slate-900">{d.diameter_mm} mm</span>
                        <span className="text-slate-400 text-[11px]">({d.size_category})</span>
                      </div>

                      <div className="flex items-center gap-3 text-secondary text-[11px]">
                        <span>Feature: <strong className="text-slate-700">{d.defect_type || 'None'}</strong></span>
                        <span className="font-mono">Conf: {(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BATCH QUALITY COMPOSITION STATISTICS */}
          <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-6">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Mathematical Parity Confirmed
                </span>
                <h2 className="text-lg font-bold text-primary mt-1">Batch Quality Composition Analysis</h2>
                <p className="text-xs text-secondary">
                  Total Analyzed: {aiOutput.summary.total_detected} bulbs • Exact statistical distribution
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                  Avg Diameter: {aiOutput.summary.average_diameter_mm} mm
                </span>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700">
                  Mean Confidence: {(aiOutput.summary.average_confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Quality Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              {/* Total Detected */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[11px] text-secondary font-medium">Total Detected</span>
                <p className="text-xl font-extrabold text-primary mt-1">{aiOutput.summary.total_detected}</p>
                <span className="text-[10px] text-slate-500 font-medium">100.0%</span>
              </div>

              {/* Grade A */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="text-[11px] text-emerald-800 font-medium">Grade A (Prime)</span>
                <p className="text-xl font-extrabold text-gradeA mt-1">{aiOutput.summary.grade_a_pct}%</p>
                <span className="text-[10px] text-emerald-700 font-medium">{aiOutput.summary.grade_a_count} bulbs</span>
              </div>

              {/* URS */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-[11px] text-amber-800 font-medium">URS (FAQ)</span>
                <p className="text-xl font-extrabold text-urs mt-1">{aiOutput.summary.urs_pct}%</p>
                <span className="text-[10px] text-amber-700 font-medium">{aiOutput.summary.urs_count} bulbs</span>
              </div>

              {/* Damaged */}
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                <span className="text-[11px] text-red-800 font-medium">Damaged / Cuts</span>
                <p className="text-xl font-extrabold text-defect mt-1">{aiOutput.summary.damaged_pct}%</p>
                <span className="text-[10px] text-red-700 font-medium">{aiOutput.summary.damaged_count} bulbs</span>
              </div>

              {/* Rotten */}
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                <span className="text-[11px] text-red-800 font-medium">Rotten / Mold</span>
                <p className="text-xl font-extrabold text-red-800 mt-1">{aiOutput.summary.rotten_pct}%</p>
                <span className="text-[10px] text-red-700 font-medium">{aiOutput.summary.rotten_count} bulbs</span>
              </div>

              {/* Sprouted */}
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                <span className="text-[11px] text-purple-800 font-medium">Sprouted</span>
                <p className="text-xl font-extrabold text-purple-700 mt-1">{aiOutput.summary.sprouted_pct}%</p>
                <span className="text-[10px] text-purple-700 font-medium">{aiOutput.summary.sprouted_count} bulbs</span>
              </div>

              {/* Undersized */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-[11px] text-amber-800 font-medium">Undersized</span>
                <p className="text-xl font-extrabold text-amber-700 mt-1">{aiOutput.summary.undersized_pct}%</p>
                <span className="text-[10px] text-amber-700 font-medium">{aiOutput.summary.undersized_count} bulbs</span>
              </div>
            </div>

            {/* APMC Procurement Recommendation Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Procurement Recommendation:</span>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    aiOutput.summary.procurement_verdict === 'ACCEPTED_GRADE_A' ? 'bg-emerald-100 text-emerald-800' :
                    aiOutput.summary.procurement_verdict === 'REJECTED_HIGH_DEFECTS' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {aiOutput.summary.procurement_verdict.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1">{aiOutput.summary.recommended_action}</p>
              </div>

              <div className="text-right text-xs text-secondary">
                <span>Overall Defect Rate: </span>
                <strong className="text-defect font-bold">{aiOutput.summary.defect_rate_pct}%</strong>
              </div>
            </div>
          </div>

          {/* HUMAN VERIFICATION / AUDIT SECTION */}
          <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary">Human-in-the-Loop Verification</h3>
                <p className="text-xs text-secondary">
                  Inspectors must review and validate AI inference before formal certificate issuance.
                </p>
              </div>
              {verificationDone && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Status: {verificationDone}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptAI}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Accept AI Result
                </button>

                <button
                  onClick={() => setShowOverrideModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-slate-500" />
                  Override Values
                </button>

                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Scale className="w-4 h-4 text-amber-700" />
                  Request Review / Flag Dispute
                </button>
              </div>

              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm ml-auto cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                Generate Digital Quality Report
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {verificationDetails && (
              <div className="mt-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-indigo-900">Recorded Verification Audit Log</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700">
                    {new Date(verificationDetails.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Mode</span>
                    <span className="font-semibold text-slate-900">{verificationDetails.action}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sign-off Officer</span>
                    <span className="font-semibold text-slate-900">{verificationDetails.inspector}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">AI Grade A %</span>
                    <span className="font-mono font-semibold text-slate-700">{verificationDetails.ai_grade_a}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Final Grade A %</span>
                    <span className="font-mono font-bold text-emerald-700">{verificationDetails.final_grade_a}%</span>
                  </div>
                </div>
                {verificationDetails.reason && (
                  <div className="pt-1.5 border-t border-indigo-100/60 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Audit Justification: </span>
                    {verificationDetails.reason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* OVERRIDE MODAL */}
          {showOverrideModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-elevated space-y-4">
                <div>
                  <h3 className="text-base font-bold text-primary">Override AI Assessment Values</h3>
                  <p className="text-xs text-secondary">
                    Provide adjusted human grades and mandatory technical justification for auditing.
                  </p>
                </div>

                {overrideError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{overrideError}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Final Grade A %</label>
                    <input
                      type="number"
                      value={overrideData.gradeA}
                      onChange={e => setOverrideData({ ...overrideData, gradeA: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Final URS %</label>
                    <input
                      type="number"
                      value={overrideData.urs}
                      onChange={e => setOverrideData({ ...overrideData, urs: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Final Defects %</label>
                    <input
                      type="number"
                      value={overrideData.defects}
                      onChange={e => setOverrideData({ ...overrideData, defects: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-800">
                    Mandatory Technical Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify physical verification findings (e.g. Superficial peel abrasion rather than deep flesh rot)..."
                    value={overrideData.reason}
                    onChange={e => {
                      setOverrideData({ ...overrideData, reason: e.target.value });
                      if (e.target.value.trim()) setOverrideError(null);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-xs ${
                      overrideError ? 'border-red-400 focus:ring-red-400' : 'border-border'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400">
                    A recorded reason is strictly required before overriding AI sensory models.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      setShowOverrideModal(false);
                      setOverrideError(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOverrideSubmit}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs"
                  >
                    Confirm &amp; Store Override
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DISPUTE MODAL */}
          {showDisputeModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-elevated space-y-4">
                <div>
                  <h3 className="text-base font-bold text-primary">Flag Assessment for Arbitration Review</h3>
                  <p className="text-xs text-secondary">
                    Submits this lot to the APMC Dispute Arbitration Committee for secondary sampling.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Dispute Reason</label>
                  <select
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs"
                  >
                    <option value="AI result appears inconsistent">AI result appears inconsistent</option>
                    <option value="Poor image quality">Poor image quality</option>
                    <option value="Sampling tray discrepancy">Sampling tray discrepancy</option>
                    <option value="Farmer disagreement on URS ratio">Farmer disagreement on URS ratio</option>
                    <option value="Manual lab arbitration required">Manual lab arbitration required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Explanation &amp; Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Specify farmer dispute details or reasons for disagreement..."
                    value={disputeNotes}
                    onChange={e => setDisputeNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => setShowDisputeModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisputeSubmit}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 cursor-pointer shadow-xs"
                  >
                    Submit for Arbitration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewAssessment;
