import type { DailySalesFormData, GPSLocation, GroundingResult, VisitRecord } from '../types.ts';

export const GOOGLE_FORM_ID = '1FAIpQLSeOk9VFaCsynaNm6ACAzyadizBBH4OVPI5rlCjuQK5ax-1VUQ';
export const GOOGLE_FORM_BASE_URL = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/viewform`;
export const GOOGLE_FORM_RESPONSE_URL = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;

export const FORM_ENTRY_IDS = {
  salesPersonName: 'entry.1351666595',
  serialNo: 'entry.1393945894',
  date: 'entry.816087353',
  clientName: 'entry.692812568',
  time: 'entry.1339550509',
  callMeet: 'entry.655952915',
  physicalMeet: 'entry.1206219418',
  followUpDate: 'entry.118534492',
  scheduleDone: 'entry.1493762676',
  businessLumpsum: 'entry.1568716998',
  businessLumpsumAmount: 'entry.1852361238',
  businessSip: 'entry.371784883',
  businessSipAmount: 'entry.800642537',
  particularRemarks: 'entry.1513291648',
} as const;

/**
 * Format GPS coordinates as a Google Maps pin link
 */
export function formatGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

/**
 * Generates an audit trail stamp containing precise GPS coordinates, accuracy,
 * timestamp, and verified address to embed inside PATICULAR/REMARKS or store with the record.
 */
export function generateGPSAuditStamp(
  location: GPSLocation,
  grounding?: GroundingResult,
  userRemarks?: string
): string {
  const dateStr = new Date(location.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
  const coordsStr = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  const accStr = `±${Math.round(location.accuracy)}m`;
  const mapsUrl = formatGoogleMapsUrl(location.latitude, location.longitude);
  const addressStr = grounding?.verifiedAddress ? grounding.verifiedAddress : 'Coordinates recorded';

  const stampLines = [
    `--- GPS VERIFIED VISIT AUDIT ---`,
    `Coordinates: ${coordsStr} (Accuracy: ${accStr})`,
    `Address: ${addressStr}`,
    `Recorded: ${dateStr}`,
    `Maps: ${mapsUrl}`,
  ];

  if (grounding?.places && grounding.places.length > 0) {
    const landmark = grounding.places[0].title;
    stampLines.splice(3, 0, `Nearby Landmark: ${landmark}`);
  }

  const stamp = stampLines.join('\n');
  const cleanRemarks = userRemarks?.trim() || '';

  if (cleanRemarks) {
    return `${cleanRemarks}\n\n${stamp}`;
  }
  return stamp;
}

/**
 * Maps application form state to Google Form POST parameters.
 */
export function buildGoogleFormPayload(
  formData: DailySalesFormData,
  location: GPSLocation,
  grounding?: GroundingResult
): Record<string, string> {
  const stampedRemarks = generateGPSAuditStamp(location, grounding, formData.particularRemarks);

  const payload: Record<string, string> = {
    [FORM_ENTRY_IDS.salesPersonName]: formData.salesPersonName || '',
    [FORM_ENTRY_IDS.serialNo]: formData.serialNo || '',
    [FORM_ENTRY_IDS.clientName]: formData.clientName || '',
    [FORM_ENTRY_IDS.callMeet]: formData.callMeet,
    [FORM_ENTRY_IDS.physicalMeet]: formData.physicalMeet,
    [FORM_ENTRY_IDS.scheduleDone]: formData.scheduleDone,
    [FORM_ENTRY_IDS.businessLumpsum]: formData.businessLumpsum,
    [FORM_ENTRY_IDS.businessLumpsumAmount]: formData.businessLumpsum === 'YES' ? formData.businessLumpsumAmount || '0' : '',
    [FORM_ENTRY_IDS.businessSip]: formData.businessSip,
    [FORM_ENTRY_IDS.businessSipAmount]: formData.businessSip === 'YES' ? formData.businessSipAmount || '0' : '',
    [FORM_ENTRY_IDS.particularRemarks]: stampedRemarks,
  };

  // Date parsing
  if (formData.date) {
    const parts = formData.date.split('-');
    if (parts.length === 3) {
      payload[`${FORM_ENTRY_IDS.date}_year`] = parts[0];
      payload[`${FORM_ENTRY_IDS.date}_month`] = String(parseInt(parts[1], 10));
      payload[`${FORM_ENTRY_IDS.date}_day`] = String(parseInt(parts[2], 10));
      payload[FORM_ENTRY_IDS.date] = formData.date;
    }
  }

  // Follow-up Date parsing
  if (formData.followUpDate) {
    const parts = formData.followUpDate.split('-');
    if (parts.length === 3) {
      payload[`${FORM_ENTRY_IDS.followUpDate}_year`] = parts[0];
      payload[`${FORM_ENTRY_IDS.followUpDate}_month`] = String(parseInt(parts[1], 10));
      payload[`${FORM_ENTRY_IDS.followUpDate}_day`] = String(parseInt(parts[2], 10));
      payload[FORM_ENTRY_IDS.followUpDate] = formData.followUpDate;
    }
  }

  // Time parsing (HH:mm)
  if (formData.time) {
    const timeParts = formData.time.split(':');
    if (timeParts.length >= 2) {
      payload[`${FORM_ENTRY_IDS.time}_hour`] = timeParts[0];
      payload[`${FORM_ENTRY_IDS.time}_minute`] = timeParts[1];
      payload[FORM_ENTRY_IDS.time] = formData.time;
    }
  }

  return payload;
}

/**
 * Builds a direct pre-filled Google Form URL that opens the Google Form with all fields and the GPS stamp populated.
 */
export function buildPrefillGoogleFormUrl(
  formData: DailySalesFormData,
  location: GPSLocation,
  grounding?: GroundingResult
): string {
  const payload = buildGoogleFormPayload(formData, location, grounding);
  const params = new URLSearchParams();
  params.set('usp', 'pp_url');

  for (const [key, val] of Object.entries(payload)) {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  }

  return `${GOOGLE_FORM_BASE_URL}?${params.toString()}`;
}

/**
 * Formats current date as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats current time as HH:MM
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
}

/**
 * Calculates summary metrics for sales visits
 */
export function calculateVisitMetrics(records: VisitRecord[]) {
  let totalVisits = records.length;
  let physicalVisits = 0;
  let callVisits = 0;
  let totalLumpsum = 0;
  let totalSip = 0;

  for (const r of records) {
    if (r.formData.physicalMeet === 'YES') physicalVisits++;
    if (r.formData.callMeet === 'YES') callVisits++;

    if (r.formData.businessLumpsum === 'YES') {
      const parsed = parseFloat(r.formData.businessLumpsumAmount.replace(/,/g, ''));
      if (!isNaN(parsed)) totalLumpsum += parsed;
    }

    if (r.formData.businessSip === 'YES') {
      const parsed = parseFloat(r.formData.businessSipAmount.replace(/,/g, ''));
      if (!isNaN(parsed)) totalSip += parsed;
    }
  }

  return {
    totalVisits,
    physicalVisits,
    callVisits,
    totalLumpsum,
    totalSip,
  };
}

/**
 * Converts visit records into downloadable CSV format
 */
export function exportVisitsToCSV(records: VisitRecord[]): string {
  const headers = [
    'Record ID',
    'Date',
    'Time',
    'Sales Person',
    'Serial No',
    'Client Name',
    'Call Meet',
    'Physical Meet',
    'Follow Up Date',
    'Schedule Done',
    'Business Lumpsum',
    'Lumpsum Amount',
    'Business SIP',
    'SIP Amount',
    'GPS Latitude',
    'GPS Longitude',
    'GPS Accuracy (m)',
    'Verified Address',
    'Google Maps Link',
    'Submission Status',
    'Remarks',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) => [
    escapeCSV(r.id),
    escapeCSV(r.formData.date),
    escapeCSV(r.formData.time),
    escapeCSV(r.formData.salesPersonName),
    escapeCSV(r.formData.serialNo),
    escapeCSV(r.formData.clientName),
    escapeCSV(r.formData.callMeet),
    escapeCSV(r.formData.physicalMeet),
    escapeCSV(r.formData.followUpDate),
    escapeCSV(r.formData.scheduleDone),
    escapeCSV(r.formData.businessLumpsum),
    escapeCSV(r.formData.businessLumpsumAmount),
    escapeCSV(r.formData.businessSip),
    escapeCSV(r.formData.businessSipAmount),
    escapeCSV(r.location.latitude),
    escapeCSV(r.location.longitude),
    escapeCSV(r.location.accuracy),
    escapeCSV(r.grounding?.verifiedAddress || ''),
    escapeCSV(r.googleMapsUrl),
    escapeCSV(r.formStatus),
    escapeCSV(r.formData.particularRemarks),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
