import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestProfile } from '@/lib/calendar/request-profile';
import { getApiUser } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { loadSubscriptionEvents, subscriptionSettings } from '@/lib/calendar/subscription-feed';
import type { CalendarSubscriptionSettings } from '@/lib/calendar/subscription-feed';
import type { Json } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

function feedUrl(token: string) {
  const base = new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.shoonaya.com');
  if (base.protocol !== 'https:') throw new Error('SUBSCRIPTION_UNAVAILABLE');
  return new URL(`/api/calendar/feed/${token}`, base).toString();
}

export async function GET(request: NextRequest) {
  try {
    const resolved = await resolveRequestProfile(request, { tradition: 'all', calendarProfile: '' });
    if (!resolved.isAuthenticated || resolved.invalidCredentials) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    if (resolved.profileError) throw resolved.profileError;
    const { data: existing, error } = await resolved.supabase.from('calendar_subscriptions').select('token, settings').eq('user_id', resolved.userId!).maybeSingle();
    if (error) return NextResponse.json({ error: 'SUBSCRIPTION_UNAVAILABLE' }, { status: 503, headers });
    const settings = existing ? subscriptionSettings(existing.settings as CalendarSubscriptionSettings) : subscriptionSettings(resolved);
    const { from, to, events } = await loadSubscriptionEvents(resolved.supabase, settings);
    return NextResponse.json({ active: !!existing, url: existing ? feedUrl(existing.token) : null,
      settings: { calendarProfile: settings.calendarProfile, tradition: settings.tradition, sampradaya: settings.sampradaya,
        timezone: settings.timezone, location: settings.context.effectiveCalculationLocation.label },
      from, to, count: events.length, preview: events.slice(0, 5).map(e => ({ id: e.id, name: e.display_name, date: e.civilDate })) }, { headers });
  } catch (error) {
    const required = error instanceof Error && error.message === 'CALENDAR_PROFILE_REQUIRED';
    return NextResponse.json({ error: required ? 'CALENDAR_PROFILE_REQUIRED' : 'CALENDAR_UNAVAILABLE' }, { status: required ? 422 : 503, headers });
  }
}

export async function POST(request: NextRequest) {
  try {
    const resolved = await resolveRequestProfile(request, { tradition: 'all', calendarProfile: '' });
    if (!resolved.isAuthenticated || resolved.invalidCredentials) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    if (resolved.profileError) throw resolved.profileError;
    const settings = subscriptionSettings(resolved);
    // Resolve availability before minting any link; no profile/body user IDs.
    await loadSubscriptionEvents(resolved.supabase, settings);
    const token = randomBytes(32).toString('hex');
    feedUrl(token);
    const admin = createServiceRoleSupabaseClient();
    // PK user_id makes retries/concurrent requests idempotent. Never rotate an
    // existing link silently: callers explicitly revoke before changing settings.
    const { error } = await admin.from('calendar_subscriptions').upsert({ user_id: resolved.userId!, token,
      settings: JSON.parse(JSON.stringify(settings)) as Json }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (error) throw new Error('SUBSCRIPTION_UNAVAILABLE');
    return GET(request);
  } catch (error) {
    const required = error instanceof Error && error.message === 'CALENDAR_PROFILE_REQUIRED';
    return NextResponse.json({ error: required ? 'CALENDAR_PROFILE_REQUIRED' : 'SUBSCRIPTION_UNAVAILABLE' }, { status: required ? 422 : 503, headers });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const { error } = await auth.supabase.from('calendar_subscriptions').delete().eq('user_id', auth.user.id);
  return error ? NextResponse.json({ error: 'SUBSCRIPTION_UNAVAILABLE' }, { status: 503, headers }) : new Response(null, { status: 204, headers });
}
