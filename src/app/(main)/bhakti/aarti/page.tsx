'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

// ─── Bell tone via WebAudio ───────────────────────────────────────────────────
function playBell(freq = 432, dur = 2.5, vol = 0.22) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
  } catch {}
}
function haptic(pattern: number[]) { navigator.vibrate?.(pattern); }

// ─── Aarti steps ──────────────────────────────────────────────────────────────
const AARTI_STEPS = [
  {
    id: 'bell',
    emoji: '🔔',
    title: 'Ghantā — Ring the Bell',
    titleDevanagari: 'घण्टा',
    instruction: 'Ring the temple bell to announce your worship and awaken the divine presence. The sound of the bell dispels negative energies and calls the mind to stillness.',
    action: 'Ring the bell',
    hint: 'Tap to ring',
    color: '#d4a645',
    bg: 'rgba(212,166,70,0.10)',
    onTap: () => { playBell(432, 2.5); haptic([30, 50, 20]); },
  },
  {
    id: 'diya',
    emoji: '🪔',
    title: 'Dīpa — Light the Diya',
    titleDevanagari: 'दीप',
    instruction: 'Light the diya (oil lamp) and offer it to the deity. The flame represents the eternal light of consciousness — jyoti. As you light it, offer your prayers for illumination.',
    action: 'Light the diya',
    hint: 'Offer the flame',
    color: '#e07b3a',
    bg: 'rgba(220,120,50,0.10)',
    onTap: () => { playBell(528, 1.5, 0.15); haptic([20]); },
  },
  {
    id: 'dhoop',
    emoji: '🌿',
    title: 'Dhūpa — Offer Incense',
    titleDevanagari: 'धूप',
    instruction: 'Offer fragrant incense to the deity. The rising smoke carries your prayers upward. The fragrance purifies the space and the mind, preparing it for deeper worship.',
    action: 'Offer incense',
    hint: 'Wave the dhoop',
    color: '#5c8e4a',
    bg: 'rgba(80,140,70,0.09)',
    onTap: () => { playBell(396, 1.2, 0.12); haptic([15, 30, 15]); },
  },
  {
    id: 'pushpa',
    emoji: '🌸',
    title: 'Puṣpa — Offer Flowers',
    titleDevanagari: 'पुष्प',
    instruction: 'Offer fresh flowers at the feet of the deity. Flowers represent beauty, purity, and the blossoming of the heart. With each flower, offer a quality — love, gratitude, surrender.',
    action: 'Offer flowers',
    hint: 'Place the flowers',
    color: '#c4789a',
    bg: 'rgba(196,120,154,0.09)',
    onTap: () => { haptic([10, 20, 10, 20]); },
  },
  {
    id: 'jal',
    emoji: '🌊',
    title: 'Jala — Water Offering',
    titleDevanagari: 'जल',
    instruction: 'Offer pure water (Ganga jal if available) to the deity. Water represents the purifying grace of the divine. This is the offering of life itself — all of nature flows from divine grace.',
    action: 'Offer water',
    hint: 'Pour the jal',
    color: '#3a8bcd',
    bg: 'rgba(58,140,200,0.09)',
    onTap: () => { playBell(639, 1.0, 0.10); haptic([10]); },
  },
  {
    id: 'naivedya',
    emoji: '🍬',
    title: 'Naivedya — Food Offering',
    titleDevanagari: 'नैवेद्य',
    instruction: 'Offer a sweet or sattvic food (fruit, sugar, or prasad) to the deity. Whatever you offer becomes prasad — blessed food. Eat what you offer only after this moment of surrender.',
    action: 'Offer naivedya',
    hint: 'Place the offering',
    color: '#a07830',
    bg: 'rgba(160,120,48,0.09)',
    onTap: () => { haptic([20, 40, 20]); },
  },
  {
    id: 'namaskar',
    emoji: '🙏',
    title: 'Namaskāra — Prostration',
    titleDevanagari: 'नमस्कार',
    instruction: 'Complete the aarti with a full namaskar (prostration). Surrender the ego completely before the divine. You may circle the deity (pradakshina) three times and then bow deeply. The aarti is complete — Jai!',
    action: 'Complete aarti',
    hint: 'Bow and surrender',
    color: '#8b7de0',
    bg: 'rgba(139,125,224,0.09)',
    onTap: () => { playBell(432, 3.5, 0.20); haptic([30, 50, 30, 50, 60]); },
  },
] as const;

// ─── Animated diya (step 2) ───────────────────────────────────────────────────
function AnimatedDiya({ lit }: { lit: boolean }) {
  return (
    <div className="relative flex items-center justify-center h-28 w-28">
      <AnimatePresence>
        {lit && (
          <>
            <motion.div className="absolute rounded-full"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: [1, 1.3, 1], opacity: [0, 0.6, 0.4] }}
              style={{ width: 110, height: 110, background: 'radial-gradient(circle,rgba(255,150,30,0.25),transparent 70%)' }}
              transition={{ duration: 2.5, repeat: Infinity }} />
            <motion.div style={{
              width: 14, height: 26, position: 'absolute', top: '18%',
              background: 'linear-gradient(180deg,#fff8e0 0%,#ffb820 45%,#ff6515 100%)',
              borderRadius: '50% 50% 50% 50% / 38% 38% 62% 62%',
              boxShadow: '0 0 20px rgba(255,148,22,1)',
            }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1, scaleX: [1, 1.1, 0.95, 1.08, 1], rotate: [-3, 4, -2, 3, -3] }}
              transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }} />
          </>
        )}
      </AnimatePresence>
      <div style={{
        position: 'absolute', bottom: '28%', width: 44, height: 13,
        background: 'linear-gradient(90deg,#7a3f1c 0%,#c97c3a 48%,#7a3f1c 100%)',
        borderRadius: '2px 2px 50% 50% / 2px 2px 80% 80%',
      }} />
      {!lit && <span className="absolute text-3xl" style={{ top: '12%' }}>🕯️</span>}
    </div>
  );
}

// ─── Main Aarti Page ──────────────────────────────────────────────────────────
export default function AartiPage() {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [step,      setStep]     = useState(0);
  const [done,      setDone]     = useState<Set<number>>(new Set());
  const [dyiaLit,   setDiyaLit]  = useState(false);
  const [finished,  setFinished] = useState(false);

  const current = AARTI_STEPS[step];
  const isLast  = step === AARTI_STEPS.length - 1;

  // ── Tokens ──────────────────────────────────────────────────────────────────
  const pageBg = isDark ? 'linear-gradient(180deg,#100808 0%,#1a1005 60%,#0e0c06 100%)' : 'linear-gradient(180deg,#fdf6ee 0%,#f5e8d5 100%)';
  const cardBg = isDark ? 'rgba(24,14,8,0.95)' : 'rgba(255,246,232,0.98)';
  const textH  = isDark ? '#f5dfa0' : '#2a1002';
  const textS  = isDark ? 'rgba(245,210,130,0.50)' : 'rgba(100,55,10,0.55)';
  const textD  = isDark ? 'rgba(245,210,130,0.32)' : 'rgba(100,55,10,0.35)';

  const handleAction = useCallback(() => {
    current.onTap();
    if (current.id === 'diya') setDiyaLit(true);
    setDone(prev => new Set([...prev, step]));
  }, [current, step]);

  function next() {
    if (isLast) { setFinished(true); return; }
    setStep(s => s + 1);
  }

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: pageBg }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180 }}>
          <div className="text-7xl mb-6">🙏</div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-serif)', color: textH }}>Aarti Complete</h1>
          <p className="text-sm leading-relaxed mb-2" style={{ color: textS }}>Jai! Your aarti is offered with devotion.</p>
          <p className="text-xs mb-8" style={{ color: textD }}>भक्तिर्भगवतो सेवा — Devotion is service to the divine.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep(0); setDone(new Set()); setDiyaLit(false); setFinished(false); }}
              className="rounded-2xl px-6 py-3 text-sm font-semibold"
              style={{ background: 'rgba(200,146,74,0.15)', border: '1px solid rgba(200,146,74,0.30)', color: '#C8924A' }}>
              Offer again
            </button>
            <button onClick={() => router.back()}
              className="rounded-2xl px-6 py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#d4a645,#a07830)' }}>
              Done 🙏
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: pageBg }}>
      {/* Safe area */}
      <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pb-4">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.18)' }}>
          <ChevronLeft size={18} style={{ color: '#C8924A' }} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(200,146,74,0.5)' }}>Guided Aarti</p>
          <p className="text-sm font-semibold" style={{ color: textH }}>Step {step + 1} of {AARTI_STEPS.length}</p>
        </div>
        <div className="w-9" /> {/* spacer */}
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pb-5">
        {AARTI_STEPS.map((s, i) => (
          <motion.div key={s.id} className="rounded-full transition-all"
            animate={{ width: i === step ? 20 : 7, background: done.has(i) ? s.color : i === step ? current.color : (isDark ? 'rgba(200,146,74,0.15)' : 'rgba(180,110,30,0.15)') }}
            style={{ height: 7 }} />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4">

            {/* Step card */}
            <div className="rounded-[2.2rem] overflow-hidden" style={{ background: cardBg, border: `1px solid ${current.color}28` }}>
              {/* Color header */}
              <div className="relative flex flex-col items-center py-10 overflow-hidden"
                style={{ background: current.bg }}>
                {/* Ambient circle */}
                <motion.div className="absolute rounded-full pointer-events-none"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ width: 200, height: 200, background: `radial-gradient(circle,${current.color}22,transparent 70%)` }} />

                {current.id === 'diya' ? (
                  <AnimatedDiya lit={dyiaLit} />
                ) : (
                  <motion.span className="text-6xl relative z-10"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    {current.emoji}
                  </motion.span>
                )}

                <p className="relative z-10 text-xs mt-4 font-bold uppercase tracking-[0.2em]"
                  style={{ color: `${current.color}80` }}>{current.titleDevanagari}</p>
              </div>

              {/* Text */}
              <div className="px-5 py-5">
                <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-serif)', color: textH }}>{current.title}</h2>
                <p className="text-[12.5px] leading-relaxed" style={{ color: textS }}>{current.instruction}</p>
              </div>
            </div>

            {/* Action button */}
            <motion.button
              onClick={handleAction}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl py-4 font-semibold text-sm transition-all relative overflow-hidden"
              style={{ background: done.has(step) ? `${current.color}18` : `linear-gradient(135deg,${current.color},${current.color}cc)`, border: `1px solid ${current.color}${done.has(step) ? '40' : '00'}`, color: done.has(step) ? current.color : '#fff' }}>
              {done.has(step)
                ? <span className="flex items-center justify-center gap-2"><Check size={16} /> {current.action} — done</span>
                : <span>{current.hint} ✦ {current.action}</span>}
            </motion.button>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-1.5 text-sm font-medium disabled:opacity-30"
                style={{ color: textS }}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button onClick={next}
                className="flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-semibold"
                style={{ background: 'rgba(200,146,74,0.12)', border: '1px solid rgba(200,146,74,0.25)', color: '#C8924A' }}>
                {isLast ? 'Complete aarti 🙏' : <><span>Next step</span><ChevronRight size={16} /></>}
              </button>
            </div>

            {/* Step mini-map */}
            <div className="rounded-2xl px-4 py-3" style={{ background: isDark ? 'rgba(14,9,5,0.8)' : 'rgba(255,240,220,0.8)', border: `1px solid rgba(200,146,74,0.08)` }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(200,146,74,0.40)' }}>Aarti sequence</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {AARTI_STEPS.map((s, i) => (
                  <button key={s.id} onClick={() => setStep(i)}
                    className="flex items-center gap-1 text-[10px]"
                    style={{ color: i === step ? s.color : done.has(i) ? `${s.color}80` : textD }}>
                    {done.has(i) ? <Check size={9} /> : <span>{i + 1}.</span>}
                    {s.emoji} {s.title.split(' — ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
