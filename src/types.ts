export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
  provider: 'browser_gps' | 'manual_pin' | 'ip_approx';
}

export interface GroundingPlace {
  title: string;
  uri: string;
  address?: string;
  placeId?: string;
  snippet?: string;
}

export interface GroundingResult {
  verifiedAddress: string;
  locality?: string;
  landmark?: string;
  description: string;
  places: GroundingPlace[];
  source: 'gemini_maps_grounding' | 'reverse_geocoding' | 'coordinates_only';
  fetchedAt: number;
}

export interface DailySalesFormData {
  salesPersonName: string;
  serialNo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  clientName: string;
  callMeet: 'YES' | 'No';
  physicalMeet: 'YES' | 'NO';
  followUpDate: string; // YYYY-MM-DD
  scheduleDone: 'YES' | 'No';
  businessLumpsum: 'YES' | 'NO';
  businessLumpsumAmount: string;
  businessSip: 'YES' | 'No';
  businessSipAmount: string;
  particularRemarks: string;
}

export interface VisitRecord {
  id: string;
  submittedAt: number;
  formData: DailySalesFormData;
  location: GPSLocation;
  grounding?: GroundingResult;
  gpsAuditText: string;
  googleMapsUrl: string;
  formStatus: 'synced_google_forms' | 'local_only' | 'pending_sync' | 'sync_error';
  errorMessage?: string;
}
