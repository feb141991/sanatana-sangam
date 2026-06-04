import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get user profile, timezone and pro status
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, timezone, tradition, is_pro, subscription_status')
      .eq('id', user.id)
      .single();

    const isZenith = profile?.is_pro === true ||
      profile?.subscription_status === 'pro' ||
      profile?.subscription_status === 'kul_pro';

    const userTimezone = profile?.timezone || 'Asia/Kolkata';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit'
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value || '2026';
    const month = parts.find(p => p.type === 'month')?.value || '06';
    const currentMonth = `${year}-${month}`;

    // 2. Fetch monthly challenge for current month
    let { data: challenge, error: challengeError } = await supabase
      .from('monthly_challenges')
      .select('*')
      .eq('month', currentMonth)
      .maybeSingle();

    if (challengeError) throw challengeError;

    // Fallback: If no challenge exists for current month, get the most recent one
    if (!challenge) {
      const { data: latestChallenge, error: latestError } = await supabase
        .from('monthly_challenges')
        .select('*')
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) throw latestError;
      challenge = latestChallenge;
    }

    if (!challenge) {
      return NextResponse.json({ error: 'No active challenge found.' }, { status: 404 });
    }

    const challengeId = challenge.id;

    // 3. Fetch challenge packs
    const { data: packs, error: packsError } = await supabase
      .from('challenge_packs')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('pack_number', { ascending: true });

    if (packsError) throw packsError;

    if (!packs || packs.length === 0) {
      return NextResponse.json({
        challenge,
        packs: [],
        leaderboards: { overall: [], tradition_ranks: [] }
      });
    }

    const packIds = packs.map(p => p.id);

    // 4. Fetch all questions for these packs
    const { data: questions, error: questionsError } = await supabase
      .from('challenge_questions')
      .select('*')
      .in('pack_id', packIds)
      .order('question_number', { ascending: true });

    if (questionsError) throw questionsError;

    // 5. Fetch user progress for these packs
    const { data: progressList, error: progressError } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('pack_id', packIds);

    if (progressError) throw progressError;

    const progressMap = new Map<string, any>();
    if (progressList) {
      for (const p of progressList) {
        progressMap.set(p.pack_id, p);
      }
    }

    // 6. Fetch Leaderboard and Tradition rankings via RPCs
    const [leaderboardResult, traditionRanksResult] = await Promise.all([
      supabase.rpc('get_challenge_leaderboard', { p_challenge_id: challengeId }),
      supabase.rpc('get_challenge_tradition_ranks', { p_challenge_id: challengeId })
    ]);

    const overallLeaderboard = leaderboardResult.data || [];
    const traditionRanks = traditionRanksResult.data || [];

    // 7. Format packs and obfuscate questions to prevent inspect-element cheating
    const formattedPacks = packs.map((pack) => {
      const progress = progressMap.get(pack.id);
      // Zenith users get all packs auto-unlocked — no ads, no seva spend
      const isUnlocked = pack.is_free || isZenith || !!(progress && progress.unlocked);
      const isCompleted = !!(progress && progress.completed);
      const score = progress?.score || 0;
      const answers = progress?.answers || {};

      // Filter questions for this pack
      const packQuestions = (questions || [])
        .filter(q => q.pack_id === pack.id)
        .map((q) => {
          const userAnswer = answers[q.id];
          const isAnswered = !!userAnswer;

          // If pack is completed OR this specific question was already answered,
          // it's safe to return the correct option index and explanation.
          // Otherwise, we strip them to prevent cheating.
          const showAnswerDetails = isCompleted || isAnswered;

          return {
            id: q.id,
            question_number: q.question_number,
            question_text: q.question_text,
            options: q.options,
            answered: isAnswered,
            user_selected: isAnswered ? userAnswer.selected : null,
            is_correct: isAnswered ? userAnswer.is_correct : null,
            correct_option_idx: showAnswerDetails ? q.correct_option_idx : null,
            explanation: showAnswerDetails ? q.explanation : null
          };
        });

      return {
        id: pack.id,
        pack_number: pack.pack_number,
        title: pack.title,
        is_free: pack.is_free,
        unlocked: isUnlocked,
        completed: isCompleted,
        score,
        questions: isUnlocked ? packQuestions : [] // Only return questions if unlocked
      };
    });

    return NextResponse.json({
      challenge,
      packs: formattedPacks,
      is_zenith: isZenith,   // client uses this to hide "Watch Ad" for pro users
      leaderboards: {
        overall: overallLeaderboard,
        tradition_ranks: traditionRanks
      }
    });
  } catch (err: any) {
    console.error('[challenge/current] GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve current monthly challenge.' }, { status: 500 });
  }
}
