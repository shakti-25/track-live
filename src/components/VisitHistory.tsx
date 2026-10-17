import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  MapPin,
  ListFilter,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Clock,
  Building,
  User,
  PhoneCall,
  Users,
  Coins,
  Repeat,
  Map as MapIcon,
  Table as TableIcon,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { VisitRecord } from '../types.ts';
import { exportVisitsToCSV } from '../utils/formAudit.ts';
import { MapView } from './MapView.tsx';

interface VisitHistoryProps {
  records: VisitRecord[];
  onDeleteRecord?: (id: string) => void;
  onClearAll?: () => void;
}

export const VisitHistory: React.FC<VisitHistoryProps> = ({
  records,
  onDeleteRecord,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMeet, setFilterMeet] = useState<'ALL' | 'PHYSICAL' | 'CALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.formData.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.formData.salesPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.grounding?.verifiedAddress &&
          r.grounding.verifiedAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.formData.serialNo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMeet =
        filterMeet === 'ALL'
          ? true
          : filterMeet === 'PHYSICAL'
          ? r.formData.physicalMeet === 'YES'
          : r.formData.callMeet === 'YES';

      return matchSearch && matchMeet;
    });
  }, [records, searchTerm, filterMeet]);

  const handleExportCSV = () => {
    const csvContent = exportVisitsToCSV(filteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salestrack_gps_visits_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mapMarkers = useMemo(() => {
    return filteredRecords.map((r) => ({
      id: r.id,
      latitude: r.location.latitude,
      longitude: r.location.longitude,
      title: `${r.formData.clientName} (${r.formData.salesPersonName})`,
      subtitle: `${r.formData.date} ${r.formData.time} &bull; ${r.grounding?.verifiedAddress || ''}`,
    }));
  }, [filteredRecords]);

  // Center map on latest record or default
  const centerLat = filteredRecords.length > 0 ? filteredRecords[0].location.latitude : 28.6139;
  const centerLng = filteredRecords.length > 0 ? filteredRecords[0].location.longitude : 77.2090;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Verified Sales Visit Log</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
              {filteredRecords.length} entries
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history of all scheduled field visits with embedded GPS coordinates & Google Maps data
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>Map View</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-2xs disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {onClearAll && records.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear local visit logs?')) {
                  onClearAll();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all visit records"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client, salesperson, or address..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <ListFilter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filter:</span>
          <select
            value={filterMeet}
            onChange={(e) => setFilterMeet(e.target.value as any)}
            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Visits</option>
            <option value="PHYSICAL">Physical Meets Only</option>
            <option value="CALL">Call Meets Only</option>
          </select>
        </div>
      </div>

      {/* View Content: Map View or Table/Card View */}
      {viewMode === 'map' ? (
        <div className="p-4">
          <div className="mb-2 text-xs text-slate-600">
            Interactive map showing all <b>{filteredRecords.length}</b> recorded visit coordinates. Click any marker to view visit details.
          </div>
          <MapView
            latitude={centerLat}
            longitude={centerLng}
            allMarkers={mapMarkers}
            className="h-[480px] w-full rounded-xl overflow-hidden shadow-inner border border-slate-200"
          />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <MapPin className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-700">No sales visits found</p>
          <p className="text-xs text-slate-400 mt-1">
            Submit a new visit schedule with GPS coordinates to see it appear in this log.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Serial / Date</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Salesperson</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Deals (Lumpsum / SIP)</th>
                <th className="py-3 px-4">GPS Location & Address</th>
                <th className="py-3 px-4">Sync Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-900 block">
                      {record.formData.serialNo}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {record.formData.date} &bull; {record.formData.time}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-900">
                    {record.formData.clientName}
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {record.formData.salesPersonName}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {record.formData.physicalMeet === 'YES' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <Users className="h-2.5 w-2.5" /> Physical
                        </span>
                      )}
                      {record.formData.callMeet === 'YES' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                          <PhoneCall className="h-2.5 w-2.5" /> Call
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {record.formData.businessLumpsum === 'YES' && (
                        <div className="text-[11px] text-amber-700 font-medium">
                          Lumpsum: Rs. {Number(record.formData.businessLumpsumAmount || 0).toLocaleString()}
                        </div>
                      )}
                      {record.formData.businessSip === 'YES' && (
                        <div className="text-[11px] text-teal-700 font-medium">
                          SIP: Rs. {Number(record.formData.businessSipAmount || 0).toLocaleString()}
                        </div>
                      )}
                      {record.formData.businessLumpsum !== 'YES' && record.formData.businessSip !== 'YES' && (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-[11px] font-medium text-slate-800 block">
                          {record.location.latitude.toFixed(5)}, {record.location.longitude.toFixed(5)}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate max-w-[220px]" title={record.grounding?.verifiedAddress}>
                          {record.grounding?.verifiedAddress || 'Coordinates logged'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {record.formStatus === 'synced_google_forms' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Google Form Synced</span>
                      </span>
                    ) : record.formStatus === 'local_only' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <span>Local GPS Record</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Pending Sync</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedVisit(record)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                      <a
                        href={record.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="View pin on Google Maps"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {onDeleteRecord && (
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1 text-slate-300 hover:text-red-600 rounded"
                          title="Delete visit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Visit Audit: {selectedVisit.formData.clientName}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Serial: {selectedVisit.formData.serialNo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Mini Map */}
              <MapView
                latitude={selectedVisit.location.latitude}
                longitude={selectedVisit.location.longitude}
                accuracy={selectedVisit.location.accuracy}
                label={selectedVisit.formData.clientName}
                className="h-40 w-full rounded-xl overflow-hidden shadow-inner border border-slate-200"
              />

              {/* Coordinates block */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Exact GPS Coordinates:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedVisit.location.latitude.toFixed(6)}, {selectedVisit.location.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accuracy Radius:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ±{Math.round(selectedVisit.location.accuracy)} meters
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Visit Timestamp:</span>
                  <span className="text-slate-800">
                    {new Date(selectedVisit.submittedAt).toLocaleString()}
                  </span>
                </div>
                {selectedVisit.grounding?.verifiedAddress && (
                  <div className="pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 block mb-0.5">Verified Address:</span>
                    <span className="text-slate-900 font-medium leading-relaxed block">
                      {selectedVisit.grounding.verifiedAddress}
                    </span>
                  </div>
                )}
              </div>

              {/* Full Audit text sent to Google Form */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Recorded Particulars / GPS Audit Stamp:
                </span>
                <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedVisit.gpsAuditText}
                </pre>
              </div>

              {/* Verified Links */}
              {selectedVisit.grounding?.places && selectedVisit.grounding.places.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-indigo-900 block mb-1.5">
                    Google Maps Grounding Verified Places:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVisit.grounding.places.map((p, idx) => (
                      <a
                        key={idx}
                        href={p.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-200 transition-colors"
                      >
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span>{p.title}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <a
                href={selectedVisit.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
