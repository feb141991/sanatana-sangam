'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface DailySadhanaStripProps {
  japaDone: boolean;
  nityaDone: boolean;
  pathshalaDone: boolean;
}

export default function DailySadhanaStrip({ japaDone, nityaDone, pathshalaDone }: DailySadhanaStripProps) {
  const { t } = useLanguage();

  const pills = [
    {
      id: 'japa',
      label: 'Japa',
      done: japaDone,
      href: '/japa',
      icon: '📿',
    },
    {
      id: 'nitya',
      label: 'Nitya Karma',
      done: nityaDone,
      href: '/nitya-karma',
      icon: '🌅',
    },
    {
      id: 'pathshala',
      label: 'Pathshala',
      done: pathshalaDone,
      href: '/pathshala',
      icon: '📖',
    },
  ];

  const completedCount = pills.filter(p => p.done).length;

  return (
    <div className="px-5 relative z-20 mt-2 mb-4">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>
          Daily Sadhana
        </h3>
        {completedCount === 3 && (
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1" style={{ color: '#C5A059' }}>
            <Sparkles size={10} /> Complete
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {pills.map((pill) => (
          <Link
            key={pill.id}
            href={pill.href}
            className={`flex-1 min-w-[100px] flex items-center gap-2 p-2 rounded-[1rem] border transition-all duration-300 ${
              pill.done 
                ? 'bg-[#C5A059]/10 border-[#C5A059]/30' 
                : 'bg-black/20 border-white/5 dark:bg-white/5 dark:border-white/10'
            }`}
            style={{
              boxShadow: pill.done ? '0 4px 12px rgba(197, 160, 89, 0.08)' : 'none'
            }}
          >
            <div 
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
                pill.done ? 'bg-[#C5A059] text-[#1a1610]' : 'bg-white/10 opacity-70'
              }`}
            >
              {pill.done ? <Check size={14} strokeWidth={3} /> : pill.icon}
            </div>
            <span 
              className={`text-[11px] font-bold tracking-wide truncate ${
                pill.done ? 'text-[#C5A059]' : 'text-[var(--text-muted-warm)]'
              }`}
            >
              {pill.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
