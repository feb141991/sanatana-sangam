'use client';

/**
 * PWAInstallBanner — "Add to Home Screen" prompt.
 *
 * The single highest-leverage action for installed-base growth on mobile.
 * Once on the home screen, the app is indistinguishable from a native install,
 * and session frequency roughly doubles versus a browser bookmark.
 *
 * Logic:
 * - Listens for `beforeinstallprompt` (Chrome/Android only — Safari/iOS handled separately)
 * - Shows after the user has completed today's japa OR visited 3+ times
 * - Dismissed state persists to localStorage so it never re-appears after dismissal
 * - iOS gets a manual "tap Share → Add to Home Screen" nudge (no API available)
 *
 * Wired into HomeDashboard via japaAlreadyDoneToday prop.
 */

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Share } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

const STORAGE_KEY_DISMISSED = 'shoonaya-pwa-dismissed';
const STORAGE_KEY_VISITS    = 'shoonaya-visit-count';
const SHOW_AFTER_VISITS     = 3;

interface PWAInstallBannerProps {
  tradition?: string | null;
  japaCompletedToday?: boolean;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia('(display-mode: standalone)').matches)
    || (window.navigator as any).standalone === true;
}

export default function PWAInstallBanner({ tradition, japaCompletedToday }: PWAInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible,        setVisible]        = useState(false);
  const [ios,            setIos]            = useState(false);

  const meta   = getTraditionMeta(tradition ?? 'hindu');
  const accent = meta.accentColour ?? '#C5A059';

  useEffect(() => {
    // Already installed or already dismissed — bail immediately
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(STORAGE_KEY_DISMISSED)) return;

    // Track visit count
    const visits = parseInt(localStorage.getItem(STORAGE_KEY_VISITS) ?? '0', 10) + 1;
    localStorage.setItem(STORAGE_KEY_VISITS, String(visits));

    const meetsThreshold = visits >= SHOW_AFTER_VISITS || japaCompletedToday;
    if (!meetsThreshold) return;

    setIos(isIOS());

    // Android / Chrome — catch the deferred prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS — show manual nudge if threshold met (no browser event available)
    if (isIOS()) setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [japaCompletedToday]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_DISMISSED, '1');
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY_DISMISSED, '1');
    }
    setDeferredPrompt(null);
    setVisible(false);
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <div className="px-5 mb-4">
      <div
        className="rounded-2xl px-4 py-3.5"
        style={{
          background: `linear-gradient(135deg, ${accent}10 0%, transparent 70%)`,
          border: `1px solid ${accent}28`,
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${accent}15`, border: `1px solid ${accent}28` }}
          >
            {ios ? <Share size={16} style={{ color: accent }} /> : <Download size={16} style={{ color: accent }} />}
          </div>

          {/* Copy */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--brand-ink)' }}>
              {ios ? 'Add Shoonaya to your Home Screen' : 'Install Shoonaya'}
            </p>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--brand-muted)' }}>
              {ios
                ? 'Tap the share icon below, then "Add to Home Screen" for one-tap access'
                : 'Access your sadhana in one tap — no browser needed'}
            </p>
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 p-1 rounded-lg transition-opacity opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} style={{ color: 'var(--brand-muted)' }} />
          </button>
        </div>

        {/* Action — only for non-iOS (iOS needs manual step) */}
        {!ios && (
          <button
            type="button"
            onClick={install}
            className="mt-3 w-full rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95"
            style={{ background: accent, color: '#0E0E0F' }}
          >
            Add to Home Screen
          </button>
        )}
      </div>
    </div>
  );
}
