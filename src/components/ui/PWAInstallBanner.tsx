'use client';

/**
 * PWAInstallBanner — "Add to Home Screen" prompt.
 *
 * The single highest-leverage action for installed-base growth on mobile.
 * Once on the home screen, the app behaves like a native install and session
 * frequency roughly doubles versus a browser bookmark.
 *
 * Platform behaviour:
 * - Android / Chromium: real one-tap install via the `beforeinstallprompt` event.
 * - iPhone/iPad Safari: iOS has NO install API, so we render a foolproof guided
 *   "Share → Add to Home Screen → Add" walkthrough (cannot be one-tap on iOS).
 * - iOS in a non-Safari browser (Chrome-iOS, in-app webviews): "Add to Home
 *   Screen" only works in Safari there, so we guide them to open it in Safari
 *   instead of showing a flow that silently can't succeed.
 *
 * Shows after the user completes today's japa OR visits 3+ times; dismissal
 * persists to localStorage. Wired into HomeDashboard via japaAlreadyDoneToday.
 */

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Download, X, Share, Plus, Check, Copy, Compass } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

const STORAGE_KEY_DISMISSED = 'shoonaya-pwa-dismissed';
const STORAGE_KEY_VISITS    = 'shoonaya-visit-count';
const SHOW_AFTER_VISITS     = 3;

interface PWAInstallBannerProps {
  tradition?: string | null;
  japaCompletedToday?: boolean;
}

/** Chromium `beforeinstallprompt` event — not in lib.dom yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** iOS Safari exposes a non-standard `navigator.standalone`. */
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

type InstallMode = 'android' | 'ios-safari' | 'ios-other';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    // iPadOS 13+ reports as desktop Safari but is touch-first.
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // Add to Home Screen on iOS only works in real Safari — exclude Chrome (CriOS),
  // Firefox (FxiOS), Edge (EdgiOS), Opera (OPiOS), the Google app (GSA) and the
  // common in-app webviews.
  const nonSafari = /CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|MicroMessenger/i.test(ua);
  return isIOS() && /Safari/i.test(ua) && !nonSafari;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as NavigatorStandalone).standalone === true;
}

export default function PWAInstallBanner({ tradition, japaCompletedToday }: PWAInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode,    setMode]    = useState<InstallMode | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const meta   = getTraditionMeta(tradition ?? 'hindu');
  const accent = meta.accentColour ?? '#C5A059';

  useEffect(() => {
    // Already installed or already dismissed — bail immediately.
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(STORAGE_KEY_DISMISSED)) return;

    const visits = parseInt(localStorage.getItem(STORAGE_KEY_VISITS) ?? '0', 10) + 1;
    localStorage.setItem(STORAGE_KEY_VISITS, String(visits));
    const meetsThreshold = visits >= SHOW_AFTER_VISITS || japaCompletedToday;
    if (!meetsThreshold) return;

    // iOS has no install API — pick the guided flow up front (Safari vs. other).
    if (isIOS()) {
      setMode(isIOSSafari() ? 'ios-safari' : 'ios-other');
      setVisible(true);
      return;
    }

    // Android / Chromium — wait for the deferred prompt, then offer one-tap install.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode('android');
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [japaCompletedToday]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_DISMISSED, '1');
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem(STORAGE_KEY_DISMISSED, '1');
    setDeferredPrompt(null);
    setVisible(false);
  }, [deferredPrompt]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {/* clipboard blocked — ignore */}
  }, []);

  if (!visible || !mode) return null;

  const isIos = mode !== 'android';
  const title = mode === 'android'
    ? 'Install Shoonaya'
    : mode === 'ios-safari'
      ? 'Add Shoonaya to your Home Screen'
      : 'Open in Safari to install';
  const subtitle = mode === 'android'
    ? 'Access your sadhana in one tap — no browser needed'
    : mode === 'ios-safari'
      ? 'A few quick taps in Safari — here is how'
      : 'On iPhone, Add to Home Screen only works in Safari';

  const iosSteps: { icon: ReactNode; text: ReactNode }[] = [
    { icon: <Share size={14} style={{ color: accent }} />, text: <>Tap <span className="font-semibold">Share</span> in Safari&apos;s toolbar</> },
    { icon: <Plus size={14} style={{ color: accent }} />,  text: <>Choose <span className="font-semibold">Add to Home Screen</span></> },
    { icon: <Check size={14} style={{ color: accent }} />, text: <>Tap <span className="font-semibold">Add</span> — done</> },
  ];

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
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${accent}15`, border: `1px solid ${accent}28` }}
          >
            {mode === 'android' ? <Download size={16} style={{ color: accent }} />
              : mode === 'ios-other' ? <Compass size={16} style={{ color: accent }} />
              : <Share size={16} style={{ color: accent }} />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--brand-ink)' }}>
              {title}
            </p>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--brand-muted)' }}>
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 p-1.5 rounded-lg transition-opacity opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} style={{ color: 'var(--brand-muted)' }} />
          </button>
        </div>

        {/* Android — genuine one-tap install */}
        {mode === 'android' && (
          <button
            type="button"
            onClick={install}
            className="mt-3 w-full rounded-xl px-4 py-3 text-xs font-bold transition-all active:scale-95"
            style={{ background: accent, color: '#0E0E0F' }}
          >
            Add to Home Screen
          </button>
        )}

        {/* iOS Safari — foolproof guided walkthrough (no install API on iOS) */}
        {mode === 'ios-safari' && (
          <ol className="mt-3 space-y-1.5">
            {iosSteps.map((step, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {i + 1}
                </span>
                <span className="shrink-0">{step.icon}</span>
                <span className="text-[12px] leading-snug" style={{ color: 'var(--brand-ink)' }}>{step.text}</span>
              </li>
            ))}
          </ol>
        )}

        {/* iOS non-Safari — guide them to Safari (install fails everywhere else) */}
        {mode === 'ios-other' && (
          <button
            type="button"
            onClick={copyLink}
            className="mt-3 w-full rounded-xl px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: accent, color: '#0E0E0F' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Link copied — open it in Safari' : 'Copy link to open in Safari'}
          </button>
        )}
      </div>
    </div>
  );
}
