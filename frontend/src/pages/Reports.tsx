import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Search,
  Eye,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Filter,
  PlusCircle,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.report_code.toLowerCase().includes(search.toLowerCase()) ||
      r.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.batch_number.toLowerCase().includes(search.toLowerCase());
    
    const matchesCenter = centerFilter === 'ALL' || r.center_name.toLowerCase().includes(centerFilter.toLowerCase());

    return matchesSearch && matchesCenter;
  });

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-border p-5 rounded-card shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              Digital Quality Assessment Reports
            </h1>
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Tamper-Evident Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Archived digital certificates with QR validation, AI findings, and inspector sign-offs.
          </p>
        </div>

        <button
          onClick={() => navigate('/assessment/new')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Assessment
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card border border-border p-4 rounded-card shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search report code, batch ID, or farmer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-secondary shrink-0" />
          <select
            value={centerFilter}
            onChange={e => setCenterFilter(e.target.value)}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All APMC Centers</option>
            <option value="Lasalgaon">Lasalgaon</option>
            <option value="Pimpalgaon">Pimpalgaon</option>
            <option value="Mahuva">Mahuva</option>
            <option value="Yeola">Yeola</option>
            <option value="Dindori">Dindori</option>
          </select>
        </div>
      </div>

      {/* Reports Table with Full Row Clickability */}
      <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-secondary border-b border-border uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3.5">Report ID</th>
                <th className="px-4 py-3.5">Batch Number</th>
                <th className="px-4 py-3.5">Farmer / Supplier</th>
                <th className="px-4 py-3.5">Procurement Center</th>
                <th className="px-4 py-3.5">Date Generated</th>
                <th className="px-4 py-3.5">Outcome</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-700">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-secondary">
                    <p className="font-semibold text-slate-800">No matching reports found</p>
                    <p className="text-xs text-slate-500 mt-1">Try refining your search keyword or selecting a different APMC center.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/reports/${r.id}`)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 group-hover:underline">
                      {r.report_code}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-primary">
                      {r.batch_number}
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      {r.farmer_name}
                    </td>
                    <td className="px-4 py-3.5 text-secondary">
                      {r.center_name}
                    </td>
                    <td className="px-4 py-3.5 text-secondary">
                      {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                        {r.status || 'APPROVED'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/reports/${r.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Report
                      </button>
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

export default Reports;
