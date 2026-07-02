'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Share2, Clock, Sparkles, Heart,
  Star, ExternalLink, ChevronDown, ChevronUp, Loader2, Volume2, VolumeX, Copy, Check
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import type { Katha } from '@/types/katha';
import { buildReadableCapabilities, type ReadableContent } from '@/lib/readable-content';
import { resolveReadablePreferences } from '@/lib/readable-preferences';
import { trackReaderEvent } from '@/lib/analytics/reader-events';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useReaderDisplayPreferences } from '@/lib/i18n/reader-display';
import { useReaderControls } from '@/hooks/useReaderControls';
import type { AppContentLanguage } from '@/lib/language-runtime';
import ReaderShell from '@/components/reader/ReaderShell';

interface Props {
  katha: Katha;
  appLanguage?: string;
  meaningLanguage?: string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
}

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

function transliterateDevanagariToGurmukhi(input: string): string {
  if (!input) return '';
  
  const devToGurMap: Record<string, string> = {
    // Vowels
    'अ': 'ਅ', 'आ': 'ਆ', 'इ': 'ਇ', 'ई': 'ਈ', 'उ': 'ਉ', 'ऊ': 'ਊ', 'ए': 'ਏ', 'ऐ': 'ਐ', 'ओ': 'ਓ', 'औ': 'ਔ',
    // Consonants
    'क': 'ਕ', 'ख': 'ਖ', 'ग': 'ਗ', 'घ': 'ਘ', 'ङ': 'ਙ',
    'च': 'ਚ', 'छ': 'ਛ', 'ज': 'ਜ', 'झ': 'ਝ', 'ञ': 'ਞ',
    'ट': 'ਟ', 'ठ': 'ਠ', 'ड': 'ਡ', 'ढ': 'ਢ', 'ण': 'ਣ',
    'त': 'ਤ', 'थ': 'ਥ', 'द': 'ਦ', 'ध': 'ਧ', 'न': 'ਨ',
    'प': 'ਪ', 'फ': 'ਫ', 'ब': 'ਬ', 'भ': 'ਭ', 'म': 'ਮ',
    'य': 'ਯ', 'र': 'ਰ', 'ल': 'ਲ', 'व': 'ਵ', 'श': 'ਸ਼', 'ष': 'ਸ਼', 'स': 'ਸ', 'ह': 'ਹ',
    // Matras (Vowel signs)
    'ा': 'ਾ', 'ਿ': 'ਿ', 'ੀ': 'ੀ', 'ੁ': 'ੁ', 'ੂ': 'ੂ', 'ੇ': 'ੇ', 'ੈ': 'ੈ', 'ੋ': 'ੋ', 'ੌ': 'ੌ',
    'ं': 'ਂ', 'ः': 'ਃ', 'ँ': 'ਂ', '्': '',
    // Numbers
    '०': '੦', '੧': '੧', '੨': '੨', '੩': '੩', '੪': '੪', '੫': '੫', '੬': '੬', '੭': '੭', '੮': '੮', '੯': '੯',
    // Punctuation
    '।': '।', '॥': '॥'
  };

  let result = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (char === '्') {
      continue;
    }
    
    let mapped = devToGurMap[char];
    
    if (mapped !== undefined) {
      if (char === 'ं') {
        const prev = result.slice(-1);
        if (['ਕ', 'ਖ', 'ਗ', 'ਘ', 'ਚ', 'ਛ', 'ਜ', 'ਝ', 'ਟ', 'ਠ', 'ਡ', 'ਢ', 'ਤ', 'ਥ', 'ਦ', 'ਧ', 'ਨ', 'ਪ', 'ਫ', 'ਬ', 'ਭ', 'ਮ', 'ਯ', 'ਰ', 'ਲ', 'ਵ', 'ਸ', 'ਹ', 'ਅ'].includes(prev)) {
          mapped = 'ੰ'; // Tippi
        } else {
          mapped = 'ਂ'; // Bindi
        }
      }
      result += mapped;
    } else {
      result += char;
    }
  }
  
  return result;
}

export default function KathaReaderClient({
  katha,
  appLanguage,
  meaningLanguage,
}: Props) {
  const router = useRouter();
  const hasHindi = (katha.bodyHi?.length ?? 0) > 0;
  const nativePaBody = katha.bodyPa;
  const nativePaTitle = katha.titlePa;
  const nativePaPhal = katha.phalPa;
  const hasPunjabi =
    (nativePaBody?.length ?? 0) > 0 &&
    !!nativePaTitle &&
    !!nativePaPhal;
  const readablePreferences = useMemo(() => resolveReadablePreferences({
    appLanguage,
    meaningLanguage,
  }), [appLanguage, meaningLanguage]);
  const resolvedLanguage = useMemo<AppContentLanguage>(() => {
    if (appLanguage === 'hi' && hasHindi) return 'hi';
    if (!readablePreferences.preferLocalLanguage) return 'en';
    if (hasHindi) return 'hi';
    if (hasPunjabi) return 'pa';
    return 'en';
  }, [appLanguage, hasHindi, hasPunjabi, readablePreferences.preferLocalLanguage]);

  const {
    language: lang,
    setLanguage: setLang,
    labels,
    fontPresets,
    languages,
    fontStep,
    setFontStep,
    fontScale,
  } = useReaderDisplayPreferences({
    resolvedLanguage,
    initialFontStep: 1,
  });

  const [liked, setLiked] = useState(false);
  const [showPhal, setShowPhal] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionMarkedRef = useRef(false);

  const isPanchatantra = katha.tags.includes('panchatantra');
  const isHero = katha.tradition !== 'sikh' &&
    katha.tags.some(t => ['warriors', 'saints', 'heroes', 'martyrdom', 'seva', 'sacrifice'].includes(t)) &&
    !isPanchatantra;

  const tradColor = isPanchatantra
    ? '#8B9E6E'
    : isHero
      ? '#D4643A'
      : (TRADITION_COLORS[katha.tradition] ?? '#C5A059');

  const trad = isPanchatantra
    ? { label: 'Panchatantra', termKatha: 'Wisdom Tale' }
    : isHero
      ? { label: 'Heroes of Bharat', termKatha: 'Hero Legend' }
      : (TRADITION_LABELS[katha.tradition] ?? TRADITION_LABELS.hindu);
  const kathaReadableContent: ReadableContent = useMemo(() => ({
    original: [katha.title, ...katha.body, katha.phal].join('\n\n'),
    meaning: hasHindi ? [katha.titleHi ?? '', ...(katha.bodyHi ?? []), katha.phalHi ?? ''].filter(Boolean).join('\n\n') : undefined,
    sourceLabel: `Katha — ${katha.title}`,
    tradition: katha.tradition,
    language: 'en',
    script: 'latin',
    pipelineTags: {
      content_type: 'katha',
      response_mode: 'conversational',
      audio_mode: isPanchatantra ? 'story' : 'meditative',
      tradition: katha.tradition === 'all' ? 'generic' : katha.tradition,
      script: 'latin',
      delivery_intent: 'live_user',
    },
    capabilities: buildReadableCapabilities({
      original: [katha.title, ...katha.body].join('\n\n'),
      meaning: hasHindi ? katha.bodyHi?.join('\n\n') : undefined,
      script: 'latin',
      pipelineTags: {
        content_type: 'katha',
        audio_mode: isPanchatantra ? 'story' : 'meditative',
      },
    }),
  }), [hasHindi, isPanchatantra, katha]);
  const readerControls = useReaderControls(kathaReadableContent.capabilities);

  // Which body / phal to show based on selected language
  const bodyToShow =
    lang === 'hi' && hasHindi ? (katha.bodyHi ?? katha.body) :
    lang === 'pa' ? (
      nativePaBody && nativePaBody.length > 0 
        ? nativePaBody 
        : (katha.bodyHi ?? katha.body).map(para => transliterateDevanagariToGurmukhi(para))
    ) :
    katha.body;

  const phalToShow =
    lang === 'hi' && katha.phalHi ? katha.phalHi :
    lang === 'pa' ? (
      nativePaPhal 
        ? nativePaPhal 
        : transliterateDevanagariToGurmukhi(katha.phalHi ?? katha.phal)
    ) :
    katha.phal;

  const titleToShow =
    lang === 'hi' && katha.titleHi ? katha.titleHi :
    lang === 'pa' ? (
      nativePaTitle 
        ? nativePaTitle 
        : transliterateDevanagariToGurmukhi(katha.titleHi ?? katha.title)
    ) :
    katha.title;

  const markKathaDone = useCallback(async () => {
    if (completionMarkedRef.current) return;
    completionMarkedRef.current = true;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      const today = localSpiritualDate(tz, 4);
      localStorage.setItem(`shoonaya-katha-done-${today}`, 'true');
      void (async () => {
        try {
          await supabase
            .from('daily_sadhana')
            .upsert(
              { user_id: user.id, date: today, katha_done: true },
              { onConflict: 'user_id,date' }
            );
        } catch {
          // Non-fatal bonus tracking.
        }
      })();
    } catch {
      // Non-fatal bonus tracking.
    }
  }, []);

  const hasAnyLocal = hasHindi || hasPunjabi;

  useEffect(() => {
    trackReaderEvent('reader_opened', {
      content_type: 'katha',
      source: `katha:${katha.id}`,
      tradition: katha.tradition,
      language: lang,
      has_meaning: hasHindi,
      has_transliteration: false,
    });
  }, [hasHindi, katha.id, katha.tradition, lang]);

  async function copyToClipboard() {
    const textToCopy = `${titleToShow}\n\n${bodyToShow.join('\n\n')}\n\nPhal:\n${phalToShow}`;
    await readerControls.handlers.copyText(textToCopy, 'Katha');
    trackReaderEvent('content_copied', {
      content_type: 'katha',
      source: `katha:${katha.id}`,
      tradition: katha.tradition,
      language: lang,
    });
  }

  async function shareKatha() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `🙏 Radhe Radhe! Check out this inspiring ${trad.termKatha} on Shoonaya: '${titleToShow}'. Read here: ${shareUrl} to elevate your Sadhana.`;
    await readerControls.handlers.share(shareText, `Shoonaya - ${titleToShow}`, shareUrl);
    trackReaderEvent('content_shared', {
      content_type: 'katha',
      source: `katha:${katha.id}`,
      tradition: katha.tradition,
      language: lang,
    });
  }

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  useEffect(() => () => stopTTS(), [stopTTS]);

  async function speakKatha() {
    if (speaking || readerControls.state.isGeneratingTTS) {
      stopTTS();
      return;
    }

    const title = titleToShow;
    const text = [title, ...bodyToShow, phalToShow].join('\n\n');
    const trimmedText = text.length > 4600 ? `${text.slice(0, 4550)}.` : text;

    trackReaderEvent('tts_requested', {
      content_type: 'katha',
      source: `katha:${katha.id}`,
      tradition: katha.tradition,
      language: lang,
    });
    try {
      const audioUrl = await readerControls.handlers.requestTTS(trimmedText, {
        quality: 'pandit',
        speed: katha.tags.includes('panchatantra') ? 0.86 : 0.78,
        rate: ttsRate,
        pipelineTags: {
          content_type: 'katha',
          audio_mode: katha.tags.includes('panchatantra') ? 'story' : 'meditative'
        },
      });
      if (!audioUrl) throw new Error('TTS failed');
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        audioRef.current = null;
        void markKathaDone();
      };
      audio.onerror = () => {
        setSpeaking(false);
        audioRef.current = null;
      };
      await audio.play();
      setSpeaking(true);
    } catch {
      stopTTS();
    }
  }

  return (
    <ReaderShell
      title={titleToShow}
      subtitle={trad.termKatha}
      fallbackBackUrl="/bhakti/katha"
      themeColor={tradColor}
      ambientGlowColor={tradColor}
      fontPresets={fontPresets}
      fontStep={fontStep}
      setFontStep={setFontStep}
      languages={languages.filter(l => {
        if (l.code === 'hi') return hasHindi;
        if (l.code === 'pa') return nativePaBody && nativePaBody.length > 0;
        return true;
      })}
      currentLanguage={lang}
      setLanguage={(l) => {
        setLang(l);
        trackReaderEvent('language_toggled', { content_type: 'katha', source: `katha:${katha.id}`, tradition: katha.tradition, language: l });
      }}
      onTTS={speakKatha}
      ttsRate={ttsRate}
      onTTSRateChange={setTtsRate}
      isSpeaking={speaking}
      isTTSGenerating={readerControls.state.isGeneratingTTS}
      onCopy={copyToClipboard}
      isCopied={readerControls.state.isCopied}
      onShare={shareKatha}
      bottomBar={
        <div className="px-5 py-4 max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setShowPhal(s => !s)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all motion-press shrink-0"
            style={{ background: 'rgba(197, 160, 89, 0.08)', border: '1px solid rgba(197, 160, 89, 0.20)' }}
            aria-label={showPhal ? labels.kathaHidePhal : labels.kathaRevealBlessing}
          >
            {showPhal ? <ChevronUp size={18} color={THEME.gold} /> : <Sparkles size={18} color={THEME.gold} />}
          </button>
          {katha.relatedJapaMantra ? (
            <Link
              href="/japa"
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all motion-press shrink-0"
              style={{ background: 'rgba(197, 160, 89, 0.08)', border: '1px solid rgba(197, 160, 89, 0.20)' }}
              title={labels.startJapa}
              aria-label={labels.startJapa}
            >
              <span className="text-xl">📿</span>
            </Link>
          ) : null}
          <button
            onClick={() => {
              void markKathaDone();
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push('/bhakti/katha');
              }
            }}
            className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all motion-press"
            style={{ background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.24)', color: THEME.gold }}
          >
            <span>{labels.done}</span>
          </button>
        </div>
      }
      contentClassName="px-6 space-y-6 pt-8 pb-36"
    >
        {bodyToShow.map((para, idx) => (
          <motion.p
            key={`${lang}-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.4 }}
            className={`text-[var(--text-main)]/85 leading-[1.8] font-light`}
            style={{ 
                fontFamily: lang !== 'en' ? 'inherit' : 'var(--font-serif, Georgia, serif)',
                fontSize: `${fontScale * 1}rem` 
            }}
          >
            {para}
          </motion.p>
        ))}
      {/* ── Phal (Fruit / Moral) ── */}
      <section className="px-6 mt-12">
        <motion.button
          onClick={() => setShowPhal(s => !s)}
          className="w-full rounded-[2rem] p-6 border border-[#C5A059]/20 bg-[#C5A059]/5 flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[#C5A059]/10 border border-[#C5A059]/30"
            >
              <Star size={16} color={THEME.gold} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] mb-0.5">{labels.kathaFruitOfKatha}</p>
              <p className="text-[var(--text-dim)] text-[12px]">{labels.kathaRevealBlessing}</p>
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
                <h3 className="text-xl font-bold premium-serif" style={{ color: THEME.gold }}>{labels.kathaPhalShruti}</h3>
                <div className={`text-[var(--text-dim)] leading-relaxed mt-4 ${lang !== 'en' ? (lang === 'pa' ? 'punjabi-serif' : 'katha-local') : 'premium-serif'}`}
                  style={{ fontSize: `${fontScale * 1}rem` }}
                >
                  {phalToShow}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Cross-links ── */}
      <section className="px-6 mt-10 space-y-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-dim)]">{labels.continuePractice}</h3>

        {katha.relatedJapaMantra && (
          <Link href="/japa">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="rounded-[2rem] p-5 border border-[var(--divine-border)]/10 bg-[var(--surface-base)]/30 flex items-center justify-between hover:bg-[var(--surface-base)]/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-[44px] h-[44px] rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-xl">
                  📿
                </div>
                <div>
                  <p className="text-[var(--text-main)] text-[13px] font-semibold">{labels.startJapa}</p>
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
              <div className="w-[44px] h-[44px] rounded-2xl bg-[var(--surface-base)] border border-[var(--divine-border)]/20 flex items-center justify-center text-xl">
                📚
              </div>
              <div>
                <p className="text-[var(--text-main)] text-[13px] font-semibold">{labels.moreKathas}</p>
                <p className="text-[var(--text-dim)] text-[11px] mt-0.5">{labels.exploreSacredLibrary}</p>
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
          <span>{liked ? labels.jaiShriHari : labels.appreciateThisKatha}</span>
        </motion.button>
      </section>
    </ReaderShell>
  );
}
