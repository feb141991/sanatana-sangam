import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getTierFromScore } from '@/lib/seva-tiers';
import { getNextLocalHourUtc, resolveTimeZone } from '@/lib/sacred-time';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('seva_score, spiritual_level, timezone')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { seva_score, spiritual_level } = profile;
    const newTier = getTierFromScore(seva_score || 0);

    // If tier has changed, update it
    if (newTier.key !== spiritual_level) {
      const title = `${newTier.emoji} Tier Promotion — ${newTier.label}!`;
      const body = `You have risen to ${newTier.label} (${newTier.sanskrit}). Your sadhana is bearing fruit. 🙏`;
      const timezone = resolveTimeZone(profile.timezone);
      const { sendAt, localDateIso } = getNextLocalHourUtc(new Date(), timezone, 10, 0);
      const { data: updateResult, error: updateError } = await createServiceRoleSupabaseClient().rpc(
        'update_seva_tier_and_queue_notification',
        {
          p_user_id: user.id,
          p_expected_score: Math.trunc(Number(seva_score || 0)),
          p_previous_tier: spiritual_level,
          p_next_tier: newTier.key,
          p_title: title,
          p_body: body,
          p_notification_key: `seva-tier:${newTier.key}`,
          p_send_at: sendAt.toISOString(),
          p_metadata: {
            type: 'general',
            emoji: newTier.emoji,
            action_url: '/seva',
            timezone,
            local_date: localDateIso,
            tier: newTier.key,
          },
        },
      );

      if (updateError) {
        console.error('Error updating spiritual level and scheduling notification:', updateError);
        return NextResponse.json({ error: 'Failed to update spiritual level' }, { status: 500 });
      }

      const result = Array.isArray(updateResult) ? updateResult[0] : updateResult;
      if (!result?.profile_updated) {
        return NextResponse.json({ promoted: false, tier: newTier.key, reason: 'profile_changed_concurrently' });
      }

      return NextResponse.json({ 
        promoted: true, 
        from: spiritual_level, 
        to: newTier.key,
        notificationQueued: result.notification_queued,
      });
    }

    return NextResponse.json({ 
      promoted: false, 
      tier: newTier.key 
    });

  } catch (err: any) {
    console.error('Error in seva tier check route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
