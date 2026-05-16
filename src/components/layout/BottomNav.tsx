'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, MessageCircle, Sun, Users, Radio, BookOpen, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  isGuest?: boolean;
}

// ── Quick Actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '📿', label: 'japa',         href: '/japa'        },
  { icon: '🧠', label: 'quizMastery',  href: '/quiz'        },
  { icon: '💬', label: 'vichaar',      href: '/mandali'     },
  { icon: '🤝', label: 'sevaHub',      href: '/seva'        },
  { icon: '🔆', label: 'sadhanaPulse', href: '/my-progress' },
];
const GUEST_QUICK_ACTIONS = [
  { icon: '✨', label: 'join',    href: '/signup'  },
  { icon: '🔍', label: 'explore', href: '/guest'   },
  { icon: '💬', label: 'vichaar', href: '/mandali' },
];

// Glass tokens — computed per-theme
function useGlass(isDark: boolean) {
  return {
    bg:     isDark ? 'rgba(10, 8, 6, 0.72)'      : 'rgba(255, 252, 248, 0.80)',
    border: isDark ? 'rgba(255, 255, 255, 0.08)'  : 'rgba(0, 0, 0, 0.05)',
    blur:   'blur(40px) saturate(200%)',
    shadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
  };
}

// ── Quick-action menu ─────────────────────────────────────────────────────────
function FloatingQuickMenu({
  open, onClose, isGuest, isDark,
}: { open: boolean; onClose: () => void; isGuest: boolean; isDark: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();
  const router  = useRouter();
  const actions = isGuest ? GUEST_QUICK_ACTIONS : QUICK_ACTIONS;
  const reversed = [...actions].reverse();
  const GLASS = useGlass(isDark);
  const labelColor = isDark ? 'rgba(245, 220, 160, 0.92)' : 'rgba(80, 45, 8, 0.88)';
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence mode="popLayout">
      {open && (
        <>
          {/* Backdrop for outside-click */}
          <motion.div
            className="fixed inset-0 z-[54]"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease }}
          />

          {/* Quick-action pills — anchored above the + button */}
          <motion.div
            className="fixed bottom-[90px] right-4 z-[55] flex flex-col-reverse items-end gap-2"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.97 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion   ? undefined : { opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease }}
          >
            {reversed.map((action, i) => (
              <motion.button
                key={action.href}
                onClick={() => { onClose(); router.push(action.href); }}
                className="flex items-center gap-3 rounded-full px-5 py-3 cursor-pointer"
                style={{
                  background:           GLASS.bg,
                  border:               `1px solid ${GLASS.border}`,
                  backdropFilter:       GLASS.blur,
                  WebkitBackdropFilter: GLASS.blur,
                  boxShadow:            GLASS.shadow,
                }}
                whileTap={{ scale: 0.94 }}
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10, scale: 0.94 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0,  scale: 1    }}
                exit={prefersReducedMotion    ? undefined : { opacity: 0, y: 6,  scale: 0.96 }}
                transition={{ duration: 0.22, delay: prefersReducedMotion ? 0 : i * 0.04, ease }}
              >
                <span className="text-[1.4rem] leading-none">{action.icon}</span>
                <span className="text-[14px] font-bold" style={{ color: labelColor, letterSpacing: '-0.01em' }}>
                  {t(action.label as any)}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main BottomNav ─────────────────────────────────────────────────────────────
export default function BottomNav({ isGuest = false }: Props) {
  const pathname = usePathname();
  const prefRM   = useReducedMotion();
  const { t }    = useLanguage();
  const { resolvedTheme } = useThemePreference();
  const isDark   = resolvedTheme === 'dark';
  const GLASS    = useGlass(isDark);
  const [quickOpen, setQuickOpen] = useState(false);

  // Signal AI FAB to hide/show when quick menu toggles
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ai-fab-visibility', { detail: { hidden: quickOpen } }));
  }, [quickOpen]);

  const memberNavItems = [
    { href: '/pathshala',   label: t('navPathshala'), mobileLabel: t('study'),   icon: BookOpen      },
    { href: '/nitya-karma', label: t('morningRoutine'), mobileLabel: 'Nitya',    icon: Sun           },
    { href: '/bhakti',      label: t('bhakti'),       mobileLabel: 'Bhakti',     icon: Heart         },
    { href: '/kul',         label: t('kul'),          mobileLabel: t('kul'),     icon: Shield        },
    { href: '/mandali',     label: t('navMandali'),   mobileLabel: t('circle'),  icon: MessageCircle },
  ];
  const guestNavItems = [
    { href: '/mandali', label: 'Mandali', mobileLabel: t('circle'), icon: MessageCircle },
  ];

  const navItems  = isGuest ? guestNavItems : memberNavItems;
  const isHome    = pathname === '/home' || pathname === '/guest';
  const ease      = [0.22, 1, 0.36, 1] as const;
  const dur       = prefRM ? 0 : 0.25;

  return (
    <>
      <FloatingQuickMenu
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        isGuest={isGuest}
        isDark={isDark}
      />

      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-[env(safe-area-inset-bottom,16px)] mb-3 pointer-events-none"
      >
        <div className="max-w-2xl mx-auto flex justify-center">
          <div
            className="relative flex items-center h-[64px] rounded-[2rem] w-full pointer-events-auto"
            style={{
              background:           GLASS.bg,
              border:               `1px solid ${GLASS.border}`,
              backdropFilter:       GLASS.blur,
              WebkitBackdropFilter: GLASS.blur,
              boxShadow:            GLASS.shadow,
            }}
          >

            {/* ── Home anchor button ───────────────────────────────────── */}
            <div className="pl-2 flex-shrink-0">
              <Link href={isGuest ? '/guest' : '/home'} aria-label="Home">
                <motion.div
                  className="relative w-[50px] h-[50px] rounded-full flex items-center justify-center"
                  whileTap={{ scale: 0.88 }}
                  style={{
                    background: isHome
                      ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))'
                      : 'rgba(200,146,74,0.10)',
                    border:    isHome ? 'none' : '1px solid rgba(200,146,74,0.20)',
                    boxShadow: isHome ? '0 4px 14px rgba(200,146,74,0.28)' : 'none',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke={isHome ? '#1a1610' : 'rgba(200,146,74,0.75)'}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  {isHome && !prefRM && (
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ border: '1.5px solid rgba(200,146,74,0.35)' }}
                      animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </motion.div>
              </Link>
            </div>

            {/* ── Center nav items ─────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-around">
              {navItems.map(({ href, label, mobileLabel, icon: Icon }) => {
                const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} className="relative group">
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      className={cn(
                        'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-colors',
                        active ? 'text-[color:var(--brand-primary)]' : 'text-[color:var(--brand-muted)]'
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="bottom-nav-active-shell"
                          className="absolute inset-0 rounded-[1rem]"
                          style={{ background: 'rgba(200,146,74,0.12)', border: '1px solid rgba(200,146,74,0.20)' }}
                          transition={prefRM ? { duration: 0 } : { duration: dur, ease }}
                        />
                      )}
                      <div className="relative z-10 w-[38px] h-[38px] flex items-center justify-center">
                        <motion.div animate={prefRM ? undefined : { scale: active ? 1.1 : 1 }}
                          transition={{ duration: dur, ease }}>
                          <Icon
                            size={24}
                            strokeWidth={active ? 2.4 : 1.8}
                            style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }}
                          />
                        </motion.div>
                      </div>
                      <span
                        className="type-tab relative z-10 text-[10px] font-bold leading-none"
                        style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }}
                      >
                        <span className="sm:hidden">{mobileLabel ?? label}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </span>
                      {active && (
                        <motion.div
                          layoutId="active-dot"
                          className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[color:var(--brand-primary)]"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* ── Right: + quick-actions button ────────────────────────── */}
            <div className="pr-2 flex-shrink-0">
              <motion.button
                onClick={() => setQuickOpen(v => !v)}
                aria-label="Quick actions"
                whileTap={{ scale: 0.88 }}
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center"
                style={{
                  background: quickOpen ? 'rgba(200,146,74,0.20)' : 'rgba(200,146,74,0.10)',
                  border:     '1px solid rgba(200,146,74,0.28)',
                  boxShadow:  quickOpen ? '0 0 0 4px rgba(200,146,74,0.10)' : 'none',
                }}
              >
                <motion.svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(200,146,74,0.95)" strokeWidth="2.4" strokeLinecap="round"
                  animate={quickOpen ? { rotate: 45 } : { rotate: 0 }}
                  transition={{ duration: dur, ease }}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5"  y1="12" x2="19" y2="12" />
                </motion.svg>
              </motion.button>
            </div>

          </div>
        </div>
      </nav>
    </>
  );
}
