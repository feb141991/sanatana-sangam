'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, RotateCcw, Repeat, Copy, Check, Share2 } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { getStotramById, DEITY_META } from '@/lib/stotrams';
import { DEVOTIONAL_STARTER_TRACKS } from '@/lib/devotional-audio';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Suspense, use } from 'react';
import toast from 'react-hot-toast';

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

function getVerseMeaning(stotramId: string, verseIdx: number, enMeaning: string, targetLang: 'en' | 'hi' | 'pa'): string {
  if (targetLang === 'en') return enMeaning;
  
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
function AudioPanel({ trackId, autoplay, accentColor }: {
  trackId: string; autoplay: boolean; accentColor: string;
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
    const onEnded = () => { setPlaying(false); setCurrent(0); };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    if (autoplay) { audio.play().then(() => setPlaying(true)).catch(() => {}); }
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [track, autoplay]);

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
      style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.12)', color: 'rgba(200,146,74,0.5)' }}>
      🎵 Audio coming soon — uploading to Supabase
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
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
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
function StotramReader({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const autoplay = searchParams.get('autoplay') === '1';

  const stotram = getStotramById(id);
  const deityMeta = stotram ? (DEITY_META[stotram.deity] ?? DEITY_META.universal) : null;
  const accentColor = deityMeta?.color ?? '#C8924A';
  const { t } = useLanguage();

  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [showAll,     setShowAll]     = useState(false);
  
  type StotramFontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  const STOTRAM_SIZES: StotramFontSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const [sizeIndex, setSizeIndex] = useState(2); // Default to 'md' (index 2)
  const fontSize = STOTRAM_SIZES[sizeIndex];

  const SHLOKA_FONT_SIZES: Record<StotramFontSize, string> = {
    xs: '0.85rem', sm: '0.95rem', md: '1.1rem', lg: '1.3rem', xl: '1.5rem', xxl: '1.8rem'
  };
  const TRANSLIT_FONT_SIZES: Record<StotramFontSize, string> = {
    xs: '0.7rem', sm: '0.8rem', md: '0.9rem', lg: '1.05rem', xl: '1.2rem', xxl: '1.4rem'
  };
  const MEANING_FONT_SIZES: Record<StotramFontSize, string> = {
    xs: '0.65rem', sm: '0.72rem', md: '0.8rem', lg: '0.92rem', xl: '1.05rem', xxl: '1.2rem'
  };

  const [lang,        setLang]        = useState<'en' | 'hi' | 'pa'>('en');
  const [copied,      setCopied]      = useState(false);

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
        setCopied(true);
        toast.success(successMessage, {
          icon: '📋',
          style: { background: '#2e1710', color: '#f5dfa0' }
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Copy command unsuccessful');
      }
    } catch (err) {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  function copyFullStotram() {
    const versesText = stotram!.verses.map(v => 
      `Verse ${v.number}\n${v.sanskrit}\n${v.transliteration}\nMeaning: ${getVerseMeaning(stotram!.id, v.number - 1, v.meaning, lang)}`
    ).join('\n\n');
    const textToCopy = `${stotram!.title} (${stotram!.titleDevanagari})\n${stotram!.description}\n\n${versesText}`;
    const successMsg = 'Stotram copied to clipboard! 🙏';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          toast.success(successMsg, {
            icon: '📋',
            style: { background: '#2e1710', color: '#f5dfa0' }
          });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(textToCopy, successMsg));
    } else {
      fallbackCopy(textToCopy, successMsg);
    }
  }

  function copyVerse(v: any) {
    const textToCopy = `Verse ${v.number}\n${v.sanskrit}\n${v.transliteration}\nMeaning: ${getVerseMeaning(stotram!.id, v.number - 1, v.meaning, lang)}`;
    const successMsg = `Verse ${v.number} copied! 🙏`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          toast.success(successMsg, {
            icon: '📋',
            style: { background: '#2e1710', color: '#f5dfa0' }
          });
        })
        .catch(() => fallbackCopy(textToCopy, successMsg));
    } else {
      fallbackCopy(textToCopy, successMsg);
    }
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
    const successMsg = 'Stotram share link copied! Send it via WhatsApp or Messages. 🙏';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Shoonaya - ${stotram!.title}`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyShareText(shareText, successMsg);
        }
      }
    } else {
      copyShareText(shareText, successMsg);
    }
  }

  async function shareVerse(v: any) {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `🙏 Radhe Radhe! Check out Verse ${v.number} of '${stotram!.title}' on Shoonaya:\n\n"${v.sanskrit}"\n\nRead full: ${shareUrl}`;
    const successMsg = `Verse ${v.number} share link copied! 🙏`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Shoonaya - ${stotram!.title} Verse ${v.number}`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyShareText(shareText, successMsg);
        }
      }
    } else {
      copyShareText(shareText, successMsg);
    }
  }

  if (!stotram) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-4xl">🙏</p>
      <p style={{ color: textS }}>Stotram not found</p>
      <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: accentColor }}>{t('back')}</button>
    </div>
  );

  return (
    <div className="min-h-screen pb-28 font-outfit" style={{ background: pageBg }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentColor}12, transparent 70%)` }} />

      <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />

      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pb-4 pt-12 backdrop-blur-xl border-b border-[var(--divine-border)]/10 flex flex-col gap-3"
        style={{ background: isDark ? 'rgba(14,10,6,0.85)' : 'rgba(253,246,238,0.85)' }}>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-90"
            style={{ border: `1px solid ${accentColor}25` }}>
            <ChevronLeft size={18} style={{ color: accentColor }} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${accentColor}70` }}>
              {deityMeta?.emoji} {stotram.deity !== 'universal' ? deityMeta?.label : 'Universal'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyFullStotram}
              className="w-9 h-9 rounded-full border border-[var(--divine-border)]/10 flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-90"
              title="Copy Full Stotram"
            >
              {copied ? <Check size={14} color="#2D9E4A" /> : <Copy size={14} color={accentColor} />}
            </button>
            <button
              onClick={shareStotram}
              className="w-9 h-9 rounded-full border border-[var(--divine-border)]/10 flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-90"
              title="Share Stotram"
            >
              <Share2 size={14} color={accentColor} />
            </button>
          </div>
        </div>

        {/* ── Dynamic Controls Bar (Zoom & Language toggles) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--divine-border)]/5">
          {/* Zoom Control */}
          <div className="flex items-center gap-1.5 bg-[var(--surface-base)]/10 px-2 py-1 rounded-full border border-[var(--divine-border)]/5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1 text-[var(--text-dim)]">Zoom:</span>
            <button
              onClick={() => setSizeIndex(i => Math.max(0, i - 1))}
              disabled={sizeIndex === 0}
              className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all bg-[var(--surface-base)]/20 text-[var(--text-main)] hover:bg-[var(--surface-base)]/40 disabled:opacity-30"
              style={{ border: `1px solid ${accentColor}18` }}
            >
              A-
            </button>
            <span className="text-xs font-bold px-1 min-w-[1.8rem] text-center" style={{ color: accentColor }}>
              {sizeIndex + 1}
            </span>
            <button
              onClick={() => setSizeIndex(i => Math.min(STOTRAM_SIZES.length - 1, i + 1))}
              disabled={sizeIndex === STOTRAM_SIZES.length - 1}
              className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all bg-[var(--surface-base)]/20 text-[var(--text-main)] hover:bg-[var(--surface-base)]/40 disabled:opacity-30"
              style={{ border: `1px solid ${accentColor}18` }}
            >
              A+
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-[var(--surface-base)]/10 px-2 py-0.5 rounded-full border border-[var(--divine-border)]/5">
            <span className="text-[9px] uppercase font-bold tracking-wider px-1 text-[var(--text-dim)]">Lang:</span>
            {(['en', 'hi', 'pa'] as const).map(ln => (
              <button
                key={ln}
                onClick={() => setLang(ln)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                  lang === ln
                    ? 'text-black shadow-sm'
                    : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
                }`}
                style={{ backgroundColor: lang === ln ? accentColor : 'transparent' }}
              >
                {ln === 'en' ? 'EN' : ln === 'hi' ? 'हिं' : 'ਪੰ'}
              </button>
            ))}
          </div>
        </div>
      </div>

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
          <AudioPanel trackId={stotram.audioTrackId} autoplay={autoplay} accentColor={accentColor} />
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
                <div className="rounded-[1.5rem] overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${isActive ? accentColor + '35' : cardBdr}` }}>
                  {/* Verse header */}
                  <button
                    onClick={() => setActiveVerse(isActive ? null : i)}
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
                            <p className="leading-loose whitespace-pre-line text-center transition-all duration-300"
                              style={{ 
                                fontFamily: 'var(--font-deva,serif)', 
                                color: isDark ? 'rgba(245,220,150,0.85)' : 'rgba(60,30,5,0.85)',
                                fontSize: SHLOKA_FONT_SIZES[fontSize]
                              }}>
                              {verse.sanskrit}
                            </p>
                          </div>
                          {/* Transliteration */}
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>{t('transliteration')}</p>
                            <p className="leading-relaxed italic whitespace-pre-line text-center transition-all duration-300"
                              style={{ 
                                color: isDark ? 'rgba(245,210,130,0.55)' : 'rgba(80,40,8,0.60)',
                                fontSize: TRANSLIT_FONT_SIZES[fontSize]
                              }}>
                              {verse.transliteration}
                            </p>
                          </div>
                          {/* Meaning */}
                          <div className="rounded-xl px-4 py-3" style={{ background: `${accentColor}08` }}>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: `${accentColor}55` }}>{t('wisdom')}</p>
                            <p className="leading-relaxed transition-all duration-300" 
                              style={{ 
                                color: textS,
                                fontSize: MEANING_FONT_SIZES[fontSize]
                              }}>
                              {getVerseMeaning(stotram.id, verse.number - 1, verse.meaning, lang)}
                            </p>
                          </div>

                          {/* Verse Action panel */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--divine-border)]/5">
                            <button onClick={() => copyVerse(verse)} className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-95" title="Copy Verse">
                              <Copy size={11} style={{ color: accentColor }} />
                            </button>
                            <button onClick={() => shareVerse(verse)} className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-base)]/20 transition-all hover:bg-[var(--surface-base)]/40 active:scale-95" title="Share Verse">
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
    </div>
  );
}

export default function StotramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-3xl">🙏</span></div>}>
      <StotramReader id={id} />
    </Suspense>
  );
}
