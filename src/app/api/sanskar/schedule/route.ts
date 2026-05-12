import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── POST /api/sanskar/schedule ───────────────────────────────────────────────
// Called after Garbhadhana is recorded with an expected_date (due date).
// Schedules push notification reminders for upcoming milestone sanskaras.
//
// Body: { user_id: string; kul_member_id?: string | null; due_date: string (ISO date) }
//
// The route is fire-and-forget friendly — always returns 200 even if scheduling
// partially fails, so the caller doesn't need to handle errors.

// ─── Milestone offsets ────────────────────────────────────────────────────────
// monthsFromConception: approximate months after conception (due date = ~9 months)
const MILESTONES: Array<{
  sanskara_id: string;
  name:         string;
  // days before the calculated event date to send the reminder
  remind_days_before: number;
  // months after conception when this sanskar typically occurs
  months_after_conception: number;
}> = [
  { sanskara_id: 'pumsavana',      name: 'Pumsavana',      remind_days_before: 7,  months_after_conception: 2   },
  { sanskara_id: 'simantonnayana', name: 'Simantonnayana', remind_days_before: 7,  months_after_conception: 5   },
  { sanskara_id: 'jatakarma',      name: 'Jatakarma',      remind_days_before: 3,  months_after_conception: 9   },
  { sanskara_id: 'namakarana',     name: 'Namakarana',     remind_days_before: 3,  months_after_conception: 9.4 },
  { sanskara_id: 'nishkramana',    name: 'Nishkramana',    remind_days_before: 7,  months_after_conception: 13  },
  { sanskara_id: 'annaprashana',   name: 'Annaprashana',   remind_days_before: 7,  months_after_conception: 15  },
  { sanskara_id: 'chudakarana',    name: 'Chudakarana',    remind_days_before: 14, months_after_conception: 21  },
];

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Math.floor(months));
  // handle fractional months as days
  const frac = months - Math.floor(months);
  if (frac > 0) d.setDate(d.getDate() + Math.round(frac * 30));
  return d;
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });

  let body: { user_id: string; kul_member_id?: string | null; due_date: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  const { user_id, kul_member_id = null, due_date } = body;

  // Only the authenticated user can schedule their own notifications
  if (user_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const dueDate = new Date(due_date);
  if (isNaN(dueDate.getTime())) {
    return NextResponse.json({ ok: false, error: 'Invalid due_date' }, { status: 400 });
  }

  // Conception date ≈ due_date - 9 months
  const conceptionDate = addMonths(dueDate, -9);
  const now = new Date();

  const notifications: Array<{
    user_id:      string;
    title:        string;
    body:         string;
    send_at:      string;
    notification_type: string;
    metadata:     Record<string, unknown>;
  }> = [];

  for (const m of MILESTONES) {
    const eventDate   = addMonths(conceptionDate, m.months_after_conception);
    const reminderAt  = new Date(eventDate);
    reminderAt.setDate(reminderAt.getDate() - m.remind_days_before);

    // Skip milestones in the past
    if (reminderAt <= now) continue;

    notifications.push({
      user_id,
      title: `🕉️ Upcoming Sanskara: ${m.name}`,
      body: `${m.name} is due around ${eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Open Shoonaya to prepare and record this sacred milestone.`,
      send_at: reminderAt.toISOString(),
      notification_type: 'sanskar_milestone',
      metadata: {
        sanskara_id:   m.sanskara_id,
        kul_member_id: kul_member_id ?? null,
        event_date:    eventDate.toISOString(),
      },
    });
  }

  if (notifications.length === 0) {
    // All milestones already past — nothing to schedule
    return NextResponse.json({ ok: true, scheduled: 0, message: 'All milestones are in the past' });
  }

  // Insert into notification_schedule (fail gracefully if table not yet created)
  try {
    const { error } = await supabase.from('notification_schedule').insert(notifications);
    if (error) {
      // Table may not exist yet — log and return success anyway so the UI isn't blocked
      console.warn('[sanskar/schedule] Insert error:', error.message);
      return NextResponse.json({ ok: true, scheduled: 0, warning: 'notification_schedule table not available' });
    }
  } catch (e) {
    console.warn('[sanskar/schedule] Unexpected error:', e);
    return NextResponse.json({ ok: true, scheduled: 0, warning: 'scheduling unavailable' });
  }

  return NextResponse.json({ ok: true, scheduled: notifications.length });
}
