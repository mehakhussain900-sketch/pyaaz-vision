import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  PlusCircle,
  Eye,
  FileCheck2,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Batch } from '../types';

export const Batches: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get('status') || 'ALL';
  const initialCenter = searchParams.get('center_id') || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [centerFilter, setCenterFilter] = useState(initialCenter);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'gradeA-desc' | 'defect-desc' | 'weight-desc'>('date-desc');
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setStatusFilter(statusParam);
    const centerParam = searchParams.get('center_id');
    if (centerParam) setCenterFilter(centerParam);
    const sParam = searchParams.get('search');
    if (sParam) setSearch(sParam);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    api.getBatches({
      search: search || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      center_id: centerFilter === 'ALL' ? undefined : centerFilter
    })
      .then(setBatches)
      .finally(() => setLoading(false));
  }, [search, statusFilter, centerFilter]);

  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => {
      switch (sortBy) {
        case 'gradeA-desc':
          return (b.grade_a_pct || 0) - (a.grade_a_pct || 0);
        case 'defect-desc':
          return (b.defect_rate_pct || 0) - (a.defect_rate_pct || 0);
        case 'weight-desc':
          return (b.total_lot_weight_kg || 0) - (a.total_lot_weight_kg || 0);
        case 'date-asc':
          return new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime();
        case 'date-desc':
        default:
          return new Date(b.arrival_date).getTime() - new Date(a.arrival_date).getTime();
      }
    });
  }, [batches, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCenterFilter('ALL');
    setSortBy('date-desc');
    setSearchParams({});
  };

  const hasActiveFilters = search !== '' || statusFilter !== 'ALL' || centerFilter !== 'ALL' || sortBy !== 'date-desc';

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-border p-5 rounded-card shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">Inward Batch Intelligence</h1>
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              {batches.length} Lots Available
            </span>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Browse and monitor farm arrivals, sample inspection statuses, and lot grading outcomes across all mandis.
          </p>
        </div>

        <button
          onClick={() => navigate('/assessment/new')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Assess New Batch
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border p-4 rounded-card shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Batch ID, Farmer, or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-secondary shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved (Grade A)</option>
              <option value="VERIFIED">Verified (Human Sign-off)</option>
              <option value="UNDER_REVIEW">Under Review / Dispute</option>
              <option value="PENDING_ASSESSMENT">Pending Assessment</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Center Filter */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-secondary shrink-0" />
            <select
              value={centerFilter}
              onChange={e => setCenterFilter(e.target.value)}
              className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All APMC Centers</option>
              <option value="c-lasalgaon">Lasalgaon APMC Yard</option>
              <option value="c-pimpalgaon">Pimpalgaon Baswant Hub</option>
              <option value="c-yeola">Yeola Sub-Yard</option>
              <option value="c-mahuva">Mahuva Cluster</option>
              <option value="c-dindori">Dindori Center</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-secondary shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
            >
              <option value="date-desc">Newest Arrivals First</option>
              <option value="date-asc">Oldest Arrivals First</option>
              <option value="gradeA-desc">Highest Grade A %</option>
              <option value="defect-desc">Highest Defect Rate %</option>
              <option value="weight-desc">Largest Lot Weight</option>
            </select>
          </div>
        </div>

        {/* Clear Filters bar if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span>
              Showing filtered results ({sortedBatches.length} of {batches.length} batches)
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Batches Table with Full Row Clickability */}
      <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-secondary border-b border-border uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3.5">Batch Number</th>
                <th className="px-4 py-3.5">Farmer / Supplier</th>
                <th className="px-4 py-3.5">Center</th>
                <th className="px-4 py-3.5">Variety</th>
                <th className="px-4 py-3.5">Weight (Kg)</th>
                <th className="px-4 py-3.5">Grade A %</th>
                <th className="px-4 py-3.5">Defects %</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-700">
              {sortedBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-secondary">
                    <p className="font-semibold text-slate-800">No matching batches found</p>
                    <p className="text-xs text-slate-500 mt-1">Try modifying your search or clearing the active filters.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                sortedBatches.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => navigate(`/batches/${b.id}`)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 font-bold text-primary font-mono group-hover:text-indigo-600 transition-colors">
                      {b.batch_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-primary">{b.farmer_name}</p>
                      <p className="text-[10px] text-secondary">{b.supplier_farmer_id}</p>
                    </td>
                    <td className="px-4 py-3.5 text-secondary">
                      {b.center_name || 'Lasalgaon APMC'}
                    </td>
                    <td className="px-4 py-3.5">
                      {b.variety}
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      {(b.total_lot_weight_kg || 5000).toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gradeA">
                      {b.grade_a_pct !== null && b.grade_a_pct !== undefined ? `${b.grade_a_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-defect">
                      {b.defect_rate_pct !== null && b.defect_rate_pct !== undefined ? `${b.defect_rate_pct}%` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
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
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/batches/${b.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                          title="View Batch Analysis"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Analyze</span>
                        </button>
                        <button
                          onClick={() => navigate('/reports/rpt-0941')}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="View Digital Report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Batches;
