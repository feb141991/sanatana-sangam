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

  return (
    <div className="flex flex-col gap-4">
      {/* Dynamic Recommendation Cards */}
      {maxRecs.map((rec) => (
        <div
          key={rec.id}
          className="rounded-2xl p-4 border border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[var(--surface-raised)] text-[var(--text-dim)] border border-[var(--card-border)]">
              {rec.type}
            </span>
            <span className="text-[10px] text-[var(--text-dim)]">
              {TIME_ESTIMATE[rec.type] || '5min'}
            </span>
          </div>

          <div className="flex gap-3">
            <div className="mt-1">
              <SacredIcon name={rec.icon || 'sparkles'} size={22} style={{ color: activeMood.colour }} />
            </div>
            <div>
              <h3 className="text-[16px] font-serif text-[var(--text-cream)] leading-snug mb-1">
                {rec.title}
              </h3>
              <p className="text-[12px] text-[var(--text-muted-warm)] leading-relaxed">
                {rec.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => onActionClick(rec)}
            className="w-full h-11 rounded-xl mt-2 font-bold transition-transform active:scale-[0.98]"
            style={{ background: activeMood.colour, color: 'var(--divine-bg)' }}
          >
            {rec.actionLabel}
          </button>
        </div>
      ))}

      {/* 3 Fixed Contextual Cards */}
      <motion.div
        className="flex flex-col gap-4"
        variants={{ visible: { transition: { staggerChildren: transitionDuration } } }}
        initial="hidden"
        animate="visible"
      >
        {/* LIVE DARSHAN */}
        <motion.div
          variants={fixedVariants}
          transition={prefersReducedMotion ? { duration: 0 } : undefined}
          className="rounded-2xl p-4 flex items-center justify-between border border-[var(--card-border)]"
          style={{ background: activeMood.bg }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-soft)]">
              <SacredIcon name="flame" size={20} style={{ color: activeMood.colour }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-bold text-[var(--text-cream)]">
                  {tradition === 'sikh' ? 'Live Gurdwara' : tradition === 'buddhist' ? 'Live Temple' : tradition === 'jain' ? 'Live Jain Mandir' : 'Live Darshan'}
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white" style={{ background: '#ef4444' }}>
                  Live
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted-warm)]">Witness sacred aarti and prayers live</p>
            </div>
          </div>
          <button 
            onClick={() => onActionClick({ id: 'live', type: 'live_darshan' as any, title: 'Live Darshan', description: '', href: '/live-darshan', icon: 'flame', actionLabel: 'Watch live' })}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-raised)] border border-[var(--card-border)] text-[var(--text-cream)]"
            style={{ color: activeMood.colour }}
          >
            Watch live
          </button>
        </motion.div>

        {/* MANDALI */}
        <motion.div
          variants={fixedVariants}
          transition={prefersReducedMotion ? { duration: 0 } : undefined}
          className="rounded-2xl p-4 flex items-center justify-between border border-[var(--card-border)]"
          style={{ background: activeMood.bg }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-soft)]">
              <SacredIcon name={'users' as any} size={20} style={{ color: activeMood.colour }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-bold text-[var(--text-cream)]">Talk to Sangat</h4>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-dim)]" style={{ color: activeMood.colour }}>
                  Community
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted-warm)]">Share with your spiritual community</p>
            </div>
          </div>
          <button 
            onClick={() => onActionClick({ id: 'mandali', type: 'mandali' as any, title: 'Mandali', description: '', href: '/mandali', icon: 'users' as any, actionLabel: 'Open Mandali' })}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-raised)] border border-[var(--card-border)] text-[var(--text-cream)]"
            style={{ color: activeMood.colour }}
          >
            Open Mandali
          </button>
        </motion.div>

        {/* SEVA */}
        <motion.div
          variants={fixedVariants}
          transition={prefersReducedMotion ? { duration: 0 } : undefined}
          className="rounded-2xl p-4 flex items-center justify-between border border-[var(--card-border)]"
          style={{ background: activeMood.bg }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-soft)]">
              <SacredIcon name="heart" size={20} style={{ color: activeMood.colour }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-bold text-[var(--text-cream)]">Do Seva</h4>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-dim)]" style={{ color: activeMood.colour }}>
                  Seva
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted-warm)] max-w-[140px] truncate">
                {tradition === 'sikh' ? 'Langar, simran, and seva' : tradition === 'buddhist' ? 'Dana and compassionate service' : 'Support temples, cow seva, annadaan'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onActionClick({ id: 'seva', type: 'seva' as any, title: 'Seva', description: '', href: '/seva', icon: 'heart', actionLabel: 'Contribute' })}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-raised)] border border-[var(--card-border)] text-[var(--text-cream)]"
            style={{ color: activeMood.colour }}
          >
            Contribute
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
