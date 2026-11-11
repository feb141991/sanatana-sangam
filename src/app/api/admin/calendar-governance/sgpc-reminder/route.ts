import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { latestEdition } from '@/lib/calendar/sgpc-edition-registry';
import { buildSgpcEditionReminder } from '@/lib/calendar/sgpc-edition-reminder';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  return NextResponse.json(buildSgpcEditionReminder(latestEdition(), new Date()));
}
