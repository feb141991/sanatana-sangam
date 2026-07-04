import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

type TirthaPlaceInsert = {
  id: string;
  source: string;
  source_id: string;
  name: string;
  tradition: string;
  lat: number;
  lon: number;
  address: string | null;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
  deity: string | null;
  sampradaya: string | null;
  source_confidence: string;
  created_by: string;
  updated_at: string;
};

function createTirthaAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function parseString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * POST /api/tirtha/place
 * Upserts a place into tirtha_places using the service role (bypasses RLS).
 * Requires the user to be authenticated — we verify via the user Supabase client
 * before writing with the admin client.
 *
 * Body: { id, source, source_id, name, tradition, lat, lon, address?,
 *         website?, phone?, opening_hours?, deity?, sampradaya? }
 * Returns: { place_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getApiUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const id = parseString(payload.id);
    const source = parseString(payload.source);
    const sourceId = parseString(payload.source_id) ?? id;
    const name = parseString(payload.name);
    const tradition = parseString(payload.tradition);
    const lat = parseNumber(payload.lat);
    const lon = parseNumber(payload.lon);

    if (!id || !source || !sourceId || !name || !tradition || lat == null || lon == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const row: TirthaPlaceInsert = {
      id,
      source,
      source_id: sourceId,
      name,
      tradition,
      lat,
      lon,
      address: parseString(payload.address),
      website: parseString(payload.website),
      phone: parseString(payload.phone),
      opening_hours: parseString(payload.opening_hours),
      deity: parseString(payload.deity),
      sampradaya: parseString(payload.sampradaya),
      source_confidence: 'community_import',
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const admin = createTirthaAdminClient();
    const { error } = await admin
      .from('tirtha_places')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('[tirtha/place] upsert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ place_id: id });
  } catch (err) {
    console.error('[tirtha/place] unexpected error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
