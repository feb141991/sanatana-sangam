import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { question_id, selected_idx } = await req.json();

    if (!question_id || typeof selected_idx !== 'number') {
      return NextResponse.json({ error: 'question_id and selected_idx are required.' }, { status: 400 });
    }

    // 1. Fetch question details
    const { data: question, error: questionError } = await supabase
      .from('challenge_questions')
      .select('*')
      .eq('id', question_id)
      .maybeSingle();

    if (questionError) throw questionError;
    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }

    // 2. Fetch pack details
    const { data: pack, error: packError } = await supabase
      .from('challenge_packs')
      .select('*')
      .eq('id', question.pack_id)
      .maybeSingle();

    if (packError) throw packError;
    if (!pack) {
      return NextResponse.json({ error: 'Pack not found.' }, { status: 404 });
    }

    // 3. Fetch user progress for this pack
    let { data: progress, error: progressError } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('pack_id', pack.id)
      .maybeSingle();

    if (progressError) throw progressError;

    const isUnlocked = pack.is_free || (progress && progress.unlocked);
    if (!isUnlocked) {
      return NextResponse.json({ error: 'Pack is locked. Unlock it first.' }, { status: 403 });
    }

    // 4. Initialize progress if it doesn't exist (e.g. for free packs)
    let answers = progress?.answers || {};
    let score = progress?.score || 0;
    let completed = progress?.completed || false;

    // 5. If question already answered, return cached result
    if (answers[question.id]) {
      return NextResponse.json({
        success: true,
        correct: answers[question.id].is_correct,
        correct_option_idx: question.correct_option_idx,
        explanation: question.explanation,
        already_answered: true
      });
    }

    // 6. Check if correct
    const isCorrect = selected_idx === question.correct_option_idx;
    answers[question.id] = { selected: selected_idx, is_correct: isCorrect };
    const newScore = isCorrect ? score + 1 : score;

    const today = new Date().toISOString().slice(0, 10);
    let karmaEarned = 0;

    // Award +3 karma for correct answer
    if (isCorrect) {
      const { data: awardData, error: awardError } = await supabase.rpc('award_karma', {
        p_user_id: user.id,
        p_reason: `challenge_correct_${question.id}`,
        p_amount: 3,
        p_date: today,
        p_daily_cap: 500,
        p_source_route: '/api/challenge/answer'
      });

      if (awardError) console.error('[challenge/answer] Karma award error:', awardError.message);
      else {
        const result = awardData as { status: string; karma_earned: number };
        if (result.status === 'ok') {
          karmaEarned += 3;
        }
      }
    }

    // 7. Check if pack is now complete
    const { data: packQuestions, error: pqError } = await supabase
      .from('challenge_questions')
      .select('id')
      .eq('pack_id', pack.id);

    if (pqError) throw pqError;
    const totalQuestions = packQuestions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    const packJustCompleted = !completed && answeredCount === totalQuestions;

    if (packJustCompleted) {
      completed = true;

      // Award +15 karma for pack completion
      const { data: packAward, error: packAwardErr } = await supabase.rpc('award_karma', {
        p_user_id: user.id,
        p_reason: `challenge_pack_complete_${pack.id}`,
        p_amount: 15,
        p_date: today,
        p_daily_cap: 500,
        p_source_route: '/api/challenge/answer'
      });

      if (packAwardErr) console.error('[challenge/answer] Pack completion karma error:', packAwardErr.message);
      else {
        const result = packAward as { status: string; karma_earned: number };
        if (result.status === 'ok') {
          karmaEarned += 15;
        }
      }

      // Check for perfect score (all questions in the pack answered correctly)
      const isPerfectScore = newScore === totalQuestions;
      if (isPerfectScore) {
        const { data: perfectAward, error: perfectAwardErr } = await supabase.rpc('award_karma', {
          p_user_id: user.id,
          p_reason: `challenge_perfect_${pack.id}`,
          p_amount: 25,
          p_date: today,
          p_daily_cap: 500,
          p_source_route: '/api/challenge/answer'
        });

        if (perfectAwardErr) console.error('[challenge/answer] Perfect score karma error:', perfectAwardErr.message);
        else {
          const result = perfectAward as { status: string; karma_earned: number };
          if (result.status === 'ok') {
            karmaEarned += 25;
          }
        }
      }
    }

    // 8. Update progress state in DB
    const { error: upsertError } = await supabase
      .from('user_challenge_progress')
      .upsert({
        user_id: user.id,
        pack_id: pack.id,
        unlocked: true,
        completed,
        score: newScore,
        answers,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,pack_id' });

    if (upsertError) throw upsertError;

    // 9. If pack was just completed, check if all challenge packs are completed (Month complete)
    let monthlyChallengeCompleted = false;
    if (packJustCompleted) {
      const { data: siblingPacks, error: siblingError } = await supabase
        .from('challenge_packs')
        .select('id')
        .eq('challenge_id', pack.challenge_id);

      if (siblingError) throw siblingError;

      const siblingPackIds = siblingPacks.map(p => p.id);

      const { data: completedProgressRows, error: compProgressError } = await supabase
        .from('user_challenge_progress')
        .select('pack_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('pack_id', siblingPackIds);

      if (compProgressError) throw compProgressError;

      const completedPackIdsSet = new Set((completedProgressRows || []).map(r => r.pack_id));

      const allCompleted = siblingPackIds.every(id => completedPackIdsSet.has(id));

      if (allCompleted) {
        monthlyChallengeCompleted = true;

        // Award +50 karma for monthly challenge completion
        const { data: monthAward, error: monthAwardErr } = await supabase.rpc('award_karma', {
          p_user_id: user.id,
          p_reason: `monthly_challenge_complete_${pack.challenge_id}`,
          p_amount: 50,
          p_date: today,
          p_daily_cap: 500,
          p_source_route: '/api/challenge/answer'
        });

        if (monthAwardErr) console.error('[challenge/answer] Month completion karma error:', monthAwardErr.message);
        else {
          const result = monthAward as { status: string; karma_earned: number };
          if (result.status === 'ok') {
            karmaEarned += 50;
          }
        }

        // Award the "monthly_challenge_complete" badge
        const { data: badgeAwarded, error: badgeError } = await supabase.rpc('award_badge_if_earned', {
          p_user_id: user.id,
          p_badge_slug: 'monthly_challenge_complete',
          p_context: JSON.stringify({ challenge_id: pack.challenge_id })
        });

        if (badgeError) console.error('[challenge/answer] Badge award error:', badgeError.message);
      }
    }

    return NextResponse.json({
      success: true,
      correct: isCorrect,
      correct_option_idx: question.correct_option_idx,
      explanation: question.explanation,
      karma_earned: karmaEarned,
      pack_completed: packJustCompleted,
      monthly_completed: monthlyChallengeCompleted
    });
  } catch (err: any) {
    console.error('[challenge/answer] POST error:', err);
    return NextResponse.json({ error: 'Failed to submit answer.' }, { status: 500 });
  }
}
