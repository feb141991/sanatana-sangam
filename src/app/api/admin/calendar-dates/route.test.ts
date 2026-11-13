import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

type DbResult = { data: unknown; error: { message: string } | null; count?: number | null };
const state = vi.hoisted(() => ({
  authError: null as Response | null,
  token: { username: 'calendar-reviewer' } as { username: string } | null,
  results: [] as DbResult[],
  calls: [] as Array<{ kind: string; value: unknown }>,
}));

function query(result: DbResult) {
  const chain = {
    select(value: string) { state.calls.push({ kind: 'returning', value }); return chain; },
    eq(column: string, value: unknown) { state.calls.push({ kind: `eq:${column}`, value }); return chain; },
    order() { return chain; },
    range() { return chain; },
    in() { return chain; },
    maybeSingle: async () => result,
    then(resolve: (value: DbResult) => unknown) { return Promise.resolve(resolve(result)); },
  };
  return chain;
}

vi.mock('@/lib/admin-auth', () => ({
  ADMIN_COOKIE: 'admin_token',
  verifyAdminCookieAuth: async () => state.authError,
  verifyAdminToken: async () => state.token,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      state.calls.push({ kind: 'from', value: table });
      return {
        select: (columns: string) => { state.calls.push({ kind: 'select', value: columns }); return query(state.results.shift() ?? { data: null, error: null }); },
        update: (payload: unknown) => { state.calls.push({ kind: 'update', value: payload }); return query(state.results.shift() ?? { data: null, error: null }); },
        insert: (payload: unknown) => { state.calls.push({ kind: 'insert', value: payload }); return query(state.results.shift() ?? { data: null, error: null }); },
      };
    },
  }),
}));

vi.mock('@/lib/calendar/occurrence-reader', () => ({
  attachMaterialisationBatches: async (rows: unknown[]) => rows,
}));

import { GET, POST } from './route';

function request(url: string, body?: unknown) {
  return new NextRequest(url, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  } : undefined);
}

beforeEach(() => {
  state.authError = null;
  state.token = { username: 'calendar-reviewer' };
  state.results.length = 0;
  state.calls.length = 0;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
});

describe('admin date register route', () => {
  it('rejects unauthenticated reads before touching the database', async () => {
    state.authError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const response = await GET(request('http://localhost/api/admin/calendar-dates'));
    expect(response.status).toBe(401);
    expect(state.calls).toHaveLength(0);
  });

  it('rejects unauthenticated writes and unnamed admin sessions before mutation', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const body = { action: 'hold', id, reason: 'Official source conflict needs review' };
    state.authError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    expect((await POST(request('http://localhost/api/admin/calendar-dates', body))).status).toBe(401);
    state.authError = null;
    state.token = null;
    expect((await POST(request('http://localhost/api/admin/calendar-dates', body))).status).toBe(403);
    expect(state.calls).toHaveLength(0);
  });

  it('rejects invalid filters without querying rows', async () => {
    for (const suffix of ['?year=1999', '?view=unknown', '?slug=Bad Slug', '?page=-1']) {
      const response = await GET(request(`http://localhost/api/admin/calendar-dates${suffix}`));
      expect(response.status).toBe(400);
    }
    expect(state.calls).toHaveLength(0);
  });

  it('returns database faults and an empty register distinctly', async () => {
    state.results.push({ data: null, error: { message: 'database unavailable' } });
    expect((await GET(request('http://localhost/api/admin/calendar-dates?year=2026'))).status).toBe(500);
    state.results.push({ data: [], error: null, count: 0 });
    const response = await GET(request('http://localhost/api/admin/calendar-dates?year=2026'));
    expect(response.status).toBe(200);
    expect((await response.json()).rows).toEqual([]);
  });

  it('rejects malformed holds and already-held rows', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    expect((await POST(request('http://localhost/api/admin/calendar-dates', { action: 'hold', id, reason: 'short' }))).status).toBe(400);
    state.results.push({ data: { id, publication_status: 'withheld_disputed', review_notes: null, updated_at: '2026-09-15T00:00:00Z' }, error: null });
    expect((await POST(request('http://localhost/api/admin/calendar-dates', { action: 'hold', id, reason: 'Official source conflict needs review' }))).status).toBe(409);
    expect(state.calls.some((call) => call.kind === 'update')).toBe(false);
  });

  it('holds one current row, records the named reviewer, and locks regeneration', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const version = '2026-09-15T00:00:00Z';
    state.results.push(
      { data: { id, publication_status: 'published', review_notes: 'Earlier note', updated_at: version }, error: null },
      { data: { id, publication_status: 'withheld_disputed', locked_for_regeneration: true }, error: null },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', { action: 'hold', id, reason: 'Official source conflict needs review' }));
    expect(response.status).toBe(200);
    const payload = state.calls.find((call) => call.kind === 'update')?.value as Record<string, unknown>;
    expect(payload.publication_status).toBe('withheld_disputed');
    expect(payload.locked_for_regeneration).toBe(true);
    expect(payload.review_status).toBe('needs_review');
    expect(payload.review_notes).toContain('Held by calendar-reviewer');
    expect(state.calls).toContainEqual({ kind: 'eq:publication_status', value: 'published' });
    expect(state.calls).toContainEqual({ kind: 'eq:updated_at', value: version });
  });

  it('returns a conflict when the conditional hold updates no row', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    state.results.push(
      { data: { id, publication_status: 'published', review_notes: null, updated_at: '2026-09-15T00:00:00Z' }, error: null },
      { data: null, error: null },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', { action: 'hold', id, reason: 'Official source conflict needs review' }));
    expect(response.status).toBe(409);
  });

  it('reports a database write failure without claiming the hold succeeded', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    state.results.push(
      { data: { id, publication_status: 'published', review_notes: null, updated_at: '2026-09-15T00:00:00Z' }, error: null },
      { data: null, error: { message: 'write failed' } },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', { action: 'hold', id, reason: 'Official source conflict needs review' }));
    expect(response.status).toBe(500);
    expect((await response.json()).ok).toBeUndefined();
  });

  it('rejects an unsourced candidate before reading an occurrence', async () => {
    const response = await POST(request('http://localhost/api/admin/calendar-dates', {
      action: 'create_candidate', occurrenceId: '11111111-1111-4111-8111-111111111111',
      date: '2027-01-15', tier: 1, sourceUrl: 'http://example.com', citation: 'Samvat 558 Gurpurab list 02 Magh', reason: 'A published source puts it on another date.',
    }));
    expect(response.status).toBe(400);
    expect(state.calls).toHaveLength(0);
  });

  it('creates only an unapproved, exact-profile fixture candidate', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const body = {
      action: 'create_candidate', occurrenceId: id, date: '2027-01-15', tier: 1,
      sourceUrl: 'https://sgpc.net/nanakshahi-calendar/', citation: 'Samvat 558 Gurpurab list 02 Magh',
      reason: 'The official poster names this Gregorian date.',
    };
    state.results.push(
      { data: { id, year: 2026, calendar_profile: 'nanakshahi', spiritual_tradition: 'sikh', variant_key: 'sgpc', computed_latitude: 31.634, computed_longitude: 74.872, computed_timezone: 'Asia/Kolkata', calculated_by: 'engine', source_provenance: {}, observance_definitions: { slug: 'guru-gobind-singh-gurpurab' } }, error: null },
      { data: null, error: null },
      { data: { case_id: `admin-date-candidate-${id}` }, error: null },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', body));
    expect(response.status).toBe(200);
    const inserted = state.calls.find((call) => call.kind === 'insert')?.value as Record<string, unknown>;
    expect(inserted.approved).toBe(false);
    expect(inserted.year).toBe(2026);
    expect(inserted.expected).toEqual({ civilDate: '2027-01-15' });
    expect(inserted.profile).toEqual({ calendar: 'nanakshahi', tradition: 'sikh', variantKey: 'sgpc' });
    expect(inserted.location).toEqual({ label: 'Coordinates 31.634000, 74.872000', lat: 31.634, lon: 74.872, tz: 'Asia/Kolkata' });
  });

  it('creates an authority date as one locked, withheld manual override', async () => {
    const id = '22222222-2222-4222-8222-222222222222';
    state.results.push(
      { data: { id: 'definition-guru-purnima', slug: 'guru-purnima', display_name: 'Guru Purnima', tradition: 'hindu', kind: 'major', active: true }, error: null },
      { data: [], error: null },
      { data: { id, date: '2027-07-19', publication_status: 'withheld_disputed', locked_for_regeneration: true }, error: null },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', {
      action: 'create_externally_curated', observance: 'guru-purnima', year: 2027,
      date: '2027-07-19', authorityName: 'Pt Prince Sharma', tier: 6,
      sourceUrlOrCitation: 'Annual authority confirmation',
    }));
    expect(response.status).toBe(200);
    const inserted = state.calls.find((call) => call.kind === 'insert')?.value as Record<string, any>;
    expect(inserted.publication_status).toBe('withheld_disputed');
    expect(inserted.locked_for_regeneration).toBe(true);
    expect(inserted.final_date_source).toBe('manual_override');
    expect(inserted.manual_date_override).toBe('2027-07-19');
    expect(inserted.calendar_profile).toBe('legacy-ujjain');
    expect(inserted.computed_latitude).toBe(23.1765);
    expect(inserted.source_provenance.status).toBe('pending_approval');
    expect(inserted.source_provenance.entered_by).toBe('calendar-reviewer');
  });

  it('makes a same-date entry idempotent without inserting a second row', async () => {
    const id = '22222222-2222-4222-8222-222222222222';
    state.results.push(
      { data: { id: 'definition-guru-purnima', slug: 'guru-purnima', display_name: 'Guru Purnima', tradition: 'hindu', kind: 'major', active: true }, error: null },
      { data: [{ id, date: '2027-07-19', occurrence_date: '2027-07-19', publication_status: 'withheld_disputed', source_provenance: {} }], error: null },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', {
      action: 'create_externally_curated', observance: 'guru-purnima', year: 2027,
      date: '2027-07-19', authorityName: 'Pt Prince Sharma', tier: 6,
      sourceUrlOrCitation: 'Annual authority confirmation',
    }));
    expect(response.status).toBe(200);
    expect((await response.json()).alreadyExists).toBe(true);
    expect(state.calls.some((call) => call.kind === 'insert')).toBe(false);
  });

  it('refuses approval when another date is already published', async () => {
    const id = '22222222-2222-4222-8222-222222222222';
    state.results.push(
      { data: { id, definition_id: 'definition-guru-purnima', year: 2027, date: '2027-07-19', occurrence_date: '2027-07-19', calendar_profile: 'legacy-ujjain', variant_key: 'legacy-default', publication_status: 'withheld_disputed', locked_for_regeneration: true, source_provenance: {}, observance_definitions: { slug: 'guru-purnima', derivability: 'externally_curated' } }, error: null },
      { data: [{ id: 'existing-published', date: '2027-07-18' }], error: null },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', { action: 'approve_externally_curated', id }));
    expect(response.status).toBe(409);
    expect(state.calls.some((call) => call.kind === 'update')).toBe(false);
  });

  it('approves a withheld entry only after the published-date conflict check', async () => {
    const id = '22222222-2222-4222-8222-222222222222';
    state.results.push(
      { data: { id, definition_id: 'definition-guru-purnima', year: 2027, date: '2027-07-19', occurrence_date: '2027-07-19', calendar_profile: 'legacy-ujjain', variant_key: 'legacy-default', publication_status: 'withheld_disputed', locked_for_regeneration: true, source_provenance: { status: 'pending_approval', audit: [] }, observance_definitions: { slug: 'guru-purnima', derivability: 'externally_curated' } }, error: null },
      { data: [], error: null },
      { data: { id, date: '2027-07-19', publication_status: 'published', locked_for_regeneration: true, source_provenance: { status: 'approved', audit: [{ action: 'approved' }] } }, error: null },
    );
    const response = await POST(request('http://localhost/api/admin/calendar-dates', { action: 'approve_externally_curated', id }));
    expect(response.status).toBe(200);
    const update = state.calls.find((call) => call.kind === 'update')?.value as Record<string, any>;
    expect(update.publication_status).toBe('published');
    expect(update.review_status).toBe('reviewed');
    expect(update.source_provenance.status).toBe('approved');
    expect(update.source_provenance.audit).toHaveLength(1);
  });

  it('rejects a second candidate when the occurrence already has linked fixture evidence', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    state.results.push({ data: { id, source_provenance: { caseId: 'approved-case' } }, error: null });
    const response = await POST(request('http://localhost/api/admin/calendar-dates', {
      action: 'create_candidate', occurrenceId: id, date: '2027-01-15', tier: 1,
      sourceUrl: 'https://sgpc.net/nanakshahi-calendar/', citation: 'Samvat 558 Gurpurab list 02 Magh', reason: 'The official poster names this Gregorian date.',
    }));
    expect(response.status).toBe(409);
    expect(state.calls.some((call) => call.kind === 'insert')).toBe(false);
  });

  it('fails closed when the occurrence lacks a qualified calculation location', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    state.results.push({ data: { id, year: 2026, calendar_profile: 'nanakshahi', computed_latitude: null, computed_longitude: 74.872, computed_timezone: 'Asia/Kolkata', source_provenance: {}, observance_definitions: { slug: 'guru-gobind-singh-gurpurab' } }, error: null });
    const response = await POST(request('http://localhost/api/admin/calendar-dates', {
      action: 'create_candidate', occurrenceId: id, date: '2027-01-15', tier: 1,
      sourceUrl: 'https://sgpc.net/nanakshahi-calendar/', citation: 'Samvat 558 Gurpurab list 02 Magh', reason: 'The official poster names this Gregorian date.',
    }));
    expect(response.status).toBe(409);
    expect(state.calls.some((call) => call.kind === 'insert')).toBe(false);
  });
});
