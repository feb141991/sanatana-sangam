import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import {
  csvCell,
  parseEarlyAccessFilters,
  type EarlyAccessWaitlistFilter,
} from '@/lib/early-access-policy';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WAITLIST_FIELDS = 'id, email, name, tradition, source, timezone, founding_number, email_sent, referred_by_number, referral_source, created_at';
const EXPORT_LIMIT = 10_000;
const PAGE_SIZE = 500;

export interface EarlyAccessSeeker {
  id: string;
  email: string;
  name: string | null;
  tradition: string | null;
  source: string | null;
  timezone: string | null;
  founding_number: number | null;
  email_sent: boolean;
  email_status: 'accepted' | 'queued' | 'sending' | 'suppressed' | 'needs_attention' | 'not_queued';
  email_error_code: string | null;
  email_accepted_at: string | null;
  referred_by_number: number | null;
  referral_source: string | null;
  created_at: string;
}

export interface EarlyAccessStats {
  total: number;
  today: number;
  thisWeek: number;
  androidInterestCount: number;
  iosInterestCount: number;
  webInterestCount: number;
  traditions: Record<string, number>;
}

function parsePositiveInteger(value: string | null, fallback: number, max: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  return Math.min(Math.max(Number(value), 1), max);
}

function buildFilteredQuery(supabase: ReturnType<typeof createServiceRoleSupabaseClient>, filters: EarlyAccessWaitlistFilter) {
  let query = supabase.from('waitlist').select(WAITLIST_FIELDS, { count: 'exact' });

  if (filters.query) {
    if (/^\d+$/.test(filters.query)) {
      query = query.or(`email.ilike.%${filters.query}%,name.ilike.%${filters.query}%,founding_number.eq.${filters.query}`);
    } else {
      query = query.or(`email.ilike.%${filters.query}%,name.ilike.%${filters.query}%`);
    }
  }
  if (filters.tradition === 'universal') query = query.is('tradition', null);
  else if (filters.tradition !== 'all') query = query.eq('tradition', filters.tradition);
  if (filters.platform === 'android') query = query.ilike('source', '%android%');
  else if (filters.platform === 'ios') query = query.ilike('source', '%ios%');
  else if (filters.platform === 'web') {
    query = query.or('source.is.null,and(source.not.ilike.%android%,source.not.ilike.%ios%)');
  }

  if (filters.sort === 'founding_asc') query = query.order('founding_number', { ascending: true, nullsFirst: false });
  else if (filters.sort === 'founding_desc') query = query.order('founding_number', { ascending: false, nullsFirst: false });
  else query = query.order('created_at', { ascending: filters.sort === 'oldest' });

  return query;
}

function platformInterest(source: string | null): string {
  const normalized = source?.toLowerCase() ?? '';
  if (normalized.includes('android')) return 'Android interest';
  if (normalized.includes('ios')) return 'iOS interest';
  return 'Web interest';
}

async function attachEmailStatus(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  rows: Array<{
    id: string;
    email_sent: boolean;
  }>,
): Promise<Map<string, { status: EarlyAccessSeeker['email_status']; errorCode: string | null; acceptedAt: string | null }>> {
  const result = new Map<string, { status: EarlyAccessSeeker['email_status']; errorCode: string | null; acceptedAt: string | null }>();
  if (rows.length === 0) return result;

  for (const rowBatch of Array.from({ length: Math.ceil(rows.length / PAGE_SIZE) }, (_, index) => rows.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE))) {
    const keys = rowBatch.map((row) => `waitlist-welcome:${row.id}`);
    const { data, error } = await supabase
      .from('email_outbox')
      .select('idempotency_key, status, last_error_code, sent_at')
      .in('idempotency_key', keys);
    if (error) throw error;

    for (const outbox of data ?? []) {
      const id = outbox.idempotency_key.slice('waitlist-welcome:'.length);
      const status: EarlyAccessSeeker['email_status'] = outbox.status === 'sent'
        ? 'accepted'
        : outbox.status === 'pending'
          ? 'queued'
          : outbox.status === 'processing'
            ? 'sending'
            : outbox.status === 'suppressed'
              ? 'suppressed'
              : 'needs_attention';
      result.set(id, { status, errorCode: outbox.last_error_code, acceptedAt: outbox.sent_at });
    }
  }

  for (const row of rows) {
    if (!result.has(row.id)) {
      result.set(row.id, {
        status: row.email_sent ? 'accepted' : 'not_queued',
        errorCode: null,
        acceptedAt: null,
      });
    }
  }
  return result;
}

async function exportCsv(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  filters: EarlyAccessWaitlistFilter,
): Promise<NextResponse> {
  const rows: Array<{
    id: string;
    email: string;
    name: string | null;
    tradition: string | null;
    source: string | null;
    timezone: string | null;
    founding_number: number | null;
    email_sent: boolean;
    referred_by_number: number | null;
    referral_source: string | null;
    created_at: string | null;
  }> = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, count, error } = await buildFilteredQuery(supabase, filters).range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if ((count ?? 0) > EXPORT_LIMIT) {
      return NextResponse.json({ error: `Narrow the filters to export ${EXPORT_LIMIT.toLocaleString()} rows or fewer.` }, { status: 413 });
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE || rows.length >= (count ?? 0)) break;
  }

  const emailStatuses = await attachEmailStatus(supabase, rows);
  const header = [
    'Request Number', 'Email', 'Name', 'Tradition', 'Platform Interest', 'Source', 'Timezone',
    'Referred By', 'Confirmation Email Status', 'Email Error Code', 'Provider Accepted At', 'Registered At',
  ];
  const lines = [header.map(csvCell).join(',')];
  for (const row of rows) {
    const emailStatus = emailStatuses.get(row.id);
    lines.push([
      row.founding_number,
      row.email,
      row.name,
      row.tradition ?? 'universal',
      platformInterest(row.source),
      row.source,
      row.timezone,
      row.referred_by_number,
      emailStatus?.status ?? 'not_queued',
      emailStatus?.errorCode,
      emailStatus?.acceptedAt,
      row.created_at,
    ].map(csvCell).join(','));
  }

  const csv = lines.join('\r\n');
  const filename = `shoonaya-early-access-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function GET(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const filters = parseEarlyAccessFilters(searchParams);
  try {
    const supabase = createServiceRoleSupabaseClient();
    if (searchParams.get('format') === 'csv') return await exportCsv(supabase, filters);

    const page = parsePositiveInteger(searchParams.get('page'), 1, 1_000_000);
    const limit = parsePositiveInteger(searchParams.get('limit'), 50, 100);
    const offset = (page - 1) * limit;
    const { data: seekers, count, error: listError } = await buildFilteredQuery(supabase, filters)
      .range(offset, offset + limit - 1);
    if (listError) throw listError;

    const rows = seekers ?? [];
    const emailStatuses = await attachEmailStatus(supabase, rows);
    const enrichedSeekers: EarlyAccessSeeker[] = rows.map((seeker) => {
      const status = emailStatuses.get(seeker.id);
      return {
        ...seeker,
        created_at: seeker.created_at ?? '',
        email_status: status?.status ?? 'not_queued',
        email_error_code: status?.errorCode ?? null,
        email_accepted_at: status?.acceptedAt ?? null,
      };
    });

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [total, today, thisWeek, android, ios, web, hindu, sikh, buddhist, jain, universal] = await Promise.all([
      supabase.from('waitlist').select('id', { count: 'exact', head: true }),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).ilike('source', '%android%'),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).ilike('source', '%ios%'),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).or('source.is.null,and(source.not.ilike.%android%,source.not.ilike.%ios%)'),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('tradition', 'hindu'),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('tradition', 'sikh'),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('tradition', 'buddhist'),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('tradition', 'jain'),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).is('tradition', null),
    ]);

    const statsResults = [total, today, thisWeek, android, ios, web, hindu, sikh, buddhist, jain, universal];
    const failedStats = statsResults.find((result) => result.error);
    if (failedStats?.error) throw failedStats.error;

    const stats: EarlyAccessStats = {
      total: total.count ?? 0,
      today: today.count ?? 0,
      thisWeek: thisWeek.count ?? 0,
      androidInterestCount: android.count ?? 0,
      iosInterestCount: ios.count ?? 0,
      webInterestCount: web.count ?? 0,
      traditions: {
        hindu: hindu.count ?? 0,
        sikh: sikh.count ?? 0,
        buddhist: buddhist.count ?? 0,
        jain: jain.count ?? 0,
        universal: universal.count ?? 0,
      },
    };

    return NextResponse.json({ seekers: enrichedSeekers, total: count ?? 0, page, limit, stats }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'unknown';
    console.error('[admin/early-access] GET failed', { code });
    return NextResponse.json(
      { error: 'Failed to fetch early-access requests.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
