'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, BookOpen, Users, Home, MapPin, User, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  isGuest?: boolean;
}

// Glass tokens — computed per-theme
function useGlass(isDark: boolean) {
  return {
    bg:     isDark ? 'rgba(14, 11, 8, 0.52)'      : 'rgba(255, 252, 248, 0.56)',
    border: isDark ? 'rgba(250, 238, 218, 0.14)' : 'rgba(133, 79, 11, 0.10)',
    blur:   'blur(32px) saturate(180%)',
    shadow: isDark
      ? '0 10px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)'
      : '0 10px 28px rgba(180,120,40,0.08), inset 0 1px 0 rgba(255,255,255,0.78)',
  };
}

// ── Main BottomNav ─────────────────────────────────────────────────────────────
export default function BottomNav({ isGuest = false }: Props) {
  const pathname = usePathname();
  const prefRM   = useReducedMotion();
  const { resolvedTheme } = useThemePreference();
  const isDark   = resolvedTheme === 'dark';
  const GLASS    = useGlass(isDark);

  const [collapsed, setCollapsed] = useState(false);
  const lastScrollYRef = useRef(0);

  // Active state checks
  const activeHome      = pathname === '/home' || pathname === '/guest';
  const activeJapa      = pathname === '/bhakti/mala' || pathname.startsWith('/bhakti/mala/');
  const activeBhakti    = (pathname === '/bhakti' || pathname.startsWith('/bhakti/')) && !activeJapa;
  const activePathshala = pathname === '/pathshala' || pathname.startsWith('/pathshala/');
  const activeMandali   = pathname === '/mandali' || pathname.startsWith('/mandali/');

  // Collapsed icon — show what page you're on
  const activeProfile   = pathname === '/profile' || pathname === '/my-progress' || pathname.startsWith('/my-progress/');
  const activePanchang  = pathname === '/panchang' || pathname.startsWith('/vrat/');
  const activeTirtha    = pathname === '/tirtha-map' || pathname === '/live-darshan';
  const activeMessages  = pathname === '/messages' || pathname.startsWith('/vichaar-sabha/');

  useEffect(() => {
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
      if (!ready) return;
      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;
      const diff = currentY - previousY;
      if (Math.abs(diff) < 8) return;
      if (diff > 0 && currentY > 80) {
        setCollapsed(true);
      } else if (diff < -24) {
        setCollapsed(false);
      } else if (currentY < 30) {
        setCollapsed(false);
      }
      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const ease = [0.22, 1, 0.36, 1] as const;
  const navDur = prefRM ? 0 : 0.46;
  const contentDur = prefRM ? 0 : 0.24;
  const shouldShowBar = !collapsed;
  const collapsedBg = isDark ? 'rgba(20, 17, 13, 0.26)' : 'rgba(255, 252, 246, 0.34)';
  const collapsedBorder = isDark ? 'rgba(250, 238, 218, 0.16)' : 'rgba(133, 79, 11, 0.12)';
  const collapsedShadow = isDark
    ? '0 8px 24px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.10)'
    : '0 8px 24px rgba(97,67,34,0.07), inset 0 1px 0 rgba(255,255,255,0.72)';

  function collapsedIcon() {
    const iconSize = 21;
    const colorClass = 'text-[#C5A059] drop-shadow-[0_0_8px_rgba(197,160,89,0.52)]';
    if (activeHome)      return <Home     size={iconSize} className={colorClass} />;
    if (activeJapa)      return <Heart    size={iconSize} className={colorClass} />;
    if (activeBhakti)    return <Sparkles size={iconSize} className={colorClass} />;
    if (activePathshala) return <BookOpen size={iconSize} className={colorClass} />;
    if (activeMandali)   return <Users    size={iconSize} className={colorClass} />;
    if (activePanchang)  return <Sparkles size={iconSize} className={colorClass} />;
    if (activeTirtha)    return <MapPin   size={iconSize} className={colorClass} />;
    if (activeProfile)   return <User     size={iconSize} className={colorClass} />;
    if (activeMessages)  return <MessageCircle size={iconSize} className={colorClass} />;
    return <Sparkles size={iconSize} className={colorClass} />;
  }

  // ── Nav Tab — shared render helper ──────────────────────────────────────────
  function NavTab({
    href, label, icon: Icon, isActive, isCenter = false,
  }: {
    href: string; label: string; icon: React.ElementType; isActive: boolean; isCenter?: boolean;
  }) {
    if (isCenter) {
      return (
        <Link href={href} className="flex-1 flex justify-center relative" style={{ marginTop: '-22px' }}>
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #C5A059, #A8813A)'
                  : 'linear-gradient(135deg, rgba(197,160,89,0.85), rgba(168,129,58,0.80))',
                boxShadow: isActive
                  ? '0 8px 24px rgba(197, 160, 89, 0.45)'
                  : '0 8px 20px rgba(197, 160, 89, 0.28)',
              }}
            >
              <Icon size={22} className="text-[#1c1812]" />
            </div>
            <span className={cn(
              "text-[9px] font-bold mt-1 tracking-wider leading-none",
              isActive ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'
            )}>
              {label}
            </span>
          </motion.div>
        </Link>
      );
    }

    return (
      <Link href={href} className="flex-1 flex flex-col items-center py-2 relative">
        <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
          <Icon size={22} className={isActive ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'} />
          <span className={cn(
            "text-[9px] font-bold mt-1 tracking-wider leading-none",
            isActive ? 'text-[#C5A059]' : 'text-[var(--text-dim)]'
          )}>
            {label}
          </span>
          {isActive && (
            <motion.div layoutId="active-nav-dot" className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C5A059]" />
          )}
        </motion.div>
      </Link>
    );
  }

  return (
    <nav
      aria-label="Primary app navigation"
      className="app-bottom-nav fixed z-[9000] border pointer-events-auto flex items-center"
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
                <NavTab href="/guest"   label="Home"    icon={Home}  isActive={activeHome} />
                <NavTab href="/bhakti"  label="Bhakti"  icon={Sparkles} isActive={activeBhakti} isCenter />
                <NavTab href="/mandali" label="Mandali" icon={Users} isActive={activeMandali} />
              </div>
            ) : (
              // ── 5-Tab Member Layout ──
              // Home / Japa / [Bhakti center] / Pathshala / Mandali
              <div className="flex-1 flex items-center w-full justify-between">
                <NavTab href="/home"        label="Home"      icon={Home}     isActive={activeHome} />
                <NavTab href="/bhakti/mala" label="Japa"      icon={Heart}    isActive={activeJapa} />
                <NavTab href="/bhakti"      label="Bhakti"    icon={Sparkles} isActive={activeBhakti} isCenter />
                <NavTab href="/pathshala"   label="Pathshala" icon={BookOpen} isActive={activePathshala} />
                <NavTab href="/mandali"     label="Mandali"   icon={Users}    isActive={activeMandali} />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="collapsed-nav"
            type="button"
            aria-label="Expand navigation"
            onClick={() => setCollapsed(false)}
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
  );
}
