import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  ScanEye,
  History,
  FileCheck2,
  Building2,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assessment/new', label: 'New Assessment', icon: PlusCircle, badge: 'Workflow' },
  { to: '/batches', label: 'Batch Analysis', icon: Layers },
  { to: '/ai-analysis', label: 'AI Vision', icon: ScanEye },
  { to: '/history', label: 'Quality History', icon: History },
  { to: '/reports', label: 'Digital Reports', icon: FileCheck2 },
  { to: '/centers', label: 'Procurement Centers', icon: Building2 },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold text-secondary uppercase tracking-wider">
            Operational Menu
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100 font-semibold'
                        : 'text-secondary hover:text-primary hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info & Logout */}
        <div className="p-4 border-t border-border bg-slate-50/50 space-y-2">
          <div className="p-3 bg-white border border-border rounded-xl shadow-xs">
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-primary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>APMC Grid Active</span>
            </div>
            <p className="text-[11px] text-secondary">
              Nashik Division • 5 Centers Online
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            title="Sign out of current demonstration session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out ({user?.role || 'demo'})</span>
          </button>
        </div>
      </aside>
    </>
  );
};
