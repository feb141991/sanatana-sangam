'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, BookOpen, Users, Home, Plus, X, CalendarDays, MapPin, User, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  isGuest?: boolean;
}

// ── Quick Actions for Sacred Menu ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '📿', label: 'japa',         href: '/bhakti/mala', desc: 'Chant your ishta mantra' },
  { icon: '🔆', label: 'morningRoutine', href: '/nitya-karma', desc: 'Complete daily rhythms' },
  { icon: '❤️', label: 'kul',          href: '/kul',         desc: 'Family lineage sadhana' },
  { icon: '👥', label: 'mandali',      href: '/mandali',     desc: 'Gather with your dharma circle' },
  { icon: '🤝', label: 'sevaHub',      href: '/seva',        desc: 'Support sacred causes' },
  { icon: '📈', label: 'sadhanaPulse', href: '/my-progress', desc: 'Track your spiritual progress' },
  { icon: '🧠', label: 'quizMastery',  href: '/home?focus=quiz', desc: 'Test your dharmic knowledge' },
];

const GUEST_QUICK_ACTIONS = [
  { icon: '✨', label: 'join',    href: '/signup',  desc: 'Create your profile' },
  { icon: '🔍', label: 'explore', href: '/guest',   desc: 'Explore the dashboard' },
  { icon: '💬', label: 'vichaar', href: '/mandali', desc: 'Read local discussions' },
];

// Glass tokens — computed per-theme
function useGlass(isDark: boolean) {
  return {
    bg:     isDark ? 'rgba(12, 10, 8, 0.90)'      : 'rgba(255, 252, 248, 0.94)',
    border: isDark ? 'rgba(250, 238, 218, 0.16)' : 'rgba(133, 79, 11, 0.14)',
    blur:   'blur(18px) saturate(150%)',
    shadow: isDark
      ? '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.06)'
      : '0 12px 40px rgba(180,120,40,0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
  };
}

// ── Floating Quick Menu (Sacred Action Grid) ──────────────────────────────────
function FloatingQuickMenu({
  open, onClose, isGuest, isDark,
}: { open: boolean; onClose: () => void; isGuest: boolean; isDark: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();
  const router  = useRouter();
  const actions = isGuest ? GUEST_QUICK_ACTIONS : QUICK_ACTIONS;
  const GLASS = useGlass(isDark);
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop for outside-click */}
          <motion.div
            className="fixed inset-0 z-[9005] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
          />

          {/* Quick-action Grid Overlay — anchored beautifully above bottom nav */}
          <motion.div
            className="fixed left-4 right-4 z-[9010] max-w-2xl mx-auto rounded-[2.2rem] p-6 border"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
              background:           GLASS.bg,
              borderColor:          GLASS.border,
              backdropFilter:       GLASS.blur,
              WebkitBackdropFilter: GLASS.blur,
              boxShadow:            GLASS.shadow,
            }}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24, scale: 0.96 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion   ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease }}
          >
            {/* Title / Motif */}
            <div className="flex items-center justify-between mb-5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059]">
                {isGuest ? 'Explore Shoonaya' : 'Sacred Sadhana Actions'}
              </span>
              <button 
                onClick={onClose}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={14} className="text-[var(--text-dim)]" />
              </button>
            </div>

            {/* Grid layout */}
            <div className={cn("grid gap-3", isGuest ? "grid-cols-1" : "grid-cols-2")}>
              {actions.map((action, i) => (
                <motion.button
                  key={action.href}
                  onClick={() => { onClose(); router.push(action.href); }}
                  className="flex items-center gap-4 rounded-2xl p-4 text-left border border-black/[0.03] dark:border-white/[0.03] bg-black/[0.02] dark:bg-white/[0.01] hover:bg-[#C5A059]/5 dark:hover:bg-[#C5A059]/10 hover:border-[#C5A059]/30 transition-all"
                  whileTap={{ scale: 0.97 }}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: prefersReducedMotion ? 0 : i * 0.03 }}
                >
                  <span className="text-2xl select-none">{action.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold theme-ink leading-tight">
                      {t(action.label as any)}
                    </h4>
                    <p className="text-[10px] text-[var(--text-dim)] leading-tight mt-0.5">
                      {action.desc}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
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
  const [collapsed, setCollapsed] = useState(false);
  const lastScrollYRef = useRef(0);

  const activeHome = pathname === '/home' || pathname === '/guest';
  const activePathshala = pathname === '/pathshala' || pathname.startsWith('/pathshala/');
  const activeBhakti = pathname === '/bhakti' || pathname.startsWith('/bhakti/');
  const activeMandali = pathname === '/mandali' || pathname.startsWith('/mandali/');
  const activeKul = pathname === '/kul' || pathname.startsWith('/kul/');
  const activePanchang = pathname === '/panchang' || pathname.startsWith('/vrat/');
  const activeTirtha = pathname === '/tirtha-map' || pathname === '/live-darshan';
  const activeProfile = pathname === '/profile' || pathname === '/my-progress' || pathname.startsWith('/my-progress/');
  const activeMessages = pathname === '/messages' || pathname.startsWith('/vichaar-sabha/');

  useEffect(() => {
    setQuickOpen(false);
    setCollapsed(!(pathname === '/home' || pathname === '/guest'));
    if (typeof window !== 'undefined') {
      lastScrollYRef.current = window.scrollY;
    }
  }, [pathname]);

  // Collapse into a left-side page pill on downward scroll, expand on intentional upward scroll.
  useEffect(() => {
    let ready = false;
    const timer = window.setTimeout(() => {
      ready = true;
      lastScrollYRef.current = window.scrollY;
    }, 350);

    const onScroll = () => {
      if (!ready || quickOpen) return;

      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;
      const diff = currentY - previousY;

      if (Math.abs(diff) < 8) return;

      // Collapse only when scrolling down past 80px
      if (diff > 0 && currentY > 80) {
        setCollapsed(true);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [quickOpen]);

  // Signal AI chat FAB to hide/show
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ai-fab-visibility', { detail: { hidden: quickOpen } }));
  }, [quickOpen]);

  const ease = [0.22, 1, 0.36, 1] as const;
  const navDur = prefRM ? 0 : 0.46;
  const contentDur = prefRM ? 0 : 0.24;
  const shouldShowBar = !collapsed;
  const collapsedBg = isDark
    ? 'rgba(24, 20, 15, 0.62)'
    : 'rgba(255, 252, 246, 0.72)';
  const collapsedBorder = isDark
    ? 'rgba(250, 238, 218, 0.22)'
    : 'rgba(133, 79, 11, 0.18)';
  const collapsedShadow = isDark
    ? '0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -18px 34px rgba(197,160,89,0.08)'
    : '0 18px 42px rgba(97,67,34,0.12), inset 0 1px 0 rgba(255,255,255,0.74), inset 0 -18px 34px rgba(197,160,89,0.10)';

  function collapsedIcon() {
    const iconSize = 21;
    const colorClass = 'text-[#C5A059] drop-shadow-[0_0_8px_rgba(197,160,89,0.52)]';

    if (activeHome) return <Home size={iconSize} className={colorClass} />;
    if (activePathshala) return <BookOpen size={iconSize} className={colorClass} />;
    if (activeBhakti) return <Heart size={iconSize} className={colorClass} />;
    if (activeKul) return <Users size={iconSize} className={colorClass} />;
    if (activeMandali) return <MessageCircle size={iconSize} className={colorClass} />;
    if (activePanchang) return <CalendarDays size={iconSize} className={colorClass} />;
    if (activeTirtha) return <MapPin size={iconSize} className={colorClass} />;
    if (activeProfile) return <User size={iconSize} className={colorClass} />;
    if (activeMessages) return <MessageCircle size={iconSize} className={colorClass} />;
    return <Sparkles size={iconSize} className={colorClass} />;
  }

  function expandCollapsedNav() {
    setCollapsed(false);
  }

  return (
    <>
      <FloatingQuickMenu
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        isGuest={isGuest}
        isDark={isDark}
      />

      {/* Premium bottom navigation: expanded dock or persistent collapsed page pill */}
      <nav
        aria-label="Primary app navigation"
        className="fixed z-[9000] border pointer-events-auto flex items-center"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          left: shouldShowBar ? '50%' : 'max(16px, env(safe-area-inset-left))',
          transform: shouldShowBar ? 'translateX(-50%)' : 'translateX(0)',
          width: shouldShowBar ? 'min(calc(100% - 24px), 640px)' : '58px',
          height: shouldShowBar ? '70px' : '58px',
          borderRadius: shouldShowBar ? '2.2rem' : '9999px',
          overflow: shouldShowBar ? 'visible' : 'hidden',
          background:           shouldShowBar ? GLASS.bg : collapsedBg,
          borderColor:          shouldShowBar ? GLASS.border : collapsedBorder,
          backdropFilter:       GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          boxShadow:            shouldShowBar ? GLASS.shadow : collapsedShadow,
          transition: prefRM
            ? 'none'
            : `left ${navDur}s cubic-bezier(0.22,1,0.36,1), transform ${navDur}s cubic-bezier(0.22,1,0.36,1), width ${navDur}s cubic-bezier(0.22,1,0.36,1), height ${navDur}s cubic-bezier(0.22,1,0.36,1), border-radius ${navDur}s cubic-bezier(0.22,1,0.36,1), background-color ${navDur}s cubic-bezier(0.22,1,0.36,1), border-color ${navDur}s cubic-bezier(0.22,1,0.36,1), box-shadow ${navDur}s cubic-bezier(0.22,1,0.36,1)`,
        }}
      >
        <AnimatePresence mode="wait">
          {shouldShowBar ? (
            <motion.div
              key="expanded-nav"
              initial={prefRM ? undefined : { opacity: 0, scale: 0.98 }}
              animate={prefRM ? undefined : { opacity: 1, scale: 1 }}
              exit={prefRM ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: contentDur || 0.01, ease }}
              className="flex-1 flex items-center justify-between w-full h-full px-2"
            >
              {isGuest ? (
                // ── Guest Layout (3-tabs) ──
                <div className="flex-1 flex items-center justify-around w-full">
                  <Link href="/guest" className="flex-1 flex flex-col items-center">
                    <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                      <Home size={22} className={activeHome ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                      <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activeHome ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                        Home
                      </span>
                    </motion.div>
                  </Link>

                  <div className="relative -mt-6">
                    <motion.button
                      onClick={() => setQuickOpen(v => !v)}
                      aria-label="Quick Actions"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))',
                        boxShadow: '0 8px 24px rgba(200, 146, 74, 0.35)',
                      }}
                    >
                      <Plus size={24} className="text-[#1c1812]" />
                    </motion.button>
                  </div>

                  <Link href="/mandali" className="flex-1 flex flex-col items-center">
                    <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                      <Users size={22} className={activeMandali ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                      <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activeMandali ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                        Mandali
                      </span>
                    </motion.div>
                  </Link>
                </div>
              ) : (
                // ── Premium Member Layout (5-tabs) ──
                <div className="flex-1 flex items-center w-full justify-between">
                  {/* Tab 1: Home */}
                  <Link href="/home" className="flex-1 flex flex-col items-center py-2 relative">
                    <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                      <Home size={22} className={activeHome ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                      <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activeHome ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                        Home
                      </span>
                      {activeHome && (
                        <motion.div layoutId="active-nav-dot" className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C5A059]" />
                      )}
                    </motion.div>
                  </Link>

                  {/* Tab 2: Pathshala */}
                  <Link href="/pathshala" className="flex-1 flex flex-col items-center py-2 relative">
                    <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                      <BookOpen size={22} className={activePathshala ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                      <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activePathshala ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                        Study
                      </span>
                      {activePathshala && (
                        <motion.div layoutId="active-nav-dot" className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C5A059]" />
                      )}
                    </motion.div>
                  </Link>

                  {/* Tab 3: Central Golden Actions FAB */}
                  <div className="flex-1 flex justify-center relative -mt-6">
                    <motion.button
                      onClick={() => setQuickOpen(v => !v)}
                      aria-label="Sacred Actions"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))',
                        boxShadow: '0 8px 24px rgba(200, 146, 74, 0.35)',
                      }}
                    >
                      <motion.div
                        animate={quickOpen ? { rotate: 45 } : { rotate: 0 }}
                        transition={{ duration: contentDur, ease }}
                      >
                        <Plus size={24} className="text-[#1c1812]" />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Tab 4: Bhakti */}
                  <Link href="/bhakti" className="flex-1 flex flex-col items-center py-2 relative">
                    <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                      <Heart size={22} className={activeBhakti ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                      <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activeBhakti ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                        Bhakti
                      </span>
                      {activeBhakti && (
                        <motion.div layoutId="active-nav-dot" className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C5A059]" />
                      )}
                    </motion.div>
                  </Link>

                  {/* Tab 5: Kul */}
                  <Link href="/kul" className="flex-1 flex flex-col items-center py-2 relative">
                    <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                      <Users size={22} className={activeKul ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                      <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activeKul ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                        Kul
                      </span>
                      {activeKul && (
                        <motion.div layoutId="active-nav-dot" className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C5A059]" />
                      )}
                    </motion.div>
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="collapsed-nav"
              type="button"
              aria-label="Expand navigation"
              onClick={expandCollapsedNav}
              initial={prefRM ? undefined : { opacity: 0, scale: 0.78 }}
              animate={prefRM ? undefined : { opacity: 1, scale: 1 }}
              exit={prefRM ? undefined : { opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.30, ease }}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
            >
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,0.34),transparent_38%),radial-gradient(circle_at_70%_78%,rgba(197,160,89,0.16),transparent_48%)]" />
              <span className="pointer-events-none absolute inset-[7px] rounded-full border border-white/15" />
              <span className="relative z-10">{collapsedIcon()}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
