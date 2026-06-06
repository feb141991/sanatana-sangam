/**
 * SeekersNearYou — shows Sanatani seekers in the same area.
 *
 * Discovery priority:
 *  1. If the current user's profile has lat/lon stored, use a bounding-box
 *     query (~80 km radius) and sort by Haversine distance.
 *  2. Fall back to city case-insensitive ILIKE when no coordinates exist.
 *
 * This replaces the original `.eq('city', profile.city)` exact-match which
 * silently returned 0 results for any spelling variation ("New York" ≠ "NYC").
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';

type Profile = {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  tradition?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type NearbyProfile = Profile & { distanceKm?: number };

type Props = {
  userId: string;
  profile: Profile | null;
};

// ── Geo helpers ────────────────────────────────────────────────────────────
const RADIUS_KM = 80;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LAT_DELTA = RADIUS_KM / 111;       // 1° lat ≈ 111 km
const LON_DELTA_MAX = RADIUS_KM / 85;    // conservative — wider than strict

// ─────────────────────────────────────────────────────────────────────────────

export default function SeekersNearYou({ userId, profile }: Props) {
  const [nearby, setNearby] = useState<NearbyProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchNearby() {
      const supabase = createClient();
      setLoading(true);

      const lat = profile?.latitude;
      const lon = profile?.longitude;

      try {
        if (lat != null && lon != null) {
          // ── Strategy 1: bounding-box + Haversine ──────────────────────────
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, tradition, city, latitude, longitude')
            .gte('latitude', lat - LAT_DELTA)
            .lte('latitude', lat + LAT_DELTA)
            .gte('longitude', lon - LON_DELTA_MAX)
            .lte('longitude', lon + LON_DELTA_MAX)
            .neq('id', userId)
            .limit(40);

          if (!error && data) {
            const withDistance: NearbyProfile[] = (data as Profile[])
              .map((p) =>
                p.latitude != null && p.longitude != null
                  ? { ...p, distanceKm: haversineKm(lat, lon, p.latitude, p.longitude) }
                  : { ...p, distanceKm: RADIUS_KM }
              )
              .filter((p) => p.distanceKm! <= RADIUS_KM)
              .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
              .slice(0, 12);

            setNearby(withDistance);
          }
        } else if (profile?.city) {
          // ── Strategy 2: city ILIKE fallback ───────────────────────────────
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, tradition, city')
            .ilike('city', `%${profile.city.trim()}%`)
            .neq('id', userId)
            .limit(12);

          if (!error && data) setNearby(data as NearbyProfile[]);
        }
      } finally {
        setLoading(false);
      }
    }

    if (profile?.latitude != null || profile?.city) {
      fetchNearby();
    }
  }, [profile?.latitude, profile?.longitude, profile?.city, userId]);

  if (!profile?.latitude && !profile?.city) return null;

  return (
    <div
      className="glass-panel rounded-2xl border border-white/10 p-4 mt-6"
      style={{ background: 'var(--brand-primary-soft)' }}
    >
      <h3 className="font-display font-bold text-lg mb-3" style={{ color: 'var(--text-cream)' }}>
        Seekers Near You
      </h3>

      {loading ? (
        <p className="text-sm theme-dim">Looking for nearby seekers…</p>
      ) : nearby.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
          No seekers found nearby yet — as more Zeroists join from your area they&apos;ll appear here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {nearby.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div
                className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-brand-primary to-brand-accent text-xs font-bold flex items-center justify-center"
                style={{ color: 'var(--divine-text)' }}
              >
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt="" fill sizes="32px" className="object-cover" />
                ) : (
                  getInitials(p.full_name || p.username || '?')
                )}
              </div>
              <div>
                <span className="text-sm block" style={{ color: 'var(--brand-ink)' }}>
                  {p.full_name || p.username}
                </span>
                {p.distanceKm != null && (
                  <span className="text-[10px]" style={{ color: 'var(--brand-muted)' }}>
                    {p.distanceKm < 1 ? '< 1 km away' : `${Math.round(p.distanceKm)} km`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
