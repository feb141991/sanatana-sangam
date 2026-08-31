import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

// Read-only "view another member's public profile" lookup. The `profiles`
// table's own RLS only allows a user to read their own row (auth.uid() =
// id) -- there is no public-read policy, despite native's
// app/profile/[id].tsx assuming one existed. Rather than widen `profiles`'
// RLS (a broader, harder-to-review change touching every reader of that
// table), this reuses the same admin-client pattern the Mandali member
// list already relies on: a curated field selection, fetched server-side,
// bypassing RLS deliberately and narrowly for exactly this one read.
const PUBLIC_PROFILE_FIELDS =
  'id, full_name, username, avatar_url, bio, tradition, sampradaya, ishta_devata, city, country, seva_score, karma_points';

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('profiles').select(PUBLIC_PROFILE_FIELDS).eq('id', id).maybeSingle();
  if (error) {
    console.error('[mandali/member-profile] failed', error.message);
    return NextResponse.json({ error: 'Could not load profile.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return NextResponse.json({ profile: data });
}
