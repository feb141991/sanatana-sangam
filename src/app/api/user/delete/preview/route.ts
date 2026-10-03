import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { buildDeletionPreview, type DeletionPreview } from '@/lib/account-deletion-preview';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type DeletionPreviewResponse = DeletionPreview & {
  success: true;
  /**
   * Always empty: mandalis has no owner column (city groups), so the earlier
   * created_by query always errored. Kept so already-shipped Native builds
   * that read the field keep working.
   */
  ownedMandalis: [];
};

/**
 * What the caller would lose by deleting their account, for Native's deletion
 * sheet. Same builder as the PWA page (src/lib/account-deletion-preview.ts).
 * A failed read returns 503 rather than a zero-filled summary.
 */
export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return getApiAuthFailureResponse(authError);
  }

  const result = await buildDeletionPreview(supabase, createServiceRoleSupabaseClient(), user.id);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const response: DeletionPreviewResponse = { success: true, ...result.preview, ownedMandalis: [] };
  return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
}
