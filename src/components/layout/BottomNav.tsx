'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Users, BookOpen, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home',       label: 'Home',    icon: Home     },
  { href: '/library',    label: 'Library', icon: BookOpen },
  { href: '/kul',        label: 'Kul',     icon: Heart    },
  { href: '/mandali',    label: 'Mandali', icon: Users    },
  { href: '/ai-chat',    label: 'AI',      icon: Sparkles },
  { href: '/tirtha-map', label: 'Tirtha',  icon: MapPin   },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 safe-area-pb"
      style={{ background: '#fff', boxShadow: '0 -2px 16px rgba(123,26,26,0.08)' }}>
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                active ? 'text-[#7B1A1A]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                active ? 'bg-[#7B1A1A]/10' : ''
              )}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none',
                active && 'font-semibold text-[#7B1A1A]'
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
