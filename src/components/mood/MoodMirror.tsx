'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOODS_CONFIG, type MoodConfig } from '@/lib/mood/registry';
import { type MoodInsightMetrics } from '@/lib/mood/insights';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import MoodGlyph from '@/components/ui/MoodGlyph';

export interface MoodMirrorProps {
  activeMood: MoodConfig;
  weekInsights: MoodInsightMetrics | null;
  reflectionSummary: string | null;
  reflectionLoading: boolean;
  recentMoods: Array<{ date: string; mood: string }>;
}

const ACTION_EMOJI_MAP: Record<string, string> = {
  japa: '🧿',
  stotram: '📖',
  dhyana: '🧘',
  katha: '🕯️',
  pathshala: '📚',
  discover: '🌿',
  default: '✨',
};

// Extracted and simplified from AIChatClient as requested
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      {[0, 1, 2].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 rounded-full bg-[var(--text-dim)]"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: dot * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export default function MoodMirror({
  activeMood,
  weekInsights,
  reflectionSummary,
  reflectionLoading,
  recentMoods,
}: MoodMirrorProps) {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();
  const [typedReflection, setTypedReflection] = useState('');
  const moodsConfig = MOODS_CONFIG[resolvedTheme as 'dark' | 'light'] ?? MOODS_CONFIG.dark;

  // A. 7-DAY MOOD DOTS
  // Determine past 7 days dates
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Identify most frequent mood
  const moodCounts = recentMoods.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const topMoodConf = topMoodEntry ? moodsConfig.find((m: MoodConfig) => m.key === topMoodEntry[0]) : null;

  useEffect(() => {
    if (reflectionLoading || !reflectionSummary) {
      setTypedReflection('');
      return;
    }
    
    if (prefersReducedMotion) {
      setTypedReflection(reflectionSummary);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setTypedReflection(reflectionSummary.slice(0, i));
      i++;
      if (i > reflectionSummary.length) clearInterval(interval);
    }, 14);

    return () => clearInterval(interval);
  }, [reflectionSummary, reflectionLoading, prefersReducedMotion]);

  return (
    <div className="flex flex-col gap-6">
      {/* A. 7-DAY MOOD DOTS */}
      <section>
        <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
          Your Bhavana This Week
        </p>
        <div className="flex items-end gap-2">
          {days.map((dateStr, i) => {
            const dateObj = new Date(dateStr);
            const label = dayLabels[dateObj.getDay()];
            const found = recentMoods.find(r => r.date === dateStr);
            const moodConf = found ? moodsConfig.find((m: MoodConfig) => m.key === found.mood) : null;
            
            return (
              <div key={dateStr} className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.6 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.04 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center border"
                  style={{
                    borderColor: moodConf ? moodConf.colour : 'var(--card-border)',
                  }}
                >
                  {moodConf && <MoodGlyph mood={moodConf.key} size={14} color={moodConf.colour} />}
                </motion.div>
                <span className="text-[8px] text-[var(--text-dim)] uppercase font-medium">{label}</span>
              </div>
            );
          })}
        </div>
        {topMoodConf && (
          <p className="text-[11px] text-[var(--brand-primary)] mt-3">
            <span className="inline mr-1"><MoodGlyph mood={topMoodConf.key} size={11} color="var(--brand-primary)" /></span>
            {topMoodConf.label} most often
          </p>
        )}
      </section>

      {/* B. AI REFLECTION */}
      <section>
        <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
          🪬 Your Reflection
        </p>
        <div className="rounded-2xl p-4 bg-[var(--card-bg)] border border-[var(--card-border)] min-h-[80px]">
          {(reflectionLoading || (!typedReflection && !!reflectionSummary)) ? (
            <TypingIndicator />
          ) : (
            <p className="italic font-serif text-[13px] text-[var(--text-cream)] whitespace-pre-wrap leading-relaxed">
              {typedReflection}
            </p>
          )}
        </div>
      </section>

      {/* C. WHAT HELPED MOST */}
      {weekInsights && weekInsights.preferredActions.length > 0 && (
        <section>
          <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
            What Helped Most
          </p>
          <div className="flex flex-col gap-2">
            {weekInsights.preferredActions.slice(0, 3).map((a) => {
              const actionType = a.action ?? a.type ?? 'default';
              const emoji = ACTION_EMOJI_MAP[actionType] || ACTION_EMOJI_MAP['default'];
              return (
                <div key={actionType} className="flex justify-between items-center rounded-xl p-3 bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <span className="text-[13px] text-[var(--text-cream)] font-medium capitalize">{actionType}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)]">{a.count} sessions</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
