'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Trophy,
  Award,
  Coins,
  ChevronRight,
  ChevronLeft,
  Tv,
  HelpCircle,
  Check
} from 'lucide-react';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import TierBadge from '@/components/ui/TierBadge';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  options: string[];
  answered: boolean;
  user_selected: number | null;
  is_correct: boolean | null;
  correct_option_idx: number | null;
  explanation: string | null;
}

interface Pack {
  id: string;
  pack_number: number;
  title: string;
  is_free: boolean;
  unlocked: boolean;
  completed: boolean;
  score: number;
  questions: Question[];
}

interface LeaderboardUser {
  user_id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  tradition: string | null;
  active_symbol_id?: string | null;
  is_pro: boolean;
  total_score: number;
}

interface TraditionRank {
  tradition: string;
  total_score: number;
  participant_count: number;
  average_score: number;
}

interface ChallengeClientProps {
  userId: string;
  userProfile: {
    id: string;
    timezone: string | null;
    tradition: string | null;
    is_pro: boolean;
    karma_points: number;
    full_name: string | null;
    username: string;
  };
  initialChallenge: {
    id: string;
    month: string;
    theme: string;
    theme_sub: string | null;
  };
  initialPacks: Pack[];
  initialLeaderboard: LeaderboardUser[];
  initialTraditionRanks: TraditionRank[];
}

const TRADITION_EMOJI: Record<string, string> = {
  hindu: '🕉️',
  sikh: '☬',
  buddhist: '☸️',
  jain: '🤲'
};

const TRADITION_NAMES: Record<string, string> = {
  hindu: 'Hindu',
  sikh: 'Sikh',
  buddhist: 'Buddhist',
  jain: 'Jain'
};

export default function ChallengeClient({
  userId,
  userProfile,
  initialChallenge,
  initialPacks,
  initialLeaderboard,
  initialTraditionRanks
}: ChallengeClientProps) {
  // Application state
  const [challenge] = useState(initialChallenge);
  const [packs, setPacks] = useState<Pack[]>(initialPacks);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(initialLeaderboard);
  const [traditionRanks, setTraditionRanks] = useState<TraditionRank[]>(initialTraditionRanks);
  const [userKarma, setUserKarma] = useState(userProfile.karma_points);

  // UI Selection state
  const [selectedPackId, setSelectedPackId] = useState<string | null>(
    initialPacks.find(p => p.unlocked && !p.completed)?.id ||
    initialPacks.find(p => p.unlocked)?.id ||
    initialPacks[0]?.id ||
    null
  );
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Leaderboard filters
  const [lbFilter, setLbFilter] = useState<'global' | 'tradition' | 'stands'>('global');

  // Modals state
  const [unlockingPack, setUnlockingPack] = useState<Pack | null>(null);
  const [showCelebration, setShowCelebration] = useState<{
    type: 'pack' | 'month';
    karma: number;
    badgeName?: string;
  } | null>(null);

  // Loading state
  const [actionLoading, setActionLoading] = useState(false);
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);

  const activePack = packs.find(p => p.id === selectedPackId);
  const activeQuestions = activePack?.questions || [];
  const currentQuestion = activeQuestions[currentQuestionIdx];

  // Helper to refetch challenge state and leaderboards
  const refreshState = async () => {
    try {
      const res = await fetch('/api/challenge/current');
      if (res.ok) {
        const data = await res.json();
        setPacks(data.packs);
        setLeaderboard(data.leaderboards.overall);
        setTraditionRanks(data.leaderboards.tradition_ranks);
      }
    } catch (err) {
      console.error('Failed to refresh challenge state:', err);
    }
  };

  // Reset question index when active pack changes
  useEffect(() => {
    setCurrentQuestionIdx(0);
  }, [selectedPackId]);

  // Handle option click (answer submission)
  const handleAnswerSubmit = async (questionId: string, optionIdx: number) => {
    if (submittingAnswerId || !currentQuestion || currentQuestion.answered) return;

    setSubmittingAnswerId(questionId);
    try {
      const res = await fetch('/api/challenge/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, selected_idx: optionIdx })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to submit answer.');
        return;
      }

      // Update question state locally
      setPacks(prevPacks => {
        return prevPacks.map(p => {
          if (p.id !== selectedPackId) return p;
          return {
            ...p,
            score: data.pack_completed ? p.score + (data.correct ? 1 : 0) : p.score,
            completed: data.pack_completed || p.completed,
            questions: p.questions.map(q => {
              if (q.id !== questionId) return q;
              return {
                ...q,
                answered: true,
                user_selected: optionIdx,
                is_correct: data.correct,
                correct_option_idx: data.correct_option_idx,
                explanation: data.explanation
              };
            })
          };
        });
      });

      // Update karma points locally
      if (data.karma_earned > 0) {
        setUserKarma(prev => prev + data.karma_earned);
      }

      // Show celebration modal
      if (data.monthly_completed) {
        setShowCelebration({ type: 'month', karma: data.karma_earned, badgeName: 'Dharma Challenger' });
        refreshState();
      } else if (data.pack_completed) {
        setShowCelebration({ type: 'pack', karma: data.karma_earned });
        refreshState();
      } else {
        // Auto refresh rankings on correct answer to keep standings live
        if (data.correct) {
          refreshState();
        }
      }

    } catch (err) {
      console.error('Answer submission error:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  // Handle Pack unlock
  const handleUnlockPack = async (method: 'ad' | 'seva') => {
    if (!unlockingPack || actionLoading) return;

    if (method === 'seva' && userKarma < 50) {
      toast.error('Insufficient Seva Credits. Complete daily practices to earn more.');
      return;
    }

    setActionLoading(true);
    const toastId = toast.loading(method === 'ad' ? 'Watching Ad...' : 'Deducting credits...');

    try {
      const res = await fetch('/api/challenge/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: unlockingPack.id, method })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to unlock pack.', { id: toastId });
        return;
      }

      toast.success('Pack unlocked successfully!', { id: toastId });

      // Deduct credits locally if seva
      if (method === 'seva') {
        setUserKarma(prev => Math.max(0, prev - 50));
      }

      // Update pack unlocked status locally
      setPacks(prev => prev.map(p => p.id === unlockingPack.id ? { ...p, unlocked: true } : p));
      setSelectedPackId(unlockingPack.id);
      setUnlockingPack(null);

      // Fetch questions for the newly unlocked pack
      refreshState();

    } catch (err) {
      console.error('Unlock error:', err);
      toast.error('An error occurred during unlock.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // Compute progress details
  const totalPacks = packs.length;
  const completedPacks = packs.filter(p => p.completed).length;
  const progressPercent = totalPacks > 0 ? (completedPacks / totalPacks) * 100 : 0;

  // Filter leaderboard
  const filteredLeaderboard = leaderboard.filter(user => {
    if (lbFilter === 'tradition') {
      return user.tradition === userProfile.tradition;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 text-[var(--text-cream)]">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#C5A059]/15 via-[#C5A059]/5 to-transparent border border-[#C5A059]/10 p-6 sm:p-8 mb-8 mt-4 shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Award size={120} className="text-[#C5A059]" />
        </div>
        <div className="relative z-10">
          <span className="text-[10px] font-bold tracking-widest text-[#C5A059] uppercase bg-[#C5A059]/10 px-3 py-1 rounded-full border border-[#C5A059]/20">
            Monthly Dharma Challenge
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#text-cream] mt-4 mb-2">
            {challenge.theme}
          </h1>
          {challenge.theme_sub && (
            <p className="text-sm text-[var(--text-dim)] max-w-lg mb-6 leading-relaxed">
              {challenge.theme_sub}
            </p>
          )}

          {/* Progress bar */}
          <div className="bg-[var(--surface-soft)] rounded-2xl p-4 border border-black/5 dark:border-white/5">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold text-[var(--text-muted-warm)]">CHALLENGE PROGRESS</span>
              <span className="font-bold text-[#C5A059]">{completedPacks} / {totalPacks} Packs Complete</span>
            </div>
            <div className="h-2 w-full bg-black/20 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-[#C5A059] to-[#ebd29b] rounded-full"
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seva Credits Widget */}
      <div className="flex justify-between items-center mb-8 px-2">
        <div className="text-sm">
          <p className="text-[10px] font-bold tracking-widest text-[var(--text-dim)] uppercase">My Standings</p>
          <p className="text-base font-serif font-bold">Seeker of Wisdom</p>
        </div>
        <div className="flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/25 rounded-2xl px-4 py-2 shadow-sm">
          <Coins size={16} className="text-[#C5A059] animate-pulse" />
          <span className="text-sm font-bold text-[#C5A059]">{userKarma} Credits</span>
        </div>
      </div>

      {/* 2. Challenge Packs Section */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted-warm)] mb-4 px-2">
          Challenge Packs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {packs.map((pack) => {
            const isSelected = pack.id === selectedPackId;
            let cardStyle = 'border-black/5 dark:border-white/5 bg-[var(--surface-soft)] opacity-70';
            let iconColor = 'text-[var(--text-dim)]';

            if (pack.completed) {
              cardStyle = 'border-emerald-500/30 bg-emerald-500/5 shadow-sm';
              iconColor = 'text-emerald-500';
            } else if (pack.unlocked) {
              cardStyle = 'border-[#C5A059]/30 bg-[#C5A059]/5 shadow-sm';
              iconColor = 'text-[#C5A059]';
            }

            if (isSelected) {
              cardStyle += ' ring-2 ring-[#C5A059] ring-offset-2 ring-offset-[var(--divine-bg)]';
            }

            return (
              <motion.div
                key={pack.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  if (pack.unlocked) {
                    setSelectedPackId(pack.id);
                  } else {
                    setUnlockingPack(pack);
                  }
                }}
                className={`relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between h-32 ${cardStyle}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-[var(--text-dim)] tracking-wider">
                      PACK {pack.pack_number}
                    </span>
                    {pack.completed ? (
                      <CheckCircle size={18} className={iconColor} />
                    ) : pack.unlocked ? (
                      <Unlock size={16} className={iconColor} />
                    ) : (
                      <Lock size={16} className={iconColor} />
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-sm text-[var(--text-cream)] leading-snug line-clamp-2">
                    {pack.title}
                  </h3>
                </div>
                <div className="flex justify-between items-center text-[10px] font-semibold text-[var(--text-dim)]">
                  <span>{pack.questions.length} QUESTIONS</span>
                  {pack.completed ? (
                    <span className="text-emerald-500 font-bold">SCORE: {pack.score}/{pack.questions.length}</span>
                  ) : pack.unlocked ? (
                    <span className="text-[#C5A059]">Active</span>
                  ) : (
                    <span>Locked</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Question Area */}
      {activePack && activePack.unlocked && activeQuestions.length > 0 && (
        <div className="rounded-3xl border border-black/5 dark:border-white/5 bg-[var(--surface-soft)] p-6 mb-12 shadow-md">
          <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest">Active Pack</span>
              <h3 className="font-serif font-bold text-base mt-0.5">{activePack.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                className="p-2 rounded-xl bg-black/20 dark:bg-white/5 disabled:opacity-40 hover:bg-black/30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-[var(--text-dim)]">
                {currentQuestionIdx + 1} / {activeQuestions.length}
              </span>
              <button
                disabled={currentQuestionIdx === activeQuestions.length - 1}
                onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                className="p-2 rounded-xl bg-black/20 dark:bg-white/5 disabled:opacity-40 hover:bg-black/30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <p className="text-sm font-serif leading-relaxed font-bold">
                  {currentQuestion.question_text}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = currentQuestion.user_selected === idx;
                  const isCorrectIdx = currentQuestion.correct_option_idx === idx;
                  const hasAnswered = currentQuestion.answered;

                  let optionStyle = 'border-black/5 dark:border-white/5 bg-black/10 dark:bg-white/5 hover:bg-black/25 dark:hover:bg-white/10';
                  let icon = <span className="w-5 h-5 flex items-center justify-center rounded-full border border-[var(--text-dim)] text-[10px] font-bold">{['A', 'B', 'C', 'D'][idx]}</span>;

                  if (hasAnswered) {
                    if (isCorrectIdx) {
                      optionStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold';
                      icon = <CheckCircle size={18} className="text-emerald-500" />;
                    } else if (isSelected) {
                      optionStyle = 'border-red-500/40 bg-red-500/10 text-red-300';
                      icon = <XCircle size={18} className="text-red-500" />;
                    } else {
                      optionStyle = 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 opacity-50 cursor-default';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered || submittingAnswerId === currentQuestion.id}
                      onClick={() => handleAnswerSubmit(currentQuestion.id, idx)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${optionStyle}`}
                    >
                      <span className="shrink-0">{icon}</span>
                      <span className="text-xs">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {currentQuestion.answered && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-[#C5A059]/5 border border-[#C5A059]/20"
                >
                  <div className="flex gap-2 items-start">
                    <HelpCircle size={16} className="text-[#C5A059] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#C5A059] mb-1">Explanation</h4>
                      <p className="text-xs text-[var(--text-muted-warm)] leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* 4. Leaderboard Section */}
      <div className="rounded-3xl border border-black/5 dark:border-white/5 bg-[var(--surface-soft)] p-6 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#C5A059]" />
            <h3 className="font-serif font-bold text-base">Challenge Scoreboard</h3>
          </div>
          
          <div className="flex bg-black/20 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setLbFilter('global')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                lbFilter === 'global' ? 'bg-[#C5A059] text-white shadow-sm' : 'text-[var(--text-muted-warm)]'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setLbFilter('tradition')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                lbFilter === 'tradition' ? 'bg-[#C5A059] text-white shadow-sm' : 'text-[var(--text-muted-warm)]'
              }`}
            >
              Tradition
            </button>
            <button
              onClick={() => setLbFilter('stands')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                lbFilter === 'stands' ? 'bg-[#C5A059] text-white shadow-sm' : 'text-[var(--text-muted-warm)]'
              }`}
            >
              Traditions Stand
            </button>
          </div>
        </div>

        {/* Rankings rendering */}
        {lbFilter !== 'stands' ? (
          <div className="space-y-3">
            {filteredLeaderboard.length === 0 ? (
              <p className="text-center text-xs text-[var(--text-dim)] py-6">No challenge participants yet.</p>
            ) : (
              filteredLeaderboard.map((user, idx) => {
                const isCurrentUser = user.user_id === userId;
                return (
                  <div
                    key={user.user_id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      isCurrentUser
                        ? 'border-[#C5A059]/40 bg-gradient-to-r from-[#C5A059]/10 via-[#C5A059]/5 to-transparent'
                        : 'border-black/[0.03] bg-[var(--surface-soft)]'
                    }`}
                  >
                    <div className="w-8 text-center text-xs font-bold text-[var(--text-dim)]">
                      #{idx + 1}
                    </div>

                    <div className="relative">
                      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-white/10 shadow-inner border border-[#C5A059]/20 flex items-center justify-center text-xs font-bold">
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
                        ) : (
                          getInitials(user.full_name || user.username)
                        )}
                      </div>
                      {user.tradition && (
                        <div className="absolute -bottom-1 -right-1 text-xs">
                          {TRADITION_EMOJI[user.tradition]}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[var(--text-cream)]">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-[10px] text-[var(--text-dim)]">@{user.username}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-[#C5A059]">{user.total_score} pts</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {traditionRanks.length === 0 ? (
              <p className="text-center text-xs text-[var(--text-dim)] py-6">No tradition stats computed.</p>
            ) : (
              traditionRanks.map((rank, idx) => {
                return (
                  <div
                    key={rank.tradition}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-black/[0.03] bg-[var(--surface-soft)]"
                  >
                    <div className="w-8 text-center text-xs font-bold text-[var(--text-dim)]">
                      #{idx + 1}
                    </div>

                    <div className="text-2xl px-1">
                      {TRADITION_EMOJI[rank.tradition] || '🕉️'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[var(--text-cream)]">
                        {TRADITION_NAMES[rank.tradition] || rank.tradition} Path
                      </h4>
                      <p className="text-[10px] text-[var(--text-dim)]">
                        {rank.participant_count} Sadhaks · {rank.average_score} Avg Score
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-[#C5A059]">{rank.total_score} Total Pts</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 5. Modals & Overlay celebrate animations */}

      {/* Unlock Pack Modal */}
      {unlockingPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-[var(--surface-soft)] border border-[#C5A059]/30 p-6 shadow-2xl relative"
          >
            <h3 className="font-serif font-bold text-lg text-[var(--text-cream)] mb-2">
              Unlock Pack {unlockingPack.pack_number}
            </h3>
            <p className="text-xs text-[var(--text-dim)] mb-6">
              Unlock &ldquo;{unlockingPack.title}&rdquo; to access the curated spiritual Q&A. Complete this pack to earn +15 Karma points!
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={actionLoading}
                onClick={() => handleUnlockPack('ad')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/20 border border-black/10 hover:border-[#C5A059]/30 hover:bg-black/35 transition-colors group"
              >
                <Tv size={24} className="text-[#C5A059] mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Watch Ad</span>
                <span className="text-[9px] text-[var(--text-dim)]">Free Unlock</span>
              </button>

              <button
                disabled={actionLoading || userKarma < 50}
                onClick={() => handleUnlockPack('seva')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-colors group ${
                  userKarma >= 50
                    ? 'bg-black/20 border-black/10 hover:border-amber-500/40 hover:bg-black/35'
                    : 'bg-black/10 border-black/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <Coins size={24} className="text-[#C5A059] mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Spend Credits</span>
                <span className="text-[9px] text-amber-500 font-semibold">50 Seva Credits</span>
              </button>
            </div>

            <button
              onClick={() => setUnlockingPack(null)}
              className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-[var(--text-dim)] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* Celebrations Popups */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl bg-[var(--surface-soft)] border-2 border-yellow-500 p-6 text-center shadow-2xl relative"
          >
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
              <Award size={48} className="text-yellow-500 animate-bounce" />
            </div>

            {showCelebration.type === 'pack' ? (
              <>
                <h3 className="font-serif font-bold text-xl text-[var(--text-cream)] mb-2">
                  Pack Completed!
                </h3>
                <p className="text-xs text-[var(--text-dim)] mb-6">
                  Beautifully done! You have completed all questions in this pack and successfully earned:
                </p>
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 font-bold px-4 py-2 rounded-full border border-yellow-500/30 mb-6">
                  <Coins size={16} />
                  <span>+{showCelebration.karma} Karma Points</span>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-serif font-bold text-xl text-yellow-500 mb-2">
                  Dharma Master!
                </h3>
                <p className="text-xs text-[var(--text-dim)] mb-4">
                  Incredible! You have completed the entire Monthly Dharma Challenge.
                </p>
                <p className="text-xs text-[var(--text-dim)] mb-6 font-bold">
                  You unlocked the badge: <span className="text-[#C5A059]">{showCelebration.badgeName}</span> 🏆
                </p>
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 font-bold px-4 py-2 rounded-full border border-yellow-500/30 mb-6">
                  <Coins size={16} />
                  <span>+{showCelebration.karma} Karma Points</span>
                </div>
              </>
            )}

            <button
              onClick={() => setShowCelebration(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-[#C5A059] text-white font-bold text-xs shadow-lg hover:shadow-yellow-500/20 transition-all"
            >
              Continue Journey
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
