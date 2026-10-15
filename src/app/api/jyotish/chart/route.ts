/**
 * POST /api/jyotish/chart
 * Generates an AstroChart from birth details and saves it to birth_profiles.
 *
 * Body:
 * {
 *   label?:       string           // "Me", "Priya (Wife)", etc.
 *   full_name?:   string
 *   relation?:    'self'|'spouse'|'child'|'parent'|'sibling'|'friend'|'other'
 *   date_of_birth: string          // "YYYY-MM-DD"
 *   time_of_birth?: string         // "HH:MM" 24h, omit if unknown
 *   birth_city?:  string
 *   birth_country?: string
 *   birth_lat:    number
 *   birth_lng:    number
 *   birth_timezone: string         // IANA e.g. "Asia/Kolkata"
 *   is_primary?:  boolean
 *   session_token?: string         // for guest users
 * }
 *
 * Returns: the created birth_profile row (with chart_data).
 *
 * Auth:
 *   - If the user is authenticated (Supabase session cookie), owner_id is set.
 *   - If not authenticated, session_token must be provided (guest flow).
 *   - Guests: chart is saved without owner_id; claimed on signup via session_token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAstroChart, deriveDenormalizedBirthProfileFields, BirthInput } from '@/lib/jyotish/astro-engine';
import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── Required fields ──────────────────────────────────────────────────────────
  const {
    label         = 'My Chart',
    full_name,
    relation      = 'self',
    date_of_birth,
    time_of_birth,
    birth_city,
    birth_country,
    birth_lat,
    birth_lng,
    birth_timezone,
    is_primary    = false,
    session_token,
    idempotency_key,
  } = body as Record<string, string | number | boolean | undefined>;

  if (!date_of_birth || birth_lat === undefined || birth_lng === undefined || !birth_timezone) {
    return NextResponse.json(
      { error: 'Required: date_of_birth, birth_lat, birth_lng, birth_timezone' },
      { status: 400 }
    );
  }

  // ── Resolve authenticated user ────────────────────────────────────────────────
  let owner_id: string | null = null;
  const { user } = await getApiUser(req);
  if (user) {
    owner_id = user.id;
  }

  // Guest must supply session_token
  if (!owner_id && !session_token) {
    return NextResponse.json(
      { error: 'Provide session_token for guest chart, or authenticate' },
      { status: 401 }
    );
  }

  if (idempotency_key !== undefined &&
      (typeof idempotency_key !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotency_key))) {
    return NextResponse.json({ error: 'idempotency_key must be a UUID v4' }, { status: 400 });
  }

  const db = getAnonClient();
  const findExistingRequest = async () => {
    if (!idempotency_key) return { data: null, error: null };
    let query = db.from('birth_profiles').select('*').eq('idempotency_key', idempotency_key);
    query = owner_id
      ? query.eq('owner_id', owner_id)
      : query.is('owner_id', null).eq('session_token', session_token);
    return query.maybeSingle();
  };

  if (idempotency_key) {
    const existing = await findExistingRequest();
    if (existing.error) {
      console.error('[chart/route] idempotency lookup failed:', existing.error.code);
      return NextResponse.json({ error: 'Could not verify chart submission status' }, { status: 503 });
    }
    if (existing.data) {
      return NextResponse.json({ profile: existing.data, chart: existing.data.chart_data, replayed: true }, { status: 200 });
    }
  }

  // ── Compute chart ─────────────────────────────────────────────────────────────
  let chart;
  try {
    const input: BirthInput = {
      date:         String(date_of_birth),
      time:         time_of_birth ? String(time_of_birth) : '12:00',
      lat:          Number(birth_lat),
      lng:          Number(birth_lng),
      timezone:     String(birth_timezone),
      timeUnknown:  !time_of_birth,
    };
    chart = generateAstroChart(input);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chart calculation failed';
    if (err instanceof RangeError) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ── If primary, unset existing primary for this user ──────────────────────────
  if (is_primary && owner_id) {
    await db
      .from('birth_profiles')
      .update({ is_primary: false })
      .eq('owner_id', owner_id)
      .eq('is_primary', true);
  }

  // ── Derive canonical denormalized summary fields ───────────────────────────
  const summary = deriveDenormalizedBirthProfileFields(chart);

  // ── Save to birth_profiles ────────────────────────────────────────────────────
  const row: Record<string, unknown> = {
    owner_id,
    session_token: owner_id ? null : session_token,
    label,
    full_name:    full_name ?? null,
    relation,
    date_of_birth,
    time_of_birth:  time_of_birth ?? null,
    birth_city:     birth_city ?? null,
    birth_country:  birth_country ?? null,
    birth_lat:      Number(birth_lat),
    birth_lng:      Number(birth_lng),
    birth_timezone,
    // Pure derived summary columns
    rashi:                  summary.rashi,
    sun_rashi:              summary.sun_rashi,
    nakshatra:              summary.nakshatra,
    nakshatra_pada:         summary.nakshatra_pada,
    nakshatra_lord:         summary.nakshatra_lord,
    lagna:                  summary.lagna,
    lagna_deg:              summary.lagna_deg,
    ayanamsa:               summary.ayanamsa,
    chart_data:             chart,
    current_dasha_planet:   summary.current_dasha_planet,
    current_dasha_end_date: summary.current_dasha_end_date,
    next_dasha_planet:      summary.next_dasha_planet,
    is_primary:             Boolean(is_primary),
    is_public:              false,
  };
  // Sent only when the caller supplied one. A request without a key must not name the column at all, so charts keep
  // saving if this code is ever deployed before the idempotency migration has been applied.
  if (idempotency_key) row.idempotency_key = idempotency_key;

  let { data, error } = await db
    .from('birth_profiles')
    .insert(row)
    .select()
    .single();

  // If primary constraint conflict, retry without primary flag
  if (error?.code === '23505' && String(error.message).includes('one_primary')) {
    row.is_primary = false;
    const retry = await db.from('birth_profiles').insert(row).select().single();
    data  = retry.data;
    error = retry.error;
  }

  if (error?.code === '23505' && idempotency_key) {
    const existing = await findExistingRequest();
    if (existing.data) {
      return NextResponse.json({ profile: existing.data, chart: existing.data.chart_data, replayed: true }, { status: 200 });
    }
  }

  if (error || !data) {
    console.error('[chart/route] DB insert error:', error);
    return NextResponse.json({ error: error?.message ?? 'Chart profile was not persisted' }, { status: 500 });
  }

  return NextResponse.json({ profile: data, chart }, { status: 201 });
}
