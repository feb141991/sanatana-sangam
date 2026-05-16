'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, BookOpen, Users, Home, Plus, X } from 'lucide-react';
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
    bg:     isDark ? 'rgba(12, 10, 8, 0.82)'      : 'rgba(255, 252, 248, 0.88)',
    border: isDark ? 'rgba(200, 146, 74, 0.18)'  : 'rgba(200, 146, 74, 0.12)',
    blur:   'blur(42px) saturate(210%)',
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
            className="fixed inset-0 z-[54] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
          />

          {/* Quick-action Grid Overlay — anchored beautifully above bottom nav */}
          <motion.div
            className="fixed bottom-[96px] left-4 right-4 z-[55] max-w-2xl mx-auto rounded-[2.2rem] p-6 border"
            style={{
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
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll responsive collapsing
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Collapse on scroll down, reveal on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 70) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      // Always visible near top and bottom
      if (currentScrollY < 30) {
        setIsVisible(true);
      }
      
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (currentScrollY + windowHeight >= docHeight - 80) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Signal AI chat FAB to hide/show
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ai-fab-visibility', { detail: { hidden: quickOpen || !isVisible } }));
  }, [quickOpen, isVisible]);

  const activeHome = pathname === '/home' || pathname === '/guest';
  const activePathshala = pathname === '/pathshala' || pathname.startsWith('/pathshala/');
  const activeBhakti = pathname === '/bhakti' || pathname.startsWith('/bhakti/');
  const activeMandali = pathname === '/mandali' || pathname.startsWith('/mandali/');

  const ease = [0.22, 1, 0.36, 1] as const;
  const dur = prefRM ? 0 : 0.25;

  return (
    <>
      <FloatingQuickMenu
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        isGuest={isGuest}
        isDark={isDark}
      />

      <motion.nav
        className="fixed left-0 right-0 z-[100] px-4 pointer-events-none"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 120 }}
        transition={{ duration: 0.32, ease: [0.25, 0.8, 0.25, 1] }}
        style={{
          bottom: 'max(14px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-2xl mx-auto flex justify-center">
          <div
            className="relative flex items-center h-[68px] rounded-[2.2rem] w-full pointer-events-auto px-2"
            style={{
              background:           GLASS.bg,
              border:               `1px solid ${GLASS.border}`,
              backdropFilter:       GLASS.blur,
              WebkitBackdropFilter: GLASS.blur,
              boxShadow:            GLASS.shadow,
            }}
          >
            {isGuest ? (
              // ── Guest Layout (3-tabs) ───────────────────────────────────────
              <div className="flex-1 flex items-center justify-around w-full">
                {/* Home */}
                <Link href="/guest" className="flex-1 flex flex-col items-center">
                  <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                    <Home size={22} className={activeHome ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                    <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activeHome ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                      Home
                    </span>
                  </motion.div>
                </Link>

                {/* Central Join Button */}
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

                {/* Mandali */}
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
              // ── Premium Member Layout (5-tabs) ─────────────────────────────────
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
                      transition={{ duration: dur, ease }}
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

                {/* Tab 5: Mandali */}
                <Link href="/mandali" className="flex-1 flex flex-col items-center py-2 relative">
                  <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                    <Users size={22} className={activeMandali ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
                    <span className={cn("text-[9px] font-bold mt-1 tracking-wider leading-none", activeMandali ? 'text-[#C5A059]' : 'text-[var(--text-dim)]')}>
                      Circle
                    </span>
                    {activeMandali && (
                      <motion.div layoutId="active-nav-dot" className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C5A059]" />
                    )}
                  </motion.div>
                </Link>

              </div>
            )}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
