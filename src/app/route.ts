import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── Root Route Handler ────────────────────────────────────────────────────
// Serves landing.html directly at / — URL stays shoonaya.com, no redirect.
// Logged-in users are sent to /home.
//
// Why a Route Handler instead of page.tsx:
//   page.tsx can only return JSX. To serve raw HTML (landing.html) without
//   changing the URL, we need a Route Handler that returns a Response.
//   This is the correct Next.js App Router pattern.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  // OAuth should land on /auth/callback, but a stale Supabase Site URL or
  // redirect allow-list can send users to /?code=... instead. Preserve the
  // auth params and move them to the exchange route instead of showing landing.
  if (code) {
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  try {
    // Logged-in users → app home
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(
        new URL('/home', process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com')
      );
    }
  } catch {
    // Auth check failed — serve landing page anyway (safe fallback)
  }

  // Serve landing.html content at / — browser URL stays /
  const html = await readFile(
    path.join(process.cwd(), 'public', 'landing.html'),
    'utf-8'
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
