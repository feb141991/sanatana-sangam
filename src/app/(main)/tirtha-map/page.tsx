'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Bookmark,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Compass,
  Info,
  MapPin,
  Navigation,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchNearbyTemples, geocodeCity, type Temple } from '@/lib/overpass';
import { useLocation } from '@/lib/LocationContext';
import { API, MAP, MANDIR } from '@/lib/config';
import { getTraditionMeta } from '@/lib/tradition-config';
import { createClient } from '@/lib/supabase';
import {
  buildTirthaShareText,
  getSeasonalTirthaCue,
  getVisitPreparation,
  templeMatchesSmartFilter,
  templeToPlaceRow,
  tirthaPlaceId,
  TIRTHA_MOODS,
  TIRTHA_PRIVACY_OPTIONS,
  type TirthaMood,
  type TirthaPrivacy,
  type TirthaSaveRow,
  type TirthaVisitRow,
} from '@/lib/tirtha-companion';

const TirthaMapComponent = dynamic(
  () => import('@/components/TirthaMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-[1.5rem] border border-[rgba(200,146,74,0.18)] bg-[var(--surface-raised)]">
        <Compass size={28} className="animate-pulse text-[color:var(--brand-primary)]" />
      </div>
    ),
  }
);

const RADIUS_OPTIONS = [
  { label: '3 mi', value: 5000 },
  { label: '6 mi', value: 10000 },
  { label: '15 mi', value: 25000 },
  { label: '30 mi', value: 50000 },
];

const SMART_FILTERS = [
  { id: 'all', label: 'Nearby' },
  { id: 'open', label: 'Open now' },
  { id: 'saved', label: 'Saved' },
  { id: 'visited', label: 'Visited' },
  { id: 'live', label: 'Live darshan' },
];

function kmToMiles(km: number) {
  return (km * 0.621371).toFixed(1);
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isOpen(temple: Temple): boolean | null {
  if (!temple.opening) return null;
  const open = temple.opening.toLowerCase();
  const hour = new Date().getHours();
  if (open.includes('24/7') || open.includes('24 hours')) return true;
  if (open.includes('closed')) return false;
  return hour >= MANDIR.OPEN_HOUR && hour < MANDIR.CLOSE_HOUR;
}

function getDistanceLabel(center: [number, number], temple: Temple) {
  return kmToMiles(distanceKm(center[0], center[1], temple.lat, temple.lon));
}

function safeErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message);
  return 'Something went wrong.';
}

export default function TirthaMapPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { coords, city: liveCity, loading: locLoading, refresh: refreshLocation } = useLocation();

  const [userId, setUserId] = useState<string | null>(null);
  const [tradition, setTradition] = useState<string>('hindu');
  const [temples, setTemples] = useState<Temple[]>([]);
  const [center, setCenter] = useState<[number, number]>(MAP.DEFAULT_CENTER);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [radius, setRadius] = useState<number>(API.OVERPASS.DEFAULT_RADIUS_M);
  const [selected, setSelected] = useState<Temple | null>(null);
  const [checkInTemple, setCheckInTemple] = useState<Temple | null>(null);
  const [geoError, setGeoError] = useState('');
  const [notice, setNotice] = useState('');
  const [smartFilter, setSmartFilter] = useState('all');
  const [locationAsked, setLocationAsked] = useState(false);
  const [saves, setSaves] = useState<TirthaSaveRow[]>([]);
  const [visits, setVisits] = useState<TirthaVisitRow[]>([]);
  const [savingPlace, setSavingPlace] = useState<string | null>(null);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [checkInMood, setCheckInMood] = useState<TirthaMood>('gratitude');
  const [checkInPrivacy, setCheckInPrivacy] = useState<TirthaPrivacy>('private');
  const [intention, setIntention] = useState('');
  const [reflection, setReflection] = useState('');
  const [companions, setCompanions] = useState('');
  const [pradakshinaCount, setPradakshinaCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      setUserId(user?.id ?? null);
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('tradition')
        .eq('id', user.id)
        .maybeSingle();
      if (mounted && data?.tradition) setTradition(data.tradition);
    });
    return () => { mounted = false; };
  }, [supabase]);

  const refreshPassport = useCallback(async (uid = userId) => {
    if (!uid) return;
    const [savesResult, visitsResult] = await Promise.all([
      supabase.from('tirtha_saves').select('id, place_id, created_at, note').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('tirtha_checkins').select('id, place_id, visited_at, privacy, darshan_mood, intention, reflection, companions, pradakshina_count, seva_note').eq('user_id', uid).order('visited_at', { ascending: false }),
    ]);

    if (!savesResult.error && savesResult.data) setSaves(savesResult.data as TirthaSaveRow[]);
    if (!visitsResult.error && visitsResult.data) setVisits(visitsResult.data as TirthaVisitRow[]);
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) refreshPassport(userId);
  }, [refreshPassport, userId]);

  const loadTemples = useCallback(async (lat: number, lon: number, r: number) => {
    setLoading(true);
    setGeoError('');
    try {
      const results = await fetchNearbyTemples(lat, lon, r);
      setTemples(results);
      setSearched(true);
    } catch {
      setGeoError('Could not load sacred places. The map service may be slow; try search or a smaller radius.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searched && !locLoading) {
      loadTemples(MAP.DEFAULT_CENTER[0], MAP.DEFAULT_CENTER[1], radius);
    }
  }, [loadTemples, locLoading, radius, searched]);

  async function searchCity() {
    if (!cityInput.trim()) return;
    setLoading(true);
    setGeoError('');
    const parts = cityInput.split(',').map((s) => s.trim());
    const found = await geocodeCity(parts[0], parts[1] ?? '');
    if (!found) {
      setGeoError(`Could not find "${cityInput}". Try "London, UK" or "Bedford, UK".`);
      setLoading(false);
      return;
    }
    setCenter([found.lat, found.lon]);
    await loadTemples(found.lat, found.lon, radius);
  }

  async function useMyLocation() {
    setLocationAsked(true);
    setGeoError('');

    if (coords) {
      setCenter([coords.lat, coords.lon]);
      await loadTemples(coords.lat, coords.lon, radius);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Location is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(next);
        loadTemples(next[0], next[1], radius);
        refreshLocation();
      },
      () => setGeoError('Location access was not granted. You can still search by city.'),
      { timeout: 9000, enableHighAccuracy: false }
    );
  }

  async function ensurePlace(temple: Temple) {
    if (!userId) throw new Error('Please sign in to save visits.');
    const row = templeToPlaceRow(temple, userId);
    const { error } = await supabase.from('tirtha_places').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    return row.id;
  }

  async function toggleSave(temple: Temple) {
    if (!userId) {
      setNotice('Sign in to save this place to your Tirtha Passport.');
      return;
    }

    const placeId = tirthaPlaceId(temple);
    const alreadySaved = saves.some((save) => save.place_id === placeId);
    setSavingPlace(placeId);
    setNotice('');
    try {
      if (alreadySaved) {
        const { error } = await supabase.from('tirtha_saves').delete().eq('user_id', userId).eq('place_id', placeId);
        if (error) throw error;
        setSaves((current) => current.filter((save) => save.place_id !== placeId));
        setNotice('Removed from saved places.');
      } else {
        await ensurePlace(temple);
        const { error } = await supabase.from('tirtha_saves').upsert({ user_id: userId, place_id: placeId }, { onConflict: 'user_id,place_id' });
        if (error) throw error;
        await refreshPassport(userId);
        setNotice('Saved to your Tirtha Passport.');
      }
    } catch (error) {
      setNotice(safeErrorMessage(error));
    } finally {
      setSavingPlace(null);
    }
  }

  async function submitCheckIn() {
    if (!checkInTemple || !userId) {
      setNotice('Sign in to save a Tirtha visit.');
      return;
    }

    setSubmittingCheckIn(true);
    setNotice('');
    try {
      const placeId = await ensurePlace(checkInTemple);
      const { error } = await supabase.from('tirtha_checkins').insert({
        user_id: userId,
        place_id: placeId,
        privacy: checkInPrivacy,
        darshan_mood: checkInMood,
        intention: intention.trim() || null,
        reflection: reflection.trim() || null,
        companions: companions.trim() || null,
        pradakshina_count: pradakshinaCount,
      });
      if (error) throw error;

      await supabase.from('tirtha_saves').upsert({ user_id: userId, place_id: placeId }, { onConflict: 'user_id,place_id' });
      await refreshPassport(userId);
      setCheckInTemple(null);
      setIntention('');
      setReflection('');
      setCompanions('');
      setPradakshinaCount(0);
      setNotice('Visit saved to your Tirtha Passport.');
    } catch (error) {
      setNotice(safeErrorMessage(error));
    } finally {
      setSubmittingCheckIn(false);
    }
  }

  async function shareVisit(temple: Temple, mood?: string | null) {
    const text = buildTirthaShareText(temple, mood);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Tirtha visit: ${temple.name}`, text });
      } else {
        await navigator.clipboard?.writeText(text);
        setNotice('Share text copied.');
      }
    } catch {
      // User cancelled native share.
    }
  }

  const seasonalCue = useMemo(() => getSeasonalTirthaCue(tradition), [tradition]);
  const savedIds = useMemo(() => new Set(saves.map((save) => save.place_id)), [saves]);
  const visitedIds = useMemo(() => new Set(visits.map((visit) => visit.place_id)), [visits]);

  const filtered = useMemo(() => temples.filter((temple) => {
    const placeId = tirthaPlaceId(temple);
    if (smartFilter === 'open') return isOpen(temple) === true;
    return templeMatchesSmartFilter(temple, smartFilter, savedIds.has(placeId), visitedIds.has(placeId));
  }), [smartFilter, savedIds, temples, visitedIds]);

  const passport = useMemo(() => {
    const uniqueVisited = new Set(visits.map((visit) => visit.place_id));
    const recentVisit = visits[0];
    const nearbySaved = temples.filter((temple) => savedIds.has(tirthaPlaceId(temple))).length;
    return {
      saved: saves.length,
      visited: uniqueVisited.size,
      nearbySaved,
      recentVisit,
    };
  }, [saves.length, savedIds, temples, visits]);

  const activeCityLabel = cityInput.trim() || liveCity || (locationAsked ? 'your area' : 'near you');

  return (
    <div className="relative -mx-3 min-h-screen overflow-hidden bg-[var(--divine-bg)] px-3 pb-32 pt-2 sm:-mx-4 sm:px-4">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-20 right-[-5rem] h-72 w-72 rounded-full bg-[rgba(200,146,74,0.10)] blur-3xl" />
        <div className="absolute left-[-7rem] top-72 h-80 w-80 rounded-full bg-[rgba(133,79,11,0.08)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(200,146,74,0.18)] bg-[var(--surface-raised)]"
          >
            <ChevronLeft size={18} className="text-[color:var(--brand-primary)]" />
          </button>
          <span className="rounded-full border border-[rgba(200,146,74,0.16)] bg-[var(--surface-raised)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
            Tirtha companion
          </span>
        </div>

        <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(200,146,74,0.16)] bg-[var(--surface-raised)] px-5 py-6 shadow-card">
          <div className="absolute right-4 top-4 opacity-10">
            <Compass size={92} />
          </div>
          <div className="relative space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.20em] text-[color:var(--brand-primary)]">
                <MapPin size={12} /> {activeCityLabel}
              </p>
              <h1 className="font-serif text-[2.35rem] leading-[0.98] text-[color:var(--text-cream)]">
                Sacred places for a meaningful visit
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--text-muted)]">
                Discover, prepare, check in privately, and remember the places that become part of your journey.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Saved', value: passport.saved },
                { label: 'Visited', value: passport.visited },
                { label: 'Nearby', value: filtered.length },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.25rem] border border-[rgba(200,146,74,0.14)] bg-white/[0.04] px-3 py-3 text-center">
                  <p className="type-metric">{item.value}</p>
                  <p className="type-card-label mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={useMyLocation}
                disabled={loading || locLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-3 text-sm font-medium text-[#1c1c1a] disabled:opacity-60"
              >
                <Navigation size={15} /> Use my location
              </button>
              <button
                onClick={() => setSmartFilter('saved')}
                className="flex items-center justify-center rounded-full border border-[rgba(200,146,74,0.18)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[color:var(--text-muted)]"
              >
                Passport
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-[rgba(200,146,74,0.16)] bg-[var(--surface-raised)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(200,146,74,0.12)] text-[color:var(--brand-primary)]">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[color:var(--text-cream)]">{seasonalCue.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--text-muted)]">{seasonalCue.description}</p>
              <button
                onClick={() => setSmartFilter(seasonalCue.filterHint)}
                className="mt-3 rounded-full border border-[rgba(200,146,74,0.18)] px-3 py-1.5 text-[11px] font-medium text-[color:var(--brand-primary)]"
              >
                Show relevant places
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-dim)]" />
              <input
                type="text"
                placeholder={liveCity ? `${liveCity} or another city` : 'Search city, e.g. Bedford, UK'}
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && searchCity()}
                className="surface-input py-3 pl-9 pr-4 text-sm outline-none"
              />
            </div>
            <button
              onClick={searchCity}
              disabled={loading}
              className="rounded-[1.05rem] bg-[var(--brand-primary)] px-4 py-3 text-sm font-medium text-[#1c1c1a] disabled:opacity-60"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SMART_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSmartFilter(filter.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  smartFilter === filter.id ? 'text-[#1c1c1a]' : 'text-[color:var(--text-muted)]'
                }`}
                style={{
                  background: smartFilter === filter.id ? 'var(--brand-primary)' : 'var(--surface-raised)',
                  borderColor: 'rgba(200,146,74,0.16)',
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="shrink-0 type-card-label">Radius</span>
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { setRadius(option.value); loadTemples(center[0], center[1], option.value); }}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  radius === option.value ? 'text-[#1c1c1a]' : 'text-[color:var(--text-dim)]'
                }`}
                style={{
                  background: radius === option.value ? 'var(--brand-primary)' : 'var(--surface-raised)',
                  borderColor: 'rgba(200,146,74,0.16)',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {notice && (
          <div className="rounded-[1.1rem] border border-[rgba(200,146,74,0.16)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[color:var(--text-muted)]">
            {notice}
          </div>
        )}

        {geoError && (
          <div className="flex items-center gap-2 rounded-[1.1rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <Info size={14} /> {geoError}
          </div>
        )}

        <div className="h-[285px] overflow-hidden rounded-[1.75rem] border border-[rgba(200,146,74,0.16)] shadow-card">
          <TirthaMapComponent temples={filtered} center={center} loading={loading} />
        </div>

        <section className="rounded-[1.7rem] border border-[rgba(200,146,74,0.16)] bg-[var(--surface-raised)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="type-card-label">Tirtha Passport</p>
              <h2 className="type-card-heading">Your sacred visits</h2>
            </div>
            <ShieldCheck size={20} className="text-[color:var(--brand-primary)]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[1.1rem] bg-white/[0.04] p-3">
              <p className="type-metric">{passport.saved}</p>
              <p className="type-card-label">Saved</p>
            </div>
            <div className="rounded-[1.1rem] bg-white/[0.04] p-3">
              <p className="type-metric">{passport.visited}</p>
              <p className="type-card-label">Visited</p>
            </div>
            <div className="rounded-[1.1rem] bg-white/[0.04] p-3">
              <p className="type-metric">{passport.nearbySaved}</p>
              <p className="type-card-label">Nearby saved</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[color:var(--text-muted)]">
            Visits are private by default. Family, Mandali, and public signals will only activate when explicitly selected.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="type-card-heading">Sacred journey cards</h2>
            <span className="type-micro">{loading ? 'Searching…' : `${filtered.length} places`}</span>
          </div>

          {searched && filtered.length === 0 && (
            <div className="rounded-[1.6rem] border border-[rgba(200,146,74,0.16)] bg-[var(--surface-raised)] p-5 text-sm text-[color:var(--text-muted)]">
              No places found for this filter. Try a larger radius or clear the smart chip.
            </div>
          )}

          {filtered.slice(0, API.OVERPASS.MAX_RESULTS).map((temple, index) => {
            const placeId = tirthaPlaceId(temple);
            const saved = savedIds.has(placeId);
            const visited = visitedIds.has(placeId);
            const open = isOpen(temple);
            const meta = getTraditionMeta(temple.tradition);
            const distance = getDistanceLabel(center, temple);
            const latestVisit = visits.find((visit) => visit.place_id === placeId);

            return (
              <motion.article
                key={placeId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36, delay: Math.min(index * 0.035, 0.18), ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-[1.75rem] border border-[rgba(200,146,74,0.16)] bg-[var(--surface-raised)] shadow-card"
              >
                <button
                  onClick={() => setSelected(temple)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-[rgba(200,146,74,0.12)] text-xl">
                      {meta.mapPinEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-[rgba(200,146,74,0.16)] bg-[var(--chip-fill)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--brand-primary)]">
                          {meta.badgeLabel}
                        </span>
                        {open !== null && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${open ? 'bg-green-500/12 text-green-400' : 'bg-red-500/12 text-red-300'}`}>
                            {open ? 'Open now' : 'May be closed'}
                          </span>
                        )}
                        {visited && <span className="rounded-full bg-[rgba(200,146,74,0.13)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--brand-primary)]">Visited</span>}
                      </div>
                      <h3 className="type-card-heading leading-tight">{temple.name}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-[color:var(--text-muted)]">
                        {distance} mi {temple.address ? `· ${temple.address}` : `· ${meta.visitRhythm.label}`}
                      </p>
                      {latestVisit?.darshan_mood && (
                        <p className="mt-1 text-[11px] text-[color:var(--brand-primary)]">
                          Last visit: {String(latestVisit.darshan_mood).replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                <div className="grid grid-cols-4 border-t border-[rgba(200,146,74,0.10)]">
                  <button onClick={() => toggleSave(temple)} disabled={savingPlace === placeId} className="flex flex-col items-center gap-1 px-2 py-3 text-[10px] text-[color:var(--text-muted)]">
                    <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-[color:var(--brand-primary)]' : ''} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={() => setCheckInTemple(temple)} className="flex flex-col items-center gap-1 px-2 py-3 text-[10px] text-[color:var(--text-muted)]">
                    <CheckCircle2 size={15} />
                    I visited
                  </button>
                  <a href={`https://maps.google.com/?q=${temple.lat},${temple.lon}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 px-2 py-3 text-[10px] text-[color:var(--text-muted)]">
                    <Navigation size={15} />
                    Route
                  </a>
                  <button onClick={() => shareVisit(temple, latestVisit?.darshan_mood)} className="flex flex-col items-center gap-1 px-2 py-3 text-[10px] text-[color:var(--text-muted)]">
                    <Share2 size={15} />
                    Share
                  </button>
                </div>
              </motion.article>
            );
          })}
        </section>
      </div>

      <AnimatePresence>
        {selected && (
          <PlaceDetailSheet
            temple={selected}
            center={center}
            saved={savedIds.has(tirthaPlaceId(selected))}
            visited={visitedIds.has(tirthaPlaceId(selected))}
            onClose={() => setSelected(null)}
            onSave={() => toggleSave(selected)}
            onCheckIn={() => setCheckInTemple(selected)}
            onShare={() => shareVisit(selected, visits.find((visit) => visit.place_id === tirthaPlaceId(selected))?.darshan_mood)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkInTemple && (
          <motion.div className="fixed inset-0 z-[9050] flex items-end bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-[rgba(200,146,74,0.16)] bg-[var(--surface-base)] p-5 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]"
            >
              <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="type-card-label">Sacred check-in</p>
                    <h2 className="type-card-heading mt-1">{checkInTemple.name}</h2>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">Private by default. Share only when you choose.</p>
                  </div>
                  <button onClick={() => setCheckInTemple(null)} className="rounded-full border border-[rgba(200,146,74,0.16)] p-2">
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-muted)]">What did you receive today?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TIRTHA_MOODS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => setCheckInMood(mood.id)}
                        className={`rounded-[1.2rem] border px-3 py-3 text-left ${checkInMood === mood.id ? 'text-[#1c1c1a]' : 'text-[color:var(--text-muted)]'}`}
                        style={{
                          background: checkInMood === mood.id ? 'var(--brand-primary)' : 'var(--surface-raised)',
                          borderColor: 'rgba(200,146,74,0.16)',
                        }}
                      >
                        <span className="text-sm font-medium">{mood.label}</span>
                        <span className="mt-1 block text-[10px] opacity-75">{mood.prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-muted)]">Privacy</p>
                  <div className="space-y-2">
                    {TIRTHA_PRIVACY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setCheckInPrivacy(option.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-[1.15rem] border border-[rgba(200,146,74,0.14)] bg-[var(--surface-raised)] px-3 py-3 text-left"
                      >
                        <span>
                          <span className="block text-sm font-medium text-[color:var(--text-cream)]">{option.label}</span>
                          <span className="block text-[11px] text-[color:var(--text-muted)]">{option.description}</span>
                        </span>
                        <span className={`h-3 w-3 rounded-full ${checkInPrivacy === option.id ? 'bg-[var(--brand-primary)]' : 'bg-white/20'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs text-[color:var(--text-muted)]">Pradakshina / rounds</span>
                    <input type="number" min={0} value={pradakshinaCount} onChange={(event) => setPradakshinaCount(Math.max(0, Number(event.target.value) || 0))} className="surface-input px-3 py-3 text-sm" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-[color:var(--text-muted)]">With family / friends</span>
                    <input value={companions} onChange={(event) => setCompanions(event.target.value)} placeholder="Optional names" className="surface-input px-3 py-3 text-sm" />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs text-[color:var(--text-muted)]">Prayer intention</span>
                  <input value={intention} onChange={(event) => setIntention(event.target.value)} placeholder="What did you carry into this visit?" className="surface-input px-3 py-3 text-sm" />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[color:var(--text-muted)]">Darshan journal</span>
                  <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="A private note for your Tirtha Passport." className="surface-input min-h-[96px] px-3 py-3 text-sm" />
                </label>

                <div className="rounded-[1.2rem] border border-[rgba(200,146,74,0.14)] bg-[var(--surface-raised)] p-3 text-xs text-[color:var(--text-muted)]">
                  <Camera size={14} className="mb-1 text-[color:var(--brand-primary)]" />
                  Photo memories are planned for the next media-storage pass. This check-in stores the visit, mood, privacy, and journal now.
                </div>

                <button
                  onClick={submitCheckIn}
                  disabled={submittingCheckIn}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-medium text-[#1c1c1a] disabled:opacity-60"
                >
                  <CheckCircle2 size={16} /> {submittingCheckIn ? 'Saving visit…' : 'Save to Tirtha Passport'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlaceDetailSheet({
  temple,
  center,
  saved,
  visited,
  onClose,
  onSave,
  onCheckIn,
  onShare,
}: {
  temple: Temple;
  center: [number, number];
  saved: boolean;
  visited: boolean;
  onClose: () => void;
  onSave: () => void;
  onCheckIn: () => void;
  onShare: () => void;
}) {
  const meta = getTraditionMeta(temple.tradition);
  const prep = getVisitPreparation(temple);
  const open = isOpen(temple);

  return (
    <motion.div className="fixed inset-0 z-[9040] flex items-end bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        initial={{ y: 44 }}
        animate={{ y: 0 }}
        exit={{ y: 44 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-[rgba(200,146,74,0.18)] bg-[var(--surface-base)] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]"
      >
        <div className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-t-[2rem] bg-[var(--surface-raised)] px-5 pb-6 pt-5">
            <div className="absolute right-4 top-4 text-8xl opacity-[0.06]">{meta.mapPinEmoji}</div>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full border border-[rgba(200,146,74,0.16)] bg-[var(--chip-fill)] px-2.5 py-1 text-[10px] font-medium text-[color:var(--brand-primary)]">
                  {meta.badgeLabel}
                </span>
                <h2 className="mt-3 font-serif text-[2rem] leading-none text-[color:var(--text-cream)]">{temple.name}</h2>
                <p className="mt-2 text-sm text-[color:var(--text-muted)]">
                  {getDistanceLabel(center, temple)} mi away {temple.address ? `· ${temple.address}` : ''}
                </p>
              </div>
              <button onClick={onClose} className="rounded-full border border-[rgba(200,146,74,0.16)] bg-[var(--surface-base)] p-2">
                <X size={16} />
              </button>
            </div>

            <div className="relative mt-5 grid grid-cols-4 gap-2">
              <button onClick={onSave} className="rounded-[1.15rem] border border-[rgba(200,146,74,0.14)] bg-white/[0.04] px-2 py-3 text-center text-[10px] text-[color:var(--text-muted)]">
                <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} className="mx-auto mb-1 text-[color:var(--brand-primary)]" /> {saved ? 'Saved' : 'Save'}
              </button>
              <button onClick={onCheckIn} className="rounded-[1.15rem] border border-[rgba(200,146,74,0.14)] bg-white/[0.04] px-2 py-3 text-center text-[10px] text-[color:var(--text-muted)]">
                <CheckCircle2 size={16} className="mx-auto mb-1 text-[color:var(--brand-primary)]" /> {visited ? 'Visited' : 'I visited'}
              </button>
              <a href={`https://maps.google.com/?q=${temple.lat},${temple.lon}`} target="_blank" rel="noreferrer" className="rounded-[1.15rem] border border-[rgba(200,146,74,0.14)] bg-white/[0.04] px-2 py-3 text-center text-[10px] text-[color:var(--text-muted)]">
                <Navigation size={16} className="mx-auto mb-1 text-[color:var(--brand-primary)]" /> Route
              </a>
              <button onClick={onShare} className="rounded-[1.15rem] border border-[rgba(200,146,74,0.14)] bg-white/[0.04] px-2 py-3 text-center text-[10px] text-[color:var(--text-muted)]">
                <Share2 size={16} className="mx-auto mb-1 text-[color:var(--brand-primary)]" /> Share
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <section className="rounded-[1.45rem] border border-[rgba(200,146,74,0.14)] bg-[var(--surface-raised)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock size={15} className="text-[color:var(--brand-primary)]" />
                <h3 className="text-sm font-medium text-[color:var(--text-cream)]">Visit rhythm</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {prep.rhythm.map((item) => (
                  <span key={item} className="rounded-full border border-[rgba(200,146,74,0.16)] px-2.5 py-1 text-xs text-[color:var(--brand-primary)]">{item}</span>
                ))}
                {open !== null && (
                  <span className={`rounded-full px-2.5 py-1 text-xs ${open ? 'bg-green-500/12 text-green-400' : 'bg-red-500/12 text-red-300'}`}>
                    {open ? 'Likely open now' : 'May be closed now'}
                  </span>
                )}
              </div>
              {temple.opening && <p className="mt-3 text-xs text-[color:var(--text-muted)]">{temple.opening}</p>}
            </section>

            <section className="rounded-[1.45rem] border border-[rgba(200,146,74,0.14)] bg-[var(--surface-raised)] p-4">
              <h3 className="text-sm font-medium text-[color:var(--text-cream)]">{prep.title}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <GuidanceList title="Etiquette" items={prep.etiquette} />
                <GuidanceList title="Offerings / practice" items={prep.offerings} />
                <GuidanceList title="Practical" items={prep.practical} />
                <GuidanceList title="Seva layer" items={[prep.seva, prep.photoPolicy]} />
              </div>
            </section>

            <section className="rounded-[1.45rem] border border-[rgba(200,146,74,0.14)] bg-[var(--surface-raised)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={15} className="text-[color:var(--brand-primary)]" />
                <h3 className="text-sm font-medium text-[color:var(--text-cream)]">Community signal</h3>
              </div>
              <p className="text-xs leading-relaxed text-[color:var(--text-muted)]">
                Verified community notes, family visits, accessibility, and practical updates will appear here as Shoonaya members save and review this place.
              </p>
              <button className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(200,146,74,0.16)] px-3 py-1.5 text-xs text-[color:var(--brand-primary)]">
                <Send size={12} /> Suggest an update
              </button>
            </section>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GuidanceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--brand-primary)]">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-[color:var(--text-muted)]">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
