'use client';

/**
 * StoryCircles — Instagram-style horizontal strip of daily spiritual content circles.
 *
 * 5 fixed circles, each a quick-access visual entry point to today's content:
 *   1. Sacred Text   — today's shloka / verse
 *   2. Tithi         — panchang snapshot
 *   3. Streak        — japa practice status
 *   4. Dharm Veer    — today's featured seeker
 *   5. Festival      — next upcoming vrat
 *
 * Each circle shows a gold ring on first daily view (localStorage keyed by date).
 * A green tick appears when that day's practice is complete.
 * Tapping navigates to the relevant section / page.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { DharmVeer } from '@/lib/dharm-veer';
import type { Festival } from '@/lib/festivals';

interface StoryCirclesProps {
  /** First line of today's shloka/verse for the sub-label */
  shlokaLine:        string;
  tithi:             string;
  nakshatra:         string;
  japaStreak:        number;
  japaAlreadyDone:   boolean;
  dharmVeer:         DharmVeer;
  dharmVeerDone:     boolean;
  nextFestival:      Festival | null;
  daysUntilFestival: number | null;
  tradition:         string | null;
  isDark:            boolean;
}

const SEEN_KEY_PREFIX = 'shoonaya-story-seen-';
function todayKey() {
  return SEEN_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

interface Circle {
  id:    string;
  emoji: string;
  label: string;
  sub:   string;
  href:  string;
  done?: boolean;
}

export default function StoryCircles({
  shlokaLine,
  tithi,
  nakshatra,
  japaStreak,
  japaAlreadyDone,
  dharmVeer,
  dharmVeerDone,
  nextFestival,
  daysUntilFestival,
  tradition,
  isDark,
}: StoryCirclesProps) {
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey());
      if (raw) setSeen(new Set(JSON.parse(raw)));
    } catch {
      // ignore parse errors
    }
  }, []);

  const markSeen = useCallback((id: string) => {
    setSeen(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(todayKey(), JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Tradition-aware first circle emoji
  const verseEmoji =
    tradition === 'sikh'     ? '☬' :
    tradition === 'buddhist' ? '☸️' :
    tradition === 'jain'     ? '🤲' : '🕉️';

  // Festival details
  const festEmoji  = nextFestival?.emoji ?? '🛕';
  const festName   = nextFestival?.name?.split(' ').slice(0, 2).join(' ') ?? 'Calendar';
  const festSub    =
    daysUntilFestival === 0   ? 'Today' :
    daysUntilFestival === 1   ? 'Tomorrow' :
    daysUntilFestival != null ? `${daysUntilFestival}d away` : 'Upcoming';

  const circles: Circle[] = [
    {
      id:    'shloka',
      emoji: verseEmoji,
      label: "Today's Verse",
      sub:   shlokaLine.length > 18 ? shlokaLine.slice(0, 17) + '…' : shlokaLine || 'Sacred text',
      href:  '/bhakti/stotram',
    },
    {
      id:    'tithi',
      emoji: '📅',
      label: tithi || 'Panchang',
      sub:   nakshatra.split(' ')[0] || 'Nakshatra',
      href:  '/panchang',
    },
    {
      id:    'streak',
      emoji: japaStreak > 0 ? '🔥' : '📿',
      label: japaStreak > 0 ? `${japaStreak}-day` : 'Begin',
      sub:   'Japa streak',
      href:  '/bhakti/mala',
      done:  japaAlreadyDone,
    },
    {
      id:    'dharmveer',
      emoji: '⚡',
      label: dharmVeer.name.split(' ')[0] || 'Dharm',
      sub:   'Dharm Veer',
      href:  '/quiz',
      done:  dharmVeerDone,
    },
    {
      id:    'festival',
      emoji: festEmoji,
      label: festName,
      sub:   festSub,
      href:  '/panchang?tab=calendar',
    },
  ];

  // Colours
  const gold     = '#C5A059';
  const circleBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,253,246,0.92)';
  const labelClr = isDark ? 'rgba(240,237,230,0.88)' : 'rgba(30,20,5,0.80)';
  const subClr   = isDark ? 'rgba(240,237,230,0.42)' : 'rgba(80,50,10,0.50)';

  return (
    <div className="mb-2">
      {/* Suppress horizontal scrollbar */}
      <style>{`.story-strip::-webkit-scrollbar{display:none}`}</style>

      <div
        className="story-strip flex gap-3.5 overflow-x-auto px-5 pb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {circles.map((c, i) => {
          const isNew = !seen.has(c.id) && !c.done;

          return (
            <Link
              key={c.id}
              href={c.href}
              onClick={() => markSeen(c.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
              style={{ width: 62 }}
            >
              {/* Circle shell */}
              <motion.div
                initial={{ opacity: 0, scale: 0.80 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Outer ring — gold when new, dim when done, subtle otherwise */}
                <div
                  className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
                  style={{
                    padding: isNew ? 2.5 : 2,
                    background: isNew
                      ? `linear-gradient(135deg, ${gold} 0%, #E8C87A 50%, ${gold} 100%)`
                      : c.done
                        ? 'rgba(120,100,60,0.22)'
                        : `rgba(197,160,89,0.28)`,
                    boxShadow: isNew ? `0 0 12px rgba(197,160,89,0.30)` : 'none',
                  }}
                >
                  {/* Inner circle */}
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ background: circleBg }}
                  >
                    <span
                      className="select-none"
                      style={{ fontSize: '1.65rem', lineHeight: 1, opacity: c.done ? 0.6 : 1 }}
                      aria-hidden="true"
                    >
                      {c.emoji}
                    </span>
                  </div>
                </div>

                {/* "New" dot — top-right */}
                {isNew && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.07 + 0.2 }}
                    className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full"
                    style={{
                      background:  gold,
                      border:      `2px solid ${isDark ? '#0e0e0f' : '#faf6ef'}`,
                    }}
                  />
                )}

                {/* Done tick — bottom-right */}
                {c.done && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: '#22c55e',
                      border:     `2px solid ${isDark ? '#0e0e0f' : '#faf6ef'}`,
                      fontSize:   '9px',
                      color:      '#fff',
                      fontWeight: 'bold',
                    }}
                    aria-label="completed"
                  >
                    ✓
                  </div>
                )}
              </motion.div>

              {/* Text label */}
              <div className="text-center" style={{ width: 62 }}>
                <p
                  className="text-[10.5px] font-semibold leading-tight truncate"
                  style={{ color: labelClr }}
                >
                  {c.label}
                </p>
                <p
                  className="text-[9px] leading-tight truncate mt-0.5"
                  style={{ color: subClr }}
                >
                  {c.sub}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
