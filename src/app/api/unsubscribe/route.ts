import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * One‑click unsubscribe endpoint.
 *
 * GET /api/unsubscribe?token=xxx&type=all|newsletter|festivals
 *
 * Updates the user's profile based on the supplied token and returns a simple HTML confirmation.
 */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const token = searchParams.get('token');
  const type = searchParams.get('type') ?? 'all';

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Supabase configuration missing', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const update =
    type === 'newsletter'
      ? { email_newsletter: false }
      : type === 'festivals'
      ? { email_festivals: false }
      : { email_newsletter: false, email_festivals: false, marketing_consent: false };

  const { error } = await supabase.from('profiles').update(update as any).eq('unsubscribe_token', token);
  if (error) {
    console.error('[Unsubscribe] error updating profile', error);
    // Continue to render the page; the user still sees a friendly message.
  }

  const html = `<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family:Arial,Helvetica,sans-serif; text-align:center; padding:40px;"><h2>You've been unsubscribed</h2><p>You can manage your preferences in your <a href="https://shoonaya.app/settings">settings</a>.</p></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
