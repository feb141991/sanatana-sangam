import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

const APP_LANGUAGES = new Set(['en', 'hi', 'pa']);
const EDITABLE_TEXT_FIELDS = new Set(['full_name', 'sampradaya', 'ishta_devata']);
const EDITABLE_LANGUAGE_FIELDS = new Set(['app_language', 'meaning_language', 'transliteration_language']);
const EDITABLE_BOOLEAN_FIELDS = new Set([
  'wants_festival_reminders',
  'wants_shloka_reminders',
  'wants_nitya_reminders',
  'wants_community_notifications',
  'wants_family_notifications',
  'consent_religious_data',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeText(value: unknown, maxLength: number) {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => null);
    if (!isObject(rawBody)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const updates: Record<string, string | boolean | null> = {};

    for (const field of EDITABLE_TEXT_FIELDS) {
      if (!(field in rawBody)) continue;
      const maxLength = field === 'full_name' ? 80 : 64;
      const value = sanitizeText(rawBody[field], maxLength);
      if (value === undefined) {
        return NextResponse.json({ error: `${field} must be a string or null` }, { status: 400 });
      }
      updates[field] = value;
    }

    for (const field of EDITABLE_LANGUAGE_FIELDS) {
      if (!(field in rawBody)) continue;
      const value = rawBody[field];
      if (typeof value !== 'string' || !APP_LANGUAGES.has(value)) {
        return NextResponse.json({ error: `${field} must be one of en, hi, pa` }, { status: 400 });
      }
      updates[field] = value;
    }

    for (const field of EDITABLE_BOOLEAN_FIELDS) {
      if (!(field in rawBody)) continue;
      const value = rawBody[field];
      if (typeof value !== 'boolean') {
        return NextResponse.json({ error: `${field} must be a boolean` }, { status: 400 });
      }
      updates[field] = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No editable profile fields provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[PATCH /api/native/profile] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
