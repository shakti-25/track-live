import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapViewProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  label?: string;
  className?: string;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  allMarkers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
  }>;
}

export const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  accuracy,
  label = 'Current Location',
  className = 'h-64 w-full rounded-xl overflow-hidden shadow-inner border border-slate-200',
  interactive = true,
  onLocationSelect,
  allMarkers,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const multiMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Fix default Leaflet icon paths in bundler
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    const map = mapRef.current;
    map.setView([latitude, longitude], map.getZoom() || 16);

    // Update main marker
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const customIcon = L.divIcon({
        className: 'custom-pulse-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span class="relative inline-flex h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    }
    markerRef.current.bindPopup(`<b>${label}</b><br/>${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

    // Update accuracy circle
    if (accuracy && accuracy > 0) {
      if (circleRef.current) {
        circleRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setRadius(accuracy);
      } else {
        circleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#3b82f6',
          fillColor: '#93c5fd',
          fillOpacity: 0.25,
          weight: 1.5,
        }).addTo(map);
      }
    } else if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // Render multi markers if passed
    multiMarkersRef.current.forEach((m) => map.removeLayer(m));
    multiMarkersRef.current = [];

    if (allMarkers && allMarkers.length > 0) {
      allMarkers.forEach((item) => {
        const marker = L.marker([item.latitude, item.longitude])
          .addTo(map)
          .bindPopup(`<b>${item.title}</b><br/>${item.subtitle || ''}`);
        multiMarkersRef.current.push(marker);
      });
    }

    return () => {
      // Do not destroy map synchronously on every state update to avoid flickers,
      // but ensure container is handled properly
    };
  }, [latitude, longitude, accuracy, label, interactive, onLocationSelect, allMarkers]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
};
