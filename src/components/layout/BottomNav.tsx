'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BookOpen, Heart, Users, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface Props {
  libraryLabel?: string;
  libraryMobileLabel?: string;
  isGuest?: boolean;
}

// ── Quick Actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '💬', label: 'Vichaar',   href: '/vichaar-sabha' },
  { icon: '🙏', label: 'Bhakti',    href: '/bhakti'        },
  { icon: '🪔', label: 'Sanskar',   href: '/kul/sanskara'  },
  { icon: '🛕', label: 'Tirtha',    href: '/tirtha-map'    },
  { icon: '📊', label: 'Progress',  href: '/my-progress'   },
];
const GUEST_QUICK_ACTIONS = [
  { icon: '✨', label: 'Join',    href: '/signup'        },
  { icon: '🔍', label: 'Explore', href: '/guest'         },
  { icon: '💬', label: 'Vichaar', href: '/vichaar-sabha' },
];

// Glass tokens — computed per-theme inside the component (see useGlass below)
function useGlass(isDark: boolean) {
  return {
    bg:           isDark ? 'rgba(18, 14, 8, 0.72)'       : 'rgba(255, 251, 244, 0.82)',
    border:       isDark ? 'rgba(200, 146, 74, 0.18)'    : 'rgba(160, 100, 30, 0.18)',
    blur:         'blur(28px) saturate(180%)',
    shadow:       isDark
      ? '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,220,140,0.06)'
      : '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
    shadowSubtle: isDark ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.06)',
  };
}

// ── Quick-action menu ─────────────────────────────────────────────────────────
function FloatingQuickMenu({
  open, onClose, isGuest, isDark,
}: { open: boolean; onClose: () => void; isGuest: boolean; isDark: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const router  = useRouter();
  const actions = isGuest ? GUEST_QUICK_ACTIONS : QUICK_ACTIONS;
  const reversed = [...actions].reverse();
  const GLASS = useGlass(isDark);
  const labelColor = isDark ? 'rgba(245, 220, 160, 0.92)' : 'rgba(80, 45, 8, 0.88)';

  const menuEase = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence mode="popLayout">
      {open && (
        <>
          {/* Thin backdrop for outside-click */}
          <motion.div
            className="fixed inset-0 z-[54]"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: menuEase }}
          />

          {/* Quick-action pills — anchored above the + button */}
          <motion.div
            className="fixed bottom-[90px] right-4 z-[55] flex flex-col-reverse items-end gap-2"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.26, ease: menuEase }}
          >
            {reversed.map((action, i) => {
              const delay = prefersReducedMotion ? 0 : i * 0.042;
              return (
                <motion.button
                  key={action.href}
                  onClick={() => { onClose(); router.push(action.href); }}
                  className="flex items-center gap-3 rounded-full px-4 py-2.5 cursor-pointer"
                  style={{
                    background:          GLASS.bg,
                    border:              `1px solid ${GLASS.border}`,
                    backdropFilter:      GLASS.blur,
                    WebkitBackdropFilter: GLASS.blur,
                    boxShadow:           GLASS.shadow,
                  }}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.94 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0,  scale: 1    }}
                  exit={prefersReducedMotion    ? undefined : { opacity: 0, y: 8,  scale: 0.96 }}
                  transition={{ duration: 0.26, delay, ease: menuEase }}
                >
                  <span className="text-[1.7rem] leading-none">{action.icon}</span>
                  <span className="text-[13px] font-semibold"
                    style={{ color: labelColor, letterSpacing: '-0.01em' }}>
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main BottomNav ─────────────────────────────────────────────────────────────
export default function BottomNav({
  libraryLabel = 'Pathshala',
  libraryMobileLabel = 'Pathshala',
  isGuest = false,
}: Props) {
  const pathname  = usePathname();
  const prefRM    = useReducedMotion();
  const { t }     = useLanguage();
  const { resolvedTheme } = useThemePreference();
  const isDark    = resolvedTheme === 'dark';
  const GLASS     = useGlass(isDark);
  const [quickOpen, setQuickOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  // ── Collapse on scroll-down, restore on scroll-up ────────────────────────
  const lastY   = useRef(0);
  const accumRef = useRef(0);
  useEffect(() => {
    function onScroll() {
      const y     = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 2) { lastY.current = y; return; }
      accumRef.current += delta;
      if (y <= 48) {
        setScrolled(false);
        accumRef.current = 0;
      } else if (accumRef.current > 20) {
        setScrolled(true);
        accumRef.current = 0;
      } else if (accumRef.current < -16) {
        setScrolled(false);
        accumRef.current = 0;
      }
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close quick menu whenever nav collapses
  useEffect(() => { if (scrolled) setQuickOpen(false); }, [scrolled]);

  // Signal AI FAB to hide/show when quick menu toggles
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ai-fab-visibility', { detail: { hidden: quickOpen } }));
  }, [quickOpen]);

  const memberNavItems = [
    { href: '/nitya-karma', label: 'Nitya',        mobileLabel: 'Nitya',           icon: Sun           },
    { href: '/pathshala',     label: libraryLabel,    mobileLabel: libraryMobileLabel, icon: BookOpen      },
    { href: '/kul',         label: t('navKul'),     mobileLabel: t('navKul'),        icon: Heart         },
    { href: '/mandali',     label: t('navMandali'), mobileLabel: t('navMandali'),    icon: Users         },
  ];
  const guestNavItems = [
    { href: '/vichaar-sabha', label: 'Vichaar', mobileLabel: 'Vichaar', icon: Users },
  ];

  const navItems   = isGuest ? guestNavItems : memberNavItems;
  const isHome     = pathname === '/home' || pathname === '/guest';
  const activeItem = navItems.find(({ href }) => href !== '/home' && pathname.startsWith(href));

  // Button for the left anchor (home icon, or current-section icon when collapsed)
  const anchorHref      = scrolled && activeItem ? activeItem.href : (isGuest ? '/guest' : '/home');
  const anchorActive    = scrolled && activeItem ? true : isHome;
  const AnchorIcon      = scrolled && activeItem
    ? <activeItem.icon size={26} strokeWidth={2.3} style={{ color: anchorActive ? '#1a1610' : 'rgba(200,146,74,0.8)' }} />
    : (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={anchorActive ? '#1a1610' : 'rgba(200,146,74,0.75)'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );

  const ease = [0.22, 1, 0.36, 1] as const;
  const dur  = prefRM ? 0 : 0.28;

  return (
    <>
      <FloatingQuickMenu open={quickOpen} onClose={() => setQuickOpen(false)} isGuest={isGuest} isDark={isDark} />

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-pb pointer-events-none">
        <div className="max-w-2xl mx-auto">

          {/* ── Outer wrapper — animates shadow away when collapsed ──────── */}
          <motion.div
            className="relative flex items-center h-[68px] rounded-[2rem] pointer-events-auto"
            animate={{
              boxShadow: scrolled
                ? '0 2px 8px rgba(0,0,0,0.08)'
                : GLASS.shadow,
              // When collapsed the pill shrinks to just wrap the anchor button
              width:      scrolled ? 68 : '100%',
              background: scrolled ? 'transparent' : GLASS.bg,
              borderColor: scrolled ? 'transparent' : GLASS.border,
              backdropFilter: scrolled ? 'none' : GLASS.blur,
            }}
            transition={{ duration: dur, ease }}
            style={{
              border:              scrolled ? 'none' : `1px solid ${GLASS.border}`,
              backdropFilter:      GLASS.blur,
              WebkitBackdropFilter: GLASS.blur,
            }}
          >

            {/* ── Anchor button (Home / current-section) ───────────────── */}
            <div className="pl-2 flex-shrink-0">
              <Link href={anchorHref}
                aria-label={activeItem && scrolled ? activeItem.label : 'Home'}
                className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all"
                style={{
                  background: anchorActive
                    ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))'
                    : 'rgba(200,146,74,0.10)',
                  border:     anchorActive ? 'none' : '1px solid rgba(200,146,74,0.20)',
                  boxShadow:  anchorActive ? '0 2px 12px rgba(200,146,74,0.20)' : 'none',
                }}
              >
                {AnchorIcon}
                {anchorActive && !prefRM && (
                  <motion.span className="absolute inset-0 rounded-full"
                    style={{ border: '1.5px solid rgba(200,146,74,0.35)' }}
                    animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </Link>
            </div>

            {/* ── Center: nav items — slide away + fade on collapse ────── */}
            <motion.div
              className="flex-1 flex items-center justify-around overflow-hidden"
              animate={{ x: scrolled ? -28 : 0, opacity: scrolled ? 0 : 1 }}
              transition={{ duration: dur, ease }}
              style={{ pointerEvents: scrolled ? 'none' : 'auto' }}
            >
              {navItems.map(({ href, label, mobileLabel, icon: Icon }) => {
                const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}
                    className={cn(
                      'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                      active ? 'text-[color:var(--brand-primary)]' : 'text-[color:var(--brand-muted)]'
                    )}>
                    {active && (
                      <motion.span
                        layoutId="bottom-nav-active-shell"
                        className="absolute inset-0 rounded-[1rem]"
                        style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.12)' }}
                        transition={prefRM ? { duration: 0 } : { duration: 0.3, ease }}
                      />
                    )}
                    <div className="relative z-10 w-10 h-10 flex items-center justify-center">
                      <motion.div animate={prefRM ? undefined : { scale: active ? 1.08 : 1 }}
                        transition={{ duration: dur, ease }}>
                        <Icon size={26} strokeWidth={active ? 2.2 : 1.8}
                          style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }} />
                      </motion.div>
                    </div>
                    <span className="type-tab relative z-10 text-[11px]"
                      style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }}>
                      <span className="sm:hidden">{mobileLabel ?? label}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                  </Link>
                );
              })}
            </motion.div>

            {/* ── Right: + button — slide away + fade on collapse ─────── */}
            <motion.div className="pr-2 flex-shrink-0"
              animate={{ x: scrolled ? 28 : 0, opacity: scrolled ? 0 : 1 }}
              transition={{ duration: dur, ease }}
              style={{ pointerEvents: scrolled ? 'none' : 'auto' }}>
              <button
                onClick={() => setQuickOpen(v => !v)}
                aria-label="Quick actions"
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all"
                style={{
                  background: quickOpen ? 'rgba(200,146,74,0.18)' : 'rgba(200,146,74,0.10)',
                  border:     '1px solid rgba(200,146,74,0.24)',
                  boxShadow:  quickOpen ? '0 0 0 4px rgba(200,146,74,0.10)' : 'none',
                }}>
                <motion.svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(200,146,74,0.90)" strokeWidth="2.2" strokeLinecap="round"
                  animate={quickOpen ? { rotate: 45 } : { rotate: 0 }}
                  transition={{ duration: dur, ease }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5"  y1="12" x2="19" y2="12" />
                </motion.svg>
              </button>
            </motion.div>

          </motion.div>
        </div>
      </nav>
    </>
  );
}
