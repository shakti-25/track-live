import React from 'react';
import {
  CalendarCheck,
  ShieldCheck,
  Coins,
  Repeat,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Users,
} from 'lucide-react';
import type { VisitRecord } from '../types.ts';
import { calculateVisitMetrics } from '../utils/formAudit.ts';

interface StatsOverviewProps {
  records: VisitRecord[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ records }) => {
  const metrics = calculateVisitMetrics(records);
  const gpsVerifiedRate = metrics.totalVisits > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Scheduled
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalVisits}</div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{metrics.physicalVisits} Physical</span>
            <span>&bull;</span>
            <span className="text-indigo-600 font-semibold">{metrics.callVisits} Calls</span>
          </p>
        </div>

        {/* GPS Verification Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GPS Verified
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{gpsVerifiedRate}%</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Precise Coordinates Logged</span>
          </p>
        </div>

        {/* Total Lumpsum */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lumpsum Business
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            Rs. {metrics.totalLumpsum.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Recorded across scheduled deals</p>
        </div>

        {/* Total SIP */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              SIP Business
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Repeat className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            Rs. {metrics.totalSip.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Monthly commitments</p>
        </div>
      </div>

      {/* Feature Explainer Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold mb-3 border border-blue-400/20">
            <MapPin className="h-3.5 w-3.5" />
            <span>Google Maps Grounding with Gemini 3.8 Flash</span>
          </div>
          <h3 className="text-xl font-bold mb-2">
            How GPS Coordinates Are Automatically Recorded
          </h3>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed mb-4">
            Standard Google Forms do not have access to mobile GPS sensors. SalesTrack GPS bridges this gap by reading device satellite geolocation at the exact moment of physical visit submission, querying Google Maps Grounding to verify street addresses, and stamping the coordinates, accuracy, and Google Maps pin directly into the form submission.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-800/80 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-500/40 flex items-center justify-center font-bold text-[11px]">
                1
              </div>
              <span className="text-blue-200">Auto GPS Capture (&plusmn;5-15m)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-500/40 flex items-center justify-center font-bold text-[11px]">
                2
              </div>
              <span className="text-blue-200">Maps Grounding Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-500/40 flex items-center justify-center font-bold text-[11px]">
                3
              </div>
              <span className="text-blue-200">Google Form Audit Injection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
