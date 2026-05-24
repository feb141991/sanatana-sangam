'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Loader2, Volume2, VolumeX, Copy, Share2, Sparkles } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { ReadableContent, buildReadableCapabilities } from '@/lib/readable-content';
import { useReaderControls } from '@/hooks/useReaderControls';
import { trackReaderEvent } from '@/lib/analytics/reader-events';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useReaderDisplayPreferences } from '@/lib/i18n/reader-display';
import type { AppContentLanguage } from '@/lib/language-runtime';
import ReaderShell from '@/components/reader/ReaderShell';

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
    titleKey: 'aartiBellTitle' as const,
    titleDevaKey: 'aartiBellTitleDeva' as const,
    instructionKey: 'aartiBellInstruction' as const,
    actionKey: 'aartiBellAction' as const,
    hintKey: 'aartiBellHint' as const,
    color: '#d4a645',
    bg: 'rgba(212,166,70,0.10)',
    onTap: () => { playBell(432, 2.5); haptic([30, 50, 20]); },
  },
  {
    id: 'diya',
    emoji: '🪔',
    titleKey: 'aartiDiyaTitle' as const,
    titleDevaKey: 'aartiDiyaTitleDeva' as const,
    instructionKey: 'aartiDiyaInstruction' as const,
    actionKey: 'aartiDiyaAction' as const,
    hintKey: 'aartiDiyaHint' as const,
    color: '#e07b3a',
    bg: 'rgba(220,120,50,0.10)',
    onTap: () => { playBell(528, 1.5, 0.15); haptic([20]); },
  },
  {
    id: 'dhoop',
    emoji: '🌿',
    titleKey: 'aartiDhoopTitle' as const,
    titleDevaKey: 'aartiDhoopTitleDeva' as const,
    instructionKey: 'aartiDhoopInstruction' as const,
    actionKey: 'aartiDhoopAction' as const,
    hintKey: 'aartiDhoopHint' as const,
    color: '#5c8e4a',
    bg: 'rgba(80,140,70,0.09)',
    onTap: () => { playBell(396, 1.2, 0.12); haptic([15, 30, 15]); },
  },
  {
    id: 'pushpa',
    emoji: '🌸',
    titleKey: 'aartiPushpaTitle' as const,
    titleDevaKey: 'aartiPushpaTitleDeva' as const,
    instructionKey: 'aartiPushpaInstruction' as const,
    actionKey: 'aartiPushpaAction' as const,
    hintKey: 'aartiPushpaHint' as const,
    color: '#c4789a',
    bg: 'rgba(196,120,154,0.09)',
    onTap: () => { haptic([10, 20, 10, 20]); },
  },
  {
    id: 'jal',
    emoji: '🌊',
    titleKey: 'aartiJalTitle' as const,
    titleDevaKey: 'aartiJalTitleDeva' as const,
    instructionKey: 'aartiJalInstruction' as const,
    actionKey: 'aartiJalAction' as const,
    hintKey: 'aartiJalHint' as const,
    color: '#3a8bcd',
    bg: 'rgba(58,140,200,0.09)',
    onTap: () => { playBell(639, 1.0, 0.10); haptic([10]); },
  },
  {
    id: 'naivedya',
    emoji: '🍬',
    titleKey: 'aartiNaivedyaTitle' as const,
    titleDevaKey: 'aartiNaivedyaTitleDeva' as const,
    instructionKey: 'aartiNaivedyaInstruction' as const,
    actionKey: 'aartiNaivedyaAction' as const,
    hintKey: 'aartiNaivedyaHint' as const,
    color: '#a07830',
    bg: 'rgba(160,120,48,0.09)',
    onTap: () => { haptic([20, 40, 20]); },
  },
  {
    id: 'namaskar',
    emoji: '🙏',
    titleKey: 'aartiNamaskarTitle' as const,
    titleDevaKey: 'aartiNamaskarTitleDeva' as const,
    instructionKey: 'aartiNamaskarInstruction' as const,
    actionKey: 'aartiNamaskarAction' as const,
    hintKey: 'aartiNamaskarHint' as const,
    color: '#8b7de0',
    bg: 'rgba(139,125,224,0.09)',
    onTap: () => { playBell(432, 3.5, 0.20); haptic([30, 50, 30, 50, 60]); },
  },
] as const;

// ─── Build ReadableContent for each step ───────────────────────────────────────
// ─── Build ReadableContent for each step ───────────────────────────────────────
function buildStepReadableContent(
  step: (typeof AARTI_STEPS)[number],
  lang: AppContentLanguage,
  t: Function
): ReadableContent {
  const instruction = t(lang, step.instructionKey);
  const title = t(lang, step.titleKey);
  const script = lang === 'pa' ? 'gurmukhi' : lang === 'hi' ? 'devanagari' : 'latin';
  return {
    original: instruction,
    meaning: undefined,
    sourceLabel: `Aarti — ${title}`,
    tradition: 'hindu',
    language: lang,
    script,
    pipelineTags: {
      content_type: 'instruction',
      audio_mode: 'standard',
      tradition: 'hindu',
      script,
      response_mode: 'extractive',
      delivery_intent: 'live_user'
    },
    capabilities: buildReadableCapabilities({
      original: instruction,
      meaning: undefined,
      script,
      pipelineTags: {
        content_type: 'instruction',
        audio_mode: 'standard'
      }
    })
  };
}

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

  const { t, lang: appLang } = useLanguage();
  const { language: customLang, setLanguage: setCustomLang, labels, languages, fontPresets, fontStep, setFontStep, fontScale } = useReaderDisplayPreferences({
    resolvedLanguage: appLang,
    initialFontStep: 2,
  });

  const [step,      setStep]     = useState(0);
  const [done,      setDone]     = useState<Set<number>>(new Set());
  const [dyiaLit,   setDiyaLit]  = useState(false);
  const [finished,  setFinished] = useState(false);
  const [speaking,  setSpeaking] = useState(false);
  const [ttsRate,   setTtsRate]  = useState<number>(1.0);
  const [explainResult, setExplainResult] = useState<{
    explanation?: { meaning: string; commentary: string; daily_application: string };
    teacher?: string;
    tradition?: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = AARTI_STEPS[step];
  const isLast  = step === AARTI_STEPS.length - 1;

  const currentTitle = t(customLang, current.titleKey);
  const currentTitleDevanagari = t(customLang, current.titleDevaKey);
  const currentInstruction = t(customLang, current.instructionKey);
  const currentAction = t(customLang, current.actionKey);
  const currentHint = t(customLang, current.hintKey);

  const currentReadableContent = useMemo(() => buildStepReadableContent(current, customLang, t), [current, customLang, t]);
  const readerControls = useReaderControls(currentReadableContent.capabilities);

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

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  useEffect(() => () => stopTTS(), [stopTTS]);

  useEffect(() => {
    setExplainResult(null);
    stopTTS();
    trackReaderEvent('reader_opened', {
      content_type: 'instruction',
      source: `aarti:${current.id}`,
      tradition: 'hindu',
      language: customLang,
      has_meaning: false,
      has_transliteration: false,
    });
  }, [current.id, customLang, stopTTS]);

  function next() {
    if (isLast) { setFinished(true); return; }
    setStep(s => s + 1);
  }

  async function speakCurrentStep() {
    if (speaking) {
      stopTTS();
      return;
    }
    trackReaderEvent('tts_requested', {
      content_type: 'instruction',
      source: `aarti:${current.id}`,
      tradition: 'hindu',
      language: customLang,
    });
    const audioUrl = await readerControls.handlers.requestTTS(currentInstruction, {
      quality: 'standard',
      language: customLang,
      rate: ttsRate,
      pipelineTags: currentReadableContent.pipelineTags,
    });
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = stopTTS;
    audio.onerror = stopTTS;
    await audio.play().catch(() => stopTTS());
    setSpeaking(true);
  }

  async function explainCurrentStep() {
    const result = await readerControls.handlers.requestExplain(currentInstruction, {
      source: `Aarti — ${currentTitle}`,
      title: currentTitle,
      tradition: 'hindu',
      language: customLang,
      contentType: 'instruction',
      responseMode: 'extractive',
      pipelineTags: currentReadableContent.pipelineTags,
    });
    if (result) {
      setExplainResult({
        explanation: result.explanation
          ? {
              meaning: result.explanation.meaning,
              commentary: result.explanation.commentary,
              daily_application: result.explanation.daily_application,
            }
          : undefined,
        teacher: result.teacher,
        tradition: result.tradition,
      });
    }
    trackReaderEvent('explain_requested', {
      content_type: 'instruction',
      source: `aarti:${current.id}`,
      tradition: 'hindu',
      language: customLang,
    });
  }

  async function copyCurrentStep() {
    await readerControls.handlers.copyText(`${currentTitle}\n\n${currentInstruction}`, currentTitle);
    trackReaderEvent('content_copied', {
      content_type: 'instruction',
      source: `aarti:${current.id}`,
      tradition: 'hindu',
      language: customLang,
    });
  }

  async function shareCurrentStep() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    await readerControls.handlers.share(
      `🪔 ${currentTitle}\n\n${currentInstruction}`,
      `Shoonaya - ${currentTitle}`,
      shareUrl,
    );
    trackReaderEvent('content_shared', {
      content_type: 'instruction',
      source: `aarti:${current.id}`,
      tradition: 'hindu',
      language: customLang,
    });
  }

  if (finished) {
    return (
      <ReaderShell
        title={t(customLang, 'aartiComplete')}
        fallbackBackUrl="/bhakti"
        themeColor="#C5A059"
      >
        <div className="flex flex-col items-center justify-center text-center mt-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180 }}>
            <div className="text-7xl mb-6">🙏</div>
            <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-serif)', color: textH }}>{t(customLang, 'aartiComplete')}</h1>
            <p className="text-sm leading-relaxed mb-2" style={{ color: textS }}>{t(customLang, 'aartiCompleteDesc')}</p>
            <p className="text-xs mb-8" style={{ color: textD }}>{t(customLang, 'aartiCompleteQuote')}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStep(0); setDone(new Set()); setDiyaLit(false); setFinished(false); }}
                className="rounded-2xl px-6 py-3 text-sm font-semibold"
                style={{ background: 'rgba(197, 160, 89,0.15)', border: '1px solid rgba(197, 160, 89,0.30)', color: '#C5A059' }}>
                {t(customLang, 'offerAgain')}
              </button>
              <button onClick={() => {
                if (window.history.length > 2) {
                  router.back();
                } else {
                  router.push('/bhakti');
                }
              }}
                className="rounded-2xl px-6 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#d4a645,#a07830)' }}>
                {t(customLang, 'donePranam')}
              </button>
            </div>
          </motion.div>
        </div>
      </ReaderShell>
    );
  }

  return (
    <ReaderShell
      title={t(customLang, 'guidedAarti')}
      subtitle={t(customLang, 'aartiStepOf').replace('{step}', String(step + 1)).replace('{total}', String(AARTI_STEPS.length))}
      fallbackBackUrl="/bhakti"
      themeColor="#C5A059"
      ambientGlowColor={`${current.color}15`}
      fontPresets={fontPresets}
      fontStep={fontStep}
      setFontStep={setFontStep}
      languages={languages}
      currentLanguage={customLang}
      setLanguage={(l) => {
        setCustomLang(l);
        trackReaderEvent('language_toggled', { content_type: 'instruction', source: `aarti:${current.id}`, tradition: 'hindu', language: l });
      }}
      onTTS={speakCurrentStep}
      ttsRate={ttsRate}
      onTTSRateChange={setTtsRate}
      isSpeaking={speaking}
      isTTSGenerating={readerControls.state.isGeneratingTTS}
      onCopy={copyCurrentStep}
      isCopied={readerControls.state.isCopied}
      onShare={shareCurrentStep}
      bottomBar={
        <div className="px-6 py-3 flex justify-between items-center max-w-xl mx-auto">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium disabled:opacity-30"
            style={{ color: textS }}>
            <ChevronLeft size={16} /> {t(customLang, 'previous')}
          </button>
          <button onClick={next}
            className="flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-semibold"
            style={{ background: 'rgba(197, 160, 89,0.12)', border: '1px solid rgba(197, 160, 89,0.25)', color: '#C5A059' }}>
            {isLast ? t(customLang, 'completeAarti') : <><span>{t(customLang, 'nextStep')}</span><ChevronRight size={16} /></>}
          </button>
        </div>
      }
      contentClassName="flex-1 px-4 pb-28 pt-6"
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pb-5">
        {AARTI_STEPS.map((s, i) => (
          <motion.div key={s.id} className="rounded-full transition-all"
            animate={{ width: i === step ? 20 : 7, background: done.has(i) ? s.color : i === step ? current.color : (isDark ? 'rgba(197, 160, 89,0.15)' : 'rgba(180,110,30,0.15)') }}
            style={{ height: 7 }} />
        ))}
      </div>

      {/* Main content */}
      <div>
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
                  style={{ color: `${current.color}80` }}>{currentTitleDevanagari}</p>
              </div>

              {/* Text */}
              <div className="px-5 py-5">
                <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-serif)', color: textH }}>{currentTitle}</h2>
                <p className="leading-relaxed" style={{ color: textS, fontSize: `${fontScale * 0.85}rem` }}>{currentInstruction}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={explainCurrentStep}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: `${current.color}10`, color: textH, border: `1px solid ${current.color}22` }}
                  >
                    <Sparkles size={12} />
                    {labels.explainVerse}
                  </button>
                </div>
              </div>
            </div>

            {/* Action button */}
            <motion.button
              onClick={handleAction}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl py-4 font-semibold text-sm transition-all relative overflow-hidden"
              style={{ background: done.has(step) ? `${current.color}18` : `linear-gradient(135deg,${current.color},${current.color}cc)`, border: `1px solid ${current.color}${done.has(step) ? '40' : '00'}`, color: done.has(step) ? current.color : '#fff' }}>
              {done.has(step)
                ? <span className="flex items-center justify-center gap-2"><Check size={16} /> {currentAction} — {t(customLang, 'aartiDoneLabel')}</span>
                : <span>{currentHint} ✦ {currentAction}</span>}
            </motion.button>

            {explainResult?.explanation ? (
              <div className="rounded-2xl px-4 py-4" style={{ background: cardBg, border: `1px solid ${current.color}20` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${current.color}cc` }}>
                  {explainResult.tradition ?? 'Hindu'} Guidance{explainResult.teacher ? ` · ${explainResult.teacher}` : ''}
                </p>
                <p className="text-sm leading-relaxed mb-3" style={{ color: textH }}>
                  {explainResult.explanation.meaning}
                </p>
                {explainResult.explanation.commentary ? (
                  <p className="text-[12px] leading-relaxed mb-3" style={{ color: textS }}>
                    {explainResult.explanation.commentary}
                  </p>
                ) : null}
                {explainResult.explanation.daily_application ? (
                  <p className="text-[11px] leading-relaxed" style={{ color: textD }}>
                    {explainResult.explanation.daily_application}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Step mini-map */}
            <div className="rounded-2xl px-4 py-3" style={{ background: isDark ? 'rgba(14,9,5,0.8)' : 'rgba(255,240,220,0.8)', border: `1px solid rgba(197, 160, 89,0.08)` }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(197, 160, 89,0.40)' }}>{t(customLang, 'aartiSequence')}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {AARTI_STEPS.map((s, i) => {
                  const localizedTitle = t(customLang, s.titleKey);
                  return (
                    <button key={s.id} onClick={() => setStep(i)}
                      className="flex items-center gap-1 text-[10px]"
                      style={{ color: i === step ? s.color : done.has(i) ? `${s.color}80` : textD }}>
                      {done.has(i) ? <Check size={9} /> : <span>{i + 1}.</span>}
                      {s.emoji} {localizedTitle.split(' — ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </ReaderShell>
  );
}
