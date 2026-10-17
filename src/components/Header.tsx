import React from 'react';
import {
  MapPin,
  ExternalLink,
  CalendarCheck,
  BarChart3,
  Radio,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  LogOut,
  Building,
  Globe,
} from 'lucide-react';
import { GOOGLE_FORM_BASE_URL } from '../utils/formAudit.ts';
import type { GPSLocation } from '../types.ts';
import type { AuthSession } from '../utils/auth.ts';

interface HeaderProps {
  activeTab: 'form' | 'history' | 'analytics';
  onTabSelect: (tab: 'form' | 'history' | 'analytics') => void;
  location: GPSLocation | null;
  historyCount: number;
  isLocating: boolean;
  authSession: AuthSession | null;
  onOpenAuthModal: (featureName?: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabSelect,
  location,
  historyCount,
  isLocating,
  authSession,
  onOpenAuthModal,
  onLogout,
}) => {
  const isManager = authSession?.isAuthenticated && authSession.role === 'authorised_manager';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top enterprise website utility banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-200">
              Enterprise Field Sales & Scheduling Portal
            </span>
            <span className="text-slate-600 hidden sm:inline">&bull;</span>
            <span className="text-slate-400 hidden sm:inline">
              Daily GPS Auditing & Google Form Cloud Integration
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isManager ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Authorised: {authSession.email || 'Operations Manager'}</span>
                </span>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 text-slate-400 hover:text-white hover:underline transition-colors ml-1"
                  title="Lock manager access"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Lock Session</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuthModal('Manager Portal')}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <Lock className="h-3 w-3 text-amber-400" />
                <span>Authorised Personnel Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Website Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  SalesTrack <span className="text-blue-600 font-medium">Enterprise</span>
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Live Form Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official Scheduling System &bull; Automatic High-Precision GPS Capture &bull; Google Maps Grounding
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* GPS Telemetry Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isLocating
                  ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                  : location
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isLocating ? (
                <>
                  <Radio className="h-3.5 w-3.5 animate-spin text-amber-600" />
                  <span>Locking GPS Satellite...</span>
                </>
              ) : location ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden md:inline font-semibold">GPS Active:</span>
                  <span className="font-mono text-[11px]">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-emerald-600/90 font-mono">
                    (±{Math.round(location.accuracy)}m)
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>GPS Inactive</span>
                </>
              )}
            </div>

            {/* Google Form Link */}
            <a
              href={GOOGLE_FORM_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors border border-slate-200/80 shadow-2xs"
              title="Open the official Google Form in a new tab"
            >
              <span>Original Google Form</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Website Navigation Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-1 -mb-px overflow-x-auto scrollbar-none">
          <div className="flex space-x-1 sm:space-x-2 whitespace-nowrap">
            {/* Tab 1: Form Entry (Public to all Sales Reps) */}
            <button
              onClick={() => onTabSelect('form')}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors shrink-0 ${
                activeTab === 'form'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Field Visit Entry</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-normal bg-slate-100 text-slate-600 hidden sm:inline">
                Sales Reps
              </span>
            </button>

            {/* Tab 2: Visit Log & Map (Restricted to Authorised) */}
            <button
              onClick={() => onTabSelect('history')}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors shrink-0 ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Visit Log & Map</span>
              {isManager ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-blue-100 text-blue-800 font-semibold">
                  {historyCount}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-800">
                  <Lock className="h-2.5 w-2.5" />
                  <span>Authorised</span>
                </span>
              )}
            </button>

            {/* Tab 3: Sales Performance (Restricted to Authorised) */}
            <button
              onClick={() => onTabSelect('analytics')}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors shrink-0 ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Performance</span>
              {!isManager && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-800">
                  <Lock className="h-2.5 w-2.5" />
                  <span>Authorised</span>
                </span>
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center text-xs text-slate-400 whitespace-nowrap pl-4">
            <span>Role: </span>
            <span className={`ml-1 font-semibold ${isManager ? 'text-emerald-700' : 'text-slate-600'}`}>
              {isManager ? 'Authorised Operations Manager' : 'Field Sales Representative'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
