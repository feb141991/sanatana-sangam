'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Sparkles, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { LibraryEntry } from '@/lib/library-content';
import MoodGlyph from '@/components/ui/MoodGlyph';

interface Props {
  tradition:     string | null;
  spiritualLevel: string | null;
}

// ── Mood palette ──────────────────────────────────────────────────────────────
const MOODS = [
  { key: 'anxious',     label: 'Anxious',      emoji: '😰', colour: '#7b6f9e', bg: 'rgba(123,111,158,0.12)' },
  { key: 'grieving',    label: 'Grieving',      emoji: '🌧️', colour: '#6b8aad', bg: 'rgba(107,138,173,0.12)' },
  { key: 'angry',       label: 'Angry',         emoji: '🔥', colour: '#c86a3a', bg: 'rgba(200,106,58,0.12)'  },
  { key: 'scattered',   label: 'Scattered',     emoji: '🌀', colour: '#7aab94', bg: 'rgba(122,171,148,0.12)' },
  { key: 'lost',        label: 'Lost',          emoji: '🌑', colour: '#8e8e7a', bg: 'rgba(142,142,122,0.12)' },
  { key: 'joyful',      label: 'Joyful',        emoji: '☀️', colour: '#c8923a', bg: 'rgba(200,146,58,0.12)'  },
  { key: 'seeking',     label: 'Seeking',       emoji: '🔍', colour: '#c8925e', bg: 'rgba(200,146,74,0.12)'  },
  { key: 'lonely',      label: 'Lonely',        emoji: '🕊️', colour: '#8aadad', bg: 'rgba(138,173,173,0.12)' },
  { key: 'overwhelmed', label: 'Overwhelmed',   emoji: '🌊', colour: '#6b8ab0', bg: 'rgba(107,138,176,0.12)' },
  { key: 'grateful',    label: 'Grateful',      emoji: '🙏', colour: '#b09a6a', bg: 'rgba(176,154,106,0.12)' },
];

interface DiscoverResult {
  entry:   LibraryEntry;
  insight: string | null;
}

// ── Verse card ────────────────────────────────────────────────────────────────
function VerseCard({ result, index, accentColour }: { result: DiscoverResult; index: number; accentColour: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="rounded-[1.6rem] p-4 relative overflow-hidden border"
      style={{
        background: 'linear-gradient(150deg, rgba(28,20,12,0.98), rgba(20,14,8,0.97))',
        borderColor: `${accentColour}28`,
        boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at top left, ${accentColour}0d, transparent 60%)`,
      }} />

      {/* Source badge */}
      <div className="relative flex items-start justify-between gap-2 mb-3">
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${accentColour}18`, color: accentColour }}
        >
          {result.entry.source}
        </span>
        <Link
          href={`/library`}
          className="text-[10px] font-medium"
          style={{ color: 'var(--text-dim)' }}
        >
          Open →
        </Link>
      </div>

      {/* Original verse — Devanagari / script font */}
      <p
        className="relative leading-relaxed mb-2"
        style={{
          fontFamily: 'var(--font-devanagari), "Noto Sans Devanagari", sans-serif',
          fontSize: '1.15rem',
          fontWeight: 500,
          color: 'rgba(245, 225, 185, 0.97)',
          lineHeight: 2,
          letterSpacing: '0.02em',
        }}
      >
        {result.entry.original}
      </p>

      {/* Transliteration — clearly secondary */}
      <p className="relative italic text-[11px] mb-3 leading-relaxed"
        style={{ color: 'rgba(200,160,100,0.55)', letterSpacing: '0.01em' }}
      >
        {(result.entry.transliteration ?? '').split('|')[0].trim()}
      </p>

      {/* AI insight */}
      {result.insight && (
        <p className="relative text-[11.5px] leading-relaxed mb-3 px-3 py-2 rounded-xl"
          style={{ background: `${accentColour}10`, color: accentColour, borderLeft: `2px solid ${accentColour}40` }}
        >
          {result.insight}
        </p>
      )}

      {/* Show meaning toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="relative text-[11px] font-medium"
        style={{ color: accentColour }}
      >
        {expanded ? 'Hide meaning ↑' : 'Show meaning ↓'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.p
            className="relative text-[12.5px] leading-relaxed mt-2"
            style={{ color: 'var(--text-muted-warm)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            {result.entry.meaning.slice(0, 280)}
            {result.entry.meaning.length > 280 ? '…' : ''}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export default function DiscoverClient({ tradition }: Props) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [results,      setResults]      = useState<DiscoverResult[]>([]);
  const [error,        setError]        = useState<string | null>(null);

  const activeMood = MOODS.find(m => m.key === selectedMood);

  async function fetchForMood(moodKey: string) {
    setSelectedMood(moodKey);
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/discover/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: moodKey, tradition: tradition ?? undefined }),
      });
      if (!res.ok) throw new Error('Discovery failed');
      const data = await res.json();
      setResults(data.results ?? []);
      // Persist mood for today so the home screen prompt dismisses
      const today = new Date().toISOString().split('T')[0];
      try {
        localStorage.setItem('home_mood_date', today);
        localStorage.setItem('home_mood_key', moodKey);
      } catch { /* ignore */ }
    } catch {
      setError('Could not load verses — please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSelectedMood(null);
    setResults([]);
    setError(null);
  }

  const accent = activeMood?.colour ?? 'var(--brand-primary)';

  return (
    <div className="space-y-4 pb-32 fade-in">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.20)' }}
        >
          <ChevronLeft size={18} style={{ color: 'rgba(200,146,74,0.80)' }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>
            Mood-Based Discovery
          </p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-cream)', lineHeight: 1.2 }}>
            How are you feeling?
          </p>
        </div>
        {selectedMood && (
          <button
            onClick={reset}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <RotateCcw size={13} style={{ color: 'var(--text-dim)' }} />
          </button>
        )}
      </div>

      {/* ── Subtitle ── */}
      <p className="px-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted-warm)', fontSize: '0.83rem' }}>
        Pick what resonates right now. The scripture speaks to every state of the soul.
      </p>

      {/* ── Mood grid ── */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2.5">
          {MOODS.map(mood => {
            const isActive = selectedMood === mood.key;
            return (
              <motion.button
                key={mood.key}
                onClick={() => fetchForMood(mood.key)}
                disabled={loading}
                data-active={isActive}
                className="mood-discovery-card flex items-center gap-3 rounded-[1.4rem] px-4 py-3.5 text-left transition-all motion-press"
                style={{
                  ['--mood-colour-soft' as string]: `${mood.colour}30`,
                  background: isActive
                    ? `linear-gradient(145deg, ${mood.colour}2c, rgba(255,245,214,0.08))`
                    : `linear-gradient(145deg, ${mood.colour}18, rgba(255,245,214,0.04))`,
                  border: `1px solid ${isActive ? mood.colour + '66' : mood.colour + '32'}`,
                  boxShadow: isActive
                    ? `0 0 0 2px ${mood.colour}24, 0 14px 28px ${mood.colour}18`
                    : `0 8px 18px ${mood.colour}0d`,
                  opacity: loading && !isActive ? 0.45 : 1,
                }}
                animate={prefersReducedMotion ? undefined : { scale: isActive ? 1.01 : 1 }}
              >
                <span className="mood-sparkle mood-sparkle-one" />
                <span className="mood-sparkle mood-sparkle-two" />
                <span className="leading-none flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                  <MoodGlyph mood={mood.key} color={isActive ? mood.colour : `${mood.colour}99`} size={24} />
                </span>
                <span
                  className="text-[13px] font-semibold leading-tight"
                  style={{ color: isActive ? mood.colour : 'var(--text-cream)' }}
                >
                  {mood.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Results area ── */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            className="px-4 space-y-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 py-2">
              <Sparkles size={14} style={{ color: accent }} className="animate-pulse" />
              <p className="text-sm font-medium" style={{ color: accent }}>
                Finding verses for <em>{activeMood?.label?.toLowerCase()}</em>…
              </p>
            </div>
            {/* Skeleton cards */}
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-[1.6rem] p-4 border animate-pulse"
                style={{
                  height: '120px',
                  background: 'var(--card-bg)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              />
            ))}
          </motion.div>
        )}

        {!loading && error && (
          <motion.div key="error" className="px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-[1.4rem] p-4 text-center" style={{ background: 'rgba(200,74,74,0.08)', border: '1px solid rgba(200,74,74,0.18)' }}>
              <p className="text-sm" style={{ color: 'rgba(200,120,120,0.90)' }}>{error}</p>
              <button
                onClick={() => selectedMood && fetchForMood(selectedMood)}
                className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(200,74,74,0.14)', color: 'rgba(220,140,140,0.90)' }}
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {!loading && results.length > 0 && activeMood && (
          <motion.div
            key="results"
            className="px-4 space-y-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {/* Results header */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center" style={{ width: 22, height: 22 }}>
                  <MoodGlyph mood={activeMood.key} color={activeMood.colour} size={20} />
                </span>
                <p className="text-sm font-semibold" style={{ color: activeMood.colour }}>
                  For when you feel {activeMood.label.toLowerCase()}
                </p>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                {results.length} verse{results.length !== 1 ? 's' : ''}
              </span>
            </div>

            {results.map((result, i) => (
              <VerseCard
                key={result.entry.id}
                result={result}
                index={i}
                accentColour={activeMood.colour}
              />
            ))}

            {/* Shuffle button */}
            <button
              onClick={() => fetchForMood(activeMood.key)}
              className="w-full py-3 rounded-[1.4rem] flex items-center justify-center gap-2 text-sm font-semibold transition motion-press"
              style={{
                background: `${activeMood.colour}10`,
                border: `1px solid ${activeMood.colour}28`,
                color: activeMood.colour,
              }}
            >
              <RotateCcw size={13} />
              Show different verses
            </button>
          </motion.div>
        )}

        {!loading && !selectedMood && (
          <motion.div
            key="prompt"
            className="px-4 pt-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div
              className="rounded-[1.7rem] p-5 text-center"
              style={{
                background: 'linear-gradient(150deg, rgba(28,20,12,0.80), rgba(20,14,8,0.70))',
                border: '1px solid rgba(200,146,74,0.12)',
              }}
            >
              <p className="text-3xl mb-3">🌿</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-cream)' }}>
                The right teaching finds you
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                Every state of mind has been walked before. Choose your mood and let the scripture meet you there.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
