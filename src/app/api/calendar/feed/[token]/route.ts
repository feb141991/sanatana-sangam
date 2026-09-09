import { NextRequest } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { loadSubscriptionEvents, renderSubscriptionCalendar, subscriptionSettings, type CalendarSubscriptionSettings } from '@/lib/calendar/subscription-feed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response(null, { status: 404, headers });
  try {
    const admin = createServiceRoleSupabaseClient();
    const { data, error } = await admin.from('calendar_subscriptions').select('settings').eq('token', token).maybeSingle();
    if (error) return new Response(null, { status: 503, headers });
    if (!data) return new Response(null, { status: 404, headers });
    // Settings are immutable and written only by the authenticated server route.
    const settings = subscriptionSettings(data.settings as unknown as CalendarSubscriptionSettings);
    const { events } = await loadSubscriptionEvents(admin, settings);
    return new Response(renderSubscriptionCalendar(events), { headers: { ...headers, 'Content-Type': 'text/calendar; charset=utf-8' } });
  } catch {
    // Never log the request URL/token or return a successful empty feed on faults.
    return new Response(null, { status: 503, headers });
  }
}
