'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { KulSectionView, KulView, MemberRow, TaskRow, MessageRow, FamilyMember, KulEvent } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getUnreadSignature, getKulSectionHref } from '../utils';
export function KulSectionTiles({
  currentView,
  members,
  tasks,
  messages,
  familyMembers,
  kulEvents,
}: {
  currentView?: KulView;
  members: MemberRow[];
  tasks: TaskRow[];
  messages: MessageRow[];
  familyMembers: FamilyMember[];
  kulEvents: KulEvent[];
}) {
  const { t } = useLanguage();
  const [seenSignatures, setSeenSignatures] = useState<Record<string, string>>({});

  const KUL_SECTION_META: Record<KulSectionView, {
    label: string;
    eyebrow: string;
    emoji: string;
    group: 'today' | 'family' | 'lineage';
  }> = {
    members: {
      label: t('kulMembersTitle'),
      eyebrow: t('kulMembersEyebrow'),
      emoji: '👨‍👩‍👧‍👦',
      group: 'family',
    },
    tasks: {
      label: t('kulTasksTitle'),
      eyebrow: t('kulTasksEyebrow'),
      emoji: '📋',
      group: 'today',
    },
    sabha: {
      label: t('kulSabhaTitle'),
      eyebrow: t('kulSabhaEyebrow'),
      emoji: '💬',
      group: 'family',
    },
    vansh: {
      label: t('kulVanshTitle'),
      eyebrow: t('kulVanshEyebrow'),
      emoji: '🫶',
      group: 'lineage',
    },
    events: {
      label: t('kulEventsLabel'),
      eyebrow: t('kulEventsEyebrow'),
      emoji: '📅',
      group: 'today',
    },
  };

  const liveSignatures: Record<KulSectionView, string> = {
    tasks: getUnreadSignature('tasks', { members, tasks, messages, familyMembers, kulEvents }),
    members: getUnreadSignature('members', { members, tasks, messages, familyMembers, kulEvents }),
    sabha: getUnreadSignature('sabha', { members, tasks, messages, familyMembers, kulEvents }),
    vansh: getUnreadSignature('vansh', { members, tasks, messages, familyMembers, kulEvents }),
    events: getUnreadSignature('events', { members, tasks, messages, familyMembers, kulEvents }),
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('kul-section-seen-signatures');
      if (raw) setSeenSignatures(JSON.parse(raw) as Record<string, string>);
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentView || currentView === 'hub' || typeof window === 'undefined') return;
    const nextSignatures = { ...seenSignatures, [currentView]: liveSignatures[currentView as KulSectionView] };
    setSeenSignatures(nextSignatures);
    window.localStorage.setItem('kul-section-seen-signatures', JSON.stringify(nextSignatures));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, liveSignatures.tasks, liveSignatures.members, liveSignatures.sabha, liveSignatures.vansh, liveSignatures.events]);

  const tiles: Array<{ key: KulSectionView; badge?: number }> = [
    { key: 'tasks', badge: liveSignatures.tasks && seenSignatures.tasks !== liveSignatures.tasks ? 1 : undefined },
    { key: 'members', badge: liveSignatures.members && seenSignatures.members !== liveSignatures.members ? 1 : undefined },
    { key: 'sabha', badge: liveSignatures.sabha && seenSignatures.sabha !== liveSignatures.sabha ? 1 : undefined },
    { key: 'vansh', badge: liveSignatures.vansh && seenSignatures.vansh !== liveSignatures.vansh ? 1 : undefined },
    { key: 'events', badge: liveSignatures.events && seenSignatures.events !== liveSignatures.events ? 1 : undefined },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {tiles.map(({ key, badge }) => {
        const meta = KUL_SECTION_META[key];
        const active = currentView === key;
        return (
          <motion.div
            key={key}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className="h-full"
          >
            <Link
              href={getKulSectionHref(key)}
              className={`group flex flex-col h-full rounded-[1.8rem] p-4 transition-all ${
                active 
                  ? 'bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 shadow-lg' 
                  : 'glass-panel border border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/15 group-hover:bg-[var(--brand-primary)]/20 transition-colors shadow-inner">
                  {meta.emoji}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {badge != null && badge > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#1c1c1a] shadow-sm animate-pulse" style={{ background: 'var(--brand-primary)' }}>
                      {badge > 99 ? '!' : badge}
                    </span>
                  )}
                  <ChevronRight size={14} className="theme-dim group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--brand-primary)] opacity-70 mb-1">
                  {meta.eyebrow}
                </p>
                <h3 className="text-[15px] font-bold theme-ink leading-tight">
                  {meta.label}
                </h3>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
