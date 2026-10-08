import { NextRequest, NextResponse } from 'next/server';

import { resolveNativeAppVersionPolicy } from '@/lib/native-app-version-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public, platform-qualified store update policy consumed by the Native app. */
export async function GET(request: NextRequest) {
  const platformValue = request.nextUrl.searchParams.get('platform');
  if (platformValue !== 'android' && platformValue !== 'ios') {
    return NextResponse.json(
      { error: 'A supported app platform is required.', code: 'INVALID_PLATFORM' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const result = resolveNativeAppVersionPolicy(process.env);
  if (!result.ok) {
    console.error('[native-app-version] Update policy is not configured:', result.reason);
    return NextResponse.json(
      { error: 'App update policy is temporarily unavailable.', code: 'UPDATE_POLICY_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(result.policy, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' },
  });
}
