'use client';

/**
 * PriorityBanner — single rotating banner slot.
 *
 * Shows one message at a time from a priority queue.
 * Queue: (1) streak freeze available, (2) upgrade nudge for freeze,
 *        (3) notification permission, (4) missed yesterday reminder.
 *
 * Each item is independently dismissible. Dismissed state persists in
 * sessionStorage so the banner resets every browser session.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BannerItem {
  id:         string;
  icon:       string;
  message:    string;
  cta?:       { label: string; href: string };
  bg:         string;
  textColor:  string;
  borderColor: string;
}

interface Props {
  missedYesterday?:  boolean;
  freezeCount?:      number;
  isPro?:            boolean;
  streak?:           number;
  tradition?:        string | null;
}

export default function PriorityBanner({
  missedYesterday = false,
  freezeCount = 0,
  isPro = false,
  streak = 0,
  tradition,
}: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [notifState, setNotifState] = useState<NotificationPermission | null>(null);

  // Load dismissed set from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('shoonaya-priority-dismissed');
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  // Check notification permission
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

  // Build priority queue
  const queue: BannerItem[] = [];

  // Priority 1: streak freeze available + missed yesterday
  if (missedYesterday && freezeCount > 0 && streak > 3) {
    queue.push({
      id:          'freeze-use',
      icon:        '🧊',
      message:     `Protect your ${streak}-day streak — use a freeze`,
      cta:         { label: 'Use Freeze', href: '/home' },
      bg:          'rgba(15, 28, 56, 0.92)',
      textColor:   '#7DD3FC',
      borderColor: 'rgba(125, 211, 252, 0.22)',
    });
  }

  // Priority 2: missed + no freeze + not pro → upgrade nudge
  if (missedYesterday && freezeCount === 0 && !isPro && streak > 5) {
    queue.push({
      id:          'upgrade-streak',
      icon:        '🔥',
      message:     `Don't lose your ${streak}-day streak — get Zenith`,
      cta:         { label: 'Upgrade', href: '/settings/subscription' },
      bg:          'rgba(55, 20, 5, 0.92)',
      textColor:   '#FCA5A5',
      borderColor: 'rgba(252, 165, 165, 0.20)',
    });
  }

  // Priority 3: notifications not yet granted
  if (notifState === 'default') {
    queue.push({
      id:          'notif-permission',
      icon:        '🔔',
      message:     'Enable notifications for daily Panchang & japa reminders',
      cta:         { label: 'Enable', href: '/settings' },
      bg:          'rgba(30, 24, 8, 0.92)',
      textColor:   '#FDE68A',
      borderColor: 'rgba(253, 230, 138, 0.20)',
    });
  }

  const visible = queue.filter(b => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  const banner = visible[0];

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
