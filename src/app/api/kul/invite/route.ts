import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';

type InvitePayload = { targetUserId?: string; inviteCode?: string };

export async function POST(request: NextRequest) {
  const { user, supabase } = await getApiUser(request);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await request.json() as InvitePayload;
  if (!payload.targetUserId || !payload.inviteCode || payload.targetUserId === user.id) {
    return NextResponse.json({ error: 'Invalid invitation.' }, { status: 400 });
  }

  const normalizedCode = payload.inviteCode.trim().toUpperCase();
  const { data: senderProfile, error: senderError } = await supabase
    .from('profiles')
    .select('kul_id')
    .eq('id', user.id)
    .single();
  if (senderError || !senderProfile?.kul_id) {
    return NextResponse.json({ error: 'Only a Kul member can send this invitation.' }, { status: 403 });
  }

  const { data: ownedKul, error: kulError } = await supabase
    .from('kuls')
    .select('id')
    .eq('id', senderProfile.kul_id)
    .eq('invite_code', normalizedCode)
    .maybeSingle();
  if (kulError || !ownedKul) {
    return NextResponse.json({ error: 'Invitation code does not belong to your Kul.' }, { status: 403 });
  }

  const { error } = await supabase.from('kul_invites').insert({
    target_user_id: payload.targetUserId,
    invite_code: normalizedCode,
  });
  if (error) return NextResponse.json({ error: 'Could not send invitation.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
