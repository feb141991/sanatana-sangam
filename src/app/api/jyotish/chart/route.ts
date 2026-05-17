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
import { generateAstroChart, BirthInput } from '@/lib/jyotish/astro-engine';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  } = body as Record<string, string | number | boolean | undefined>;

  if (!date_of_birth || birth_lat === undefined || birth_lng === undefined || !birth_timezone) {
    return NextResponse.json(
      { error: 'Required: date_of_birth, birth_lat, birth_lng, birth_timezone' },
      { status: 400 }
    );
  }

  // ── Resolve authenticated user ────────────────────────────────────────────────
  let owner_id: string | null = null;
  try {
    const cookieStore = await cookies();
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* server component - ignore */ }
          },
        },
      }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    owner_id = user?.id ?? null;
  } catch { /* unauthenticated */ }

  // Guest must supply session_token
  if (!owner_id && !session_token) {
    return NextResponse.json(
      { error: 'Provide session_token for guest chart, or authenticate' },
      { status: 401 }
    );
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ── If primary, unset existing primary for this user ──────────────────────────
  const db = getAnonClient();
  if (is_primary && owner_id) {
    await db
      .from('birth_profiles')
      .update({ is_primary: false })
      .eq('owner_id', owner_id)
      .eq('is_primary', true);
  }

  // ── Current dasha quick-access ────────────────────────────────────────────────
  const currentDasha     = chart.dasha.current;
  const currentAntarDasha = chart.dasha.currentAntardasha;
  const nowStr = new Date().toISOString().split('T')[0];
  const nextDasha = chart.dasha.timeline.find(
    (d) => d.startDate > (currentDasha?.endDate ?? nowStr)
  );

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
    // Computed columns
    rashi:          chart.planets['Chandra']?.rashiName ?? null,
    sun_rashi:      chart.planets['Surya']?.rashiName ?? null,
    nakshatra:      chart.nakshatra?.name ?? null,
    nakshatra_pada: chart.nakshatra?.pada ?? null,
    nakshatra_lord: chart.nakshatra?.lord ?? null,
    lagna:          chart.lagna?.rashiName ?? null,
    lagna_deg:      chart.lagna?.degreeInRashi ?? null,
    ayanamsa:       chart.ayanamsa ?? null,
    chart_data:     chart,
    // Dasha quick-access
    current_dasha_planet:   currentDasha?.planet ?? null,
    current_dasha_end_date: currentDasha?.endDate ?? null,
    next_dasha_planet:      nextDasha?.planet ?? null,
    is_primary:             Boolean(is_primary),
    is_public:              false,
  };

  const { data, error } = await db
    .from('birth_profiles')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[chart/route] DB insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data, chart }, { status: 201 });
}
