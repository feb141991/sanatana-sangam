import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestProfile } from '@/lib/calendar/request-profile';
import { loadSubscriptionEvents, renderSubscriptionCalendar, subscriptionSettings } from '@/lib/calendar/subscription-feed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** One-time snapshot, using the same verified, profile-qualified feed contract. */
export async function GET(request: NextRequest) {
  try {
    const profile = await resolveRequestProfile(request, { tradition: 'all', calendarProfile: '' });
    if (!profile.isAuthenticated || profile.invalidCredentials) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.profileError) throw profile.profileError;
    const { events } = await loadSubscriptionEvents(profile.supabase, subscriptionSettings(profile));
    return new Response(renderSubscriptionCalendar(events), { headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="shoonaya-dharmic-calendar.ics"',
      'Cache-Control': 'private, no-store',
    } });
  } catch (error) {
    const required = error instanceof Error && error.message === 'CALENDAR_PROFILE_REQUIRED';
    return NextResponse.json({ error: required ? 'CALENDAR_PROFILE_REQUIRED' : 'CALENDAR_UNAVAILABLE' }, { status: required ? 422 : 503 });
  }
}
