'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';
import { LayoutGrid, X as CloseIcon, Home, CalendarDays, BookOpen, CircleDot, Users, MapPin, User } from 'lucide-react';
import {
  requestNotificationPermission,
  getPlayerId,
  getPermissionState,
  isOneSignalConfigured,
  loginToOneSignal,
  syncOneSignalContext,
} from '@/lib/onesignal';
import type { Notification } from '@/types/database';

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
const MVP_MENU_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/panchang', label: 'Panchang', icon: CalendarDays },
  { href: '/library', label: 'Pathshala', icon: BookOpen },
  { href: '/bhakti/mala', label: 'Mala', icon: CircleDot },
  { href: '/mandali', label: 'Mandali', icon: Users },
  { href: '/tirtha-map', label: 'Tirtha', icon: MapPin },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

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
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [notifs,     setNotifs]     = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isHidden, setIsHidden] = useState(false);
  const [pushPromptDismissedUntil, setPushPromptDismissedUntil] = useState<number | null>(null);
  const lastScrollYRef = useRef(0);
  const scrollAccumulatorRef = useRef(0);

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

  // Fetch real notifications from DB
  const fetchNotifs = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifs((data as Notification[]) ?? []);
  }, [supabase, userId]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;
      const delta = currentY - previousY;
      const absDelta = Math.abs(delta);

      if (open || menuOpen) {
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
  }, [menuOpen, open]);

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

  async function handleBellClick() {
    setMenuOpen(false);
    setOpen((prev) => !prev);
    setIsHidden(false);
  }

  function handleMenuToggle() {
    setOpen(false);
    setMenuOpen((prev) => !prev);
    setIsHidden(false);
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
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <header className={`sticky top-0 z-40 px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHidden ? '-translate-y-[120%]' : 'translate-y-0'}`}>
      <div className="glass-nav max-w-2xl mx-auto px-4 h-14 rounded-[16px] flex items-center justify-between bg-white">

        {/* Left — logo + page title */}
        <div className="flex items-center gap-2">
          <Link href={homeHref} className="inline-flex">
            <BrandMark size="sm" />
          </Link>
          <span className="font-display font-semibold text-[color:var(--brand-ink)] text-sm sm:text-base">{title}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {isGuest ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-gray-500 hover:text-gray-900 transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="glass-button-secondary px-4 py-1.5 text-sm font-semibold rounded-full hover:opacity-90 transition"
                style={{ color: 'var(--brand-primary-strong)' }}
              >
                Join Free
              </Link>
            </div>
          ) : (
            <>
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  aria-label="Open app menu"
                className="h-9 rounded-full px-3 border transition flex items-center gap-2 text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary-strong)]"
                style={{ borderColor: 'rgba(0,0,0,0.15)', background: '#fff' }}
              >
                  <LayoutGrid size={15} />
                  <span className="text-xs font-semibold hidden sm:inline">Menu</span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10, scale: 0.985 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: 6, scale: 0.985 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="glass-panel-strong absolute left-0 top-11 w-72 rounded-[16px] overflow-hidden z-50 origin-top-left bg-white"
                    >
                      <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                        <span className="font-semibold text-sm text-[color:var(--brand-ink)]">Sanatana Sangam</span>
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="w-8 h-8 rounded-full transition flex items-center justify-center text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary-strong)]"
                          style={{ background: 'var(--saffron-50)' }}
                          aria-label="Close menu"
                        >
                          <CloseIcon size={15} />
                        </button>
                      </div>
                      <motion.div
                        className="grid grid-cols-2 gap-2 p-3"
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: {},
                          show: {
                            transition: {
                              staggerChildren: prefersReducedMotion ? 0 : 0.04,
                              delayChildren: prefersReducedMotion ? 0 : 0.03,
                            },
                          },
                        }}
                      >
                        {MVP_MENU_ITEMS.map((item) => {
                          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                          const Icon = item.icon;
                          return (
                          <motion.div
                            key={item.href}
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
                            }}
                          >
                            <Link
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className="block rounded-[8px] border px-3 py-3 transition active:scale-[0.97]"
                              style={
                                active
                                  ? {
                                      borderColor: 'var(--saffron-100)',
                                      background: 'var(--saffron-50)',
                                    }
                                  : {
                                      borderColor: 'rgba(0,0,0,0.15)',
                                      background: '#fff',
                                    }
                              }
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--saffron-50)] text-[color:var(--saffron-800)]">
                                  <Icon size={16} />
                                </span>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: active ? 'var(--saffron-800)' : 'var(--brand-ink)' }}
                                >
                                  {item.label}
                                </p>
                              </div>
                            </Link>
                          </motion.div>
                        )})}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bell */}
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  aria-label="Notifications"
                    className="w-9 h-9 rounded-full transition flex items-center justify-center relative text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary-strong)]"
                    style={{ background: 'var(--saffron-50)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] text-[color:var(--saffron-900)] font-medium px-1"
                      style={{ background: 'var(--saffron-100)' }}
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
                    className="glass-panel-strong absolute right-0 top-11 w-80 rounded-[16px] overflow-hidden z-50 origin-top-right bg-white"
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
                      <div className="glass-panel mx-3 mt-3 px-3 py-2.5 rounded-[8px] flex items-start gap-2.5 bg-white">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--saffron-50)] text-[color:var(--saffron-800)] mt-0.5">
                          <CalendarDays size={16} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">
                            {permission === 'denied'
                              ? 'Notifications blocked'
                              : 'Enable push notifications'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
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
                                className="glass-button-primary text-xs font-semibold px-3 py-1 rounded-full text-white transition"
                              >
                                Enable
                              </button>
                              {permission === 'default' && (
                                <button
                                  onClick={dismissPushPromptForNow}
                                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
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
                          <div>
                            <p className="text-sm font-medium text-gray-700">All quiet for now</p>
                            <p className="text-xs text-gray-400 mt-1">
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
                              !n.read ? 'bg-[color:var(--brand-primary-soft)]/70 hover:bg-[color:var(--brand-primary-soft)]' : 'hover:bg-black/[0.02]'
                            }`}
                            onClick={() => {
                              if (!n.read) {
                                supabase.from('notifications').update({ read: true }).eq('id', n.id);
                                setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                              }
                              setMenuOpen(false);
                              if (!n.action_url) return;
                              if (/^https?:\/\//.test(n.action_url)) {
                                window.location.href = n.action_url;
                                return;
                              }
                              setOpen(false);
                              router.push(n.action_url);
                            }}
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--saffron-50)] text-[color:var(--saffron-800)] flex-shrink-0">
                              <CalendarDays size={16} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
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
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,248,245,0.94))',
                  border: '1px solid rgba(124, 58, 45, 0.1)',
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
        {(open || menuOpen) && (
          <motion.div
            className="fixed inset-0 z-30"
            onClick={() => {
              setOpen(false);
              setMenuOpen(false);
            }}
            initial={prefersReducedMotion ? undefined : { opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
