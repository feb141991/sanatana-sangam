'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Share2, Clock, Sparkles, Heart,
  Star, ExternalLink, ChevronDown, ChevronUp, Loader2, Volume2, VolumeX
} from 'lucide-react';
import Link from 'next/link';
import type { Katha } from '@/lib/katha-library';

interface Props { katha: Katha; }

const THEME = {
  bg: 'var(--divine-bg)',
  gold: '#C5A059',
};

const TRADITION_COLORS: Record<string, string> = {
  hindu: '#FF6B35', sikh: '#1B7FD4', buddhist: '#7C5CBF', jain: '#2D9E4A',
};

const TRADITION_LABELS: Record<string, { label: string; termKatha: string }> = {
  hindu:    { label: 'Hindu', termKatha: 'Katha' },
  sikh:     { label: 'Sikh', termKatha: 'Sakhi' },
  buddhist: { label: 'Buddhist', termKatha: 'Dhamma Story' },
  jain:     { label: 'Jain', termKatha: 'Katha' },
};

const OCCASION_LABELS: Record<string, string> = {
  ekadashi: 'Ekadashi', purnima: 'Purnima', amavasya: 'Amavasya',
  pradosh: 'Pradosh', chaturthi: 'Chaturthi', shivaratri: 'Shivaratri',
  navratri: 'Navratri', diwali: 'Diwali', holi: 'Holi',
  janmashtami: 'Janmashtami', ramnavami: 'Ram Navami',
  'ganesh-chaturthi': 'Ganesh Chaturthi', 'karva-chauth': 'Karva Chauth',
  teej: 'Teej', gurpurab: 'Gurpurab', baisakhi: 'Baisakhi',
  vesak: 'Vesak', paryushana: 'Paryushana', general: 'General',
};

export default function KathaReaderClient({ katha }: Props) {
  const router = useRouter();
  const [showHindi, setShowHindi] = useState(false);
  const [sankalpaDismissed, setSankalpaDismissed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showPhal, setShowPhal] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const tradColor = TRADITION_COLORS[katha.tradition] ?? '#C5A059';
  const trad = TRADITION_LABELS[katha.tradition] ?? TRADITION_LABELS.hindu;
  const hasHindi = (katha.bodyHi?.length ?? 0) > 0;

  const bodyToShow = showHindi && hasHindi ? (katha.bodyHi ?? katha.body) : katha.body;
  const phalToShow = showHindi && katha.phalHi ? katha.phalHi : katha.phal;
  const isPanchatantra = katha.tags.includes('panchatantra');

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setSpeaking(false);
    setTtsLoading(false);
  }, []);

  useEffect(() => () => stopTTS(), [stopTTS]);

  async function speakKatha() {
    if (speaking || ttsLoading) {
      stopTTS();
      return;
    }

    const title = showHindi && katha.titleHi ? katha.titleHi : katha.title;
    const text = [title, ...bodyToShow, phalToShow].join('\n\n');
    const trimmedText = text.length > 4600 ? `${text.slice(0, 4550)}.` : text;

    setTtsLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmedText,
          quality: 'pandit',
          rate: isPanchatantra ? 0.86 : 0.78,
        }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const { audioContent } = await res.json() as { audioContent: string };
      const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;
      audio.onended = stopTTS;
      audio.onerror = stopTTS;
      await audio.play();
      setSpeaking(true);
    } catch {
      stopTTS();
    } finally {
      setTtsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen pb-36 overflow-x-hidden bg-[var(--divine-bg)] text-[var(--text-main)] font-outfit selection:bg-[#C5A059]/30">
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-0 w-96 h-96 blur-[140px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10 opacity-25 dark:opacity-20"
        style={{ background: tradColor }}
      />

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-6 pt-12 pb-4 backdrop-blur-xl bg-[var(--divine-bg)]/80 border-b border-[var(--divine-border)]/10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-[var(--divine-border)]/10 flex items-center justify-center bg-[var(--surface-base)]/20 text-[var(--text-main)]"
          >
            <ChevronLeft size={20} color={THEME.gold} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em]" style={{ color: tradColor }}>
              {trad.termKatha}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasHindi && (
              <button
                onClick={() => setShowHindi(s => !s)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                  showHindi
                    ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10'
                    : 'border-[var(--divine-border)]/10 text-[var(--text-dim)]'
                }`}
              >
                {showHindi ? 'EN' : 'हिं'}
              </button>
            )}
            <button className="w-10 h-10 rounded-full border border-[var(--divine-border)]/10 flex items-center justify-center bg-[var(--surface-base)]/20 text-[var(--text-main)]">
              <Share2 size={15} color={THEME.gold} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Sankalpa Nudge ── */}
      <AnimatePresence>
        {!sankalpaDismissed && katha.occasion !== 'general' && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="mx-6 mt-4"
          >
            <div
              className="rounded-2xl p-4 border flex items-start gap-3"
              style={{ borderColor: `${tradColor}25`, background: `${tradColor}08` }}
            >
              <Sparkles size={14} color={tradColor} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: tradColor }}>
                  Sankalpa Moment
                </p>
                <p className="text-[var(--text-dim)] text-[12px] leading-relaxed">
                  Before you begin, take a breath. Set your intention — read this katha with an open heart and let its wisdom guide your practice of{' '}
                  <span className="text-[var(--text-main)] font-semibold">{OCCASION_LABELS[katha.occasion]}</span>.
                </p>
              </div>
              <button onClick={() => setSankalpaDismissed(true)} className="text-[var(--text-dim)] text-xs mt-0.5 hover:text-[var(--text-main)]">✕</button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Title Block ── */}
      <section className="px-6 mt-8 space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border"
            style={{ color: tradColor, borderColor: `${tradColor}30`, background: `${tradColor}10` }}
          >
            {trad.label}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[var(--divine-border)]/15 text-[var(--text-dim)]">
            {OCCASION_LABELS[katha.occasion] ?? katha.occasion}
          </span>
          {katha.deity && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#C5A059]/15 text-[#C5A059]/80">
              {katha.deity.charAt(0).toUpperCase() + katha.deity.slice(1)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-serif text-[var(--text-main)] leading-tight">
          {showHindi && katha.titleHi ? katha.titleHi : katha.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-[var(--text-dim)] text-[11px]">
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-[#C5A059]" />
            <span>{katha.durationMin} min read</span>
          </div>
          {katha.relatedJapaMantra && (
            <div className="flex items-center gap-1.5">
              <Star size={10} className="text-[#C5A059]" />
              <span className="font-semibold text-[#C5A059]">{katha.relatedJapaMantra}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-[var(--divine-border)]/10" />
          <span className="text-2xl opacity-40">🕉️</span>
          <div className="flex-1 h-px bg-[var(--divine-border)]/10" />
        </div>

        {/* Akash narration */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={speakKatha}
          disabled={ttsLoading}
          className="w-full rounded-[1.6rem] p-4 border flex items-center justify-between text-left disabled:opacity-70"
          style={{ borderColor: `${tradColor}28`, background: `${tradColor}0d` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center border"
              style={{ borderColor: `${tradColor}28`, background: speaking ? tradColor : `${tradColor}16` }}
            >
              {ttsLoading
                ? <Loader2 size={18} className="animate-spin" color={speaking ? '#fff' : tradColor} />
                : speaking
                  ? <VolumeX size={18} color="#fff" />
                  : <Volume2 size={18} color={tradColor} />}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-main)]">
                {speaking ? 'Stop Akash narration' : isPanchatantra ? 'Listen with Akash' : 'Listen to this katha'}
              </p>
              <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                {showHindi && hasHindi ? 'Hindi narration' : 'English narration'} · {isPanchatantra ? 'Story pace' : 'Meditative pace'}
              </p>
            </div>
          </div>
          {speaking && (
            <div className="flex items-end gap-1 h-7" aria-hidden="true">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full"
                  style={{ background: tradColor }}
                  animate={{ height: [6, 22, 10, 18, 6] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
                />
              ))}
            </div>
          )}
        </motion.button>
      </section>

      {/* ── Katha Body ── */}
      <section className="px-6 mt-8 space-y-6">
        {bodyToShow.map((para, idx) => (
          <motion.p
            key={`${showHindi}-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.4 }}
            className="text-[var(--text-main)]/85 text-[15px] sm:text-[16px] leading-[1.8] font-light"
            style={{ fontFamily: showHindi ? 'inherit' : 'var(--font-serif, Georgia, serif)' }}
          >
            {para}
          </motion.p>
        ))}
      </section>

      {/* ── Phal (Fruit / Moral) ── */}
      <section className="px-6 mt-12">
        <motion.button
          onClick={() => setShowPhal(s => !s)}
          className="w-full rounded-[2rem] p-6 border border-[#C5A059]/20 bg-[#C5A059]/5 flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#C5A059]/10 border border-[#C5A059]/30"
            >
              <Star size={16} color={THEME.gold} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] mb-0.5">Phal — Fruit of the Katha</p>
              <p className="text-[var(--text-dim)] text-[12px]">Tap to reveal the blessing and moral</p>
            </div>
          </div>
          {showPhal ? <ChevronUp size={16} color={THEME.gold} /> : <ChevronDown size={16} color={THEME.gold} />}
        </motion.button>

        <AnimatePresence>
          {showPhal && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-[2rem] p-6 border border-[#C5A059]/15 bg-[#C5A059]/5">
                <p className="text-[var(--text-main)]/85 text-[14px] leading-[1.8] font-light italic">
                  &ldquo;{phalToShow}&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Cross-links ── */}
      <section className="px-6 mt-10 space-y-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-dim)]">Continue Your Practice</h3>

        {katha.relatedJapaMantra && (
          <Link href="/japa">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="rounded-[2rem] p-5 border border-[var(--divine-border)]/10 bg-[var(--surface-base)]/30 flex items-center justify-between hover:bg-[var(--surface-base)]/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-xl">
                  📿
                </div>
                <div>
                  <p className="text-[var(--text-main)] text-[13px] font-semibold">Start Japa</p>
                  <p className="text-[var(--text-dim)] text-[11px] mt-0.5">{katha.relatedJapaMantra}</p>
                </div>
              </div>
              <ExternalLink size={14} color={THEME.gold} className="opacity-60" />
            </motion.div>
          </Link>
        )}

        <Link href="/bhakti/katha">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="rounded-[2rem] p-5 border border-[var(--divine-border)]/10 bg-[var(--surface-base)]/30 flex items-center justify-between hover:bg-[var(--surface-base)]/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--surface-base)] border border-[var(--divine-border)]/20 flex items-center justify-center text-xl">
                📚
              </div>
              <div>
                <p className="text-[var(--text-main)] text-[13px] font-semibold">More Kathas</p>
                <p className="text-[var(--text-dim)] text-[11px] mt-0.5">Explore the sacred library</p>
              </div>
            </div>
            <ExternalLink size={14} color={THEME.gold} className="opacity-60" />
          </motion.div>
        </Link>
      </section>

      {/* ── Like / Appreciate ── */}
      <section className="px-6 mt-10 flex justify-center">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setLiked(l => !l)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full border text-[13px] font-semibold transition-all duration-300 cursor-pointer ${
            liked
              ? 'border-rose-400/40 bg-rose-400/10 text-rose-500'
              : 'border-[var(--divine-border)]/20 text-[var(--text-dim)] hover:text-[var(--text-main)] bg-[var(--surface-base)]/30'
          }`}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          <span>{liked ? 'Jai Shri Hari 🙏' : 'Appreciate this Katha'}</span>
        </motion.button>
      </section>
    </div>
  );
}
