'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { activateProLocally } from '@/lib/premium';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useNotificationsRealtime,
} from '@/hooks/useNotifications';
import {
  requestNotificationPermission,
  getPlayerId,
  getPermissionState,
  isOneSignalConfigured,
  loginToOneSignal,
  syncOneSignalContext,
} from '@/lib/onesignal';

const PUSH_PROMPT_DISMISS_KEY = 'sanatana-push-prompt-dismissed-until';
const PUSH_PROMPT_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

export default function FloatingPill({
  userId,
  isGuest = false,
  avatarUrl = null,
  userInitials = 'SS',
  tradition = null,
  city = null,
  countryCode = null,
  wantsFestivalReminders = true,
  wantsShlokaReminders = true,
  wantsCommunityNotifications = true,
  wantsFamilyNotifications = true,
  savedTimezone = null,
  initialIsPro = false,
}: {
  userId: string;
  isGuest?: boolean;
  avatarUrl?: string | null;
  userInitials?: string;
  tradition?: string | null;
  city?: string | null;
  countryCode?: string | null;
  wantsFestivalReminders?: boolean;
  wantsShlokaReminders?: boolean;
  wantsCommunityNotifications?: boolean;
  wantsFamilyNotifications?: boolean;
  savedTimezone?: string | null;
  initialIsPro?: boolean;
}) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const prefersReducedMotion = useReducedMotion();
  const pushConfigured = isOneSignalConfigured();
  const wantsAnyNotifications = Boolean(
    wantsFestivalReminders || wantsShlokaReminders || wantsCommunityNotifications || wantsFamilyNotifications
  );

  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [pushPromptDismissedUntil, setPushPromptDismissedUntil] = useState<number | null>(null);
  const [isIosSafariNonPwa, setIsIosSafariNonPwa] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  const notificationsQuery = useNotificationsQuery(userId);
  const notifs = notificationsQuery.data ?? [];
  useNotificationsRealtime(userId);
  const markOneReadMutation = useMarkNotificationReadMutation(userId);
  const markAllReadMutation = useMarkAllNotificationsReadMutation(userId);

  useEffect(() => { setPortalTarget(document.body); }, []);

  useEffect(() => {
    setPermission(getPermissionState());
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(PUSH_PROMPT_DISMISS_KEY);
    setPushPromptDismissedUntil(stored ? Number(stored) : null);
    const ua = navigator.userAgent;
    const isIos    = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
    const isPwa    = (window.navigator as any).standalone === true;
    setIsIosSafariNonPwa(isIos && isSafari && !isPwa);
  }, []);

  useEffect(() => {
    if (!pushConfigured || !userId) return;
    loginToOneSignal(userId);
  }, [pushConfigured, userId]);

  useEffect(() => {
    if (!pushConfigured || !userId) return;
    syncOneSignalContext({
      tradition, city, countryCode,
      wantsFestivalReminders, wantsShlokaReminders,
      wantsCommunityNotifications, wantsFamilyNotifications,
    });
  }, [city, countryCode, pushConfigured, tradition, userId,
    wantsCommunityNotifications, wantsFamilyNotifications,
    wantsFestivalReminders, wantsShlokaReminders]);

  // ── Hydrate Pro from server on mount ─────────────────────────────────────────
  useEffect(() => {
    if (initialIsPro) activateProLocally();
  }, [initialIsPro]);

  // ── Auto-save browser timezone if different from stored ──────────────────────
  useEffect(() => {
    if (!userId || isGuest) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz || tz === savedTimezone) return;
      supabase.from('profiles').update({ timezone: tz }).eq('id', userId).then(({ error }) => {
        if (error) console.warn('[FloatingPill] timezone save failed:', error.message);
      });
    } catch { /* Intl not available */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const shouldSuppressPrompt = Boolean(
    pushPromptDismissedUntil && Number.isFinite(pushPromptDismissedUntil) && pushPromptDismissedUntil > Date.now()
  );
  const shouldShowPushPrompt =
    pushConfigured && permission !== 'granted' &&
    (permission === 'denied' || (wantsAnyNotifications && !shouldSuppressPrompt));

  function handleBellClick() {
    const opening = !open;
    setOpen(opening);
    if (opening) notificationsQuery.refetch();
  }

  function dismissPushPromptForNow() {
    if (typeof window === 'undefined') return;
    const nextAllowedAt = Date.now() + PUSH_PROMPT_COOLDOWN_MS;
    window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, String(nextAllowedAt));
    setPushPromptDismissedUntil(nextAllowedAt);
  }

  async function markAllRead() {
    const unreadIds = notifs.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    await markAllReadMutation.mutateAsync(unreadIds);
  }

  // ── Notification bottom sheet (portal) ────────────────────────────────────
  const notificationSheet = portalTarget ? createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            style={{ zIndex: 9998 }}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-[2rem] overflow-hidden"
            style={{
              zIndex: 9999,
              background: 'linear-gradient(180deg, rgba(28,26,22,0.99) 0%, rgba(22,20,17,0.99) 100%)',
              border: '1px solid rgba(200,146,74,0.14)',
              borderBottom: 'none',
              maxHeight: '85dvh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.9 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(200,146,74,0.25)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-semibold text-base" style={{ color: 'var(--text-cream)' }}>Notifications</p>
                {notifs.length > 0 && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                    style={{ background: 'rgba(200,146,74,0.12)', color: 'var(--brand-primary-strong)', border: '1px solid rgba(200,146,74,0.2)' }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}
                  aria-label="Close">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Push permission prompt */}
            {shouldShowPushPrompt && (
              <div className="mx-4 mt-4 flex-shrink-0 rounded-2xl px-4 py-3.5 flex items-start gap-3"
                style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.18)' }}>
                <span className="text-xl mt-0.5">{isIosSafariNonPwa ? '📲' : '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-cream)' }}>
                    {isIosSafariNonPwa ? 'Install the app to get notifications'
                      : permission === 'denied' ? 'Notifications blocked in browser'
                      : 'Enable push notifications'}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                    {isIosSafariNonPwa
                      ? 'iOS only delivers push notifications to installed apps. Tap Share → Add to Home Screen, then open Sangam from your home screen.'
                      : permission === 'denied'
                        ? 'Open your browser/OS settings and allow notifications for this site.'
                        : wantsAnyNotifications
                          ? 'Receive festival alerts, Nitya reminders, and streak nudges on your device.'
                          : 'Turn on reminder types in Profile settings first.'}
                  </p>
                  {isIosSafariNonPwa && (
                    <div className="mt-2.5 flex flex-col gap-1">
                      <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>1. Tap <span className="font-semibold" style={{ color: 'var(--text-cream)' }}>Share</span> (□↑) in Safari</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>2. Tap <span className="font-semibold" style={{ color: 'var(--text-cream)' }}>Add to Home Screen</span></p>
                      <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>3. Open Sangam from Home Screen</p>
                      <button onClick={dismissPushPromptForNow} className="self-start text-xs font-semibold mt-1 transition" style={{ color: 'var(--text-dim)' }}>
                        Remind me later
                      </button>
                    </div>
                  )}
                  {!isIosSafariNonPwa && permission !== 'denied' && wantsAnyNotifications && (
                    <div className="flex items-center gap-3 mt-2.5">
                      <button
                        onClick={async () => {
                          const granted = await requestNotificationPermission();
                          setPermission(getPermissionState());
                          if (granted) {
                            await loginToOneSignal(userId);
                            const playerId = await getPlayerId();
                            if (playerId && userId) {
                              await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', userId);
                            }
                            toast.success('Push notifications enabled 🙏');
                          }
                        }}
                        className="glass-button-primary text-xs font-semibold px-4 py-1.5 rounded-xl transition"
                      >
                        Enable now
                      </button>
                      {permission === 'default' && (
                        <button onClick={dismissPushPromptForNow} className="text-xs font-semibold transition" style={{ color: 'var(--text-dim)' }}>
                          Remind me later
                        </button>
                      )}
                    </div>
                  )}
                  {!isIosSafariNonPwa && permission !== 'denied' && !wantsAnyNotifications && (
                    <Link href="/profile" onClick={() => setOpen(false)} className="inline-flex mt-2 text-xs font-semibold" style={{ color: 'var(--brand-primary-strong)' }}>
                      Open notification settings →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notifs.length === 0 ? (
                <NotificationsEmptyState userId={userId} onNotificationSent={() => notificationsQuery.refetch()} />
              ) : (
                <motion.div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  initial="hidden" animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.04, delayChildren: prefersReducedMotion ? 0 : 0.05 } },
                  }}>
                  {notifs.map((n) => (
                    <motion.div key={n.id}
                      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                      className="px-5 py-4 flex items-start gap-3.5 cursor-pointer active:opacity-80 transition-opacity"
                      style={{ background: !n.read ? 'rgba(200,146,74,0.05)' : 'transparent' }}
                      onClick={async () => {
                        if (!n.read) await markOneReadMutation.mutateAsync(n.id);
                        if (!n.action_url) return;
                        if (/^https?:\/\//.test(n.action_url)) { window.location.href = n.action_url; return; }
                        setOpen(false);
                        router.push(n.action_url);
                      }}
                    >
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: 'rgba(200,146,74,0.1)', border: '1px solid rgba(200,146,74,0.15)' }}>
                        {n.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.read ? 'font-semibold' : ''}`}
                          style={{ color: !n.read ? 'var(--text-cream)' : 'var(--text-dim)' }}>
                          {n.title}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>{n.body}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: 'rgba(180,160,100,0.5)' }}>
                          {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--brand-primary)' }} />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  ) : null;

  // ── Pill ──────────────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        <Link href="/login"
          className="px-4 py-2 rounded-full text-xs font-semibold transition"
          style={{ background: 'rgba(28,26,22,0.85)', border: '1px solid rgba(200,146,74,0.2)', color: 'var(--text-dim)', backdropFilter: 'blur(12px)' }}>
          Sign in
        </Link>
        <Link href="/signup"
          className="px-4 py-2 rounded-full text-xs font-semibold transition"
          style={{ background: 'rgba(200,146,74,0.15)', border: '1px solid rgba(200,146,74,0.3)', color: 'var(--brand-primary)', backdropFilter: 'blur(12px)' }}>
          Join Free
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">

        {/* Bell */}
        <button
          onClick={handleBellClick}
          aria-label="Notifications"
          className="relative w-12 h-12 rounded-full flex items-center justify-center transition"
          style={{ color: 'rgba(200,146,74,0.80)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: 'var(--brand-primary)', color: '#1c1c1a' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {unreadCount === 0 && pushConfigured && permission !== 'granted' && !isIosSafariNonPwa && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{
                background: 'rgba(230,150,60,0.9)',
                boxShadow: '0 0 0 3px rgba(200,146,74,0.2)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </button>

        {/* Avatar */}
        <Link href="/profile"
          className="relative flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, rgba(51,51,48,0.98), rgba(43,43,40,0.94))',
            border: avatarUrl ? '2px solid rgba(200,146,74,0.70)' : '1.5px solid rgba(200,146,74,0.35)',
            boxShadow: avatarUrl ? '0 0 0 3px rgba(200,146,74,0.15)' : 'none',
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile" fill sizes="48px" className="object-cover" />
          ) : (
            <span className="text-sm font-bold" style={{ color: 'var(--brand-primary-strong)' }}>
              {userInitials}
            </span>
          )}
        </Link>
      </div>

      {notificationSheet}
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function NotificationsEmptyState({ userId, onNotificationSent }: { userId: string; onNotificationSent: () => void }) {
  const [sending, setSending] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    all_ok: boolean;
    fail_count: number;
    next_steps: string[];
    checks: Record<string, { ok: boolean; detail: string }>;
  } | null>(null);

  async function sendTest() {
    if (!userId || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? 'Could not send test notification'); return; }
      toast.success(data.push_targets > 0 ? 'Test sent — check bell and browser 🔔' : 'Test notification added to bell 🔔');
      onNotificationSent();
    } catch {
      toast.error('Could not reach notification service');
    } finally {
      setSending(false);
    }
  }

  async function runDiagnostics() {
    if (diagnosing) return;
    setDiagnosing(true);
    try {
      const res = await fetch('/api/notifications/diagnostics');
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) { toast.error('Diagnostics failed to run'); return; }
      setDiagResult(data);
      // If the diagnostic inserted a test notification, refresh the list
      if (data.checks?.db_insert_test?.ok) onNotificationSent();
    } catch {
      toast.error('Could not reach diagnostics');
    } finally {
      setDiagnosing(false);
    }
  }

  return (
    <div className="flex flex-col items-start px-5 py-8 gap-5">
      {/* Header */}
      <div className="flex flex-col items-center w-full text-center gap-3">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
          style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.15)' }}>
          🪔
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-cream)' }}>All quiet for now</p>
          <p className="text-sm mt-1 leading-relaxed max-w-[260px] mx-auto" style={{ color: 'var(--text-dim)' }}>
            Festival alerts, morning sadhana reminders, and streak nudges will appear here.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 w-full">
        <button onClick={sendTest} disabled={sending}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition disabled:opacity-50"
          style={{ background: 'rgba(200,146,74,0.1)', border: '1px solid rgba(200,146,74,0.22)', color: 'var(--brand-primary-strong)' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {sending ? 'Sending…' : 'Send a test notification'}
        </button>

        <button onClick={runDiagnostics} disabled={diagnosing}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {diagnosing ? 'Checking pipeline…' : 'Why am I not getting notifications?'}
        </button>
      </div>

      {/* Diagnostics result */}
      {diagResult && (
        <div className="w-full rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${diagResult.all_ok ? 'rgba(106,184,122,0.25)' : 'rgba(200,100,74,0.25)'}` }}>
          {/* Summary bar */}
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ background: diagResult.all_ok ? 'rgba(106,184,122,0.08)' : 'rgba(200,100,74,0.08)' }}>
            <span className="text-base">{diagResult.all_ok ? '✅' : '⚠️'}</span>
            <p className="text-xs font-semibold" style={{ color: diagResult.all_ok ? '#6ab87a' : '#e87a5a' }}>
              {diagResult.all_ok
                ? 'Everything is configured correctly'
                : `${diagResult.fail_count} issue${diagResult.fail_count !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Check list */}
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {Object.entries(diagResult.checks).map(([key, { ok, detail }]) => (
              <div key={key} className="px-4 py-2.5 flex items-start gap-2.5">
                <span className="text-xs mt-0.5 flex-shrink-0">{ok ? '✓' : '✗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide mb-0.5"
                    style={{ color: ok ? 'rgba(106,184,122,0.8)' : 'rgba(230,120,80,0.85)' }}>
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] leading-[1.5]" style={{ color: 'var(--text-dim)' }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Next steps */}
          {!diagResult.all_ok && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.12)' }}>
              <p className="text-[10.5px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgba(200,146,74,0.6)' }}>
                Fix these first
              </p>
              {diagResult.next_steps.map((step, i) => (
                <p key={i} className="text-[11px] leading-[1.6]" style={{ color: 'var(--text-dim)' }}>
                  • {step}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
