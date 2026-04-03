'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { StoryCharacterAgeState, StoryLanguage, StorySceneCard } from '@/lib/story/kanu-story';
import { KanuGuideAvatar } from '@/components/story/KanuGuideAvatar';

interface StorySceneStageProps {
  scene: StorySceneCard;
  language: StoryLanguage;
  characterStates: StoryCharacterAgeState[];
}

export function StorySceneStage({ scene, language, characterStates }: StorySceneStageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  const leadState = characterStates.find((state) => state.characterId === 'kanu') ?? characterStates[0];
  const supportingStates = leadState
    ? characterStates.filter((state) => state.id !== leadState.id)
    : characterStates;

  useEffect(() => {
    setMotionReady(true);
  }, []);

  return (
    <section className={`story-stage story-stage-${scene.motionPreset}`} data-artwork-key={scene.artworkKey}>
      <div className="story-stage-backdrop" />
      <div className="story-stage-grid" />
      <div className="story-stage-aura" />
      <div className="story-stage-horizon" />

      <div className="story-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <motion.span
            key={`particle-${index}`}
            className={`story-particle particle-${(index % 4) + 1}`}
            animate={!motionReady || prefersReducedMotion ? undefined : { y: [0, -10, 0], opacity: [0.4, 1, 0.45] }}
            transition={{ duration: 4.8 + index * 0.3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
          />
        ))}
      </div>

      <div className="story-stage-content">
        <motion.div
          key={`${scene.id}-${language}-copy`}
          className="story-stage-copy"
          initial={false}
          animate={motionReady && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.38, ease: 'easeOut' }}
        >
          <div className="flex flex-wrap gap-2">
            <span className="story-chip">{scene.eyebrow[language]}</span>
            <span className="story-chip story-chip-secondary">{scene.ambientAudio}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mt-4">{scene.title[language]}</h2>
          <p className="text-sm text-white/80 leading-relaxed mt-3 max-w-xl">{scene.caption[language]}</p>
        </motion.div>

        {leadState && (
          <motion.div
            key={`${scene.id}-${leadState.id}`}
            className="story-stage-portrait"
            initial={false}
            animate={motionReady && !prefersReducedMotion ? { opacity: 1, x: 0, scale: 1 } : undefined}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          >
            <KanuGuideAvatar state={leadState} size="lg" emphasis="lead" />
            <div className="story-stage-label">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-accent-soft)]">
                {leadState.displayName}
              </p>
              <p className="text-sm text-white/85 mt-1">{leadState.ageStage}</p>
              <p className="text-xs text-white/70 leading-relaxed mt-2 max-w-[16rem]">
                {leadState.descriptor[language]}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {supportingStates.length > 0 && (
        <div className="story-supporting-cast">
          {supportingStates.map((state, index) => (
            <motion.div
              key={state.id}
              className="story-supporting-card"
              initial={false}
              animate={motionReady && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.3, delay: 0.12 + index * 0.08, ease: 'easeOut' }}
            >
              <KanuGuideAvatar state={state} size="sm" />
              <div>
                <p className="text-sm font-semibold text-white">{state.displayName}</p>
                <p className="text-xs text-white/75">{state.ageStage}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
