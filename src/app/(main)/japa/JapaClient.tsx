'use client';

// ─── Japa Counter ─────────────────────────────────────────────────────────────
//
// Dark devotional theme — authentic dhyana atmosphere.
//   • Ambient floating specks, pulsing glow ring
//   • Crimson gradient bead button (no more emoji)
//   • ChantAudioPlayer shown during active session
//   • framer-motion entrance + tap-pulse animations
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, RotateCcw, ChevronDown, Flame, Music2 } from 'lucide-react';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import type { Mantra } from '@sangam/sadhana-engine';

// ── Constants ──────────────────────────────────────────────────────────────────
const BEADS_PER_MALA = 108;

// ── Tradition-aware mantra defaults ───────────────────────────────────────────
const DEFAULT_MANTRA_BY_TRADITION: Record<string, { id: string; name: string; short: string }> = {
  hindu:    { id: 'gayatri',  name: 'Gayatri Mantra',          short: 'ॐ भूर्भुवः स्वः...'   },
  sikh:     { id: 'waheguru', name: 'Waheguru Naam Simran',     short: 'ਵਾਹਿਗੁਰੂ'               },
  buddhist: { id: 'om_mani',  name: 'Om Mani Padme Hum',        short: 'ओम् मणि पद्मे हूम्'    },
  jain:     { id: 'namokar',  name: 'Namokar Mantra',           short: 'णमो अरिहंताणं...'       },
};

// Maps mantra id → audio track IDs available in devotional-audio.ts
const MANTRA_AUDIO_TRACKS: Record<string, string[]> = {
  gayatri:  ['gayatri-mantra-as-it-is'],
  waheguru: ['guru-stotram', 'gayatri-mantra-as-it-is'],
  om_mani:  ['gayatri-mantra-as-it-is'],
  namokar:  ['gayatri-mantra-as-it-is'],
};
const DEFAULT_AUDIO_TRACKS = ['gayatri-mantra-as-it-is', 'guru-stotram'];

interface DayRecord { date: string; done: boolean; }
interface Props {
  userId: string; userName: string; tradition: string;
  currentStreak: number; japaAlreadyDoneToday: boolean; history?: DayRecord[];
}

// ── Ambient floating specks ───────────────────────────────────────────────────
function JapaAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={`amb-${i}`} className="absolute rounded-full"
          style={{
            width: 1 + (i % 2), height: 1 + (i % 2),
            left: `${(i * 5.1) % 98}%`, top: `${(i * 6.9) % 78}%`,
            background: `rgba(212,140,40,${0.14 + (i % 4) * 0.07})`,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.7, 1.6, 0.7] }}
          transition={{ duration: 3.5 + (i % 5) * 0.7, repeat: Infinity, delay: i * 0.32 }}
        />
      ))}
    </div>
  );
}

// ── Mantra Picker Sheet ────────────────────────────────────────────────────────
function MantraPickerSheet({
  mantras, selected, onSelect, onClose,
}: {
  mantras: Mantra[]; selected: Mantra | null;
  onSelect: (m: Mantra) => void; onClose: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl shadow-2xl p-5 space-y-3 max-h-[75vh] overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #1f0e0a 0%, #150807 100%)', border: '1px solid rgba(212,140,40,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold" style={{ color: '#f5dfa0' }}>Choose Mantra</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'rgba(212,140,40,0.14)', color: '#f5dfa0' }}>×</button>
        </div>
        {mantras.map(m => (
          <button key={m.id} onClick={() => { onSelect(m); onClose(); }}
            className="w-full text-left rounded-2xl p-4 border transition-all"
            style={selected?.id === m.id
              ? { borderColor: 'rgba(212,140,40,0.55)', background: 'rgba(212,140,40,0.12)' }
              : { borderColor: 'rgba(212,140,40,0.12)', background: 'rgba(18,10,6,0.8)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm" style={{ color: '#f5dfa0' }}>{m.name}</p>
                <p className="text-xs mt-0.5 font-[family:var(--font-deva)]"
                  style={{ color: 'rgba(245,200,120,0.45)' }}>
                  {m.sanskrit?.split('\n')[0]?.slice(0, 50)}…
                </p>
              </div>
              {selected?.id === m.id && <Check size={18} style={{ color: '#d4a830' }} />}
            </div>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── Completion Sheet ───────────────────────────────────────────────────────────
function CompletionSheet({
  rounds, durationSecs, mantraName, streak, onClose,
}: {
  rounds: number; durationSecs: number; mantraName: string;
  streak: number; onClose: () => void;
}) {
  const mins = Math.floor(durationSecs / 60);
  const secs = durationSecs % 60;
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.72)' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl shadow-2xl p-8 space-y-6"
        style={{ background: 'linear-gradient(180deg, #200e0a 0%, #130608 100%)', border: '1px solid rgba(212,140,40,0.22)' }}>
        <div className="text-center space-y-3">
          <motion.div className="text-6xl" animate={{ scale: [0.7, 1.15, 1] }} transition={{ duration: 0.65 }}>🙏</motion.div>
          <h2 className="font-bold text-2xl" style={{ color: '#f5dfa0' }}>Japa Complete</h2>
          <p style={{ color: 'rgba(245,200,120,0.5)' }}>
            {rounds} mala{rounds > 1 ? 's' : ''} of {mantraName}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rounds', value: `${rounds}` },
            { label: 'Beads',  value: `${rounds * BEADS_PER_MALA}` },
            { label: 'Time',   value: `${mins}m ${secs}s` },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center border"
              style={{ background: 'rgba(180,60,20,0.09)', borderColor: 'rgba(212,140,40,0.18)' }}>
              <p className="font-bold text-xl" style={{ color: '#d4a830' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245,200,120,0.42)' }}>{s.label}</p>
            </div>
          ))}
        </div>
        {streak > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-2xl p-3 border"
            style={{ background: 'rgba(180,100,10,0.1)', borderColor: 'rgba(212,140,40,0.2)' }}>
            <Flame size={20} style={{ color: '#d4a830' }} />
            <span className="font-semibold" style={{ color: '#d4a830' }}>{streak} day streak!</span>
          </div>
        )}
        <button onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-lg"
          style={{ background: 'linear-gradient(135deg, #d4643a, #7B1A1A)', color: '#f5dfa0', boxShadow: '0 4px 28px rgba(180,60,20,0.35)' }}>
          🕉️ Hari Om
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── 30-Day History Chart ──────────────────────────────────────────────────────
function JapaHistoryChart({ history = [], streak }: { history: DayRecord[]; streak: number }) {
  const today = new Date();
  const days: { date: string; done: boolean; isToday: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const record = history.find(h => h.date === dateStr);
    days.push({ date: dateStr, done: record?.done ?? false, isToday: i === 0 });
  }
  const totalDone = days.filter(d => d.done).length;
  const completionPct = Math.round((totalDone / 30) * 100);

  return (
    <div className="mx-4 mb-4 rounded-2xl border px-4 py-4 space-y-3"
      style={{ background: 'rgba(18,10,6,0.9)', borderColor: 'rgba(212,140,40,0.12)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: '#f5dfa0' }}>Last 30 days</p>
        <div className="flex items-center gap-3 text-xs">
          {streak > 0 && (
            <span className="flex items-center gap-1" style={{ color: '#d4a830' }}>
              <Flame size={12} /> {streak}d streak
            </span>
          )}
          <span style={{ color: 'rgba(245,200,120,0.4)' }}>{totalDone}/30</span>
        </div>
      </div>
      <div className="grid gap-[5px]" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map(day => (
          <div key={day.date} title={`${day.date}${day.done ? ' ✓' : ''}`}
            className="aspect-square rounded-md transition-all"
            style={{
              background: day.done ? 'linear-gradient(135deg,#d4643a,#7B1A1A)' : day.isToday ? 'rgba(123,26,26,0.22)' : 'rgba(212,140,40,0.06)',
              boxShadow: day.isToday ? 'inset 0 0 0 1.5px rgba(212,140,40,0.3)' : undefined,
            }} />
        ))}
      </div>
      <div className="space-y-1">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(212,140,40,0.1)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg,#7B1A1A,#d4643a)' }} />
        </div>
        <p className="text-[10px]" style={{ color: 'rgba(245,200,120,0.32)' }}>{completionPct}% consistency this month</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function JapaClient({
  userId, userName, tradition, currentStreak, japaAlreadyDoneToday, history = [],
}: Props) {
  const router = useRouter();
  const { engine, isReady } = useEngine();

  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [selectedMantra, setMantra] = useState<Mantra | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [beadCount, setBeadCount] = useState(0);
  const [roundsDone, setRounds] = useState(0);
  const [targetRounds, setTarget] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [showComplete, setComplete] = useState(false);
  const [duration, setDuration] = useState(0);
  const [streak, setStreak] = useState(currentStreak);
  const [tapFlash, setTapFlash] = useState(false);

  const startedAt = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load mantras
  useEffect(() => {
    if (!isReady || !engine) return;
    engine.mantras.getByTradition(tradition as any).then(list => {
      setMantras(list);
      if (list.length > 0) setMantra(list[0]);
    }).catch(() => {
      const d = DEFAULT_MANTRA_BY_TRADITION[tradition] ?? DEFAULT_MANTRA_BY_TRADITION.hindu;
      const fallback: Mantra = { id: d.id, name: d.name, sanskrit: d.short, transliteration: '', deity: '', tradition: tradition as any, beads_per_round: 108 };
      setMantras([fallback]);
      setMantra(fallback);
    });
  }, [isReady, engine, tradition]);

  // Timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const startSession = useCallback(() => {
    setIsActive(true);
    setBeadCount(0);
    setRounds(0);
    setDuration(0);
    startedAt.current = new Date().toISOString();
  }, []);

  const countBead = useCallback(async () => {
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 130);
    await hapticLight();
    setBeadCount(prev => {
      const next = prev + 1;
      if (next >= BEADS_PER_MALA) {
        setRounds(r => {
          const newRounds = r + 1;
          if (newRounds >= targetRounds) {
            setIsActive(false);
            finishSession(newRounds);
          }
          return newRounds;
        });
        return 0;
      }
      return next;
    });
  }, [targetRounds]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishSession = useCallback(async (rounds: number) => {
    await hapticSuccess();
    if (!engine || !selectedMantra) return;
    try {
      await engine.tracker.trackJapaSession({
        mantra_id: selectedMantra.id, mantra_name: selectedMantra.name,
        rounds_completed: rounds, beads_count: rounds * BEADS_PER_MALA,
        duration_seconds: duration, completed: true,
        started_at: startedAt.current, completed_at: new Date().toISOString(),
      });
      const streakRecord = await engine.streaks.getTodayRecord(userId);
      setStreak(streakRecord.streak_count);
    } catch (err) { console.error('[Japa] tracking failed:', err); }
    setComplete(true);
  }, [engine, selectedMantra, userId, duration]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = beadCount / BEADS_PER_MALA;
  const strokeOffset = circumference * (1 - progress);
  const defaultMantra = DEFAULT_MANTRA_BY_TRADITION[tradition] ?? DEFAULT_MANTRA_BY_TRADITION.hindu;
  const audioTrackIds = MANTRA_AUDIO_TRACKS[selectedMantra?.id ?? defaultMantra.id] ?? DEFAULT_AUDIO_TRACKS;

  return (
    <div className="relative min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #110809 0%, #1a0d0a 45%, #130c06 100%)' }}>

      {/* Ambient particles */}
      <JapaAmbient />

      {/* Central deep glow */}
      <motion.div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(160,40,10,0.14) 0%, transparent 68%)' }}
        animate={{ scale: [1, 1.14, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <motion.div className="relative flex items-center gap-3 px-4 pt-5 pb-2"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(212,140,40,0.1)', border: '1px solid rgba(212,140,40,0.2)' }}>
          <ChevronLeft size={20} style={{ color: '#d4a830' }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg" style={{ color: '#f5dfa0' }}>Japa Counter</h1>
          <p className="text-xs" style={{ color: 'rgba(245,200,120,0.38)' }}>मन, वाक्, कर्म</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 rounded-xl px-3 py-1.5"
            style={{ background: 'rgba(212,140,40,0.1)', border: '1px solid rgba(212,140,40,0.2)' }}>
            <Flame size={14} style={{ color: '#d4a830' }} />
            <span className="text-xs font-semibold" style={{ color: '#d4a830' }}>{streak}d</span>
          </div>
        )}
      </motion.div>

      {/* Already done today banner */}
      {japaAlreadyDoneToday && (
        <div className="mx-4 mb-2 rounded-xl px-4 py-2 flex items-center gap-2"
          style={{ background: 'rgba(40,100,60,0.18)', border: '1px solid rgba(80,160,80,0.18)' }}>
          <Check size={16} style={{ color: '#6abf6a' }} />
          <span className="text-sm font-medium" style={{ color: '#8ed48e' }}>Japa already completed today 🙏</span>
        </div>
      )}

      {/* Setup panel — mantra + rounds */}
      <AnimatePresence>
        {!isActive && !showComplete && (
          <motion.div className="relative px-4 mb-3 space-y-2.5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}>
            <button onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ background: 'rgba(18,10,6,0.85)', borderColor: 'rgba(212,140,40,0.18)' }}>
              <div className="text-left">
                <p className="text-xs font-medium" style={{ color: 'rgba(245,200,120,0.42)' }}>Mantra</p>
                <p className="font-semibold mt-0.5" style={{ color: '#f5dfa0' }}>
                  {selectedMantra?.name ?? defaultMantra.name}
                </p>
              </div>
              <ChevronDown size={18} style={{ color: 'rgba(212,140,40,0.45)' }} />
            </button>

            <div className="flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ background: 'rgba(18,10,6,0.85)', borderColor: 'rgba(212,140,40,0.14)' }}>
              <span className="text-sm font-medium" style={{ color: 'rgba(245,200,120,0.6)' }}>Rounds</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 11].map(n => (
                  <button key={n} onClick={() => setTarget(n)}
                    className="w-8 h-8 rounded-xl text-sm font-bold transition-all"
                    style={targetRounds === n
                      ? { background: 'linear-gradient(135deg,#d4643a,#7B1A1A)', color: '#f5dfa0' }
                      : { background: 'rgba(212,140,40,0.09)', color: 'rgba(245,200,120,0.5)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main counter area ────────────────────────────────────────────────── */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 gap-5">

        {/* SVG progress ring */}
        <div className="relative" style={{ width: 220, height: 220 }}>
          {/* Outer pulsing glow ring */}
          <motion.div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(180,60,20,0.16) 0%, transparent 65%)' }}
            animate={{ scale: isActive ? [1, 1.12, 1] : 1, opacity: isActive ? [0.6, 1, 0.6] : 0.4 }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          <svg width="220" height="220" className="rotate-[-90deg]">
            {/* Track ring */}
            <circle cx="110" cy="110" r={radius}
              fill="none" stroke="rgba(212,140,40,0.1)" strokeWidth="8" />
            {/* Progress arc with glow gradient */}
            <circle cx="110" cy="110" r={radius}
              fill="none" stroke="url(#japaGrad)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 0.15s ease', filter: 'drop-shadow(0 0 7px rgba(212,100,20,0.75))' }}
            />
            <defs>
              <linearGradient id="japaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4643a" />
                <stop offset="100%" stopColor="#d4a830" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central bead button */}
          <button
            onPointerDown={isActive ? countBead : undefined}
            onClick={!isActive ? startSession : undefined}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <motion.div
              animate={{ scale: tapFlash ? 0.86 : 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 18 }}
              className="flex flex-col items-center gap-2"
            >
              {isActive ? (
                <>
                  {/* The bead — crimson gradient sphere */}
                  <div style={{
                    width: 82, height: 82, borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 30%, #e07050 0%, #8B1A1A 52%, #3d0d0d 100%)',
                    boxShadow: tapFlash
                      ? '0 0 52px rgba(220,90,30,1), 0 0 90px rgba(200,70,20,0.55), inset 0 3px 8px rgba(255,180,120,0.35)'
                      : '0 0 26px rgba(180,55,20,0.6), 0 0 52px rgba(160,40,10,0.25), inset 0 2px 6px rgba(255,160,80,0.22)',
                    border: '2px solid rgba(220,150,60,0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'box-shadow 0.12s ease',
                  }}>
                    <span className="text-3xl font-bold leading-none" style={{ color: '#fde8c8', textShadow: '0 0 14px rgba(255,200,120,0.5)' }}>
                      {beadCount}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(245,200,120,0.45)' }}>of 108 beads</span>
                </>
              ) : (
                <>
                  {/* Start bead */}
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 32%, #cc6040 0%, #7B1A1A 65%)',
                    boxShadow: '0 0 22px rgba(180,55,20,0.45)',
                    border: '2px solid rgba(212,140,40,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 28, lineHeight: 1, marginLeft: 3 }}>▶</span>
                  </div>
                  <motion.span className="text-sm font-semibold" style={{ color: '#d4a830' }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity }}>
                    Begin
                  </motion.span>
                </>
              )}
            </motion.div>
          </button>
        </div>

        {/* Round counter + timer */}
        <AnimatePresence>
          {isActive && (
            <motion.div className="flex gap-6"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: '#d4643a' }}>{roundsDone}</p>
                <p className="text-xs" style={{ color: 'rgba(245,200,120,0.42)' }}>Rounds done</p>
              </div>
              <div className="w-px" style={{ background: 'rgba(212,140,40,0.15)' }} />
              <div className="text-center">
                <p className="text-3xl font-bold font-mono" style={{ color: '#f5dfa0' }}>{formatTime(duration)}</p>
                <p className="text-xs" style={{ color: 'rgba(245,200,120,0.42)' }}>Time</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mantra text — softly breathing */}
        <motion.div className="text-center px-4"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
          <p className="font-bold font-[family:var(--font-deva)] text-lg leading-relaxed"
            style={{ color: '#f5dfa0', textShadow: '0 0 22px rgba(212,140,40,0.28)' }}>
            {selectedMantra?.sanskrit?.split('\n')[0] ?? defaultMantra.short}
          </p>
          {selectedMantra?.transliteration && (
            <p className="text-xs mt-1 italic" style={{ color: 'rgba(245,200,120,0.38)' }}>
              {selectedMantra.transliteration.split('\n')[0]}
            </p>
          )}
        </motion.div>

        {/* Mantra audio player — visible during active session */}
        <AnimatePresence>
          {isActive && (
            <motion.div className="w-full max-w-xs"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.25 }}>
              <div className="rounded-2xl overflow-hidden border"
                style={{ borderColor: 'rgba(212,140,40,0.18)', background: 'rgba(14,8,4,0.5)' }}>
                <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                  <Music2 size={11} style={{ color: 'rgba(212,140,40,0.5)' }} />
                  <p className="text-[10px] tracking-wide" style={{ color: 'rgba(245,200,120,0.4)' }}>Mantra Audio</p>
                </div>
                <ChantAudioPlayer
                  title="Japa companion"
                  trackIds={audioTrackIds}
                  compact
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="relative px-4 pb-8 pt-3 space-y-3">
        {isActive && (
          <button
            onClick={() => { setIsActive(false); finishSession(roundsDone + (beadCount > 0 ? 1 : 0)); }}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ background: 'linear-gradient(135deg,#d4643a,#7B1A1A)', color: '#f5dfa0', boxShadow: '0 4px 26px rgba(180,60,20,0.32)' }}>
            Complete Session ✓
          </button>
        )}
        {isActive && (
          <button
            onClick={() => { setIsActive(false); setBeadCount(0); setRounds(0); setDuration(0); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-medium text-sm"
            style={{ borderColor: 'rgba(212,140,40,0.15)', color: 'rgba(245,200,120,0.45)' }}>
            <RotateCcw size={15} /> Reset
          </button>
        )}
        {!isActive && !showComplete && (
          <p className="text-center text-xs" style={{ color: 'rgba(245,200,120,0.28)' }}>
            Tap ▶ to start · Tap the bead for each mantra repetition
          </p>
        )}
      </div>

      {/* 30-day history */}
      {!isActive && !showComplete && (
        <JapaHistoryChart history={history} streak={streak} />
      )}

      {/* Modals */}
      <AnimatePresence>
        {showPicker && (
          <MantraPickerSheet mantras={mantras} selected={selectedMantra}
            onSelect={setMantra} onClose={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showComplete && (
          <CompletionSheet rounds={roundsDone} durationSecs={duration}
            mantraName={selectedMantra?.name ?? defaultMantra.name}
            streak={streak} onClose={() => { setComplete(false); router.back(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
