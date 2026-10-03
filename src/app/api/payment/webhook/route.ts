import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Payments have been retired for the free launch. Keep this endpoint as a
 * harmless acknowledgement so a previously configured provider webhook does
 * not keep retrying and, critically, cannot mutate profile entitlements.
 */
export async function POST() {
  return NextResponse.json({ received: true, ignored: true, reason: 'payments_retired' });
}
