'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDays, GitBranch, ListChecks, MessageCircle, Users } from 'lucide-react';
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
    Icon: typeof Users;
    group: 'today' | 'family' | 'lineage';
  }> = {
    members: {
      label: t('kulMembersTitle'),
      eyebrow: t('kulMembersEyebrow'),
      Icon: Users,
      group: 'family',
    },
    tasks: {
      label: t('kulTasksTitle'),
      eyebrow: t('kulTasksEyebrow'),
      Icon: ListChecks,
      group: 'today',
    },
    sabha: {
      label: t('kulSabhaTitle'),
      eyebrow: t('kulSabhaEyebrow'),
      Icon: MessageCircle,
      group: 'family',
    },
    vansh: {
      label: t('kulVanshTitle'),
      eyebrow: t('kulVanshEyebrow'),
      Icon: GitBranch,
      group: 'lineage',
    },
    events: {
      label: t('kulEventsLabel'),
      eyebrow: t('kulEventsEyebrow'),
      Icon: CalendarDays,
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
    <div className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]/70 px-3 py-4 shadow-sm backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[12px] font-medium theme-ink premium-serif">Open a space</p>
        <p className="text-[10px] theme-muted">Family tools</p>
      </div>
      <div className="flex items-start gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tiles.map(({ key, badge }) => {
        const meta = KUL_SECTION_META[key];
        const active = currentView === key;
        const Icon = meta.Icon;
        return (
          <motion.div
            key={key}
            whileTap={{ scale: 0.94 }}
            className="shrink-0"
          >
            <Link
              href={getKulSectionHref(key)}
              className={`group relative flex w-[76px] flex-col items-center gap-2 rounded-[1.4rem] px-2 py-3 text-center transition-all ${
                active 
                  ? 'bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]'
                  : 'hover:bg-[var(--surface-raised)]'
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border transition-all ${
                active
                  ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/14 text-[var(--brand-primary)]'
                  : 'border-[var(--card-border)] bg-[var(--surface-raised)] text-[var(--brand-primary)]'
              }`}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              {badge != null && badge > 0 && (
                <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)] shadow-sm" />
              )}
              <span className="line-clamp-2 min-h-[28px] text-[11px] font-medium leading-tight theme-ink">
                {meta.label}
              </span>
            </Link>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}
