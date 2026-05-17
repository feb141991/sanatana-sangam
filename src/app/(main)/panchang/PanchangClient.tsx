'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2 } from 'lucide-react';
import { useSacredCalendar, type SacredCalendarData } from '@/hooks/useSacredCalendar';
import { calculatePanchang } from '@/lib/panchang';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';

// Import our premium Jyotish engines
import { getDailyHoroscope, RASHI_LIST } from '@/lib/jyotish/rashiphal-data';
import { generateKundali, renderKundaliSVG, type KundaliInput, type KundaliResult } from '@/lib/jyotish/kundali-engine';

interface Props {
  lat:       number;
  lon:       number;
  city:      string;
  tradition?: string;
}

// ─── Tradition metadata ───────────────────────────────────────────────────────
const TRADITION_META: Record<string, { badge: string; note: string; accent: string; accentLight: string }> = {
  hindu:    { badge: '🕉️ Vedic',     note: 'Vikram Samvat',         accent: '#B8541B', accentLight: 'rgba(184,84,27,0.15)' },
  sikh:     { badge: '☬ Nanakshahi', note: 'Nanakshahi Calendar',   accent: '#1a4d7b', accentLight: 'rgba(26,77,123,0.15)' },
  buddhist: { badge: '☸️ Buddhist',   note: 'Buddhist Lunar',        accent: '#5c6b1a', accentLight: 'rgba(92,107,26,0.15)' },
  jain:     { badge: '🤲 Jain',       note: 'Vira Samvat',           accent: '#7b5a1a', accentLight: 'rgba(123,90,26,0.15)' },
};

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Time-of-day phase from sunrise/sunset strings ────────────────────────────
type SkyPhase = 'night' | 'predawn' | 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening';

function parseSunTime(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [h, m]         = time.split(':').map(Number);
  let hours = h;
  if (period === 'PM' && h !== 12) hours += 12;
  if (period === 'AM' && h === 12) hours = 0;
  return hours * 60 + m;
}

function getSkyPhase(nowMin: number, sunriseMin: number, sunsetMin: number): SkyPhase {
  if (nowMin < sunriseMin - 60)          return 'night';
  if (nowMin < sunriseMin - 15)          return 'predawn';
  if (nowMin < sunriseMin + 45)          return 'dawn';
  if (nowMin < (sunriseMin + sunsetMin) / 2) return 'morning';
  if (nowMin < sunsetMin - 45)           return 'afternoon';
  if (nowMin < sunsetMin + 45)           return 'dusk';
  if (nowMin < sunsetMin + 120)          return 'evening';
  return 'night';
}

const SKY_GRADIENTS: Record<SkyPhase, string> = {
  night:     'linear-gradient(180deg, #050508 0%, #0a0a1a 40%, #080812 100%)',
  predawn:   'linear-gradient(180deg, #080812 0%, #0f0a20 50%, #1a0830 100%)',
  dawn:      'linear-gradient(180deg, #1a0a28 0%, #5c1f3a 35%, #c45c2a 70%, #e8a060 100%)',
  morning:   'linear-gradient(180deg, #1e4a8a 0%, #3a7ab8 35%, #d4885a 70%, #f0b870 100%)',
  afternoon: 'linear-gradient(180deg, #1a3a6e 0%, #2d5a9e 40%, #4a7ac0 100%)',
  dusk:      'linear-gradient(180deg, #1a1030 0%, #5c1a1a 30%, #c44820 60%, #e87040 100%)',
  evening:   'linear-gradient(180deg, #080512 0%, #1a0828 40%, #2a0a1a 100%)',
};

const SKY_ORB: Record<SkyPhase, { color: string; size: string; opacity: number }> = {
  night:     { color: 'rgba(200,220,255,0.35)', size: '5rem',  opacity: 0.9 },
  predawn:   { color: 'rgba(180,160,220,0.25)', size: '4rem',  opacity: 0.6 },
  dawn:      { color: 'rgba(255,180,80,0.45)',  size: '6rem',  opacity: 0.8 },
  morning:   { color: 'rgba(255,220,100,0.5)',  size: '8rem',  opacity: 0.9 },
  afternoon: { color: 'rgba(255,240,150,0.4)',  size: '10rem', opacity: 0.7 },
  dusk:      { color: 'rgba(255,120,50,0.5)',   size: '9rem',  opacity: 0.85 },
  evening:   { color: 'rgba(220,100,60,0.3)',   size: '6rem',  opacity: 0.5 },
};

const PHASE_LABELS: Record<SkyPhase, string> = {
  night: 'Night', predawn: 'Pre-dawn', dawn: 'Dawn',
  morning: 'Morning', afternoon: 'Afternoon', dusk: 'Dusk', evening: 'Evening',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border backdrop-blur-md ${className}`}
      style={{ background: 'rgba(10,8,25,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}>
      {children}
    </div>
  );
}

// ─── One-liner info for each panchang element ─────────────────────────────────
const INFO_TEXT: Record<string, string> = {
  Tithi:             'Lunar day (1–30). Each tithi has a presiding deity and governs which activities are auspicious.',
  Nakshatra:         "Moon's mansion in 1 of 27 star-clusters. Your moon nakshatra shapes emotion, instinct, and timing.",
  Yoga:              'Sun + Moon combined longitude across 27 yogas. Indicates the overall quality and nature of the day.',
  Karana:            'Half of a tithi — the moon moves 6° per karana. There are 11 karanas, 7 movable and 4 fixed. Governs the finer timing within each tithi for rituals and acts.',
  Vara:              'Vedic day of the week. Each day has a ruling planet and presiding deity who blesses related acts.',
  Sunrise:           'Calculated for your location. Brahma Muhurta starts 96 minutes before sunrise — the ideal waking time.',
  Sunset:            'Sandhya kaal — ideal for evening prayers, japa, and quiet reflection as day meets night.',
  'Brahma Muhurta':  'The sacred pre-dawn window — 96 to 48 minutes before sunrise. The mind is clearest, subtle energies are elevated, and the shastras call this the best time for meditation, japa, and pranayama.',
  'Rahu Kaal':       'A 90-min daily window ruled by Rahu (shadow planet). Avoid starting new ventures or auspicious acts.',
  'Abhijit Muhurat': 'The most auspicious ~48-min window around solar noon. Ideal for important new beginnings.',
};

// ─── Inline tooltip ────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setShow((s) => !s); }}
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition hover:opacity-80"
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.55)',
        }}
        aria-label="More info"
      >
        i
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-7 right-0 z-50 w-56 rounded-xl px-3 py-2.5 text-left"
            style={{
              background: 'rgba(8,6,22,0.97)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-[11px] leading-relaxed text-white/75">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Panchang row ─────────────────────────────────────────────────────────────
function Row({ emoji, label, value, upto, accent, warn = false, infoKey }: {
  emoji: string; label: string; value: string; upto?: string; accent: string; warn?: boolean; infoKey?: string;
}) {
  const infoText = infoKey ? INFO_TEXT[infoKey] : undefined;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: warn ? 'rgba(200,80,20,0.18)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${warn ? 'rgba(200,80,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <span className="text-lg w-6 text-center flex-shrink-0 leading-none">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`font-semibold text-sm mt-0.5 ${warn ? 'text-orange-300' : 'text-white/90'}`}>{value}</p>
          {upto && (
            <p className="text-[10px] text-white/40 mt-0.5">upto {upto}</p>
          )}
        </div>
      </div>
      {infoText && (
        <div className="relative flex-shrink-0">
          <InfoTooltip text={infoText} />
        </div>
      )}
    </div>
  );
}

// ─── Stars background ─────────────────────────────────────────────────────────
function Stars({ count = 28 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width:  `${1 + (i % 3) * 0.5}px`,
            height: `${1 + (i % 3) * 0.5}px`,
            left:   `${(i * 37 + 7) % 97}%`,
            top:    `${(i * 23 + 5) % 55}%`,
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PanchangClient({ lat, lon, city, tradition = 'hindu' }: Props) {
  const { t } = useLanguage();
  const { playHaptic } = useZenithSensory();
  const tradMeta = TRADITION_META[tradition] ?? TRADITION_META.hindu;
  const today    = useMemo(() => new Date(), []);
  const [selected,   setSelected]  = useState<Date>(today);
  const [viewYear,   setViewYear]  = useState(today.getFullYear());
  const [viewMonth,  setViewMonth] = useState(today.getMonth());

  // Unified Page Tabs
  const [activeTab, setActiveTab] = useState<'panchang' | 'rashiphal' | 'kundali'>('panchang');

  // Rashiphal Tab State
  const [selectedRashi, setSelectedRashi] = useState<string>('aries');

  // Kundali Tab State
  const [kundaliInput, setKundaliInput] = useState<KundaliInput>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: city || '',
    lat: lat || 28.6139,
    lng: lon || 77.2090,
    timezone: 'Asia/Kolkata',
  });
  const [kundaliResult,  setKundaliResult]  = useState<KundaliResult | null>(null);
  const [kundaliLoading, setKundaliLoading] = useState(false);
  const [kundaliError,   setKundaliError]   = useState<string | null>(null);
  const [chartSaved,     setChartSaved]     = useState(false);

  const p: SacredCalendarData = useSacredCalendar(selected, lat, lon, tradition);

  // ── Web Audio Graha Beeja Resonance Synthesizer ─────────────────────────────
  const [isPlayingResonance, setIsPlayingResonance] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startResonance = (freq: number) => {
    try {
      stopResonance();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.7);
      gainRef.current = mainGain;

      // Fundamental pure tone (Sine)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      osc1Ref.current = osc1;

      // Cozy harmonic secondary (Triangle)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime);
      osc2Ref.current = osc2;

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.08, ctx.currentTime);

      // Lowpass filtering to make the sound soft and temple-like
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      setIsPlayingResonance(true);
      playHaptic('heavy');
    } catch (e) {
      console.error("Audio Context Failed", e);
    }
  };

  const stopResonance = () => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        gainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        
        const o1 = osc1Ref.current;
        const o2 = osc2Ref.current;
        const g = gainRef.current;
        const c = audioCtxRef.current;
        
        setTimeout(() => {
          try {
            o1?.stop();
            o2?.stop();
            c?.close();
          } catch {}
        }, 500);
      }
    } catch {}
    setIsPlayingResonance(false);
    osc1Ref.current = null;
    osc2Ref.current = null;
    gainRef.current = null;
    audioCtxRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopResonance();
    };
  }, [activeTab, selectedRashi]);

  // ── Live Vedic Hora Timing Calculator ─────────────────────────────────────────
  const getLiveHora = (): string => {
    const hr = today.getHours();
    const dayOfWeek = today.getDay(); // 0-6

    // Hours elapsed relative to standard 6:00 AM Sunrise
    const hoursSinceSunrise = (hr >= 6) ? (hr - 6) : (hr + 18);

    const WEEKDAY_BASE_PLANET = ['Surya (Sun)', 'Chandra (Moon)', 'Mangal (Mars)', 'Budha (Mercury)', 'Guru (Jupiter)', 'Shukra (Venus)', 'Shani (Saturn)'];
    const SEQUENCE = ['Surya (Sun)', 'Shukra (Venus)', 'Budha (Mercury)', 'Chandra (Moon)', 'Shani (Saturn)', 'Guru (Jupiter)', 'Mangal (Mars)'];

    const startPlanet = WEEKDAY_BASE_PLANET[dayOfWeek];
    const startIndex = SEQUENCE.indexOf(startPlanet);

    const activeIndex = (startIndex + hoursSinceSunrise) % 7;
    const planetName = SEQUENCE[activeIndex];

    const HORA_PURPOSES: Record<string, string> = {
      'Surya (Sun)': 'Auspicious for leadership, focus, and solar meditations.',
      'Chandra (Moon)': 'Highly auspicious for peace, emotional clarity, and devotion.',
      'Mangal (Mars)': 'Best for physical courage, organizing, and active sadhana.',
      'Budha (Mercury)': 'Auspicious for business meetings, shastra study, and writing.',
      'Guru (Jupiter)': 'Blessed for receiving spiritual mantras, yoga, and guru connection.',
      'Shukra (Venus)': 'Auspicious for music, temple art, relationships, and wellness.',
      'Shani (Saturn)': 'Auspicious for quiet solitude, discipline, and tapasya.'
    };

    return `${planetName} Hora · ${HORA_PURPOSES[planetName] ?? 'Auspicious for devotion'}`;
  };

  // ── Compute sky phase ────────────────────────────────────────────────────────
  const skyPhase = useMemo(() => {
    const nowMin      = today.getHours() * 60 + today.getMinutes();
    const sunriseMin  = parseSunTime(p.sunrise);
    const sunsetMin   = parseSunTime(p.sunset);
    return getSkyPhase(nowMin, sunriseMin, sunsetMin);
  }, [today, p.sunrise, p.sunset]);

  // ── Calendar grid ────────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const isToday   = isSameDay(selected, today);
  const dateLabel = selected.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const isNight  = skyPhase === 'night' || skyPhase === 'predawn' || skyPhase === 'evening';
  const orb      = SKY_ORB[skyPhase];

  async function share() {
    let text = '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shoonaya.com';

    if (activeTab === 'panchang') {
      const link = `${origin}/panchang`;
      text = `Read & check your panchang following this link to open the feature: ${link}\n\n` +
        `🪔 Panchang — ${dateLabel}\n\n` +
        `📅 Tithi: ${p.tithi} (${p.paksha} Paksha)\n` +
        `⭐ Nakshatra: ${p.nakshatra}\n🕉️ Yoga: ${p.yoga}\n📆 Vara: ${p.vara}\n` +
        `🌅 Sunrise: ${p.sunrise}  🌆 Sunset: ${p.sunset}\n` +
        `⚠️ Rahu Kaal: ${p.rahuKaal}\n✨ Abhijit Muhurat: ${p.abhijitMuhurat}\n\n— Shoonaya`;
    } else if (activeTab === 'rashiphal') {
      const h = getDailyHoroscope(selectedRashi, selected);
      const link = `${origin}/panchang?tab=rashiphal`;
      text = `Read & check your rashiphal following this link to open those features: ${link}\n\n` +
        `🐏 Daily Rashiphal for ${h.rashiSanskrit} (${h.rashi}) — ${dateLabel}\n\n` +
        `📿 Sadhana Focus: ${h.sadhanaFocus}\n` +
        `💼 Karma & Focus: ${h.karma}\n` +
        `🌿 Aura & Health: ${h.health}\n` +
        `✨ Lucky Color: ${h.luckyColor} | Lucky Number: ${h.luckyNumber}\n\n— Shoonaya`;
    } else {
      const link = `${origin}/panchang?tab=kundali`;
      text = `Read & check your Vedic Kundali chart following this link to open those features: ${link}\n\n` +
        `🛕 Vedic Kundali Chart for ${kundaliResult?.input.name ?? 'Pilgrim'}\n\n` +
        `🌟 Lagna Ascendant: ${kundaliResult?.lagnaSign} (${kundaliResult?.lagnaEnglish})\n` +
        `🔮 Alignment: ${kundaliResult?.lagnaReading}\n\n— Shoonaya`;
    }

    if (navigator.share) { try { await navigator.share({ title: 'Astrology Hub', text }); return; } catch {} }
    try {
      await navigator.clipboard.writeText(text);
      const toast = (await import('react-hot-toast')).default;
      toast.success('Copied to clipboard 📋');
    } catch { /* clipboard not available */ }
  }

  return (
    // Full-bleed atmospheric wrapper — extends behind safe areas
    <div className="relative -mx-4 -mt-4 pb-28 min-h-screen" style={{ background: SKY_GRADIENTS[skyPhase] }}>

      {/* ── Stars (night phases) ──────────────────────────────────────── */}
      {isNight && <Stars />}

      {/* ── Animated sky orb (sun / moon) ────────────────────────────── */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: orb.size, height: orb.size,
          background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          top: '4%', left: '50%', translateX: '-50%',
          filter: 'blur(2px)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [orb.opacity * 0.8, orb.opacity, orb.opacity * 0.8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Horizon glow ─────────────────────────────────────────────── */}
      {(skyPhase === 'dawn' || skyPhase === 'dusk') && (
        <motion.div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: '10%', height: '30%',
            background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${
              skyPhase === 'dawn' ? 'rgba(255,140,50,0.35)' : 'rgba(200,60,20,0.35)'
            }, transparent 70%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-16 space-y-3">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/home"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ArrowLeft size={16} className="text-white/80" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600, color: '#F2EAD6', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Astrology Hub</h1>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90"
                style={{ background: tradMeta.accent }}>
                {tradMeta.badge}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-0.5">
              {PHASE_LABELS[skyPhase]}{city ? ` · 📍 ${city}` : ''}
            </p>
          </div>
          <button onClick={share}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Share2 size={15} className="text-white/80" />
          </button>
        </div>

        {/* Premium Hub Navigation Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/25 border border-white/5 backdrop-blur-sm">
          {[
            { id: 'panchang',  label: '📅 Panchang' },
            { id: 'rashiphal', label: '🐏 Rashiphal' },
            { id: 'kundali',   label: '🛕 Kundali' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playHaptic('light');
              }}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-[#C5A059] text-[#1c1c1a] shadow-md font-bold'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: PANCHANG CONTENT ─────────────────────────────────────── */}
        {activeTab === 'panchang' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Paksha banner */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${tradMeta.accent}dd, ${tradMeta.accent}99)`, border: `1px solid rgba(255,255,255,0.12)` }}>
              <span className="text-2xl">🪔</span>
              <div>
                <p className="text-white font-bold text-sm">{p.paksha} Paksha · {p.masaName} {p.labels.monthLabel}</p>
                <p className="text-white/60 text-[11px] mt-0.5">{p.vara} · {tradMeta.note}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white/80 text-xs font-semibold">{p.sunrise}</p>
                <p className="text-white/40 text-[10px]">sunrise</p>
              </div>
            </motion.div>

            {/* Calendar */}
            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={prevMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ChevronLeft size={15} className="text-white/70" />
                </button>
                <div className="text-center">
                  <p className="font-semibold text-white text-sm">{MONTHS[viewMonth]} {viewYear}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    {p.masaName} {p.labels.monthLabel} · {p.calendarName}
                  </p>
                </div>
                <button onClick={nextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ChevronRight size={15} className="text-white/70" />
                </button>
              </div>

              <div className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {DAY_LABELS.map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-medium text-white/35">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 p-2 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`e-${i}`} />;
                  const isSelected    = isSameDay(date, selected);
                  const isCurrentDay  = isSameDay(date, today);
                  const dayP = calculatePanchang(date, lat, lon);
                  return (
                    <motion.button
                      key={date.toISOString()}
                      onClick={() => { 
                        setSelected(date);
                        playHaptic('medium');
                      }}
                      whileTap={{ scale: 0.88 }}
                      className="relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all"
                      style={
                        isSelected    ? { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }
                        : isCurrentDay ? { border: `1px solid ${tradMeta.accent}`, background: `${tradMeta.accent}20` }
                        : { background: 'transparent' }
                      }>
                      <span className={`text-xs font-semibold leading-none ${isSelected ? 'text-white' : isCurrentDay ? 'text-white' : 'text-white/70'}`}>
                        {date.getDate()}
                      </span>
                      <span className={`text-[8px] leading-none mt-0.5 ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
                        {dayP.tithiIndex}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>

            {/* Date label */}
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tradMeta.accent }} />
                <p className="text-xs font-semibold text-white/70">{isToday ? 'Today — ' : ''}{dateLabel}</p>
              </div>
              {isToday && (
                <div className="mt-1 flex items-center gap-1.5 bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] px-3 py-1.5 rounded-xl self-start">
                  <span className="animate-pulse text-[10px]">⏳</span>
                  <span className="text-[9px] font-bold tracking-wide uppercase">Live Hora:</span>
                  <span className="text-[10px] font-semibold text-white/95">{getLiveHora()}</span>
                </div>
              )}
            </div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2">

              <div className="space-y-2">
                <Row emoji="📅" label={t('tithi')} value={`${p.tithi} · ${p.paksha} Paksha`} upto={p.tithiUpto} accent={tradMeta.accent} infoKey="Tithi" />
                <Row emoji="⭐" label={t('nakshatra')} value={p.nakshatra} upto={p.nakshatraUpto} accent={tradMeta.accent} infoKey="Nakshatra" />
                <Row emoji="🕉️" label={t('yoga')} value={p.yoga} upto={p.yogaUpto} accent={tradMeta.accent} infoKey="Yoga" />
                <Row emoji="🃏" label="Karana" value={p.karana} upto={p.karanaUpto} accent={tradMeta.accent} infoKey="Karana" />
                <Row emoji="📆" label={t('vara')} value={p.vara} accent={tradMeta.accent} infoKey="Vara" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Row emoji="🌅" label={t('sunrise')} value={p.sunrise} accent={tradMeta.accent} infoKey="Sunrise" />
                <Row emoji="🌆" label={t('sunset')}  value={p.sunset}  accent={tradMeta.accent} infoKey="Sunset" />
              </div>

              {'brahmaMuhurta' in p && (
                <Row emoji="🌙" label="Brahma Muhurta" value={(p as any).brahmaMuhurta} accent={tradMeta.accent} infoKey="Brahma Muhurta" />
              )}

              <Row emoji="⚠️" label={t('rahuKaal')} value={p.rahuKaal} accent={tradMeta.accent} warn infoKey="Rahu Kaal" />
              <Row emoji="✨" label={t('abhijitMuhurat')} value={p.abhijitMuhurat} accent={tradMeta.accent} infoKey="Abhijit Muhurat" />

              {'samvatYear' in p && (
                <div className="rounded-xl px-4 py-2.5 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Vikram Samvat</span>
                  <span className="text-white/80 text-sm font-semibold ml-auto">
                    {(p as any).samvatYear} {(p as any).samvatName}
                  </span>
                </div>
              )}

              <div className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,200,100,0.08)', border: '1px solid rgba(255,200,100,0.15)' }}>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  <span className="font-semibold text-amber-200">Today&apos;s guidance:</span>{' '}
                  {p.paksha === 'Shukla'
                    ? 'Shukla Paksha — auspicious for new beginnings, prayers, and blessings. Act and grow.'
                    : 'Krishna Paksha — quiet reflection. Focus on purification, ancestral gratitude, and inward practices.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── TAB 2: RASHIPHAL CONTENT ────────────────────────────────────── */}
        {activeTab === 'rashiphal' && (
          <div className="space-y-4">
            {/* Horizontal Rashi/Zodiac sign selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
              {RASHI_LIST.map((rashi) => {
                const isSelected = selectedRashi === rashi.key;
                return (
                  <button
                    key={rashi.key}
                    onClick={() => {
                      setSelectedRashi(rashi.key);
                      playHaptic('medium');
                    }}
                    className={`flex-shrink-0 snap-center flex flex-col items-center px-4 py-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#C5A059]/15 text-white'
                        : 'border-white/5 bg-black/25 text-white/50 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xl">{rashi.symbol}</span>
                    <span className="text-xs font-bold mt-1">{rashi.sa}</span>
                    <span className="text-[9px] opacity-60 uppercase">{rashi.en}</span>
                  </button>
                );
              })}
            </div>

            {/* Generated Horoscope details */}
            {(() => {
              const h = getDailyHoroscope(selectedRashi, selected);
              return (
                <motion.div
                  key={selectedRashi}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {/* Hero Information Card */}
                  <div className="rounded-2xl p-4 border border-white/5 flex flex-col gap-3"
                    style={{ background: 'rgba(10,8,25,0.65)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-2xl">
                        {h.symbol}
                      </div>
                      <div>
                        <h2 className="font-serif text-lg font-bold text-[#F2EAD6]">{h.rashiSanskrit} ({h.rashi})</h2>
                        <p className="text-white/40 text-xs">Ruling Graha: {h.lord}</p>
                      </div>
                      <span className="ml-auto text-[10px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full">
                        ● Active
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase font-medium">Lucky Color</p>
                        <p className="text-xs font-semibold text-white/80 mt-0.5">{h.luckyColor}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase font-medium">Lucky Number</p>
                        <p className="text-xs font-semibold text-[#C5A059] mt-0.5">{h.luckyNumber}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className="text-[9px] text-white/30 uppercase font-medium">Lucky Time</p>
                        <p className="text-[9px] font-semibold text-white/80 mt-0.5 leading-tight">{h.luckyTime.split(' (')[0]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pandit AI Cosmic Channeled Oracle */}
                  {'panditAiOracle' in h && (
                    <div className="rounded-2xl p-4 border border-[#C5A059]/40 space-y-2 relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.08) 0%, rgba(10,8,25,0.85) 100%)' }}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📿</span>
                        <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Pandit AI Daily Oracle</h3>
                      </div>
                      <p className="text-sm font-medium text-[#F2EAD6]/90 leading-relaxed italic">
                        &ldquo;{(h as any).panditAiOracle}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Planetary Dhyana Shloka */}
                  {'shloka' in h && (
                    <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                      style={{ background: 'rgba(10,8,25,0.65)' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">📜</span>
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Graha Dhyana Shloka</h4>
                      </div>
                      <div className="text-center py-2 px-1">
                        <p className="font-serif text-base text-[#F2EAD6] font-medium leading-relaxed tracking-wide">
                          {(h as any).shloka}
                        </p>
                        <p className="text-xs text-[#C5A059]/90 italic mt-3 leading-relaxed">
                          &ldquo;{(h as any).shlokaTranslation}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Graha Sound Resonance (Web Audio API Synthesizer) */}
                  {'beejaMantra' in h && (
                    <div className="rounded-2xl p-4 border border-[#C5A059]/30 space-y-4 relative overflow-hidden"
                      style={{ background: 'rgba(10,8,25,0.75)' }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔊</span>
                          <div>
                            <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">Graha Sound Resonance</h4>
                            <p className="text-[10px] text-white/40 mt-0.5">Tune your energy into the planet&apos;s physical frequency</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-md">
                          {(h as any).beejaFrequency} Hz
                        </span>
                      </div>

                      {isPlayingResonance ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-4 border border-[#C5A059]/20 bg-[#C5A059]/5 rounded-xl">
                          {/* Pulsing expander ring */}
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <span className="absolute inset-0 rounded-full bg-[#C5A059]/20 animate-ping" />
                            <span className="absolute inset-2 rounded-full bg-[#C5A059]/30 animate-pulse" />
                            <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-[#1c1c1a] font-bold text-sm">
                              🕉️
                            </div>
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-xs text-white/40 uppercase tracking-wider font-bold">Resonating Mantra</p>
                            <p className="font-serif text-lg text-[#F2EAD6] font-bold tracking-wide">
                              {(h as any).beejaMantra}
                            </p>
                            <p className="text-[10px] text-white/50 italic mt-1">Close your eyes and hum along in perfect pitch</p>
                          </div>

                          <button
                            onClick={() => {
                              stopResonance();
                              playHaptic('light');
                            }}
                            className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F2EAD6] border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition"
                          >
                            🛑 Stop Resonance Hum
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-white/60 leading-relaxed">
                              This sound engine generates a real-time deep temple drone at the cosmic pitch of <span className="text-[#C5A059] font-bold">{(h as any).beejaFrequency}Hz</span>. Chant the sacred beeja mantra while humming to balance the active Graha.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              startResonance((h as any).beejaFrequency);
                            }}
                            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#1c1c1a] bg-[#C5A059] hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2"
                          >
                            📿 Start Cosmic Sound Resonance
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Daily Sadhana Focus Card (Featured Shoonaya Experience!) */}
                  <div className="rounded-2xl p-4 border border-[#C5A059]/35 space-y-2 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.12) 0%, rgba(10,8,25,0.7) 100%)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📿</span>
                      <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Today&apos;s Sadhana Focus</h3>
                    </div>
                    <p className="text-sm font-medium text-[#F2EAD6] leading-relaxed pr-6">{h.sadhanaFocus}</p>
                  </div>

                  {/* Interpretations for work/life */}
                  <div className="space-y-2">
                    <div className="rounded-2xl p-4 border border-white/5 flex gap-3 items-start"
                      style={{ background: 'rgba(10,8,25,0.5)' }}>
                      <span className="text-xl mt-0.5">💼</span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Karma &amp; Career</h4>
                        <p className="text-sm text-white/85 leading-relaxed">{h.karma}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 border border-white/5 flex gap-3 items-start"
                      style={{ background: 'rgba(10,8,25,0.5)' }}>
                      <span className="text-xl mt-0.5">🌿</span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Vitality &amp; Health</h4>
                        <p className="text-sm text-white/85 leading-relaxed">{h.health}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 border border-white/5 flex gap-3 items-start"
                      style={{ background: 'rgba(10,8,25,0.5)' }}>
                      <span className="text-xl mt-0.5">💖</span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Love &amp; Connections</h4>
                        <p className="text-sm text-white/85 leading-relaxed">{h.love}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}

        {/* ── TAB 3: KUNDALI CONTENT ──────────────────────────────────────── */}
        {activeTab === 'kundali' && (
          <div className="space-y-4">
            {kundaliResult === null ? (
              /* Generate Form */
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5 border border-white/5 space-y-4"
                style={{ background: 'rgba(10,8,25,0.65)' }}
              >
                <div className="text-center space-y-1">
                  <span className="text-3xl">🛕</span>
                  <h2 className="font-serif text-lg font-bold text-[#F2EAD6]">Vedic Kundali Chart</h2>
                  <p className="text-white/40 text-xs">Enter birth details to map your planetary alignment</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={kundaliInput.name}
                      onChange={e => setKundaliInput(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Date of Birth</label>
                      <input
                        type="date"
                        value={kundaliInput.birthDate}
                        onChange={e => setKundaliInput(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Time of Birth</label>
                      <input
                        type="time"
                        value={kundaliInput.birthTime}
                        onChange={e => setKundaliInput(prev => ({ ...prev, birthTime: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Birth Location (City)</label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi, India"
                      value={kundaliInput.birthPlace}
                      onChange={e => setKundaliInput(prev => ({ ...prev, birthPlace: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 outline-none text-white text-sm focus:border-[#C5A059]/50 transition"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!kundaliInput.name || !kundaliInput.birthDate || !kundaliInput.birthTime || !kundaliInput.birthPlace) {
                      import('react-hot-toast').then((m) => {
                        m.default.error('Please complete all birth fields');
                      });
                      return;
                    }
                    playHaptic('heavy');
                    const result = generateKundali(kundaliInput);
                    setKundaliResult(result);
                  }}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#1c1c1a] bg-[#C5A059] hover:opacity-90 transition shadow-lg"
                >
                  🔮 Generate Vedic Kundali
                </button>
              </motion.div>
            ) : (
              /* Display Results */
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                {/* Back Button */}
                <button
                  onClick={() => {
                    setKundaliResult(null);
                    playHaptic('light');
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#C5A059] font-semibold border border-[#C5A059]/20 bg-[#C5A059]/5 rounded-xl px-3.5 py-1.5 hover:bg-[#C5A059]/10 transition"
                >
                  ← Calculate New Chart
                </button>

                {/* Lagna details banner */}
                <div className="rounded-2xl p-5 border border-white/5 space-y-3"
                  style={{ background: 'rgba(10,8,25,0.65)' }}>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Calculated Ascendant (Lagna)</span>
                    <h3 className="font-serif text-2xl font-bold text-[#F2EAD6]">{kundaliResult.lagnaSign} ({kundaliResult.lagnaEnglish})</h3>
                    <p className="text-white/40 text-xs">Chart generated for: {kundaliResult.input.name}</p>
                  </div>
                  <div className="rounded-xl p-4 border border-[#C5A059]/20 bg-white/5">
                    <p className="text-sm font-medium text-[#F2EAD6] leading-relaxed">{kundaliResult.lagnaReading}</p>
                  </div>
                </div>

                {/* Pandit AI Destiny Reading */}
                {'panditAiDestinyReading' in kundaliResult && (
                  <div className="rounded-2xl p-5 border border-[#C5A059]/40 space-y-3 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.08) 0%, rgba(10,8,25,0.85) 100%)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔮</span>
                      <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Pandit AI Destiny Reading</h3>
                    </div>
                    <div className="space-y-4 text-sm text-[#F2EAD6]/90 leading-relaxed font-medium">
                      {kundaliResult.panditAiDestinyReading.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Styled North Indian Kundali SVG */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-3 flex flex-col items-center"
                  style={{ background: 'rgba(10,8,25,0.65)' }}>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider self-start">North Indian Rashi Chart</h4>
                  <div className="w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden shadow-2xl"
                    dangerouslySetInnerHTML={{ __html: renderKundaliSVG(kundaliResult) }}
                  />
                  <span className="text-[10px] text-white/30 italic">Numbers represent Rashi placements (1=Mesha, 12=Meena)</span>
                </div>

                {/* Planet positions */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                  style={{ background: 'rgba(10,8,25,0.5)' }}>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Grahas &amp; House Placements</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {kundaliResult.placements.map(p => (
                      <div key={p.name} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center font-bold text-[#C5A059] text-xs">
                          {p.symbol}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80">{p.name}</p>
                          <p className="text-[10px] text-white/40">House {p.house} · {p.sign} ({p.degree})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Graha Shadbala Strength Heatmap (Vedic Power Index) */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-4"
                  style={{ background: 'rgba(10,8,25,0.5)' }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Graha Shadbala Strength Heatmap</h4>
                    <span className="text-[9px] font-bold text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-md">Vedic Power Index</span>
                  </div>

                  <div className="space-y-3">
                    {kundaliResult.placements.map(p => {
                      // Custom glowing bar colors for planets based on strength
                      const barColor = p.strength >= 80 ? 'from-[#C5A059] to-amber-300' 
                                     : p.strength >= 60 ? 'from-emerald-600 to-teal-400' 
                                     : 'from-orange-600 to-red-400';
                      return (
                        <div key={p.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-white/80 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[9px] font-bold text-[#C5A059]">
                                {p.symbol}
                              </span>
                              {p.name} <span className="text-[10px] text-white/40 font-medium">({p.sign})</span>
                            </span>
                            <span className="font-bold text-white/70">{p.strength}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${p.strength}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bhava readings */}
                <div className="rounded-2xl p-4 border border-white/5 space-y-3"
                  style={{ background: 'rgba(10,8,25,0.5)' }}>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Interactive Bhava Readings</h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(house => (
                      <details key={house} className="group border border-white/5 rounded-xl overflow-hidden transition-all duration-300">
                        <summary className="flex justify-between items-center px-4 py-3 bg-white/5 cursor-pointer select-none hover:bg-white/10 list-none">
                          <span className="text-xs font-bold text-white/80 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[10px] text-[#C5A059] font-bold">
                              {house}
                            </span>
                            House {house} Reading
                          </span>
                          <span className="text-[#C5A059] group-open:rotate-180 transition-transform duration-300 text-xs">▼</span>
                        </summary>
                        <div className="px-4 py-3 bg-black/20 text-xs text-white/70 leading-relaxed border-t border-white/5">
                          {kundaliResult.houseReadings[house]}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

