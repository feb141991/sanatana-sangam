import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { filterProfileRows, getUserSafetyState } from '@/lib/user-safety';

const RADIUS_KM = 80;
const LAT_DELTA = RADIUS_KM / 111;
const LON_DELTA_MAX = RADIUS_KM / 85;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function distanceBand(distanceKm: number) {
  if (distanceKm < 5) return 'Within 5 km';
  if (distanceKm < 20) return 'Within 20 km';
  if (distanceKm < 50) return 'Within 50 km';
  return 'Within 80 km';
}

type OwnerLocation = { latitude: number | null; longitude: number | null; city: string | null };
type NearbyCandidate = { id: string; username: string; avatar_url: string | null; latitude: number | null; longitude: number | null };
type CityCandidate = Pick<NearbyCandidate, 'id' | 'username' | 'avatar_url'>;

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: owner, error: ownerError }, safety] = await Promise.all([
    admin.from('profiles').select('latitude, longitude, city').eq('id', user.id).single(),
    getUserSafetyState(admin, user.id),
  ]);
  if (ownerError) return NextResponse.json({ seekers: [] });

  const ownerLocation = owner as unknown as OwnerLocation | null;
  const lat = ownerLocation?.latitude;
  const lon = ownerLocation?.longitude;
  if (lat == null || lon == null) {
    if (!ownerLocation?.city) return NextResponse.json({ seekers: [] });
    const { data, error } = await admin
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('city', ownerLocation.city.trim())
      .neq('id', user.id)
      .limit(12);
    if (error) return NextResponse.json({ error: 'Nearby search unavailable.' }, { status: 500 });
    const candidates = (data ?? []) as unknown as CityCandidate[];
    return NextResponse.json({ seekers: filterProfileRows(candidates, safety).map((row) => ({ ...row, distanceLabel: 'Same city' })) });
  }

  const { data, error } = await admin
    .from('profiles')
    .select('id, username, avatar_url, latitude, longitude')
    .gte('latitude', lat - LAT_DELTA)
    .lte('latitude', lat + LAT_DELTA)
    .gte('longitude', lon - LON_DELTA_MAX)
    .lte('longitude', lon + LON_DELTA_MAX)
    .neq('id', user.id)
    .limit(40);
  if (error) return NextResponse.json({ error: 'Nearby search unavailable.' }, { status: 500 });

  const candidates = (data ?? []) as unknown as NearbyCandidate[];
  const safeRows = filterProfileRows(candidates, safety)
    .flatMap((row) => {
      if (row.latitude == null || row.longitude == null) return [];
      const distanceKm = haversineKm(lat, lon, row.latitude, row.longitude);
      if (distanceKm > RADIUS_KM) return [];
      return [{ id: row.id, username: row.username, avatar_url: row.avatar_url, distanceKm }];
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 12)
    .map(({ distanceKm, ...row }) => ({ ...row, distanceLabel: distanceBand(distanceKm) }));

  return NextResponse.json({ seekers: safeRows });
}
