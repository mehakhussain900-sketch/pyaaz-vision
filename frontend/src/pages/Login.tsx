import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  User,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Scale
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS, UserRole } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, demoLogin, isAuthenticated, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
    if (!error) navigate('/dashboard');
  };

  const handleInstantDemoLogin = async (role: UserRole = 'inspector') => {
    setSubmitting(true);
    await demoLogin(role);
    setSubmitting(false);
    navigate('/dashboard');
  };

  const fillDemo = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      {/* Brand & Submission Banner */}
      <div className="text-center max-w-2xl mb-8">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md text-2xl">
            🧅
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              PYAaz-Vision Demonstration
            </h1>
            <p className="text-xs sm:text-sm text-indigo-700 font-bold uppercase tracking-wide">
              National Onion Quality Intelligence &amp; Procurement Platform
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          AI-powered optical grading, size calibration, automated defect detection, and tamper-evident digital quality certification for APMC mandis.
        </p>
      </div>

      <div className="w-full max-w-xl space-y-5">
        {/* PUBLIC DEMO QUICK-ACCESS HERO CARD */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-xl p-6 sm:p-7 border border-indigo-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Public Submission &amp; Evaluator Mode
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
            Welcome, Evaluators &amp; Judges!
          </h2>
          <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
            Experience the complete end-to-end PYAaz-Vision workflow without entering manual credentials or configuring a database. Click below for instant authenticated access.
          </p>

          {/* PRIMARY ONE-CLICK DEMO LOGIN BUTTON */}
          <button
            type="button"
            onClick={() => handleInstantDemoLogin('inspector')}
            disabled={submitting || isLoading}
            className="w-full mt-5 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
          >
            {submitting || isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Launching Demonstration Session...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-200" />
                <span>1-Click Demo Login (Instant Access)</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Role selector tiles */}
          <div className="mt-4 pt-4 border-t border-indigo-700/50">
            <span className="text-[11px] font-semibold text-indigo-300 block mb-2 uppercase tracking-wider">
              Or Launch Specific Demonstration Role:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleInstantDemoLogin('inspector')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-colors cursor-pointer group"
              >
                <span className="text-[10px] text-emerald-300 font-bold block">DEFAULT</span>
                <p className="text-xs font-semibold text-white group-hover:text-amber-200">Inspector</p>
                <span className="text-[10px] text-slate-300">Field Intake</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin('procurement_officer')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-colors cursor-pointer group"
              >
                <span className="text-[10px] text-indigo-300 font-bold block">APMC</span>
                <p className="text-xs font-semibold text-white group-hover:text-amber-200">Proc. Officer</p>
                <span className="text-[10px] text-slate-300">Batch Approval</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin('reviewer')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-colors cursor-pointer group"
              >
                <span className="text-[10px] text-amber-300 font-bold block">AUDIT</span>
                <p className="text-xs font-semibold text-white group-hover:text-amber-200">Reviewer</p>
                <span className="text-[10px] text-slate-300">Arbitration</span>
              </button>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin('admin')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-colors cursor-pointer group"
              >
                <span className="text-[10px] text-purple-300 font-bold block">HEADQUARTERS</span>
                <p className="text-xs font-semibold text-white group-hover:text-amber-200">Admin</p>
                <span className="text-[10px] text-slate-300">Full Mandi Control</span>
              </button>
            </div>
          </div>
        </div>

        {/* TRADITIONAL CREDENTIALS / SIGN IN CARD */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Standard Inspector Sign In</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Secured APMC Gateway</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Official Email / User ID
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="inspector@pyaazvision.gov.in"
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer shadow-xs"
            >
              {submitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In with Credentials
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demonstration Credentials Table */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pre-Configured Demo Accounts (Click to Fill)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Click any demo account below to auto-populate the form. No private credentials needed.
            </p>

            <div className="space-y-2">
              {DEMO_CREDENTIALS.map(cred => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillDemo(cred.email, cred.password)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left group cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700">
                      {cred.role}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">{cred.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Auto-Fill &rarr;
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{cred.badge}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          PYAAZ-VISION Prototype • National Onion Quality Intelligence Platform • APMC Mandi Grid
        </p>
      </div>
    </div>
  );
};

export default Login;
