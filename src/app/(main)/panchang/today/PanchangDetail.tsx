'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2, X } from 'lucide-react';
import { useSacredCalendar, type SacredCalendarData } from '@/hooks/useSacredCalendar';
import { localSpiritualDate } from '@/lib/sacred-time';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { createClient } from '@/lib/supabase';

interface Props {
  lat:       number;
  lon:       number;
  city:      string;
  tradition?: string;
  timezone?: string;
}

const TRADITION_META: Record<string, { badge: string; note: string; accent: string; accentLight: string }> = {
  hindu:    { badge: '🕉️ Vedic',     note: 'Vikram Samvat',         accent: '#B8541B', accentLight: 'rgba(184,84,27,0.15)' },
  sikh:     { badge: '☬ Nanakshahi', note: 'Nanakshahi Calendar',   accent: '#1a4d7b', accentLight: 'rgba(26,77,123,0.15)' },
  buddhist: { badge: '☸️ Buddhist',   note: 'Buddhist Lunar',        accent: '#5c6b1a', accentLight: 'rgba(92,107,26,0.15)' },
  jain:     { badge: '🤲 Jain',       note: 'Vira Samvat',           accent: '#7b5a1a', accentLight: 'rgba(123,90,26,0.15)' },
};

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

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

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border backdrop-blur-md ${className}`}
      style={{ background: 'rgba(10,8,25,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}>
      {children}
    </div>
  );
}

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

function Row({ emoji, label, value, upto, warn = false, infoKey, isLocal = false }: {
  emoji: string; label: string; value: string; upto?: string; accent: string; warn?: boolean; infoKey?: string; isLocal?: boolean;
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
          <p className={`font-semibold text-sm mt-0.5 ${warn ? 'text-orange-300' : 'text-white/90'}`}>
            {value}
            {isLocal && <span className="text-[10px] text-white/50 ml-2 font-normal">(your time)</span>}
          </p>
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

export default function PanchangDetail({ lat, lon, city, tradition = 'hindu', timezone }: Props) {
  const { t } = useLanguage();
  const { playHaptic } = useZenithSensory();
  const tradMeta = TRADITION_META[tradition] ?? TRADITION_META.hindu;
  const today    = useMemo(() => new Date(), []);
  
  const [selected, setSelected]   = useState<Date>(today);
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayTz, setDisplayTz] = useState<'local' | 'ist'>('local');
  const [upcomingObservances, setUpcomingObservances] = useState<any[]>([]);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('shoonaya_dismissed_ekadashi')) setDismissedBanner(true);
    } catch {}

    const tzQuery = timezone || 'Asia/Kolkata';
    fetch(`/api/calendar/upcoming?days=7&tz=${encodeURIComponent(tzQuery)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.observances) setUpcomingObservances(data.observances);
      })
      .catch(() => {});
  }, [timezone]);

  const p: SacredCalendarData = useSacredCalendar(selected, lat, lon, tradition, displayTz === 'ist' ? 'Asia/Kolkata' : timezone);

  // Auth state check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const client = createClient();
    client.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  const skyPhase = useMemo(() => {
    const nowMin      = today.getHours() * 60 + today.getMinutes();
    const sunriseMin  = parseSunTime(p.sunrise);
    const sunsetMin   = parseSunTime(p.sunset);
    return getSkyPhase(nowMin, sunriseMin, sunsetMin);
  }, [today, p.sunrise, p.sunset]);

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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shoonaya.com';
    const link = `${origin}/panchang/today`;
    const text = `🪔 Panchang — ${dateLabel}\n\n` +
      `📅 Tithi: ${p.tithi} (${p.paksha} Paksha)\n` +
      `⭐ Nakshatra: ${p.nakshatra}\n🕉️ Yoga: ${p.yoga}\n📆 Vara: ${p.vara}\n` +
      `🌅 Sunrise: ${p.sunrise}  🌆 Sunset: ${p.sunset}\n` +
      `⚠️ Rahu Kaal: ${p.rahuKaal}\n✨ Abhijit Muhurat: ${p.abhijitMuhurat}\n\n` +
      `Check yours at: ${link}\n\n— Shoonaya`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Daily Panchang', text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      const toast = (await import('react-hot-toast')).default;
      toast.success('Copied to clipboard 📋');
    } catch { /* clipboard not available */ }
  }

  return (
    <div className="relative -mx-4 -mt-4 pb-28 min-h-screen" style={{ background: SKY_GRADIENTS[skyPhase] }}>
      {isNight && <Stars />}

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

      <div className="relative z-10 px-4 pt-16 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/panchang"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ArrowLeft size={16} className="text-white/80" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600, color: '#F2EAD6', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Today&apos;s Panchang</h1>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90"
                style={{ background: tradMeta.accent }}>
                {tradMeta.badge}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-0.5">
              {PHASE_LABELS[skyPhase]}{city ? ` · 📍 ${city}` : ''}
            </p>
            {timezone && timezone !== 'Asia/Kolkata' && (
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={() => setDisplayTz(t => t === 'local' ? 'ist' : 'local')}
                  className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  <span className={displayTz === 'local' ? 'text-[#C5A059]' : 'opacity-60'}>Your time</span>
                  <span className="opacity-40">↔</span>
                  <span className={displayTz === 'ist' ? 'text-[#C5A059]' : 'opacity-60'}>IST</span>
                </button>
              </div>
            )}
          </div>
          <button onClick={share}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }} aria-label="Share">
            <Share2 size={15} className="text-white/80" />
          </button>
        </div>

        {/* Unauthenticated Location Info */}
        {!isLoggedIn && lat === 28.6139 && lon === 77.2090 && (
          <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm">📍</span>
            <p className="text-[11px] text-white/70 flex-1">Showing panchang for New Delhi.</p>
            <Link href="/auth" className="text-[11px] font-bold text-[#C5A059] px-2 py-1 rounded bg-white/5">Sign in for local times</Link>
          </div>
        )}

        {/* Smart Banner */}
        {(() => {
          if (dismissedBanner || upcomingObservances.length === 0) return null;
          const todayIso = localSpiritualDate(timezone, 4);
          const todayObs = upcomingObservances.find(o => o.date === todayIso);
          if (!todayObs) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl p-3 border"
              style={{
                background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.15), rgba(197, 160, 89, 0.05))',
                borderColor: 'rgba(197, 160, 89, 0.3)',
              }}
            >
              <button
                onClick={() => {
                  try { sessionStorage.setItem('shoonaya_dismissed_ekadashi', 'true'); } catch {}
                  setDismissedBanner(true);
                }}
                className="absolute top-2 right-2 text-[#C5A059]/60 hover:text-[#C5A059]"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-2.5">
                <span className="text-xl leading-none">{todayObs.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-[#F2EAD6]">{todayObs.display_name}</p>
                  <p className="text-[11px] text-[#C5A059] font-medium opacity-90 mt-0.5">Today in your timezone</p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Main Content */}
        <div className="space-y-3">
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

          {/* Interactive Date Picker & Calendar Strip */}
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[#F2EAD6] font-serif text-base font-bold flex items-center gap-2">
                <span>🗓️</span> {MONTHS[viewMonth]} {viewYear}
              </h2>
              <div className="flex items-center gap-1.5">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <ChevronLeft size={16} className="text-white/70" />
                </button>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <ChevronRight size={16} className="text-white/70" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {DAY_LABELS.map((d) => (
                <span key={d} className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{d}</span>
              ))}
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />;
                const isSel   = isSameDay(date, selected);
                const isCurToday = isSameDay(date, today);
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelected(date); playHaptic('light'); }}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition ${
                      isSel
                        ? 'bg-[#C5A059] text-[#1c1c1a] font-bold shadow-md'
                        : isCurToday
                        ? 'bg-white/10 border border-[#C5A059]/40 text-white font-bold'
                        : 'text-white/75 hover:bg-white/5'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Timing details */}
          <motion.div
            key={selected.toISOString()}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="text-center py-1">
              <p className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.16em]">Spiritual Alignment</p>
              <h3 className="font-serif text-lg font-bold text-[#F2EAD6] mt-0.5">{dateLabel}</h3>
              {isToday && (
                <span className="inline-block mt-1 text-[9px] font-bold text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            <GlassCard className="p-4 space-y-2">
              <Row emoji="⏳" label="Tithi (Lunar Day)" value={p.tithi} upto={p.tithiUpto} accent={tradMeta.accent} infoKey="Tithi" />
              <Row emoji="🌙" label="Paksha (Moon Phase)" value={`${p.paksha} Paksha`} accent={tradMeta.accent} />
              <Row emoji="⭐" label="Nakshatra (Star Mansion)" value={p.nakshatra} upto={p.nakshatraUpto} accent={tradMeta.accent} infoKey="Nakshatra" />
              <Row emoji="🕉️" label="Yoga (Alignment)" value={p.yoga} upto={p.yogaUpto} accent={tradMeta.accent} infoKey="Yoga" />
              <Row emoji="⚙️" label="Karana (Half-Tithi)" value={p.karana} upto={p.karanaUpto} accent={tradMeta.accent} infoKey="Karana" />
              <Row emoji="📅" label="Vara (Weekday)" value={p.vara} accent={tradMeta.accent} infoKey="Vara" />
            </GlassCard>

            <GlassCard className="p-4 space-y-2">
              <h4 className="text-[10px] uppercase font-bold text-white/30 tracking-wider px-1">Daily Timings</h4>
              <div className="grid grid-cols-2 gap-2">
                <Row emoji="🌅" label="Sunrise" value={p.sunrise} accent={tradMeta.accent} isLocal={displayTz === 'local'} infoKey="Sunrise" />
                <Row emoji="🌆" label="Sunset" value={p.sunset} accent={tradMeta.accent} isLocal={displayTz === 'local'} infoKey="Sunset" />
              </div>
              <Row emoji="✨" label="Brahma Muhurta (Sacred)" value={p.brahmaMuhurta} accent={tradMeta.accent} isLocal={displayTz === 'local'} infoKey="Brahma Muhurta" />
              <Row emoji="☀️" label="Abhijit Muhurat (Auspicious)" value={p.abhijitMuhurat} accent={tradMeta.accent} isLocal={displayTz === 'local'} infoKey="Abhijit Muhurat" />
              <Row emoji="⚠️" label="Rahu Kaal (Avoid Starts)" value={p.rahuKaal} warn={true} accent={tradMeta.accent} isLocal={displayTz === 'local'} infoKey="Rahu Kaal" />
            </GlassCard>

            {/* Custom Samvat block */}
            {(p as any).samvatYear && (
              <div className="rounded-xl px-4 py-2 border border-white/5 bg-black/25 flex items-center justify-between text-[11px] text-white/50">
                <span>Vedic Era Reference</span>
                <span className="font-semibold text-white/70">
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
        </div>
      </div>
    </div>
  );
}
