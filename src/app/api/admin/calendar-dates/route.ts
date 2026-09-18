import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_COOKIE, verifyAdminCookieAuth, verifyAdminToken } from '@/lib/admin-auth';
import { attachMaterialisationBatches } from '@/lib/calendar/occurrence-reader';
import { assessAdminDate, isValidHoldReason, type AdminDateRow } from '@/lib/calendar/admin-date-register';
import { fixtureCaseId } from '@/lib/calendar/admin-date-register';
import { validateDateCandidate } from '@/lib/calendar/fixture-correction';
import type { Database } from '@/types/database.generated';

const PAGE_SIZE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGISTER_SELECT = 'id, definition_id, year, date, occurrence_date, calendar_profile, spiritual_tradition, variant_key, computed_latitude, computed_longitude, computed_timezone, publication_status, review_status, verification_status, audit_status, final_date_source, calculated_by, source_provenance, source_refs, rule_version, astronomy_version, day_boundary_version, manual_date_override, locked_for_regeneration, reviewed_at, review_notes, verification_note, batch_id, observance_definitions!inner(slug, display_name, tradition, kind, active)';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient<Database>(url, key) : null;
}

function readYear(value: string | null): number | null {
  if (!value || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= 2000 && year <= 2100 ? year : null;
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const client = adminClient();
  if (!client) return NextResponse.json({ error: 'Calendar database is not configured' }, { status: 503 });

  const suppliedYear = request.nextUrl.searchParams.get('year');
  const parsedYear = readYear(suppliedYear);
  if (suppliedYear && parsedYear === null) return NextResponse.json({ error: 'Year must be 2000–2100.' }, { status: 400 });
  const year = parsedYear ?? new Date().getUTCFullYear();
  const rawPage = Number(request.nextUrl.searchParams.get('page') ?? '0');
  if (!Number.isInteger(rawPage) || rawPage < 0 || rawPage > 500) return NextResponse.json({ error: 'Invalid register page.' }, { status: 400 });
  const page = rawPage;
  const view = request.nextUrl.searchParams.get('view') ?? 'verified';
  if (!['verified', 'held', 'all'].includes(view)) return NextResponse.json({ error: 'Invalid register view' }, { status: 400 });
  const slug = request.nextUrl.searchParams.get('slug')?.trim() ?? '';
  if (slug && !/^[a-z0-9-]{1,100}$/.test(slug)) return NextResponse.json({ error: 'Invalid observance slug' }, { status: 400 });

  let query = client.from('observance_occurrences')
    .select(DATE_REGISTER_SELECT, { count: 'exact' })
    .eq('year', year)
    .order('date', { ascending: true })
    .order('id', { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (view === 'held') query = query.eq('publication_status', 'withheld_disputed');
  if (view === 'verified') query = query.eq('publication_status', 'published').eq('review_status', 'reviewed').eq('verification_status', 'verified').eq('audit_status', 'completed');
  if (slug) query = query.eq('observance_definitions.slug', slug);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const enriched = await attachMaterialisationBatches((data ?? []) as AdminDateRow[]);
    return NextResponse.json({
      rows: enriched.map(assessAdminDate),
      year,
      view,
      slug,
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      notice: 'This is the canonical stored-date register. Core publication gates are shown, but exact Native visibility also depends on the user’s calendar profile, tradition and location. A Hold affects future backend reads; cached or offline Native views may remain stale until refreshed, and already-sent notifications cannot be recalled.',
    });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Could not assess publication gates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const client = adminClient();
  if (!client) return NextResponse.json({ error: 'Calendar database is not configured' }, { status: 503 });

  const body = await request.json().catch(() => null);
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value ?? '';
  const token = await verifyAdminToken(cookie);
  if (!token?.username) return NextResponse.json({ error: 'Named admin reviewer required' }, { status: 403 });

  if (body?.action === 'create_candidate') {
    const occurrenceId = body?.occurrenceId;
    if (typeof occurrenceId !== 'string' || !UUID.test(occurrenceId)) {
      return NextResponse.json({ error: 'Candidate requires an occurrence UUID.' }, { status: 400 });
    }
    const candidate = {
      expected: { civilDate: body?.date },
      source: { tier: body?.tier, ref: body?.sourceUrl, citation: body?.citation },
      reasoning: body?.reason,
    };
    const validationError = validateDateCandidate(candidate);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { data: occurrence, error: occurrenceError } = await client.from('observance_occurrences')
      .select('id, year, calendar_profile, spiritual_tradition, variant_key, computed_latitude, computed_longitude, computed_timezone, calculated_by, source_provenance, observance_definitions!inner(slug)')
      .eq('id', occurrenceId)
      .maybeSingle();
    if (occurrenceError) return NextResponse.json({ error: occurrenceError.message }, { status: 500 });
    if (!occurrence) return NextResponse.json({ error: 'Occurrence not found.' }, { status: 404 });
    if (fixtureCaseId(occurrence.source_provenance)) {
      return NextResponse.json({ error: 'This occurrence has a linked fixture. Edit that fixture instead of creating a duplicate.' }, { status: 409 });
    }
    const definition = occurrence.observance_definitions;
    const slug = Array.isArray(definition) ? definition[0]?.slug : definition?.slug;
    if (!slug || occurrence.year < 2000 || occurrence.year > 2100 || !occurrence.calendar_profile ||
      typeof occurrence.computed_latitude !== 'number' || !Number.isFinite(occurrence.computed_latitude) || Math.abs(occurrence.computed_latitude) > 90 ||
      typeof occurrence.computed_longitude !== 'number' || !Number.isFinite(occurrence.computed_longitude) || Math.abs(occurrence.computed_longitude) > 180 || !occurrence.computed_timezone) {
      return NextResponse.json({ error: 'Occurrence lacks complete rule, profile or calculation location; candidate cannot be created safely.' }, { status: 409 });
    }
    try {
      new Intl.DateTimeFormat('en', { timeZone: occurrence.computed_timezone });
    } catch {
      return NextResponse.json({ error: 'Occurrence timezone is not an IANA timezone.' }, { status: 409 });
    }
    const caseId = `admin-date-candidate-${occurrenceId}`;
    const { data: existingCandidate, error: candidateLookupError } = await client.from('golden_fixtures')
      .select('case_id, expected, source, reasoning')
      .eq('case_id', caseId)
      .maybeSingle();
    if (candidateLookupError) return NextResponse.json({ error: candidateLookupError.message }, { status: 500 });
    if (existingCandidate) {
      const expected = existingCandidate.expected;
      const source = existingCandidate.source;
      const sameDate = !!expected && typeof expected === 'object' && !Array.isArray(expected) && expected.civilDate === body.date;
      const sameSource = !!source && typeof source === 'object' && !Array.isArray(source)
        && source.ref === body.sourceUrl.trim() && source.citation === body.citation.trim() && source.tier === body.tier;
      const sameReason = existingCandidate.reasoning === `Proposed correction for occurrence ${occurrenceId}: ${body.reason.trim()}`;
      return sameDate && sameSource && sameReason
        ? NextResponse.json({ ok: true, caseId, alreadyExists: true })
        : NextResponse.json({ error: 'A different candidate already exists for this occurrence. Review its fixture before changing it.' }, { status: 409 });
    }

    const profile = { calendar: occurrence.calendar_profile, tradition: occurrence.spiritual_tradition ?? 'unspecified', ...(occurrence.variant_key ? { variantKey: occurrence.variant_key } : {}) };
    const location = {
      label: `Coordinates ${occurrence.computed_latitude.toFixed(6)}, ${occurrence.computed_longitude.toFixed(6)}`,
      lat: occurrence.computed_latitude,
      lon: occurrence.computed_longitude,
      tz: occurrence.computed_timezone,
    };
    const { data: created, error: insertError } = await client.from('golden_fixtures')
      .insert({
        case_id: caseId,
        festival_id: slug,
        year: occurrence.year,
        location,
        profile,
        expected: { civilDate: body.date },
        tolerance: { windowMinutes: 0 },
        source: { tier: body.tier, ref: body.sourceUrl.trim(), citation: body.citation.trim(), verifiedBy: 'pending review', verifiedOn: '' },
        reasoning: `Proposed correction for occurrence ${occurrenceId}: ${body.reason.trim()}`,
        approved: false,
        review_notes: `Candidate entered by ${token.username}; independent date, source and profile review required.`,
      })
      .select('case_id')
      .maybeSingle();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: insertError.code === '23505' ? 409 : 500 });
    if (!created) return NextResponse.json({ error: 'Candidate insert returned no row.' }, { status: 500 });
    return NextResponse.json({ ok: true, caseId: created.case_id, alreadyExists: false });
  }

  if (body?.action !== 'hold' || typeof body?.id !== 'string' || !UUID.test(body.id) || !isValidHoldReason(body.reason)) {
    return NextResponse.json({ error: 'Hold requires an occurrence UUID and a reason of 12–1000 characters.' }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await client.from('observance_occurrences')
    .select('id, publication_status, review_notes, updated_at')
    .eq('id', body.id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 });
  if (existing.publication_status !== 'published') return NextResponse.json({ error: 'Occurrence is already held; refresh the register.' }, { status: 409 });

  const now = new Date().toISOString();
  const note = `Held by ${token.username} at ${now}: ${body.reason.trim()}`;
  const { data: held, error: updateError } = await client.from('observance_occurrences')
    .update({
      updated_at: now,
      publication_status: 'withheld_disputed',
      locked_for_regeneration: true,
      review_status: 'needs_review',
      verification_status: 'manual_review',
      review_notes: [existing.review_notes, note].filter(Boolean).join('\n'),
    })
    .eq('id', body.id)
    .eq('publication_status', 'published')
    .eq('updated_at', existing.updated_at)
    .select('id, publication_status, locked_for_regeneration')
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!held) return NextResponse.json({ error: 'Occurrence changed during hold; refresh the register.' }, { status: 409 });
  return NextResponse.json({ ok: true, held, reviewer: token.username });
}
