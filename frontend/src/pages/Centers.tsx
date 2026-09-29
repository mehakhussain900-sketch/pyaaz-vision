import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Scale,
  Layers,
  MapPin,
  Info,
  Search,
  CheckCircle2,
  ArrowRight,
  X,
  PlusCircle,
  Truck,
  User,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { ProcurementCenter, Batch } from '../types';

export const Centers: React.FC = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<ProcurementCenter | null>(null);
  const [centerBatches, setCenterBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getCenters()
      .then(setCenters)
      .finally(() => setLoading(false));
  }, []);

  const handleOpenCenter = async (center: ProcurementCenter) => {
    setSelectedCenter(center);
    try {
      const batches = await api.getBatches({ center_id: center.id });
      setCenterBatches(batches);
    } catch {
      setCenterBatches([]);
    }
  };

  const filteredCenters = centers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-border p-5 rounded-card shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              Procurement Centers &amp; APMC Mandis
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              5 HUBS OPERATIONAL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Intake performance, quality distributions, and arbitration dispute rates across participating procurement yards.
          </p>
        </div>

        <button
          onClick={() => navigate('/assessment/new')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Start New Intake Assessment
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card border border-border p-4 rounded-card shadow-card flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by center name, APMC code, or district..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-secondary font-medium hidden sm:inline">
          Click any center card to open comprehensive yard activity
        </span>
      </div>

      {/* Centers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCenters.map((c) => (
          <div
            key={c.id}
            onClick={() => handleOpenCenter(c)}
            className="bg-card border border-border p-5 rounded-card shadow-card flex flex-col justify-between space-y-4 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {c.code}
                  </span>
                  <h2 className="text-base font-bold text-primary mt-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {c.name}
                  </h2>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" title="Yard Active" />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-secondary mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{c.district}, {c.state}</span>
                <span className="mx-1">•</span>
                <span>Cap: {(c.capacity_mt || 10000).toLocaleString()} MT</span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-border">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-secondary font-semibold">Total Lots</span>
                <p className="font-extrabold text-primary text-sm mt-0.5">{c.total_batches}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 font-semibold">Avg Grade A</span>
                <p className="font-extrabold text-gradeA text-sm mt-0.5">{c.avg_grade_a}%</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                <span className="text-[10px] text-amber-800 font-semibold">Avg URS</span>
                <p className="font-extrabold text-urs text-sm mt-0.5">{c.avg_urs}%</p>
              </div>
            </div>

            {/* Bottom Row with Action Arrow */}
            <div className="flex items-center justify-between text-xs text-secondary pt-2 border-t border-border">
              <span>Avg Defect: <strong className="text-defect">{c.avg_defect_rate}%</strong></span>
              <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Activity &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CENTER DETAILS & RECENT ACTIVITY MODAL */}
      {selectedCenter && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {selectedCenter.code}
                </span>
                <h2 className="text-xl font-bold text-primary mt-1.5">{selectedCenter.name}</h2>
                <div className="flex items-center gap-2 text-xs text-secondary mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedCenter.district} District, {selectedCenter.state}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">APMC Registered Buffer Yard</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCenter(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Storage Capacity</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{(selectedCenter.capacity_mt || 12000).toLocaleString()} MT</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase">Grade A Ratio</span>
                <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{selectedCenter.avg_grade_a}%</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-800 font-semibold uppercase">URS Ratio</span>
                <p className="text-lg font-extrabold text-amber-600 mt-0.5">{selectedCenter.avg_urs}%</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-[10px] text-red-800 font-semibold uppercase">Defect Rate</span>
                <p className="text-lg font-extrabold text-red-600 mt-0.5">{selectedCenter.avg_defect_rate}%</p>
              </div>
            </div>

            {/* Yard Operational Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Superintendent / Officer in-charge:</span>
                <span className="font-bold text-slate-900">Officer Suresh Kulkarni (MH-AGR-PROC-087)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Digital Weighbridge Integration:</span>
                <span className="font-semibold text-emerald-700">Online (Telemetry Sync 100%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Arbitration Dispute Rate:</span>
                <span className="font-semibold text-indigo-700">{selectedCenter.review_rate}% of sampled lots</span>
              </div>
            </div>

            {/* Recent Batches at this Center */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recent Inward Lots ({centerBatches.length})
                </h3>
                <span className="text-[11px] text-slate-400">Live Intake Log</span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                {centerBatches.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No active batches logged for this center.</p>
                ) : (
                  centerBatches.map(b => (
                    <div
                      key={b.id}
                      onClick={() => navigate(`/batches/${b.id}`)}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                    >
                      <div>
                        <p className="font-mono font-bold text-primary">{b.batch_number}</p>
                        <p className="text-[11px] text-slate-500">{b.farmer_name} • {b.variety}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          b.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                          b.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.arrival_date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
              <button
                onClick={() => {
                  setSelectedCenter(null);
                  navigate(`/batches?center_id=${selectedCenter.id}`);
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Filter Batches by this Center &rarr;
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setSelectedCenter(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-border rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedCenter(null);
                    navigate('/assessment/new');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                >
                  Start Assessment Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Centers;
