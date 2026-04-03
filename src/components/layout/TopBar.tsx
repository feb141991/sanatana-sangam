'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';
import {
  requestNotificationPermission,
  getPlayerId,
  getPermissionState,
  isOneSignalConfigured,
  loginToOneSignal,
} from '@/lib/onesignal';
import type { Notification } from '@/types/database';

const titles: Record<string, string> = {
  '/guest':         'Explore',
  '/home':          'Sanatana Sangam',
  '/mandali':       'My Mandali',
  '/vichaar-sabha': 'Vichaar Sabha',
  '/tirtha-map':    'Tirtha Map',
  '/bhakti':        'Sahaj Bhakti',
  '/library':       'Parampara Library',
  '/profile':       'My Profile',
};

export default function TopBar({
  userId,
  isGuest = false,
  avatarUrl = null,
  userInitials = 'SS',
}: {
  userId:   string;
  isGuest?: boolean;
  avatarUrl?: string | null;
  userInitials?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const title = Object.entries(titles).find(([route]) => (
    pathname === route || pathname.startsWith(`${route}/`)
  ))?.[1] ?? 'Sanatana Sangam';
  const supabase = createClient();
  const pushConfigured = isOneSignalConfigured();
  const homeHref = isGuest ? '/guest' : '/home';

  const [open,       setOpen]       = useState(false);
  const [notifs,     setNotifs]     = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Load initial permission state
  useEffect(() => {
    setPermission(getPermissionState());
  }, []);

  useEffect(() => {
    if (!pushConfigured || !userId) return;
    loginToOneSignal(userId);
  }, [pushConfigured, userId]);

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
  }, [userId]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  async function handleBellClick() {
    setOpen((prev) => !prev);

    // First-time permission request
    if (pushConfigured && permission === 'default') {
      const granted = await requestNotificationPermission();
      const newState = getPermissionState();
      setPermission(newState);

      if (granted) {
        toast.success('Notifications enabled 🙏');
        // Save player ID to profile for targeted pushes later
        const playerId = await getPlayerId();
        if (playerId && userId) {
          await supabase
            .from('profiles')
            .update({ onesignal_player_id: playerId })
            .eq('id', userId);
        }
      }
    }
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
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="glass-nav max-w-2xl mx-auto px-4 h-14 rounded-[1.65rem] flex items-center justify-between">

        {/* Left — logo + page title */}
        <div className="flex items-center gap-2">
          <Link href={homeHref} className="inline-flex">
            <BrandMark size="sm" />
          </Link>
          <span className="font-display font-semibold text-white text-sm sm:text-base">{title}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {isGuest ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-white/75 hover:text-white transition"
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
              {/* Bell */}
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  aria-label="Notifications"
                  className="w-9 h-9 rounded-full hover:bg-white/12 transition flex items-center justify-center relative"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="white"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke="white"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                      style={{ background: 'var(--orange-accent)' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {open && (
                  <div className="glass-panel-strong absolute right-0 top-11 w-80 rounded-3xl overflow-hidden z-50">

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: 'var(--brand-primary)' }}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Permission prompt — shown when not yet granted */}
                    {pushConfigured && permission !== 'granted' && (
                      <div className="glass-panel mx-3 mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2.5">
                        <span className="text-lg mt-0.5">🔔</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">
                            {permission === 'denied'
                              ? 'Notifications blocked'
                              : 'Enable push notifications'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                            {permission === 'denied'
                              ? 'Allow notifications in your browser settings to receive festival reminders and Mandali updates.'
                              : 'Get festival reminders, Mandali activity, and daily shloka alerts.'}
                          </p>
                          {permission !== 'denied' && (
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
                              className="glass-button-primary mt-1.5 text-xs font-semibold px-3 py-1 rounded-full text-white transition"
                            >
                              Enable
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notification list */}
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-3xl mb-2">🪔</p>
                          <p className="text-sm font-medium text-gray-700">All quiet for now</p>
                          <p className="text-xs text-gray-400 mt-1">Festival reminders and Mandali updates will appear here</p>
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 flex items-start gap-3 transition cursor-pointer ${
                              !n.read ? 'bg-orange-50/20 hover:bg-orange-50/30' : 'hover:bg-white/40'
                            }`}
                            onClick={() => {
                              if (!n.read) {
                                supabase.from('notifications').update({ read: true }).eq('id', n.id);
                                setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
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
                              <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--orange-accent)' }} />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-white/12 border border-white/30 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </Link>
            </>
          )}
        </div>
      </div>

      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}
    </header>
  );
}
