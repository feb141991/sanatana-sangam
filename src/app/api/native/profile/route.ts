import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

const APP_LANGUAGES = new Set(['en', 'hi', 'pa']);
const GENDER_CONTEXTS = new Set(['female', 'general']);
const LIFE_STAGES = new Set(['brahmacharya', 'grihastha', 'vanaprastha', 'sannyasa']);
// full_name/sampradaya/ishta_devata predate this route; city/country are the
// post-onboarding personal-details screen's addition (shoonaya-mobile
// app/settings/personal-details.tsx) -- profiles.city/country already exist,
// this route just didn't accept them yet.
const EDITABLE_TEXT_FIELDS = new Set(['full_name', 'sampradaya', 'ishta_devata', 'city', 'country']);
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

const DATE_OF_BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeDateOfBirth(value: unknown) {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!DATE_OF_BIRTH_RE.test(trimmed)) return undefined;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (parsed.getTime() > Date.now()) return undefined;
  return trimmed;
}

function sanitizeAvatarUrl(value: unknown) {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 1000) return undefined;

  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    if (!url.pathname.includes('/storage/v1/object/public/avatars/')) return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
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

    if ('avatar_url' in rawBody) {
      const value = sanitizeAvatarUrl(rawBody.avatar_url);
      if (value === undefined) {
        return NextResponse.json({ error: 'avatar_url must be a public avatars storage URL or null' }, { status: 400 });
      }
      updates.avatar_url = value;
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

    if ('date_of_birth' in rawBody) {
      const value = sanitizeDateOfBirth(rawBody.date_of_birth);
      if (value === undefined) {
        return NextResponse.json({ error: 'date_of_birth must be a YYYY-MM-DD string in the past, or null' }, { status: 400 });
      }
      updates.date_of_birth = value;
    }

    if ('gender_context' in rawBody) {
      const value = rawBody.gender_context;
      if (value !== null && (typeof value !== 'string' || !GENDER_CONTEXTS.has(value))) {
        return NextResponse.json({ error: 'gender_context must be one of female, general, or null' }, { status: 400 });
      }
      updates.gender_context = value;
    }

    if ('life_stage' in rawBody) {
      const value = rawBody.life_stage;
      if (value !== null && (typeof value !== 'string' || !LIFE_STAGES.has(value))) {
        return NextResponse.json({ error: 'life_stage must be one of brahmacharya, grihastha, vanaprastha, sannyasa, or null' }, { status: 400 });
      }
      updates.life_stage = value;
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
