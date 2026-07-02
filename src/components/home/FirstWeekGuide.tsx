'use client';

/**
 * FirstWeekGuide — warm cold-start onboarding for brand-new users.
 *
 * Shown when showFirstTimeGuidance=true (streak=0, no practice history,
 * no guided path started). Gives a clear 5-act "your first week" roadmap
 * so the app never feels empty on day one.
 *
 * Acts are tradition-aware: vocabulary, emoji, and descriptions adapt to
 * the user's tradition (Hindu / Sikh / Buddhist / Jain / other).
 *
 * Progress is stored in localStorage so items stay checked after completion.
 * The card disappears once all 5 acts are done or after dismissal.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

interface FirstWeekGuideProps {
  tradition?: string | null;
  userName?:  string;
  onDismiss?: () => void;
}

const STORAGE_KEY = 'shoonaya-first-week-guide';
const DISMISS_KEY = 'shoonaya-first-week-dismissed';

interface GuideAct {
  id:    string;
  emoji: string;
  title: string;
  desc:  string;
  href:  string;
}

// Returns the 5 first-week acts, vocabulary-adapted to the user&apos;s tradition.
function getTraditionActs(tradition?: string | null): GuideAct[] {
  const t = tradition ?? 'hindu';

  const sacredText: GuideAct = {
    id:    'sacred_text',
    emoji: t === 'sikh' ? '☬' : t === 'buddhist' ? '☸️' : t === 'jain' ? '🤲' : '🕉️',
    title: t === 'sikh'     ? 'Read today&apos;s Shabad'
         : t === 'buddhist' ? 'Read today&apos;s Dhamma Verse'
         : t === 'jain'     ? 'Read today&apos;s Sutra'
         :                   'Read today&apos;s Shloka',
    desc:  t === 'sikh'     ? 'Start your Shabad streak — tap the Gurbani card on your home screen'
         : t === 'buddhist' ? 'Start a Dhamma reading streak on your home screen'
         : t === 'jain'     ? 'Start a Sutra reading streak on your home screen'
         :                   'Start a reading streak — tap the Shloka card on your home screen',
    href:  '/',
  };

  const japa: GuideAct = {
    id:    'japa',
    emoji: '📿',
    title: t === 'sikh'     ? 'Begin Waheguru Simran'
         : t === 'buddhist' ? 'Recite Om Mani Padme Hum'
         : t === 'jain'     ? 'Recite the Namokar Mantra'
         :                   'Complete one round of Japa',
    desc:  t === 'sikh'     ? '108 repetitions of Waheguru — one complete round'
         : t === 'buddhist' ? '108 beads, one mantra, complete presence'
         : t === 'jain'     ? '108 recitations of the Namokar Mantra with full awareness'
         :                   '108 beads, one mantra, complete presence',
    href:  '/bhakti/mala',
  };

  const nitya: GuideAct = {
    id:    'nitya',
    emoji: '🌅',
    title: t === 'sikh'     ? 'Complete your Nitnem once'
         : t === 'buddhist' ? 'Complete your Morning Sadhana'
         : t === 'jain'     ? 'Complete Pratikramana once'
         :                   'Do your Nitya Karma once',
    desc:  t === 'sikh'     ? 'The Nitnem banis that anchor every Sikh morning'
         : t === 'buddhist' ? 'The morning sequence that grounds your whole day'
         : t === 'jain'     ? 'The daily reflection and practice that centres your day'
         :                   'The morning routine that anchors your whole day',
    href:  '/nitya-karma',
  };

  const pathshala: GuideAct = {
    id:    'pathshala',
    emoji: '📖',
    title: t === 'sikh'     ? 'Explore Gurbani in Pathshala'
         : t === 'buddhist' ? 'Study the Dhamma texts'
         : t === 'jain'     ? 'Study the Agamas'
         :                   'Start a Pathshala lesson',
    desc:  t === 'sikh'     ? 'Deepen your understanding of the Guru&apos;s wisdom'
         : t === 'buddhist' ? 'Deepen your understanding of the Buddha&apos;s teachings'
         : t === 'jain'     ? 'Deepen your understanding of Jain scripture'
         :                   'Deepen your understanding of scripture and dharma',
    href:  '/pathshala',
  };

  const mandali: GuideAct = {
    id:    'mandali',
    emoji: '🤝',
    title: t === 'sikh'     ? 'Find your Sangat'
         : t === 'buddhist' ? 'Find your Sangha'
         : t === 'jain'     ? 'Connect with your Samaj'
         :                   'Find your Mandali',
    desc:  t === 'sikh'     ? 'Connect with Sikh seekers in your area'
         : t === 'buddhist' ? 'Connect with Buddhist practitioners near you'
         : t === 'jain'     ? 'Connect with Jain community members near you'
         :                   'Connect with seekers near you',
    href:  '/mandali',
  };

  return [sacredText, japa, nitya, pathshala, mandali];
}

function getCompletedActs(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveCompletedActs(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch { /* ok */ }
}

export default function FirstWeekGuide({ tradition, userName, onDismiss }: FirstWeekGuideProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [mounted,   setMounted]   = useState(false);

  const meta   = getTraditionMeta(tradition ?? 'hindu');
  const accent = meta.accentColour ?? '#C5A059';
  const acts   = getTraditionActs(tradition);

  useEffect(() => {
    setMounted(true);
    setCompleted(getCompletedActs());
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
    }
  }, []);

  function markDone(id: string) {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      saveCompletedActs(next);
      return next;
    });
  }

  function dismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, 'true');
    }
    setDismissed(true);
    onDismiss?.();
  }

  if (!mounted || dismissed) return null;

  const doneCount = acts.filter(a => completed.has(a.id)).length;
  const allDone   = doneCount === acts.length;

  if (allDone) return null; // guide complete — vanish

  const firstName = userName?.split(' ')[0];

  return (
    <div className="px-1 mb-5">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${accent}10 0%, transparent 60%)`,
          border: `1px solid ${accent}28`,
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
              style={{ color: accent }}
            >
              Your first week
            </p>
            <h3
              className="font-serif font-bold text-base leading-tight"
              style={{ color: 'var(--brand-ink)' }}
            >
              {firstName ? `Welcome, ${firstName} 🙏` : `Begin your journey ${meta.symbol}`}
            </h3>
          </div>

          {/* Progress ring */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke={`${accent}1a`} strokeWidth="3.5" />
              <circle
                cx="20" cy="20" r="16" fill="none"
                stroke={accent} strokeWidth="3.5"
                strokeDasharray={`${(doneCount / acts.length) * 100.53} 100.53`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span className="relative text-[11px] font-bold tabular-nums" style={{ color: accent }}>
              {doneCount}/{acts.length}
            </span>
          </div>
        </div>

        {/* Acts list */}
        <div className="divide-y" style={{ borderColor: `${accent}12` }}>
          {acts.map((act) => {
            const done = completed.has(act.id);
            return (
              <Link
                key={act.id}
                href={act.href}
                onClick={() => markDone(act.id)}
                className="flex items-center gap-3 px-4 py-3 no-underline transition-opacity hover:opacity-80 active:opacity-60"
              >
                {/* Status icon */}
                {done ? (
                  <CheckCircle2 size={18} style={{ color: accent, flexShrink: 0 }} />
                ) : (
                  <Circle size={18} style={{ color: `${accent}50`, flexShrink: 0 }} />
                )}

                {/* Emoji */}
                <span className="text-lg leading-none">{act.emoji}</span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{
                      color:          done ? 'var(--brand-muted)' : 'var(--brand-ink)',
                      textDecoration: done ? 'line-through' : 'none',
                      opacity:        done ? 0.6 : 1,
                    }}
                  >
                    {act.title}
                  </p>
                  {!done && (
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--brand-muted)' }}>
                      {act.desc}
                    </p>
                  )}
                </div>

                {!done && <ChevronRight size={14} style={{ color: `${accent}55`, flexShrink: 0 }} />}
              </Link>
            );
          })}
        </div>

        {/* Dismiss link */}
        <div className="px-4 py-2.5 text-right">
          <button
            type="button"
            onClick={dismiss}
            className="text-[10px] underline"
            style={{ color: 'var(--brand-muted)' }}
          >
            I know the app — dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
