import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { enqueueShoonayaEmail } from '@/lib/email-outbox';
import { APP } from '@/lib/config';

type InvitePayload = { targetUserId?: string; inviteCode?: string };

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);

  const payload = await request.json() as InvitePayload;
  if (!payload.targetUserId || !payload.inviteCode || payload.targetUserId === user.id) {
    return NextResponse.json({ error: 'Invalid invitation.' }, { status: 400 });
  }

  const normalizedCode = payload.inviteCode.trim().toUpperCase();
  const { data: senderProfile, error: senderError } = await supabase
    .from('profiles')
    .select('kul_id, full_name')
    .eq('id', user.id)
    .single();
  if (senderError || !senderProfile?.kul_id) {
    return NextResponse.json({ error: 'Only a Kul member can send this invitation.' }, { status: 403 });
  }

  const { data: ownedKul, error: kulError } = await supabase
    .from('kuls')
    .select('id, name')
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

  try {
    const admin = createAdminClient();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(payload.targetUserId);
    if (targetError) throw targetError;
    if (target.user.email) {
      const inviterName = senderProfile.full_name?.trim() || 'A Shoonaya family member';
      const familyName = ownedKul.name?.trim() || 'your family';
      const ctaUrl = new URL('/kul', APP.BASE_URL);
      ctaUrl.searchParams.set('invite', normalizedCode);
      await enqueueShoonayaEmail({
        idempotencyKey: `kul-invite:${ownedKul.id}:${payload.targetUserId}:${normalizedCode}`,
        to: target.user.email,
        recipientUserId: payload.targetUserId,
        templateKey: 'kul_invite',
        emailClass: 'transactional',
        content: {
          subject: `You are invited to ${familyName} on Shoonaya`,
          shloka: '',
          meaning: '',
          title: `Join ${familyName} on Shoonaya`,
          body: `${inviterName} has invited you to join the private ${familyName} family circle. Open the invitation in Shoonaya to review and join.`,
          ctaText: 'View family invitation',
          ctaUrl: ctaUrl.toString(),
        },
        priority: 30,
      });
    }
  } catch (emailError) {
    // The in-app invite was already persisted. Email delivery is best effort;
    // failures stay out of the invite response and never expose the address.
    console.error('[kul/invite] email enqueue failed', emailError instanceof Error ? emailError.message : 'unknown');
  }

  return NextResponse.json({ ok: true });
}
