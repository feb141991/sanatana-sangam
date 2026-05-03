import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

// ─── GET /api/admin/festivals ────────────────────────────────────────────────
// Returns all festivals from the DB ordered by date. Admin-only.

export async function GET() {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const { data, error } = await admin.supabase
    .from('festivals')
    .select('id, name, date, emoji, description, type, tradition')
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ festivals: data ?? [] });
}

// ─── POST /api/admin/festivals ───────────────────────────────────────────────
// Inserts a new festival. Required fields: name, date. Optional: emoji,
// description, type (major|vrat|regional), tradition.

export async function POST(request: Request) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const { name, date, emoji, description, type, tradition } = body;

  if (!name?.trim() || !date?.trim()) {
    return NextResponse.json({ error: 'name and date are required' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('festivals')
    .insert({
      name:        name.trim(),
      date:        date.trim(),
      emoji:       emoji?.trim() || '🪔',
      description: description?.trim() || '',
      type:        ['major', 'vrat', 'regional'].includes(type) ? type : 'major',
      tradition:   ['hindu', 'sikh', 'buddhist', 'jain', 'all'].includes(tradition) ? tradition : 'all',
      source_kind: 'curated',
      review_status: 'reviewed',
    })
    .select('id, name, date')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, festival: data });
}

// ─── DELETE /api/admin/festivals?id=<uuid> ───────────────────────────────────
// Deletes a festival by ID.

export async function DELETE(request: Request) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await admin.supabase
    .from('festivals')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
