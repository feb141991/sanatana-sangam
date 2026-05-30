'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Heart, Bell, BellOff, Play, MapPin, Clock,
  Search, X, Share2, Sunrise, Sunset, Star, Radio, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveStream, LiveStreamCategory, AartiSchedule } from '@/lib/live-streams';
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

// ─── Constants ────────────────────────────────────────────────────────────────
const amber  = '#C5A059';
const cream  = '#f2ead6';
const muted  = '#b0aa9e';
const dim    = '#7a7469';
const card   = 'rgba(20,18,14,0.92)';
const dark   = '#0C0A07';

const TRADITION_LABELS: Record<TraditionFilter, { label: string; icon: SacredIconName }> = {
  all:      { label: 'All',      icon: 'sparkles' },
  hindu:    { label: 'Hindu',    icon: 'landmark' },
  sikh:     { label: 'Sikh',     icon: 'music'    },
  jain:     { label: 'Jain',     icon: 'flower'   },
  buddhist: { label: 'Buddhist', icon: 'flower'   },
};

const ALL_COLLECTIONS = [
  { id: 'Char Dham',      label: 'Char Dham',     icon: 'mountain'  as SacredIconName, color: '#FF9933', desc: '4 holy abodes'         },
  { id: 'Jyotirlinga',    label: 'Jyotirlinga',   icon: 'sparkles'  as SacredIconName, color: '#8B0000', desc: '12 radiant Lingas'      },
  { id: 'Rivers',         label: 'Holy Rivers',   icon: 'water'     as SacredIconName, color: '#1E6BB8', desc: 'Ganga & Yamuna Aarti'   },
  { id: 'Panj Takht',     label: 'Panj Takht',    icon: 'landmark'  as SacredIconName, color: '#FFCC00', desc: '5 Sikh thrones'         },
  { id: 'Gurbani Kirtan', label: 'Kirtan',         icon: 'music'     as SacredIconName, color: '#2E6B3E', desc: 'Akhand Gurbani'        },
  { id: 'Jain Path',      label: 'Jain Path',     icon: 'flower'    as SacredIconName, color: '#E05A5A', desc: 'Tirthankar bhakti'      },
  { id: 'Saptapuri',      label: 'Saptapuri',     icon: 'landmark'  as SacredIconName, color: '#B8860B', desc: '7 ancient holy cities'  },
  { id: 'Shaktipeeth',    label: 'Shaktipeeth',   icon: 'sparkles'  as SacredIconName, color: '#CC3300', desc: 'Seats of the Goddess'   },
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
      style={{ background: checked ? amber : 'rgba(255,255,255,0.1)' }}
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 180 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full rounded-t-[2rem] p-6 pb-10"
        style={{ background: '#141210', border: `1px solid rgba(197,160,89,0.12)`, borderBottom: 'none' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />

        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: `${amber}70` }}>
            Aarti Notifications
          </p>
          <h2 className="text-[1.4rem] leading-tight premium-serif font-light" style={{ color: cream }}>
            {stream.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: muted }}>
            Receive a call when aarti begins
          </p>
        </div>

        {/* Morning toggle */}
        <div
          className="flex items-center justify-between py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,180,80,0.12)' }}>
              <Sunrise size={16} style={{ color: '#FFB450' }} />
            </div>
            <div>
              <p className="text-[14px] font-medium" style={{ color: cream }}>Morning Aarti</p>
              <p className="text-[11px]" style={{ color: dim }}>
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
              <p className="text-[14px] font-medium" style={{ color: cream }}>Evening Aarti</p>
              <p className="text-[11px]" style={{ color: dim }}>
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
          style={{ background: amber, color: '#160F08', boxShadow: `0 8px 24px ${amber}38` }}
        >
          {(morning || evening) ? 'Save aarti calls' : 'Turn off notifications'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Player Overlay ───────────────────────────────────────────────────────────
function PlayerOverlay({
  stream,
  isFavourite,
  notifPref,
  onClose,
  onToggleFav,
  onOpenNotif,
  onOfferAarti,
}: {
  stream: LiveStream;
  isFavourite: boolean;
  notifPref: Partial<DarshanPref>;
  onClose: () => void;
  onToggleFav: () => void;
  onOpenNotif: () => void;
  onOfferAarti: () => void;
}) {
  const hasNotif = notifPref.notify_morning || notifPref.notify_evening;
  const aartis   = stream.aartis;

  const handleShare = async () => {
    const url = `${window.location.origin}/live-darshan`;
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
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: dark }}
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

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: 'rgba(220,38,38,0.85)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleFav}
              className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <Heart
                size={16}
                className={isFavourite ? 'fill-red-400 text-red-400' : 'text-white'}
              />
            </button>
            <button
              onClick={onOpenNotif}
              className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{
                background: hasNotif ? `${amber}28` : 'rgba(0,0,0,0.45)',
                border: `1px solid ${hasNotif ? `${amber}50` : 'rgba(255,255,255,0.14)'}`,
              }}
            >
              <Bell size={16} style={{ color: hasNotif ? amber : 'white' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Info panel ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Temple identity */}
        <div>
          <h2
            className="text-[1.5rem] leading-tight premium-serif font-light"
            style={{ color: cream }}
          >
            {stream.title}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1" style={{ color: muted }}>
              <MapPin size={11} />
              <span className="text-[12px]">{stream.location}</span>
            </div>
            <span style={{ color: dim, fontSize: 8 }}>·</span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize"
              style={{ background: `${amber}15`, color: amber, border: `1px solid ${amber}30` }}
            >
              {stream.category}
            </span>
          </div>
        </div>

        {/* Aarti schedule card */}
        {(aartis?.morning || aartis?.evening) && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: card, border: '1px solid rgba(197,160,89,0.12)' }}
          >
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: `${amber}70` }}>
              Aarti Schedule
            </p>
            {aartis.morning && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,180,80,0.12)' }}>
                  <Sunrise size={14} style={{ color: '#FFB450' }} />
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: dim }}>Morning Aarti</p>
                  <p className="text-[13px] font-medium" style={{ color: cream }}>{aartis.morning}</p>
                </div>
              </div>
            )}
            {aartis.evening && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(150,100,255,0.12)' }}>
                  <Sunset size={14} style={{ color: '#C080FF' }} />
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: dim }}>Evening Aarti</p>
                  <p className="text-[13px] font-medium" style={{ color: cream }}>{aartis.evening}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule (if no parsed aartis) */}
        {!aartis && stream.schedule && (
          <div className="flex items-center gap-2" style={{ color: muted }}>
            <Clock size={13} />
            <span className="text-[13px]">{stream.schedule}</span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={onOfferAarti}
            className="flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[13px] transition-transform active:scale-[0.97]"
            style={{ background: amber, color: '#160F08', boxShadow: `0 6px 20px ${amber}35` }}
          >
            🪔 Offer Aarti
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-[13px] transition-transform active:scale-[0.97]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: cream }}
          >
            <Share2 size={14} /> Share
          </button>
        </div>

        {/* Notification CTA */}
        {!hasNotif && (aartis?.morning || aartis?.evening) && (
          <button
            onClick={onOpenNotif}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-transform active:scale-[0.98]"
            style={{ background: 'rgba(197,160,89,0.08)', border: `1px solid ${amber}22` }}
          >
            <Bell size={14} style={{ color: amber }} />
            <span className="text-[13px] font-medium" style={{ color: amber }}>
              Get aarti call for this temple
            </span>
          </button>
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
  const hasNotif = notifPref.notify_morning || notifPref.notify_evening;
  const hasAartis = !!(stream.aartis?.morning || stream.aartis?.evening);
  const thumbUrl = `https://i.ytimg.com/vi/${stream.youtubeVideoId}/hqdefault.jpg`;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: card, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full aspect-video cursor-pointer group"
        onClick={onPlay}
      >
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

        {/* Live badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: 'rgba(220,38,38,0.85)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live</span>
        </div>

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
          <div className="flex items-center gap-1 min-w-0" style={{ color: muted }}>
            <MapPin size={10} className="flex-shrink-0" />
            <span className="text-[11px] truncate">{stream.location}</span>
          </div>
          {stream.aartis?.morning && (
            <>
              <span style={{ color: dim, fontSize: 8 }}>·</span>
              <div className="flex items-center gap-1 flex-shrink-0" style={{ color: dim }}>
                <Sunrise size={10} />
                <span className="text-[11px]">{stream.aartis.morning.split(' — ')[0]}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Notification bell — only for streams with aarti times */}
          {hasAartis && (
            <button
              onClick={e => { e.stopPropagation(); onOpenNotif(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                background: hasNotif ? `${amber}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${hasNotif ? `${amber}40` : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {hasNotif
                ? <Bell size={13} style={{ color: amber }} />
                : <Bell size={13} style={{ color: dim }} />
              }
            </button>
          )}

          {/* Favourite heart */}
          <button
            onClick={e => { e.stopPropagation(); onToggleFav(); }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: isFavourite ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isFavourite ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <Heart size={13} className={isFavourite ? 'fill-red-400 text-red-400' : ''} style={{ color: isFavourite ? '#f87171' : dim }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveDarshanClient({
  tradition,
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
  const [activePlayer, setActivePlayer]     = useState<string | null>(null);
  const [notifTarget, setNotifTarget]       = useState<string | null>(null);
  const [aartiTarget, setAartiTarget]       = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [activeTradition, setActiveTradition] = useState<TraditionFilter>('all');
  const [activeCategory,  setActiveCategory]  = useState<CategoryFilter>('all');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const favouriteIds = Array.from(prefs.values())
    .filter(p => p.is_favourite)
    .map(p => p.stream_id);

  // ── Sort collections by user's tradition ──────────────────────────────────
  const TRAD_COLLECTION_MAP: Record<string, string[]> = {
    hindu:    ['Char Dham', 'Jyotirlinga', 'Saptapuri', 'Shaktipeeth', 'Rivers'],
    sikh:     ['Panj Takht', 'Gurbani Kirtan'],
    jain:     ['Jain Path'],
    buddhist: ['Bodhi Path'],
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
      // Favourites first, then user's tradition
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
    // Optimistic update
    setPrefs(prev => {
      const next = new Map(prev);
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
      // Revert not implemented — page reload would re-fetch
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

    // Request notification permission via OneSignal if user wants notifications
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

    await savePref(streamId, { ...update, is_favourite: true });
    setNotifTarget(null);

    if (wantsNotif) {
      toast.success('🔔 Aarti call saved');
    } else {
      toast.success('Notifications turned off');
    }
  }, [savePref]);

  // ── Player stream ─────────────────────────────────────────────────────────
  const playerStream  = streams.find(s => s.id === activePlayer)  ?? null;
  const notifStream   = streams.find(s => s.id === notifTarget)   ?? null;
  const aartiStream   = streams.find(s => s.id === aartiTarget)   ?? null;

  return (
    <div className="min-h-screen pb-28" style={{ background: dark }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 px-4 pt-5 pb-3 space-y-4"
        style={{ background: `${dark}f0`, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase mb-0.5" style={{ color: `${amber}70` }}>
              Shoonaya
            </p>
            <h1 className="text-[1.7rem] leading-none premium-serif font-light" style={{ color: cream }}>
              Live Darshan
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {favouriteIds.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)' }}>
                <Heart size={10} className="fill-red-400 text-red-400" />
                <span className="text-[10px] font-bold text-red-400">{favouriteIds.length}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

        {/* Collections */}
        <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCollection(null)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl border transition-all"
            style={{
              background: !activeCollection ? `${amber}14` : 'rgba(255,255,255,0.04)',
              borderColor: !activeCollection ? `${amber}60` : 'rgba(255,255,255,0.07)',
              color: !activeCollection ? amber : muted,
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
                  background: isActive ? col.color : 'rgba(255,255,255,0.04)',
                  borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex justify-between items-start">
                  <SacredIcon name={col.icon} size={16} style={{ color: isActive ? 'rgba(255,255,255,0.9)' : muted }} />
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-wide leading-none mb-0.5" style={{ color: isActive ? 'rgba(255,255,255,0.95)' : cream }}>
                    {col.label}
                  </p>
                  <p className="text-[8px] leading-none" style={{ color: isActive ? 'rgba(255,255,255,0.65)' : dim }}>
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
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: dim }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search temple or city…"
              className="w-full pl-9 pr-4 py-2.5 rounded-full text-[13px] focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid rgba(255,255,255,0.09)`,
                color: cream,
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
                    background: active ? amber : 'rgba(255,255,255,0.05)',
                    borderColor: active ? 'transparent' : 'rgba(255,255,255,0.08)',
                    color: active ? '#160F08' : muted,
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
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2.5" style={{ color: `${amber}70` }}>
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
                    style={{ borderColor: amber }}
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
                      <div className="w-6 h-4.5 rounded-sm flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.85)' }}>
                        <Play size={10} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-center max-w-[60px] leading-tight" style={{ color: muted }}>
                    {s.title.split(' ')[s.title.split(' ').length > 2 ? 1 : 0]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stream count + category tabs ──────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[11px]" style={{ color: dim }}>
          {filtered.length} streams
        </p>
        <div className="flex gap-1.5">
          {(['all', 'mandir', 'katha', 'satsang'] as CategoryFilter[]).map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-all"
              style={{
                background: activeCategory === c ? `${amber}18` : 'transparent',
                color: activeCategory === c ? amber : dim,
                border: `1px solid ${activeCategory === c ? `${amber}35` : 'transparent'}`,
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
            <Radio size={36} style={{ color: dim, opacity: 0.4 }} />
            <p className="text-[13px]" style={{ color: dim }}>No streams match your filters.</p>
            <button
              onClick={() => { setActiveTradition('all'); setActiveCategory('all'); setSearch(''); setActiveCollection(null); }}
              className="text-[12px] font-semibold underline"
              style={{ color: amber }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((stream, i) => (
              <motion.div
                key={stream.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
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
            onClose={() => setActivePlayer(null)}
            onToggleFav={() => toggleFav(activePlayer)}
            onOpenNotif={() => { setNotifTarget(activePlayer); }}
            onOfferAarti={() => setAartiTarget(activePlayer)}
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
              symbol: aartiStream.tradition === 'sikh' ? 'ੴ'
                : aartiStream.tradition === 'buddhist' ? '☸️'
                : aartiStream.tradition === 'jain' ? '🕉'
                : aartiStream.ishtaDevata === 'Shiva' ? '🕉'
                : aartiStream.ishtaDevata === 'Krishna' ? '🦚'
                : aartiStream.ishtaDevata === 'Ganesha' ? '🐘'
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
