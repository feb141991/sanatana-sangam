'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GraduationCap, Heart, Users, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  libraryLabel?: string;
  libraryMobileLabel?: string;
  isGuest?: boolean;
}

// ── Quick Actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '📿', label: 'Japa',        href: '/bhakti/mala'   },
  { icon: '💬', label: 'Vichaar',     href: '/vichaar-sabha' },
  { icon: '🕉️', label: 'Sattvic',     href: '/bhakti/zen'    },
  { icon: '🙏', label: 'Bhakti',      href: '/bhakti'        },
  { icon: '📖', label: 'Scripture',   href: '/library'       },
  { icon: '☀️', label: 'Nitya',       href: '/nitya-karma'   },
  { icon: '🪔', label: 'Sanskar',     href: '/kul/sanskara'  },
  { icon: '🛕', label: 'Tirtha',      href: '/tirtha-map'    },
];

const GUEST_QUICK_ACTIONS = [
  { icon: '✨', label: 'Join',        href: '/signup'        },
  { icon: '🔍', label: 'Explore',     href: '/guest'         },
  { icon: '💬', label: 'Vichaar',     href: '/vichaar-sabha' },
];

// ── Floating vertical quick-action pills ──────────────────────────────────────
function FloatingQuickMenu({
  open,
  onClose,
  isGuest,
}: {
  open: boolean;
  onClose: () => void;
  isGuest: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const actions = isGuest ? GUEST_QUICK_ACTIONS : QUICK_ACTIONS;
  // render bottom-to-top: reverse so the first item is highest
  const reversed = [...actions].reverse();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Thin transparent backdrop — just for outside-click */}
          <motion.div
            className="fixed inset-0 z-[54]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          {/* Floating pill stack — anchored above the + button (bottom-right) */}
          <div className="fixed bottom-[90px] right-4 z-[55] flex flex-col-reverse items-end gap-2">
            {reversed.map((action, i) => {
              const delay = prefersReducedMotion ? 0 : i * 0.045;
              return (
                <motion.button
                  key={action.href}
                  onClick={() => { onClose(); router.push(action.href); }}
                  className="flex items-center gap-3 rounded-full px-4 py-3 cursor-pointer motion-press"
                  style={{
                    background: 'rgba(12,8,3,0.90)',
                    border: '1px solid rgba(200,146,74,0.28)',
                    backdropFilter: 'blur(32px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                  }}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.88 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.90 }}
                  transition={{ duration: 0.24, delay, ease: [0.34, 1.1, 0.64, 1] }}
                >
                  <span className="text-[2.3rem] leading-none">{action.icon}</span>
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: 'var(--text-cream)', letterSpacing: '-0.01em' }}
                  >
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
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
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();
  const [quickOpen, setQuickOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Collapse on scroll-down, restore on scroll-up
  const lastScrollYRef = useRef(0);
  const accumRef = useRef(0);
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastScrollYRef.current;
      if (Math.abs(delta) < 2) { lastScrollYRef.current = y; return; }
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
      lastScrollYRef.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const memberNavItems = [
    { href: '/nitya-karma', label: 'Nitya',           mobileLabel: 'Nitya',            icon: Sun           },
    { href: '/library',     label: libraryLabel,       mobileLabel: libraryMobileLabel, icon: GraduationCap },
    { href: '/kul',         label: t('navKul'),        mobileLabel: t('navKul'),         icon: Heart         },
    { href: '/mandali',     label: t('navMandali'),    mobileLabel: t('navMandali'),     icon: Users         },
  ];

  const guestNavItems = [
    { href: '/vichaar-sabha', label: 'Vichaar', mobileLabel: 'Vichaar', icon: Users },
  ];

  const navItems = isGuest ? guestNavItems : memberNavItems;
  const isHome   = pathname === '/home' || pathname === '/guest';

  const navTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <>
      <FloatingQuickMenu
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        isGuest={isGuest}
      />

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-pb pointer-events-none">
        <div className="max-w-2xl mx-auto flex items-center justify-center">

          {/* ── Floating pill — transparent ───────────────────────────────── */}
          <div
            className="relative flex items-center h-[72px] rounded-[2rem] pointer-events-auto"
            style={{
              width: '100%',
              maxWidth: '42rem',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            {/* ── Left: Home button ─────────────────────────────────────── */}
            <div className="pl-2 flex-shrink-0">
              <Link
                href={isGuest ? '/guest' : '/home'}
                aria-label="Home"
                className="relative w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all motion-press"
                style={{
                  background: isHome
                    ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))'
                    : 'rgba(200,146,74,0.09)',
                  border: isHome ? 'none' : '1px solid rgba(200,146,74,0.18)',
                  boxShadow: isHome ? '0 2px 10px rgba(200,146,74,0.15)' : 'none',
                }}
              >
                <svg
                  width="27" height="27" viewBox="0 0 24 24" fill="none"
                  stroke={isHome ? '#1a1610' : 'rgba(200,146,74,0.72)'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {isHome && !prefersReducedMotion && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ border: '1.5px solid rgba(200,146,74,0.35)' }}
                    animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </Link>
            </div>

            {/* ── Center: nav items — slide LEFT on scroll ──────────────── */}
            <motion.div
              className="flex-1 flex items-center justify-around overflow-hidden"
              animate={{
                x:       scrolled ? -32 : 0,
                opacity: scrolled ? 0    : 1,
              }}
                  transition={navTransition}
              style={{ pointerEvents: scrolled ? 'none' : 'auto' }}
            >
              {navItems.map(({ href, label, mobileLabel, icon: Icon }) => {
                const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                      active
                        ? 'text-[color:var(--brand-primary)]'
                        : 'text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary-strong)]'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="bottom-nav-active-shell"
                        className="absolute inset-x-0 inset-y-0 rounded-[1rem]"
                        style={{ background: 'rgba(200,146,74,0.06)', border: '1px solid rgba(200,146,74,0.10)' }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                        }
                      />
                    )}
                    <div className="relative z-10 w-10 h-10 flex items-center justify-center">
                      <motion.div
                        animate={prefersReducedMotion ? undefined : { scale: active ? 1.1 : 1 }}
                        transition={navTransition}
                      >
                        <Icon
                          size={27}
                          strokeWidth={active ? 2.3 : 1.8}
                          style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }}
                        />
                      </motion.div>
                    </div>
                    <span
                      className="type-tab relative z-10 text-[11px]"
                      style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }}
                    >
                      <span className="sm:hidden">{mobileLabel ?? label}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                  </Link>
                );
              })}
            </motion.div>

            {/* ── Right: Plus button — slide RIGHT on scroll ─────────────── */}
            <motion.div
              className="pr-2 flex-shrink-0"
              animate={{
                x:       scrolled ? 32 : 0,
                opacity: scrolled ? 0  : 1,
              }}
              transition={navTransition}
              style={{ pointerEvents: scrolled ? 'none' : 'auto' }}
            >
              <button
                onClick={() => setQuickOpen(v => !v)}
                aria-label="Quick actions"
                className="w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all motion-press"
                style={{
                  background: quickOpen
                    ? 'rgba(200,146,74,0.18)'
                    : 'rgba(200,146,74,0.09)',
                  border: '1px solid rgba(200,146,74,0.22)',
                  boxShadow: quickOpen ? '0 0 0 4px rgba(200,146,74,0.10)' : 'none',
                }}
              >
                <motion.svg
                  width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(200,146,74,0.85)"
                  strokeWidth="2.2" strokeLinecap="round"
                  animate={quickOpen ? { rotate: 45 } : { rotate: 0 }}
                  transition={navTransition}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </motion.svg>
              </button>
            </motion.div>
          </div>

        </div>
      </nav>
    </>
  );
}
