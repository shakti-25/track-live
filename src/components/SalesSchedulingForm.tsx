import React, { useState, useEffect } from 'react';
import {
  Send,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Hash,
  Briefcase,
  PhoneCall,
  Users,
  Coins,
  Repeat,
  FileText,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import type { DailySalesFormData, GPSLocation, GroundingResult } from '../types.ts';
import {
  generateGPSAuditStamp,
  buildPrefillGoogleFormUrl,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formAudit.ts';

interface SalesSchedulingFormProps {
  location: GPSLocation | null;
  grounding: GroundingResult | null;
  onSubmit: (formData: DailySalesFormData) => Promise<boolean>;
  isSubmitting: boolean;
  lastSubmittedId?: string | null;
}

export const SalesSchedulingForm: React.FC<SalesSchedulingFormProps> = ({
  location,
  grounding,
  onSubmit,
  isSubmitting,
  lastSubmittedId,
}) => {
  // Load saved salesperson name from storage
  const savedSalesperson = localStorage.getItem('salestrack_salesperson') || '';
  const savedSerial = localStorage.getItem('salestrack_serial') || 'DS-001';

  const [formData, setFormData] = useState<DailySalesFormData>({
    salesPersonName: savedSalesperson,
    serialNo: savedSerial,
    date: getTodayDateString(),
    time: getCurrentTimeString(),
    clientName: '',
    callMeet: 'No',
    physicalMeet: 'YES',
    followUpDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })(),
    scheduleDone: 'YES',
    businessLumpsum: 'NO',
    businessLumpsumAmount: '',
    businessSip: 'No',
    businessSipAmount: '',
    particularRemarks: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Update localStorage when salesperson changes
  useEffect(() => {
    if (formData.salesPersonName) {
      localStorage.setItem('salestrack_salesperson', formData.salesPersonName);
    }
  }, [formData.salesPersonName]);

  const handleChange = (
    field: keyof DailySalesFormData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.salesPersonName.trim()) {
      errors.salesPersonName = 'Sales Person Name is required';
    }
    if (!formData.serialNo.trim()) {
      errors.serialNo = 'Serial number is required';
    }
    if (!formData.clientName.trim()) {
      errors.clientName = 'Client Name is required';
    }
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    if (!formData.time) {
      errors.time = 'Time is required';
    }
    if (formData.businessLumpsum === 'YES' && !formData.businessLumpsumAmount.trim()) {
      errors.businessLumpsumAmount = 'Please enter lumpsum amount';
    }
    if (formData.businessSip === 'YES' && !formData.businessSipAmount.trim()) {
      errors.businessSipAmount = 'Please enter SIP amount';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const ok = await onSubmit(formData);
    if (ok) {
      setSuccessBanner(
        `Form successfully recorded with precise GPS coordinates (${location ? location.latitude.toFixed(4) : 'N/A'}, ${location ? location.longitude.toFixed(4) : 'N/A'})!`
      );
      let nextSerial = formData.serialNo;
      const serialMatch = formData.serialNo.match(/^([A-Za-z_-]+)(\d+)$/);
      if (serialMatch) {
        const prefix = serialMatch[1];
        const num = parseInt(serialMatch[2], 10) + 1;
        nextSerial = `${prefix}${String(num).padStart(serialMatch[2].length, '0')}`;
        localStorage.setItem('salestrack_serial', nextSerial);
      }

      // Reset client-specific fields and apply next serial
      setFormData((prev) => ({
        ...prev,
        serialNo: nextSerial,
        clientName: '',
        particularRemarks: '',
        businessLumpsumAmount: '',
        businessSipAmount: '',
        businessLumpsum: 'NO',
        businessSip: 'No',
      }));

      setTimeout(() => setSuccessBanner(null), 6000);
    }
  };

  const prefillUrl = location
    ? buildPrefillGoogleFormUrl(formData, location, grounding || undefined)
    : '#';

  const previewStamp = location
    ? generateGPSAuditStamp(location, grounding || undefined, formData.particularRemarks)
    : 'Waiting for GPS fix to generate verified audit stamp...';

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Form Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 tracking-wide uppercase">
                Official Google Form Sync
              </span>
              <h2 className="text-base font-bold text-slate-900">
                DAILY SALES SCHEDULING DATA
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Entries will be recorded with certified GPS coordinates and synchronized to the Google Form.
            </p>
          </div>

          {location ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium self-start sm:self-center">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>GPS Stamping Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium self-start sm:self-center">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>GPS Not Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="mx-5 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Submission Recorded & GPS Synced</span>
            <span>{successBanner}</span>
          </div>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Row 1: Salesperson & Serial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span>SALE_PERSON_NAME</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.salesPersonName}
              onChange={(e) => handleChange('salesPersonName', e.target.value)}
              placeholder="Enter sales representative name"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                formErrors.salesPersonName ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
              }`}
            />
            {formErrors.salesPersonName && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.salesPersonName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-blue-600" />
              <span>SERIAL_NO.</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.serialNo}
              onChange={(e) => handleChange('serialNo', e.target.value)}
              placeholder="e.g. DS-001"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                formErrors.serialNo ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
              }`}
            />
            {formErrors.serialNo && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.serialNo}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Date, Time & Client Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>DATE</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>TIME</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
              <span>CLIENT_NAME</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
              placeholder="e.g. Acme Corporation"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                formErrors.clientName ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
              }`}
            />
            {formErrors.clientName && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {formErrors.clientName}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Meeting Types (Call & Physical) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-indigo-600" />
              <span>CALL_MEET</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="callMeet"
                  value="YES"
                  checked={formData.callMeet === 'YES'}
                  onChange={() => handleChange('callMeet', 'YES')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>YES</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="callMeet"
                  value="No"
                  checked={formData.callMeet === 'No'}
                  onChange={() => handleChange('callMeet', 'No')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                <span>PHYSICAL MEET</span>
              </label>
              {formData.physicalMeet === 'YES' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  GPS Verification Required
                </span>
              )}
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="physicalMeet"
                  value="YES"
                  checked={formData.physicalMeet === 'YES'}
                  onChange={() => handleChange('physicalMeet', 'YES')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>YES</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="physicalMeet"
                  value="NO"
                  checked={formData.physicalMeet === 'NO'}
                  onChange={() => handleChange('physicalMeet', 'NO')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>NO</span>
              </label>
            </div>
          </div>
        </div>

        {/* Row 4: Follow-up Date & Schedule Done */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>FOLLOW_UP_DATE</span>
            </label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => handleChange('followUpDate', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SCHEDULE_DONE
            </label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleDone"
                  value="YES"
                  checked={formData.scheduleDone === 'YES'}
                  onChange={() => handleChange('scheduleDone', 'YES')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>YES</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleDone"
                  value="No"
                  checked={formData.scheduleDone === 'No'}
                  onChange={() => handleChange('scheduleDone', 'No')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>No</span>
              </label>
            </div>
          </div>
        </div>

        {/* Row 5: Business Deals (Lumpsum & SIP) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lumpsum Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-600" />
                <span>BUSSINESS_LUMPSUM</span>
              </label>
              <div className="flex gap-3 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="businessLumpsum"
                    value="YES"
                    checked={formData.businessLumpsum === 'YES'}
                    onChange={() => handleChange('businessLumpsum', 'YES')}
                  />
                  <span>YES</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="businessLumpsum"
                    value="NO"
                    checked={formData.businessLumpsum === 'NO'}
                    onChange={() => handleChange('businessLumpsum', 'NO')}
                  />
                  <span>NO</span>
                </label>
              </div>
            </div>

            {formData.businessLumpsum === 'YES' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  BUSSINESS_LUMPSUM_AMOUNT
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.businessLumpsumAmount}
                  onChange={(e) => handleChange('businessLumpsumAmount', e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.businessLumpsumAmount && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {formErrors.businessLumpsumAmount}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SIP Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Repeat className="h-4 w-4 text-teal-600" />
                <span>BUSSINESS_SIP</span>
              </label>
              <div className="flex gap-3 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="businessSip"
                    value="YES"
                    checked={formData.businessSip === 'YES'}
                    onChange={() => handleChange('businessSip', 'YES')}
                  />
                  <span>YES</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="businessSip"
                    value="No"
                    checked={formData.businessSip === 'No'}
                    onChange={() => handleChange('businessSip', 'No')}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.businessSip === 'YES' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  BUSSINESS_SIP_AMOUNT
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.businessSipAmount}
                  onChange={(e) => handleChange('businessSipAmount', e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.businessSipAmount && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {formErrors.businessSipAmount}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 6: Particular / Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>PATICULAR/REMARKS</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              GPS verification stamp will be appended automatically
            </span>
          </label>
          <textarea
            rows={2}
            value={formData.particularRemarks}
            onChange={(e) => handleChange('particularRemarks', e.target.value)}
            placeholder="Enter discussion notes, requirements, or next steps..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Live GPS Stamp Preview Box */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-blue-900 tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Live Submission GPS Audit Preview (Saved to Google Form):</span>
            </span>
            {location && (
              <span className="text-[10px] font-mono text-blue-700">
                ±{Math.round(location.accuracy)}m Accuracy
              </span>
            )}
          </div>
          <pre className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-blue-200/60 whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {previewStamp}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  clientName: '',
                  particularRemarks: '',
                  businessLumpsumAmount: '',
                  businessSipAmount: '',
                }));
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Client</span>
            </button>

            {location && (
              <a
                href={prefillUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-colors"
                title="Open the Google Form in a new tab with GPS Stamp and data pre-filled"
              >
                <span>Open Pre-filled Form</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Send className={`h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
            <span>{isSubmitting ? 'Syncing to Google Form...' : 'Submit & Record GPS Coordinates'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
