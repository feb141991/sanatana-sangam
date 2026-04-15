'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { BHAKTI_MANTRAS } from '@/lib/bhakti-practice';
import { playBeadTapFeedback } from '@/lib/practice-feedback';

const DURATIONS = [12, 24, 48];

const MODES = [
  {
    id: 'reading',
    title: 'Reading',
    description: 'Calm scripture reading with less noise.',
    mantra: 'Read slowly. Pause often. Return gently.',
    breathLabel: null,
  },
  {
    id: 'breath',
    title: 'Breath',
    description: 'Quiet sitting with steady attention.',
    mantra: 'Inhale softly. Exhale longer.',
    breathLabel: 'Breathe with the circle',
  },
  {
    id: 'chant',
    title: 'Chant',
    description: 'Simple chanting or listening session.',
    mantra: 'One mantra. One rhythm. One mind.',
    breathLabel: null,
  },
] as const;

/* ─── Environment definitions ─────────────────────────────────────── */
type EnvId = 'temple' | 'mountains' | 'forest' | 'river' | 'night';

const ENVIRONMENTS: Record<
  EnvId,
  {
    label: string;
    emoji: string;
    bg: string;
    particleColor: string;
    glowColor: string;
  }
> = {
  temple: {
    label: 'Temple Dawn',
    emoji: '🪔',
    bg: 'linear-gradient(180deg, #221410 0%, #341e14 38%, #4a2c1e 100%)',
    particleColor: 'rgba(255,190,60,',
    glowColor: 'rgba(212,120,20,',
  },
  mountains: {
    label: 'Snow Peaks',
    emoji: '🏔️',
    bg: 'linear-gradient(180deg, #141820 0%, #1e2834 38%, #2c3a48 100%)',
    particleColor: 'rgba(220,235,255,',
    glowColor: 'rgba(140,180,255,',
  },
  forest: {
    label: 'Forest Still',
    emoji: '🌿',
    bg: 'linear-gradient(180deg, #111a13 0%, #182218 38%, #233025 100%)',
    particleColor: 'rgba(100,220,120,',
    glowColor: 'rgba(60,180,80,',
  },
  river: {
    label: 'Sacred River',
    emoji: '🌊',
    bg: 'linear-gradient(180deg, #0d1520 0%, #122030 40%, #1a2e40 100%)',
    particleColor: 'rgba(80,180,220,',
    glowColor: 'rgba(40,140,200,',
  },
  night: {
    label: 'Night Sky',
    emoji: '✨',
    bg: 'linear-gradient(180deg, #06080f 0%, #0e1020 40%, #12152a 100%)',
    particleColor: 'rgba(220,210,255,',
    glowColor: 'rgba(160,140,255,',
  },
};

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ─── Snowfall for mountains ─────────────────────────────────────── */
function SnowParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={`snow-${i}`}
          className="absolute rounded-full bg-white/80"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${(i * 6.8) % 98}%`,
          }}
          initial={{ y: '-5vh', opacity: 0 }}
          animate={{
            y: '108vh',
            x: [0, i % 2 === 0 ? 14 : -14, 0],
            opacity: [0, 0.75, 0.75, 0],
          }}
          transition={{
            duration: 7 + (i % 4) * 1.5,
            repeat: Infinity,
            delay: i * 0.55,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Firefly sparks for forest ──────────────────────────────────── */
function FireflyParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`fly-${i}`}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            left: `${(i * 8.1) % 95}%`,
            top: `${20 + (i * 5.5) % 60}%`,
            background: 'rgba(120,240,100,0.9)',
            boxShadow: '0 0 6px rgba(100,220,80,0.8)',
          }}
          animate={{
            x: [0, (i % 2 === 0 ? 18 : -18), 8, -8, 0],
            y: [0, -12, 6, -8, 0],
            opacity: [0, 0.8, 0.3, 0.9, 0],
            scale: [0.5, 1, 0.6, 1.2, 0.5],
          }}
          transition={{
            duration: 4 + (i % 3) * 1.5,
            repeat: Infinity,
            delay: i * 0.65,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Temple lamp particles ──────────────────────────────────────── */
function TempleParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={`lamp-${i}`}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 2),
            height: 2 + (i % 2),
            left: `${15 + (i * 7.5) % 72}%`,
            bottom: '15%',
            background: `rgba(255,180,50,0.7)`,
          }}
          animate={{
            y: [0, -(40 + i * 15)],
            x: [0, i % 2 === 0 ? 8 : -7],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1.4, 0.2],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Night stars ─────────────────────────────────────────────────── */
function NightStars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: 1 + (i % 2),
            height: 1 + (i % 2),
            left: `${(i * 3.3) % 99}%`,
            top: `${(i * 3.7) % 70}%`,
            opacity: 0.3 + (i % 5) * 0.12,
          }}
          animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{
            duration: 1.8 + (i % 4) * 0.8,
            repeat: Infinity,
            delay: i * 0.22,
          }}
        />
      ))}
      {/* Milky way shimmer */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, transparent 0%, rgba(180,160,255,0.04) 40%, transparent 70%)',
        }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    </div>
  );
}

/* ─── River ripples ───────────────────────────────────────────────── */
function RiverRipples() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute left-1/2 rounded-full border border-blue-400/20"
          style={{
            width: 60 + i * 55,
            height: 60 + i * 55,
            bottom: -20 - i * 20,
            marginLeft: -(30 + i * 27.5),
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{
            duration: 4 + i * 1.2,
            repeat: Infinity,
            delay: i * 0.9,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function EnvParticles({ env }: { env: EnvId }) {
  if (env === 'mountains') return <SnowParticles />;
  if (env === 'forest') return <FireflyParticles />;
  if (env === 'temple') return <TempleParticles />;
  if (env === 'night') return <NightStars />;
  if (env === 'river') return <RiverRipples />;
  return null;
}

/* ─── Breathing circle ───────────────────────────────────────────── */
function BreathCircle({
  running,
  glowColor,
}: {
  running: boolean;
  glowColor: string;
}) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [label, setLabel] = useState('Inhale');

  useEffect(() => {
    if (!running) return;
    let timeout: ReturnType<typeof setTimeout>;
    function cycle() {
      setPhase('inhale');
      setLabel('Inhale');
      timeout = setTimeout(() => {
        setPhase('hold');
        setLabel('Hold');
        timeout = setTimeout(() => {
          setPhase('exhale');
          setLabel('Exhale');
          timeout = setTimeout(cycle, 6000);
        }, 2000);
      }, 4000);
    }
    cycle();
    return () => clearTimeout(timeout);
  }, [running]);

  const scale = phase === 'inhale' ? 1.4 : phase === 'exhale' ? 0.85 : 1.4;
  const duration = phase === 'inhale' ? 4 : phase === 'hold' ? 2 : 6;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          width: 152,
          height: 152,
          borderColor: `${glowColor}0.25)`,
          boxShadow: `0 0 24px ${glowColor}0.18)`,
        }}
        animate={{ scale: running ? scale : 1, opacity: running ? 1 : 0.4 }}
        transition={{ duration, ease: running ? 'easeInOut' : 'linear' }}
      />
      {/* Inner fill */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${glowColor}0.22) 0%, transparent 70%)`,
        }}
        animate={{ scale: running ? scale : 1, opacity: running ? 1 : 0.3 }}
        transition={{ duration, ease: running ? 'easeInOut' : 'linear' }}
      />
      <div className="relative text-center">
        <p className="text-xs font-medium" style={{ color: 'rgba(245,220,150,0.7)' }}>
          {running ? label : 'Ready'}
        </p>
      </div>
    </div>
  );
}

export default function ZenModePage() {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('reading');
  const [duration, setDuration] = useState(24);
  const [chantMantra, setChantMantra] = useState<string>(BHAKTI_MANTRAS[0].value);
  const [remaining, setRemaining] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusEnvironment, setFocusEnvironment] = useState<EnvId>('temple');
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

  const activeMode = useMemo(
    () => MODES.find((item) => item.id === mode) ?? MODES[0],
    [mode],
  );
  const activeChant = useMemo(
    () =>
      BHAKTI_MANTRAS.find((item) => item.value === chantMantra) ??
      BHAKTI_MANTRAS[0],
    [chantMantra],
  );
  const progress = ((duration * 60 - remaining) / (duration * 60)) * 100;
  const chantTrackIds = activeChant.audioTrackId
    ? [activeChant.audioTrackId]
    : ['gayatri-mantra-as-it-is', 'guru-stotram', 'kirtana-in-hindi'];

  const activeEnv = ENVIRONMENTS[focusEnvironment];

  return (
    <div className="fade-in space-y-5">
      {/* ── Mode selection header ─────────────────── */}
      <section
        className="relative overflow-hidden rounded-[2rem] px-5 py-6 md:px-7"
        style={{
          background:
            'linear-gradient(160deg, rgba(30,18,10,0.92) 0%, rgba(20,12,8,0.96) 100%)',
          border: '1px solid rgba(212,166,70,0.16)',
        }}
      >
        <div className="relative space-y-4">
          <div className="inline-flex rounded-full px-3 py-1 text-xs"
            style={{ background: 'rgba(212,166,70,0.1)', color: 'rgba(212,166,70,0.7)', border: '1px solid rgba(212,166,70,0.18)' }}>
            Zen mode
          </div>
          <div>
            <h1 className="type-screen-title" style={{ color: '#f5dfa0' }}>
              A quieter surface
            </h1>
            <p className="type-body mt-2 max-w-2xl" style={{ color: 'rgba(245,210,130,0.5)' }}>
              Less chrome. More stillness. One clear devotional focus.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className="rounded-[1.5rem] px-4 py-4 text-left transition"
                style={{
                  background:
                    mode === item.id
                      ? 'rgba(212,166,70,0.12)'
                      : 'rgba(28,18,10,0.7)',
                  border: `1px solid ${mode === item.id ? 'rgba(212,166,70,0.3)' : 'rgba(212,166,70,0.1)'}`,
                }}
              >
                <p className="type-card-heading" style={{ color: mode === item.id ? '#f5dfa0' : 'rgba(245,220,150,0.6)' }}>
                  {item.title}
                </p>
                <p className="type-body mt-1" style={{ color: 'rgba(245,210,130,0.45)' }}>
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timer + practice ──────────────────────── */}
      <section
        className="rounded-[2rem] px-5 py-6 text-center"
        style={{
          background: 'rgba(18,12,8,0.92)',
          border: '1px solid rgba(212,166,70,0.1)',
        }}
      >
        <p className="type-card-label" style={{ color: 'rgba(245,210,130,0.6)' }}>
          {activeMode.title}
        </p>

        {/* Breathing circle for breath mode */}
        {mode === 'breath' ? (
          <div className="my-4 flex justify-center">
            <BreathCircle
              running={running}
              glowColor="rgba(180,140,60,"
            />
          </div>
        ) : (
          <p className="type-metric mt-3" style={{ color: '#f5dfa0' }}>
            {formatClock(remaining)}
          </p>
        )}

        {mode === 'breath' && (
          <p className="type-metric mt-1" style={{ color: '#f5dfa0', fontSize: '2rem' }}>
            {formatClock(remaining)}
          </p>
        )}

        <p className="type-body mt-3" style={{ color: 'rgba(245,210,130,0.5)' }}>
          {activeMode.mantra}
        </p>

        <div className="mx-auto mt-5 h-1.5 max-w-xs overflow-hidden rounded-full"
          style={{ background: 'rgba(212,166,70,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                'linear-gradient(90deg, rgba(212,120,20,0.8), rgba(212,166,70,0.9))',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {DURATIONS.map((value) => (
            <button
              key={value}
              onClick={() => setDuration(value)}
              className="rounded-full px-4 py-2 type-chip transition"
              style={
                duration === value
                  ? {
                      background:
                        'linear-gradient(135deg, rgba(212,120,20,0.9), rgba(212,166,70,0.8))',
                      color: '#1c1208',
                    }
                  : {
                      background: 'rgba(28,18,10,0.7)',
                      color: 'rgba(245,210,130,0.5)',
                      border: '1px solid rgba(212,166,70,0.14)',
                    }
              }
            >
              {value} min
            </button>
          ))}
        </div>

        {mode === 'chant' ? (
          <div
            className="mt-5 rounded-[1.5rem] px-4 py-4 text-left"
            style={{
              background: 'rgba(28,18,10,0.8)',
              border: '1px solid rgba(212,166,70,0.14)',
            }}
          >
            <p className="type-card-heading" style={{ color: '#f5dfa0' }}>
              Chant focus
            </p>
            <select
              value={chantMantra}
              onChange={(event) => setChantMantra(event.target.value)}
              className="type-body mt-3 w-full rounded-xl px-4 py-3 outline-none"
              style={{
                background: 'rgba(18,12,8,0.9)',
                border: '1px solid rgba(212,166,70,0.14)',
                color: 'rgba(245,220,150,0.8)',
              }}
            >
              {BHAKTI_MANTRAS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value}
                </option>
              ))}
            </select>
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
            className="rounded-full px-6 py-3 type-chip font-medium transition"
            style={{
              background: running
                ? 'rgba(212,166,70,0.15)'
                : 'linear-gradient(135deg, rgba(212,120,20,0.9), rgba(212,166,70,0.8))',
              color: running ? 'rgba(245,210,130,0.8)' : '#1c1208',
              border: '1px solid rgba(212,166,70,0.25)',
            }}
          >
            {running ? 'Pause' : 'Begin'}
          </button>
          <button
            onClick={() => {
              setFocusMode(true);
              setRunning(true);
            }}
            className="rounded-full px-6 py-3 type-chip font-medium transition"
            style={{
              background: 'rgba(212,166,70,0.1)',
              color: 'rgba(212,166,70,0.8)',
              border: '1px solid rgba(212,166,70,0.22)',
            }}
          >
            Full focus
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setRemaining(duration * 60);
            }}
            className="rounded-full px-5 py-3 type-chip transition"
            style={{ color: 'rgba(245,210,130,0.5)', border: '1px solid rgba(212,166,70,0.1)' }}
          >
            Reset
          </button>
        </div>
      </section>

      {/* ── Environment selector (visible outside focus mode) ──────── */}
      <section
        className="rounded-[1.8rem] p-5"
        style={{
          background: 'rgba(14,10,6,0.85)',
          border: '1px solid rgba(212,166,70,0.08)',
        }}
      >
        <p className="text-xs mb-3" style={{ color: 'rgba(245,210,130,0.4)' }}>
          Choose your sanctuary
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(ENVIRONMENTS) as [EnvId, (typeof ENVIRONMENTS)[EnvId]][]).map(
            ([id, env]) => (
              <button
                key={id}
                onClick={() => setFocusEnvironment(id)}
                className="rounded-full px-3 py-1.5 text-xs transition"
                style={
                  focusEnvironment === id
                    ? {
                        background: 'rgba(212,166,70,0.18)',
                        color: '#f5dfa0',
                        border: '1px solid rgba(212,166,70,0.3)',
                      }
                    : {
                        background: 'rgba(28,18,10,0.6)',
                        color: 'rgba(245,210,130,0.45)',
                        border: '1px solid rgba(212,166,70,0.1)',
                      }
                }
              >
                {env.emoji} {env.label}
              </button>
            ),
          )}
        </div>
      </section>

      {/* ── Full focus overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[80] overflow-hidden"
            style={{ background: activeEnv.bg }}
          >
            <EnvParticles env={focusEnvironment} />

            {/* Ambient center glow */}
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 360,
                height: 360,
                background: `radial-gradient(circle, ${activeEnv.glowColor}0.12) 0%, transparent 68%)`,
              }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="mx-auto grid h-full w-full max-w-lg grid-rows-[auto_1fr_auto] px-4 py-5 text-center">
              {/* Top bar */}
              <div className="flex items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-xs font-medium" style={{ color: `${activeEnv.glowColor}0.8)` }}>
                    {activeEnv.emoji} {activeEnv.label}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: 'rgba(245,220,150,0.55)' }}>
                    {activeMode.title}
                    {mode === 'chant' ? ` · ${chantMantra}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFocusMode(false);
                    setRunning(false);
                  }}
                  className="rounded-full px-4 py-2 text-xs transition"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(245,210,130,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Close
                </button>
              </div>

              {/* Center content */}
              <div className="flex min-h-0 flex-col items-center justify-center gap-6">
                {mode === 'breath' ? (
                  <BreathCircle running={running} glowColor={activeEnv.glowColor} />
                ) : (
                  <motion.div
                    className="relative flex h-52 w-52 items-center justify-center rounded-full"
                    style={{
                      border: `1px solid ${activeEnv.glowColor}0.2)`,
                      background: `radial-gradient(circle at 50% 38%, ${activeEnv.glowColor}0.14), rgba(18,12,8,0.3) 68%)`,
                    }}
                    animate={{ scale: running ? [1, 1.05, 1] : 1 }}
                    transition={{
                      duration: 4.5,
                      repeat: running ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="text-center">
                      <p
                        className="font-mono text-4xl font-light"
                        style={{ color: '#f5dfa0' }}
                      >
                        {formatClock(remaining)}
                      </p>
                      <p className="mt-2 text-xs" style={{ color: 'rgba(245,220,150,0.5)' }}>
                        {mode === 'chant' ? chantMantra : activeMode.mantra}
                      </p>
                    </div>
                  </motion.div>
                )}

                {mode === 'breath' && (
                  <p
                    className="font-mono text-3xl font-light"
                    style={{ color: '#f5dfa0' }}
                  >
                    {formatClock(remaining)}
                  </p>
                )}

                {/* Progress bar */}
                <div
                  className="h-1 w-48 overflow-hidden rounded-full"
                  style={{ background: 'rgba(212,166,70,0.12)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${activeEnv.glowColor}0.7), ${activeEnv.glowColor}1))`,
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {mode === 'chant' ? (
                  <div className="w-full max-w-sm">
                    <ChantAudioPlayer
                      title="Focus chant"
                      trackIds={chantTrackIds}
                      initialTrackId={activeChant.audioTrackId ?? undefined}
                      compact
                    />
                  </div>
                ) : null}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    setRunning((current) => !current);
                    playBeadTapFeedback();
                  }}
                  className="rounded-full px-7 py-3.5 text-sm font-medium transition"
                  style={{
                    background: running
                      ? 'rgba(255,255,255,0.08)'
                      : `linear-gradient(135deg, ${activeEnv.glowColor}0.85), ${activeEnv.glowColor}0.6))`,
                    color: running ? 'rgba(245,210,130,0.8)' : '#1c1208',
                    border: `1px solid ${activeEnv.glowColor}0.3)`,
                  }}
                >
                  {running ? 'Pause' : 'Begin'}
                </button>
                <button
                  onClick={() => {
                    setRunning(false);
                    setRemaining(duration * 60);
                  }}
                  className="rounded-full px-5 py-3.5 text-sm transition"
                  style={{ color: 'rgba(245,210,130,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
