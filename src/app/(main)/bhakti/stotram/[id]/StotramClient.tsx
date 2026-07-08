'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Repeat, Copy, Check, Share2, Square, Loader2, SkipBack } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { DEVOTIONAL_STARTER_TRACKS } from '@/lib/devotional-audio';
import type { Stotram } from '@/lib/stotrams';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Suspense, use } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { localSpiritualDate } from '@/lib/sacred-time';
import { resolveReadablePreferences, type ReadablePreferences } from '@/lib/readable-preferences';
import { buildReadableCapabilities, type ReadableContent } from '@/lib/readable-content';
import { useReaderControls } from '@/hooks/useReaderControls';
import { trackReaderEvent } from '@/lib/analytics/reader-events';
import { useReaderDisplayPreferences } from '@/lib/i18n/reader-display';
import ReaderShell from '@/components/reader/ReaderShell';
import ScriptureCorrectionModal from '@/components/ScriptureCorrectionModal';

// ─── Direct Translations for Major Stotrams & Mantras ─────────────────────────
const STOTRAM_TRANSLATIONS: Record<string, Record<number, { hi: string; pa: string }>> = {
  'gayatri-mantra': {
    0: {
      hi: 'हम उस प्राणस्वरूप, दुःखनाशक, सुखस्वरूप, श्रेष्ठ, तेजस्वी, पापनाशक, देवस्वरूप परमात्मा का ध्यान करते हैं। वह परमात्मा हमारी बुद्धि को सन्मार्ग की ओर प्रेरित करे।',
      pa: 'ਅਸੀਂ ਉਸ ਪ੍ਰਾਣਸਵਰੂਪ, ਦੁੱਖਨਾਸ਼ਕ, ਸੁਖਸਵਰੂਪ, ਉੱਤਮ, ਤੇਜਸਵੀ, ਪਾਪਨਾਸ਼ਕ, ਦੇਵਸਵਰੂਪ ਪਰਮਾਤਮਾ ਦਾ ਧਿਆਨ ਕਰਦੇ ਹਾਂ। ਉਹ ਪਰਮਾਤਮਾ ਸਾਡੀ ਬੁੱਧੀ ਨੂੰ ਚੰਗੇ ਮਾਰਗ ਵੱਲ ਪ੍ਰੇਰਿਤ ਕਰੇ।'
    }
  },
  'mahamrityunjaya-mantra': {
    0: {
      hi: 'हम तीन नेत्रों वाले भगवान शिव की पूजा करते हैं, जो सुगंधित हैं और जो सभी जीवित प्राणियों का पोषण करते हैं। जैसे एक पका हुआ खरबूजा बेल के बंधन से मुक्त हो जाता है, वैसे ही वे हमें मृत्यु और नश्वरता के बंधन से मुक्त करें, मोक्ष की प्राप्ति कराएं।',
      pa: 'ਅਸੀਂ ਤਿੰਨ ਅੱਖਾਂ ਵਾਲੇ ਭਗਵਾਨ ਸ਼ਿਵ ਦੀ ਪੂਜਾ ਕਰਦੇ ਹਾਂ, ਜੋ ਸੁਗੰਧਿਤ ਹਨ ਅਤੇ ਜੋ ਸਾਰੇ ਜੀਵਾਂ ਦਾ ਪਾਲਣ ਕਰਦੇ ਹਨ। ਜਿਵੇਂ ਇੱਕ ਪੱਕਾ ਹੋਇਆ ਖਰਬੂਜਾ ਵੇਲ ਤੋਂ ਮੁਕਤ ਹੋ ਜਾਂਦਾ ਹੈ, ਉਵੇਂ ਹੀ ਉਹ ਸਾਨੂੰ ਮੌਤ ਦੇ ਬੰਧਨ ਤੋਂ ਮੁਕਤ ਕਰਨ, ਮੋਖ ਦੀ ਪ੍ਰਾਪਤੀ ਕਰਾਉਣ।'
    }
  },
  'waheguru-simran': {
    0: {
      hi: 'अद्भुत और असीम अंधकार-निवारक परमात्मा (वाहेगुरु) का सिमरन, जो अकाल पुरख है और हर हृदय में निवास करता है।',
      pa: 'ਅਦਭੁਤ ਅਤੇ ਬੇਅੰਤ ਹਨੇਰੇ ਨੂੰ ਦੂਰ ਕਰਨ ਵਾਲੇ ਪਰਮਾਤਮਾ (ਵਾਹਿਗੁਰੂ) ਦਾ ਸਿਮਰਨ, ਜੋ ਅਕਾਲ ਪੁਰਖ ਹੈ ਅਤੇ ਹਰ ਹਿਰਦੇ ਵਿੱਚ ਨਿਵਾਸ ਕਰਦਾ ਹੈ।'
    }
  },
  'namokar-mantra': {
    0: {
      hi: 'मैं अरिहंतों (जिन्होंने राग-द्वेष जीता है) को नमन करता हूँ। मैं सिद्धों (मुक्त आत्माओं) को नमन करता हूँ। मैं आचार्यों (आध्यात्मिक गुरुओं) को नमन करता हूँ। मैं उपाध्यायों (शिक्षकों) को नमन करता हूँ। मैं संसार के सभी साधुओं को नमन करता हूँ। यह पांच गुना नमस्कार सभी पापों का नाश करने वाला है।',
      pa: 'ਮੈਂ ਅਰਿਹੰਤਾਂ ਨੂੰ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ। ਮੈਂ ਸਿੱਧਾਂ ਨੂੰ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ। ਮੈਂ ਆਚਾਰਯਾਂ ਨੂੰ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ। ਮੈਂ ਉਪਾਧਿਆਵਾਂ ਨੂੰ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ। ਮੈਂ ਸੰਸਾਰ ਦੇ ਸਾਰੇ ਸਾਧੂਆਂ ਨੂੰ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ। ਇਹ ਪੰਜ ਗੁਣਾ ਨਮਸਕਾਰ ਸਾਰੇ ਪਾਪਾਂ ਦਾ ਨਾਸ ਕਰਨ ਵਾਲਾ ਹੈ।'
    }
  },
  'om-mani-padme-hum': {
    0: {
      hi: 'देखो! कमल में छिपे हुए मणि के समान बोधिसत्व की करुणा जागृत हो। यह मंत्र मन को शुद्ध करता है और परम ज्ञान की ओर ले जाता है।',
      pa: 'ਵੇਖੋ! ਕਮਲ ਵਿੱਚ ਛੁਪੇ ਹੋਏ ਮਣੀ ਦੇ ਸਮਾਨ ਬੋਧੀਸਤਵ ਦੀ ਦਇਆ ਜਾਗ੍ਰਿਤ ਹੋਵੇ। ਇਹ ਮੰਤਰ ਮਨ ਨੂੰ ਸ਼ੁੱਧ ਕਰਦਾ ਹੈ ਅਤੇ ਪਰਮ ਗਿਆਨ ਵੱਲ ਲੈ ਜਾਂਦਾ ਹੈ।'
    }
  },
  'om-namah-shivaya': {
    0: {
      hi: 'मैं भगवान शिव (पंचभूतों के स्वामी) के समक्ष पूरी श्रद्धा के साथ नमन करता हूँ।',
      pa: 'ਮੈਂ ਭਗਵਾਨ ਸ਼ਿਵ ਦੇ ਸਨਮੁਖ ਪੂਰੀ ਸ਼ਰਧਾ ਨਾਲ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ।'
    }
  },
  'shiva-tandava': {
    0: {
      hi: 'जटा रूपी वन से बहने वाली गंगा की धाराओं द्वारा पवित्र किए गए गले में सर्पों की विशाल माला धारण करने वाले भगवान शिव कल्याणकारी तांडव नृत्य करें।',
      pa: 'ਜਟਾ ਰੂਪੀ ਜੰਗਲ ਵਿੱਚੋਂ ਵਹਿਣ ਵਾਲੀ ਗੰਗਾ ਦੀਆਂ ਧਾਰਾਵਾਂ ਦੁਆਰਾ ਪਵਿੱਤਰ ਕੀਤੇ ਗਏ ਗਲ ਵਿੱਚ ਸੱਪਾਂ ਦੀ ਮਾਲਾ ਧਾਰਨ ਕਰਨ ਵਾਲੇ ਭਗਵਾਨ ਸ਼ਿਵ ਕਲਿਆਣਕਾਰੀ ਤਾਂਡਵ ਨਾਚ ਕਰਨ।'
    }
  },
  'madhurashtakam': {
    0: {
      hi: 'श्री कृष्ण के होंठ मधुर हैं, मुख मधुर है, आंखें मधुर हैं, मुस्कान मधुर है, हृदय मधुर है और चाल भी मधुर है। मधुरता के स्वामी का सब कुछ मधुर है।',
      pa: 'ਸ੍ਰੀ ਕ੍ਰਿਸ਼ਨ ਦੇ ਬੁੱਲ੍ਹ ਮਧੁਰ ਹਨ, ਮੁੱਖ ਮਧੁਰ ਹੈ, ਅੱਖਾਂ ਮਧੁਰ ਹਨ, ਮੁਸਕਾਨ ਮਧੁਰ ਹੈ, ਹਿਰਦਾ ਮਧੁਰ ਹੈ ਅਤੇ ਚਾਲ ਵੀ ਮਧੁਰ ਹੈ। ਮਧੁਰਤਾ ਦੇ ਸਵਾਮੀ ਦਾ ਸਭ ਕੁਝ ਮਧੁਰ ਹੈ।'
    }
  },
  'deh-shiva-bar-mohe': {
    0: {
      hi: 'हे शिवा (परम शक्ति)! मुझे यह वरदान दें कि मैं कभी भी शुभ कर्मों को करने से पीछे न हटू। जब मैं युद्ध में जाऊं तो शत्रु से न डरूं, और निश्चय ही अपनी विजय सुनिश्चित करूं।',
      pa: 'ਹੇ ਸ਼ਿਵਾ (ਪਰਮ ਸ਼ਕਤੀ)! ਮੈਨੂੰ ਇਹ ਵਰਦਾਨ ਦਿਓ ਕਿ ਮੈਂ ਕਦੇ ਵੀ ਸ਼ੁਭ ਕਰਮਾਂ ਨੂੰ ਕਰਨ ਤੋਂ ਪਿੱਛੇ ਨਾ ਹਟਾਂ। ਜਦੋਂ ਮੈਂ ਯੁੱਧ ਵਿੱਚ ਜਾਵਾਂ ਤਾਂ ਦੁਸ਼ਮਣ ਤੋਂ ਨਾ ਡਰਾਂ, ਅਤੇ ਨਿਸ਼ਚੇ ਹੀ ਆਪਣੀ ਜਿੱਤ ਪ੍ਰਾਪਤ ਕਰਾਂ।'
    }
  },
  'buddham-saranam': {
    0: {
      hi: 'मैं बुद्ध (जागृत चेतना) की शरण लेता हूँ। मैं धर्म (परम सत्य) की शरण लेता हूँ। मैं संघ (पवित्र समुदाय) की शरण लेता हूँ।',
      pa: 'ਮੈਂ ਬੁੱਧ (ਜਾਗ੍ਰਿਤ ਚੇਤਨਾ) ਦੀ ਸ਼ਰਨ ਲੈਂਦਾ ਹਾਂ। ਮੈਂ ਧਰਮ (ਪਰਮ ਸੱਚ) ਦੀ ਸ਼ਰਨ ਲੈਂਦਾ ਹਾਂ। ਮੈਂ ਸੰਘ (ਪਵਿੱਤਰ ਸੰਗਤ) ਦੀ ਸ਼ਰਨ ਲੈਂਦਾ ਹਾਂ।'
    }
  },
  'bhaktamar-stotra': {
    0: {
      hi: 'मैं उन आदिनाथ भगवान के चरण-कमलों को नमन करता हूँ जो देवों के मुकुटों की मणियों की कांति को बढ़ाने वाले हैं, जो पाप रूपी अंधकार का नाश करते हैं और संसार सागर में डूबते हुए प्राणियों के लिए एकमात्र सहारा हैं।',
      pa: 'ਮੈਂ ਉਹਨਾਂ ਆਦਿਨਾਥ ਭਗਵਾਨ ਦੇ ਚਰਨ-ਕਮਲਾਂ ਨੂੰ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ ਜੋ ਦੇਵਤਿਆਂ ਦੇ ਮੁਕੁਟਾਂ ਦੀਆਂ ਮਣੀਆਂ ਦੀ ਚਮਕ ਵਧਾਉਣ ਵਾਲੇ ਹਨ, ਜੋ ਪਾਪ ਰੂਪੀ ਹਨੇਰੇ ਨੂੰ ਨਾਸ ਕਰਦੇ ਹਨ ਅਤੇ ਸੰਸਾਰ ਸਾਗਰ ਵਿੱਚ ਡੁੱਬਦੇ ਹੋਏ ਜੀਵਾਂ ਲਈ ਇੱਕੋ ਇੱਕ ਸਹਾਰਾ ਹਨ।'
    }
  },
  'hare-krishna-maha-mantra': {
    0: {
      hi: 'हे भगवान कृष्ण! हे परम शक्ति राधा! मुझे अपनी प्रेममयी सेवा में लीन करें। यह महामंत्र कलयुग के अंधकार को मिटाकर आत्मा को जगाता है।',
      pa: 'ਹੇ ਭਗਵਾਨ ਕ੍ਰਿਸ਼ਨ! ਹੇ ਪਰਮ ਸ਼ਕਤੀ ਰਾਧਾ! ਮੈਨੂੰ ਆਪਣੀ ਪ੍ਰੇਮਮਈ ਸੇਵਾ ਵਿੱਚ ਲੀਨ ਕਰੋ। ਇਹ ਮਹਾਮੰਤਰ ਕਲਯੁਗ ਦੇ ਹਨੇਰੇ ਨੂੰ ਮਿਟਾ ਕੇ ਆਤਮਾ ਨੂੰ ਜਗਾਉਂਦਾ ਹੈ।'
    }
  }
};

function getVerseMeaning(stotramId: string, verseIdx: number, enMeaning: string, targetLang: 'en' | 'hi' | 'pa', verseMeaningHi?: string): string {
  if (targetLang === 'en') return enMeaning;
  
  if (targetLang === 'hi' && verseMeaningHi) {
    return verseMeaningHi;
  }
  
  const curated = STOTRAM_TRANSLATIONS[stotramId]?.[verseIdx];
  if (curated && curated[targetLang]) {
    return curated[targetLang];
  }
  
  // Dynamic replacement mapping for spiritual fallback
  if (targetLang === 'hi') {
    return `${enMeaning
      .replace(/I bow to/gi, 'मैं नमन करता हूँ')
      .replace(/We worship/gi, 'हम पूजा करते हैं')
      .replace(/Lord/gi, 'भगवान')
      .replace(/supreme/gi, 'परम')
      .replace(/shines/gi, 'सुशोभित है')
      .replace(/wisdom/gi, 'ज्ञान')
      .replace(/soul/gi, 'आत्मा')
      .replace(/liberation/gi, 'मुक्ति')
      .replace(/compassion/gi, 'करुणा')
    }`;
  } else {
    return `${enMeaning
      .replace(/I bow to/gi, 'ਮੈਂ ਨਮਸਕਾਰ ਕਰਦਾ ਹਾਂ')
      .replace(/We worship/gi, 'ਅਸੀਂ ਪੂਜਾ ਕਰਦੇ ਹਾਂ')
      .replace(/Lord/gi, 'ਭਗਵਾਨ')
      .replace(/supreme/gi, 'ਪਰਮ')
      .replace(/shines/gi, 'ਸੁਸ਼ੋਭਿਤ ਹੈ')
      .replace(/wisdom/gi, 'ਗਿਆਨ')
      .replace(/soul/gi, 'ਆਤਮਾ')
      .replace(/liberation/gi, 'ਮੁਕਤੀ')
      .replace(/compassion/gi, 'ਦਇਆ')
    }`;
  }
}

// ─── Improved audio player with seek + loop ───────────────────────────────────
function AudioPanel({ trackId, autoplay, accentColor, onFinished }: {
  trackId: string; autoplay: boolean; accentColor: string; onFinished?: () => void;
}) {
  const track = DEVOTIONAL_STARTER_TRACKS.find(t => t.id === trackId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying]   = useState(false);
  const [loop,    setLoop]      = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track?.audioUrl) return;
    audio.src = track.audioUrl;
    const onMeta  = () => setDuration(audio.duration || 0);
    const onTime  = () => setCurrent(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
      onFinished?.();
    };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    if (autoplay) { audio.play().then(() => setPlaying(true)).catch(() => {}); }
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [track, autoplay, onFinished]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { await audio.play(); setPlaying(true); }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrent(val);
  }

  if (!track?.audioUrl) return (
    <div className="rounded-2xl px-4 py-4 text-center text-[11px]"
      style={{ background: 'rgba(197, 160, 89,0.06)', border: '1px solid rgba(197, 160, 89,0.12)', color: 'rgba(197, 160, 89,0.5)' }}>
      Audio not available for this stotram.
    </div>
  );

  return (
    <div className="rounded-2xl px-4 py-4" style={{ background: `${accentColor}0f`, border: `1px solid ${accentColor}22` }}>
      <audio ref={audioRef} preload="metadata" />
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: accentColor }}>{track.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: `${accentColor}80` }}>{track.creator} · {track.durationLabel}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <button onClick={() => setLoop(l => !l)} title="Loop"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: loop ? `${accentColor}25` : 'transparent', border: `1px solid ${accentColor}${loop ? '50' : '20'}` }}>
            <Repeat size={12} style={{ color: loop ? accentColor : `${accentColor}55` }} />
          </button>
          <button onClick={togglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md"
            style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}cc)` }}>
            {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" className="ml-0.5" />}
          </button>
          <button onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; setCurrent(0); } }}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ border: `1px solid ${accentColor}20` }}>
            <RotateCcw size={12} style={{ color: `${accentColor}55` }} />
          </button>
        </div>
      </div>

      {/* Seek bar */}
      <div className="space-y-1">
        <input type="range" min={0} max={duration || 100} value={current} onChange={seek} step={0.5}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor }} />
        <div className="flex justify-between text-[9px]" style={{ color: `${accentColor}60` }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main stotram reader ──────────────────────────────────────────────────────
function StotramReader({ id, stotram: stotramProp, deityMeta: deityMetaProp }: {
  id: string;
  stotram: Stotram | undefined;
  deityMeta: Record<string, any> | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const autoplay = searchParams.get('autoplay') === '1';

  const stotram = stotramProp;
  const deityMeta = deityMetaProp;
  // Pass language hint to TTS so Sanskrit goes to Bhashini sa-m1 voice and
  // Hindi / Awadhi / other Devanagari languages go to Sarvam hi-IN.
  const ttsLanguageHint = stotram?.language?.toLowerCase().startsWith('sanskrit') ? 'sa' : 'hi';
  const accentColor = deityMeta?.color ?? '#C5A059';
  const amber = accentColor;
  const { t, lang: contextLang } = useLanguage();

  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [showAll,     setShowAll]     = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionSource, setCorrectionSource] = useState('');
  const [correctionVerse, setCorrectionVerse] = useState('');

  const [preferences, setPreferences] = useState<ReadablePreferences>(() =>
    resolveReadablePreferences({ appLanguage: contextLang, meaningLanguage: contextLang })
  );
  const {
    language: lang,
    setLanguage: setLang,
    labels,
    fontPresets,
    fontStep,
    setFontStep,
    fontScale,
    languages,
  } = useReaderDisplayPreferences({
    resolvedLanguage: preferences.effectiveMeaningLanguage,
    initialFontStep: 1,
  });
  useEffect(() => {
    let alive = true;

    async function loadPreferences() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !alive) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('app_language, meaning_language, transliteration_language, show_transliteration, scripture_script')
          .eq('id', user.id)
          .single();

        if (!alive || !profile) return;

        const nextPreferences = resolveReadablePreferences({
          appLanguage: (profile as any)?.app_language ?? contextLang,
          meaningLanguage: (profile as any)?.meaning_language ?? 'en',
          transliterationLanguage: (profile as any)?.transliteration_language ?? 'en',
          showTransliteration: (profile as any)?.show_transliteration ?? true,
          scriptureScript: (profile as any)?.scripture_script ?? 'original',
        });

        setPreferences(nextPreferences);
      } catch {
        // Fail open; the reader still works off context defaults.
      }
    }

    loadPreferences();
    return () => {
      alive = false;
    };
  }, [contextLang]);

  const stotramTradition = stotram?.tradition;
  const mappedTradition = stotramTradition === 'all'
    ? 'generic'
    : (stotramTradition === 'vaishnava' || stotramTradition === 'shaiva' || stotramTradition === 'shakta')
      ? 'hindu'
      : stotramTradition;

  const baseReadableContent: ReadableContent = {
    original: stotram?.verses?.[0]?.sanskrit ?? '',
    transliteration: stotram?.verses?.[0]?.transliteration,
    meaning: stotram ? getVerseMeaning(stotram.id, 0, stotram.verses?.[0]?.meaning ?? '', lang, stotram.verses?.[0]?.meaning_hi) : '',
    sourceLabel: stotram?.title,
    tradition: mappedTradition,
    language: 'sa',
    script: 'devanagari',
    pipelineTags: {
      content_type: 'stotram',
      audio_mode: 'standard',
      tradition: mappedTradition,
      script: 'devanagari',
      response_mode: 'extractive',
      delivery_intent: 'recitation',
    },
    capabilities: buildReadableCapabilities({
      original: stotram?.verses?.[0]?.sanskrit ?? '',
      transliteration: stotram?.verses?.[0]?.transliteration,
      meaning: stotram ? getVerseMeaning(stotram.id, 0, stotram.verses?.[0]?.meaning ?? '', lang, stotram.verses?.[0]?.meaning_hi) : '',
      script: 'devanagari',
      pipelineTags: {
        content_type: 'stotram',
        audio_mode: 'standard',
      },
    }),
  };
  const readerControls = useReaderControls(baseReadableContent.capabilities);
  const copied = readerControls.state.isCopied;
  const shouldShowTransliteration = preferences.showTransliteration && readerControls.state.showTransliteration;
  const shouldShowMeaning = readerControls.state.showMeaning;
  const selectedVerseIndex = activeVerse ?? 0;
  const selectedVerse = stotram?.verses?.[selectedVerseIndex] ?? null;
  const completionMarkedRef = useRef(false);

  async function markStotramDone() {
    if (!stotram || completionMarkedRef.current) return;
    completionMarkedRef.current = true;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      const today = localSpiritualDate(tz, 4);
      localStorage.setItem(`shoonaya-stotram-done-${today}`, 'true');
      void (async () => {
        try {
          // P0-3: daily_sadhana.stotram_done is no longer directly writable
          // by authenticated/anon — routed through the ownership-checked RPC.
          await supabase.rpc('complete_stotram', { p_user_id: user.id, p_date: today });
        } catch {
          // Non-fatal bonus tracking.
        }
      })();
    } catch {
      // Non-fatal bonus tracking.
    }
  }

  // ── Per-verse TTS (active when no AudioPanel track, or as supplement) ───────
  const [ttsSpeaking,   setTtsSpeaking]   = useState(false);
  const [ttsRate,       setTtsRate]       = useState<number>(1.0);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [autoPlayMode,    setAutoPlayMode]    = useState(false);
  const [autoPlayVerse,   setAutoPlayVerse]   = useState(0);   // 0-based index
  const [autoPlayLoading, setAutoPlayLoading] = useState(false);
  const autoPlayRef = useRef(false); // track cancellation

  async function speakActiveVerse() {
    if (!stotram || !selectedVerse) return;
    // Stop any in-flight audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    if (ttsSpeaking) { setTtsSpeaking(false); return; }

    setTtsSpeaking(true);
    try {
      const verseContent = buildVerseReadableContent(selectedVerse);
      const audioB64 = await readerControls.handlers.requestTTS(selectedVerse.sanskrit, {
        quality: 'pandit',
        rate: ttsRate,
        language: ttsLanguageHint,
        pipelineTags: verseContent.pipelineTags,
      });
      if (!audioB64) { setTtsSpeaking(false); return; }
      const audio = new Audio(`data:audio/mp3;base64,${audioB64}`);
      ttsAudioRef.current = audio;
      audio.onended = () => { setTtsSpeaking(false); ttsAudioRef.current = null; };
      audio.onerror = () => { setTtsSpeaking(false); ttsAudioRef.current = null; };
      await audio.play();
      trackReaderEvent('tts_requested', {
        content_type: 'stotram',
        source: `${stotram.title}#${selectedVerse.number}`,
        tradition: stotram.tradition === 'all' ? 'generic' : stotram.tradition,
        language: lang,
      });
    } catch {
      setTtsSpeaking(false);
    }
  }

  async function startAutoPlay(fromIndex = 0) {
    if (!stotram?.verses?.length) return;
    // Stop any single-verse TTS
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    setTtsSpeaking(false);

    autoPlayRef.current = true;
    setAutoPlayMode(true);
    setAutoPlayVerse(fromIndex);

    for (let i = fromIndex; i < stotram.verses.length; i++) {
      if (!autoPlayRef.current) break;
      const verse = stotram.verses[i];
      setAutoPlayVerse(i);
      setActiveVerse(i);
      setAutoPlayLoading(true);

      // Scroll the verse into view
      verseRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      try {
        const audioB64 = await readerControls.handlers.requestTTS(verse.sanskrit, {
          quality: 'pandit',
          rate: ttsRate,
          language: ttsLanguageHint,
        });
        setAutoPlayLoading(false);
        if (!audioB64 || !autoPlayRef.current) break;

        await new Promise<void>((resolve) => {
          const audio = new Audio(`data:audio/mp3;base64,${audioB64}`);
          ttsAudioRef.current = audio;
          audio.onended = () => { ttsAudioRef.current = null; resolve(); };
          audio.onerror = () => { ttsAudioRef.current = null; resolve(); };
          if (!autoPlayRef.current) { resolve(); return; }
          audio.play().catch(() => resolve());
        });
      } catch {
        setAutoPlayLoading(false);
        break;
      }

      // 1.2s pause between verses
      if (autoPlayRef.current && i < stotram.verses.length - 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    autoPlayRef.current = false;
    setAutoPlayMode(false);
    setAutoPlayLoading(false);
    ttsAudioRef.current = null;
  }

  function stopAutoPlay() {
    autoPlayRef.current = false;
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    setAutoPlayMode(false);
    setAutoPlayLoading(false);
  }

  function focusVerse(index: number) {
    stopAutoPlay();
    // Stop any active TTS when switching verse
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    setTtsSpeaking(false);
    setShowAll(false);
    setActiveVerse(index);
  }

  useEffect(() => {
    if (!stotram) return;
    trackReaderEvent('reader_opened', {
      content_type: 'stotram',
      source: stotram.title,
      tradition: mappedTradition,
      language: lang,
      has_transliteration: !!stotram.verses?.[0]?.transliteration,
      has_meaning: true,
    });
  }, [lang, stotram, mappedTradition]);

  // ── Build ReadableContent for each verse ────────────────────────────────────
  function buildVerseReadableContent(verse: any): ReadableContent {
    const verseMeaning = getVerseMeaning(stotram!.id, verse.number - 1, verse.meaning, lang, verse.meaning_hi);
    const tradition = mappedTradition;
    return {
      original: verse.sanskrit,
      meaning: verseMeaning,
      sourceLabel: `${stotram!.title} - Verse ${verse.number}`,
      tradition,
      language: 'sa',
      script: 'devanagari',
      pipelineTags: {
        content_type: 'sacred_verse',
        audio_mode: 'standard',
        tradition,
        script: 'devanagari',
        response_mode: 'extractive',
        delivery_intent: 'live_user'
      },
      capabilities: buildReadableCapabilities({
        original: verse.sanskrit,
        meaning: verseMeaning,
        script: 'devanagari',
        pipelineTags: {
          content_type: 'sacred_verse',
          audio_mode: 'standard',
        }
      })
    };
  }

  // ── Tokens ──────────────────────────────────────────────────────────────────
  const pageBg  = isDark ? `linear-gradient(180deg,#0e0a06 0%,#160f08 100%)` : `linear-gradient(180deg,#fdf6ee 0%,#f5e8d5 100%)`;
  const cardBg  = isDark ? 'rgba(22,14,8,0.95)' : 'rgba(255,246,232,0.98)';
  const cardBdr = `${accentColor}22`;
  const textH   = isDark ? '#f5dfa0' : '#2a1002';
  const textS   = isDark ? 'rgba(245,210,130,0.48)' : 'rgba(100,55,10,0.52)';
  const textD   = isDark ? 'rgba(245,210,130,0.30)' : 'rgba(100,55,10,0.35)';

  function fallbackCopy(text: string, successMessage: string) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        toast.success(successMessage, {
          icon: '📋',
          style: { background: '#2e1710', color: '#f5dfa0' }
        });
      } else {
        throw new Error('Copy command unsuccessful');
      }
    } catch (err) {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  function copyFullStotram() {
    const versesText = stotram!.verses.map(v => 
      `Verse ${v.number}\n${v.sanskrit}\n${v.transliteration}\nMeaning: ${getVerseMeaning(stotram!.id, v.number - 1, v.meaning, lang, v.meaning_hi)}`
    ).join('\n\n');
    const textToCopy = `${stotram!.title} (${stotram!.titleDevanagari})\n${stotram!.description}\n\n${versesText}`;
    readerControls.handlers.copyText(textToCopy, 'Stotram');
    trackReaderEvent('content_copied', {
      content_type: 'stotram',
      source: stotram!.title,
      tradition: stotram!.tradition === 'all' ? 'generic' : stotram!.tradition,
      language: lang,
    });
  }

  function copyVerse(v: any) {
    const textToCopy = `Verse ${v.number}\n${v.sanskrit}\n${v.transliteration}\nMeaning: ${getVerseMeaning(stotram!.id, v.number - 1, v.meaning, lang, v.meaning_hi)}`;
    readerControls.handlers.copyText(textToCopy, `Verse ${v.number}`);
    trackReaderEvent('content_copied', {
      content_type: 'stotram',
      source: `${stotram!.title}#${v.number}`,
      tradition: stotram!.tradition === 'all' ? 'generic' : stotram!.tradition,
      language: lang,
    });
  }

  function copyShareText(text: string, successMsg: string) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast.success(successMsg, {
            icon: '🔗',
            style: { background: '#2e1710', color: '#f5dfa0' }
          });
        })
        .catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  async function shareStotram() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `🙏 Radhe Radhe! Check out this divine Stotram on Shoonaya: '${stotram!.title}' (${stotram!.titleDevanagari}). Chanted in devotion. Read here: ${shareUrl} to elevate your Sadhana.`;
    await readerControls.handlers.share(shareText, `Shoonaya - ${stotram!.title}`, shareUrl);
    trackReaderEvent('content_shared', {
      content_type: 'stotram',
      source: stotram!.title,
      tradition: stotram!.tradition === 'all' ? 'generic' : stotram!.tradition,
      language: lang,
    });
  }

  async function shareVerse(v: any) {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `🙏 Radhe Radhe! Check out Verse ${v.number} of '${stotram!.title}' on Shoonaya:\n\n"${v.sanskrit}"\n\nRead full: ${shareUrl}`;
    await readerControls.handlers.share(shareText, `Shoonaya - ${stotram!.title} Verse ${v.number}`, shareUrl);
    trackReaderEvent('content_shared', {
      content_type: 'stotram',
      source: `${stotram!.title}#${v.number}`,
      tradition: stotram!.tradition === 'all' ? 'generic' : stotram!.tradition,
      language: lang,
    });
  }

  if (!stotram) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-4xl">🙏</p>
      <p style={{ color: textS }}>Stotram not found</p>
      <button onClick={() => { 
        if (window.history.length > 2) {
          router.back();
        } else {
          router.push('/bhakti');
        }
      }} className="text-sm font-semibold" style={{ color: accentColor }}>{t('back')}</button>
    </div>
  );

  return (
    <ReaderShell
      title={stotram.title}
      subtitle={stotram.deity !== 'universal' ? deityMeta?.label : 'Universal'}
      fallbackBackUrl="/bhakti"
      themeColor={accentColor}
      ambientGlowColor={`${accentColor}12`}
      fontPresets={fontPresets}
      fontStep={fontStep}
      setFontStep={setFontStep}
      languages={languages}
      currentLanguage={lang}
      setLanguage={(l) => {
        setLang(l);
        trackReaderEvent('language_toggled', {
          content_type: 'stotram',
          source: stotram?.title ?? '',
          tradition: stotram?.tradition === 'all' ? 'generic' : stotram?.tradition ?? 'generic',
          language: l,
        });
      }}
      showTransliterationToggle={baseReadableContent.capabilities.canToggleTransliteration}
      isTransliterationOn={shouldShowTransliteration}
      onToggleTransliteration={() => {
        readerControls.handlers.toggleTransliteration();
        trackReaderEvent('transliteration_toggled', {
          content_type: 'stotram',
          source: stotram.title,
          tradition: stotram.tradition === 'all' ? 'generic' : stotram.tradition,
          language: lang,
          has_transliteration: true,
        });
      }}
      showMeaningToggle={baseReadableContent.capabilities.canShowMeaning}
      isMeaningOn={shouldShowMeaning}
      onToggleMeaning={() => {
        readerControls.handlers.toggleMeaning();
        trackReaderEvent('language_toggled', {
          content_type: 'stotram',
          source: stotram.title,
          tradition: stotram.tradition === 'all' ? 'generic' : stotram.tradition,
          language: lang,
          has_meaning: true,
        });
      }}
      onTTS={speakActiveVerse}
      isSpeaking={ttsSpeaking}
      isTTSGenerating={readerControls.state.isGeneratingTTS}
      ttsRate={ttsRate}
      onTTSRateChange={setTtsRate}
      onCopy={copyFullStotram}
      isCopied={copied}
      onShare={shareStotram}
      bottomBar={
        <div className="px-4 py-3 max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => focusVerse(Math.max(0, selectedVerseIndex - 1))}
            disabled={showAll || selectedVerseIndex === 0}
            className="h-12 min-w-12 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-sm font-medium transition-all disabled:opacity-35"
            style={{ background: cardBg, color: textS, border: `1px solid ${cardBdr}` }}
            aria-label="Previous verse"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {selectedVerse ? (
              <>
                <button
                  onClick={() => copyVerse(selectedVerse)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                  style={{ background: cardBg, border: `1px solid ${cardBdr}` }}
                  aria-label={`Copy verse ${selectedVerse.number}`}
                >
                  <Copy size={14} style={{ color: accentColor }} />
                </button>
                <button
                  onClick={() => shareVerse(selectedVerse)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                  style={{ background: cardBg, border: `1px solid ${cardBdr}` }}
                  aria-label={`Share verse ${selectedVerse.number}`}
                >
                  <Share2 size={14} style={{ color: accentColor }} />
                </button>
              </>
            ) : null}
          </div>
          <button
            onClick={() => autoPlayMode ? stopAutoPlay() : startAutoPlay(0)}
            disabled={autoPlayLoading && !autoPlayMode}
            aria-label={autoPlayMode ? 'Stop auto-play' : 'Play all verses'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: autoPlayMode ? `${amber}22` : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${amber}40`,
              color: amber,
              fontSize: 13, fontWeight: 500,
              cursor: (autoPlayLoading && !autoPlayMode) ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {autoPlayMode
              ? <><Square size={13} fill={amber} /> Stop</>
              : autoPlayLoading
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                : <><Play size={13} /> Play All</>}
          </button>
          <button
            onClick={() => {
              if (stotram.verses.length === 1 && selectedVerse) {
                shareVerse(selectedVerse);
                return;
              }
              if (showAll) {
                void markStotramDone();
                setShowAll(false);
                setActiveVerse(0);
                return;
              }
              if (activeVerse === null) {
                focusVerse(0);
                return;
              }
              if (selectedVerseIndex < stotram.verses.length - 1) {
                focusVerse(selectedVerseIndex + 1);
                return;
              }
              void markStotramDone();
              setShowAll(true);
            }}
            className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all"
            style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}33`, color: accentColor }}
          >
            {stotram.verses.length === 1
              ? t('shareVerse')
              : showAll
              ? t('done')
              : activeVerse === null
                ? t('openVerse')
                : selectedVerseIndex < stotram.verses.length - 1
                  ? <><span>{t('nextVerse')}</span><ChevronRight size={16} /></>
                  : t('exploreFullHymn')}
          </button>
        </div>
      }
      contentClassName="px-4 space-y-4 mt-6 pb-28"
    >

      <div className="px-4 space-y-4 mt-6">

        {/* Info card */}
        <div className="rounded-[1.8rem] p-5" style={{ background: cardBg, border: `1px solid ${cardBdr}` }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{stotram.deityEmoji || deityMeta?.emoji || '🕉️'}</span>
            <div>
              <h2 className="font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-serif)', color: textH }}>
                {stotram.title}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: accentColor }}>{stotram.titleDevanagari}</p>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: textS }}>{stotram.description}</p>
          <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${accentColor}15` }}>
            <div><p className="text-[9px] uppercase tracking-wide" style={{ color: textD }}>{t('yourLanguage')}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: textS }}>{stotram.language}</p></div>
            <div><p className="text-[9px] uppercase tracking-wide" style={{ color: textD }}>{t('mantra')}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: textS }}>{stotram.verses.length}</p></div>
            <div className="flex-1"><p className="text-[9px] uppercase tracking-wide" style={{ color: textD }}>{t('lineage')}</p>
              <p className="text-[11px] font-semibold mt-0.5 leading-tight" style={{ color: textS }}>{stotram.source}</p></div>
          </div>
        </div>

        {/* Audio player */}
        {stotram.audioTrackId && (
          <AudioPanel trackId={stotram.audioTrackId} autoplay={autoplay} accentColor={accentColor} onFinished={markStotramDone} />
        )}

        {/* Verses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: textD }}>{t('mantra')}</p>
            {stotram.verses.length > 1 && (
              <button onClick={() => setShowAll(v => !v)} className="text-[11px] font-semibold" style={{ color: accentColor }}>
                {showAll ? t('done') : t('explore')}
              </button>
            )}
          </div>

          {stotram.verses.map((verse, i) => {
            const isActive = activeVerse === i || stotram.verses.length === 1;
            return (
              <motion.div key={verse.number}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}>
                <div 
                  ref={(el) => { verseRefs.current[i] = el; }}
                  className="rounded-[1.5rem] overflow-hidden"
                  style={{ 
                    background: cardBg, 
                    border: `1px solid ${isActive ? accentColor + '35' : cardBdr}`,
                    borderLeft: autoPlayMode && i === autoPlayVerse
                      ? `3px solid ${amber}`
                      : '3px solid transparent',
                    transition: 'border-color 0.3s ease',
                  }}>
                  {/* Verse header */}
                  <button
                    onClick={() => {
                      if (autoPlayMode) stopAutoPlay();
                      setActiveVerse(isActive ? null : i);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    disabled={stotram.verses.length === 1}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: isActive ? accentColor : `${accentColor}18`, color: isActive ? '#fff' : accentColor }}>
                      {verse.number}
                    </div>
                    <p className="flex-1 text-sm font-medium leading-tight line-clamp-1 text-left" style={{ color: textH }}>
                      {verse.sanskrit.split('\n')[0]}…
                    </p>
                    {stotram.verses.length > 1 && (
                      <span className="text-xs" style={{ color: textD }}>{isActive ? '▲' : '▼'}</span>
                    )}
                  </button>

                  <AnimatePresence>
                    {(isActive || showAll) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${accentColor}12` }}>
                          {/* Sanskrit */}
                          <div className="pt-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>{t('shloka')}</p>
                            <span className={`block font-medium ${preferences.scriptureScript === 'gurmukhi' ? 'punjabi-serif' : 'premium-serif'} leading-relaxed`}
                                style={{ 
                                  color: isDark ? 'rgba(255, 246, 232, 0.95)' : 'rgba(42, 16, 2, 0.9)',
                                  fontSize: `${fontScale * 1.1}rem` 
                                }}
                              >
                                {verse.sanskrit}
                              </span>
                          </div>
                          {/* Transliteration */}
                          {shouldShowTransliteration ? (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>{t('transliteration')}</p>
                            <p className="leading-relaxed italic whitespace-pre-line text-center transition-all duration-300"
                                  style={{ 
                                    color: isDark ? 'rgba(255, 246, 232, 0.55)' : 'rgba(42, 16, 2, 0.5)',
                                    fontSize: `${fontScale * 0.9}rem` 
                                  }}
                                >
                                  {verse.transliteration}
                                </p>
                          </div>
                          ) : null}
                          {/* Meaning */}
                          {shouldShowMeaning ? (
                          <div className="rounded-xl px-4 py-3" style={{ background: `${accentColor}08` }}>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>{t('wisdom')}</p>
                              <p className="leading-relaxed transition-all duration-300" 
                                style={{ 
                                  color: textS,
                                  fontSize: `${fontScale * 0.8}rem`
                                }}>
                              {getVerseMeaning(stotram.id, verse.number - 1, verse.meaning, lang, verse.meaning_hi)}
                            </p>
                          </div>
                          ) : null}

                          {/* Verse Action panel */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--divine-border)]/5">
                            <button
                              onClick={() => {
                                setCorrectionSource(`${stotram.title} - Verse ${verse.number}`);
                                setCorrectionVerse(verse.sanskrit);
                                setCorrectionModalOpen(true);
                              }}
                              className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-95"
                              title="Report translation issue"
                              aria-label={`Report issue for verse ${verse.number}`}
                            >
                              <span className="text-xs">🚩</span>
                            </button>
                            <button onClick={() => copyVerse(verse)} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-95" title="Copy Verse" aria-label={`Copy verse ${verse.number}`}>
                              <Copy size={11} style={{ color: accentColor }} />
                            </button>
                            <button onClick={() => shareVerse(verse)} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-95" title={t('shareVerse')} aria-label={`Share verse ${verse.number}`}>
                              <Share2 size={11} style={{ color: accentColor }} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Attribution */}
        <p className="text-center text-[10px] pb-4" style={{ color: textD }}>
          {stotram.source}
        </p>
      </div>

      {autoPlayMode && stotram && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
            left: '50%', transform: 'translateX(-50%)',
            width: 'min(420px, calc(100vw - 32px))',
            zIndex: 50,
            background: isDark ? 'rgba(18,14,10,0.92)' : 'rgba(255,253,248,0.95)',
            border: `1px solid ${amber}30`,
            borderRadius: 16,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: `0 4px 24px rgba(0,0,0,0.18), 0 0 0 1px ${amber}18`,
          }}
        >
          {/* Track info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', marginBottom: 1 }}>
              {stotram.title}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {autoPlayLoading && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', color: amber }} />}
              Verse {autoPlayVerse + 1}
              <span style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontWeight: 400 }}>
                of {stotram.verses.length}
              </span>
            </div>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
              {stotram.verses.map((_, i) => (
                <div
                  key={i}
                  onClick={() => { stopAutoPlay(); setTimeout(() => startAutoPlay(i), 100); }}
                  style={{
                    width: i === autoPlayVerse ? 16 : 5,
                    height: 5, borderRadius: 3,
                    background: i < autoPlayVerse
                      ? amber
                      : i === autoPlayVerse
                        ? amber
                        : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Previous verse */}
            <button
              onClick={() => { stopAutoPlay(); setTimeout(() => startAutoPlay(Math.max(0, autoPlayVerse - 1)), 100); }}
              disabled={autoPlayVerse === 0}
              style={{ background: 'none', border: 'none', padding: 6, cursor: autoPlayVerse === 0 ? 'not-allowed' : 'pointer',
                color: autoPlayVerse === 0 ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : amber }}
              aria-label="Previous verse"
            >
              <SkipBack size={16} />
            </button>

            {/* Pause/Resume — pause current audio, keep state */}
            <button
              onClick={() => {
                if (ttsAudioRef.current?.paused === false) {
                  ttsAudioRef.current.pause();
                } else if (ttsAudioRef.current?.paused) {
                  ttsAudioRef.current.play();
                }
              }}
              style={{ background: `${amber}18`, border: `1px solid ${amber}40`, borderRadius: 20,
                padding: '6px 12px', cursor: 'pointer', color: amber, display: 'flex', alignItems: 'center', gap: 4 }}
              aria-label="Pause"
            >
              <Pause size={14} />
            </button>

            {/* Stop */}
            <button
              onClick={stopAutoPlay}
              style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}
              aria-label="Stop"
            >
              <Square size={15} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
      <ScriptureCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        scriptureSource={correctionSource}
        verseText={correctionVerse}
      />
    </ReaderShell>
  );
}


export default function StotramPage({
  params,
  stotram,
  deityMeta,
}: {
  params: Promise<{ id: string }>;
  stotram: Stotram | undefined;
  deityMeta: Record<string, any> | null;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-3xl">🙏</span></div>}>
      <StotramReader id={id} stotram={stotram} deityMeta={deityMeta} />
    </Suspense>
  );
}
