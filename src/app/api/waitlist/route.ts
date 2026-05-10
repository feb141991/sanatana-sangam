import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── POST /api/waitlist ────────────────────────────────────────────────────────
// Public endpoint — no auth required.
// Saves a pre-registration from the landing page.
// Body: { email, tradition?, name?, source? }
// ──────────────────────────────────────────────────────────────────────────────

// Use service role to bypass RLS on the public waitlist table
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight (landing page may be on a different origin during dev)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tradition, name, source } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { error } = await supabase.from('waitlist').upsert(
      {
        email:     email.toLowerCase().trim(),
        tradition: tradition ?? null,
        name:      name?.trim() ?? null,
        source:    source ?? 'landing',
      },
      { onConflict: 'email', ignoreDuplicates: true }
    );

    if (error) throw error;

    return NextResponse.json(
      { success: true },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('[waitlist] POST error:', err);
    return NextResponse.json(
      { error: 'Could not save registration. Please try again.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
