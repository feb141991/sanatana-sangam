import type { StoryCharacterAgeState, StoryLanguage, StorySceneCard } from '@/lib/story/kanu-story';
import { KanuGuideAvatar } from '@/components/story/KanuGuideAvatar';

interface StorySceneStageProps {
  scene: StorySceneCard;
  language: StoryLanguage;
  characterStates: StoryCharacterAgeState[];
}

export function StorySceneStage({ scene, language, characterStates }: StorySceneStageProps) {
  const leadState = characterStates.find((state) => state.characterId === 'kanu') ?? characterStates[0];
  const supportingStates = leadState
    ? characterStates.filter((state) => state.id !== leadState.id)
    : characterStates;

  return (
    <section className={`story-stage story-stage-${scene.motionPreset}`} data-artwork-key={scene.artworkKey}>
      <div className="story-stage-backdrop" />
      <div className="story-stage-grid" />
      <div className="story-stage-aura" />
      <div className="story-stage-horizon" />

      <div className="story-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={`particle-${index}`} className={`story-particle particle-${(index % 4) + 1}`} />
        ))}
      </div>

      <div className="story-stage-content">
        <div className="story-stage-copy">
          <div className="flex flex-wrap gap-2">
            <span className="story-chip">{scene.eyebrow[language]}</span>
            <span className="story-chip story-chip-secondary">{scene.ambientAudio}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mt-4">{scene.title[language]}</h2>
          <p className="text-sm text-white/80 leading-relaxed mt-3 max-w-xl">{scene.caption[language]}</p>
        </div>

        {leadState && (
          <div className="story-stage-portrait">
            <KanuGuideAvatar state={leadState} size="lg" />
            <div className="story-stage-label">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-accent-soft)]">
                {leadState.displayName}
              </p>
              <p className="text-sm text-white/85 mt-1">{leadState.ageStage}</p>
            </div>
          </div>
        )}
      </div>

      {supportingStates.length > 0 && (
        <div className="story-supporting-cast">
          {supportingStates.map((state) => (
            <div key={state.id} className="story-supporting-card">
              <KanuGuideAvatar state={state} size="sm" />
              <div>
                <p className="text-sm font-semibold text-white">{state.displayName}</p>
                <p className="text-xs text-white/75">{state.ageStage}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
