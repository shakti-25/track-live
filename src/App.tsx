import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { GPSPanel } from './components/GPSPanel.tsx';
import { SalesSchedulingForm } from './components/SalesSchedulingForm.tsx';
import { VisitHistory } from './components/VisitHistory.tsx';
import { StatsOverview } from './components/StatsOverview.tsx';
import { AuthorisedAccessModal } from './components/AuthorisedAccessModal.tsx';
import { LockedFeatureGate } from './components/LockedFeatureGate.tsx';
import type { GPSLocation, GroundingResult, DailySalesFormData, VisitRecord } from './types.ts';
import type { AuthSession } from './utils/auth.ts';
import { canAccessAuthorisedFeatures } from './utils/auth.ts';
import {
  generateGPSAuditStamp,
  formatGoogleMapsUrl,
  buildGoogleFormPayload,
} from './utils/formAudit.ts';
import { Shield, Sparkles, MapPin, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

// Deterministic seed records for instant demonstration if local storage is fresh
const SEED_VISITS: VisitRecord[] = [
  {
    id: 'seed-visit-1',
    submittedAt: Date.now() - 3600000 * 2,
    formData: {
      salesPersonName: 'Nayan Sharma',
      serialNo: 'DS-001',
      date: new Date().toISOString().split('T')[0],
      time: '11:15',
      clientName: 'Tata Consultancy Services - BFSI Wing',
      callMeet: 'No',
      physicalMeet: 'YES',
      followUpDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      scheduleDone: 'YES',
      businessLumpsum: 'YES',
      businessLumpsumAmount: '750000',
      businessSip: 'YES',
      businessSipAmount: '25000',
      particularRemarks: 'In-person meeting with Treasury Head. Discussed corporate bond allocation.',
    },
    location: {
      latitude: 28.62892,
      longitude: 77.20653,
      accuracy: 8.5,
      timestamp: Date.now() - 3600000 * 2,
      provider: 'browser_gps',
    },
    grounding: {
      verifiedAddress: 'Barakhamba Road, Connaught Place, New Delhi, Delhi 110001',
      locality: 'Connaught Place',
      landmark: 'Statesman House',
      description: 'Verified commercial office district along Barakhamba Road.',
      places: [
        {
          title: 'Statesman House',
          uri: 'https://maps.google.com/?q=28.62892,77.20653',
        },
      ],
      source: 'gemini_maps_grounding',
      fetchedAt: Date.now() - 3600000 * 2,
    },
    gpsAuditText:
      'In-person meeting with Treasury Head.\n\n--- GPS VERIFIED VISIT AUDIT ---\nCoordinates: 28.628920, 77.206530 (Accuracy: ±9m)\nAddress: Barakhamba Road, Connaught Place, New Delhi\nRecorded: ' +
      new Date().toLocaleDateString(),
    googleMapsUrl: 'https://www.google.com/maps?q=28.628920,77.206530',
    formStatus: 'synced_google_forms',
  },
  {
    id: 'seed-visit-2',
    submittedAt: Date.now() - 3600000 * 5,
    formData: {
      salesPersonName: 'Nayan Sharma',
      serialNo: 'DS-002',
      date: new Date().toISOString().split('T')[0],
      time: '09:30',
      clientName: 'Religare Broking Corp',
      callMeet: 'YES',
      physicalMeet: 'NO',
      followUpDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      scheduleDone: 'YES',
      businessLumpsum: 'NO',
      businessLumpsumAmount: '',
      businessSip: 'YES',
      businessSipAmount: '15000',
      particularRemarks: 'Introductory phone call with VP Investments. Scheduled follow-up presentation.',
    },
    location: {
      latitude: 28.535517,
      longitude: 77.391029,
      accuracy: 15.0,
      timestamp: Date.now() - 3600000 * 5,
      provider: 'browser_gps',
    },
    grounding: {
      verifiedAddress: 'Sector 62, Noida, Uttar Pradesh 201309',
      locality: 'Sector 62',
      landmark: 'Electronic City',
      description: 'Verified commercial hub in Sector 62.',
      places: [
        {
          title: 'Noida Sector 62 Hub',
          uri: 'https://maps.google.com/?q=28.535517,77.391029',
        },
      ],
      source: 'gemini_maps_grounding',
      fetchedAt: Date.now() - 3600000 * 5,
    },
    gpsAuditText:
      'Introductory phone call.\n\n--- GPS VERIFIED VISIT AUDIT ---\nCoordinates: 28.535517, 77.391029 (Accuracy: ±15m)\nAddress: Sector 62, Noida',
    googleMapsUrl: 'https://www.google.com/maps?q=28.535517,77.391029',
    formStatus: 'synced_google_forms',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'analytics'>('form');
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [grounding, setGrounding] = useState<GroundingResult | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isGrounding, setIsGrounding] = useState<boolean>(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  // Authorised Personnel Session
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem('salestrack_auth_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse auth session:', e);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingFeatureName, setPendingFeatureName] = useState('Visit Log & Map Intelligence');

  // Visit Records in localStorage
  const [records, setRecords] = useState<VisitRecord[]>(() => {
    try {
      const stored = localStorage.getItem('salestrack_gps_records');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored visits:', e);
    }
    return SEED_VISITS;
  });

  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('salestrack_gps_records', JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save visits:', e);
    }
  }, [records]);

  // Save authSession to localStorage
  useEffect(() => {
    try {
      if (authSession) {
        localStorage.setItem('salestrack_auth_session', JSON.stringify(authSession));
      } else {
        localStorage.removeItem('salestrack_auth_session');
      }
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  }, [authSession]);

  const isAuthorized = canAccessAuthorisedFeatures(authSession);

  /**
   * Tab Navigation with Authorization Gate
   */
  const handleTabSelect = (tab: 'form' | 'history' | 'analytics') => {
    if (tab === 'form') {
      setActiveTab('form');
      return;
    }

    // For history and analytics, check if authorized
    if (!isAuthorized) {
      const featureTitle =
        tab === 'history' ? 'Visit Log & Map Intelligence' : 'Executive Sales Performance Analytics';
      setPendingFeatureName(featureTitle);
      setActiveTab(tab); // Switch to the tab so they see either the gate or prompt
      setIsAuthModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    setActiveTab('form');
  };

  /**
   * Triggers Google Maps Grounding via backend using gemini-3.8-flash
   */
  const triggerMapsGrounding = useCallback(async (lat: number, lng: number, clientName?: string) => {
    setIsGrounding(true);
    setGroundingError(null);

    try {
      const res = await fetch('/api/maps/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, clientName }),
      });

      if (!res.ok) {
        throw new Error(`Grounding API returned status ${res.status}`);
      }

      const data: GroundingResult = await res.json();
      setGrounding(data);
    } catch (err: any) {
      console.warn('Google Maps Grounding request failed:', err?.message);
      setGroundingError('Google Maps Grounding preview is unavailable offline.');
      // Fallback
      setGrounding({
        verifiedAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        description: `GPS coordinates locked at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        places: [
          {
            title: `Google Maps Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            uri: formatGoogleMapsUrl(lat, lng),
          },
        ],
        source: 'coordinates_only',
        fetchedAt: Date.now(),
      });
    } finally {
      setIsGrounding(false);
    }
  }, []);

  /**
   * Acquire live GPS position from browser navigator.geolocation
   */
  const fetchCurrentLocation = useCallback(() => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      setIsLocating(false);
      // Fallback to initial default
      const defaultLoc: GPSLocation = {
        latitude: 28.613939,
        longitude: 77.209021,
        accuracy: 10,
        timestamp: Date.now(),
        provider: 'ip_approx',
      };
      setLocation(defaultLoc);
      triggerMapsGrounding(defaultLoc.latitude, defaultLoc.longitude);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: GPSLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp || Date.now(),
          provider: 'browser_gps',
        };
        setLocation(newLoc);
        setIsLocating(false);
        lastLocationRef.current = { lat: newLoc.latitude, lng: newLoc.longitude };
        triggerMapsGrounding(newLoc.latitude, newLoc.longitude);
      },
      (err) => {
        console.warn('Geolocation error or permission denied:', err.message);
        setIsLocating(false);
        // Fallback default coordinates if GPS was denied or timed out
        if (!location) {
          const fallbackLoc: GPSLocation = {
            latitude: 28.613939,
            longitude: 77.209021,
            accuracy: 15,
            timestamp: Date.now(),
            provider: 'ip_approx',
          };
          setLocation(fallbackLoc);
          triggerMapsGrounding(fallbackLoc.latitude, fallbackLoc.longitude);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [location, triggerMapsGrounding]);

  // Initial fetch on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  /**
   * Handle manual coordinate adjustments from map or adjuster
   */
  const handleManualCoordinateSet = (lat: number, lng: number) => {
    const manualLoc: GPSLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: 5.0,
      timestamp: Date.now(),
      provider: 'manual_pin',
    };
    setLocation(manualLoc);
    triggerMapsGrounding(lat, lng);
  };

  /**
   * Handle Form Submission & Stamping
   */
  const handleFormSubmit = async (formData: DailySalesFormData): Promise<boolean> => {
    if (!location) {
      alert('Please acquire GPS location before submitting.');
      return false;
    }

    setIsSubmitting(true);

    try {
      // 1. Build payload with GPS stamp embedded in remarks
      const payload = buildGoogleFormPayload(formData, location, grounding || undefined);
      const auditText = generateGPSAuditStamp(location, grounding || undefined, formData.particularRemarks);
      const mapsUrl = formatGoogleMapsUrl(location.latitude, location.longitude);

      let syncStatus: VisitRecord['formStatus'] = 'local_only';
      let errorMsg: string | undefined;

      // 2. Submit to Google Form via server proxy
      try {
        const response = await fetch('/api/form/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            syncStatus = 'synced_google_forms';
          } else {
            syncStatus = 'local_only';
            errorMsg = resData.message;
          }
        } else {
          syncStatus = 'local_only';
          errorMsg = `HTTP ${response.status}`;
        }
      } catch (submitErr: any) {
        console.warn('Direct Google Form submission failed:', submitErr);
        syncStatus = 'local_only';
        errorMsg = submitErr?.message;
      }

      // 3. Save new visit record to database
      const newRecord: VisitRecord = {
        id: `visit-${Date.now()}`,
        submittedAt: Date.now(),
        formData: { ...formData },
        location: { ...location },
        grounding: grounding ? { ...grounding } : undefined,
        gpsAuditText: auditText,
        googleMapsUrl: mapsUrl,
        formStatus: syncStatus,
        errorMessage: errorMsg,
      };

      setRecords((prev) => [newRecord, ...prev]);
      setLastSubmittedId(newRecord.id);

      return true;
    } catch (err) {
      console.error('Error during visit submission:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    setRecords([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      <Header
        activeTab={activeTab}
        onTabSelect={handleTabSelect}
        location={location}
        historyCount={records.length}
        isLocating={isLocating}
        authSession={authSession}
        onOpenAuthModal={(feature) => {
          setPendingFeatureName(feature || 'Manager Portal');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Website Hero / Corporate Information Masthead */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-indigo-900/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 tracking-wide uppercase">
                Field Operations Web Portal
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Automatic GPS Verification Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Daily Sales Scheduling & GPS Location Audit Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Record sales representatives' scheduled visits with verified physical coordinates, certified by Google Maps Grounding and synchronized directly to your Google Form.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/15 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Access Level
              </span>
              <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                {isAuthorized ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Authorised Manager</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Field Representative</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Tab 1: Form Entry (Open to all field reps) */}
        {activeTab === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: GPS Telemetry & Google Maps Grounding */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <GPSPanel
                location={location}
                grounding={grounding}
                isLocating={isLocating}
                isGrounding={isGrounding}
                onRefreshLocation={fetchCurrentLocation}
                onManualCoordinateSet={handleManualCoordinateSet}
                groundingError={groundingError}
              />
            </div>

            {/* Right Column: Google Form Data Entry */}
            <div className="lg:col-span-7">
              <SalesSchedulingForm
                location={location}
                grounding={grounding}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                lastSubmittedId={lastSubmittedId}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Visit Log & Map (Restricted to Authorised) */}
        {activeTab === 'history' &&
          (isAuthorized ? (
            <VisitHistory
              records={records}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearAll}
            />
          ) : (
            <LockedFeatureGate
              featureName="Visit Log & Map Intelligence"
              featureDescription="The complete visit audit log, individual GPS coordinates history, and interactive multi-visit map are restricted to authorised sales managers and supervisors."
              onOpenAuthModal={() => {
                setPendingFeatureName('Visit Log & Map Intelligence');
                setIsAuthModalOpen(true);
              }}
              onBackToForm={() => setActiveTab('form')}
            />
          ))}

        {/* Tab 3: Sales Performance (Restricted to Authorised) */}
        {activeTab === 'analytics' &&
          (isAuthorized ? (
            <StatsOverview records={records} />
          ) : (
            <LockedFeatureGate
              featureName="Sales Performance Analytics"
              featureDescription="Executive conversion summaries, Lumpsum and SIP deal metrics, and team-wide field scheduling KPIs are restricted to authorised management personnel."
              onOpenAuthModal={() => {
                setPendingFeatureName('Sales Performance Analytics');
                setIsAuthModalOpen(true);
              }}
              onBackToForm={() => setActiveTab('form')}
            />
          ))}
      </main>

      {/* Authorised Access Modal */}
      <AuthorisedAccessModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(session) => {
          setAuthSession(session);
        }}
        targetFeatureName={pendingFeatureName}
      />

      {/* Website Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                ST
              </div>
              <div>
                <span className="font-bold text-slate-900 block">
                  SalesTrack Enterprise Portal
                </span>
                <span className="text-[11px] text-slate-400">
                  Google Form ID: 1FAIpQLSeOk9VFaCsynaNm6ACAzyadizBBH4OVPI5rlCjuQK5ax-1VUQ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-600">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Google Maps Grounding with Gemini 3.8 Flash</span>
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Role-Based Access Protected</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              &copy; {new Date().getFullYear()} SalesTrack Enterprise Portal. Field Sales Scheduling & GPS Telemetry System.
            </span>
            <div className="flex items-center gap-3">
              <span>Security & Audit Verified</span>
              <span>&bull;</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
