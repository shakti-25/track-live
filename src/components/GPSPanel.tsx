import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  Compass,
  Navigation,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { MapView } from './MapView.tsx';
import type { GPSLocation, GroundingResult } from '../types.ts';
import { formatGoogleMapsUrl } from '../utils/formAudit.ts';

interface GPSPanelProps {
  location: GPSLocation | null;
  grounding: GroundingResult | null;
  isLocating: boolean;
  isGrounding: boolean;
  onRefreshLocation: () => void;
  onManualCoordinateSet: (lat: number, lng: number) => void;
  groundingError?: string | null;
}

export const GPSPanel: React.FC<GPSPanelProps> = ({
  location,
  grounding,
  isLocating,
  isGrounding,
  onRefreshLocation,
  onManualCoordinateSet,
  groundingError,
}) => {
  const [copied, setCopied] = useState(false);
  const [showManualInputs, setShowManualInputs] = useState(false);
  const [customLat, setCustomLat] = useState(location ? String(location.latitude) : '28.613939');
  const [customLng, setCustomLng] = useState(location ? String(location.longitude) : '77.209021');

  const handleCopyCoords = () => {
    if (!location) return;
    const text = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onManualCoordinateSet(lat, lng);
      setShowManualInputs(false);
    }
  };

  const mapsUrl = location ? formatGoogleMapsUrl(location.latitude, location.longitude) : '#';

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">GPS Live Telemetry</h2>
            <p className="text-[11px] text-slate-500">Auto-recorded upon form submission</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowManualInputs(!showManualInputs)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="Adjust coordinates manually"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">Adjust</span>
          </button>

          <button
            type="button"
            onClick={onRefreshLocation}
            disabled={isLocating}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
          </button>
        </div>
      </div>

      {/* Manual Coordinate Override Drawer */}
      {showManualInputs && (
        <form onSubmit={handleApplyCustomCoords} className="p-3 bg-amber-50/70 border-b border-amber-200/80 text-xs">
          <div className="font-semibold text-amber-900 mb-2 flex items-center gap-1">
            <Navigation className="h-3.5 w-3.5 text-amber-600" />
            <span>Set Exact Location / Pin</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                placeholder="28.613939"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                placeholder="77.209021"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManualInputs(false)}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium shadow-xs"
            >
              Apply Coordinates
            </button>
          </div>
        </form>
      )}

      {/* Interactive Map */}
      <div className="relative">
        {location ? (
          <MapView
            latitude={location.latitude}
            longitude={location.longitude}
            accuracy={location.accuracy}
            label={grounding?.verifiedAddress || 'Visit Location'}
            className="h-48 sm:h-56 w-full"
            onLocationSelect={(lat, lng) => {
              setCustomLat(String(lat));
              setCustomLng(String(lng));
              onManualCoordinateSet(lat, lng);
            }}
          />
        ) : (
          <div className="h-48 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
            <MapPin className="h-8 w-8 animate-bounce text-slate-400" />
            <span className="text-xs">Waiting for GPS satellite signal...</span>
          </div>
        )}

        {/* Floating Accuracy Tag */}
        {location && (
          <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-200 shadow-xs flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Accuracy: ±{Math.round(location.accuracy)}m</span>
            <span className="text-slate-400">&bull;</span>
            <span className="capitalize">{location.provider.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Coordinates readout */}
      <div className="p-4 space-y-3">
        {location ? (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Precise GPS Coordinates
              </span>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Latitude</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {location.latitude.toFixed(6)}°
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Longitude</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {location.longitude.toFixed(6)}°
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
              <span>Timestamp: {new Date(location.timestamp).toLocaleTimeString()}</span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
              >
                <span>Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            Click "Refresh GPS" or allow location access to lock coordinates.
          </div>
        )}

        {/* Google Maps Grounding Card */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Google Maps Grounding (gemini-3.8-flash)</span>
            </div>
            {isGrounding ? (
              <span className="text-[10px] text-indigo-600 animate-pulse font-medium">
                Verifying address...
              </span>
            ) : grounding?.source === 'gemini_maps_grounding' ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                <span>Maps Verified</span>
              </span>
            ) : null}
          </div>

          {grounding?.verifiedAddress ? (
            <div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {grounding.verifiedAddress}
              </p>

              {grounding.landmark && (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>Landmark: {grounding.landmark}</span>
                </p>
              )}

              {/* Extracted Google Maps Links (Gemini Grounding chunks) */}
              {grounding.places && grounding.places.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-indigo-100/70">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                    Verified Google Maps Locations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {grounding.places.map((place, idx) => (
                      <a
                        key={idx}
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-[11px] font-medium text-indigo-700 shadow-2xs transition-colors"
                      >
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{place.title}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isGrounding ? (
            <p className="text-xs text-slate-500 italic">
              Querying Google Maps grounding with satellite & street data...
            </p>
          ) : groundingError ? (
            <p className="text-xs text-amber-700">{groundingError}</p>
          ) : (
            <p className="text-xs text-slate-500">
              GPS lock will trigger automated street address and landmark verification.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
