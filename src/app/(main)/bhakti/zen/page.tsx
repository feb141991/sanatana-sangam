'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
          <div className="clay-pill inline-flex text-xs text-gray-700">Zen mode</div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">A quieter surface</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Use this when you want less chrome, more stillness, and one clear devotional focus.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  mode === item.id ? 'bg-white shadow-sm' : 'bg-white/65'
                }`}
                style={mode === item.id ? { borderColor: 'rgba(168, 94, 113, 0.35)' } : { borderColor: 'rgba(200,127,146,0.18)' }}
              >
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-5 py-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">
          {activeMode.title}
        </p>
        <p className="mt-3 font-display text-5xl font-bold text-gray-900">{formatClock(remaining)}</p>
        <p className="mt-3 text-sm text-gray-600">{activeMode.mantra}</p>

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
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${duration === value ? 'text-white' : 'bg-white text-gray-700 border border-[rgba(200,127,146,0.18)]'}`}
              style={duration === value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
            >
              {value} min
            </button>
          ))}
        </div>

        {mode === 'chant' ? (
          <div className="mt-5 rounded-[1.5rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4 text-left">
            <p className="text-sm font-semibold text-gray-900">Chant focus</p>
            <select
              value={chantMantra}
              onChange={(event) => setChantMantra(event.target.value)}
              className="mt-3 w-full rounded-xl border border-[rgba(200,127,146,0.18)] bg-white px-4 py-3 text-sm outline-none"
            >
              {BHAKTI_MANTRAS.map((item) => (
                <option key={item.value} value={item.value}>{item.value}</option>
              ))}
            </select>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Stay with one mantra, one breath, and one pace. Rights-safe chant audio comes after the shared Bhakti audio layer is ready.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeChant.audioState === 'source_link' && activeChant.sourceUrl ? (
                <a
                  href={activeChant.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[color:var(--brand-primary-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-primary-strong)]"
                >
                  Open chant source
                </a>
              ) : (
                <span className="rounded-full border border-[color:var(--brand-primary-soft)] px-4 py-2 text-sm font-semibold text-gray-500">
                  Focus-only chant for now
                </span>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setRunning((current) => !current);
              playBeadTapFeedback();
            }}
            className="glass-button-primary rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            {running ? 'Pause' : 'Begin'}
          </button>
          <button
            onClick={() => {
              setFocusMode(true);
              setRunning(true);
            }}
            className="glass-button-primary rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Enter full focus
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setRemaining(duration * 60);
            }}
            className="glass-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
            style={{ color: 'var(--brand-primary-strong)' }}
          >
            Reset
          </button>
        </div>
      </section>

      {focusMode ? (
        <div className="fixed inset-0 z-[80] bg-[radial-gradient(circle_at_top,rgba(236,192,200,0.35),rgba(255,255,255,0.96)_45%,rgba(255,255,255,0.99))] backdrop-blur-md px-4 py-6">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-between rounded-[2.2rem] border border-white/80 bg-white/78 px-6 py-6 shadow-sacred text-center">
            <div className="flex items-center justify-between gap-3 text-left">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">Full focus</p>
                <p className="mt-1 text-sm text-gray-600">{activeMode.title}{mode === 'chant' ? ` • ${chantMantra}` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFocusMode(false);
                  setRunning(false);
                }}
                className="glass-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                style={{ color: 'var(--brand-primary-strong)' }}
              >
                Close
              </button>
            </div>
            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">
                {activeMode.title}
              </p>
              <p className="font-display text-6xl font-bold text-gray-900">{formatClock(remaining)}</p>
              <p className="text-base text-gray-600">{mode === 'chant' ? chantMantra : activeMode.mantra}</p>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--brand-primary-soft)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-primary-strong), var(--brand-primary))' }}
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setRunning((current) => !current);
                  playBeadTapFeedback();
                }}
                className="glass-button-primary rounded-full px-5 py-4 text-sm font-semibold text-white"
              >
                {running ? 'Pause' : 'Begin'}
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setRemaining(duration * 60);
                }}
                className="glass-button-secondary rounded-full px-5 py-4 text-sm font-semibold"
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
