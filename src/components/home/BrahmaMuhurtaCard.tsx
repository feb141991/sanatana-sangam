'use client';

/**
 * BrahmaMuhurtaCard — sunrise-aware japa reminder.
 *
 * Brahma Muhurta (96–48 min before sunrise) is the traditional optimal
 * window for meditation and japa in all Dharmic traditions. This card makes
 * Shoonaya lifestyle-aware: it knows when your sacred time is and prompts
 * you to step into the practice.
 *
 * Logic:
 * - Parses panchang.brahmaMuhurta string ("4:45 AM – 5:30 AM") to get today's window
 * - Shows if: user has NOT done japa today AND we are ≤ 45 min before start OR currently within
 * - Dismissed state in localStorage (per calendar date, so it resets daily)
 * - "Remind me" uses browser Notification API if granted
 *
 * Wired into HomeDashboard above the NextPracticeCard when !japaAlreadyDoneToday.
 */

import { useState, useEffect, useCallback } from 'react';
import { Sunrise, Bell, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getTraditionMeta } from '@/lib/tradition-config';

interface BrahmaMuhurtaCardProps {
  /** String like "4:45 AM – 5:30 AM" from panchang.brahmaMuhurta */
  brahmaMuhurta: string;
  /** String like "6:21 AM" from panchang.sunrise */
  sunrise: string;
  japaAlreadyDoneToday: boolean;
  tradition?: string | null;
}

/** Parse "4:45 AM" → today's Date object */
function parseTimeToday(t: string): Date | null {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

/** Format ms countdown → "12 min" / "1 hr 3 min" */
function fmtCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

const DISMISS_KEY_PREFIX = 'shoonaya-brahma-dismissed-';

function todayKey(): string {
  return DISMISS_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

type Phase = 'upcoming' | 'active' | null;

export default function BrahmaMuhurtaCard({
  brahmaMuhurta, sunrise, japaAlreadyDoneToday, tradition,
}: BrahmaMuhurtaCardProps) {
  const [phase, setPhase]       = useState<Phase>(null);
  const [countdown, setCountdown] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  const meta   = getTraditionMeta(tradition ?? 'hindu');
  const accent = meta.accentColour ?? '#C5A059';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(todayKey())) { setDismissed(true); return; }
    if (japaAlreadyDoneToday) { setDismissed(true); return; }
    setNotifGranted(Notification?.permission === 'granted');
  }, [japaAlreadyDoneToday]);

  useEffect(() => {
    if (dismissed) return;

    function tick() {
      const now = Date.now();
      // Parse "4:45 AM – 5:30 AM" → start / end
      const [startStr, endStr] = brahmaMuhurta.split('–').map(s => s.trim());
      const start = parseTimeToday(startStr);
      const end   = parseTimeToday(endStr ?? sunrise);
      if (!start || !end) return;

      const msToStart = start.getTime() - now;
      const msToEnd   = end.getTime() - now;

      if (msToEnd < 0) {
        // Window has passed today — hide
        setPhase(null);
      } else if (msToStart <= 0 && msToEnd > 0) {
        // Currently in window
        setPhase('active');
        setCountdown(fmtCountdown(msToEnd) + ' remaining');
      } else if (msToStart > 0 && msToStart <= 45 * 60_000) {
        // ≤ 45 min away
        setPhase('upcoming');
        setCountdown(fmtCountdown(msToStart));
      } else {
        setPhase(null);
      }
    }

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [dismissed, brahmaMuhurta, sunrise]);

  const dismiss = useCallback(() => {
    localStorage.setItem(todayKey(), '1');
    setDismissed(true);
  }, []);

  const requestReminder = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      setNotifGranted(true);
    }
    // Schedule notification for brahmaMuhurtaStart via a dummy timeout
    const [startStr] = brahmaMuhurta.split('–').map(s => s.trim());
    const start = parseTimeToday(startStr);
    if (!start) return;
    const delay = start.getTime() - Date.now();
    if (delay > 0 && delay < 3_600_000) {
      setTimeout(() => {
        new Notification('Brahma Muhurta — time for japa', {
          body: `Sacred window open until ${brahmaMuhurta.split('–')[1]?.trim()}. Begin your mala. 📿`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
        });
      }, delay);
    }
    dismiss();
  }, [brahmaMuhurta, dismiss]);

  if (dismissed || !phase || japaAlreadyDoneToday) return null;

  const isActive = phase === 'active';

  return (
    <div className="px-5 mb-4">
      <div
        className="rounded-2xl px-4 py-3.5 relative"
        style={{
          background: `linear-gradient(135deg, ${accent}14 0%, ${accent}06 60%, transparent 100%)`,
          border: `1px solid ${accent}30`,
          boxShadow: isActive ? `0 0 24px ${accent}20` : 'none',
        }}
      >
        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 opacity-40 hover:opacity-80 transition-opacity"
        >
          <X size={12} style={{ color: 'var(--brand-muted)' }} />
        </button>

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}28`,
              boxShadow: isActive ? `0 0 12px ${accent}35` : 'none',
            }}
          >
            <Sunrise size={16} style={{ color: accent }} />
          </div>

          {/* Copy */}
          <div className="flex-1 min-w-0 pr-5">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--brand-ink)' }}>
              {isActive
                ? `Brahma Muhurta — sacred window open`
                : `Brahma Muhurta in ${countdown}`}
            </p>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--brand-muted)' }}>
              {isActive
                ? `${brahmaMuhurta} · ${countdown} · Optimal japa time`
                : `${brahmaMuhurta} · Ideal for mantra and meditation`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/bhakti/mala"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95"
            style={{ background: accent, color: '#0E0E0F' }}
          >
            Begin Japa <ChevronRight size={12} />
          </Link>

          {!notifGranted && phase === 'upcoming' && (
            <button
              type="button"
              onClick={requestReminder}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95"
              style={{
                background: `${accent}12`,
                border: `1px solid ${accent}25`,
                color: accent,
              }}
            >
              <Bell size={12} />
              Remind me
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
