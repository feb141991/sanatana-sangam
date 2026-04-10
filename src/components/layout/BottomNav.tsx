'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, MapPin, Users, BookOpen, Heart, Sparkles, Compass, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Pathshala tab label, kept short for bottom-nav space */
  libraryLabel?: string;
  libraryMobileLabel?: string;
  isGuest?: boolean;
}

export default function BottomNav({ libraryLabel = 'Pathshala', libraryMobileLabel = 'Pathshala', isGuest = false }: Props) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const memberNavItems = [
    { href: '/home',       label: 'Home',        icon: Home     },
    { href: '/library',    label: libraryLabel, mobileLabel: libraryMobileLabel, icon: BookOpen },
    { href: '/bhakti',     label: 'Bhakti',      icon: Sparkles },
    { href: '/kul',        label: 'Kul',          icon: Heart    },
    { href: '/mandali',    label: 'Mandali',      icon: Users    },
    { href: '/tirtha-map', label: 'Tirtha',       icon: MapPin   },
  ];
  const guestNavItems = [
    { href: '/guest',         label: 'Explore', mobileLabel: 'Explore', icon: Compass       },
    { href: '/vichaar-sabha', label: 'Vichaar', mobileLabel: 'Vichaar', icon: MessageSquare },
    { href: '/tirtha-map',    label: 'Tirtha',  mobileLabel: 'Tirtha',  icon: MapPin        },
    { href: '/signup',        label: 'Join',    mobileLabel: 'Join',    icon: Sparkles      },
  ];
  const navItems = isGuest ? guestNavItems : memberNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 safe-area-pb">
      <div className="glass-nav max-w-2xl mx-auto flex items-center justify-around h-16 rounded-[1.75rem]">
        {navItems.map(({ href, label, mobileLabel, icon: Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                active ? 'text-[#1c1c1a]' : 'text-[color:var(--brand-muted)] hover:text-[color:var(--brand-primary-strong)]'
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-shell"
                  className="absolute inset-x-1 inset-y-0 rounded-[1.1rem]"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))',
                    boxShadow: '0 12px 24px rgba(212, 166, 70, 0.18)',
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }
                  }
                />
              )}
              <div className={cn(
                'relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                active ? 'shadow-lg' : ''
              )}>
                <motion.div
                  animate={prefersReducedMotion ? undefined : { scale: active ? 1.08 : 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </motion.div>
              </div>
              <span className={cn(
                'type-tab relative z-10',
                active ? 'text-[color:var(--text-saffron-soft)]' : 'text-[color:var(--text-dim)]'
              )}>
                <span className="sm:hidden">{mobileLabel ?? label}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
