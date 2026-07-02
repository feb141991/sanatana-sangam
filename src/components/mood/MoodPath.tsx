'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type MoodConfig } from '@/lib/mood/registry';
import { type MoodRecommendation } from '@/lib/mood/engine';
import SacredIcon from '@/components/ui/SacredIcon';

export interface MoodPathProps {
  activeMood: MoodConfig;
  tradition: string | null;
  recommendations: MoodRecommendation[];
  checkinId: string | null;
  onActionClick: (rec: MoodRecommendation) => void;
}

const TIME_ESTIMATE: Record<MoodRecommendation['type'], string> = {
  stotram: '3min',
  katha: '5min',
  dhyana: '10min',
  discover: '5min',
  japa: '8min',
  pathshala: '5min',
};

const fixedVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function MoodPath({
  activeMood,
  tradition,
  recommendations,
  onActionClick,
}: MoodPathProps) {
  const prefersReducedMotion = useReducedMotion();
  const maxRecs = recommendations.slice(0, 4);

  const transitionDuration = prefersReducedMotion ? 0 : 0.05;

  const fixedCards = [
    {
      id: 'fixed-darshan',
      title: tradition === 'sikh' ? 'Live Gurdwara' : tradition === 'buddhist' ? 'Live Temple' : tradition === 'jain' ? 'Live Jain Mandir' : 'Live Darshan',
      description: 'Witness sacred aarti live',
      actionLabel: 'Watch live',
      href: '/live-darshan',
      icon: 'flame' as const,
      badge: 'Live',
      badgeBg: '#ef4444',
    },
    {
      id: 'fixed-mandali',
      title: 'Talk to Sangat',
      description: 'Share with your community',
      actionLabel: 'Open Mandali',
      href: '/mandali',
      icon: 'sparkles' as const,
      badge: 'Community',
      badgeBg: null,
    },
    {
      id: 'fixed-seva',
      title: 'Do Seva',
      description: tradition === 'sikh' ? 'Langar, simran, seva' : tradition === 'buddhist' ? 'Dana and service' : 'Temples, cow seva, annadaan',
      actionLabel: 'Contribute',
      href: '/seva',
      icon: 'heart' as const,
      badge: 'Seva',
      badgeBg: null,
    },
  ];

  return (
    <div
      className="-mx-5 px-5 overflow-x-auto pb-2"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <div className="flex gap-3 w-max">
        {/* Dynamic recommendation cards */}
        {maxRecs.map((rec, i) => (
          <motion.button
            key={rec.id}
            onClick={() => onActionClick(rec)}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
            className="flex-shrink-0 w-36 flex flex-col rounded-2xl px-3 py-3 text-left active:scale-[0.97] transition-transform"
            style={{
              background: activeMood.bg,
              border: `1px solid ${activeMood.colour}22`,
            }}
          >
            <SacredIcon name={rec.icon || 'sparkles'} size={15} style={{ color: activeMood.colour }} />
            <span className="text-[11px] font-bold uppercase tracking-widest mt-2 mb-1" style={{ color: activeMood.colour }}>
              {TIME_ESTIMATE[rec.type] ?? '5 min'}
            </span>
            <span className="text-[13px] font-semibold leading-tight line-clamp-2 mb-1" style={{ color: 'var(--text-cream)' }}>
              {rec.title}
            </span>
            <span className="text-[10px] leading-snug line-clamp-2 flex-1" style={{ color: 'var(--text-muted-warm)' }}>
              {rec.description}
            </span>
            <span className="text-[11px] font-bold mt-2" style={{ color: activeMood.colour }}>
              {rec.actionLabel} →
            </span>
          </motion.button>
        ))}

        {/* 3 fixed contextual cards */}
        {fixedCards.map((card, i) => (
          <motion.button
            key={card.id}
            onClick={() => onActionClick({ id: card.id, type: 'discover' as const, title: card.title, description: card.description, href: card.href, icon: card.icon, actionLabel: card.actionLabel })}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: (maxRecs.length + i) * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
            className="flex-shrink-0 w-36 flex flex-col rounded-2xl px-3 py-3 text-left active:scale-[0.97] transition-transform"
            style={{
              background: activeMood.bg,
              border: `1px solid ${activeMood.colour}22`,
            }}
          >
            <SacredIcon name={card.icon} size={15} style={{ color: activeMood.colour }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest mt-2 mb-1 px-1.5 py-0.5 rounded self-start"
              style={{ background: card.badgeBg ?? `${activeMood.colour}22`, color: card.badgeBg ? '#fff' : activeMood.colour }}
            >
              {card.badge}
            </span>
            <span className="text-[13px] font-semibold leading-tight line-clamp-2 mb-1" style={{ color: 'var(--text-cream)' }}>
              {card.title}
            </span>
            <span className="text-[10px] leading-snug line-clamp-2 flex-1" style={{ color: 'var(--text-muted-warm)' }}>
              {card.description}
            </span>
            <span className="text-[11px] font-bold mt-2" style={{ color: activeMood.colour }}>
              {card.actionLabel} →
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
