import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';

interface DemoBannerProps {
  currentScenario?: string;
  onScenarioChange?: (scenario: string) => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ currentScenario = 'standard', onScenarioChange }) => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 uppercase tracking-wider text-[10px]">
          <Sparkles className="w-3 h-3 text-amber-800" />
          SIH Prototype Demo Mode
        </span>
        <span className="hidden sm:inline text-amber-800">
          Inference outputs simulate live APMC optical scanning trays. No real model accuracy claimed.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="scenario-select" className="font-medium text-amber-900">
          Presenter Scenario:
        </label>
        <select
          id="scenario-select"
          value={currentScenario}
          onChange={(e) => onScenarioChange && onScenarioChange(e.target.value)}
          className="bg-white border border-amber-300 text-amber-900 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-amber-500 font-medium"
        >
          <option value="standard">Standard Lot (Balanced 83% Grade A)</option>
          <option value="high_quality">High Quality Batch (92% Grade A)</option>
          <option value="high_undersized">High Undersized Batch (Chhata / URS)</option>
          <option value="high_damage">High Damage Batch (Harvest Cuts / 26% Defect)</option>
          <option value="high_sprouting">High Sprouting Batch (Broken Dormancy)</option>
          <option value="poor_image">Poor Image (Recapture Recommended)</option>
          <option value="ai_human_disagreement">AI vs Human Disagreement Case</option>
        </select>
      </div>
    </div>
  );
};
