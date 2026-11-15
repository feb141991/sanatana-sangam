'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Play, MapPin, Clock, Sunrise, Sunset, Moon, Sparkles,
  ChevronLeft, ChevronRight, Heart, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LiveStream } from '@/lib/live-streams';

interface Props {
  streams: LiveStream[];
  onPlay: (streamId: string) => void;
  onOfferAarti?: (streamId: string) => void;
  onOpenNotif?: (streamId: string) => void;
  favouriteIds?: string[];
  onToggleFav?: (streamId: string) => void;
  userTradition?: string;
}

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

interface PeriodConfig {
  period: TimePeriod;
  badge: string;
  subtitle: string;
  icon: typeof Sunrise;
  accentColor: string;
  preferredStreamIds: string[];
}

const PERIOD_CONFIGS: Record<TimePeriod, PeriodConfig> = {
  morning: {
    period: 'morning',
    badge: 'Morning Aarti & Darshan',
    subtitle: 'Mangal, Suprabhata & Bhasma Aarti Live',
    icon: Sunrise,
    accentColor: '#FFB03A',
    preferredStreamIds: [
      'mahakaleshwar-ujjain',
      'tirupati-balaji',
      'golden-temple-sgpc',
      'ayodhya-ram-mandir',
      'kashi-vishwanath',
      'iskcon-vrindavan',
      'hanuman-bhajan-live',
      'tseries-bhakti-live',
      'somnath-temple',
    ],
  },
  afternoon: {
    period: 'afternoon',
    badge: 'Highlight of the Day',
    subtitle: 'Sacred Shrines, Kathas & Holy Jyotirlinga Darshan',
    icon: Sparkles,
    accentColor: '#E6A122',
    preferredStreamIds: [
      'krishna-janmabhoomi',
      'dwarkadhish-temple',
      'sanskar-tv-live',
      'aastha-tv-live',
      'radha-krishna-bhajan-live',
      'siddhivinayak',
      'shirdi-sai-baba-temple',
      'pashupatinath-nepal',
      'aadinath-tv-live',
    ],
  },
  evening: {
    period: 'evening',
    badge: 'Evening Sandhya Aarti',
    subtitle: 'Deepa Aradhana, River & Temple Aartis Live',
    icon: Sunset,
    accentColor: '#FF6B4A',
    preferredStreamIds: [
      'parmarth-ganga-aarti',
      'kashi-ganga-aarti',
      'har-ki-pauri-haridwar',
      'somnath-temple',
      'siddhivinayak',
      'mahakaleshwar-ujjain',
      'takhat-hazur-sahib',
      'shiva-bhajan-live',
      'ayodhya-ram-mandir',
      'iskcon-vrindavan',
      'bangla-sahib-delhi',
    ],
  },
  night: {
    period: 'night',
    badge: 'Akhand Kirtan & Night Darshan',
    subtitle: 'Peaceful Overnight Dhun & Divine Chanting',
    icon: Moon,
    accentColor: '#7C88FF',
    preferredStreamIds: [
      'gurbani-kirtan-24x7',
      'radha-krishna-bhajan-live',
      'guru-granth-sahib-live',
      'shiva-mahamrityunjay',
      'swaminarayan-dhun',
      'sai-baba-dhyan',
      'brahma-kumaris',
      'iskcon-hare-krishna',
    ],
  },
};

function getCurrentISTPeriod(): TimePeriod {
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '12', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    const timeDecimal = hour + minute / 60;

    if (timeDecimal >= 4 && timeDecimal < 12) return 'morning';
    if (timeDecimal >= 12 && timeDecimal < 17) return 'afternoon';
    if (timeDecimal >= 17 && timeDecimal < 22.5) return 'evening';
    return 'night';
  } catch {
    return 'evening';
  }
}

export default function LiveDarshanHeroCarousel({
  streams,
  onPlay,
  onOfferAarti,
  onOpenNotif,
  favouriteIds = [],
  onToggleFav,
  userTradition,
}: Props) {
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('evening');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setCurrentPeriod(getCurrentISTPeriod());
    const interval = setInterval(() => {
      setCurrentPeriod(getCurrentISTPeriod());
    }, 60000); // re-evaluate every minute
    return () => clearInterval(interval);
  }, []);

  const config = PERIOD_CONFIGS[currentPeriod];
  const PeriodIcon = config.icon;

  // Build the prioritized carousel item list based on the active time period
  const carouselStreams = useMemo(() => {
    if (streams.length === 0) return [];

    const streamMap = new Map(streams.map(s => [s.id, s]));
    const picked: LiveStream[] = [];
    const pickedIds = new Set<string>();

    // 0. If user has a non-default tradition (sikh, jain, buddhist), prioritize streams of their tradition
    if (userTradition && userTradition !== 'all' && userTradition !== 'hindu') {
      const traditionMatches = streams.filter(s => s.tradition === userTradition && s.isHealthy !== false);
      for (const s of traditionMatches) {
        if (picked.length >= 5) break;
        if (!pickedIds.has(s.id)) {
          picked.push(s);
          pickedIds.add(s.id);
        }
      }
    }

    // 1. Next add matching preferred streams for this time period
    for (const id of config.preferredStreamIds) {
      if (picked.length >= 6) break;
      const s = streamMap.get(id);
      if (s && !pickedIds.has(s.id)) {
        picked.push(s);
        pickedIds.add(s.id);
      }
    }

    // 2. Add any user favourites with an aarti in this window
    for (const id of favouriteIds) {
      if (picked.length >= 6) break;
      const s = streamMap.get(id);
      if (s && !pickedIds.has(s.id)) {
        picked.push(s);
        pickedIds.add(s.id);
      }
    }

    // 3. Fallback: if we have fewer than 4 streams, backfill with remaining healthy streams
    if (picked.length < 4) {
      for (const s of streams) {
        if (picked.length >= 6) break;
        if (!pickedIds.has(s.id) && s.isHealthy !== false) {
          picked.push(s);
          pickedIds.add(s.id);
        }
      }
    }

    return picked.slice(0, 6);
  }, [streams, config, favouriteIds, userTradition]);

  const total = carouselStreams.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % (total || 1));
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + (total || 1)) % (total || 1));
  }, [total]);

  // Auto-slide every 6.5 seconds when not hovered/paused
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  if (total === 0) return null;

  const currentStream = carouselStreams[currentIndex] ?? carouselStreams[0];
  const isFav = favouriteIds.includes(currentStream.id);
  const relevantAarti =
    currentPeriod === 'morning'
      ? currentStream.aartis?.morning
      : currentPeriod === 'evening'
      ? currentStream.aartis?.evening
      : currentStream.aartis?.evening || currentStream.aartis?.morning || currentStream.schedule;

  return (
    <div
      className="relative px-4 pt-2 pb-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={e => {
        touchStartX.current = e.touches[0].clientX;
        setIsPaused(true);
      }}
      onTouchEnd={e => {
        setIsPaused(false);
        if (touchStartX.current === null) return;
        const diffX = e.changedTouches[0].clientX - touchStartX.current;
        if (diffX > 45) {
          prevSlide();
        } else if (diffX < -45) {
          nextSlide();
        }
        touchStartX.current = null;
      }}
    >
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
            style={{
              background: `color-mix(in srgb, ${config.accentColor} 18%, transparent)`,
              border: `1px solid color-mix(in srgb, ${config.accentColor} 35%, transparent)`,
            }}
          >
            <PeriodIcon size={14} style={{ color: config.accentColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tracking-wide theme-ink uppercase">
                {config.badge}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: config.accentColor }}
              />
            </div>
            <p className="text-[10px] theme-dim leading-none">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Slide Counter & Arrows */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium tracking-wider theme-dim mr-1">
            {currentIndex + 1} / {total}
          </span>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous stream"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 border"
            style={{
              background: 'rgba(128,128,128,0.08)',
              borderColor: 'rgba(128,128,128,0.14)',
              color: 'var(--text-cream)',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next stream"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 border"
            style={{
              background: 'rgba(128,128,128,0.08)',
              borderColor: 'rgba(128,128,128,0.14)',
              color: 'var(--text-cream)',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Hero Slide Card ───────────────────────────────────────────── */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border"
        style={{
          borderColor: `color-mix(in srgb, ${config.accentColor} 25%, rgba(128,128,128,0.15))`,
          background: 'rgba(15,12,9,0.95)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStream.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative w-full aspect-[16/9] sm:aspect-[21/9]"
          >
            {/* Background Thumbnail Image */}
            <Image
              src={`https://i.ytimg.com/vi/${currentStream.youtubeVideoId}/hqdefault.jpg`}
              alt={currentStream.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />

            {/* Gradient Overlays for contrast & warmth */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.85) 85%, rgba(0,0,0,0.95) 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
              style={{
                background: `radial-gradient(circle at 20% 80%, ${config.accentColor} 0%, transparent 60%)`,
              }}
            />

            {/* Top Badges & Actions */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {currentStream.isHealthy !== false ? (
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md"
                    style={{ background: 'rgba(220,38,38,0.88)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                      Live Darshan
                    </span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md"
                    style={{ background: 'rgba(50,50,50,0.75)' }}
                  >
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                      Darshan
                    </span>
                  </div>
                )}

                {currentStream.tradition && (
                  <div
                    className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider backdrop-blur-md capitalize"
                    style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.85)' }}
                  >
                    {currentStream.tradition}
                  </div>
                )}
              </div>

              {/* Action Buttons: Fav & Notif */}
              <div className="flex items-center gap-1.5">
                {onOpenNotif && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onOpenNotif(currentStream.id);
                    }}
                    aria-label="Aarti notification"
                    className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
                    style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <Bell size={13} className="text-white" />
                  </button>
                )}

                {onToggleFav && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFav(currentStream.id);
                    }}
                    aria-label="Toggle favourite"
                    className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
                    style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <Heart
                      size={13}
                      className={isFav ? 'fill-red-400 text-red-400' : 'text-white'}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Info Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-6 flex flex-col justify-end">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Location & Aarti timing */}
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-medium text-white/80">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} className="text-amber-400 flex-shrink-0" />
                      {currentStream.location}
                    </span>
                    {relevantAarti && (
                      <>
                        <span className="opacity-40">·</span>
                        <span className="flex items-center gap-1 truncate text-amber-200">
                          <Clock size={11} className="flex-shrink-0" />
                          {relevantAarti}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[1.25rem] sm:text-[1.45rem] font-bold font-serif leading-tight text-white drop-shadow-md truncate">
                    {currentStream.title}
                  </h3>
                </div>

                {/* Primary Watch Action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {onOfferAarti && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onOfferAarti(currentStream.id);
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[12px] font-semibold backdrop-blur-md transition-all active:scale-95"
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        color: '#FFF',
                      }}
                    >
                      <span>🪔</span> Offer Aarti
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onPlay(currentStream.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold shadow-lg transition-transform active:scale-95"
                    style={{
                      background: 'var(--brand-primary)',
                      color: '#160F08',
                      boxShadow: '0 4px 16px rgba(197,160,89,0.45)',
                    }}
                  >
                    <Play size={14} className="fill-current ml-0.5" />
                    <span>Watch Live</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Pagination Indicator Dots ─────────────────────────────────── */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {carouselStreams.map((s, idx) => {
            const active = idx === currentIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: active ? '22px' : '6px',
                  background: active ? config.accentColor : 'rgba(128,128,128,0.25)',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
