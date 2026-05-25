import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * One‑click unsubscribe endpoint.
 * GET /api/unsubscribe?token=...&type=all|newsletter|festivals
 * No authentication – token uniquely identifies the user.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const type = url.searchParams.get('type') ?? 'all';

  if (!token) {
    return new Response('Missing token', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Server misconfiguration', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const update =
    type === 'newsletter'
      ? { email_newsletter: false }
      : type === 'festivals'
        ? { email_festivals: false }
        : { email_newsletter: false, email_festivals: false, marketing_consent: false };

  const { error } = await supabase.from('profiles').update(update as never).eq('unsubscribe_token', token);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Unsubscribed</title>
  <style>
    body {font-family:Arial,Helvetica,sans-serif;background:#fafafa;color:#222;padding:2rem;}
    .container {max-width:600px;margin:auto;background:#fff;padding:2rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
    a {color:#0066cc;}
  </style>
</head>
<body>
  <div class="container">
    <h1>You've been unsubscribed</h1>
    ${error ? `<p style="color:red;">Error: ${error.message}</p>` : '<p>We have updated your email preferences.</p>'}
    <p>Manage your preferences anytime at <a href="https://shoonaya.app/settings">shoonaya.app/settings</a>.</p>
  </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
