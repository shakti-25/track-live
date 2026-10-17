import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { verifyAuthorisedCredential, AUTHORISED_PASSCODES, AUTHORISED_EMAILS } from '../utils/auth.ts';
import type { AuthSession } from '../utils/auth.ts';

interface AuthorisedAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  targetFeatureName?: string;
}

export const AuthorisedAccessModal: React.FC<AuthorisedAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetFeatureName = 'Visit Log & Map Intelligence',
}) => {
  const [credentialInput, setCredentialInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsVerifying(true);

    setTimeout(() => {
      const result = verifyAuthorisedCredential(credentialInput);
      setIsVerifying(false);

      if (result.success) {
        const session: AuthSession = {
          isAuthenticated: true,
          role: 'authorised_manager',
          email: result.email,
          name: result.name,
          lastLogin: Date.now(),
        };
        onSuccess(session);
        onClose();
      } else {
        setErrorMsg('Access Denied: Invalid manager PIN or unauthorized email.');
      }
    }, 300);
  };

  const handleQuickDemoLogin = () => {
    const session: AuthSession = {
      isAuthenticated: true,
      role: 'authorised_manager',
      email: AUTHORISED_EMAILS[0],
      name: 'Authorised Manager (Nayan)',
      lastLogin: Date.now(),
    };
    onSuccess(session);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="h-6 w-6" />
          </div>

          <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
            Authorised Access Only
          </span>

          <h3 className="text-lg font-bold mt-2">Manager Authorization Gateway</h3>
          <p className="text-xs text-slate-300 mt-1">
            Access to <span className="text-amber-300 font-semibold">{targetFeatureName}</span> is restricted to verified sales managers and directors.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                <span>Enter Manager PIN or Authorised Email</span>
              </label>
              <input
                type="text"
                autoFocus
                value={credentialInput}
                onChange={(e) => {
                  setCredentialInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="e.g. PIN 8899 or nayanchildoffice@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Authorized passcodes: <span className="font-mono text-slate-700 font-semibold">8899</span> or <span className="font-mono text-slate-700 font-semibold">admin2026</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !credentialInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isVerifying ? 'Verifying Authorization...' : 'Verify & Unlock Portal'}</span>
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Or quick authorize
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick Demo Sign In Button */}
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  Authorised Manager Sign In
                </span>
                <span className="text-[11px] text-indigo-700 font-mono">
                  nayanchildoffice@gmail.com
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-indigo-600" />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Field sales representatives do not require login to submit daily visits.
        </div>
      </div>
    </div>
  );
};
