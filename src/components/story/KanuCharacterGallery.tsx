'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { KanuGuideAvatar } from '@/components/story/KanuGuideAvatar';
import type { StoryCharacterAgeState } from '@/lib/story/kanu-story';

interface KanuCharacterGalleryProps {
  states: StoryCharacterAgeState[];
}

export function KanuCharacterGallery({ states }: KanuCharacterGalleryProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="clay-card rounded-[1.9rem] px-5 py-5 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
            Character focus
          </p>
          <h2 className="font-display text-2xl font-bold text-gray-900 mt-2">Kanu through the ages</h2>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            The lively guide keeps the same emotional core while posture, jawline, gaze, palette, and aura mature from wonder into radiant steadiness.
          </p>
        </div>
        <span className="clay-pill text-[11px] text-[color:var(--brand-primary)]">
          Face, posture, and age progression system
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {states.map((state, index) => (
          <motion.article
            key={state.id}
            className="story-character-card"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.38, delay: index * 0.06, ease: 'easeOut' }}
          >
            <div className="story-character-stage">
              <KanuGuideAvatar state={state} size="md" emphasis={index === states.length - 1 ? 'lead' : 'support'} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)] mt-4">
              {state.ageStage}
            </p>
            <p className="font-semibold text-gray-900 mt-2">{state.arc}</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">{state.descriptor.en}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {state.expressionSet.slice(0, 3).map((expression) => (
                <span key={expression} className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
                  {expression}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
