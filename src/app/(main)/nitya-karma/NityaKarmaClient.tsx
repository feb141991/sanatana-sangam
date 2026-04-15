'use client';

// ─── Nitya Karma — Daily Morning Sequence ────────────────────────────────────
//
// Fetches the AI-personalised 7-step morning routine from the engine,
// lets the user tap each step to mark it complete, and tracks the streak.
//
// Engine calls:
//   engine.nityaKarma.getMorningSequence(userId)   → steps + panchang context
//   engine.nityaKarma.markStep(userId, step)       → marks step complete in DB
//   engine.nityaKarma.getStreak(userId)            → current / longest streak
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Flame, CheckCircle2, Circle, Loader2, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import type { NityaSequenceStep, NityaKarmaStreak } from '@sangam/sadhana-engine';

// ── Tradition greetings ────────────────────────────────────────────────────────
const TRADITION_MORNING: Record<string, { greeting: string; icon: string }> = {
  hindu:    { greeting: 'Suprabhat 🌅', icon: '🕉️' },
  sikh:     { greeting: 'Sat Sri Akal ☬', icon: '☬'  },
  buddhist: { greeting: 'Namo Buddhaya ☸️', icon: '☸️' },
  jain:     { greeting: 'Jai Jinendra 🤲', icon: '🤲' },
};

// ── Static fallback steps (if edge function is down) ─────────────────────────
const FALLBACK_STEPS: NityaSequenceStep[] = [
  { id: 'woke_brahma_muhurta', label: 'Brahma Muhurta',  icon: '🌙', minutes: 0,  description: 'Wake up before sunrise — the most auspicious time', completed: false },
  { id: 'snana_done',          label: 'Snana',           icon: '🌊', minutes: 10, description: 'Sacred bath — purify the body and mind', completed: false },
  { id: 'tilak_done',          label: 'Tilak',           icon: '🔱', minutes: 2,  description: 'Apply tilak — mark your forehead with devotion', completed: false },
  { id: 'sandhya_done',        label: 'Sandhya Vandana', icon: '🙏', minutes: 15, description: 'Morning prayers and surya namaskar', completed: false },
  { id: 'japa_done',           label: 'Japa',            icon: '📿', minutes: 30, description: 'Mantra japa — 1 mala (108 repetitions)', completed: false },
  { id: 'shloka_done',         label: 'Shloka Paath',    icon: '📖', minutes: 10, description: 'Read or recite today\'s daily verse', completed: false },
  { id: 'aarti_done',          label: 'Aarti / Kirtan',  icon: '🪔', minutes: 5,  description: 'Morning aarti or kirtan — invoke divine blessings', completed: false },
];

interface Props {
  userId:    string;
  userName:  string;
  tradition: string;
}

export default function NityaKarmaClient({ userId, userName, tradition }: Props) {
  const router                    = useRouter();
  const { engine, isReady }       = useEngine();

  const [steps,      setSteps]    = useState<NityaSequenceStep[]>([]);
  const [greeting,   setGreeting] = useState('');
  const [panchang,   setPanchang] = useState<any>(null);
  const [streak,     setStreak]   = useState<NityaKarmaStreak | null>(null);
  const [loading,    setLoading]  = useState(true);
  const [busy,       setBusy]     = useState<string | null>(null); // stepId being saved

  const meta = TRADITION_MORNING[tradition] ?? TRADITION_MORNING.hindu;

  // ── Load sequence ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Safety timeout — always stop spinner after 4 s even if engine never loads
    const timeout = setTimeout(() => {
      setSteps((prev) => (prev.length === 0 ? FALLBACK_STEPS : prev));
      setGreeting((prev) => prev || meta.greeting);
      setLoading(false);
    }, 4000);

    if (!isReady || !engine) return () => clearTimeout(timeout);

    async function load() {
      try {
        const [seq, str] = await Promise.all([
          engine!.nityaKarma.getMorningSequence(userId),
          engine!.nityaKarma.getStreak(userId),
        ]);
        setSteps(seq.sequence);
        setGreeting(seq.greeting || meta.greeting);
        setPanchang(seq.panchang_context);
        setStreak(str);
      } catch (err) {
        console.warn('[NityaKarma] edge fn failed, using fallback:', err);
        setSteps(FALLBACK_STEPS);
        setGreeting(meta.greeting);
        // Try getting streak alone
        try {
          const str = await engine!.nityaKarma.getStreak(userId);
          setStreak(str);
        } catch { /* silent */ }
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }

    load();
    return () => clearTimeout(timeout);
  }, [isReady, engine, userId, tradition, meta.greeting]);

  // ── Mark a step ────────────────────────────────────────────────────────────
  async function markStep(stepId: string, currentlyDone: boolean) {
    if (currentlyDone || busy) return; // can't un-mark
    setBusy(stepId);
    await hapticLight();

    // Optimistic update
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));

    try {
      if (engine) {
        await engine.nityaKarma.markStep(userId, stepId as any);
        // Check if all done
        const allDone = steps.every(s => s.id === stepId || s.completed);
        if (allDone) {
          await hapticSuccess();
          toast.success('🙏 Full nitya karma complete! Excellent sadhak!', { duration: 4000 });
          const str = await engine.nityaKarma.getStreak(userId);
          setStreak(str);
        } else {
          toast.success(`${steps.find(s => s.id === stepId)?.icon ?? '✓'} Marked complete`);
        }
      }
    } catch (err) {
      console.error('[NityaKarma] markStep failed:', err);
      toast.error('Could not save — will retry when online');
    } finally {
      setBusy(null);
    }
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps     = steps.length;
  const progressPct    = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/80 border border-orange-100 flex items-center justify-center shadow-sm">
          <ChevronLeft size={20} className="text-[#7B1A1A]" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-[#7B1A1A] text-lg">Nitya Karma</h1>
          <p className="text-xs text-gray-500">Daily Morning Sequence</p>
        </div>
        {streak && streak.current_streak > 0 && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
            <Flame size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{streak.current_streak}d</span>
          </div>
        )}
      </div>

      {/* Greeting hero */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7B1A1A 0%, #b94444 100%)' }}>
        <div className="p-5">
          <p className="text-white/80 text-sm font-medium">{greeting || meta.greeting}</p>
          <p className="text-white font-bold text-xl mt-1">{userName}</p>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>{completedCount}/{totalSteps} steps</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
        {/* Panchang context */}
        {panchang && (
          <div className="bg-black/20 px-5 py-3 flex flex-wrap gap-x-4 gap-y-1">
            {panchang.tithi && (
              <span className="text-xs text-white/70">🌒 {panchang.tithi} {panchang.paksha}</span>
            )}
            {panchang.vaara && (
              <span className="text-xs text-white/70">📅 {panchang.vaara}</span>
            )}
            {panchang.vrata && (
              <span className="text-xs text-amber-300 font-medium">🌟 {panchang.vrata}</span>
            )}
          </div>
        )}
      </div>

      {/* Steps list */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-3">
          <Loader2 size={22} className="animate-spin text-[#7B1A1A]" />
          <p className="text-sm text-gray-500">Getting your morning sequence…</p>
        </div>
      ) : (
        <div className="flex-1 px-4 space-y-3 pb-8">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => markStep(step.id, step.completed)}
              disabled={step.completed || busy !== null}
              className={`w-full text-left rounded-2xl border p-4 transition-all flex items-center gap-4 ${
                step.completed
                  ? 'bg-green-50 border-green-200 opacity-80'
                  : 'bg-white border-orange-100 hover:border-[#7B1A1A]/30 active:scale-[0.98]'
              }`}
            >
              {/* Step number / icon */}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                step.completed ? 'bg-green-100' : 'bg-[#7B1A1A]/5'
              }`}>
                {busy === step.id
                  ? <Loader2 size={20} className="animate-spin text-[#7B1A1A]" />
                  : step.completed
                    ? <CheckCircle2 size={24} className="text-green-600" />
                    : <span>{step.icon}</span>
                }
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${
                    step.completed ? 'text-green-700 line-through' : 'text-gray-900'
                  }`}>
                    {step.label}
                  </p>
                  {step.minutes > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {step.minutes}m
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
                {/* Japa — deep link */}
                {step.id === 'japa_done' && !step.completed && (
                  <button
                    onClick={e => { e.stopPropagation(); router.push('/japa'); }}
                    className="mt-2 text-xs font-semibold text-[#7B1A1A] underline underline-offset-2"
                  >
                    Open Japa Counter →
                  </button>
                )}
              </div>
              {/* Status indicator */}
              {!step.completed && busy !== step.id && (
                <Circle size={22} className="text-gray-200 shrink-0" />
              )}
            </button>
          ))}

          {/* All done celebration */}
          {completedCount === totalSteps && totalSteps > 0 && (
            <div className="rounded-3xl p-6 text-center space-y-2"
              style={{ background: 'linear-gradient(135deg, #7B1A1A 0%, #b94444 100%)' }}>
              <div className="text-4xl">🙏</div>
              <p className="font-bold text-white text-lg">Full Nitya Karma Complete!</p>
              {streak && (
                <p className="text-white/80 text-sm">
                  🔥 {streak.current_streak} day streak · Longest: {streak.longest_streak} days
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
