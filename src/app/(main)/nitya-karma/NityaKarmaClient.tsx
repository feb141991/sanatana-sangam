'use client';

// ─── Nitya Karma — Daily Morning Sequence ────────────────────────────────────
//
// 7-step tradition-aware morning routine.
// Engine calls:
//   engine.nityaKarma.getMorningSequence(userId) → steps + panchang context
//   engine.nityaKarma.markStep(userId, step)     → marks step complete
//   engine.nityaKarma.getStreak(userId)          → current / longest streak
//
// Falls back to FALLBACK_STEPS if the engine is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Flame, CheckCircle2, Circle, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEngine } from '@/contexts/EngineContext';
import { hapticLight, hapticSuccess } from '@/lib/platform';
import { getTraditionMeta } from '@/lib/tradition-config';
import type { NityaSequenceStep, NityaKarmaStreak } from '@sangam/sadhana-engine';

// ── Tradition greetings ────────────────────────────────────────────────────────
const TRADITION_MORNING: Record<string, { greeting: string }> = {
  hindu:    { greeting: 'Suprabhat 🌅' },
  sikh:     { greeting: 'Sat Sri Akal ☬' },
  buddhist: { greeting: 'Namo Buddhaya ☸️' },
  jain:     { greeting: 'Jai Jinendra 🤲' },
};

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

// ── Tradition-aware step labels (all use canonical NityaStep IDs) ─────────────
// The engine tracks the canonical 7 IDs for all traditions. We adapt labels
// and descriptions per tradition to make the UI feel native.
const STEP_LABELS: Record<string, Record<string, { label: string; icon: string; description: string }>> = {
  sikh: {
    woke_brahma_muhurta: { label: 'Amrit Vela',    icon: '🌙', description: 'Rise before dawn — the ambrosial hour for naam simran' },
    snana_done:          { label: 'Ishnan',         icon: '🌊', description: 'Bathe and purify before beginning nitnem' },
    tilak_done:          { label: 'Naam Simran',    icon: '☬',  description: 'Begin Waheguru simran — Gurmantar in the heart' },
    sandhya_done:        { label: 'Japji Sahib',    icon: '📖', description: 'Recite Japji Sahib — the morning prayer of Guru Nanak Dev Ji' },
    japa_done:           { label: 'Jaap + Chaupai', icon: '📿', description: 'Recite Jaap Sahib and Chaupai Sahib — protection and power' },
    shloka_done:         { label: 'Hukamnama',      icon: '📜', description: 'Receive today\'s divine order from Guru Granth Sahib Ji' },
    aarti_done:          { label: 'Ardas',           icon: '🙏', description: 'Offer Ardas — Sikh supplication for the sangat and the world' },
  },
  buddhist: {
    woke_brahma_muhurta: { label: 'Early Rising',    icon: '🌙', description: 'Rise early — fresh mind supports deep meditation' },
    snana_done:          { label: 'Purification',    icon: '🌊', description: 'Wash and purify body — outer cleanliness reflects inner intention' },
    tilak_done:          { label: 'Precept Reflection', icon: '☸️', description: 'Reflect on the Five Precepts — renew your commitment to ethical life' },
    sandhya_done:        { label: 'Metta Bhavana',   icon: '💛', description: 'Loving-kindness meditation — radiate goodwill to all beings' },
    japa_done:           { label: 'Sitting Practice', icon: '🧘', description: 'Silent sitting or breath meditation — cultivate samadhi and vipassana' },
    shloka_done:         { label: 'Dhamma Reading',  icon: '📖', description: 'Study a passage from the Dhammapada or a sutta of your choice' },
    aarti_done:          { label: 'Dana Intention',  icon: '🤲', description: 'Set an intention of generosity and service for the day ahead' },
  },
  jain: {
    woke_brahma_muhurta: { label: 'Brahma Muhurta',  icon: '🌙', description: 'Rise before dawn — auspicious time for pratikraman and reflection' },
    snana_done:          { label: 'Shaucha',          icon: '🌊', description: 'Physical purification — cleanse body before worship' },
    tilak_done:          { label: 'Sthapana',         icon: '🤲', description: 'Set up the altar and offer flowers or rice to the Tirthankar' },
    sandhya_done:        { label: 'Samayika',         icon: '🙏', description: '48-minute meditation — practise equanimity, the heart of Jain sadhana' },
    japa_done:           { label: 'Navkar Mantra',    icon: '📿', description: 'Recite Navkar Mantra 108 times — salutation to the five supreme beings' },
    shloka_done:         { label: 'Agam Path',        icon: '📖', description: 'Study from the Agam — the canonical Jain texts' },
    aarti_done:          { label: 'Pratikraman',      icon: '🪔', description: 'Morning pratikraman — reflect on and repent for yesterday\'s actions' },
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

interface Props {
  userId:    string;
  userName:  string;
  tradition: string;
}

export default function NityaKarmaClient({ userId, userName, tradition }: Props) {
  const router            = useRouter();
  const { engine, isReady } = useEngine();
  const meta              = getTraditionMeta(tradition);
  const morning           = TRADITION_MORNING[tradition] ?? TRADITION_MORNING.hindu;
  const accent            = meta.accentColour;

  const [steps,    setSteps]   = useState<NityaSequenceStep[]>([]);
  const [greeting, setGreeting] = useState('');
  const [panchang, setPanchang] = useState<any>(null);
  const [streak,   setStreak]  = useState<NityaKarmaStreak | null>(null);
  const [loading,  setLoading] = useState(true);
  const [busy,     setBusy]    = useState<string | null>(null);

  // ── Load sequence ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSteps((prev) => (prev.length === 0 ? getDefaultSteps(tradition) : prev));
      setGreeting((prev) => prev || morning.greeting);
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
        setGreeting(seq.greeting || morning.greeting);
        setPanchang(seq.panchang_context);
        setStreak(str);
      } catch {
        setSteps(getDefaultSteps(tradition));
        setGreeting(morning.greeting);
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
  }, [isReady, engine, userId, tradition, morning.greeting]);

  // ── Mark a step ────────────────────────────────────────────────────────────
  async function markStep(stepId: string, done: boolean) {
    if (done || busy) return;
    setBusy(stepId);
    await hapticLight();
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));

    try {
      if (engine) {
        await engine.nityaKarma.markStep(userId, stepId as any);
        const allDone = steps.every(s => s.id === stepId || s.completed);
        if (allDone) {
          await hapticSuccess();
          toast.success('🙏 Full Nitya Karma complete! Excellent sadhak!', { duration: 4000 });
          const str = await engine.nityaKarma.getStreak(userId);
          setStreak(str);
        } else {
          toast.success(`${steps.find(s => s.id === stepId)?.icon ?? '✓'} Marked complete`);
        }
      }
    } catch {
      toast.error('Could not save — will retry when online');
    } finally {
      setBusy(null);
    }
  }

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps     = steps.length;
  const progressPct    = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
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

        {/* Panchang / vrat strip */}
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

      {/* Vrat alert — shown when today is a fast/vrat day */}
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
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => markStep(step.id, step.completed)}
              disabled={step.completed || busy !== null}
              className={`w-full text-left rounded-2xl border p-4 transition-all flex items-center gap-4 active:scale-[0.98] ${
                step.completed
                  ? 'border-white/8 opacity-60'
                  : 'glass-panel border-white/8 hover:border-white/14'
              }`}
              style={step.completed ? { background: `${accent}08` } : {}}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                style={{ background: step.completed ? `${accent}18` : `${accent}12` }}
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
                </div>
                <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
                  {step.description}
                </p>
                {/* Japa deep-link */}
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
                {/* Pathshala deep-link for shloka step */}
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

              {!step.completed && busy !== step.id && (
                <Circle size={20} className="text-white/20 shrink-0" />
              )}
            </button>
          ))}

          {/* All done */}
          {completedCount === totalSteps && totalSteps > 0 && (
            <div
              className="rounded-3xl p-6 text-center space-y-2"
              style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }}
            >
              <div className="text-5xl">🙏</div>
              <p className="font-bold text-white text-lg">Full Nitya Karma Complete!</p>
              {streak && (
                <p className="text-white/80 text-sm">
                  🔥 {streak.current_streak}-day streak · Longest: {streak.longest_streak} days
                </p>
              )}
            </div>
          )}

          {/* Engine note */}
          <div className="glass-panel rounded-2xl border border-white/6 px-4 py-3 flex items-start gap-2.5 mt-1">
            <Info size={14} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed">
              Your sequence adapts to today&apos;s tithi, nakshatra, and vrat. AI-personalised sequences based on your practice history are coming with Sangam Pro.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
