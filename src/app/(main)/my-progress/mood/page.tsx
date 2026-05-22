'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, Sparkles, Activity, CheckCircle2, TrendingUp, CalendarDays } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { MoodInsightMetrics } from '@/lib/mood/insights';

export default function MoodInsightsPage() {
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [metrics, setMetrics] = useState<MoodInsightMetrics | null>(null);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async (tf: 'weekly' | 'monthly') => {
    try {
      const res = await fetch(`/api/mood/insights/${tf}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAiReflection = async () => {
    try {
      const res = await fetch('/api/mood/reflection-summary');
      if (res.ok) {
        const data = await res.json();
        setAiReflection(data.summary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMetrics(timeframe).finally(() => setLoading(false));
  }, [timeframe]);

  useEffect(() => {
    if (!aiReflection) {
      fetchAiReflection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const h1 = isDark ? '#f5dfa0' : '#1a0a02';
  const muted = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.92)';
  const border = isDark ? 'rgba(200,146,74,0.14)' : 'rgba(180,120,40,0.14)';

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-colour)' }}>
      {/* App Bar */}
      <div className="sticky top-0 z-50 px-4 pt-12 pb-4 backdrop-blur-xl border-b"
        style={{ borderBottomColor: border, background: isDark ? 'rgba(19,14,8,0.8)' : 'rgba(253,246,236,0.8)' }}>
        <div className="flex items-center gap-3">
          <Link href="/my-progress" className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
            <ChevronLeft size={20} style={{ color: h1 }} />
          </Link>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: h1 }}>
            Mood Insights
          </h1>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-md mx-auto space-y-6">
        
        {/* Toggle Frame */}
        <div className="flex bg-black/5 dark:bg-white/5 rounded-full p-1 border" style={{ borderColor: border }}>
          {['weekly', 'monthly'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as 'weekly' | 'monthly')}
              className="flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-all"
              style={{
                background: timeframe === tf ? (isDark ? 'rgba(200,146,74,0.15)' : 'rgba(200,146,74,0.12)') : 'transparent',
                color: timeframe === tf ? h1 : muted,
                boxShadow: timeframe === tf ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: muted }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block mb-3">
              <Sparkles size={24} className="text-amber-500/50" />
            </motion.div>
            <p>Loading insights...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={timeframe}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* AI Reflection Card */}
              <div className="rounded-[1.5rem] p-5 relative overflow-hidden" 
                   style={{ background: isDark ? 'linear-gradient(135deg, rgba(200,146,74,0.1) 0%, rgba(30,20,10,0.5) 100%)' : 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(255,255,255,0.9) 100%)', border: `1px solid ${border}` }}>
                <div className="absolute -top-3 -right-3 text-amber-500/20">
                  <Sparkles size={64} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-amber-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">Divine Reflection</h2>
                </div>
                <p className="text-[15px] leading-relaxed italic" style={{ color: h1, fontFamily: 'var(--font-serif)' }}>
                  {aiReflection || "Your journey is unique. Keep logging your daily moods to unlock deeper spiritual reflections."}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                
                <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="w-8 h-8 rounded-full mb-3 flex items-center justify-center" style={{ background: 'rgba(200,146,74,0.1)' }}>
                    <CalendarDays size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-serif mb-0.5" style={{ color: h1 }}>{metrics?.totalCheckins || 0}</p>
                    <p className="text-[11px]" style={{ color: muted }}>Check-ins</p>
                  </div>
                </div>

                <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="w-8 h-8 rounded-full mb-3 flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)' }}>
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-serif mb-0.5" style={{ color: h1 }}>{metrics?.completedActions || 0}</p>
                    <p className="text-[11px]" style={{ color: muted }}>Actions Completed</p>
                  </div>
                </div>

                <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="w-8 h-8 rounded-full mb-3 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <TrendingUp size={16} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-serif mb-0.5" style={{ color: h1 }}>{metrics?.streak || 0}</p>
                    <p className="text-[11px]" style={{ color: muted }}>Day Streak</p>
                  </div>
                </div>

                <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="w-8 h-8 rounded-full mb-3 flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.1)' }}>
                    <Activity size={16} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold font-serif mb-0.5 capitalize truncate" style={{ color: h1 }}>
                      {metrics?.mostFrequentMood || 'None'}
                    </p>
                    <p className="text-[11px]" style={{ color: muted }}>Frequent Mood</p>
                  </div>
                </div>

              </div>

              {/* Preferred Actions */}
              {metrics?.preferredActions && metrics.preferredActions.length > 0 && (
                <div className="rounded-2xl p-5 mt-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: muted }}>Top Actions</h3>
                  <div className="space-y-3">
                    {metrics.preferredActions.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <p className="text-sm font-semibold capitalize" style={{ color: h1 }}>{item.action}</p>
                        <p className="text-xs font-bold" style={{ color: muted }}>{item.count} times</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
