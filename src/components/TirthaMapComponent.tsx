'use client';

// Loaded dynamically with ssr:false — Leaflet needs the browser's window object
import { useEffect, useState, useRef } from 'react';
import type { Temple } from '@/lib/overpass';
import { MAP } from '@/lib/config';

interface Props {
  temples:  Temple[];
  center:   [number, number];
  loading:  boolean;
}

// ── Tradition marker styles ────────────────────────────────────────────────
const TRADITION_MARKER: Record<string, { emoji: string; gradient: string; shadow: string }> = {
  hindu:    { emoji: '🛕', gradient: 'linear-gradient(135deg,#ff7722,#d4a017)', shadow: 'rgba(255,119,34,0.4)'  },
  sikh:     { emoji: '☬',  gradient: 'linear-gradient(135deg,#1e6bb8,#3b9ef4)', shadow: 'rgba(30,107,184,0.4)' },
  buddhist: { emoji: '☸️', gradient: 'linear-gradient(135deg,#7c3aed,#c084fc)', shadow: 'rgba(124,58,237,0.4)' },
  jain:     { emoji: '🤲', gradient: 'linear-gradient(135deg,#0d9488,#2dd4bf)', shadow: 'rgba(13,148,136,0.4)' },
  other:    { emoji: '🕌', gradient: 'linear-gradient(135deg,#6b7280,#9ca3af)', shadow: 'rgba(107,114,128,0.3)' },
};

const TRADITION_LABEL: Record<string, string> = {
  hindu: 'Hindu Mandir', sikh: 'Gurudwara',
  buddhist: 'Buddhist Vihara', jain: 'Jain Temple', other: 'Sacred Place',
};

function makeMarkerHtml(tradition: string) {
  const { emoji, gradient, shadow } = TRADITION_MARKER[tradition] ?? TRADITION_MARKER.other;
  return `<div style="
    background: ${gradient};
    border: 2px solid white;
    border-radius: 50%;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    box-shadow: 0 2px 8px ${shadow};
    cursor: pointer;
  ">${emoji}</div>`;
}

export default function TirthaMapComponent({ temples, center, loading }: Props) {
  const mapRef    = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapDivRef.current) return;
    if (mapRef.current) return;

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       MAP.MARKER_ICON,
        iconRetinaUrl: MAP.MARKER_ICON_2X,
        shadowUrl:     MAP.MARKER_SHADOW,
      });

      const map = L.map(mapDivRef.current!, { center, zoom: 12, zoomControl: true });

      L.tileLayer(MAP.TILE_URL, { attribution: MAP.TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      // User location marker
      const userIcon = L.divIcon({
        html: `<div style="background:#ff7722;border:3px solid white;border-radius:50%;width:16px;height:16px;box-shadow:0 0 0 4px rgba(255,119,34,0.25);"></div>`,
        className: '', iconSize: [16, 16], iconAnchor: [8, 8],
      });
      L.marker(center, { icon: userIcon }).addTo(map).bindPopup('<b>📍 Your location</b>').openPopup();

      mapRef.current = { map, L };
      setReady(true);
    });

    return () => { mapRef.current?.map.remove(); mapRef.current = null; };
  }, []);

  // Update markers when temples change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const { map, L } = mapRef.current;

    // Clear old place markers (keep user location)
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.options._isPlace) map.removeLayer(layer);
    });

    temples.forEach((t) => {
      const trad      = t.tradition ?? 'other';
      const tradLabel = TRADITION_LABEL[trad] ?? 'Sacred Place';
      const { emoji } = TRADITION_MARKER[trad] ?? TRADITION_MARKER.other;

      const icon = L.divIcon({
        html: makeMarkerHtml(trad),
        className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
      });

      const popup = `
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:14px;color:#1a1a1a;margin-bottom:4px">${emoji} ${t.name}</div>
          <div style="font-size:11px;color:#888;margin-bottom:4px;font-style:italic">${tradLabel}</div>
          ${t.deity    ? `<div style="font-size:12px;color:#666;margin-bottom:2px">🙏 ${t.deity}</div>` : ''}
          ${t.sampradaya ? `<div style="font-size:12px;color:#666;margin-bottom:2px">🏛️ ${t.sampradaya}</div>` : ''}
          ${t.address  ? `<div style="font-size:12px;color:#666;margin-bottom:2px">📍 ${t.address}</div>` : ''}
          ${t.opening  ? `<div style="font-size:12px;color:#666;margin-bottom:2px">🕐 ${t.opening}</div>` : ''}
          ${t.phone    ? `<div style="font-size:12px;color:#666;margin-bottom:2px">📞 ${t.phone}</div>` : ''}
          ${t.website  ? `<a href="${t.website}" target="_blank" style="font-size:12px;color:#ff7722">🌐 Website</a>` : ''}
          <div style="margin-top:6px">
            <a href="${MAP.googleDirections(t.lat, t.lon)}" target="_blank"
               style="font-size:11px;color:#ff7722;text-decoration:none;background:#fff8f0;padding:3px 8px;border-radius:8px;border:1px solid #fcd5ac">
              Get Directions →
            </a>
          </div>
        </div>
      `;
      L.marker([t.lat, t.lon], { icon, _isPlace: true } as any)
        .addTo(map)
        .bindPopup(popup, { maxWidth: 250 });
    });
  }, [temples, ready]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <link rel="stylesheet" href={MAP.LEAFLET_CSS} />
      <div ref={mapDivRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl animate-spin">🛕</span>
            <span className="text-sm text-gray-600 font-medium">Finding sacred places nearby…</span>
          </div>
        </div>
      )}
    </div>
  );
}
