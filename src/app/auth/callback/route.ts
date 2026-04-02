import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function getSafeNext(rawNext: string | null, fallback: string) {
  if (!rawNext || !rawNext.startsWith('/')) return fallback;
  return rawNext;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeNext(searchParams.get('next'), '/home');

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const failureTarget = next === '/reset-password'
    ? '/login?error=password_reset_failed'
    : '/login?error=email_verification_failed';

  return NextResponse.redirect(`${origin}${failureTarget}`);
}
