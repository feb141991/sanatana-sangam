'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Crown,
  Search,
  Share2,
  Star,
  Trophy,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { shareScoreToWhatsApp } from '@/lib/whatsapp';
import TierBadge from '@/components/ui/TierBadge';
import { getTierFromScore } from '@/lib/seva-tiers';
import { SACRED_RELICS } from '@/lib/relics';
import { getRelicFrame } from '@/lib/relic-frames';

type LeaderboardUser = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  seva_score: number;
  weekly_seva?: number | null;
  monthly_seva?: number | null;
  tradition: string | null;
  is_pro: boolean;
  active_symbol_id?: string | null;
};

type LeaderboardPeriod = 'all' | 'weekly' | 'monthly';

function getScoreForPeriod(user: LeaderboardUser, period: LeaderboardPeriod) {
  if (period === 'weekly') return user.weekly_seva ?? 0;
  if (period === 'monthly') return user.monthly_seva ?? 0;
  return user.seva_score ?? 0;
}

function getListRelicBorder(activeSymbolId: string | null | undefined) {
  const frame = getRelicFrame(activeSymbolId);
  return frame?.border ?? '1px solid rgba(197,160,89,0.18)';
}

export default function ScoreboardClient({
  initialUsers,
  weeklyUsers,
  monthlyUsers,
  currentUserId,
  currentUserTradition,
}: {
  initialUsers: LeaderboardUser[];
  weeklyUsers: LeaderboardUser[];
  monthlyUsers: LeaderboardUser[];
  currentUserId?: string;
  currentUserTradition?: string | null;
}) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [filter, setFilter] = useState<'global' | 'tradition'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [communityInsight, setCommunityInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  const users = period === 'weekly'
    ? weeklyUsers
    : period === 'monthly'
      ? monthlyUsers
      : initialUsers;

  useEffect(() => {
    async function fetchInsight() {
      try {
        const res = await fetch('/api/community/insight');
        const data = await res.json();
        if (data.insight) {
          setCommunityInsight(data.insight);
        }
      } catch (err) {
        console.error('Failed to fetch community insight:', err);
      } finally {
        setInsightLoading(false);
      }
    }
    fetchInsight();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'global' || (!!currentUserTradition && user.tradition === currentUserTradition);
      return Boolean(matchesSearch) && matchesFilter;
    });
  }, [filter, searchQuery, users, currentUserTradition]);

  const currentUserData = users.find((u) => u.id === currentUserId);
  const currentUserRank = users.findIndex((u) => u.id === currentUserId) + 1;

  const handleShare = () => {
    if (!currentUserData) return;
    const link = shareScoreToWhatsApp(
      currentUserData.full_name || currentUserData.username,
      getScoreForPeriod(currentUserData, period),
      currentUserRank
    );
    window.open(link, '_blank');
  };

  const topThree = filteredUsers.slice(0, 3);
  const others = filteredUsers.slice(3);
  const getRelic = (activeSymbolId?: string | null) => SACRED_RELICS.find((relic) => relic.id === activeSymbolId) ?? null;

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 selection:bg-[#C5A059]/30">
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft size={20} className="text-[var(--text-muted-warm)]" />
            </Link>
            <h1 className="text-xl font-bold font-serif theme-ink">Mandali Ranks</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(197,160,89,0.1)] border border-[rgba(197,160,89,0.2)]">
            <Trophy size={14} className="text-[#C5A059]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">Top Performers</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          {insightLoading ? (
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 animate-pulse h-12" />
          ) : communityInsight ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-center text-sm font-serif text-amber-600 dark:text-amber-200/80 italic">
                &ldquo;{communityInsight}&rdquo;
              </p>
            </div>
          ) : null}
        </div>

        {currentUserData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-[#C5A059]/10 via-[#C5A059]/5 to-transparent border border-[#C5A059]/20 flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest mb-1">Your Standing</p>
              <h2 className="text-lg font-serif theme-ink">Ranked #{currentUserRank}</h2>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] transition-colors shadow-lg shadow-[#25D366]/20"
            >
              <Share2 size={14} />
              Share on WhatsApp
            </button>
          </motion.div>
        )}

        <div className="flex items-end justify-center gap-4 mb-12 pt-8">
          {topThree[1] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div
                  className="w-14 h-14 rounded-full overflow-hidden bg-[var(--surface-soft)] relative"
                  style={{
                    border: getRelicFrame(topThree[1].active_symbol_id)?.border ?? '2px solid rgba(197,160,89,0.40)',
                    boxShadow: getRelicFrame(topThree[1].active_symbol_id)?.shadow ?? 'none',
                    transition: 'border 0.4s ease, box-shadow 0.4s ease',
                  }}
                >
                  {topThree[1].avatar_url ? (
                    <Image src={topThree[1].avatar_url} alt={topThree[1].username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                      {getInitials(topThree[1].full_name || topThree[1].username)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--surface-raised)] text-[#C5A059] text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-[#C5A059]/40">
                  2nd
                </div>
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1">
                <p className="text-[11px] font-bold theme-ink text-center line-clamp-1 w-16">{topThree[1].full_name || topThree[1].username}</p>
                {getRelic(topThree[1].active_symbol_id) && (
                  <Image
                    src={getRelic(topThree[1].active_symbol_id)!.imageUrl}
                    alt={getRelic(topThree[1].active_symbol_id)!.name}
                    title={getRelic(topThree[1].active_symbol_id)!.name}
                    width={14}
                    height={14}
                    unoptimized
                    className="rounded-full opacity-80"
                  />
                )}
              </div>
              <div className="mt-1">
                <TierBadge sevaScore={topThree[1].seva_score || 0} size="sm" />
              </div>
              <p className="text-[9px] text-[#C5A059] font-bold mt-0.5">{getScoreForPeriod(topThree[1], period)} pts</p>
            </div>
          )}

          {topThree[0] && (
            <div className="flex flex-col items-center scale-110 -translate-y-2">
              <div className="relative mb-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-500">
                  <Crown size={22} fill="currentColor" strokeWidth={1} />
                </motion.div>
                <div
                  className="w-16 h-16 rounded-full overflow-hidden bg-[var(--surface-soft)] relative"
                  style={{
                    border: getRelicFrame(topThree[0].active_symbol_id)?.border ?? '4px solid rgba(234,179,8,0.9)',
                    boxShadow: getRelicFrame(topThree[0].active_symbol_id)?.shadow ?? '0 0 16px rgba(234,179,8,0.2)',
                    transition: 'border 0.4s ease, box-shadow 0.4s ease',
                  }}
                >
                  {topThree[0].avatar_url ? (
                    <Image src={topThree[0].avatar_url} alt={topThree[0].username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base font-bold text-yellow-600/60">
                      {getInitials(topThree[0].full_name || topThree[0].username)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  1st
                </div>
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1">
                <p className="text-xs font-bold theme-ink text-center line-clamp-1 w-20">{topThree[0].full_name || topThree[0].username}</p>
                {getRelic(topThree[0].active_symbol_id) && (
                  <Image
                    src={getRelic(topThree[0].active_symbol_id)!.imageUrl}
                    alt={getRelic(topThree[0].active_symbol_id)!.name}
                    title={getRelic(topThree[0].active_symbol_id)!.name}
                    width={14}
                    height={14}
                    unoptimized
                    className="rounded-full opacity-80"
                  />
                )}
              </div>
              <div className="mt-1">
                <TierBadge sevaScore={topThree[0].seva_score || 0} size="sm" />
              </div>
              <p className="text-[10px] text-[#C5A059] font-bold mt-0.5">{getScoreForPeriod(topThree[0], period)} pts</p>
            </div>
          )}

          {topThree[2] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div
                  className="w-14 h-14 rounded-full overflow-hidden bg-[var(--surface-soft)] relative"
                  style={{
                    border: getRelicFrame(topThree[2].active_symbol_id)?.border ?? '2px solid rgba(197,160,89,0.60)',
                    boxShadow: getRelicFrame(topThree[2].active_symbol_id)?.shadow ?? 'none',
                    transition: 'border 0.4s ease, box-shadow 0.4s ease',
                  }}
                >
                  {topThree[2].avatar_url ? (
                    <Image src={topThree[2].avatar_url} alt={topThree[2].username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-600/60">
                      {getInitials(topThree[2].full_name || topThree[2].username)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--surface-raised)] text-[#C5A059] text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-[#C5A059]/60">
                  3rd
                </div>
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1">
                <p className="text-[11px] font-bold theme-ink text-center line-clamp-1 w-16">{topThree[2].full_name || topThree[2].username}</p>
                {getRelic(topThree[2].active_symbol_id) && (
                  <Image
                    src={getRelic(topThree[2].active_symbol_id)!.imageUrl}
                    alt={getRelic(topThree[2].active_symbol_id)!.name}
                    title={getRelic(topThree[2].active_symbol_id)!.name}
                    width={14}
                    height={14}
                    unoptimized
                    className="rounded-full opacity-80"
                  />
                )}
              </div>
              <div className="mt-1">
                <TierBadge sevaScore={topThree[2].seva_score || 0} size="sm" />
              </div>
              <p className="text-[9px] text-[#C5A059] font-bold mt-0.5">{getScoreForPeriod(topThree[2], period)} pts</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex bg-[var(--surface-raised)] rounded-2xl p-1 border border-black/5 dark:border-white/5 shadow-sm">
            {[
              { value: 'all' as const, label: 'All Time' },
              { value: 'weekly' as const, label: 'This Week' },
              { value: 'monthly' as const, label: 'This Month' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={`relative flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  period === tab.value ? 'theme-ink' : 'text-[var(--text-muted-warm)] hover:text-ink'
                }`}
              >
                {period === tab.value && (
                  <motion.span
                    layoutId="scoreboard-period-pill"
                    className="absolute inset-0 rounded-xl bg-white dark:bg-black/20 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex bg-[var(--surface-raised)] rounded-2xl p-1 border border-black/5 dark:border-white/5 shadow-sm">
            <button
              onClick={() => setFilter('global')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'global' ? 'bg-white dark:bg-black/20 shadow-sm theme-ink' : 'text-[var(--text-muted-warm)] hover:text-ink'}`}
            >
              Global
            </button>
            <button
              onClick={() => setFilter('tradition')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'tradition' ? 'bg-white dark:bg-black/20 shadow-sm theme-ink' : 'text-[var(--text-muted-warm)] hover:text-ink'}`}
            >
              Tradition
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={16} />
            <input
              type="text"
              placeholder="Search disciples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-raised)] border border-black/5 dark:border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm theme-ink placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-2"
          >
            {others.map((user, idx) => {
              const tier = getTierFromScore(user.seva_score || 0);
              const isHighTier = tier.key === 'rishi' || tier.key === 'mahatma';
              
              return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`group flex items-center gap-4 p-3 rounded-2xl bg-[var(--surface-soft)] border transition-all cursor-pointer ${
                  isHighTier ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-500/60' : 'border-black/[0.03] hover:border-[#C5A059]/30'
                }`}
              >
                <div className="w-8 text-center text-xs font-bold text-[var(--text-dim)]">
                  {idx + 4}
                </div>

                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shadow-inner relative"
                    style={{
                      border: getListRelicBorder(user.active_symbol_id),
                      transition: 'border 0.4s ease, box-shadow 0.4s ease',
                    }}
                  >
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--text-dim)]">
                        {getInitials(user.full_name || user.username)}
                      </div>
                    )}
                  </div>
                  {user.is_pro && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center border border-white">
                      <Star size={8} className="text-white" fill="currentColor" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold theme-ink">{user.full_name || user.username}</p>
                    {getRelic(user.active_symbol_id) && (
                      <Image
                        src={getRelic(user.active_symbol_id)!.imageUrl}
                        alt={getRelic(user.active_symbol_id)!.name}
                        title={getRelic(user.active_symbol_id)!.name}
                        width={14}
                        height={14}
                        unoptimized
                        className="rounded-full opacity-80"
                      />
                    )}
                    {user.is_pro && <Crown size={12} className="text-yellow-600/60" />}
                  </div>
                  <div className="mt-0.5">
                    <TierBadge sevaScore={user.seva_score || 0} size="sm" />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold theme-ink">{getScoreForPeriod(user, period)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">Seva</p>
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
