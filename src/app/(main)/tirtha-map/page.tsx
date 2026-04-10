'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Search, Navigation, Info, Clock } from 'lucide-react';
import { fetchNearbyTemples, geocodeCity, type Temple } from '@/lib/overpass';
import { useLocation } from '@/lib/LocationContext';
import { API, MAP, MANDIR } from '@/lib/config';

// Load map with no SSR
const TirthaMapComponent = dynamic(
  () => import('@/components/TirthaMapComponent'),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-orange-50 rounded-2xl">
      <span className="text-3xl animate-pulse">🛕</span>
    </div>
  )}
);

// Tradition-level filters (top row)
const TRADITION_FILTERS = [
  { label: 'All',      value: 'all',      emoji: '🙏'  },
  { label: 'Hindu',    value: 'hindu',    emoji: '🕉️'  },
  { label: 'Sikh',     value: 'sikh',     emoji: '☬'   },
  { label: 'Buddhist', value: 'buddhist', emoji: '☸️'  },
  { label: 'Jain',     value: 'jain',     emoji: '🤲'  },
];

// Sampradaya sub-filters (shown only for Hindu / All)
const SAMPRADAYA_FILTERS = [
  { label: 'All',      value: 'all',       emoji: '🛕' },
  { label: 'Vaishnava',value: 'vaishnava', emoji: '🦚' },
  { label: 'Shaiva',   value: 'shaiva',    emoji: '🔱' },
  { label: 'Shakta',   value: 'shakta',    emoji: '⚔️' },
  { label: 'Smarta',   value: 'smarta',    emoji: '🕉️' },
];

const TRADITION_PLACE_LABEL: Record<string, string> = {
  all: 'sacred places', hindu: 'mandirs', sikh: 'gurudwaras',
  buddhist: 'viharas & stupas', jain: 'Jain temples',
};

const RADIUS_OPTIONS = [
  { label: '3 mi',  value: 5000  },
  { label: '6 mi',  value: 10000 },
  { label: '15 mi', value: 25000 },
  { label: '30 mi', value: 50000 },
];

// Aarti times — configured in @/lib/config.ts → MANDIR.DEFAULT_AARTI_TIMES
const AARTI_TIMES = MANDIR.DEFAULT_AARTI_TIMES;

const TRADITION_BADGE_LABEL: Record<Temple['tradition'], string> = {
  hindu: 'Mandir',
  sikh: 'Gurudwara',
  buddhist: 'Vihara',
  jain: 'Jain derasar',
  other: 'Sacred place',
};

const VISIT_CUES: Record<Temple['tradition'], { label: string; items: string[] }> = {
  hindu: {
    label: 'Visit rhythm',
    items: ['Darshan', 'Aarti', 'Temple hours'],
  },
  sikh: {
    label: 'What to look for',
    items: ['Darbar Sahib', 'Langar', 'Diwan schedule'],
  },
  buddhist: {
    label: 'What to look for',
    items: ['Meditation hall', 'Prayer times', 'Teaching schedule'],
  },
  jain: {
    label: 'What to look for',
    items: ['Darshan', 'Pratikraman', 'Temple hours'],
  },
  other: {
    label: 'Visit rhythm',
    items: ['Opening hours', 'Contact', 'Directions'],
  },
};

function kmToMiles(km: number) {
  return (km * 0.621371).toFixed(1);
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function isOpen(temple: Temple): boolean | null {
  if (!temple.opening) return null;
  const open = temple.opening.toLowerCase();
  const now = new Date();
  const hour = now.getHours();
  // Simple heuristic — open/close hours from config
  if (open.includes('24/7') || open.includes('24 hours')) return true;
  if (open.includes('closed')) return false;
  return hour >= MANDIR.OPEN_HOUR && hour < MANDIR.CLOSE_HOUR;
}

function getSampradaya(temple: Temple): string {
  const name = (temple.name + ' ' + (temple.deity ?? '') + ' ' + (temple.sampradaya ?? '')).toLowerCase();
  if (name.includes('vishnu') || name.includes('krishna') || name.includes('ram') || name.includes('vaishnav') || name.includes('hare')) return 'vaishnava';
  if (name.includes('shiva') || name.includes('siva') || name.includes('shiv') || name.includes('mahadev') || name.includes('rudra') || name.includes('nataraj')) return 'shaiva';
  if (name.includes('durga') || name.includes('kali') || name.includes('devi') || name.includes('shakti') || name.includes('amman') || name.includes('amba')) return 'shakta';
  return 'all';
}

function getDistanceLabel(center: [number, number], temple: Temple) {
  return kmToMiles(distanceKm(center[0], center[1], temple.lat, temple.lon));
}

function getTraditionSummary(temple: Temple) {
  const tradition = temple.tradition ?? 'other';
  return VISIT_CUES[tradition] ?? VISIT_CUES.other;
}

export default function TirthaMapPage() {
  const { coords, city: liveCity, loading: locLoading } = useLocation();

  const [temples,     setTemples]    = useState<Temple[]>([]);
  const [center,      setCenter]     = useState<[number, number]>(MAP.DEFAULT_CENTER);
  const [loading,     setLoading]    = useState(false);
  const [searched,    setSearched]   = useState(false);
  const [cityInput,   setCityInput]  = useState('');
  const [radius,      setRadius]     = useState<number>(API.OVERPASS.DEFAULT_RADIUS_M);
  const [selected,    setSelected]   = useState<Temple | null>(null);
  const [geoError,    setGeoError]   = useState('');
  const [tradFilter,  setTradFilter] = useState('all');
  const [sampFilter,  setSampFilter] = useState('all');
  const [locUsed,     setLocUsed]    = useState(false);

  const loadTemples = useCallback(async (lat: number, lon: number, r: number) => {
    setLoading(true);
    setGeoError('');
    try {
      const results = await fetchNearbyTemples(lat, lon, r);
      setTemples(results);
      setSearched(true);
    } catch {
      setGeoError('Could not load mandirs — map service may be slow. Tap Search or try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // When shared location context resolves, use it automatically (only once)
  useEffect(() => {
    if (coords && !locUsed) {
      setCenter([coords.lat, coords.lon]);
      loadTemples(coords.lat, coords.lon, radius);
      setLocUsed(true);
    }
  }, [coords, locUsed, loadTemples, radius]);

  // If location context is still loading, show a placeholder state
  // If no coords at all after context settles, fall back to London
  useEffect(() => {
    if (!locLoading && !coords && !locUsed) {
      loadTemples(51.5074, -0.1278, radius);
      setLocUsed(true);
    }
  }, [locLoading, coords, locUsed, loadTemples, radius]);

  async function searchCity() {
    if (!cityInput.trim()) return;
    setLoading(true);
    const parts   = cityInput.split(',').map((s) => s.trim());
    const coords  = await geocodeCity(parts[0], parts[1] ?? '');
    if (!coords) {
      setGeoError(`Couldn't find "${cityInput}" — try "London, UK" format`);
      setLoading(false);
      return;
    }
    setCenter([coords.lat, coords.lon]);
    await loadTemples(coords.lat, coords.lon, radius);
  }

  function useMyLocation() {
    setGeoError('');
    if (coords) {
      // We already have location from context — just re-search
      setCenter([coords.lat, coords.lon]);
      loadTemples(coords.lat, coords.lon, radius);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          loadTemples(pos.coords.latitude, pos.coords.longitude, radius);
        },
        () => setGeoError('Location access denied.')
      );
    } else {
      setGeoError('Geolocation not supported');
    }
  }

  // Filter: tradition first, then sampradaya (Hindu only)
  const byTradition = tradFilter === 'all'
    ? temples
    : temples.filter((t) => t.tradition === tradFilter);

  const filtered = (tradFilter === 'all' || tradFilter === 'hindu') && sampFilter !== 'all'
    ? byTradition.filter((t) => t.tradition === 'hindu' && getSampradaya(t) === sampFilter)
    : byTradition;

  const placeLabel = TRADITION_PLACE_LABEL[tradFilter] ?? 'sacred places';
  const activeCityLabel = cityInput.trim() || liveCity || 'your area';
  return (
    <div className="space-y-3 fade-in">
      <div className="glass-panel rounded-[1.9rem] px-5 py-5 space-y-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Tirtha Map</h1>
        <p className="text-sm text-gray-600 leading-relaxed">Search sacred places, filter by tradition, and open the result that feels right.</p>
      </div>

      {/* ── Search bar ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={liveCity ? `${liveCity} — or search another city` : 'Search city — "Leicester, UK"'}
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchCity()}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm"
          />
        </div>
        <button onClick={searchCity} disabled={loading}
          className="px-4 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition"
          style={{ background: '#7B1A1A' }}>
          Search
        </button>
        <button onClick={useMyLocation} title="Use my location"
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#7B1A1A]/40 transition">
          <Navigation size={15} style={{ color: '#7B1A1A' }} />
        </button>
      </div>

      {/* ── Tradition filter tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TRADITION_FILTERS.map((f) => (
          <button key={f.value}
            onClick={() => { setTradFilter(f.value); setSampFilter('all'); }}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              tradFilter === f.value
                ? 'text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-[#7B1A1A]/30'
            }`}
            style={tradFilter === f.value ? { background: '#7B1A1A' } : {}}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* ── Sampradaya sub-filters (Hindu only) ── */}
      {(tradFilter === 'all' || tradFilter === 'hindu') && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {SAMPRADAYA_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setSampFilter(f.value)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                sampFilter === f.value
                  ? 'text-white'
                  : 'bg-white text-gray-400 border border-gray-100 hover:border-orange-200'
              }`}
              style={sampFilter === f.value ? { background: '#b45309' } : {}}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Radius filter ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Radius:</span>
        <div className="flex gap-1.5">
          {RADIUS_OPTIONS.map((opt) => (
            <button key={opt.value}
              onClick={() => { setRadius(opt.value); loadTemples(center[0], center[1], opt.value); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                radius === opt.value
                  ? 'text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
              style={radius === opt.value ? { background: '#7B1A1A' } : {}}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-[1.5rem] px-4 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Visible', value: filtered.length },
            { label: 'Tradition', value: tradFilter === 'all' ? 'All' : tradFilter.slice(0, 1).toUpperCase() + tradFilter.slice(1) },
            { label: 'Radius', value: RADIUS_OPTIONS.find((option) => option.value === radius)?.label ?? '15 mi' },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.05rem] bg-white/72 border border-white/80 px-3 py-3 text-center">
              <p className="font-display font-bold text-lg" style={{ color: 'var(--brand-primary-strong)' }}>{item.value}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 font-semibold mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {geoError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Info size={14} /> {geoError}
        </div>
      )}

      {/* ── Map ── */}
      <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-orange-100 shadow-card">
        <TirthaMapComponent temples={filtered} center={center} loading={loading} />
      </div>

      {/* ── Results count ── */}
      {searched && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <span>{TRADITION_FILTERS.find(f => f.value === tradFilter)?.emoji ?? '🙏'}</span>
            <span>
              {loading ? 'Searching…' : (
                filtered.length > 0
                  ? <><strong>{filtered.length}</strong> {placeLabel} found</>
                  : `No ${placeLabel} found — try a larger radius`
              )}
            </span>
          </div>
          {filtered.length > 0 && (
            <span className="text-xs text-gray-400">{kmToMiles(radius / 1000)} mi radius</span>
          )}
        </div>
      )}

      {/* ── Place cards ── */}
      {filtered.length > 0 && (
        <div className="space-y-2 pb-4">
          {filtered.slice(0, API.OVERPASS.MAX_RESULTS).map((temple) => {
            const distMi   = getDistanceLabel(center, temple);
            const open     = isOpen(temple);
            const samp     = getSampradaya(temple);
            const sampInfo = SAMPRADAYA_FILTERS.find((f) => f.value === samp);
            const isExpanded = selected?.id === temple.id;
            const traditionSummary = getTraditionSummary(temple);
            const traditionBadge = TRADITION_BADGE_LABEL[temple.tradition ?? 'other'];

            return (
              <div
                key={temple.id}
                onClick={() => setSelected(isExpanded ? null : temple)}
                className={`glass-panel rounded-[1.6rem] border cursor-pointer transition-all ${
                  isExpanded ? 'border-[color:var(--brand-primary-soft)] shadow-sm' : 'border-white/80 hover:border-[color:var(--brand-primary-soft)]'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon — tradition-aware */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: '#7B1A1A15' }}>
                      {temple.tradition === 'sikh' ? '☬' :
                       temple.tradition === 'buddhist' ? '☸️' :
                       temple.tradition === 'jain' ? '🤲' : '🛕'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-2 flex-wrap">
                            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary-strong)] border border-white/80">
                              {traditionBadge}
                            </span>
                            {samp !== 'all' && sampInfo && (
                              <span className="text-xs text-gray-500">{sampInfo.emoji} {sampInfo.label}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm text-gray-900 leading-tight">{temple.name}</h3>
                        </div>
                        {/* Open/Closed badge */}
                        {open !== null && (
                          <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {open ? '● Open' : '● Closed'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Distance */}
                        <span className="text-xs text-gray-400">{distMi} mi</span>

                        {/* Deity */}
                        {temple.deity && (
                          <span className="text-xs text-[#7B1A1A]">🙏 {temple.deity}</span>
                        )}
                      </div>

                      {temple.address && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{temple.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-2 fade-in">
                      <div className="rounded-[1.15rem] bg-white/72 border border-white/80 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-[color:var(--brand-primary-strong)]" />
                          <span className="text-xs text-gray-600 font-medium">{traditionSummary.label}</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {traditionSummary.items.map((item) => (
                            <span key={item} className="text-xs rounded-full border border-[color:var(--brand-primary-soft)] bg-white/80 px-2 py-0.5 text-[color:var(--brand-primary-strong)]">
                              {item}
                            </span>
                          ))}
                          {temple.tradition === 'hindu' && !temple.opening &&
                            AARTI_TIMES.map((t) => (
                              <span key={t} className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                                {t}
                              </span>
                            ))}
                        </div>
                      </div>

                      {temple.opening && (
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          🕐 <span>{temple.opening}</span>
                        </p>
                      )}
                      {temple.phone && (
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          📞 <a href={`tel:${temple.phone}`} className="text-[#7B1A1A] hover:underline">{temple.phone}</a>
                        </p>
                      )}
                      {temple.website && (
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          🌐 <a href={temple.website} target="_blank" rel="noreferrer" className="text-[#7B1A1A] hover:underline truncate">{temple.website}</a>
                        </p>
                      )}
                      <a
                        href={`https://maps.google.com/?q=${temple.lat},${temple.lon}`}
                        target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 mt-1 text-xs px-3 py-1.5 rounded-full border transition"
                        style={{ background: '#7B1A1A', color: 'white', borderColor: '#7B1A1A' }}>
                        <Navigation size={11} /> Get Directions
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
