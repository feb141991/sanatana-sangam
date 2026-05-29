'use client';

/**
 * PriorityBanner — rotating single-slot notification banner.
 *
 * When `heroMode` is true it renders as an absolute-positioned pill at the
 * bottom of the hero image (inside a relative container).  Otherwise it
 * renders as a standard inline card.
 *
 * Priority queue (highest → lowest):
 *   1. Sankalpa days remaining (positive nudge)
 *   2. Upcoming special tithi today (Ekadashi, Chaturdashi, Purnima …)
 *   3. Streak freeze available + missed yesterday
 *   4. Upgrade nudge (missed + no freeze + not pro)
 *   5. Notification permission not yet granted
 *
 * Each item is independently dismissible via sessionStorage (resets each session).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BannerItem {
  id:          string;
  icon:        string;
  message:     string;
  cta?:        { label: string; href: string };
  bg:          string;
  textColor:   string;
  borderColor: string;
}

interface Props {
  /** Hero-overlay mode — renders inside the hero image bottom bar */
  heroMode?:           boolean;
  missedYesterday?:    boolean;
  freezeCount?:        number;
  isPro?:              boolean;
  streak?:             number;
  tradition?:          string | null;
  /** Active sankalpa text, e.g. "Read Gita daily" */
  sankalpaText?:       string;
  /** Days remaining in the sankalpa */
  sankalpaDaysLeft?:   number;
  /** Panchang tithi string, e.g. "Chaturdashi" — shown when it's a notable tithi */
  tithiLabel?:         string;
  /** Next festival name (shown in hero mode) */
  nextFestivalName?:   string;
  /** Days until next festival */
  nextFestivalDays?:   number | null;
}

const NOTABLE_TITHIS = new Set([
  'ekadashi', 'chaturdashi', 'purnima', 'amavasya', 'pradosh',
  'navami', 'ashtami', 'tritiya', 'panchami', 'saptami',
]);

function isNotableTithi(tithi: string): boolean {
  const lower = tithi.toLowerCase();
  return Array.from(NOTABLE_TITHIS).some(t => lower.includes(t));
}

export default function PriorityBanner({
  heroMode       = false,
  missedYesterday = false,
  freezeCount    = 0,
  isPro          = false,
  streak         = 0,
  tradition,
  sankalpaText,
  sankalpaDaysLeft,
  tithiLabel,
  nextFestivalName,
  nextFestivalDays,
}: Props) {
  const [dismissed,  setDismissed]  = useState<Set<string>>(new Set());
  const [notifState, setNotifState] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('shoonaya-priority-dismissed');
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifState(Notification.permission);
    }
  }, []);

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = new Set([...prev, id]);
      try { sessionStorage.setItem('shoonaya-priority-dismissed', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  const queue: BannerItem[] = [];

  // 1. Sankalpa progress nudge
  if (sankalpaText && sankalpaDaysLeft != null && sankalpaDaysLeft > 0) {
    queue.push({
      id:          'sankalpa-progress',
      icon:        '🕉️',
      message:     `${sankalpaDaysLeft} days left — "${sankalpaText.slice(0, 40)}${sankalpaText.length > 40 ? '…' : ''}"`,
      cta:         { label: "Let's do it", href: '/my-progress' },
      bg:          'rgba(26, 18, 6, 0.88)',
      textColor:   '#F5E0A0',
      borderColor: 'rgba(197,160,89,0.28)',
    });
  }

  // 2. Notable tithi today
  if (tithiLabel && isNotableTithi(tithiLabel)) {
    queue.push({
      id:          `tithi-${tithiLabel}`,
      icon:        '🌙',
      message:     `${tithiLabel} today — an auspicious day for deeper practice`,
      cta:         { label: 'Panchang', href: '/panchang' },
      bg:          'rgba(12, 16, 32, 0.88)',
      textColor:   '#C4B5FD',
      borderColor: 'rgba(196,181,253,0.22)',
    });
  }

  // 3. Upcoming festival (hero mode only, within 3 days)
  if (heroMode && nextFestivalName && nextFestivalDays != null && nextFestivalDays <= 3 && nextFestivalDays >= 0) {
    const dayLabel = nextFestivalDays === 0 ? 'Today' : nextFestivalDays === 1 ? 'Tomorrow' : `in ${nextFestivalDays} days`;
    queue.push({
      id:          `festival-${nextFestivalName}`,
      icon:        '🛕',
      message:     `${nextFestivalName} — ${dayLabel}`,
      cta:         { label: 'Learn more', href: '/panchang?tab=calendar' },
      bg:          'rgba(26, 10, 4, 0.88)',
      textColor:   '#FCA5A5',
      borderColor: 'rgba(252,165,165,0.20)',
    });
  }

  // 4. Streak freeze available
  if (missedYesterday && freezeCount > 0 && streak > 3) {
    queue.push({
      id:          'freeze-use',
      icon:        '🧊',
      message:     `Protect your ${streak}-day streak — use a freeze`,
      cta:         { label: 'Use Freeze', href: '/home' },
      bg:          'rgba(15, 28, 56, 0.92)',
      textColor:   '#7DD3FC',
      borderColor: 'rgba(125,211,252,0.22)',
    });
  }

  // 5. Upgrade nudge
  if (missedYesterday && freezeCount === 0 && !isPro && streak > 5) {
    queue.push({
      id:          'upgrade-streak',
      icon:        '🔥',
      message:     `Don't lose your ${streak}-day streak — get Zenith`,
      cta:         { label: 'Upgrade', href: '/settings/subscription' },
      bg:          'rgba(55, 20, 5, 0.92)',
      textColor:   '#FCA5A5',
      borderColor: 'rgba(252,165,165,0.20)',
    });
  }

  // 6. Notification permission
  if (notifState === 'default') {
    queue.push({
      id:          'notif-permission',
      icon:        '🔔',
      message:     'Enable notifications for daily Panchang & japa reminders',
      cta:         { label: 'Enable', href: '/settings' },
      bg:          'rgba(30, 24, 8, 0.92)',
      textColor:   '#FDE68A',
      borderColor: 'rgba(253,230,138,0.20)',
    });
  }

  const visible = queue.filter(b => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  const banner = visible[0];

  // ── Hero overlay variant ────────────────────────────────────────────────────
  if (heroMode) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4"
        >
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border backdrop-blur-md"
            style={{ background: banner.bg, borderColor: banner.borderColor }}
          >
            <span className="text-base shrink-0">{banner.icon}</span>
            <p className="flex-1 text-[11px] font-semibold leading-snug truncate" style={{ color: banner.textColor }}>
              {banner.message}
            </p>
            {banner.cta && (
              <Link
                href={banner.cta.href}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{
                  background:  `${banner.textColor}1A`,
                  color:       banner.textColor,
                  border:      `1px solid ${banner.borderColor}`,
                }}
              >
                {banner.cta.label}
              </Link>
            )}
            <button
              onClick={() => dismiss(banner.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={12} style={{ color: banner.textColor }} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Standard inline variant ─────────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={banner.id}
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div
          className="mx-5 mb-3 rounded-2xl px-4 py-3 flex items-center gap-3 border"
          style={{ background: banner.bg, borderColor: banner.borderColor }}
        >
          <span className="text-lg shrink-0">{banner.icon}</span>
          <p className="flex-1 text-xs font-semibold leading-snug" style={{ color: banner.textColor }}>
            {banner.message}
          </p>
          {banner.cta && (
            <Link
              href={banner.cta.href}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0 transition-opacity hover:opacity-80"
              style={{
                background:  `${banner.textColor}18`,
                color:       banner.textColor,
                border:      `1px solid ${banner.borderColor}`,
              }}
            >
              {banner.cta.label}
            </Link>
          )}
          <button
            onClick={() => dismiss(banner.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X size={13} style={{ color: banner.textColor }} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
