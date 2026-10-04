import { NextResponse } from 'next/server';

import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { escapeEmailHtml } from '@/lib/email';

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.shoonaya.com';
const VALID_TYPES = new Set(['all', 'newsletter', 'festivals']);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function parseType(value: string | null): 'all' | 'newsletter' | 'festivals' | null {
  if (!value) return 'all';
  return VALID_TYPES.has(value) ? value as 'all' | 'newsletter' | 'festivals' : null;
}

function page(title: string, content: string) {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmailHtml(title)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;background:#faf6ef;color:#1a140e;padding:2rem}.container{max-width:560px;margin:4rem auto;background:#fff;padding:2rem;border-radius:16px;border:1px solid #eae2d5}button{background:#c5a059;color:#fff;border:0;padding:12px 20px;border-radius:10px;font-weight:700;cursor:pointer}</style></head>
<body><main class="container"><h1>${escapeEmailHtml(title)}</h1>${content}<p><a href="${escapeEmailHtml(APP_BASE)}/settings">Manage Shoonaya preferences</a></p></main></body></html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * GET only renders a confirmation form. Mail-security scanners routinely
 * prefetch links, so a GET must never change a user's preferences.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const type = parseType(url.searchParams.get('type'));
  if (!token || token.length > 256 || !type) {
    return new Response('Invalid unsubscribe link', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const admin = createServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('unsubscribe_token', token)
    .maybeSingle();
  if (error) return new Response('Could not load preferences', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  if (!data) return page('Link unavailable', '<p>This preference link is no longer valid.</p>');

  const action = `${APP_BASE}/api/unsubscribe`;
  const form = `<p>Confirm that you want to stop ${type === 'all' ? 'all optional Shoonaya emails' : type === 'newsletter' ? 'the Shoonaya digest' : 'festival emails'}.</p>
<form method="post" action="${escapeEmailHtml(action)}"><input type="hidden" name="token" value="${escapeEmailHtml(token)}"><input type="hidden" name="type" value="${type}"><button type="submit">Confirm unsubscribe</button></form>`;
  return page('Email preferences', form);
}

/** RFC 8058 one-click unsubscribe and the explicit confirmation form POST. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const contentType = request.headers.get('content-type') ?? '';
  let bodyToken: string | null = null;
  let bodyType: string | null = null;
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = new URLSearchParams(await request.text());
    bodyToken = form.get('token');
    bodyType = form.get('type');
  }

  const token = url.searchParams.get('token') ?? bodyToken;
  const type = parseType(url.searchParams.get('type') ?? bodyType);
  if (!token || token.length > 256 || !type) {
    return new Response('Invalid unsubscribe request', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const update = type === 'newsletter'
    ? { email_newsletter: false }
    : type === 'festivals'
      ? { email_festivals: false }
      : { email_newsletter: false, email_festivals: false, marketing_consent: false };

  const admin = createServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from('profiles')
    .update(update)
    .eq('unsubscribe_token', token)
    .select('id');
  if (error) return new Response('Could not update preferences', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  if (!data || data.length === 0) return page('Link unavailable', '<p>This preference link is no longer valid.</p>');
  return page('Email preferences updated', '<p>You have been unsubscribed from the selected optional emails.</p>');
}
