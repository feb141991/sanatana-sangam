'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { BHAKTI_MANTRAS } from '@/lib/bhakti-practice';
import { playBeadTapFeedback } from '@/lib/practice-feedback';

const DURATIONS = [12, 24, 48];

const MODES = [
  {
    id: 'reading',
    title: 'Reading',
    description: 'For calm scripture reading with less noise.',
    mantra: 'Read slowly, pause often, return gently.',
  },
  {
    id: 'breath',
    title: 'Breath',
    description: 'For quiet sitting and steadier attention.',
    mantra: 'Inhale softly. Exhale longer.',
  },
  {
    id: 'chant',
    title: 'Chant',
    description: 'For a simple chanting or listening session.',
    mantra: 'Keep one mantra, one rhythm, one mind.',
  },
] as const;

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function ZenModePage() {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('reading');
  const [duration, setDuration] = useState(24);
  const [chantMantra, setChantMantra] = useState<string>(BHAKTI_MANTRAS[0].value);
  const [remaining, setRemaining] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusEnvironment, setFocusEnvironment] = useState<'mountains' | 'temple' | 'forest'>('temple');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(duration * 60);
    setRunning(false);
  }, [duration, mode]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(intervalRef.current ?? undefined);
          intervalRef.current = null;
          setRunning(false);
          navigator.vibrate?.(30);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const activeMode = useMemo(() => MODES.find((item) => item.id === mode) ?? MODES[0], [mode]);
  const activeChant = useMemo(() => BHAKTI_MANTRAS.find((item) => item.value === chantMantra) ?? BHAKTI_MANTRAS[0], [chantMantra]);
  const progress = ((duration * 60 - remaining) / (duration * 60)) * 100;
  const chantTrackIds = activeChant.audioTrackId ? [activeChant.audioTrackId] : ['gayatri-mantra-as-it-is', 'guru-stotram', 'kirtana-in-hindi'];

  return (
    <div className="fade-in space-y-5">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] px-5 py-6 md:px-7">
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top, color-mix(in srgb, var(--brand-secondary) 22%, white), transparent 50%), linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 10%, white), transparent 70%)',
          }}
        />
        <div className="relative space-y-4">
          <div className="clay-pill inline-flex type-chip text-[color:var(--text-dim)]">Zen mode</div>
          <div>
            <h1 className="type-screen-title">A quieter surface</h1>
            <p className="type-body mt-2 max-w-2xl">
              Use this when you want less chrome, more stillness, and one clear devotional focus.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  mode === item.id ? 'bg-[color:var(--surface-soft)] shadow-sm' : 'bg-[color:var(--brand-accent)]/80'
                }`}
                style={mode === item.id ? { borderColor: 'rgba(212, 166, 70, 0.28)' } : { borderColor: 'rgba(212,166,70,0.16)' }}
              >
                <p className="type-card-heading">{item.title}</p>
                <p className="type-body mt-1">{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-5 py-6 text-center">
        <p className="type-card-label">
          {activeMode.title}
        </p>
        <p className="type-metric mt-3">{formatClock(remaining)}</p>
        <p className="type-body mt-3">{activeMode.mantra}</p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--brand-primary-soft)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-primary-strong), var(--brand-primary))' }}
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {DURATIONS.map((value) => (
            <button
              key={value}
              onClick={() => setDuration(value)}
              className={`rounded-full px-4 py-2 type-chip transition ${duration === value ? 'text-[#1c1c1a]' : 'bg-[color:var(--brand-accent)] text-[color:var(--text-dim)] border border-[rgba(212,166,70,0.18)]'}`}
              style={duration === value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
            >
              {value} min
            </button>
          ))}
        </div>

        {mode === 'chant' ? (
          <div className="mt-5 rounded-[1.5rem] border border-[rgba(212,166,70,0.18)] bg-[color:var(--brand-accent)] px-4 py-4 text-left">
            <p className="type-card-heading">Chant focus</p>
            <select
              value={chantMantra}
              onChange={(event) => setChantMantra(event.target.value)}
              className="type-body mt-3 w-full rounded-xl border border-[rgba(212,166,70,0.18)] bg-[color:var(--surface-soft)] px-4 py-3 outline-none"
            >
              {BHAKTI_MANTRAS.map((item) => (
                <option key={item.value} value={item.value}>{item.value}</option>
              ))}
            </select>
            <p className="type-body mt-3">
              Stay with one mantra, one breath, and one pace.
            </p>
            <div className="mt-3">
              <ChantAudioPlayer
                title="Chant companion"
                trackIds={chantTrackIds}
                initialTrackId={activeChant.audioTrackId ?? undefined}
                compact
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setRunning((current) => !current);
              playBeadTapFeedback();
            }}
            className="glass-button-primary rounded-full px-5 py-3 type-chip text-[#1c1c1a]"
          >
            {running ? 'Pause' : 'Begin'}
          </button>
          <button
            onClick={() => {
              setFocusMode(true);
              setRunning(true);
            }}
            className="glass-button-primary rounded-full px-5 py-3 type-chip text-[#1c1c1a]"
          >
            Enter full focus
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setRemaining(duration * 60);
            }}
            className="glass-button-secondary rounded-full px-5 py-3 type-chip"
            style={{ color: 'var(--brand-primary-strong)' }}
          >
            Reset
          </button>
        </div>
      </section>

      {focusMode ? (
        <div className="fixed inset-0 z-[80] overflow-hidden px-3 py-3 md:px-5 md:py-5" style={{ background: getFocusEnvironmentStyle(focusEnvironment) }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {focusEnvironment === 'mountains' && Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={`zen-snow-${i}`}
                className="absolute h-2 w-2 rounded-full bg-white/80"
                initial={{ y: '-8vh', x: 0, opacity: 0 }}
                animate={{ y: '108vh', x: i % 2 === 0 ? 18 : -12, opacity: [0, 0.9, 0] }}
                transition={{ duration: 7 + (i % 3), repeat: Infinity, ease: 'linear', delay: i * 0.22 }}
                style={{ left: `${10 + i * 6}%`, top: `${-4 + (i % 5) * 11}%`, animation: `snowDrift ${7 + (i % 3)}s linear infinite`, opacity: 0.5 + (i % 3) * 0.12 }}
              />
            ))}
            <motion.div
              className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
              animate={{ scale: [1, 1.08, 1], opacity: [0.22, 0.34, 0.22] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'radial-gradient(circle, rgba(240, 237, 230, 0.18), rgba(240, 237, 230, 0) 68%)' }}
            />
          </div>
          <div className="mx-auto grid h-full w-full max-w-3xl grid-rows-[auto_1fr_auto] rounded-[2.2rem] border border-[rgba(212,166,70,0.18)] bg-[rgba(28,28,26,0.52)] px-5 py-5 shadow-sacred md:px-8 md:py-8 text-center backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 text-left">
              <div>
                <p className="type-card-label">Full focus</p>
                <p className="type-body mt-1">{activeMode.title}{mode === 'chant' ? ` • ${chantMantra}` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFocusMode(false);
                  setRunning(false);
                }}
                className="glass-button-secondary rounded-full px-4 py-2 type-chip"
                style={{ color: 'var(--brand-primary-strong)' }}
              >
                Close
              </button>
            </div>
            <div className="flex min-h-0 flex-col items-center justify-center gap-6">
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: 'mountains', label: 'Snow peaks' },
                  { id: 'temple', label: 'Temple dawn' },
                  { id: 'forest', label: 'Forest quiet' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocusEnvironment(item.id as 'mountains' | 'temple' | 'forest')}
                    className={`rounded-full px-3 py-1.5 type-chip ${focusEnvironment === item.id ? 'text-[#1c1c1a]' : 'bg-[rgba(28,28,26,0.45)] text-[color:var(--text-dim)]'}`}
                    style={focusEnvironment === item.id ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="type-card-label">
                {activeMode.title}
              </p>
              <motion.div
                className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[rgba(212,166,70,0.18)]"
                animate={{ scale: running ? [1, 1.06, 1] : 1 }}
                transition={{ duration: 4.2, repeat: running ? Infinity : 0, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(circle at 50% 35%, rgba(240, 200, 109, 0.16), rgba(28,28,26,0.28) 68%)' }}
              >
                <div className="text-center">
                  <p className="type-metric text-[32px]">{formatClock(remaining)}</p>
                  <p className="type-micro mt-2">{mode === 'chant' ? chantMantra : activeMode.mantra}</p>
                </div>
              </motion.div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--brand-primary-soft)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-primary-strong), var(--brand-primary))' }}
                />
              </div>
              {mode === 'chant' ? (
                <ChantAudioPlayer
                  title="Focus chant"
                  trackIds={chantTrackIds}
                  initialTrackId={activeChant.audioTrackId ?? undefined}
                  compact
                />
              ) : null}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setRunning((current) => !current);
                  playBeadTapFeedback();
                }}
                className="glass-button-primary rounded-full px-5 py-4 type-chip text-[#1c1c1a]"
              >
                {running ? 'Pause' : 'Begin'}
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setRemaining(duration * 60);
                }}
                className="glass-button-secondary rounded-full px-5 py-4 type-chip"
                style={{ color: 'var(--brand-primary-strong)' }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getFocusEnvironmentStyle(environment: 'mountains' | 'temple' | 'forest') {
  if (environment === 'mountains') {
    return 'linear-gradient(180deg, #15181d 0%, #1e2630 36%, #2f3943 100%)';
  }
  if (environment === 'forest') {
    return 'linear-gradient(180deg, #162018 0%, #1d2c22 38%, #2a3a2d 100%)';
  }
  return 'linear-gradient(180deg, #221815 0%, #342420 40%, #493127 100%)';
}
