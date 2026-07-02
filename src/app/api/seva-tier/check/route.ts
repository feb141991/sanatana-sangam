import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getTierFromScore } from '@/lib/seva-tiers';
import { sendOneSignalPush } from '@/lib/onesignal-server';

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
      .select('seva_score, spiritual_level')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { seva_score, spiritual_level } = profile;
    const newTier = getTierFromScore(seva_score || 0);

    // If tier has changed, update it
    if (newTier.key !== spiritual_level) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ spiritual_level: newTier.key })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating spiritual level:', updateError);
        return NextResponse.json({ error: 'Failed to update spiritual level' }, { status: 500 });
      }

      // Send promotion push notification
      const title = `${newTier.emoji} Tier Promotion — ${newTier.label}!`;
      const body = `You have risen to ${newTier.label} (${newTier.sanskrit}). Your sadhana is bearing fruit. 🙏`;
      
      await sendOneSignalPush({
        userIds: [user.id],
        title,
        body
      }).catch(e => {
        console.error('Failed to send tier promotion push:', e);
      });

      return NextResponse.json({ 
        promoted: true, 
        from: spiritual_level, 
        to: newTier.key 
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
