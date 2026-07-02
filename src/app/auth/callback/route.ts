import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSafeAuthNext, resolvePostAuthDestination } from '@/lib/auth-destination';
import { ensureAuthProfile } from '@/lib/auth-profile';

async function createCallbackSupabaseClient() {
  const cookieStore = await cookies();
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(nextCookies: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.push(...nextCookies);
        },
      },
    }
  );

  return { supabase, cookiesToSet };
}

function attachAuthCookies(
  response: NextResponse,
  cookiesToSet: { name: string; value: string; options: CookieOptions }[]
) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeAuthNext(searchParams.get('next'), '/home');

  if (code) {
    const { supabase, cookiesToSet } = await createCallbackSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const loginUrl = new URL('/login', origin);
        loginUrl.searchParams.set('reason', 'session_missing');
        return attachAuthCookies(NextResponse.redirect(loginUrl), cookiesToSet);
      }

      const profile = await ensureAuthProfile(user, supabase);
      const destination = resolvePostAuthDestination(profile, next);
      const destinationUrl = new URL(destination, origin);

      console.log('[auth/callback]', {
        userId: user.id.slice(0, 8),
        profileFound: Boolean(profile),
        onboarding_completed: profile?.onboarding_completed ?? null,
        requestedNext: next,
        destination,
      });

      return attachAuthCookies(NextResponse.redirect(destinationUrl), cookiesToSet);
    }
  }

  const failureTarget = next === '/reset-password'
    ? '/login?error=password_reset_failed'
    : '/login?error=email_verification_failed';

  return NextResponse.redirect(`${origin}${failureTarget}`);
}
