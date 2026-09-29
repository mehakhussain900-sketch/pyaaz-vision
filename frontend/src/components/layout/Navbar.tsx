import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShieldCheck, Menu, X, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { api } from '../../services/api';
import { AlertItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const initials = user
    ? user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    procurement_officer: 'bg-blue-100 text-blue-700',
    reviewer: 'bg-amber-100 text-amber-700',
    inspector: 'bg-emerald-100 text-emerald-700'
  };

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    procurement_officer: 'Proc. Officer',
    reviewer: 'Reviewer',
    inspector: 'Inspector'
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            title="Go to Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              🧅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">PYAAZ-VISION</span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded hidden sm:inline">
                  DEMO v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                National Onion Quality Intelligence &amp; Procurement Platform
              </p>
            </div>
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2">
          {/* APMC Center Tag */}
          <button
            onClick={() => navigate('/centers')}
            className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition-colors cursor-pointer"
            title="View Procurement Centers"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{user?.center_name || 'Lasalgaon APMC Yard 01'}</span>
          </button>

          {/* Alerts Notification dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowAlertsDropdown(!showAlertsDropdown); setShowUserMenu(false); }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="font-semibold text-sm text-slate-900">System Alerts &amp; Notifications</span>
                  <span className="text-[11px] text-slate-500 font-medium">{unreadCount} active</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0] mt-1">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No active alerts</p>
                  ) : alerts.map((alt) => (
                    <div key={alt.id} className="py-2.5 px-1 hover:bg-slate-50 transition-colors rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          alt.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          alt.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {alt.alert_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-auto">
                          {new Date(alt.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800">{alt.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alt.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowAlertsDropdown(false); }}
              className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0] hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name?.split(' ').slice(0, 3).join(' ') || 'User'}</p>
                <p className="text-[10px] text-slate-400">{user?.badge_number}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2E8F0] bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeColor[user?.role || 'inspector']}`}>
                    {roleLabel[user?.role || 'inspector']}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
