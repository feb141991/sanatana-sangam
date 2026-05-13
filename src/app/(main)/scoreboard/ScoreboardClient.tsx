'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, Search, 
  Crown, ArrowLeft, X, Share2, Send
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { shareScoreToWhatsApp } from '@/lib/whatsapp';
import BottomNav from '@/components/layout/BottomNav';

type LeaderboardUser = {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  seva_score: number;
  tradition: string | null;
  is_pro: boolean;
  active_symbol_id?: string | null;
};

export default function ScoreboardClient({ initialUsers, currentUserId }: { initialUsers: LeaderboardUser[], currentUserId?: string }) {
  const [users] = useState<LeaderboardUser[]>(initialUsers);
  const [filter, setFilter] = useState<'global' | 'tradition'>('global');
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserData = users.find(u => u.id === currentUserId);
  const currentUserRank = users.findIndex(u => u.id === currentUserId) + 1;

  const handleShare = () => {
    if (!currentUserData) return;
    const link = shareScoreToWhatsApp(
      currentUserData.full_name || currentUserData.username,
      currentUserData.seva_score,
      currentUserRank
    );
    window.open(link, '_blank');
  };

  const topThree = users.slice(0, 3);
  const others = users.slice(3).filter(u => 
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filter === 'global' || u.tradition)
  );

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 selection:bg-[#C5A059]/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft size={20} className="text-[var(--text-muted-warm)]" />
            </Link>
            <h1 className="text-xl font-bold font-serif theme-ink">Mandali Ranks</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(200,146,74,0.1)] border border-[rgba(200,146,74,0.2)]">
            <Trophy size={14} className="text-[#C5A059]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">Top Performers</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Share My Rank Card (if logged in) */}
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
        {/* Podium for Top 3 */}
        <div className="flex items-end justify-center gap-4 mb-12 pt-8">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full border-2 border-slate-300 overflow-hidden bg-[var(--surface-soft)] relative">
                  {topThree[1].avatar_url ? (
                    <Image src={topThree[1].avatar_url} alt={topThree[1].username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                      {getInitials(topThree[1].full_name || topThree[1].username)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white/20">
                  2nd
                </div>
              </div>
              <p className="text-[11px] font-bold theme-ink text-center line-clamp-1 w-16">{topThree[1].full_name || topThree[1].username}</p>
              <p className="text-[9px] text-[#C5A059] font-bold mt-0.5">{topThree[1].seva_score} pts</p>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="flex flex-col items-center scale-110 -translate-y-2">
              <div className="relative mb-3">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-500"
                >
                  <Crown size={22} fill="currentColor" strokeWidth={1} />
                </motion.div>
                <div className="w-16 h-16 rounded-full border-4 border-yellow-500 overflow-hidden bg-[var(--surface-soft)] shadow-2xl shadow-yellow-500/20 relative">
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
              <p className="text-xs font-bold theme-ink text-center line-clamp-1 w-20">{topThree[0].full_name || topThree[0].username}</p>
              <p className="text-[10px] text-[#C5A059] font-bold mt-0.5">{topThree[0].seva_score} pts</p>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full border-2 border-amber-600 overflow-hidden bg-[var(--surface-soft)] relative">
                  {topThree[2].avatar_url ? (
                    <Image src={topThree[2].avatar_url} alt={topThree[2].username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-600/60">
                      {getInitials(topThree[2].full_name || topThree[2].username)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white/20">
                  3rd
                </div>
              </div>
              <p className="text-[11px] font-bold theme-ink text-center line-clamp-1 w-16">{topThree[2].full_name || topThree[2].username}</p>
              <p className="text-[9px] text-[#C5A059] font-bold mt-0.5">{topThree[2].seva_score} pts</p>
            </div>
          )}
        </div>

        {/* Search & Tabs */}
        <div className="space-y-4 mb-6">
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

        {/* List of others */}
        <div className="space-y-2">
          {others.map((user, idx) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group flex items-center gap-4 p-3 rounded-2xl bg-[var(--surface-soft)] border border-black/[0.03] hover:border-[#C5A059]/30 transition-all cursor-pointer"
            >
              <div className="w-8 text-center text-xs font-bold text-[var(--text-dim)]">
                {idx + 4}
              </div>
              
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-black/5 shadow-inner relative">
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
                  {user.active_symbol_id && <span className="text-xs" title={user.active_symbol_id}>✨</span>}
                  {user.is_pro && <Crown size={12} className="text-yellow-600/60" />}
                </div>
                <p className="text-[10px] text-[var(--text-muted-warm)] uppercase tracking-wider font-bold">
                  {user.tradition || 'Sadhak'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold theme-ink">{user.seva_score}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">Seva</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
