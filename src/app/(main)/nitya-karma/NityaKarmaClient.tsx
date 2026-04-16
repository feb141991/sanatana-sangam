'use client';

// ─── Nitya Karma — Daily Morning Sequence ────────────────────────────────────
//
// 7-step tradition-aware morning routine.
// Steps are persisted in nitya_karma_log (one row per step per day).
// Ticks lock for the day — reset happens at midnight (new date = new rows).
//
// Engine calls (when available):
//   engine.nityaKarma.getMorningSequence(userId) → steps + panchang context
//   engine.nityaKarma.markStep(userId, step)     → marks step complete
//   engine.nityaKarma.getStreak(userId)          → current / longest streak
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Flame, CheckCircle2, Circle, Loader2,
  Info, Lock, Trophy, Sunrise,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { getTraditionMeta } from '@/lib/tradition-config';
import type { NityaSequenceStep, NityaKarmaStreak } from '@sangam/sadhana-engine';

// ── Tradition greetings ─────────────────────────────────────────────────────────
const TRADITION_MORNING: Record<string, { greeting: string; allDoneMsg: string }> = {
  hindu:    { greeting: 'Suprabhat 🌅', allDoneMsg: 'Hari Om! Your morning sadhana is complete. The divine sees your devotion. 🙏' },
  sikh:     { greeting: 'Sat Sri Akal ☬', allDoneMsg: 'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! Nitnem complete. ☬' },
  buddhist: { greeting: 'Namo Buddhaya ☸️', allDoneMsg: 'Sadhu sadhu sadhu. Your morning practice is complete. May all beings be happy. ☸️' },
  jain:     { greeting: 'Jai Jinendra 🤲', allDoneMsg: 'Jai Jinendra! Samayika complete. Ahimsa and equanimity guide your day. 🤲' },
};

// ── Step-specific motivational messages ──────────────────────────────────────────
const STEP_MESSAGES: Record<string, string[]> = {
  woke_brahma_muhurta: [
    'Brahma Muhurta — you rose before the world. The rishis say this hour is worth a thousand prayers.',
    'Amrit Vela honoured. The mind is clearest before sunrise — you have used it wisely.',
    'Up with the brahma muhurta — most people are still asleep. This hour builds destiny.',
  ],
  snana_done: [
    'Purified body, purified mind. Snana is not just cleanliness — it is a reset of the aura.',
    'Water carries away the heaviness of sleep. You step forward clean and clear.',
    'Sacred bath done. The tradition says even the river rejoices when a sadhak bathes with intention.',
  ],
  tilak_done: [
    'The mark on your forehead carries the tradition of a million practitioners before you. Well done.',
    'Tilak applied — a daily reminder of who you are and what you are here for.',
    'Naam simran begun. Even one moment of genuine naam is worth more than hours of ritual without heart.',
  ],
  sandhya_done: [
    'Sandhya done — you have greeted the day with the same prayer as your ancestors. Beautiful.',
    'Morning prayer complete. The Gita says: the constant effort of practice (abhyasa) is the surest path.',
    'You prayed before you opened your phone. That is dharma in action.',
  ],
  japa_done: [
    '🪬 Japa done — 108 turns of the mala, 108 moments of pure attention. The mind is calmer than before.',
    'Each bead was a small victory over distraction. Your mantra has been heard.',
    'Japa complete. The tradition says: namam is the boat, and repetition is the oar. You have rowed well.',
  ],
  shloka_done: [
    '📖 Shloka received. The scripture enters the heart through the ear and through repetition — you fed both.',
    'Pathshala done. Reading the word of the rishis in the morning plants a seed that grows all day.',
    'Shloka complete. Carry a single line with you today — let it arise when needed.',
  ],
  aarti_done: [
    '🪔 Aarti complete — the flame that went up today carries your intention to what you worship.',
    'The morning closed with gratitude. That is the finest offering a sadhak can make.',
    'Kirtan done. Sound is the oldest medicine. Your vibration for the day is set.',
  ],
};

function getStepMessage(stepId: string): string {
  const msgs = STEP_MESSAGES[stepId];
  if (!msgs) return '✓ Step complete. Well done.';
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ── Static fallback steps ─────────────────────────────────────────────────────
const FALLBACK_STEPS: NityaSequenceStep[] = [
  { id: 'woke_brahma_muhurta', label: 'Brahma Muhurta',  icon: '🌙', minutes: 0,  description: 'Wake before sunrise — the most auspicious hour for sadhana', completed: false },
  { id: 'snana_done',          label: 'Snana',           icon: '🌊', minutes: 10, description: 'Sacred bath — purify body and mind before worship', completed: false },
  { id: 'tilak_done',          label: 'Tilak / Simran',  icon: '🔱', minutes: 2,  description: 'Apply tilak or begin naam simran — awaken divine awareness', completed: false },
  { id: 'sandhya_done',        label: 'Sandhya Vandana', icon: '🙏', minutes: 15, description: 'Morning prayers or Surya Namaskar — greet the day with devotion', completed: false },
  { id: 'japa_done',           label: 'Japa',            icon: '📿', minutes: 30, description: 'Mantra japa — 1 mala (108 repetitions) to anchor the mind', completed: false },
  { id: 'shloka_done',         label: 'Shloka Paath',    icon: '📖', minutes: 10, description: 'Read or recite today\'s sacred verse — nourish the intellect', completed: false },
  { id: 'aarti_done',          label: 'Aarti / Kirtan',  icon: '🪔', minutes: 5,  description: 'Morning aarti or kirtan — close the sequence with gratitude', completed: false },
];

// ── Tradition-aware step labels (canonical NityaStep IDs preserved) ────────────
const STEP_LABELS: Record<string, Record<string, { label: string; icon: string; description: string }>> = {
  sikh: {
    woke_brahma_muhurta: { label: 'Amrit Vela',    icon: '🌙', description: 'Rise before dawn — the ambrosial hour for naam simran' },
    snana_done:          { label: 'Ishnan',         icon: '🌊', description: 'Bathe and purify before beginning nitnem' },
    tilak_done:          { label: 'Naam Simran',    icon: '☬',  description: 'Begin Waheguru simran — Gurmantar in the heart' },
    sandhya_done:        { label: 'Japji Sahib',    icon: '📖', description: 'Recite Japji Sahib — the morning prayer of Guru Nanak Dev Ji' },
    japa_done:           { label: 'Jaap + Chaupai', icon: '📿', description: 'Recite Jaap Sahib and Chaupai Sahib — protection and power' },
    shloka_done:         { label: 'Hukamnama',      icon: '📜', description: 'Receive today\'s divine order from Guru Granth Sahib Ji' },
    aarti_done:          { label: 'Ardas',          icon: '🙏', description: 'Offer Ardas — Sikh supplication for the sangat and the world' },
  },
  buddhist: {
    woke_brahma_muhurta: { label: 'Early Rising',      icon: '🌙', description: 'Rise early — fresh mind supports deep meditation' },
    snana_done:          { label: 'Purification',      icon: '🌊', description: 'Wash and purify body — outer cleanliness reflects inner intention' },
    tilak_done:          { label: 'Precept Reflection', icon: '☸️', description: 'Reflect on the Five Precepts — renew your commitment to ethical life' },
    sandhya_done:        { label: 'Metta Bhavana',     icon: '💛', description: 'Loving-kindness meditation — radiate goodwill to all beings' },
    japa_done:           { label: 'Sitting Practice',  icon: '🧘', description: 'Silent sitting or breath meditation — cultivate samadhi and vipassana' },
    shloka_done:         { label: 'Dhamma Reading',    icon: '📖', description: 'Study a passage from the Dhammapada or a sutta of your choice' },
    aarti_done:          { label: 'Dana Intention',    icon: '🤲', description: 'Set an intention of generosity and service for the day ahead' },
  },
  jain: {
    woke_brahma_muhurta: { label: 'Brahma Muhurta', icon: '🌙', description: 'Rise before dawn — auspicious time for pratikraman and reflection' },
    snana_done:          { label: 'Shaucha',         icon: '🌊', description: 'Physical purification — cleanse body before worship' },
    tilak_done:          { label: 'Sthapana',        icon: '🤲', description: 'Set up the altar and offer flowers or rice to the Tirthankar' },
    sandhya_done:        { label: 'Samayika',        icon: '🙏', description: '48-minute meditation — practise equanimity, the heart of Jain sadhana' },
    japa_done:           { label: 'Navkar Mantra',   icon: '📿', description: 'Recite Navkar Mantra 108 times — salutation to the five supreme beings' },
    shloka_done:         { label: 'Agam Path',       icon: '📖', description: 'Study from the Agam — the canonical Jain texts' },
    aarti_done:          { label: 'Pratikraman',     icon: '🪔', description: 'Morning pratikraman — reflect on and repent for yesterday\'s actions' },
  },
};

function getDefaultSteps(tradition: string): NityaSequenceStep[] {
  const overrides = STEP_LABELS[tradition];
  if (!overrides) return FALLBACK_STEPS;
  return FALLBACK_STEPS.map(step => ({
    ...step,
    label:       overrides[step.id]?.label       ?? step.label,
    icon:        overrides[step.id]?.icon        ?? step.icon,
    description: overrides[step.id]?.description ?? step.description,
  }));
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD local
}

function nextBrahmaMuhurtaText(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(4, 30, 0, 0);
  const h = tomorrow.getHours() % 12 || 12;
  const ampm = tomorrow.getHours() < 12 ? 'AM' : 'PM';
  return `Tomorrow at ${h}:30 ${ampm}`;
}

interface Props {
  userId:    string;
  userName:  string;
  tradition: string;
}

export default function NityaKarmaClient({ userId, userName, tradition }: Props) {
  const router              = useRouter();
  const supabase            = useRef(createClient()).current;
  const { engine, isReady } = useEngine();
  const meta                = getTraditionMeta(tradition);
  const morning             = TRADITION_MORNING[tradition] ?? TRADITION_MORNING.hindu;
  const accent              = meta.accentColour;

  const [steps,    setSteps]    = useState<NityaSequenceStep[]>([]);
  const [greeting, setGreeting] = useState('');
  const [panchang, setPanchang] = useState<any>(null);
  const [streak,   setStreak]   = useState<NityaKarmaStreak | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const confettiFired = useRef(false);

  // ── Load: merge engine steps with DB-persisted ticks for today ───────────────
  useEffect(() => {
    let cancelled = false;

    async function loadTodayLog(baseSteps: NityaSequenceStep[]): Promise<NityaSequenceStep[]> {
      const today = todayDateString();
      const { data } = await supabase
        .from('nitya_karma_log')
        .select('step_id')
        .eq('user_id', userId)
        .eq('log_date', today);

      const doneIds = new Set((data ?? []).map((r: any) => r.step_id as string));
      return baseSteps.map(s => ({ ...s, completed: s.completed || doneIds.has(s.id) }));
    }

    const fallbackTimer = setTimeout(async () => {
      if (cancelled) return;
      const base = getDefaultSteps(tradition);
      const merged = await loadTodayLog(base);
      if (!cancelled) {
        setSteps(merged);
        setGreeting(morning.greeting);
        setLoading(false);
      }
    }, 4000);

    if (!isReady || !engine) return () => { cancelled = true; clearTimeout(fallbackTimer); };

    async function load() {
      try {
        const [seq, str] = await Promise.all([
          engine!.nityaKarma.getMorningSequence(userId),
          engine!.nityaKarma.getStreak(userId),
        ]);
        const merged = await loadTodayLog(seq.sequence);
        if (!cancelled) {
          setSteps(merged);
          setGreeting(seq.greeting || morning.greeting);
          setPanchang(seq.panchang_context);
          setStreak(str);
        }
      } catch {
        const base = getDefaultSteps(tradition);
        const merged = await loadTodayLog(base);
        if (!cancelled) {
          setSteps(merged);
          setGreeting(morning.greeting);
          try {
            const str = await engine!.nityaKarma.getStreak(userId);
            if (!cancelled) setStreak(str);
          } catch { /* silent */ }
        }
      } finally {
        clearTimeout(fallbackTimer);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; clearTimeout(fallbackTimer); };
  }, [isReady, engine, userId, tradition, morning.greeting, supabase]);

  // ── Mark a step — optimistic update + DB persist ─────────────────────────────
  async function markStep(stepId: string, done: boolean) {
    if (done || busy) return;
    setBusy(stepId);
    await hapticLight();

    // Optimistic update
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));
    setJustCompleted(stepId);
    setTimeout(() => setJustCompleted(null), 3000);

    // Persist to DB
    const today = todayDateString();
    try {
      await supabase.from('nitya_karma_log').upsert(
        { user_id: userId, log_date: today, step_id: stepId },
        { onConflict: 'user_id,log_date,step_id', ignoreDuplicates: true }
      );
    } catch {
      // Non-fatal — state is still updated optimistically
    }

    // Engine sync (best-effort)
    if (engine) {
      try { await engine.nityaKarma.markStep(userId, stepId as any); } catch { /* silent */ }
    }

    // Check all done
    const updatedSteps = steps.map(s => s.id === stepId ? { ...s, completed: true } : s);
    const allDone = updatedSteps.every(s => s.completed);

    if (allDone && !confettiFired.current) {
      confettiFired.current = true;
      await hapticSuccess();
      toast.success(morning.allDoneMsg, { duration: 5000 });
      if (engine) {
        try { const str = await engine.nityaKarma.getStreak(userId); setStreak(str); } catch { /* silent */ }
      }
    } else {
      toast(getStepMessage(stepId), {
        icon: '🙏',
        duration: 3500,
        style: { background: '#1c1c1a', color: 'var(--brand-ink)', border: `1px solid ${accent}40` },
      });
    }

    setBusy(null);
  }

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps     = steps.length;
  const progressPct    = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const allDone        = completedCount === totalSteps && totalSteps > 0;
  const vataDays       = panchang?.vrata ?? null;

  return (
    <div className="min-h-screen pb-28">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft size={20} style={{ color: accent }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-[color:var(--brand-ink)]">Nitya Karma</h1>
          <p className="text-xs text-[color:var(--brand-muted)]">
            {meta.symbol} Daily {tradition === 'sikh' ? 'Nitnem' : tradition === 'buddhist' ? 'Morning Practice' : 'Morning Sequence'}
          </p>
        </div>
        {streak && streak.current_streak > 0 && (
          <div
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 border border-white/10"
            style={{ background: `${accent}14` }}
          >
            <Flame size={14} style={{ color: accent }} />
            <span className="text-xs font-semibold" style={{ color: accent }}>{streak.current_streak}d</span>
          </div>
        )}
      </div>

      {/* Hero banner */}
      <div
        className="mx-4 mb-4 rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }}
      >
        <div className="p-5">
          <p className="text-white/80 text-sm font-medium">{greeting || morning.greeting}</p>
          <p className="text-white font-bold text-xl mt-0.5">{userName}</p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>{completedCount}/{totalSteps} steps complete</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Panchang strip */}
        {panchang && (
          <div className="bg-black/20 px-5 py-3 flex flex-wrap gap-x-4 gap-y-1">
            {panchang.tithi && (
              <span className="text-xs text-white/70">🌒 {panchang.tithi}{panchang.paksha ? ` · ${panchang.paksha}` : ''}</span>
            )}
            {panchang.vaara && (
              <span className="text-xs text-white/70">📅 {panchang.vaara}</span>
            )}
            {vataDays && (
              <span className="text-xs text-amber-300 font-semibold">🌟 {vataDays}</span>
            )}
          </div>
        )}
      </div>

      {/* Vrat alert */}
      {vataDays && (
        <div
          className="mx-4 mb-3 rounded-2xl border px-4 py-3 flex items-start gap-3"
          style={{ background: `${accent}10`, borderColor: `${accent}30` }}
        >
          <span className="text-xl shrink-0">🌟</span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">Today is {vataDays}</p>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
              A vrat/fast day adds extra spiritual merit to your sadhana. Observe nirjala or phalahar as per your tradition and add an extended japa or stotra session.
            </p>
          </div>
        </div>
      )}

      {/* Steps */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 pt-20">
          <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
          <span className="text-sm text-[color:var(--brand-muted)]">Getting your morning sequence…</span>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {steps.map((step) => {
            const isJustDone = justCompleted === step.id;
            return (
              <button
                key={step.id}
                onClick={() => markStep(step.id, step.completed)}
                disabled={step.completed || busy !== null}
                className={`w-full text-left rounded-2xl border p-4 transition-all flex items-center gap-4 active:scale-[0.98] ${
                  step.completed
                    ? 'border-white/6'
                    : 'glass-panel border-white/8 hover:border-white/16'
                } ${isJustDone ? 'scale-[0.98]' : ''}`}
                style={step.completed ? { background: `${accent}08` } : {}}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all duration-300"
                  style={{ background: step.completed ? `${accent}20` : `${accent}12` }}
                >
                  {busy === step.id
                    ? <Loader2 size={18} className="animate-spin" style={{ color: accent }} />
                    : step.completed
                      ? <CheckCircle2 size={22} className="text-green-400" />
                      : <span>{step.icon}</span>
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${
                      step.completed ? 'text-[color:var(--brand-muted)] line-through' : 'text-[color:var(--brand-ink)]'
                    }`}>
                      {step.label}
                    </p>
                    {step.minutes > 0 && (
                      <span
                        className="text-[10px] font-medium rounded-full px-2 py-0.5"
                        style={{ background: `${accent}14`, color: accent }}
                      >
                        {step.minutes}m
                      </span>
                    )}
                    {step.completed && (
                      <span className="text-[10px] text-green-400 font-medium">Done ✓</span>
                    )}
                  </div>
                  {!step.completed && (
                    <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                  {/* Deep-links */}
                  {step.id === 'japa_done' && !step.completed && (
                    <Link
                      href="/japa"
                      onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-flex text-xs font-semibold underline underline-offset-2"
                      style={{ color: accent }}
                    >
                      Open Japa Counter →
                    </Link>
                  )}
                  {step.id === 'shloka_done' && !step.completed && (
                    <Link
                      href="/pathshala"
                      onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-flex text-xs font-semibold underline underline-offset-2"
                      style={{ color: accent }}
                    >
                      Open Pathshala →
                    </Link>
                  )}
                </div>

                {/* Right icon */}
                {step.completed ? (
                  <Lock size={16} className="text-white/20 shrink-0" />
                ) : busy !== step.id ? (
                  <Circle size={20} className="text-white/20 shrink-0" />
                ) : null}
              </button>
            );
          })}

          {/* All done state */}
          {allDone && (
            <div
              className="rounded-3xl p-6 text-center space-y-3 border border-white/10"
              style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}10)` }}
            >
              <div className="text-5xl">🙏</div>
              <p className="font-bold text-[color:var(--brand-ink)] text-lg">Full Nitya Karma Complete!</p>
              {streak && (
                <p className="text-[color:var(--brand-muted)] text-sm">
                  <Flame size={13} className="inline mb-0.5 mr-0.5 text-orange-400" />
                  {streak.current_streak}-day streak · Longest: {streak.longest_streak} days
                </p>
              )}
              <div
                className="mt-2 mx-auto max-w-xs rounded-2xl px-4 py-3 flex items-start gap-2.5"
                style={{ background: `${accent}14`, border: `1px solid ${accent}30` }}
              >
                <Sunrise size={16} style={{ color: accent }} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-left" style={{ color: accent }}>
                  Your steps are locked for today. Come back tomorrow — next Brahma Muhurta opens{' '}
                  <span className="font-semibold">{nextBrahmaMuhurtaText()}</span>.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-1">
                <Link href="/japa"
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>
                  Japa Counter
                </Link>
                <Link href="/pathshala"
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${accent}18`, color: accent }}>
                  Pathshala
                </Link>
              </div>
            </div>
          )}

          {/* Streak card — shown when some but not all done */}
          {!allDone && streak && streak.current_streak > 0 && (
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/6"
              style={{ background: `${accent}08` }}
            >
              <Trophy size={18} style={{ color: accent }} />
              <div>
                <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
                  🔥 {streak.current_streak}-day streak
                </p>
                <p className="text-xs text-[color:var(--brand-muted)]">
                  Longest: {streak.longest_streak} days · Keep going — don&apos;t break the chain!
                </p>
              </div>
            </div>
          )}

          {/* Engine note */}
          <div className="glass-panel rounded-2xl border border-white/6 px-4 py-3 flex items-start gap-2.5">
            <Info size={14} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed">
              Your sequence adapts to today&apos;s tithi, nakshatra, and vrat.{' '}
              <span className="font-semibold text-[color:var(--brand-ink)]">Sangam Pro</span>
              {' '}unlocks AI-personalised sequences based on your practice history and current streak.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
