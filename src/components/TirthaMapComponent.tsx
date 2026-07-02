'use client';

// Loaded dynamically with ssr:false — Leaflet needs the browser's window object
import { useEffect, useState, useRef } from 'react';
import type { Temple } from '@/lib/overpass';
import type { LiveStream } from '@/lib/live-streams';
import { MAP } from '@/lib/config';

interface Props {
  temples:  Temple[];
  center:   [number, number];
  loading:  boolean;
  liveMatches?: Map<number, LiveStream>;
}

// ── Tradition marker styles ────────────────────────────────────────────────
const TRADITION_MARKER: Record<string, { glyph: string; gradient: string; shadow: string }> = {
  hindu:    { glyph: '⌂', gradient: 'linear-gradient(135deg,#ff7722,#d4a017)', shadow: 'rgba(255,119,34,0.4)'  },
  sikh:     { glyph: 'ੴ', gradient: 'linear-gradient(135deg,#1e6bb8,#3b9ef4)', shadow: 'rgba(30,107,184,0.4)' },
  buddhist: { glyph: '☸', gradient: 'linear-gradient(135deg,#7c3aed,#c084fc)', shadow: 'rgba(124,58,237,0.4)' },
  jain:     { glyph: 'अ', gradient: 'linear-gradient(135deg,#0d9488,#2dd4bf)', shadow: 'rgba(13,148,136,0.4)' },
  other:    { glyph: '⌖', gradient: 'linear-gradient(135deg,#6b7280,#9ca3af)', shadow: 'rgba(107,114,128,0.3)' },
};

const TRADITION_LABEL: Record<string, string> = {
  hindu: 'Hindu Mandir', sikh: 'Gurudwara',
  buddhist: 'Buddhist Vihara', jain: 'Jain Temple', other: 'Sacred Place',
};

const TRADITION_VISIT_HINT: Record<string, string> = {
  hindu: 'Darshan and temple visit',
  sikh: 'Darbar Sahib and langar',
  buddhist: 'Meditation and prayer',
  jain: 'Darshan and temple visit',
  other: 'Visit details',
};

function makeMarkerHtml(tradition: string, isLive?: boolean) {
  const { glyph, gradient, shadow } = TRADITION_MARKER[tradition] ?? TRADITION_MARKER.other;
  
  if (isLive) {
    return `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; background: rgba(220,38,38,0.4); border-radius: 50%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="
          position: relative;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          border: 2px solid white;
          border-radius: 50%;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          color: white;
          font-weight: 700;
          line-height: 1;
          box-shadow: 0 2px 12px rgba(220,38,38,0.6);
          cursor: pointer;
          z-index: 2;
        ">${glyph}</div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      </style>
    `;
  }

  return `<div style="
    background: ${gradient};
    border: 2px solid white;
    border-radius: 50%;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    color: white;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 2px 8px ${shadow};
    cursor: pointer;
  ">${glyph}</div>`;
}

export default function TirthaMapComponent({ temples, center, loading, liveMatches }: Props) {
  const mapRef    = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const initialCenterRef = useRef(center);
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

      const map = L.map(mapDivRef.current!, { center: initialCenterRef.current, zoom: 12, zoomControl: true });

      L.tileLayer(MAP.TILE_URL, { attribution: MAP.TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      // User location marker
      const userIcon = L.divIcon({
        html: `<div style="background:#ff7722;border:3px solid white;border-radius:50%;width:16px;height:16px;box-shadow:0 0 0 4px rgba(255,119,34,0.25);"></div>`,
        className: '', iconSize: [16, 16], iconAnchor: [8, 8],
      });
      L.marker(initialCenterRef.current, { icon: userIcon }).addTo(map).bindPopup('<b>📍 Your location</b>').openPopup();

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
      const liveStream = liveMatches?.get(t.id);

      const icon = L.divIcon({
        html: makeMarkerHtml(trad, !!liveStream),
        className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
      });

      const popup = `
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:14px;color:#1a1a1a;margin-bottom:4px">${t.name}</div>
          <div style="font-size:11px;color:#888;margin-bottom:4px;font-style:italic">${tradLabel}</div>
          <div style="font-size:11px;color:#9f5d74;margin-bottom:4px">${TRADITION_VISIT_HINT[trad] ?? TRADITION_VISIT_HINT.other}</div>
          
          ${liveStream ? `
            <div style="background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.2); border-radius: 6px; padding: 6px 8px; margin: 8px 0;">
              <div style="font-size: 10px; font-weight: bold; color: #dc2626; text-transform: uppercase; margin-bottom: 2px;">🔴 Live Darshan</div>
              <div style="font-size: 12px; font-weight: 500; color: #1a1a1a;">${liveStream.title}</div>
              ${liveStream.aartis ? `
                <div style="font-size: 11px; color: #C5A059; margin-top: 4px; font-weight: 500;">
                  ${liveStream.aartis.morning ? `🌅 ${liveStream.aartis.morning.split(' — ')[0]}` : ''}
                  ${liveStream.aartis.morning && liveStream.aartis.evening ? ' · ' : ''}
                  ${liveStream.aartis.evening ? `🪔 ${liveStream.aartis.evening.split(' — ')[0]}` : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
          ${t.deity    ? `<div style="font-size:12px;color:#666;margin-bottom:2px">Known for: ${t.deity}</div>` : ''}
          ${t.address  ? `<div style="font-size:12px;color:#666;margin-bottom:2px">Address: ${t.address}</div>` : ''}
          ${t.opening  ? `<div style="font-size:12px;color:#666;margin-bottom:2px">Opening: ${t.opening}</div>` : ''}
          ${t.phone    ? `<div style="font-size:12px;color:#666;margin-bottom:2px">Phone: ${t.phone}</div>` : ''}
          ${t.website  ? `<a href="${t.website}" target="_blank" style="font-size:12px;color:#ff7722">Website</a>` : ''}
          <div style="margin-top:6px">
            <a href="${MAP.googleDirections(t.lat, t.lon)}" target="_blank"
               style="font-size:11px;color:#ff7722;text-decoration:none;background:#fff8f0;padding:3px 8px;border-radius:8px;border:1px solid #fcd5ac">
              Get Directions →
            </a>
          </div>
        </div>
      `;
      const marker = L.marker([t.lat, t.lon], { icon, _isPlace: true } as any)
        .addTo(map)
        .bindPopup(popup, { maxWidth: 250 });

      // Apply aarti times tooltip on marker hover if it's a live stream
      if (liveStream?.aartis) {
        const tooltipHtml = `
          <div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#C5A059;text-align:center;white-space:nowrap;">
            ${liveStream.aartis.morning ? `🌅 ${liveStream.aartis.morning.split(' — ')[0]}` : ''}
            ${liveStream.aartis.morning && liveStream.aartis.evening ? ' &nbsp;·&nbsp; ' : ''}
            ${liveStream.aartis.evening ? `🪔 ${liveStream.aartis.evening.split(' — ')[0]}` : ''}
          </div>
        `;
        marker.bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -32], opacity: 1 });
      }
    });
  }, [temples, ready, liveMatches]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <link rel="stylesheet" href={MAP.LEAFLET_CSS} />
      <div ref={mapDivRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#ff7722]/20 border-t-[#ff7722]" />
            <span className="text-sm text-gray-600 font-medium">Finding sacred places nearby…</span>
          </div>
        </div>
      )}
    </div>
  );
}
