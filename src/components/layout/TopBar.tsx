'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery, useNotificationsRealtime } from '@/hooks/useNotifications';
import { syncOneSignalContext, loginToOneSignal, isOneSignalConfigured, getPermissionState, getPlayerId, requestNotificationPermission } from '@/lib/onesignal';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';

const titles: Record<string, TranslationKey> = {
  '/guest':         'explore',
  '/home':          'welcomeTitle',
  '/mandali':       'navMandali',
  '/vichaar-sabha': 'navMandali',
  '/tirtha-map':    'tirtha',
  '/bhakti':        'bhakti',
  '/pathshala':     'navPathshala',
  '/kul':           'navKul',
  '/profile':       'navHome', // or profile if added
};

const PUSH_PROMPT_DISMISS_KEY = 'sanatana-push-prompt-dismissed-until';
const PUSH_PROMPT_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const QUICK_LINKS = [
  { href: '/bhakti',     label: 'Bhakti',  icon: 'heart' as SacredIconName },
  { href: '/tirtha-map', label: 'Tirtha',  icon: 'location' as SacredIconName },
] as const;

const shellTint = {
  background: 'linear-gradient(135deg, var(--card-bg), var(--card-bg))',
  borderColor: 'rgba(212, 166, 70, 0.18)',
};

export default function TopBar({
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
}: {
  userId:   string;
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
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = useRef(createClient()).current;
  const prefersReducedMotion = useReducedMotion();
  const pushConfigured = isOneSignalConfigured();
  const homeHref = isGuest ? '/guest' : '/home';
  const wantsAnyNotifications = Boolean(
    wantsFestivalReminders || wantsShlokaReminders || wantsCommunityNotifications || wantsFamilyNotifications
  );

  const [open,       setOpen]       = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [pushPromptDismissedUntil, setPushPromptDismissedUntil] = useState<number | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  // iOS Safari without "Add to Home Screen" cannot receive web push (iOS 16.4+ PWA only).
  // Detect this early so we swap the prompt copy and hide the broken "Enable now" button.
  const [isIosSafariNonPwa, setIsIosSafariNonPwa] = useState(false);
  // Portal target — set client-side only to avoid SSR mismatch.
  // Rendering the sheet into document.body means it's never inside the sticky
  // header element, so the header's CSS transform cannot affect fixed positioning.
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  const notificationsQuery  = useNotificationsQuery(userId);
  const notifs              = notificationsQuery.data ?? [];
  useNotificationsRealtime(userId);
  const markOneReadMutation = useMarkNotificationReadMutation(userId);
  const markAllReadMutation = useMarkAllNotificationsReadMutation(userId);

  useEffect(() => { setPortalTarget(document.body); }, []);

  useEffect(() => {
    setPermission(getPermissionState());
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(PUSH_PROMPT_DISMISS_KEY);
    setPushPromptDismissedUntil(stored ? Number(stored) : null);

    // Detect iOS Safari running outside a PWA (Add to Home Screen).
    // On those devices, Notification.requestPermission() and OneSignal both silently fail.
    // The user must first install the PWA before push will work.
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

  // ── Notification sheet (portal) ───────────────────────────────────────────────
  // Must live outside <header> because any CSS transform on a parent breaks
  // position:fixed, causing the sheet to scroll with the page instead of sitting
  // at the bottom of the viewport.
  const notificationSheet = portalTarget ? createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            style={{ zIndex: 9998 }}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Sheet */}
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.9 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(200,146,74,0.25)' }} />
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-semibold text-base text-[color:var(--brand-ink)]">{t('notifications')}</p>
                {notifs.length > 0 && (
                  <p className="text-[11px] text-[color:var(--brand-muted)] mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} ${t('unread')}` : t('allCaughtUp')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                    style={{ background: 'rgba(200,146,74,0.12)', color: 'var(--brand-primary-strong)', border: '1px solid rgba(200,146,74,0.2)' }}
                  >
                    {t('markAllRead')}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)]"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  aria-label="Close"
                >
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
                  <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
                    {isIosSafariNonPwa
                      ? 'Install the app to get notifications'
                      : permission === 'denied'
                        ? 'Notifications blocked in browser'
                        : 'Enable push notifications'}
                  </p>
                  <p className="text-xs text-[color:var(--brand-muted)] mt-1 leading-relaxed">
                    {isIosSafariNonPwa
                      ? 'iOS only delivers push notifications to installed apps. Tap Share → Add to Home Screen, then open Shoonaya from your home screen.'
                      : permission === 'denied'
                        ? 'Open your browser/OS settings and allow notifications for this site to receive reminders.'
                        : wantsAnyNotifications
                          ? 'Receive festival alerts, Nitya reminders, and streak nudges on your device.'
                          : 'Turn on reminder types in Profile settings first, then enable push here.'}
                  </p>

                  {/* iOS Safari non-PWA: show install steps, no button (requestPermission silently fails) */}
                  {isIosSafariNonPwa && (
                    <div className="mt-2.5 flex flex-col gap-1">
                      <p className="text-[11px] text-[color:var(--brand-muted)]">
                        1. Tap <span className="font-semibold text-[color:var(--brand-ink)]">Share</span> (□↑) in the Safari toolbar
                      </p>
                      <p className="text-[11px] text-[color:var(--brand-muted)]">
                        2. Tap <span className="font-semibold text-[color:var(--brand-ink)]">Add to Home Screen</span>
                      </p>
                      <p className="text-[11px] text-[color:var(--brand-muted)]">
                        3. Open Shoonaya from your Home Screen — then enable notifications
                      </p>
                      <button
                        onClick={dismissPushPromptForNow}
                        className="self-start text-xs font-semibold mt-1 text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition"
                      >
                        Remind me later
                      </button>
                    </div>
                  )}

                  {/* Normal browsers: standard permission request */}
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
                        <button
                          onClick={dismissPushPromptForNow}
                          className="text-xs font-semibold text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition"
                        >
                          Remind me later
                        </button>
                      )}
                    </div>
                  )}

                  {!isIosSafariNonPwa && permission !== 'denied' && !wantsAnyNotifications && (
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="inline-flex mt-2 text-xs font-semibold"
                      style={{ color: 'var(--brand-primary-strong)' }}
                    >
                      Open notification settings →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Notification list — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notifs.length === 0 ? (
                <NotificationsEmptyState userId={userId} onNotificationSent={() => notificationsQuery.refetch()} />
              ) : (
                <motion.div
                  className="divide-y"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.04, delayChildren: prefersReducedMotion ? 0 : 0.05 } },
                  }}
                >
                  {notifs.map((n) => (
                    <motion.div
                      key={n.id}
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
                        <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-[color:var(--brand-ink)]' : 'text-[color:var(--brand-muted)]'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-[color:var(--brand-muted)] mt-1 leading-relaxed">{n.body}</p>
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

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="glass-nav max-w-2xl mx-auto px-4 h-14 rounded-[1.65rem] flex items-center gap-2" style={shellTint}>

          {/* Left — logo + quick-links */}
          <Link href={homeHref} className="inline-flex flex-shrink-0">
            <BrandMark size="sm" />
          </Link>

          {/* Quick-access links — next to logo, not right-side */}
          {!isGuest && (
            <div className="overflow-x-auto no-scrollbar flex-shrink-0">
              <div className="flex items-center gap-1" style={{ width: 'max-content' }}>
                {QUICK_LINKS.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex h-7 items-center justify-center rounded-full px-3 text-xs font-semibold transition whitespace-nowrap"
                      style={{
                        background: active ? 'rgba(200,146,74,0.18)' : 'rgba(200,146,74,0.07)',
                        border: `1px solid ${active ? 'rgba(200,146,74,0.32)' : 'rgba(200,146,74,0.12)'}`,
                        color: active ? 'var(--brand-primary-strong)' : 'var(--brand-muted)',
                      }}
                    >
                      <SacredIcon name={item.icon} size={12} className="mr-1.5" />
                      {t(item.label.toLowerCase() as any)}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right — bell + avatar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isGuest ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="type-micro hover:text-[color:var(--brand-ink)] transition">{t('signIn')}</Link>
                <Link
                  href="/signup"
                  className="glass-button-secondary px-4 py-1.5 rounded-full hover:opacity-90 transition type-body"
                  style={{ color: 'var(--brand-primary-strong)' }}
                >
                  {t('joinFree')}
                </Link>
              </div>
            ) : (
              <>
                {/* Bell */}
                <div className="relative">
                  <button
                    onClick={handleBellClick}
                    aria-label="Notifications"
                    className="w-9 h-9 rounded-full transition flex items-center justify-center relative text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary-strong)]"
                    style={{ background: 'rgba(212, 166, 70, 0.08)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span
                        className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-[#1c1c1a]"
                        style={{ background: 'var(--brand-primary)' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Avatar — 38px, gold ring, photo if uploaded */}
                <Link
                  href="/profile"
                  className="relative flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    width: 38,
                    height: 38,
                    background: 'linear-gradient(135deg, var(--card-bg), rgba(43,43,40,0.94))',
                    border: avatarUrl && !avatarFailed ? '2px solid rgba(200,146,74,0.55)' : '1.5px solid rgba(200,146,74,0.22)',
                    boxShadow: avatarUrl && !avatarFailed ? '0 0 0 1px rgba(200,146,74,0.15)' : 'none',
                  }}
                >
                  {avatarUrl && !avatarFailed ? (
                    <Image
                      key={avatarUrl}
                      src={avatarUrl}
                      alt="Profile"
                      fill
                      sizes="38px"
                      className="object-cover"
                      unoptimized
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-[color:var(--brand-primary-strong)]">
                      {userInitials}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notification sheet rendered into document.body via portal */}
      {notificationSheet}
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function NotificationsEmptyState({ userId, onNotificationSent }: { userId: string; onNotificationSent: () => void }) {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);

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

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center gap-5">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
        style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.15)' }}>
        <SacredIcon name="bell" size={26} />
      </div>
      <div>
        <p className="text-base font-semibold text-[color:var(--brand-ink)]">{t('allQuiet')}</p>
        <p className="text-sm text-[color:var(--brand-muted)] mt-1.5 leading-relaxed max-w-[260px] mx-auto">
          Festival alerts, morning sadhana reminders, and streak nudges will show up here.
        </p>
      </div>
      <button
        onClick={sendTest}
        disabled={sending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition disabled:opacity-50"
        style={{ background: 'rgba(200,146,74,0.1)', border: '1px solid rgba(200,146,74,0.22)', color: 'var(--brand-primary-strong)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {sending ? 'Sending…' : 'Send a test notification'}
      </button>
    </div>
  );
}
