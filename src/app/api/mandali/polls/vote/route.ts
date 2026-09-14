import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { createMandaliPromptAdminClient } from '@/lib/mandali-prompt-admin';

export async function POST(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createMandaliPromptAdminClient();
  const banned = await assertNotBanned(admin as any, user.id);
  if (banned) return banned;

  const body = await request.json().catch(() => null);
  const { pollId, optionId } = (body ?? {}) as { pollId?: string; optionId?: string };
  if (!pollId || !optionId) {
    return NextResponse.json({ error: 'pollId and optionId are required.' }, { status: 400 });
  }

  // Verify option belongs to poll
  const { data: option, error: optError } = await admin
    .from('post_poll_options')
    .select('id, poll_id')
    .eq('id', optionId)
    .eq('poll_id', pollId)
    .maybeSingle();
  if (optError || !option) {
    return NextResponse.json({ error: 'Invalid poll option.' }, { status: 400 });
  }

  // Insert or update vote
  const { error: voteError } = await admin
    .from('post_poll_votes')
    .upsert({ poll_id: pollId, option_id: optionId, user_id: user.id }, { onConflict: 'poll_id,user_id' });
  if (voteError) {
    return NextResponse.json({ error: 'Could not record vote.' }, { status: 500 });
  }

  // Recalculate vote counts for all options in this poll
  const { data: allOptions } = await admin
    .from('post_poll_options')
    .select('id, text_en, text_hi, text_pa, order_index')
    .eq('poll_id', pollId)
    .order('order_index', { ascending: true });

  const { data: allVotes } = await admin
    .from('post_poll_votes')
    .select('option_id')
    .eq('poll_id', pollId);

  const voteCounts = new Map<string, number>();
  for (const v of (allVotes ?? []) as Array<{ option_id: string }>) {
    voteCounts.set(v.option_id, (voteCounts.get(v.option_id) ?? 0) + 1);
  }

  for (const opt of (allOptions ?? []) as Array<{ id: string }>) {
    const count = voteCounts.get(opt.id) ?? 0;
    await admin.from('post_poll_options').update({ vote_count: count }).eq('id', opt.id);
  }

  const totalVotes = allVotes?.length ?? 0;
  const options = ((allOptions ?? []) as Array<{ id: string; text_en: string }>).map((opt) => {
    const voteCount = voteCounts.get(opt.id) ?? 0;
    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    return {
      id: opt.id,
      text: opt.text_en,
      voteCount,
      percentage,
    };
  });

  return NextResponse.json({
    poll: {
      id: pollId,
      totalVotes,
      userVotedOptionId: optionId,
      options,
    },
  });
}
