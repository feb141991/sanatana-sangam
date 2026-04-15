'use client';

// ─── Japa Counter ─────────────────────────────────────────────────────────────
//
// A full mala-counting session screen.
//   1. User picks a mantra (from engine.mantras.getAll() for their tradition)
//   2. Taps the large bead button 108 × rounds
//   3. On completion → engine.tracker.trackJapaSession() logs the session
//   4. Haptic feedback on native (Capacitor), silent on web
//   5. Streak is updated on the server via the streaks table
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, RotateCcw, ChevronDown, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import type { Mantra } from '@sangam/sadhana-engine';

// ── Constants ──────────────────────────────────────────────────────────────────
const BEADS_PER_MALA = 108;

// ── Tradition-aware mantra defaults ───────────────────────────────────────────
const DEFAULT_MANTRA_BY_TRADITION: Record<string, { id: string; name: string; short: string }> = {
  hindu:    { id: 'gayatri',      name: 'Gayatri Mantra',          short: 'ॐ भूर्भुवः स्वः...'   },
  sikh:     { id: 'waheguru',     name: 'Waheguru Naam Simran',     short: 'ਵਾਹਿਗੁਰੂ'               },
  buddhist: { id: 'om_mani',      name: 'Om Mani Padme Hum',        short: 'ओम् मणि पद्मे हूम्'    },
  jain:     { id: 'namokar',      name: 'Namokar Mantra',           short: 'णमो अरिहंताणं...'       },
};

interface DayRecord {
  date: string;   // YYYY-MM-DD
  done: boolean;
}

interface Props {
  userId:               string;
  userName:             string;
  tradition:            string;
  currentStreak:        number;
  japaAlreadyDoneToday: boolean;
  history?:             DayRecord[];
}

// ── Mantra Picker Sheet ────────────────────────────────────────────────────────
function MantraPickerSheet({
  mantras, selected, onSelect, onClose,
}: {
  mantras: Mantra[];
  selected: Mantra | null;
  onSelect: (m: Mantra) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-auto bg-white rounded-t-3xl shadow-2xl p-5 space-y-3 max-h-[75vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">Choose Mantra</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg">
            ×
          </button>
        </div>
        {mantras.map(m => (
          <button
            key={m.id}
            onClick={() => { onSelect(m); onClose(); }}
            className={`w-full text-left rounded-2xl p-4 border transition-all ${
              selected?.id === m.id
                ? 'border-[#7B1A1A] bg-[#7B1A1A]/5'
                : 'border-gray-100 hover:border-orange-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-[family:var(--font-deva)]">
                  {m.sanskrit?.split('\n')[0]?.slice(0, 50)}…
                </p>
              </div>
              {selected?.id === m.id && (
                <Check size={18} className="text-[#7B1A1A] shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-t-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="text-6xl">🙏</div>
          <h2 className="font-bold text-2xl text-gray-900">Japa Complete!</h2>
          <p className="text-gray-500">
            {rounds} mala{rounds > 1 ? 's' : ''} of {mantraName}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rounds',  value: `${rounds}` },
            { label: 'Beads',   value: `${rounds * BEADS_PER_MALA}` },
            { label: 'Time',    value: `${mins}m ${secs}s` },
          ].map(s => (
            <div key={s.label}
              className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
              <p className="font-bold text-xl text-[#7B1A1A]">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        {streak > 0 && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 rounded-2xl p-3 border border-amber-100">
            <Flame size={20} className="text-amber-500" />
            <span className="font-semibold text-amber-700">{streak} day streak!</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg"
          style={{ background: '#7B1A1A' }}
        >
          🕉️ Hari Om
        </button>
      </div>
    </div>
  );
}

// ── 30-Day History Chart ──────────────────────────────────────────────────────
function JapaHistoryChart({ history = [], streak }: { history: DayRecord[]; streak: number }) {
  // Build a complete 30-day window (today → 29 days back) aligned to dates
  const today = new Date();
  const days: { date: string; done: boolean; isToday: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const record  = history.find(h => h.date === dateStr);
    days.push({ date: dateStr, done: record?.done ?? false, isToday: i === 0 });
  }

  const totalDone    = days.filter(d => d.done).length;
  const completionPct = Math.round((totalDone / 30) * 100);

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl border border-orange-100 shadow-sm px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Last 30 days</p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {streak > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Flame size={12} /> {streak}d streak
            </span>
          )}
          <span>{totalDone}/30 days</span>
        </div>
      </div>

      {/* Dot grid — 6 rows × 5 cols = 30 days */}
      <div className="grid gap-[5px]" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}${day.done ? ' ✓' : ''}`}
            className="aspect-square rounded-md transition-all"
            style={{
              background: day.done
                ? '#7B1A1A'
                : day.isToday
                  ? 'rgba(123,26,26,0.12)'
                  : '#f3f4f6',
              boxShadow: day.isToday ? 'inset 0 0 0 1.5px rgba(123,26,26,0.35)' : undefined,
            }}
          />
        ))}
      </div>

      {/* Completion bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${completionPct}%`, background: '#7B1A1A' }}
          />
        </div>
        <p className="text-[10px] text-gray-400">{completionPct}% consistency this month</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function JapaClient({
  userId, userName, tradition, currentStreak, japaAlreadyDoneToday, history = [],
}: Props) {
  const router  = useRouter();
  const { engine, isReady } = useEngine();

  // ── State ──────────────────────────────────────────────────────────────────
  const [mantras,      setMantras]      = useState<Mantra[]>([]);
  const [selectedMantra, setMantra]     = useState<Mantra | null>(null);
  const [showPicker,   setShowPicker]   = useState(false);
  const [beadCount,    setBeadCount]    = useState(0);
  const [roundsDone,   setRounds]       = useState(0);
  const [targetRounds, setTarget]       = useState(1);
  const [isActive,     setIsActive]     = useState(false);
  const [showComplete, setComplete]     = useState(false);
  const [duration,     setDuration]     = useState(0);
  const [streak,       setStreak]       = useState(currentStreak);

  const startedAt = useRef<string>('');
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load mantras once engine is ready ─────────────────────────────────────
  useEffect(() => {
    if (!isReady || !engine) return;
    engine.mantras.getByTradition(tradition as any).then(list => {
      setMantras(list);
      if (list.length > 0) setMantra(list[0]);
    }).catch(() => {
      // Fallback: engine not yet seeded — use static defaults
      const d = DEFAULT_MANTRA_BY_TRADITION[tradition] ?? DEFAULT_MANTRA_BY_TRADITION.hindu;
      setMantras([{ id: d.id, name: d.name, sanskrit: d.short, transliteration: '', deity: '', tradition: tradition as any, beads_per_round: 108 }]);
      setMantra({ id: d.id, name: d.name, sanskrit: d.short, transliteration: '', deity: '', tradition: tradition as any, beads_per_round: 108 });
    });
  }, [isReady, engine, tradition]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  // ── Start session ──────────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    setIsActive(true);
    setBeadCount(0);
    setRounds(0);
    setDuration(0);
    startedAt.current = new Date().toISOString();
  }, []);

  // ── Count one bead ─────────────────────────────────────────────────────────
  const countBead = useCallback(async () => {
    await hapticLight();
    setBeadCount(prev => {
      const next = prev + 1;
      if (next >= BEADS_PER_MALA) {
        setRounds(r => {
          const newRounds = r + 1;
          if (newRounds >= targetRounds) {
            // Session complete!
            setIsActive(false);
            finishSession(newRounds);
          }
          return newRounds;
        });
        return 0; // reset beads for next round
      }
      return next;
    });
  }, [targetRounds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Finish session ─────────────────────────────────────────────────────────
  const finishSession = useCallback(async (rounds: number) => {
    await hapticSuccess();
    if (!engine || !selectedMantra) return;
    try {
      await engine.tracker.trackJapaSession({
        mantra_id:        selectedMantra.id,
        mantra_name:      selectedMantra.name,
        rounds_completed: rounds,
        beads_count:      rounds * BEADS_PER_MALA,
        duration_seconds: duration,
        completed:        true,
        started_at:       startedAt.current,
        completed_at:     new Date().toISOString(),
      });
      // Update streak
      const streakRecord = await engine.streaks.getTodayRecord(userId);
      setStreak(streakRecord.streak_count);
    } catch (err) {
      console.error('[Japa] tracking failed:', err);
    }
    setComplete(true);
  }, [engine, selectedMantra, userId, duration]);

  // ── Format timer display ───────────────────────────────────────────────────
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Progress ring math ─────────────────────────────────────────────────────
  const radius       = 90;
  const circumference = 2 * Math.PI * radius;
  const progress      = beadCount / BEADS_PER_MALA;
  const strokeOffset  = circumference * (1 - progress);

  const defaultMantra = DEFAULT_MANTRA_BY_TRADITION[tradition] ?? DEFAULT_MANTRA_BY_TRADITION.hindu;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#fdf6e3] to-[#f5ede0]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/80 border border-orange-100 flex items-center justify-center shadow-sm">
          <ChevronLeft size={20} className="text-[#7B1A1A]" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-[#7B1A1A] text-lg">Japa Counter</h1>
          <p className="text-xs text-gray-500">मन, वाक्, कर्म</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
            <Flame size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{streak}d</span>
          </div>
        )}
      </div>

      {/* Already done today banner */}
      {japaAlreadyDoneToday && (
        <div className="mx-4 mb-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <Check size={16} className="text-green-600" />
          <span className="text-sm text-green-700 font-medium">Japa already completed today 🙏</span>
        </div>
      )}

      {/* Mantra selector */}
      {!isActive && !showComplete && (
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-between bg-white rounded-2xl border border-orange-100 px-4 py-3 shadow-sm"
          >
            <div className="text-left">
              <p className="text-xs text-gray-400 font-medium">Mantra</p>
              <p className="font-semibold text-gray-900 mt-0.5">
                {selectedMantra?.name ?? defaultMantra.name}
              </p>
            </div>
            <ChevronDown size={18} className="text-gray-400" />
          </button>

          {/* Round count selector */}
          <div className="flex items-center justify-between mt-3 bg-white rounded-2xl border border-orange-100 px-4 py-3 shadow-sm">
            <span className="text-sm font-medium text-gray-700">Rounds (Mala)</span>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 5, 11].map(n => (
                <button key={n}
                  onClick={() => setTarget(n)}
                  className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${
                    targetRounds === n
                      ? 'bg-[#7B1A1A] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main counter area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">

        {/* SVG progress ring + tap button */}
        <div className="relative" style={{ width: 220, height: 220 }}>
          <svg width="220" height="220" className="rotate-[-90deg]">
            {/* Track */}
            <circle cx="110" cy="110" r={radius}
              fill="none" stroke="#e5e7eb" strokeWidth="8" />
            {/* Progress */}
            <circle cx="110" cy="110" r={radius}
              fill="none" stroke="#7B1A1A" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 0.15s ease' }}
            />
          </svg>
          {/* Central tap button */}
          <button
            onPointerDown={isActive ? countBead : undefined}
            onClick={!isActive ? startSession : undefined}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full select-none active:scale-95 transition-transform"
          >
            <span className="text-5xl">{isActive ? '🔘' : '▶'}</span>
            <span className="text-sm font-semibold text-[#7B1A1A] mt-2">
              {isActive ? `${beadCount}` : 'Begin'}
            </span>
            {isActive && (
              <span className="text-xs text-gray-400 mt-0.5">
                of {BEADS_PER_MALA} beads
              </span>
            )}
          </button>
        </div>

        {/* Round counter + timer */}
        {isActive && (
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#7B1A1A]">{roundsDone}</p>
              <p className="text-xs text-gray-400">Rounds done</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-700 font-mono">{formatTime(duration)}</p>
              <p className="text-xs text-gray-400">Time</p>
            </div>
          </div>
        )}

        {/* Mantra text */}
        <div className="text-center px-2">
          <p className="text-[#7B1A1A] font-bold font-[family:var(--font-deva)] text-lg leading-relaxed">
            {selectedMantra?.sanskrit?.split('\n')[0] ?? defaultMantra.short}
          </p>
          {selectedMantra?.transliteration && (
            <p className="text-xs text-gray-400 mt-1 italic">
              {selectedMantra.transliteration.split('\n')[0]}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-8 pt-4 space-y-3">
        {isActive && (
          <button
            onClick={() => { setIsActive(false); finishSession(roundsDone + (beadCount > 0 ? 1 : 0)); }}
            className="w-full py-4 rounded-2xl text-white font-bold text-base"
            style={{ background: '#7B1A1A' }}
          >
            Complete Session ✓
          </button>
        )}
        {isActive && (
          <button
            onClick={() => { setIsActive(false); setBeadCount(0); setRounds(0); setDuration(0); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm"
          >
            <RotateCcw size={15} /> Reset
          </button>
        )}
        {!isActive && !showComplete && (
          <p className="text-center text-xs text-gray-400">
            Tap ▶ to start · Tap the bead button for each mantra repetition
          </p>
        )}
      </div>

      {/* 30-day history chart — shown when not in active session */}
      {!isActive && !showComplete && (
        <JapaHistoryChart history={history} streak={streak} />
      )}

      {/* Modals */}
      {showPicker && (
        <MantraPickerSheet
          mantras={mantras}
          selected={selectedMantra}
          onSelect={setMantra}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showComplete && (
        <CompletionSheet
          rounds={roundsDone}
          durationSecs={duration}
          mantraName={selectedMantra?.name ?? defaultMantra.name}
          streak={streak}
          onClose={() => { setComplete(false); router.back(); }}
        />
      )}
    </div>
  );
}
