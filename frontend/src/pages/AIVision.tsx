import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Sliders,
  Sparkles,
  Info,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Check,
  Eye,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';
import { Detection, QualityResult } from '../types';

export const AIVision: React.FC = () => {
  const { scenario, referenceMm, setReferenceMm } = useDemo();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [summary, setSummary] = useState<QualityResult | null>(null);
  const [selectedOnionId, setSelectedOnionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [calibRefMm, setCalibRefMm] = useState<number>(referenceMm || 27.0);
  const [calibPx, setCalibPx] = useState<number>(113);
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  // Active image / tray selection
  const [activeImage, setActiveImage] = useState<string>('/assets/sample-onion-tray-01.jpg');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleTrays = [
    { id: 1, name: 'Sample Tray 01', url: '/assets/sample-onion-tray-01.jpg' },
    { id: 2, name: 'Sample Tray 02', url: '/assets/sample-onion-tray-02.jpg' },
    { id: 3, name: 'Sample Tray 03', url: '/assets/sample-onion-tray-03.jpg' },
    { id: 4, name: 'Sample Tray 04', url: '/assets/sample-onion-tray-04.jpg' },
    { id: 5, name: 'Sample Tray 05', url: '/assets/sample-onion-tray-05.jpg' },
    { id: 6, name: 'Sample Tray 06', url: '/assets/sample-onion-tray-06.jpg' },
    { id: 7, name: 'Sample Tray 07', url: '/assets/sample-onion-tray-07.jpg' },
    { id: 8, name: 'Sample Tray 08', url: '/assets/sample-onion-tray-08.jpg' },
  ];

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.analyzeImage(uploadedFile || undefined, scenario, calibRefMm);
      setDetections(res.detections);
      setSummary(res.summary_metrics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [scenario, uploadedFile, activeImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate by MIME type (primary) OR extension (fallback)
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const validExtensions = /\.(jpe?g|png|webp)$/i;
      const mimeOk = validMimeTypes.includes(file.type) || file.type === 'image/jpg';
      const extOk = validExtensions.test(file.name);
      if (!mimeOk && !extOk) return; // silently ignore invalid types in AIVision
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setActiveImage(url);
    }
  };

  const handleApplyCalibration = async () => {
    try {
      await api.calibrate(calibRefMm, calibPx);
      setReferenceMm(calibRefMm);
      setShowCalibrationModal(false);
      runAnalysis();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDetections = filterClass === 'ALL'
    ? detections
    : detections.filter(d => d.label === filterClass);

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

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-border p-5 rounded-card shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">AI Vision Quality Inspection</h1>
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Inference Evidence Map
            </span>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Interactive bounding boxes with computer-vision contour classification and millimeter sizing.
          </p>
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
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Test Tray
          </button>
          <button
            onClick={() => setShowCalibrationModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-border rounded-xl hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Size Calibration ({referenceMm} mm)
          </button>
          <button
            onClick={runAnalysis}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-run Inference
          </button>
        </div>
      </div>

      {/* Tray Selector Toolbar */}
      <div className="bg-card border border-border p-3.5 rounded-card shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 text-xs">Select Test Tray:</span>
          {sampleTrays.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveImage(t.url);
                setUploadedFile(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeImage === t.url && !uploadedFile
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.name}
            </button>
          ))}
          {uploadedFile && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              Custom Upload: {uploadedFile.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              showOverlays
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-border hover:bg-slate-50'
            }`}
          >
            {showOverlays ? 'Hide Boxes' : 'Show Boxes'}
          </button>
        </div>
      </div>

      {/* Main Grid: Bounding Box Canvas + Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Visual Tray with Interactive Bounding Boxes */}
        <div className="lg:col-span-2 bg-card border border-border rounded-card shadow-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-primary">Inspection Tray View (Optical Scan)</span>
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Grade A</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> URS</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Damaged</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-900" /> Rotten</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Sprouted</span>
              </div>
            </div>

            {/* Interactive Image Overlay Container */}
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={activeImage}
                alt="Onion Tray"
                className="w-full h-full object-cover opacity-85"
                onError={(e: any) => {
                  e.target.src = "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=1000&auto=format&fit=crop&q=80";
                }}
              />

              {/* Reference calibration marker watermark */}
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Ref Disk: {referenceMm} mm (₹10 Coin calibrated)
              </div>

              {/* Bounding Boxes */}
              {showOverlays &&
                detections.map((det) => {
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
                      className={`absolute cursor-pointer border-2 transition-all rounded-sm flex flex-col justify-between ${
                        colors.border
                      } ${isSelected ? 'ring-4 ring-white bg-white/30 z-20 scale-105' : colors.bg + ' hover:border-white'}`}
                    >
                      {/* Top Tag */}
                      <div className="flex items-center justify-between p-0.5">
                        <span className={`text-[9px] font-extrabold uppercase px-1 rounded shadow-xs ${colors.badge}`}>
                          {det.label}
                        </span>
                      </div>

                      {/* Bottom Tag */}
                      <div className="p-0.5 flex justify-between items-center text-[9px] font-bold text-white bg-black/70 px-1">
                        <span>{det.onion_id}</span>
                        <span>{det.diameter_mm}mm</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-secondary mt-3">
            <span>Click on any onion bounding box to focus its classification evidence below.</span>
            <span className="font-semibold text-indigo-700">Prototype Inference Mode</span>
          </div>
        </div>

        {/* Right Column: Detection Summary & Confidence breakdown */}
        <div className="bg-card border border-border rounded-card shadow-card p-5 space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-primary">Inference Summary</h2>
              <p className="text-xs text-secondary">Tray-level count &amp; percentage breakdown</p>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-primary">Total Detected</span>
                <span className="font-extrabold text-sm">{summary?.total_detected || detections.length} bulbs</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-semibold text-emerald-900">Grade A (Prime)</span>
                <span className="font-extrabold text-gradeA">
                  {summary?.grade_a_count} ({summary?.grade_a_pct}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-semibold text-amber-900">Undersized / URS</span>
                <span className="font-extrabold text-amber-800">
                  {summary?.undersized_count} ({summary?.undersized_pct}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
                <span className="font-semibold text-red-900">Mechanical Damage</span>
                <span className="font-extrabold text-defect">
                  {summary?.damaged_count} ({summary?.damaged_pct}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
                <span className="font-semibold text-red-950">Rotten / Mold</span>
                <span className="font-extrabold text-red-900">
                  {summary?.rotten_count} ({summary?.rotten_pct}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 border border-purple-200">
                <span className="font-semibold text-purple-900">Sprouted (Shoots)</span>
                <span className="font-extrabold text-purple-700">
                  {summary?.sprouted_count} ({summary?.sprouted_pct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Model confidence note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inference Confidence Protocol</span>
            </div>
            <p className="text-[11px] text-secondary leading-relaxed">
              Confidence scores (avg: {summary ? `${(summary.average_confidence * 100).toFixed(0)}%` : '93%'}) represent feature match scores calculated across detected onion contours and morphological boundary features.
            </p>
          </div>
        </div>
      </div>

      {/* Detection Evidence Table */}
      <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-primary">View Detection Evidence &amp; Sizing</h2>
            <p className="text-xs text-secondary">
              Per-bulb diagnostic evidence, metric diameter calculations, and defect classifications.
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-secondary" />
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Categories ({detections.length})</option>
              <option value="GRADE A">Grade A Only</option>
              <option value="URS">URS Only</option>
              <option value="DAMAGED">Damaged Only</option>
              <option value="ROTTEN">Rotten Only</option>
              <option value="SPROUTED">Sprouted Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-secondary border-b border-border uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Onion ID</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Est. Size (mm)</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Defect Feature</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Visual Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-700">
              {filteredDetections.map((d) => {
                const isSelected = selectedOnionId === d.onion_id;
                const colors = getColorClass(d.label);

                return (
                  <tr
                    key={d.onion_id}
                    onClick={() => setSelectedOnionId(d.onion_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-primary font-mono">
                      {d.onion_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${colors.badge}`}>
                        {d.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {d.diameter_mm} mm
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {d.size_category}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {d.defect_type || 'None'}
                    </td>
                    <td className="px-4 py-3 text-secondary font-mono">
                      {(d.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {d.evidence}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIZE CALIBRATION MODAL */}
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-elevated space-y-4">
            <div>
              <h3 className="text-base font-bold text-primary">Metric Reference Calibration</h3>
              <p className="text-xs text-secondary">
                Calibrate millimeter scale using a known reference object placed in the sampling tray.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Reference Object Diameter (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calibRefMm}
                  onChange={e => setCalibRefMm(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
                <span className="text-[11px] text-secondary">
                  Default: 27.0 mm (Standard Indian ₹10 coin) or 50.0 mm reference disk
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Measured Reference Diameter in Image (Pixels)
                </label>
                <input
                  type="number"
                  value={calibPx}
                  onChange={e => setCalibPx(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-primary">Computed Scale Ratio:</span>
                <p className="text-sm font-mono font-bold text-indigo-700 mt-1">
                  {(calibPx / Math.max(1, calibRefMm)).toFixed(3)} pixels / mm
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowCalibrationModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCalibration}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 cursor-pointer"
              >
                Apply &amp; Recalibrate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIVision;
