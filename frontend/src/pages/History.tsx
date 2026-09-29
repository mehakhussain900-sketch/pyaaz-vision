import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Filter,
  FileText,
  Eye,
  Calendar,
  Building,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { Batch } from '../types';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getBatches({
      center_id: centerFilter === 'ALL' ? undefined : centerFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      search: search || undefined
    })
      .then(setBatches)
      .finally(() => setLoading(false));
  }, [search, centerFilter, statusFilter]);

  const filteredBatches = batches.filter(b => {
    if (gradeFilter === 'GRADE_A' && (b.grade_a_pct || 0) < 75) return false;
    if (gradeFilter === 'URS' && ((b.grade_a_pct || 0) >= 75 || (b.defect_rate_pct || 0) > 12)) return false;
    if (gradeFilter === 'DEFECT' && (b.defect_rate_pct || 0) <= 10) return false;
    return true;
  });

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-border p-5 rounded-card shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">Quality Assessment History</h1>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
              Full Mandi Audit Trail
            </span>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Historical quality assessments, dispute resolutions, and grading logs across harvest seasons.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-card border border-border p-4 rounded-card shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Batch ID or Farmer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Center */}
          <div>
            <select
              value={centerFilter}
              onChange={e => setCenterFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="ALL">All Procurement Centers</option>
              <option value="c-lasalgaon">Lasalgaon APMC</option>
              <option value="c-pimpalgaon">Pimpalgaon Baswant</option>
              <option value="c-yeola">Yeola Sub-Yard</option>
              <option value="c-mahuva">Mahuva Dehydration Cluster</option>
              <option value="c-dindori">Dindori Center</option>
            </select>
          </div>

          {/* Grade */}
          <div>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="ALL">All Grade Tiers</option>
              <option value="GRADE_A">Grade A Prime (&ge; 75%)</option>
              <option value="URS">URS / FAQ Grade</option>
              <option value="DEFECT">High Defect (&gt; 10%)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-secondary border-b border-border uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Batch ID</th>
                <th className="px-4 py-3">Center</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Grade A %</th>
                <th className="px-4 py-3">URS %</th>
                <th className="px-4 py-3">Defect %</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-700">
              {filteredBatches.map((b) => (
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
                    {b.confidence ? `${(b.confidence * 100).toFixed(0)}%` : '93%'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="View Batch Assessment Intelligence"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Analysis
                      </button>
                      <button
                        onClick={() => navigate('/reports/rpt-0941')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="View Tamper-Evident Report Certificate"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Report
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
