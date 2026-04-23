'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GraduationCap, Heart, Users, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  libraryLabel?: string;
  libraryMobileLabel?: string;
  isGuest?: boolean;
}

// ── Quick Actions panel ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '📿', label: 'Japa',         href: '/bhakti/mala',  desc: 'Begin your maala rounds' },
  { icon: '🙏', label: 'Bhakti',       href: '/bhakti',       desc: 'Chant, pray, reflect' },
  { icon: '📖', label: 'Scripture',    href: '/library',      desc: 'Open Pathshala' },
  { icon: '☀️', label: 'Nitya Karma',  href: '/nitya-karma',  desc: 'Daily ritual checklist' },
  { icon: '🛕', label: 'Tirtha',       href: '/tirtha-map',   desc: 'Sacred places near you' },
  { icon: '🤖', label: 'Dharma AI',    href: '/ai-chat',      desc: 'Ask Dharma Mitra' },
];

const GUEST_QUICK_ACTIONS = [
  { icon: '✨', label: 'Join',         href: '/signup',        desc: 'Create your dharma home' },
  { icon: '🔍', label: 'Explore',      href: '/guest',         desc: 'See what awaits' },
  { icon: '💬', label: 'Vichaar',      href: '/vichaar-sabha', desc: 'Forum discussions' },
];

function QuickActionsPanel({ open, onClose, isGuest }: { open: boolean; onClose: () => void; isGuest: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const actions = isGuest ? GUEST_QUICK_ACTIONS : QUICK_ACTIONS;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(8,6,4,0.72)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-3 pb-4"
          onClick={e => e.stopPropagation()}
          initial={prefersReducedMotion ? undefined : { y: 40, opacity: 0 }}
          animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 32, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.1, 0.64, 1] }}
        >
          {/* Panel */}
          <div
            className="max-w-2xl mx-auto rounded-[2rem] p-5 space-y-4"
            style={{
              background: 'linear-gradient(165deg, rgba(38,32,22,0.99), rgba(26,22,14,0.99))',
              border: '1px solid rgba(200,146,74,0.18)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.45)',
            }}
          >
            {/* Handle + header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="w-8 h-[3px] rounded-full mb-3" style={{ background: 'rgba(200,146,74,0.25)' }} />
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: 'rgba(200,146,74,0.55)' }}
                >
                  Quick Actions
                </p>
                <p
                  style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-cream)', letterSpacing: '-0.01em', marginTop: '2px' }}
                >
                  Begin a practice
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition motion-press"
                style={{ background: 'rgba(200,146,74,0.1)', border: '1px solid rgba(200,146,74,0.18)' }}
              >
                <X size={14} style={{ color: 'var(--text-muted-warm)' }} />
              </button>
            </div>

            {/* Action grid */}
            <div className="grid grid-cols-3 gap-2">
              {actions.map(({ icon, label, href, desc }) => (
                <button
                  key={href}
                  onClick={() => { onClose(); router.push(href); }}
                  className="rounded-[1.3rem] p-3 flex flex-col items-center gap-1.5 text-center transition motion-press"
                  style={{
                    background: 'rgba(200,146,74,0.06)',
                    border: '1px solid rgba(200,146,74,0.1)',
                  }}
                >
                  <span className="text-2xl leading-none">{icon}</span>
                  <span className="text-[11.5px] font-semibold" style={{ color: 'var(--text-cream)' }}>
                    {label}
                  </span>
                  <span className="text-[9.5px] leading-[1.3]" style={{ color: 'var(--text-dim)' }}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main BottomNav ─────────────────────────────────────────────────────────────
export default function BottomNav({ libraryLabel = 'Pathshala', libraryMobileLabel = 'Pathshala', isGuest = false }: Props) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();
  const [quickOpen, setQuickOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Reduce nav opacity slightly on scroll
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const memberNavItems = [
    { href: '/nitya-karma', label: 'Nitya',             mobileLabel: 'Nitya',            icon: Sun           },
    { href: '/library',     label: libraryLabel,         mobileLabel: libraryMobileLabel, icon: GraduationCap },
    { href: '/kul',         label: t('navKul'),          mobileLabel: t('navKul'),         icon: Heart         },
    { href: '/mandali',     label: t('navMandali'),      mobileLabel: t('navMandali'),     icon: Users         },
  ];

  const guestNavItems = [
    { href: '/vichaar-sabha', label: 'Vichaar', mobileLabel: 'Vichaar', icon: Users },
  ];

  const navItems = isGuest ? guestNavItems : memberNavItems;
  const isHome   = pathname === '/home' || pathname === '/guest';

  return (
    <>
      <QuickActionsPanel open={quickOpen} onClose={() => setQuickOpen(false)} isGuest={isGuest} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 safe-area-pb"
        style={{ transition: 'opacity 0.3s ease', opacity: scrolled ? 0.88 : 1 }}
      >
        <div
          className="glass-nav max-w-2xl mx-auto flex items-center h-16 rounded-[1.75rem] gap-1 px-1.5"
          style={{ transition: 'backdrop-filter 0.3s ease' }}
        >

          {/* ── Left: circular Home button ─────────────────────────────────── */}
          <Link
            href={isGuest ? '/guest' : '/home'}
            aria-label="Home"
            className="relative flex-shrink-0 w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all motion-press"
            style={{
              background: isHome
                ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))'
                : 'rgba(200,146,74,0.10)',
              border: isHome ? 'none' : '1px solid rgba(200,146,74,0.2)',
              boxShadow: isHome ? '0 4px 20px rgba(200,146,74,0.28)' : 'none',
            }}
          >
            {/* House SVG */}
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={isHome ? '#1a1610' : 'rgba(200,146,74,0.75)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {/* Animated active ring */}
            {isHome && !prefersReducedMotion && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: '1.5px solid rgba(200,146,74,0.35)' }}
                animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </Link>

          {/* ── Center: nav items ─────────────────────────────────────────── */}
          <div className="flex-1 flex items-center justify-around">
            {navItems.map(({ href, label, mobileLabel, icon: Icon }) => {
              const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                    active ? 'text-[color:var(--brand-primary)]' : 'text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary-strong)]'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active-shell"
                      className="absolute inset-x-0 inset-y-0 rounded-[1rem]"
                      style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.18)' }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }
                      }
                    />
                  )}
                  <div className="relative z-10 w-7 h-7 flex items-center justify-center">
                    <motion.div
                      animate={prefersReducedMotion ? undefined : { scale: active ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.3 : 1.8}
                        style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }}
                      />
                    </motion.div>
                  </div>
                  <span
                    className="type-tab relative z-10 text-[9.5px]"
                    style={{ color: active ? 'var(--brand-primary)' : 'var(--text-dim)' }}
                  >
                    <span className="sm:hidden">{mobileLabel ?? label}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ── Right: circular Plus button ───────────────────────────────── */}
          <button
            onClick={() => setQuickOpen(true)}
            aria-label="Quick actions"
            className="relative flex-shrink-0 w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all motion-press"
            style={{
              background: 'rgba(200,146,74,0.07)',
              border: '1px solid rgba(200,146,74,0.25)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
            }}
          >
            <motion.svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(200,146,74,0.8)"
              strokeWidth="2.2" strokeLinecap="round"
              animate={quickOpen ? { rotate: 45 } : { rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </motion.svg>
          </button>
        </div>
      </nav>
    </>
  );
}
