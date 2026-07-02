'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import SacredIcon from '@/components/ui/SacredIcon';
import type { Festival } from '@/lib/festivals';
import { getFestivalStory } from '@/lib/festival-stories';
import { getTransliteration } from '@/lib/transliteration';

interface CalendarSectionProps {
  pitruPakshaDay: { day: number; totalDays: number; isMahalaya: boolean } | null;
  pitruPakshaCopy: { title: string; subtitle: string } | null;
  activeFestivalStories: Array<{
    festival: Festival;
    story: any;
    daysLeft: number;
  }>;
  calendarLoading: boolean;
  transliterationLanguage: string;
  isDark: boolean;
}

export function CalendarSection({
  pitruPakshaDay,
  pitruPakshaCopy,
  activeFestivalStories,
  calendarLoading,
  transliterationLanguage,
  isDark,
}: CalendarSectionProps) {
  const [activeStoryFestival, setActiveStoryFestival] = useState<Festival | null>(null);

  function formatFestDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
  }

  function daysFromNow(dateStr: string) {
    const fest  = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const d     = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.ceil((fest.getTime() - d.getTime()) / 86400000);
  }

  return (
    <>
      {/* ── Pitru Paksha Banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {pitruPakshaDay && pitruPakshaCopy && (
          <motion.div
            key="pitru-paksha-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`pitru-paksha-banner${pitruPakshaDay.isMahalaya ? ' mahalaya' : ''} mx-4 mb-3`}
            role="status"
            aria-live="polite"
          >
            <div className="pitru-paksha-left">
              <span className="pitru-paksha-emoji" aria-hidden="true">
                <SacredIcon name={pitruPakshaDay.isMahalaya ? 'sun' : 'moon'} size={18} />
              </span>
              <div>
                <span className="pitru-paksha-title">{pitruPakshaCopy.title}</span>
                <span className="pitru-paksha-sub">{pitruPakshaCopy.subtitle}</span>
              </div>
            </div>
            <span className="pitru-paksha-day-badge" aria-label={`Day ${pitruPakshaDay.day} of ${pitruPakshaDay.totalDays}`}>
              {pitruPakshaDay.day}/{pitruPakshaDay.totalDays}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Festival Story Cards (Stack) ────────────────────────────────────────── */}
      <div className="px-4">
        <AnimatePresence>
          {calendarLoading ? (
            <div className="w-full h-[72px] rounded-[1rem] bg-black/[0.04] dark:bg-white/[0.04] opacity-40 mb-3 animate-none" />
          ) : activeFestivalStories.map(({ festival: f, story, daysLeft }) => (
            <motion.button
              key={`story-${f.name}`}
              type="button"
              onClick={() => setActiveStoryFestival(f)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="festival-story-card motion-press mb-3 w-full text-left"
              aria-label={`Read the story of ${f.name}`}
            >
              <span className="festival-story-emoji" aria-hidden="true">
                <SacredIcon name="scroll" size={18} />
              </span>
              <div className="festival-story-body">
                <span className="festival-story-kicker">
                  {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                  {' · '}Festival Story
                </span>
                <span className="festival-story-title">{f.name}</span>
                <span className="festival-story-teaser line-clamp-2">{story?.significance}</span>
              </div>
              <ChevronRight size={16} className="festival-story-chevron" aria-hidden="true" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Festival Story Sheet ───────────────────────────────────────────── */}
      <AnimatePresence>
        {(() => {
          const _activeStory = activeStoryFestival ? getFestivalStory(activeStoryFestival.name) : null;
          const _activeDays  = activeStoryFestival ? daysFromNow(activeStoryFestival.date) : null;
          return activeStoryFestival && _activeStory ? (
            <motion.div
              className="fixed inset-0 z-50 flex flex-col justify-end"
              onClick={() => setActiveStoryFestival(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            >
              <motion.div
                className="relative w-full overflow-y-auto rounded-t-[2rem] pb-10"
                style={{
                  maxHeight: '88dvh',
                  background: 'linear-gradient(180deg, var(--surface-raised) 0%, var(--card-bg) 100%)',
                  borderTop: '1px solid rgba(197, 160, 89, 0.22)',
                  boxShadow: '0 -24px 60px rgba(0,0,0,0.28)',
                }}
                onClick={e => e.stopPropagation()}
                initial={{ y: 56, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 32, opacity: 0 }}
                transition={{ duration: 0.34, ease: [0.34, 1.26, 0.64, 1] }}
              >
                {/* Drag handle */}
                <div className="sticky top-0 flex justify-center pt-3 pb-2 z-10"
                  style={{ background: 'var(--surface-raised)' }}>
                  <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(197, 160, 89,0.30)' }} />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-1 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl" aria-hidden="true">{_activeStory.emoji}</span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: 'var(--brand-primary)', marginBottom: '2px' }}>
                        {_activeDays === 0 ? 'Today' : `In ${_activeDays} day${_activeDays === 1 ? '' : 's'}`}
                      </p>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-cream)', lineHeight: 1.2 }}>
                        {activeStoryFestival.name}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveStoryFestival(null)}
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-transparent border-0 outline-none"
                    style={{ background: 'rgba(197, 160, 89,0.10)' }}
                    aria-label="Close"
                  >
                    <X size={16} style={{ color: 'var(--text-muted-warm)' }} />
                  </button>
                </div>

                <div className="px-6 space-y-6 pb-4">
                  {/* Origin */}
                  <section>
                    <h3 className="festival-story-section-label">Origin</h3>
                    <p className="festival-story-prose">{_activeStory.origin}</p>
                  </section>

                  {/* Significance */}
                  <section>
                    <h3 className="festival-story-section-label">Spiritual Significance</h3>
                    <p className="festival-story-prose">{_activeStory.significance}</p>
                  </section>

                  {/* Shloka block */}
                  <section
                    className="rounded-[1.4rem] p-5"
                    style={{ background: 'rgba(197, 160, 89,0.09)', border: '1px solid rgba(197, 160, 89,0.18)' }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-3"
                      style={{ color: 'var(--brand-primary)' }}>
                      Sacred Verse
                    </p>
                    <p className="festival-story-verse">{_activeStory.shloka.text}</p>
                    {getTransliteration(_activeStory.shloka.text, _activeStory.shloka.transliteration || '', transliterationLanguage) !== _activeStory.shloka.text && (
                      <p className="festival-story-transliteration">
                        {getTransliteration(_activeStory.shloka.text, _activeStory.shloka.transliteration || '', transliterationLanguage)}
                      </p>
                    )}
                    <p className="festival-story-prose mt-3 italic">&ldquo;{_activeStory.shloka.translation}&rdquo;</p>
                    <p className="text-[10px] mt-2" style={{ color: 'var(--text-dim)' }}>
                      — {_activeStory.shloka.source}
                    </p>
                  </section>

                  {/* Rituals */}
                  <section>
                    <h3 className="festival-story-section-label">How to Observe</h3>
                    <ul className="space-y-2 mt-1 list-none pl-0">
                      {_activeStory.rituals.map((ritual: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span style={{ color: 'var(--brand-primary)', fontSize: '0.8rem', marginTop: '2px' }}>🪔</span>
                          <p className="festival-story-prose" style={{ margin: 0 }}>{ritual}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Practice CTA */}
                  <section
                    className="rounded-[1.4rem] p-5"
                    style={{ background: 'rgba(212,120,74,0.10)', border: '1px solid rgba(212,120,74,0.20)' }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2"
                      style={{ color: 'var(--brand-primary-strong)' }}>
                      Your Practice Today
                    </p>
                    <p className="festival-story-prose">{_activeStory.practice}</p>
                  </section>
                </div>
              </motion.div>
            </motion.div>
          ) : null;
        })()}
      </AnimatePresence>
    </>
  );
}
