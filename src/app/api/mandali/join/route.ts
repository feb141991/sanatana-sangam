import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { assertNotBanned } from '@/lib/api-guards';
import { getApiUser } from '@/lib/api-auth';

type ProfileMandaliUpdateQuery = {
  update: (value: { mandali_id: string; city?: string; country?: string; latitude?: number; longitude?: number }) => {
    eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>;
  };
};

function optionalTrim(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalCoordinate(value: unknown, min: number, max: number) {
  if (value == null) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) return undefined;
  return numeric;
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const mandali_id = json.mandali_id;
    if (!mandali_id || typeof mandali_id !== 'string') {
      return NextResponse.json({ error: 'mandali_id required' }, { status: 400 });
    }

    const { user, error: authError } = await getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: authError.message || 'Unauthenticated' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const banned = await assertNotBanned(adminClient, user.id);
    if (banned) return banned;

    const profilesTable = adminClient.from('profiles') as unknown as ProfileMandaliUpdateQuery;
    const update: { mandali_id: string; city?: string; country?: string; latitude?: number; longitude?: number } = {
      mandali_id,
    };

    const city = optionalTrim(json.city);
    const country = optionalTrim(json.country);
    const latitude = optionalCoordinate(json.latitude, -90, 90);
    const longitude = optionalCoordinate(json.longitude, -180, 180);

    if (city) update.city = city;
    if (country) update.country = country;
    if (latitude != null) update.latitude = latitude;
    if (longitude != null) update.longitude = longitude;
    
    const { error } = await profilesTable
      .update(update)
      .eq('id', user.id);
    if (error) throw new Error(error.message);
    
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
