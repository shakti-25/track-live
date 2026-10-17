import React from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LockedFeatureGateProps {
  featureName: string;
  featureDescription: string;
  onOpenAuthModal: () => void;
  onBackToForm: () => void;
}

export const LockedFeatureGate: React.FC<LockedFeatureGateProps> = ({
  featureName,
  featureDescription,
  onOpenAuthModal,
  onBackToForm,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden my-6">
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <div className="h-16 w-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Lock className="h-8 w-8" />
        </div>

        <span className="text-xs font-bold tracking-widest uppercase bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
          Restricted Corporate Area
        </span>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          {featureName} Access Restricted
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
          {featureDescription}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBackToForm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Field Visit Entry</span>
          </button>

          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span>Sign In as Authorised Person</span>
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              Field Sales Representatives
            </span>
            <p className="text-[11px] text-slate-500">
              Submit your daily sales visit schedules freely without logging in. Your GPS coordinates are recorded automatically with each submission.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-bold text-blue-900 block mb-1">
              Authorised Managers & Supervisors
            </span>
            <p className="text-[11px] text-blue-700">
              Authorized personnel (e.g. <span className="font-mono font-semibold">nayanchildoffice@gmail.com</span> or PIN <span className="font-mono font-semibold">8899</span>) can sign in to view complete visit coordinates, GPS maps, and performance KPIs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
