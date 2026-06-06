import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ChallengeClient from './ChallengeClient';

export const metadata = {
  title: 'Monthly Dharma Challenge — Shoonaya',
  description: 'Deepen your knowledge of ancient wisdom, unlock Q&A packs, and compete with your spiritual community.',
};

export default async function ChallengePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, timezone, tradition, is_pro, karma_points, full_name, username')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // 2. Determine current month
  const userTimezone = profile.timezone || 'Asia/Kolkata';
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value || '2026';
  const month = parts.find(p => p.type === 'month')?.value || '06';
  const currentMonth = `${year}-${month}`;

  // 3. Fetch challenge details
  let { data: challenge } = await supabase
    .from('monthly_challenges')
    .select('id, month, title, description, tradition, theme, theme_sub, cover_image_url, created_at')
    .eq('month', currentMonth)
    .maybeSingle();

  // Fallback to most recent challenge if current month is not seeded yet
  if (!challenge) {
    const { data: latestChallenge } = await supabase
      .from('monthly_challenges')
      .select('id, month, title, description, tradition, theme, theme_sub, cover_image_url, created_at')
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle();
    challenge = latestChallenge;
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--divine-bg)] px-6 text-center">
        <h1 className="text-xl font-bold font-serif theme-ink mb-2">No Active Challenge</h1>
        <p className="text-sm text-[var(--text-dim)] max-w-sm">
          There is no Dharma Challenge active right now. Please check back later!
        </p>
      </div>
    );
  }

  // 4. Fetch packs
  const { data: packs } = await supabase
    .from('challenge_packs')
    .select('id, pack_number, title, is_free, challenge_id')
    .eq('challenge_id', challenge.id)
    .order('pack_number', { ascending: true });

  const packIds = (packs || []).map(p => p.id);

  // 5. Fetch questions
  const { data: questions } = packIds.length > 0
    ? await supabase
        .from('challenge_questions')
        .select('id, pack_id, question_number, question_text, options, correct_option_idx, explanation')
        .in('pack_id', packIds)
        .order('question_number', { ascending: true })
    : { data: [] };

  // 6. Fetch user progress
  const { data: progressList } = packIds.length > 0
    ? await supabase
        .from('user_challenge_progress')
        .select('pack_id, unlocked, completed, score, answers')
        .eq('user_id', user.id)
        .in('pack_id', packIds)
    : { data: [] };

  const progressMap = new Map<string, any>();
  if (progressList) {
    for (const p of progressList) {
      progressMap.set(p.pack_id, p);
    }
  }

  // 7. Fetch leaderboards
  const [leaderboardResult, traditionRanksResult] = await Promise.all([
    supabase.rpc('get_challenge_leaderboard', { p_challenge_id: challenge.id }),
    supabase.rpc('get_challenge_tradition_ranks', { p_challenge_id: challenge.id })
  ]);

  const overallLeaderboard = leaderboardResult.data || [];
  const traditionRanks = traditionRanksResult.data || [];

  // 8. Obfuscate answer details for unanswered questions to prevent front-end cheating
  const formattedPacks = (packs || []).map((pack) => {
    const progress = progressMap.get(pack.id);
    const isUnlocked = pack.is_free || !!(progress && progress.unlocked);
    const isCompleted = !!(progress && progress.completed);
    const score = progress?.score || 0;
    const answers = progress?.answers || {};

    const packQuestions = (questions || [])
      .filter(q => q.pack_id === pack.id)
      .map((q) => {
        const userAnswer = answers[q.id];
        const isAnswered = !!userAnswer;
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
      questions: isUnlocked ? packQuestions : []
    };
  });

  return (
    <ChallengeClient
      userId={user.id}
      userProfile={profile}
      initialChallenge={challenge}
      initialPacks={formattedPacks}
      initialLeaderboard={overallLeaderboard}
      initialTraditionRanks={traditionRanks}
    />
  );
}
