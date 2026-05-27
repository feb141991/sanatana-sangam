'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MANTRAS, Mantra } from '@/data/mantras';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface MantrasClientProps {
  tradition: string;
  isPro: boolean;
}

type TabType = 'all' | 'tradition' | 'others';

export default function MantrasClient({ tradition, isPro }: MantrasClientProps) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Capitalize tradition for display
  const displayTradition = tradition.charAt(0).toUpperCase() + tradition.slice(1);

  const filteredMantras = MANTRAS.filter((m) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'tradition') {
      return m.tradition === tradition || m.tradition === 'all';
    }
    if (activeTab === 'others') {
      return m.tradition !== tradition && m.tradition !== 'all';
    }
    return true;
  });

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? 'rgba(197,160,89,0.14)' : 'rgba(197,160,89,0.20)';
  const localTextColor = isDark ? 'rgba(245,223,160,0.7)' : 'rgba(80,45,10,0.7)';

  const handleCardClick = (mantra: Mantra) => {
    if (mantra.isPremium && !isPro) {
      toast.success('Unlock with Zenith →', {
        icon: '🔒',
        style: {
          borderRadius: '10px',
          background: isDark ? '#1C150A' : '#fff',
          color: isDark ? '#F0EDE6' : '#333',
          border: '1px solid rgba(197,160,89,0.3)',
        },
      });
      return;
    }
    router.push(`/bhakti/mala?mantraId=${mantra.id}`);
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-base)' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 px-6 pt-12 pb-4 backdrop-blur-xl border-b" style={{ backgroundColor: isDark ? 'rgba(14,14,15,0.8)' : 'rgba(250,246,239,0.8)', borderColor: cardBorder }}>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <ChevronLeft size={20} color="#C5A059" />
          </button>
          <h1 className="text-xl font-bold font-serif" style={{ color: 'var(--text-base)' }}>Mantras</h1>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'tradition', 'others'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            let label = tab === 'all' ? 'All' : tab === 'tradition' ? displayTradition : 'Others';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? '#C5A059' : cardBg,
                  color: isActive ? '#0E0E0F' : 'var(--text-dim)',
                  border: isActive ? '1px solid #C5A059' : `1px solid ${cardBorder}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMantras.map((mantra) => {
          const isLocked = mantra.isPremium && !isPro;
          return (
            <motion.div
              key={mantra.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(mantra)}
              className="relative p-5 rounded-2xl cursor-pointer overflow-hidden transition-all"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              {isLocked ? (
                <div className="absolute bottom-4 right-4 text-[#C5A059]">
                  <Lock size={18} />
                </div>
              ) : (
                <div className="absolute bottom-4 right-4" style={{ color: 'var(--text-dim)' }}>
                  <ChevronRight size={18} />
                </div>
              )}
              <h3 className="text-lg font-bold font-serif mb-1" style={{ color: 'var(--text-base)' }}>{mantra.nameEn}</h3>
              <p className="text-sm font-serif mb-3" style={{ color: localTextColor, fontFamily: 'var(--font-devanagari), var(--font-serif)' }}>{mantra.nameLocal}</p>
              
              {mantra.deity && (
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>{mantra.deity}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {mantra.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full"
                    style={{ backgroundColor: 'rgba(197,160,89,0.15)', color: '#C5A059' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
