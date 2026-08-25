import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { TERMS_VERSION } from '@/lib/terms-content';
import { PRIVACY_VERSION } from '@/lib/privacy-content';

const CURRENT_VERSION: Record<'terms' | 'privacy', string> = {
  terms: TERMS_VERSION,
  privacy: PRIVACY_VERSION,
};

// ─── POST /api/user/legal-acceptance ─────────────────────────────────────────
// Records a versioned Terms/Privacy acceptance receipt for the authenticated
// user. Append-only -- every call inserts a new row, never updates one.
// Body: { document: 'terms' | 'privacy', surface: string }
// The version recorded is always the server's current constant, never a
// client-supplied value, so a stale client can't backdate an acceptance.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { document?: string; surface?: string } | null;
  const document = body?.document;
  const surface = typeof body?.surface === 'string' && body.surface.trim() ? body.surface.trim() : 'unspecified';

  if (document !== 'terms' && document !== 'privacy') {
    return NextResponse.json({ error: "document must be 'terms' or 'privacy'" }, { status: 400 });
  }

  const { error } = await supabase.from('legal_acceptances').insert({
    user_id: user.id,
    document,
    version: CURRENT_VERSION[document],
    surface,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document, version: CURRENT_VERSION[document] });
}
