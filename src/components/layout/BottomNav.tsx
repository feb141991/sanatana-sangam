'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, MapPin, Users, BookOpen, CircleDot, Compass, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Pathshala tab label, kept short for bottom-nav space */
  libraryLabel?: string;
  libraryMobileLabel?: string;
  isGuest?: boolean;
}

export default function BottomNav({ libraryLabel = 'Shastra', libraryMobileLabel = 'Shastra', isGuest = false }: Props) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const memberNavItems = [
    { href: '/home',       label: 'Home',        icon: Home     },
    { href: '/tirtha-map', label: 'Tirtha',      icon: MapPin   },
    { href: '/mandali',    label: 'Mandali',     icon: Users    },
    { href: '/library',    label: libraryLabel, mobileLabel: libraryMobileLabel, icon: BookOpen },
    { href: '/bhakti/mala',label: 'Mala',        icon: CircleDot },
  ];
  const guestNavItems = [
    { href: '/guest',         label: 'Explore', mobileLabel: 'Explore', icon: Compass       },
    { href: '/vichaar-sabha', label: 'Vichaar', mobileLabel: 'Vichaar', icon: MessageSquare },
    { href: '/tirtha-map',    label: 'Tirtha',  mobileLabel: 'Tirtha',  icon: MapPin        },
    { href: '/signup',        label: 'Join',    mobileLabel: 'Join',    icon: CircleDot     },
  ];
  const navItems = isGuest ? guestNavItems : memberNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 safe-area-pb">
      <div className="glass-nav max-w-2xl mx-auto flex items-center justify-around h-16 rounded-[16px] bg-white">
        {navItems.map(({ href, label, mobileLabel, icon: Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-[8px] transition-all active:scale-[0.97]',
                active ? 'text-[color:var(--saffron-800)]' : 'text-[color:var(--text-secondary)]'
              )}
            >
              <div className={cn(
                'relative z-10 w-8 h-8 rounded-[8px] flex items-center justify-center transition-all',
                active ? 'bg-[color:var(--saffron-50)] text-[color:var(--saffron-800)]' : 'bg-transparent'
              )}>
                <motion.div
                  animate={prefersReducedMotion ? undefined : { scale: active ? 1.08 : 1 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </motion.div>
              </div>
              <span className={cn(
                'relative z-10 text-[11px] font-medium leading-none'
              )}>
                <span className="sm:hidden">{mobileLabel ?? label}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
              <motion.span
                className="relative z-10 h-1.5 w-1.5 rounded-full"
                animate={prefersReducedMotion ? undefined : { opacity: active ? 1 : 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'var(--saffron-200)' }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
