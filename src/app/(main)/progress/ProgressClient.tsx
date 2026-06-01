'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Trophy } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';
import { RANK_META, computeRank, nextRankInfo } from '@/lib/rank-system';
import { generateActivityGrid } from '@/lib/activity-grid';

interface DailyKarma {
  date: string;
  totalKarma: number;
}

interface ProgressClientProps {
  userName: string;
  tradition: string;
  karmaPoints: number;
  dailyKarma: DailyKarma[];
  totalQuiz: number;
  quizAccuracy: number;
  activeDates: string[];
  spiritualToday: string;
}

export default function ProgressClient({
  userName,
  tradition,
  karmaPoints,
  dailyKarma,
  totalQuiz,
  quizAccuracy,
  activeDates,
  spiritualToday,
}: ProgressClientProps) {
  const meta = getTraditionMeta(tradition);
  const rank = computeRank(totalQuiz, quizAccuracy);
  const rankMeta = RANK_META[rank];
  const nextRank = nextRankInfo(rank, totalQuiz, quizAccuracy);

  const activityGrid = useMemo(() => {
    return generateActivityGrid(activeDates, spiritualToday, 28);
  }, [activeDates, spiritualToday]);

  // Prepare chart data (last 14 days)
  const chartData = useMemo(() => {
    const data = [];
    let maxKarma = 10; // floor for scaling
    for (let i = 13; i >= 0; i--) {
      const d = new Date(spiritualToday + 'T12:00:00Z');
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyKarma.find(k => k.date === dateStr);
      const karma = match ? match.totalKarma : 0;
      if (karma > maxKarma) maxKarma = karma;
      data.push({ date: dateStr, karma });
    }
    return { data, maxKarma };
  }, [dailyKarma, spiritualToday]);

  const glass = {
    background: 'var(--surface-soft)',
    border: '1px solid var(--card-border)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  };

  return (
    <div className="mx-auto max-w-md p-4 pb-32 pt-6">
      <div className="mb-8">
        <h1 className="premium-serif text-3xl text-[var(--text-cream)] mb-1">
          {userName}&apos;s Progress
        </h1>
        <p className="text-[var(--text-dim)] text-sm">
          Tracking your daily nitya sadhana and karma.
        </p>
      </div>

      <div className="space-y-6">
        {/* Karma Overview */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1 text-[var(--text-muted-warm)] text-sm font-medium tracking-wide uppercase">
            <TrendingUp size={16} />
            <h2>Karma Over Time</h2>
          </div>
          <div className="rounded-[1.4rem] p-5" style={glass}>
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-[var(--text-dim)] text-xs mb-1 uppercase tracking-wider">Total Karma</div>
                <div className="text-3xl font-medium text-[var(--text-cream)]">{karmaPoints}</div>
              </div>
              <div className="text-right">
                <div className="text-[var(--text-dim)] text-xs mb-1 uppercase tracking-wider">Rank</div>
                <div className="flex items-center gap-1.5" style={{ color: rankMeta.text }}>
                  <span className="text-xl">{rankMeta.emoji}</span>
                  <span className="font-semibold">{rank}</span>
                </div>
              </div>
            </div>

            {/* SVG Bar Chart */}
            <div className="relative h-32 w-full mt-4 flex items-end justify-between gap-1">
              {chartData.data.map((day, i) => {
                const heightPercent = Math.max(4, (day.karma / chartData.maxKarma) * 100);
                const isToday = day.date === spiritualToday;
                return (
                  <div key={day.date} className="relative flex flex-col items-center justify-end w-full h-full group">
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${heightPercent}%`, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 15,
                        delay: i * 0.03
                      }}
                      className="w-full rounded-t-sm"
                      style={{
                        background: isToday ? meta.accentColour : 'var(--text-dim)',
                        opacity: isToday ? 0.9 : 0.3
                      }}
                    />
                    {/* Tooltip on hover/tap */}
                    <div className="absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {day.karma} karma
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[var(--text-dim)] uppercase tracking-widest px-1">
              <span>14 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </section>

        {/* 28-Day Consistency */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1 text-[var(--text-muted-warm)] text-sm font-medium tracking-wide uppercase">
            <Calendar size={16} />
            <h2>28-Day Consistency</h2>
          </div>
          <div className="rounded-[1.4rem] p-5" style={glass}>
            <div className="grid grid-cols-7 gap-2">
              {activityGrid.map((active, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md transition-colors"
                  style={active
                    ? { background: `${meta.accentColour}30`, border: `1px solid ${meta.accentColour}50` }
                    : { background: 'var(--card-bg)', border: '1px solid var(--card-border)' }
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* Rank Progression */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1 text-[var(--text-muted-warm)] text-sm font-medium tracking-wide uppercase">
            <Trophy size={16} />
            <h2>Spiritual Rank</h2>
          </div>
          <div className="rounded-[1.4rem] p-5 relative overflow-hidden" style={glass}>
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{ background: `radial-gradient(circle at 90% 10%, ${meta.accentColour}, transparent 60%)` }}
            />
            <div className="flex items-start gap-4 relative z-10">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
                style={{ background: rankMeta.color, border: `1px solid ${rankMeta.border}` }}
              >
                {rankMeta.emoji}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-cream)] text-lg mb-0.5">{rank}</h3>
                <p className="text-sm text-[var(--text-dim)] mb-3">{rankMeta.desc}</p>
                {nextRank ? (
                  <div className="text-xs text-[var(--text-muted-warm)] bg-black/20 rounded-md p-2">
                    Next: {nextRank.next} ({nextRank.questionsNeeded} more quiz questions, {nextRank.accNeeded}% acc)
                  </div>
                ) : (
                  <div className="text-xs text-[var(--text-muted-warm)] bg-black/20 rounded-md p-2">
                    You have achieved the highest rank.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
