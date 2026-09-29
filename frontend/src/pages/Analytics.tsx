import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Scale,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Building,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';

export const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [centerFilter, setCenterFilter] = useState<string>('ALL');
  const [varietyFilter, setVarietyFilter] = useState<string>('ALL');
  const [rawTrendData, setRawTrendData] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAnalyticsTrends(timeframe),
      api.getAnalyticsOverview()
    ])
      .then(([tRes, oRes]) => {
        setRawTrendData(tRes.data);
        setOverview(oRes);
      })
      .finally(() => setLoading(false));
  }, [timeframe]);

  // Adjust metrics dynamically based on center & variety filters
  const trendData = useMemo(() => {
    let multiplier = 1.0;
    let defectOffset = 0.0;

    if (centerFilter === 'c-lasalgaon') { multiplier = 1.04; defectOffset = -0.8; }
    else if (centerFilter === 'c-pimpalgaon') { multiplier = 0.96; defectOffset = 0.6; }
    else if (centerFilter === 'c-yeola') { multiplier = 0.88; defectOffset = 2.4; }
    else if (centerFilter === 'c-mahuva') { multiplier = 1.06; defectOffset = -1.2; }
    else if (centerFilter === 'c-dindori') { multiplier = 0.94; defectOffset = 1.1; }

    if (varietyFilter === 'rangda') { defectOffset += 1.5; }
    else if (varietyFilter === 'white') { multiplier *= 1.03; defectOffset -= 0.5; }

    return rawTrendData.map(d => ({
      ...d,
      grade_a: Math.min(98, Math.max(40, Number((d.grade_a * multiplier).toFixed(1)))),
      urs: Math.min(50, Math.max(5, Number((d.urs / multiplier).toFixed(1)))),
      defects: Math.min(30, Math.max(1, Number((d.defects + defectOffset).toFixed(1)))),
      sprouting: Math.min(20, Math.max(0.5, Number((d.sprouting * (varietyFilter === 'rangda' ? 1.8 : 1.0)).toFixed(1))))
    }));
  }, [rawTrendData, centerFilter, varietyFilter]);

  const sizeData = overview?.size_distribution || [
    { range: "< 35 mm", percentage: 4.2 },
    { range: "35 - 40 mm", percentage: 8.1 },
    { range: "40 - 50 mm", percentage: 34.5 },
    { range: "50 - 65 mm", percentage: 42.8 },
    { range: "> 65 mm", percentage: 10.4 }
  ];

  // Derived filter KPIs
  const avgGradeA = trendData.length > 0 ? (trendData.reduce((acc, d) => acc + d.grade_a, 0) / trendData.length).toFixed(1) : '78.4';
  const avgDefects = trendData.length > 0 ? (trendData.reduce((acc, d) => acc + d.defects, 0) / trendData.length).toFixed(1) : '5.4';
  const totalVolume = trendData.reduce((acc, d) => acc + (d.volume || 20), 0);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header & Main Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-border p-5 rounded-card shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              Intelligence &amp; Procurement Analytics
            </h1>
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Multi-Metric Quality Curves
            </span>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Quality trajectories, dormancy breakdown trends, and human-vs-AI variance evaluation across harvest cohorts.
          </p>
        </div>

        {/* Timeframe Pill Buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-border text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              timeframe === '7d' ? 'bg-white text-primary shadow-xs font-bold' : 'text-secondary hover:text-primary'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              timeframe === '30d' ? 'bg-white text-primary shadow-xs font-bold' : 'text-secondary hover:text-primary'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeframe('90d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              timeframe === '90d' ? 'bg-white text-primary shadow-xs font-bold' : 'text-secondary hover:text-primary'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Analytics Interactive Filter Toolbar */}
      <div className="bg-card border border-border p-4 rounded-card shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Center Selector */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="font-semibold text-slate-700">Center:</span>
            <select
              value={centerFilter}
              onChange={e => setCenterFilter(e.target.value)}
              className="border border-border rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800 focus:bg-white"
            >
              <option value="ALL">All APMC Centers</option>
              <option value="c-lasalgaon">Lasalgaon APMC Yard</option>
              <option value="c-pimpalgaon">Pimpalgaon Baswant Hub</option>
              <option value="c-yeola">Yeola Sub-Yard</option>
              <option value="c-mahuva">Mahuva Dehydration Cluster</option>
              <option value="c-dindori">Dindori Center</option>
            </select>
          </div>

          {/* Variety Selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="font-semibold text-slate-700">Variety:</span>
            <select
              value={varietyFilter}
              onChange={e => setVarietyFilter(e.target.value)}
              className="border border-border rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800 focus:bg-white"
            >
              <option value="ALL">All Varieties</option>
              <option value="garwa">Nashik Red / Garwa (Rabi)</option>
              <option value="rangda">Late Kharif (Rangda)</option>
              <option value="white">White Onion (Dehydration)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
            Avg Grade A: <strong>{avgGradeA}%</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold">
            Avg Defect: <strong>{avgDefects}%</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold">
            Cohort Volume: <strong>{totalVolume} Lots</strong>
          </span>
        </div>
      </div>

      {/* Grid of Analytical Charts - 2 COLUMNS, FULL VIEWPORT WIDTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Grade A vs URS Trajectory */}
        <div className="bg-card border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-primary">Grade A vs URS Intake Percentage Trend</h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Target &ge; 75%</span>
            </div>
            <p className="text-xs text-secondary mt-0.5">Tracking seasonal quality maturation and harvest storage degradation</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="anGradeA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="anUrs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area type="monotone" dataKey="grade_a" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#anGradeA)" name="Grade A %" />
                <Area type="monotone" dataKey="urs" stroke="#D97706" strokeWidth={2.5} fillOpacity={1} fill="url(#anUrs)" name="URS %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Defect & Sprouting Trend */}
        <div className="bg-card border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-primary">Harvest Damage &amp; Sprouting Incidence Trend</h2>
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">Tolerance &le; 10%</span>
            </div>
            <p className="text-xs text-secondary mt-0.5">Post-monsoon humidity spikes and broken dormancy detection</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis domain={[0, 25]} stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line type="monotone" dataKey="defects" stroke="#DC2626" strokeWidth={2.5} name="Total Defects %" />
                <Line type="monotone" dataKey="sprouting" stroke="#7C3AED" strokeWidth={2.5} name="Sprouting %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Assessment Throughput Volume */}
        <div className="bg-card border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-primary">Daily Assessment Volume Throughput</h2>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Intake Speed</span>
            </div>
            <p className="text-xs text-secondary mt-0.5">Number of truckloads &amp; sample tray sessions inspected</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="volume" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Assessments Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: AI vs Human Variance (Disagreement Delta) */}
        <div className="bg-card border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-primary">AI vs Human Grading Variance Delta</h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                High Parity (&lt; 1.5% delta)
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">Difference between initial AI vision score and final inspector sign-off</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis domain={[0, 5]} stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line type="monotone" dataKey="ai_human_diff" stroke="#0284C7" strokeWidth={2.5} name="Average Delta (% Points)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Sizing Distribution across buffer */}
      <div className="bg-card border border-border p-5 rounded-card shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-primary">Aggregate Onion Sizing Profile Across All Active Stock</h2>
            <p className="text-xs text-secondary">Breakdown based on optical reference millimeter sizing calibrated against standard reference</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {sizeData.map((s: any) => (
            <div key={s.range} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <span className="text-xs font-semibold text-slate-600 block">{s.range}</span>
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-700 mt-1">{s.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
