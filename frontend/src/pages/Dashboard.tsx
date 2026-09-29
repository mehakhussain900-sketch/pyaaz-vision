import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  Eye,
  FileText,
  Building,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { api } from '../services/api';
import { Batch } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, overviewRes, trendsRes] = await Promise.all([
        api.getBatches(),
        api.getAnalyticsOverview(),
        api.getAnalyticsTrends('30d')
      ]);
      setBatches(batchesRes);
      setOverview(overviewRes);
      setTrends(trendsRes.data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = overview?.kpis || {
    batches_assessed: { value: 542, change: "+14.2% vs last week" },
    onions_analysed: { value: 32840, change: "+8.5% throughput" },
    avg_grade_a: { value: 78.4 },
    avg_urs: { value: 15.6 },
    defect_rate: { value: 6.0 },
    assessments_today: { value: 24 }
  };

  const pieData = overview?.quality_distribution || [
    { name: "Grade A", value: 78.4, color: "#16A34A" },
    { name: "URS", value: 15.6, color: "#D97706" },
    { name: "Damaged", value: 3.4, color: "#DC2626" },
    { name: "Rotten", value: 1.2, color: "#991B1B" },
    { name: "Sprouted", value: 1.4, color: "#7C3AED" }
  ];

  const centerData = overview?.center_comparison || [
    { center: "Lasalgaon Yard", center_id: "c-lasalgaon", batches: 142, grade_a: 81.2, defect_rate: 4.5 },
    { center: "Pimpalgaon Hub", center_id: "c-pimpalgaon", batches: 118, grade_a: 76.4, defect_rate: 5.8 },
    { center: "Yeola Sub-Yard", center_id: "c-yeola", batches: 89, grade_a: 69.8, defect_rate: 8.8 },
    { center: "Mahuva Cluster", center_id: "c-mahuva", batches: 96, grade_a: 84.1, defect_rate: 3.9 },
    { center: "Dindori Center", center_id: "c-dindori", batches: 64, grade_a: 73.5, defect_rate: 6.4 }
  ];

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-border p-5 rounded-card shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              Quality Intelligence Dashboard
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE APMC FEED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Real-time optical grading, sample variance tracking, and procurement decisions across mandis. Last updated: <span className="font-mono font-medium text-slate-700">{lastRefreshed}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-border rounded-xl hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => navigate('/assessment/new')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start New Assessment
          </button>
        </div>
      </div>

      {/* KPI Cards Row - ALL FULLY INTERACTIVE & CLICKABLE */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Operational Key Performance Indicators (Click card to filter / explore)
          </span>
          <span className="text-[11px] text-indigo-600 font-medium hidden sm:inline">
            Interactive Filter Cards &rarr;
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Batches Assessed */}
          <div
            onClick={() => navigate('/batches')}
            className="bg-card border border-border p-4 rounded-card shadow-card hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
            title="Click to view all inward batches"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="text-xs font-semibold group-hover:text-indigo-600 transition-colors">Batches Assessed</span>
              <Layers className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary">{kpis.batches_assessed.value}</p>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-emerald-600 font-semibold">{kpis.batches_assessed.change}</span>
              <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">View &rarr;</span>
            </div>
          </div>

          {/* Onions Analysed */}
          <div
            onClick={() => navigate('/analytics')}
            className="bg-card border border-border p-4 rounded-card shadow-card hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
            title="Click to view detailed quality analytics & sizing distribution"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="text-xs font-semibold group-hover:text-indigo-600 transition-colors">Onions Analysed</span>
              <Sparkles className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary">{kpis.onions_analysed.value.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-emerald-600 font-semibold">{kpis.onions_analysed.change}</span>
              <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Analytics &rarr;</span>
            </div>
          </div>

          {/* Average Grade A */}
          <div
            onClick={() => navigate('/batches?status=APPROVED')}
            className="bg-card border border-border p-4 rounded-card shadow-card border-l-4 border-l-gradeA hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
            title="Click to view Approved Grade A batches"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="text-xs font-semibold group-hover:text-emerald-700 transition-colors">Average Grade A</span>
              <CheckCircle2 className="w-4 h-4 text-gradeA" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gradeA">{kpis.avg_grade_a.value}%</p>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-secondary">Target: &ge; 75.0%</span>
              <span className="text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Lots &rarr;</span>
            </div>
          </div>

          {/* Average URS */}
          <div
            onClick={() => navigate('/batches?status=UNDER_REVIEW')}
            className="bg-card border border-border p-4 rounded-card shadow-card border-l-4 border-l-urs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
            title="Click to view borderline URS batches requiring review"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="text-xs font-semibold group-hover:text-amber-700 transition-colors">Average URS</span>
              <AlertTriangle className="w-4 h-4 text-urs" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-urs">{kpis.avg_urs.value}%</p>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-secondary">Borderline / Chhata</span>
              <span className="text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Review &rarr;</span>
            </div>
          </div>

          {/* Defect Rate */}
          <div
            onClick={() => navigate('/batches?status=REJECTED')}
            className="bg-card border border-border p-4 rounded-card shadow-card border-l-4 border-l-defect hover:border-red-400 hover:shadow-md transition-all cursor-pointer group"
            title="Click to view rejected or high-defect batches"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="text-xs font-semibold group-hover:text-red-700 transition-colors">Defect Rate</span>
              <AlertTriangle className="w-4 h-4 text-defect" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-defect">{kpis.defect_rate.value}%</p>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-secondary">Tolerance: &le; 10.0%</span>
              <span className="text-red-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Rejected &rarr;</span>
            </div>
          </div>

          {/* Assessments Today */}
          <div
            onClick={() => navigate('/history')}
            className="bg-card border border-border p-4 rounded-card shadow-card hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
            title="Click to view today's assessment log in History"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="text-xs font-semibold group-hover:text-indigo-600 transition-colors">Today's Tests</span>
              <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary">{kpis.assessments_today.value}</p>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-emerald-600 font-medium">Live sync active</span>
              <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Log &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visuals Row: Wide Trajectory Chart (2 col) + Composition Donut (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade A vs URS Trajectory Chart */}
        <div className="lg:col-span-2 bg-card border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-primary">Grade A vs URS Quality Trajectory (30 Days)</h2>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">All Mandis</span>
              </div>
              <p className="text-xs text-secondary mt-0.5">Historical trend across incoming farm deliveries</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Grade A %
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> URS %
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradeAGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="ursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="grade_a" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#gradeAGrad)" name="Grade A %" />
                <Area type="monotone" dataKey="urs" stroke="#D97706" strokeWidth={2.5} fillOpacity={1} fill="url(#ursGrad)" name="URS %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Distribution Donut */}
        <div className="bg-card border border-border p-5 rounded-card shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm sm:text-base font-bold text-primary">Defect &amp; Quality Composition</h2>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Aggregated</span>
            </div>
            <p className="text-xs text-secondary mb-3">Overall breakdown across 32,840 analyzed bulbs</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Composition']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-3 border-t border-border">
            {pieData.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-slate-700 py-0.5">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </span>
                <span className="font-bold text-primary">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Procurement Center Analytics Benchmark */}
      <div className="bg-card border border-border p-5 rounded-card shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm sm:text-base font-bold text-primary">Procurement Center Quality Benchmark</h2>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Comparing average Grade A intake vs Defect incidence across APMC Mandis (Click any center to inspect)
            </p>
          </div>
          <button
            onClick={() => navigate('/centers')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            Manage All Procurement Centers &rarr;
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={centerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="center" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="grade_a" name="Average Grade A %" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="defect_rate" name="Average Defect %" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Quality Assessments Table - WITH FULL ROW INTERACTION */}
      <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-primary">Recent Quality Assessments</h2>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                Live Lot Inward Feed
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Click any row to open full batch inspection details &amp; sample tray logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <span>Complete Intake History</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-secondary border-b border-border uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3.5">Batch ID</th>
                <th className="px-4 py-3.5">Center</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Sample Size</th>
                <th className="px-4 py-3.5">Grade A</th>
                <th className="px-4 py-3.5">URS</th>
                <th className="px-4 py-3.5">Defect Rate</th>
                <th className="px-4 py-3.5">Confidence</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-700">
              {batches.slice(0, 8).map((b) => (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/batches/${b.id}`)}
                  className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 font-mono font-bold text-primary group-hover:text-indigo-600 transition-colors">
                    {b.batch_number}
                  </td>
                  <td className="px-4 py-3 text-secondary font-medium">
                    {b.center_name || 'Lasalgaon APMC'}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {b.arrival_date}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {b.sample_size || 60} bulbs
                  </td>
                  <td className="px-4 py-3 font-bold text-gradeA">
                    {b.grade_a_pct !== null && b.grade_a_pct !== undefined ? `${b.grade_a_pct}%` : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-urs">
                    {b.urs_pct !== null && b.urs_pct !== undefined ? `${b.urs_pct}%` : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-defect">
                    {b.defect_rate_pct !== null && b.defect_rate_pct !== undefined ? `${b.defect_rate_pct}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-secondary font-mono">
                    {b.confidence ? `${(b.confidence * 100).toFixed(0)}%` : '94%'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      b.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                      b.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                      b.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/batches/${b.id}`)}
                        className="p-1.5 text-secondary hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="View Batch Analysis"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate('/reports/rpt-0941')}
                        className="p-1.5 text-secondary hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="View Digital Report"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
