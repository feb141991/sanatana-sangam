'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, MapPin, Users, BookOpen, Heart, Sparkles, Compass, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Pathshala tab label, kept short for bottom-nav space */
  libraryLabel?: string;
  isGuest?: boolean;
}

export default function BottomNav({ libraryLabel = 'Pathshala', isGuest = false }: Props) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const memberNavItems = [
    { href: '/home',       label: 'Home',        icon: Home     },
    { href: '/library',    label: libraryLabel,   icon: BookOpen },
    { href: '/kul',        label: 'Kul',          icon: Heart    },
    { href: '/mandali',    label: 'Mandali',      icon: Users    },
    { href: '/ai-chat',    label: 'AI',           icon: Sparkles },
    { href: '/tirtha-map', label: 'Tirtha',       icon: MapPin   },
  ];
  const guestNavItems = [
    { href: '/guest',         label: 'Explore', icon: Compass       },
    { href: '/vichaar-sabha', label: 'Vichaar', icon: MessageSquare },
    { href: '/tirtha-map',    label: 'Tirtha',  icon: MapPin        },
    { href: '/signup',        label: 'Join',    icon: Sparkles      },
  ];
  const navItems = isGuest ? guestNavItems : memberNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 safe-area-pb">
      <div className="glass-nav max-w-2xl mx-auto flex items-center justify-around h-16 rounded-[1.75rem]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                active ? 'text-white' : 'text-white/60 hover:text-white'
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-shell"
                  className="absolute inset-x-1 inset-y-0 rounded-[1.1rem] bg-white/10"
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
                'relative z-10 text-[10px] font-medium leading-none',
                active && 'font-semibold text-white'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
