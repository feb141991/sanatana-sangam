'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery, useNotificationsRealtime } from '@/hooks/useNotifications';
import {
  requestNotificationPermission,
  getPlayerId,
  getPermissionState,
  isOneSignalConfigured,
  loginToOneSignal,
  syncOneSignalContext,
} from '@/lib/onesignal';

const titles: Record<string, string> = {
  '/guest':         'Explore',
  '/home':          'Sanatana Sangam',
  '/mandali':       'My Mandali',
  '/vichaar-sabha': 'Vichaar Sabha',
  '/tirtha-map':    'Tirtha Map',
  '/bhakti':        'Sahaj Bhakti',
  '/library':       'Parampara Pathshala',
  '/kul':           'Kul',
  '/profile':       'My Profile',
};

const PUSH_PROMPT_DISMISS_KEY = 'sanatana-push-prompt-dismissed-until';
const PUSH_PROMPT_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
// Quick-access links shown in top bar — pages NOT already in bottom nav
// Bottom nav covers: AI Chat, Home, Pathshala, Kul, Mandali
// Top bar covers: Bhakti, Panchang, Nitya, Tirtha (secondary destinations)
const QUICK_LINKS = [
  { href: '/bhakti',      label: 'Bhakti',   emoji: '✨' },
  { href: '/panchang',    label: 'Panchang', emoji: '🪔' },
  { href: '/nitya-karma', label: 'Nitya',    emoji: '🌅' },
  { href: '/tirtha-map',  label: 'Tirtha',   emoji: '🗺️' },
] as const;

const shellTint = {
  background: 'linear-gradient(135deg, rgba(51, 51, 48, 0.98), rgba(43, 43, 40, 0.96))',
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
  const title = Object.entries(titles).find(([route]) => (
    pathname === route || pathname.startsWith(`${route}/`)
  ))?.[1] ?? 'Sanatana Sangam';
  const supabase = useRef(createClient()).current;
  const prefersReducedMotion = useReducedMotion();
  const pushConfigured = isOneSignalConfigured();
  const homeHref = isGuest ? '/guest' : '/home';
  const wantsAnyNotifications = Boolean(
    wantsFestivalReminders
    || wantsShlokaReminders
    || wantsCommunityNotifications
    || wantsFamilyNotifications
  );

  const [open,       setOpen]       = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isHidden, setIsHidden] = useState(false);
  const [pushPromptDismissedUntil, setPushPromptDismissedUntil] = useState<number | null>(null);
  const lastScrollYRef = useRef(0);
  const scrollAccumulatorRef = useRef(0);
  const notificationsQuery = useNotificationsQuery(userId);
  const notifs = notificationsQuery.data ?? [];
  // Live push: any INSERT on notifications for this user invalidates the cache.
  useNotificationsRealtime(userId);
  const markOneReadMutation = useMarkNotificationReadMutation(userId);
  const markAllReadMutation = useMarkAllNotificationsReadMutation(userId);

  // Load initial permission state
  useEffect(() => {
    setPermission(getPermissionState());
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(PUSH_PROMPT_DISMISS_KEY);
    setPushPromptDismissedUntil(stored ? Number(stored) : null);
  }, []);

  useEffect(() => {
    if (!pushConfigured || !userId) return;
    loginToOneSignal(userId);
  }, [pushConfigured, userId]);

  useEffect(() => {
    if (!pushConfigured || !userId) return;
    syncOneSignalContext({
      tradition,
      city,
      countryCode,
      wantsFestivalReminders,
      wantsShlokaReminders,
      wantsCommunityNotifications,
      wantsFamilyNotifications,
    });
  }, [
    city,
    countryCode,
    pushConfigured,
    tradition,
    userId,
    wantsCommunityNotifications,
    wantsFamilyNotifications,
    wantsFestivalReminders,
    wantsShlokaReminders,
  ]);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;
      const delta = currentY - previousY;
      const absDelta = Math.abs(delta);

      if (open) {
        setIsHidden(false);
        scrollAccumulatorRef.current = 0;
      } else if (currentY <= 32) {
        setIsHidden(false);
        scrollAccumulatorRef.current = 0;
      } else if (absDelta < 2) {
        lastScrollYRef.current = currentY;
        return;
      } else {
        scrollAccumulatorRef.current += delta;

        if (scrollAccumulatorRef.current > 18 && currentY > 96) {
          setIsHidden(true);
          scrollAccumulatorRef.current = 0;
        } else if (scrollAccumulatorRef.current < -14) {
          setIsHidden(false);
          scrollAccumulatorRef.current = 0;
        }
      }

      lastScrollYRef.current = currentY;
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const shouldSuppressPrompt = Boolean(
    pushPromptDismissedUntil
    && Number.isFinite(pushPromptDismissedUntil)
    && pushPromptDismissedUntil > Date.now()
  );
  const shouldShowPushPrompt =
    pushConfigured
    && permission !== 'granted'
    && (permission === 'denied' || (wantsAnyNotifications && !shouldSuppressPrompt));

  function handleBellClick() {
    const opening = !open;
    setOpen(opening);
    setIsHidden(false);
    // Refetch on open so the list is always fresh even if Realtime missed a push.
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

  return (
    <header className={`sticky top-0 z-40 px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHidden ? '-translate-y-[120%]' : 'translate-y-0'}`}>
      <div className="glass-nav max-w-2xl mx-auto px-4 h-14 rounded-[1.65rem] flex items-center justify-between" style={shellTint}>

        {/* Left — logo only (no redundant title) */}
        <Link href={homeHref} className="inline-flex">
          <BrandMark size="sm" />
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2">

          {isGuest ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="type-micro hover:text-[color:var(--brand-ink)] transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="glass-button-secondary px-4 py-1.5 rounded-full hover:opacity-90 transition type-body"
                style={{ color: 'var(--brand-primary-strong)' }}
              >
                Join Free
              </Link>
            </div>
          ) : (
            <>
              {/* Quick-access links — emoji icon pills for pages not in bottom nav */}
              <div className="flex items-center gap-1">
                {QUICK_LINKS.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      title={item.label}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-base transition"
                      style={{
                        background: active
                          ? 'rgba(212,166,70,0.18)'
                          : 'rgba(212,166,70,0.07)',
                        border: `1px solid ${active ? 'rgba(212,166,70,0.32)' : 'rgba(212,166,70,0.12)'}`,
                      }}
                    >
                      {item.emoji}
                    </Link>
                  );
                })}
              </div>

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

                <AnimatePresence>
                {open && (
                  <motion.div
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10, scale: 0.985 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: 6, scale: 0.985 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="glass-panel-strong absolute right-0 top-11 w-80 rounded-3xl overflow-hidden z-50 origin-top-right"
                  >

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                      <span className="font-semibold text-sm text-[color:var(--brand-ink)]">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: 'var(--brand-primary)' }}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Permission prompt — shown when not yet granted */}
                    {shouldShowPushPrompt && (
                      <div className="glass-panel mx-3 mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2.5">
                        <span className="text-lg mt-0.5">🔔</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[color:var(--brand-ink)]">
                            {permission === 'denied'
                              ? 'Notifications blocked'
                              : 'Enable push notifications'}
                          </p>
                          <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-snug">
                            {permission === 'denied'
                              ? 'Allow notifications in your browser settings to receive the reminder types you have enabled.'
                              : wantsAnyNotifications
                                ? 'Get the reminder types you have enabled, in your local time and outside quiet hours.'
                                : 'Choose reminder types in Profile first, then enable browser push here.'}
                          </p>
                          {permission !== 'denied' && wantsAnyNotifications && (
                            <div className="flex items-center gap-3 mt-1.5">
                              <button
                                onClick={async () => {
                                  const granted = await requestNotificationPermission();
                                  setPermission(getPermissionState());
                                  if (granted) {
                                    toast.success('Notifications enabled 🙏');
                                    const playerId = await getPlayerId();
                                    if (playerId && userId) {
                                      await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', userId);
                                    }
                                  }
                                }}
                                className="glass-button-primary text-xs font-semibold px-3 py-1 rounded-full transition"
                              >
                                Enable
                              </button>
                              {permission === 'default' && (
                                <button
                                  onClick={dismissPushPromptForNow}
                                  className="text-xs font-semibold text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition"
                                >
                                  Later
                                </button>
                              )}
                            </div>
                          )}
                          {permission !== 'denied' && !wantsAnyNotifications && (
                            <Link
                              href="/profile"
                              className="inline-flex mt-1.5 text-xs font-semibold hover:underline"
                              style={{ color: 'var(--brand-primary-strong)' }}
                            >
                              Open notification preferences
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notification list */}
                    <motion.div
                      className="divide-y divide-gray-50 max-h-72 overflow-y-auto"
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: {
                          transition: {
                            staggerChildren: prefersReducedMotion ? 0 : 0.035,
                            delayChildren: prefersReducedMotion ? 0 : 0.04,
                          },
                        },
                      }}
                    >
                      {notifs.length === 0 ? (
                        <div className="px-4 py-8 text-center space-y-3">
                          <p className="text-3xl">🪔</p>
                          <div>
                            <p className="text-sm font-medium text-[color:var(--brand-ink)]">All quiet for now</p>
                            <p className="text-xs text-[color:var(--brand-muted)] mt-1">
                              Reminders and updates will appear here.
                            </p>
                          </div>
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <motion.div
                            key={n.id}
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
                            }}
                            className={`px-4 py-3 flex items-start gap-3 transition cursor-pointer ${
                              !n.read ? 'bg-[color:var(--brand-primary-soft)]/70 hover:bg-[color:var(--brand-primary-soft)]' : 'hover:bg-white/[0.03]'
                            }`}
                            onClick={async () => {
                              if (!n.read) {
                                await markOneReadMutation.mutateAsync(n.id);
                              }
                              if (!n.action_url) return;
                              if (/^https?:\/\//.test(n.action_url)) {
                                window.location.href = n.action_url;
                                return;
                              }
                              setOpen(false);
                              router.push(n.action_url);
                            }}
                          >
                            <span className="text-lg mt-0.5 flex-shrink-0">{n.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-[color:var(--brand-ink)]' : 'text-[color:var(--brand-muted)]'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-snug">{n.body}</p>
                              <p className="text-[10px] text-[color:var(--brand-muted)]/80 mt-0.5">
                                {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--brand-primary)' }} />
                            )}
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              {/* Avatar */}
              <Link
                href="/profile"
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[color:var(--brand-primary-strong)] text-[11px] font-bold overflow-hidden shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(51, 51, 48, 0.98), rgba(43, 43, 40, 0.94))',
                  border: '1px solid rgba(212, 166, 70, 0.16)',
                }}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profile" fill sizes="32px" className="object-cover" />
                ) : (
                  userInitials
                )}
              </Link>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            initial={prefersReducedMotion ? undefined : { opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
