import { NextRequest, NextResponse } from 'next/server';
import { getApiUser, getApiAuthFailureResponse } from '@/lib/api-auth';
import type { ProfileUpdate } from '@/lib/api/profile';

type PushPreferencePayload = {
  japa_reminder_enabled?: boolean;
  japa_reminder_time?: string;
  dharm_veer_reminder_enabled?: boolean;
  quiz_reminder_enabled?: boolean;
  quiz_reminder_time?: string;
  nitya_reminder_enabled?: boolean;
  nitya_reminder_time?: string;
  wants_madhyahn_reminder?: boolean;
  madhyahn_reminder_time?: string;
  wants_evening_reminder?: boolean;
  evening_reminder_time?: string;
};

type PushPreferenceKey = keyof PushPreferencePayload;
type PushPreferenceUpdates = ProfileUpdate & PushPreferencePayload;

const TIME_FIELDS = [
  'japa_reminder_time',
  'quiz_reminder_time',
  'nitya_reminder_time',
  'madhyahn_reminder_time',
  'evening_reminder_time',
] as const satisfies readonly PushPreferenceKey[];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTimeValue(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);

  if (!user || !supabase) {
    return authError ? getApiAuthFailureResponse(authError) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        japa_reminder_enabled,
        japa_reminder_time,
        dharm_veer_reminder_enabled,
        quiz_reminder_enabled,
        quiz_reminder_time,
        nitya_reminder_enabled,
        nitya_reminder_time,
        wants_madhyahn_reminder,
        madhyahn_reminder_time,
        wants_evening_reminder,
        evening_reminder_time
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ preferences: data ?? {} });
  } catch (err) {
    console.error('[push/preferences/GET] Failed:', err);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);

  if (!user || !supabase) {
    return authError ? getApiAuthFailureResponse(authError) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawBody: unknown = await req.json();
    if (!isObject(rawBody)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const updates: PushPreferenceUpdates = {};

    if ('japa_reminder_enabled' in rawBody) {
      if (typeof rawBody.japa_reminder_enabled !== 'boolean') {
        return NextResponse.json({ error: 'japa_reminder_enabled must be a boolean' }, { status: 400 });
      }
      updates.japa_reminder_enabled = rawBody.japa_reminder_enabled;
    }

    if ('dharm_veer_reminder_enabled' in rawBody) {
      if (typeof rawBody.dharm_veer_reminder_enabled !== 'boolean') {
        return NextResponse.json({ error: 'dharm_veer_reminder_enabled must be a boolean' }, { status: 400 });
      }
      updates.dharm_veer_reminder_enabled = rawBody.dharm_veer_reminder_enabled;
    }

    if ('quiz_reminder_enabled' in rawBody) {
      if (typeof rawBody.quiz_reminder_enabled !== 'boolean') {
        return NextResponse.json({ error: 'quiz_reminder_enabled must be a boolean' }, { status: 400 });
      }
      updates.quiz_reminder_enabled = rawBody.quiz_reminder_enabled;
    }

    if ('nitya_reminder_enabled' in rawBody) {
      if (typeof rawBody.nitya_reminder_enabled !== 'boolean') {
        return NextResponse.json({ error: 'nitya_reminder_enabled must be a boolean' }, { status: 400 });
      }
      updates.nitya_reminder_enabled = rawBody.nitya_reminder_enabled;
      updates.wants_nitya_reminders = rawBody.nitya_reminder_enabled;
    }

    if ('wants_madhyahn_reminder' in rawBody) {
      if (typeof rawBody.wants_madhyahn_reminder !== 'boolean') {
        return NextResponse.json({ error: 'wants_madhyahn_reminder must be a boolean' }, { status: 400 });
      }
      updates.wants_madhyahn_reminder = rawBody.wants_madhyahn_reminder;
    }

    if ('wants_evening_reminder' in rawBody) {
      if (typeof rawBody.wants_evening_reminder !== 'boolean') {
        return NextResponse.json({ error: 'wants_evening_reminder must be a boolean' }, { status: 400 });
      }
      updates.wants_evening_reminder = rawBody.wants_evening_reminder;
    }

    for (const field of TIME_FIELDS) {
      if (!(field in rawBody)) continue;
      const value = rawBody[field];
      if (!isTimeValue(value)) {
        return NextResponse.json({ error: `${field} must be in HH:MM format` }, { status: 400 });
      }
      updates[field] = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid update parameters provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates as never)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[push/preferences/PATCH] Failed:', err);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
