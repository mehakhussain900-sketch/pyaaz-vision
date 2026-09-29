import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  Sparkles,
  ShieldCheck,
  Check,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { DemoScenario } from '../types';

export const Settings: React.FC = () => {
  const { scenario, setScenario, referenceMm, setReferenceMm } = useDemo();
  const [modelProvider, setModelProvider] = useState<'demo' | 'yolo'>('demo');
  const [minGradeA, setMinGradeA] = useState<number>(70);
  const [maxDefect, setMaxDefect] = useState<number>(10);
  const [maxRot, setMaxRot] = useState<number>(4);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const scenariosList = [
    { key: 'standard', name: 'Standard Balanced Lot', desc: 'Representative baseline arrival with 83% Grade A and 3.3% defects.' },
    { key: 'high_quality', name: 'High Quality Batch', desc: 'Uniform premium bulbs with 92% Grade A; instant procurement pass.' },
    { key: 'high_undersized', name: 'High Undersized Batch', desc: 'Over 50% sub-40mm bulbs classified into URS / Chhata category.' },
    { key: 'high_damage', name: 'High Damage Batch', desc: 'Severe harvest cuts & impact fractures resulting in 26% defect rate rejection.' },
    { key: 'high_sprouting', name: 'High Sprouting Batch', desc: 'Post-monsoon broken dormancy showing vegetative green shoots.' },
    { key: 'poor_image', name: 'Poor Image / Recapture', desc: 'Simulates camera shake, low illumination, and prompts recapture alert.' },
    { key: 'ai_human_disagreement', name: 'AI vs Human Disagreement', desc: 'Borderline lot for testing dispute arbitration and inspector override.' },
  ];

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-primary">System & AI Inference Settings</h1>
          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
            Configuration
          </span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Tune vision calibration, configure presentation test scenarios, and adjust APMC grading thresholds.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          Settings successfully updated.
        </div>
      )}

      {/* 1. Presentation Demonstration Presets */}
      <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Quality Profile Presets
          </h2>
          <p className="text-xs text-secondary">
            Configure optical grading sensitivity profiles for varying seasonal onion harvest conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scenariosList.map((sc) => {
            const isSelected = scenario === sc.key;
            return (
              <div
                key={sc.key}
                onClick={() => setScenario(sc.key as DemoScenario)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-border bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-800' : 'text-primary'}`}>
                    {sc.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-secondary mt-1 leading-snug">{sc.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Metric Size Calibration */}
      <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Optical Metric Calibration (Reference Target)
          </h2>
          <p className="text-xs text-secondary">
            Standard diameter of the physical coin or card placed alongside sample trays.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">
              Reference Disk Diameter (mm)
            </label>
            <input
              type="number"
              value={referenceMm}
              onChange={e => setReferenceMm(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white"
            />
            <span className="text-[11px] text-secondary">
              Common Indian standard: ₹10 Coin = 27.0 mm, ₹5 Coin = 23.0 mm
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-slate-800">APMC Classification Cutoffs:</span>
            <p className="text-slate-600">• Undersized / Chhata: &lt; 40.0 mm</p>
            <p className="text-slate-600">• Standard Medium: 40.0 mm to 60.0 mm</p>
            <p className="text-slate-600">• Bold / Premium: &gt; 60.0 mm</p>
          </div>
        </div>
      </div>

      {/* 3. AI Model Provider Architecture */}
      <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            AI Vision Inference Architecture
          </h2>
          <p className="text-xs text-secondary">
            Decoupled engine interface adhering to the modular `OnionInferenceEngine` contract.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div
            onClick={() => setModelProvider('demo')}
            className={`p-4 rounded-xl border cursor-pointer ${
              modelProvider === 'demo'
                ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
                : 'border-border bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-primary">Demo CV Provider (Active)</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                CONNECTED
              </span>
            </div>
            <p className="text-[11px] text-secondary leading-snug">
              OpenCV morphological segmentation + color space defect heuristics with scenario synthesis.
            </p>
          </div>

          <div
            onClick={() => setModelProvider('yolo')}
            className={`p-4 rounded-xl border cursor-pointer ${
              modelProvider === 'yolo'
                ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
                : 'border-border bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-primary">Ultralytics YOLO Engine</span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                SKELETON READY
              </span>
            </div>
            <p className="text-[11px] text-secondary leading-snug">
              Ready to load trained custom weights (`ai/weights/best_onion_yolov8.pt`).
            </p>
          </div>
        </div>
      </div>

      {/* 4. APMC Procurement Quality Thresholds */}
      <div className="bg-card border border-border p-6 rounded-card shadow-card space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            APMC Procurement Grading Criteria & Tolerances
          </h2>
          <p className="text-xs text-secondary">
            Configure threshold rules used to categorize incoming lots into Grade A, URS, or Rejection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Min Grade A % for Acceptance</label>
            <input
              type="number"
              value={minGradeA}
              onChange={e => setMinGradeA(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
            <span className="text-[10px] text-secondary">Default: 70.0%</span>
          </div>

          <div>
            <label className="block font-semibold mb-1">Max Total Defect Tolerance %</label>
            <input
              type="number"
              value={maxDefect}
              onChange={e => setMaxDefect(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
            <span className="text-[10px] text-secondary">Default: 10.0%</span>
          </div>

          <div>
            <label className="block font-semibold mb-1">Max Rotten / Mold Tolerance %</label>
            <input
              type="number"
              value={maxRot}
              onChange={e => setMaxRot(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
            <span className="text-[10px] text-secondary">Default: 4.0%</span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
