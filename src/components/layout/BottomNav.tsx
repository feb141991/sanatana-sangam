'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Users, BookOpen, Heart, Sparkles, Compass, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Tradition-aware label for the Library tab — 'Shastra' | 'Gurbani' | 'Dhamma' | 'Agam' */
  libraryLabel?: string;
  isGuest?: boolean;
}

export default function BottomNav({ libraryLabel = 'Library', isGuest = false }: Props) {
  const pathname = usePathname();

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
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                active ? 'text-white' : 'text-white/60 hover:text-white'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                active ? 'bg-white/18 shadow-lg' : ''
              )}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none',
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
