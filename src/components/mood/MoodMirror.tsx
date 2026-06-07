'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOODS_CONFIG, type MoodConfig } from '@/lib/mood/registry';
import { type MoodInsightMetrics } from '@/lib/mood/insights';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import MoodGlyph from '@/components/ui/MoodGlyph';
import SacredGlowIcon from '@/components/ui/SacredGlowIcon';

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

const TREND_LABELS: Record<NonNullable<MoodInsightMetrics['recentTrend']>, string> = {
  improving: 'Improving',
  steady: 'Steady',
  needs_attention: 'Needs attention',
};

const PRACTICE_TYPE_LABELS: Record<string, string> = {
  read: 'Reading',
  chant: 'Chanting',
  listen: 'Listening',
  reflect: 'Reflection',
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
  const topNeed = weekInsights?.commonNeeds[0] ?? null;
  const topTimeCommitment = weekInsights?.commonTimeCommitments[0] ?? null;
  const topPracticeType = weekInsights?.commonPracticeTypes[0] ?? null;

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
                  {moodConf && (
                    <SacredGlowIcon color={moodConf.colour} size={24} variant="soft">
                      <MoodGlyph mood={moodConf.key} size={14} color={moodConf.colour} />
                    </SacredGlowIcon>
                  )}
                </motion.div>
                <span className="text-[8px] text-[var(--text-dim)] uppercase font-medium">{label}</span>
              </div>
            );
          })}
        </div>
        {topMoodConf && (
          <p className="text-[11px] text-[var(--brand-primary)] mt-3">
            <span className="inline-flex mr-1 align-middle">
              <SacredGlowIcon color="var(--brand-primary)" size={20} variant="active" animated>
                <MoodGlyph mood={topMoodConf.key} size={11} color="var(--brand-primary)" />
              </SacredGlowIcon>
            </span>
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

      {weekInsights && weekInsights.totalCheckins > 0 && (
        <section>
          <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
            Weekly Signals
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">Completion</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--text-cream)]">{weekInsights.completionRate}%</p>
              <p className="text-[10px] text-[var(--text-dim)]">{weekInsights.completedActions} of {weekInsights.totalCheckins} check-ins</p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">Mood Lift</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--text-cream)]">
                {weekInsights.improvementRate !== null ? `${weekInsights.improvementRate}%` : '—'}
              </p>
              <p className="text-[10px] text-[var(--text-dim)]">
                {weekInsights.afterMoodLoggedCount > 0
                  ? `${weekInsights.afterMoodLoggedCount} after-mood check-ins`
                  : 'Log your after-mood to track lift'}
              </p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">Dominant Mood</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--text-cream)]">
                {topMoodConf ? topMoodConf.label : '—'}
              </p>
              <p className="text-[10px] text-[var(--text-dim)]">{weekInsights.dominantMoodShare}% of recent check-ins</p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">Trend</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--text-cream)]">
                {weekInsights.recentTrend ? TREND_LABELS[weekInsights.recentTrend] : 'Building'}
              </p>
              <p className="text-[10px] text-[var(--text-dim)]">{weekInsights.streak}-day streak</p>
            </div>
          </div>
        </section>
      )}

      {weekInsights && weekInsights.moodBreakdown.length > 0 && (
        <section>
          <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
            Mood Pattern
          </p>
          <div className="rounded-2xl p-4 bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
            {weekInsights.moodBreakdown.slice(0, 3).map((item) => {
              const mood = moodsConfig.find((entry: MoodConfig) => entry.key === item.mood);
              return (
                <div key={item.mood} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {mood ? (
                        <SacredGlowIcon color={mood.colour} size={24} variant="soft">
                          <MoodGlyph mood={mood.key} size={14} color={mood.colour} />
                        </SacredGlowIcon>
                      ) : null}
                      <span className="text-[12px] font-medium text-[var(--text-cream)] truncate">
                        {mood?.label ?? item.mood}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-dim)] shrink-0">
                      {item.count} check-ins · {item.sharePct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.sharePct}%`,
                        background: mood?.colour ?? 'var(--brand-primary)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* C. WHAT HELPED MOST */}
      {weekInsights && weekInsights.preferredActions.length > 0 && (
        <section>
          <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
            What Helped Most
          </p>
          <div className="flex flex-col gap-2">
            {weekInsights.preferredActions.slice(0, 3).map((a) => {
              const actionType = a.key || 'default';
              const emoji = ACTION_EMOJI_MAP[actionType] || ACTION_EMOJI_MAP.default;
              return (
                <div key={actionType} className="flex justify-between items-center rounded-xl p-3 bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <div>
                      <span className="block text-[13px] text-[var(--text-cream)] font-medium">{a.action}</span>
                      <span className="block text-[10px] text-[var(--text-dim)]">{a.sharePct}% of completed actions</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)]">{a.count} sessions</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {weekInsights && (
        weekInsights.commonNeeds.length > 0 ||
        weekInsights.commonTimeCommitments.length > 0 ||
        weekInsights.commonPracticeTypes.length > 0
      ) && (
        <section>
          <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
            Practice Pattern
          </p>
          <div className="rounded-2xl p-4 bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl p-3 border border-[var(--card-border)] bg-[var(--surface-soft)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">Top Need</p>
                <p className="mt-1 text-[13px] font-medium text-[var(--text-cream)] capitalize">
                  {topNeed ? topNeed.need : '—'}
                </p>
              </div>
              <div className="rounded-xl p-3 border border-[var(--card-border)] bg-[var(--surface-soft)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">Time Window</p>
                <p className="mt-1 text-[13px] font-medium text-[var(--text-cream)]">
                  {topTimeCommitment ? topTimeCommitment.time : '—'}
                </p>
              </div>
              <div className="rounded-xl p-3 border border-[var(--card-border)] bg-[var(--surface-soft)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">Practice Mode</p>
                <p className="mt-1 text-[13px] font-medium text-[var(--text-cream)]">
                  {topPracticeType ? PRACTICE_TYPE_LABELS[topPracticeType.type] ?? topPracticeType.type : '—'}
                </p>
              </div>
            </div>

            {weekInsights.commonNeeds.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)] mb-2">Most requested need</p>
                <div className="flex flex-wrap gap-2">
                  {weekInsights.commonNeeds.map((item) => (
                    <span
                      key={item.need}
                      className="rounded-full px-2.5 py-1 text-[10px] font-medium border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)] capitalize"
                    >
                      {item.need} · {item.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {weekInsights.commonPracticeTypes.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)] mb-2">Most used practice modes</p>
                <div className="flex flex-wrap gap-2">
                  {weekInsights.commonPracticeTypes.map((item) => (
                    <span
                      key={item.type}
                      className="rounded-full px-2.5 py-1 text-[10px] font-medium border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)]"
                    >
                      {PRACTICE_TYPE_LABELS[item.type] ?? item.type} · {item.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {weekInsights.commonTimeCommitments.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)] mb-2">Preferred time commitment</p>
                <div className="flex flex-wrap gap-2">
                  {weekInsights.commonTimeCommitments.map((item) => (
                    <span
                      key={item.time}
                      className="rounded-full px-2.5 py-1 text-[10px] font-medium border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)]"
                    >
                      {item.time} · {item.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-[var(--text-dim)] italic">
              After-mood was logged in {weekInsights.loggedAfterMoodRate}% of check-ins, which is what powers the lift signal above.
            </p>
          </div>
        </section>
      )}

      {weekInsights && weekInsights.suggestions.length > 0 && (
        <section>
          <p className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-bold mb-3">
            Suggested Focus
          </p>
          <div className="flex flex-col gap-2">
            {weekInsights.suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="rounded-xl p-3 bg-[var(--card-bg)] border border-[var(--card-border)]"
              >
                <p className="text-[12px] leading-relaxed text-[var(--text-cream)]">{suggestion}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
