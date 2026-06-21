import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function getSafeNext(rawNext: string | null, fallback: string) {
  if (!rawNext || !rawNext.startsWith('/') || rawNext.startsWith('//')) return fallback;
  return rawNext;
}

function profileName(user: User) {
  const meta = user.user_metadata ?? {};
  const name = typeof meta.full_name === 'string' ? meta.full_name
    : typeof meta.name === 'string' ? meta.name
    : user.email?.split('@')[0];
  return name?.trim() || 'Shoonaya Seeker';
}

function profileUsername(user: User) {
  const meta = user.user_metadata ?? {};
  const raw = typeof meta.username === 'string' ? meta.username
    : user.email?.split('@')[0];
  const base = raw
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
  return `${base || 'seeker'}_${user.id.slice(0, 8)}`;
}

async function ensureProfile(user: User, sessionSupabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const profile = {
    id: user.id,
    full_name: profileName(user),
    username: profileUsername(user),
    avatar_url: typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null,
    app_language: 'en',
    onboarding_completed: false,
  };

  const canUseAdmin = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = canUseAdmin ? createAdminClient() : sessionSupabase;

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (readError || existing) return;

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(profile);

  if (insertError) {
    console.error('[auth/callback] profile repair failed:', {
      userId: user.id.slice(0, 8),
      code: insertError.code,
      message: insertError.message,
    });
  }
}

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
  const next = getSafeNext(searchParams.get('next'), '/home');

  if (code) {
    const { supabase, cookiesToSet } = await createCallbackSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await ensureProfile(user, supabase as Awaited<ReturnType<typeof createServerSupabaseClient>>);
      }
      const bridge = new URL('/auth/continue', origin);
      bridge.searchParams.set('next', next);
      return attachAuthCookies(NextResponse.redirect(bridge), cookiesToSet);
    }
  }

  const failureTarget = next === '/reset-password'
    ? '/login?error=password_reset_failed'
    : '/login?error=email_verification_failed';

  return NextResponse.redirect(`${origin}${failureTarget}`);
}
