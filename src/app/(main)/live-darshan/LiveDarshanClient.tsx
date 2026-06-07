'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft, Heart, Bell, Play, MapPin, Clock,
  Search, Share2, Sunrise, Sunset, Radio, ChevronRight, Flag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveStream, LiveStreamCategory } from '@/lib/live-streams';
import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';
import { withOneSignal, getPermissionState } from '@/lib/onesignal';
import InteractiveAarti from '@/components/darshan/InteractiveAarti';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DarshanPref {
  stream_id: string;
  is_favourite: boolean;
  notify_morning: boolean;
  notify_evening: boolean;
}

interface Props {
  tradition: string;
  userId: string;
  streams: LiveStream[];
  initialPreferences: DarshanPref[];
}

type TraditionFilter = 'all' | 'hindu' | 'sikh' | 'jain' | 'buddhist';
type CategoryFilter  = 'all' | LiveStreamCategory;

// ─── Theme token helpers ──────────────────────────────────────────────────────
// Use CSS vars so we respect light/dark mode — never hardcode hex here.
const gold = 'var(--brand-primary)';

const TRADITION_LABELS: Record<TraditionFilter, { label: string; icon: SacredIconName }> = {
  all:      { label: 'All',      icon: 'sparkles' },
  hindu:    { label: 'Hindu',    icon: 'landmark' },
  sikh:     { label: 'Sikh',     icon: 'music'    },
  jain:     { label: 'Jain',     icon: 'flower'   },
  buddhist: { label: 'Buddhist', icon: 'flower'   },
};

const ALL_COLLECTIONS = [
  { id: 'Char Dham',      label: 'Char Dham',    icon: 'mountain' as SacredIconName,  color: '#FF9933', desc: '4 holy abodes'         },
  { id: 'Jyotirlinga',    label: 'Jyotirlinga',  icon: 'sparkles' as SacredIconName,  color: '#8B0000', desc: '12 radiant Lingas'      },
  { id: 'Shaktipeeth',    label: 'Shaktipeeth',  icon: 'sparkles' as SacredIconName,  color: '#CC3300', desc: 'Seats of the Goddess'   },
  { id: 'Rivers',         label: 'Holy Rivers',  icon: 'water'    as SacredIconName,  color: '#1E6BB8', desc: 'Sacred river aartis'    },
  { id: 'Panj Takht',     label: 'Panj Takht',   icon: 'landmark' as SacredIconName,  color: '#FFCC00', desc: '5 Sikh thrones'         },
  { id: 'Gurbani Kirtan', label: 'Kirtan',        icon: 'music'    as SacredIconName,  color: '#2E6B3E', desc: 'Akhand Gurbani'         },
  { id: 'Jain Path',      label: 'Jain Path',    icon: 'flower'   as SacredIconName,  color: '#E05A5A', desc: 'Tirthankar bhakti'      },
  { id: 'Saptapuri',      label: 'Saptapuri',    icon: 'landmark' as SacredIconName,  color: '#B8860B', desc: '7 ancient holy cities'  },
];

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors"
      style={{ background: checked ? gold : 'rgba(128,128,128,0.2)' }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

// ─── Notification Sheet ───────────────────────────────────────────────────────
function NotifSheet({
  stream,
  pref,
  onSave,
  onClose,
}: {
  stream: LiveStream;
  pref: Partial<DarshanPref>;
  onSave: (update: { notify_morning: boolean; notify_evening: boolean }) => void;
  onClose: () => void;
}) {
  const [morning, setMorning] = useState(pref.notify_morning ?? false);
  const [evening, setEvening] = useState(pref.notify_evening ?? false);
  const aartis = stream.aartis;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 180 }}
        onClick={e => e.stopPropagation()}
        className="clay-card relative w-full rounded-t-[2rem] p-6 pb-10"
        style={{ borderBottom: 'none' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5 opacity-20 bg-current" />

        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1 theme-dim">
            Aarti Notifications
          </p>
          <h2 className="text-[1.35rem] leading-tight premium-serif font-light theme-ink">
            {stream.title}
          </h2>
          <p className="text-[13px] mt-0.5 theme-muted">
            Receive a call when aarti begins
          </p>
        </div>

        {/* Morning toggle */}
        <div className="flex items-center justify-between py-4 border-b border-current/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,180,80,0.12)' }}>
              <Sunrise size={16} style={{ color: '#FFB450' }} />
            </div>
            <div>
              <p className="text-[14px] font-medium theme-ink">Morning Aarti</p>
              <p className="text-[11px] theme-dim">
                {aartis?.morning ?? 'Approx. 5:00 AM — 7:00 AM IST'}
              </p>
            </div>
          </div>
          <Toggle checked={morning} onChange={() => setMorning(v => !v)} />
        </div>

        {/* Evening toggle */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(150,100,255,0.12)' }}>
              <Sunset size={16} style={{ color: '#C080FF' }} />
            </div>
            <div>
              <p className="text-[14px] font-medium theme-ink">Evening Aarti</p>
              <p className="text-[11px] theme-dim">
                {aartis?.evening ?? 'Approx. 6:00 PM — 8:00 PM IST'}
              </p>
            </div>
          </div>
          <Toggle checked={evening} onChange={() => setEvening(v => !v)} />
        </div>

        {/* Save */}
        <button
          onClick={() => onSave({ notify_morning: morning, notify_evening: evening })}
          className="w-full mt-4 py-4 rounded-full font-semibold text-[15px] transition-transform active:scale-[0.98]"
          style={{ background: gold, color: '#160F08', boxShadow: `0 8px 24px color-mix(in srgb, var(--brand-primary) 40%, transparent)` }}
        >
          {(morning || evening) ? 'Save aarti calls' : 'Turn off notifications'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Suggestion Mini-Card ─────────────────────────────────────────────────────
function SuggestionCard({
  stream,
  isFavourite,
  onPlay,
}: {
  stream: LiveStream;
  isFavourite: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="flex-shrink-0 w-44 text-left group"
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-2">
        <Image
          src={`https://i.ytimg.com/vi/${stream.youtubeVideoId}/hqdefault.jpg`}
          alt={stream.title}
          fill
          sizes="176px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.90)' }}>
            <Play className="text-white fill-white ml-0.5" size={16} />
          </div>
        </div>
        {/* Live badge — only shown for healthy streams */}
        {stream.isHealthy !== false && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(220,38,38,0.80)' }}>
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] font-bold text-white uppercase tracking-widest">Live</span>
          </div>
        )}
        {isFavourite && (
          <Heart size={10} className="absolute top-2 right-2 fill-red-400 text-red-400" />
        )}
      </div>
      <p className="text-[12px] font-medium theme-ink line-clamp-2 leading-snug mb-0.5">
        {stream.title}
      </p>
      <p className="text-[10px] theme-dim">{stream.location}</p>
    </button>
  );
}

// ─── Player Overlay ───────────────────────────────────────────────────────────
function PlayerOverlay({
  stream,
  isFavourite,
  notifPref,
  suggestions,
  favouriteIds,
  userId,
  onClose,
  onToggleFav,
  onOpenNotif,
  onOfferAarti,
  onSwitch,
}: {
  stream: LiveStream;
  isFavourite: boolean;
  notifPref: Partial<DarshanPref>;
  suggestions: LiveStream[];
  userId: string;
  favouriteIds: string[];
  onClose: () => void;
  onToggleFav: () => void;
  onOpenNotif: () => void;
  onOfferAarti: () => void;
  onSwitch: (id: string) => void;
}) {
  const hasNotif = notifPref.notify_morning || notifPref.notify_evening;
  const aartis   = stream.aartis;
  const [reportSent, setReportSent] = useState(false);

  const handleReport = async () => {
    if (reportSent) return;
    try {
      await fetch('/api/live-darshan/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: stream.id, reason: 'stream_broken' }),
      });
      setReportSent(true);
      toast.success('Issue reported. Our team will review it. 🙏');
    } catch {
      toast.error('Could not submit report. Please try again.');
    }
  };

  const handleShare = async () => {
    const url  = `${window.location.origin}/live-darshan`;
    const text = `🙏 Watching ${stream.title} live on Shoonaya`;
    if (navigator.share) {
      try { await navigator.share({ title: stream.title, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Link copied!');
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 280 }}
      // Video area stays black; the panel below follows the app theme.
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'var(--surface-base)' }}
    >
      {/* ── YouTube iframe ─────────────────────────────────── */}
      <div className="relative w-full aspect-video flex-shrink-0 bg-black">
        <iframe
          key={stream.id}
          src={`https://www.youtube.com/embed/${stream.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={stream.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
        />

        {/* Top controls */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        >
          <button
            onClick={onClose}
            className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          {/* Live badge — only shown for healthy streams */}
          {stream.isHealthy !== false ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: 'rgba(220,38,38,0.85)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: 'rgba(100,100,100,0.60)' }}>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Darshan</span>
            </div>
          )}

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleFav}
              className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <Heart size={16} className={isFavourite ? 'fill-red-400 text-red-400' : 'text-white'} />
            </button>
            <button
              onClick={onOpenNotif}
              className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{
                background: hasNotif ? 'rgba(197,160,89,0.28)' : 'rgba(0,0,0,0.45)',
                border: `1px solid ${hasNotif ? 'rgba(197,160,89,0.55)' : 'rgba(255,255,255,0.14)'}`,
              }}
            >
              <Bell size={16} style={{ color: hasNotif ? 'var(--brand-primary)' : 'white' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Info panel (always dark inside player) ──────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-2 space-y-4">
          {/* Temple identity */}
          <div>
            <h2 className="text-[1.45rem] leading-tight premium-serif font-light" style={{ color: 'var(--text-cream)' }}>
              {stream.title}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1" style={{ color: 'var(--text-muted-warm)' }}>
                <MapPin size={11} />
                <span className="text-[12px]">{stream.location}</span>
              </div>
              <span style={{ color: 'var(--text-dim)', fontSize: 8 }}>·</span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize"
                style={{ background: 'rgba(197,160,89,0.15)', color: 'var(--brand-primary)', border: '1px solid rgba(197,160,89,0.30)' }}
              >
                {stream.category}
              </span>
            </div>
          </div>

          {/* Aarti schedule card */}
          {(aartis?.morning || aartis?.evening) && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: 'var(--surface-raised)', border: '1px solid rgba(197,160,89,0.12)' }}
            >
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: 'rgba(197,160,89,0.70)' }}>
                Aarti Schedule
              </p>
              {aartis.morning && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,180,80,0.12)' }}>
                    <Sunrise size={14} style={{ color: '#FFB450' }} />
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Morning Aarti</p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-cream)' }}>{aartis.morning}</p>
                  </div>
                </div>
              )}
              {aartis.evening && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(150,100,255,0.12)' }}>
                    <Sunset size={14} style={{ color: '#C080FF' }} />
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Evening Aarti</p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-cream)' }}>{aartis.evening}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule fallback */}
          {!aartis && stream.schedule && (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted-warm)' }}>
              <Clock size={13} />
              <span className="text-[13px]">{stream.schedule}</span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOfferAarti}
              className="flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[13px] transition-transform active:scale-[0.97]"
              style={{ background: 'var(--brand-primary)', color: '#160F08' }}
            >
              🪔 Offer Aarti
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-[13px] transition-transform active:scale-[0.97]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-cream)' }}
            >
              <Share2 size={14} /> Share
            </button>
          </div>

          {/* Report stream issue */}
          <button
            onClick={handleReport}
            disabled={reportSent}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-opacity active:scale-[0.98]"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: reportSent ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.45)',
              opacity: reportSent ? 0.6 : 1,
            }}
          >
            <Flag size={12} />
            <span className="text-[12px]">{reportSent ? 'Issue reported — thank you 🙏' : 'Report stream issue'}</span>
          </button>

          {/* Notification CTA */}
          {!hasNotif && (aartis?.morning || aartis?.evening) && (
            <button
              onClick={onOpenNotif}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-transform active:scale-[0.98]"
              style={{ background: 'rgba(197,160,89,0.08)', border: '1px solid rgba(197,160,89,0.22)' }}
            >
              <Bell size={14} style={{ color: 'var(--brand-primary)' }} />
              <span className="text-[13px] font-medium" style={{ color: 'var(--brand-primary)' }}>
                Get aarti call for this temple
              </span>
            </button>
          )}
        </div>

        {/* ── Watch Next ─────────────────────────────────────── */}
        {suggestions.length > 0 && (
          <div className="pt-2 pb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: 'rgba(197,160,89,0.70)' }}>
                Watch Next
              </p>
              <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
            </div>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
              {suggestions.map(s => (
                <SuggestionCard
                  key={s.id}
                  stream={s}
                  isFavourite={favouriteIds.includes(s.id)}
                  onPlay={() => onSwitch(s.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Stream Card ──────────────────────────────────────────────────────────────
function StreamCard({
  stream,
  isFavourite,
  notifPref,
  onPlay,
  onToggleFav,
  onOpenNotif,
}: {
  stream: LiveStream;
  isFavourite: boolean;
  notifPref: Partial<DarshanPref>;
  onPlay: () => void;
  onToggleFav: () => void;
  onOpenNotif: () => void;
}) {
  const hasNotif  = notifPref.notify_morning || notifPref.notify_evening;
  const hasAartis = !!(stream.aartis?.morning || stream.aartis?.evening);
  const thumbUrl  = `https://i.ytimg.com/vi/${stream.youtubeVideoId}/hqdefault.jpg`;

  return (
    <div className="clay-card rounded-2xl overflow-hidden">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video cursor-pointer group" onClick={onPlay}>
        <Image
          src={thumbUrl}
          alt={stream.title}
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-14 h-10 rounded-xl flex items-center justify-center shadow-xl transition-all duration-200 group-hover:scale-110"
            style={{ background: 'rgba(220,38,38,0.90)', backdropFilter: 'blur(4px)' }}
          >
            <Play className="text-white fill-white ml-0.5" size={22} />
          </div>
        </div>

        {/* Live badge — only shown for healthy streams */}
        {stream.isHealthy !== false && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: 'rgba(220,38,38,0.85)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live</span>
          </div>
        )}

        {/* Tradition badge */}
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm capitalize"
          style={{ background: 'rgba(0,0,0,0.50)', color: 'rgba(255,255,255,0.80)' }}
        >
          {stream.tradition}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-6">
          <p className="text-white font-serif font-semibold text-[14px] leading-tight drop-shadow">
            {stream.title}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1 min-w-0 theme-muted">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="text-[11px] truncate">{stream.location}</span>
          </div>
          {stream.aartis?.morning && (
            <>
              <span className="theme-dim" style={{ fontSize: 8 }}>·</span>
              <div className="flex items-center gap-1 flex-shrink-0 theme-dim">
                <Sunrise size={10} />
                <span className="text-[11px]">{stream.aartis.morning.split(' — ')[0]}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Notification bell */}
          {hasAartis && (
            <button
              onClick={e => { e.stopPropagation(); onOpenNotif(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                background: hasNotif ? 'rgba(197,160,89,0.18)' : 'rgba(128,128,128,0.08)',
                border: `1px solid ${hasNotif ? 'rgba(197,160,89,0.40)' : 'rgba(128,128,128,0.12)'}`,
              }}
            >
              <Bell size={13} style={{ color: hasNotif ? 'var(--brand-primary)' : 'var(--text-dim)' }} />
            </button>
          )}

          {/* Favourite heart */}
          <button
            onClick={e => { e.stopPropagation(); onToggleFav(); }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: isFavourite ? 'rgba(248,113,113,0.15)' : 'rgba(128,128,128,0.08)',
              border: `1px solid ${isFavourite ? 'rgba(248,113,113,0.35)' : 'rgba(128,128,128,0.12)'}`,
            }}
          >
            <Heart size={13} className={isFavourite ? 'fill-red-400 text-red-400' : 'theme-dim'} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveDarshanClient({
  tradition,
  userId,
  streams,
  initialPreferences,
}: Props) {
  const router = useRouter();

  // Preferences state
  const [prefs, setPrefs] = useState<Map<string, DarshanPref>>(() => {
    const m = new Map<string, DarshanPref>();
    initialPreferences.forEach(p => m.set(p.stream_id, p));
    return m;
  });

  // UI state
  const [activePlayer,    setActivePlayer]    = useState<string | null>(null);
  const [notifTarget,     setNotifTarget]     = useState<string | null>(null);
  const [aartiTarget,     setAartiTarget]     = useState<string | null>(null);
  const [search,          setSearch]          = useState('');
  const [activeTradition, setActiveTradition] = useState<TraditionFilter>('all');
  const [activeCategory,  setActiveCategory]  = useState<CategoryFilter>('all');
  const [activeCollection,setActiveCollection]= useState<string | null>(null);

  const searchParams = useSearchParams();

  // Auto-open a stream passed via ?stream=<id> from the Tirtha Map.
  // Runs only once on mount — removing activePlayer from deps prevents
  // re-opening the player after the user explicitly closes it.
  useEffect(() => {
    const streamId = searchParams.get('stream');
    if (streamId && streams.some(s => s.id === streamId)) {
      setActivePlayer(streamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only

  const favouriteIds = Array.from(prefs.values())
    .filter(p => p.is_favourite)
    .map(p => p.stream_id);

  const notificationIds = Array.from(prefs.values())
    .filter((p) => p.notify_morning || p.notify_evening)
    .map((p) => p.stream_id);

  // ── Collections sorted by user's tradition ────────────────────────────────
  const TRAD_COLLECTION_MAP: Record<string, string[]> = {
    hindu:    ['Char Dham', 'Jyotirlinga', 'Shaktipeeth', 'Saptapuri', 'Rivers'],
    sikh:     ['Panj Takht', 'Gurbani Kirtan'],
    jain:     ['Jain Path'],
    buddhist: [],
  };
  const myCollections = TRAD_COLLECTION_MAP[tradition] ?? [];
  const sortedCollections = [...ALL_COLLECTIONS].sort((a, b) => {
    const aM = myCollections.includes(a.id);
    const bM = myCollections.includes(b.id);
    if (aM && !bM) return -1;
    if (!aM && bM) return 1;
    return 0;
  });

  // ── Filter + sort streams ─────────────────────────────────────────────────
  const filtered = streams
    .filter(s => {
      if (activeTradition !== 'all' && s.tradition !== activeTradition) return false;
      if (activeCategory  !== 'all' && s.category  !== activeCategory)  return false;
      if (activeCollection && !s.collections?.includes(activeCollection)) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
          !s.location.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aFav = favouriteIds.includes(a.id);
      const bFav = favouriteIds.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      if (a.tradition === tradition && b.tradition !== tradition) return -1;
      if (a.tradition !== tradition && b.tradition === tradition) return 1;
      return 0;
    });

  // ── Preference helpers ────────────────────────────────────────────────────
  const savePref = useCallback(async (
    streamId: string,
    update: Partial<Omit<DarshanPref, 'stream_id'>>
  ) => {
    setPrefs(prev => {
      const next     = new Map(prev);
      const existing = next.get(streamId) ?? {
        stream_id: streamId, is_favourite: false,
        notify_morning: false, notify_evening: false,
      };
      next.set(streamId, { ...existing, ...update });
      return next;
    });
    try {
      const res = await fetch('/api/darshan/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: streamId, ...update }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      toast.error('Could not save preference');
    }
  }, []);

  const toggleFav = useCallback(async (streamId: string) => {
    const current = prefs.get(streamId);
    const nowFav  = !current?.is_favourite;
    await savePref(streamId, { is_favourite: nowFav });
    toast.success(nowFav ? '❤️ Added to your mandirs' : 'Removed from your mandirs');
  }, [prefs, savePref]);

  const saveNotif = useCallback(async (
    streamId: string,
    update: { notify_morning: boolean; notify_evening: boolean }
  ) => {
    const wantsNotif = update.notify_morning || update.notify_evening;
    if (wantsNotif) {
      const permState = await getPermissionState();
      if (permState !== 'granted') {
        await withOneSignal(async (OS) => {
          if (typeof OS.Notifications?.requestPermission === 'function') {
            await OS.Notifications.requestPermission();
          }
        });
      }
    }
    await savePref(streamId, update);
    setNotifTarget(null);
    toast.success(wantsNotif ? '🔔 Aarti call saved' : 'Notifications turned off');
  }, [savePref]);

  // ── Player helpers ────────────────────────────────────────────────────────
  const playerStream = streams.find(s => s.id === activePlayer)  ?? null;
  const notifStream  = streams.find(s => s.id === notifTarget)   ?? null;
  const aartiStream  = streams.find(s => s.id === aartiTarget)   ?? null;

  // Suggestions: same collection → same tradition → favourites → rest (excluding current)
  const suggestions = playerStream
    ? streams
        .filter(s => s.id !== playerStream.id)
        .sort((a, b) => {
          const aFav  = favouriteIds.includes(a.id) ? 0 : 1;
          const bFav  = favouriteIds.includes(b.id) ? 0 : 1;
          const aColl = playerStream.collections?.some(c => a.collections?.includes(c)) ? 0 : 1;
          const bColl = playerStream.collections?.some(c => b.collections?.includes(c)) ? 0 : 1;
          const aTrad = a.tradition === playerStream.tradition ? 0 : 1;
          const bTrad = b.tradition === playerStream.tradition ? 0 : 1;
          // Weighted: collection overlap > tradition > favourite
          return (aColl * 4 + aTrad * 2 + aFav) - (bColl * 4 + bTrad * 2 + bFav);
        })
        .slice(0, 10)
    : [];

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--surface-base)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 px-4 pt-safe-top pb-3 space-y-4"
        style={{ background: 'color-mix(in srgb, var(--surface-base) 94%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(128,128,128,0.08)' }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="h-10 w-10 rounded-full border flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'rgba(128,128,128,0.06)',
                borderColor: 'rgba(197,160,89,0.22)',
                color: 'var(--brand-primary)',
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] font-bold tracking-[0.24em] uppercase mb-0.5 theme-dim">
                Shoonaya
              </p>
              <h1 className="text-[1.7rem] leading-none premium-serif font-light theme-ink">
                Live Darshan
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {favouriteIds.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)' }}>
                <Heart size={10} className="fill-red-400 text-red-400" />
                <span className="text-[10px] font-bold text-red-400">{favouriteIds.length}</span>
              </div>
            )}
            {streams.some(s => s.isHealthy !== false) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.22)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Collections strip */}
        <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCollection(null)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl border transition-all"
            style={{
              background: !activeCollection ? 'rgba(197,160,89,0.12)' : 'rgba(128,128,128,0.06)',
              borderColor: !activeCollection ? 'rgba(197,160,89,0.55)' : 'rgba(128,128,128,0.10)',
              color: !activeCollection ? 'var(--brand-primary)' : 'var(--text-muted-warm)',
            }}
          >
            <SacredIcon name="sparkles" size={18} className="mb-1" />
            <span className="text-[9px] font-bold tracking-wide">All</span>
          </button>

          {sortedCollections.map(col => {
            const isActive = activeCollection === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setActiveCollection(isActive ? null : col.id)}
                className="flex-shrink-0 flex flex-col justify-between w-[110px] h-[72px] p-2.5 rounded-2xl border transition-all relative overflow-hidden"
                style={{
                  background: isActive ? col.color : 'rgba(128,128,128,0.06)',
                  borderColor: isActive ? 'transparent' : 'rgba(128,128,128,0.10)',
                }}
              >
                <div className="flex justify-between items-start">
                  <SacredIcon name={col.icon} size={16} style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'var(--text-muted-warm)' }} />
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-wide leading-none mb-0.5" style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'var(--text-cream)' }}>
                    {col.label}
                  </p>
                  <p className="text-[8px] leading-none" style={{ color: isActive ? 'rgba(255,255,255,0.65)' : 'var(--text-dim)' }}>
                    {col.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search + tradition filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-dim" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search temple or city…"
              className="w-full pl-9 pr-4 py-2.5 rounded-full text-[13px] focus:outline-none theme-ink"
              style={{
                background: 'rgba(128,128,128,0.08)',
                border: '1px solid rgba(128,128,128,0.12)',
              }}
            />
          </div>

          {/* Tradition pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {(Object.keys(TRADITION_LABELS) as TraditionFilter[]).map(t => {
              const active = activeTradition === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTradition(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border flex-shrink-0"
                  style={{
                    background: active ? 'var(--brand-primary)' : 'rgba(128,128,128,0.06)',
                    borderColor: active ? 'transparent' : 'rgba(128,128,128,0.10)',
                    color: active ? '#160F08' : 'var(--text-muted-warm)',
                  }}
                >
                  <SacredIcon name={TRADITION_LABELS[t].icon} size={11} />
                  {TRADITION_LABELS[t].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Favourites strip ───────────────────────────────────────────────── */}
      {favouriteIds.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2.5" style={{ color: 'rgba(197,160,89,0.70)' }}>
            Your Mandirs
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {favouriteIds.map(id => {
              const s = streams.find(st => st.id === id);
              if (!s) return null;
              return (
                <button
                  key={id}
                  onClick={() => setActivePlayer(id)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className="relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all"
                    style={{ borderColor: 'var(--brand-primary)' }}
                  >
                    <Image
                      src={`https://i.ytimg.com/vi/${s.youtubeVideoId}/hqdefault.jpg`}
                      alt={s.title}
                      fill
                      sizes="56px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-5 rounded-sm flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.85)' }}>
                        <Play size={10} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-center max-w-[60px] leading-tight theme-muted">
                    {s.title.split(' ').slice(0, 2).join(' ')}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Aarti calls strip — intentionally separate from favourites ─────── */}
      {notificationIds.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2.5" style={{ color: 'rgba(197,160,89,0.70)' }}>
            Aarti Calls
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {notificationIds.map(id => {
              const s = streams.find(st => st.id === id);
              const pref = prefs.get(id);
              if (!s || !pref) return null;
              const label = pref.notify_morning && pref.notify_evening
                ? 'Morning + Evening'
                : pref.notify_morning
                  ? 'Morning only'
                  : 'Evening only';
              return (
                <button
                  key={id}
                  onClick={() => setNotifTarget(id)}
                  className="flex-shrink-0 w-[164px] rounded-2xl border px-3 py-3 text-left"
                  style={{
                    background: 'rgba(197,160,89,0.08)',
                    borderColor: 'rgba(197,160,89,0.20)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(197,160,89,0.16)' }}>
                      <Bell size={14} style={{ color: 'var(--brand-primary)' }} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>
                      On
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold leading-snug theme-ink line-clamp-2">{s.title}</p>
                  <p className="text-[10px] mt-1 theme-dim">{label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stream count + category tabs ──────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[11px] theme-dim">
          {filtered.length} of {streams.length} streams
        </p>
        <div className="flex gap-1.5">
          {(['all', 'mandir', 'katha', 'satsang'] as CategoryFilter[]).map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-all"
              style={{
                background: activeCategory === c ? 'rgba(197,160,89,0.15)' : 'transparent',
                color: activeCategory === c ? 'var(--brand-primary)' : 'var(--text-dim)',
                border: `1px solid ${activeCategory === c ? 'rgba(197,160,89,0.35)' : 'transparent'}`,
              }}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stream grid ────────────────────────────────────────────────────── */}
      <main className="px-4 space-y-4 max-w-2xl mx-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Radio size={36} className="theme-dim opacity-40" />
            {streams.length === 0 ? (
              <>
                <p className="text-[14px] font-medium theme-ink">No streams available right now</p>
                <p className="text-[12px] theme-dim max-w-xs">
                  Our team is verifying live darshan streams. Check back soon — temples stream
                  at aarti times throughout the day. 🙏
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] theme-dim">No streams match your filters.</p>
                <button
                  onClick={() => { setActiveTradition('all'); setActiveCategory('all'); setSearch(''); setActiveCollection(null); }}
                  className="text-[12px] font-semibold underline"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Clear all filters
                </button>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((stream, i) => (
              <motion.div
                key={stream.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.025 } }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <StreamCard
                  stream={stream}
                  isFavourite={prefs.get(stream.id)?.is_favourite ?? false}
                  notifPref={prefs.get(stream.id) ?? {}}
                  onPlay={() => setActivePlayer(stream.id)}
                  onToggleFav={() => toggleFav(stream.id)}
                  onOpenNotif={() => setNotifTarget(stream.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>

      {/* ── Player overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activePlayer && playerStream && (
          <PlayerOverlay
            key={activePlayer}
            stream={playerStream}
            isFavourite={prefs.get(activePlayer)?.is_favourite ?? false}
            notifPref={prefs.get(activePlayer) ?? {}}
            suggestions={suggestions}
            favouriteIds={favouriteIds}
            userId={userId}
            onClose={() => setActivePlayer(null)}
            onToggleFav={() => toggleFav(activePlayer)}
            onOpenNotif={() => setNotifTarget(activePlayer)}
            onOfferAarti={() => setAartiTarget(activePlayer)}
            onSwitch={id => setActivePlayer(id)}
          />
        )}
      </AnimatePresence>

      {/* ── Notification sheet ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {notifTarget && notifStream && (
          <NotifSheet
            key={notifTarget}
            stream={notifStream}
            pref={prefs.get(notifTarget) ?? {}}
            onSave={update => saveNotif(notifTarget, update)}
            onClose={() => setNotifTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Interactive Aarti overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {aartiTarget && aartiStream && (
          <InteractiveAarti
            card={{
              id: aartiStream.id,
              tradition: aartiStream.tradition,
              title: aartiStream.title,
              symbol: aartiStream.tradition === 'sikh'     ? 'ੴ'
                    : aartiStream.tradition === 'buddhist' ? '☸️'
                    : aartiStream.tradition === 'jain'     ? '🕉'
                    : aartiStream.ishtaDevata === 'Shiva'  ? '🕉'
                    : aartiStream.ishtaDevata === 'Krishna'? '🦚'
                    : aartiStream.ishtaDevata === 'Ganesha'? '🐘'
                    : '🪔',
              blessing: `May ${aartiStream.title} bless you with peace and divine grace.`,
            }}
            onClose={() => setAartiTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
