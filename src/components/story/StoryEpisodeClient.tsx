'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  type StoryCharacterAgeState,
  type StoryEpisode,
  type StoryLanguage,
} from '@/lib/story/kanu-story';
import {
  getAIChatHref,
  getGitaStoryEpisodeHref,
  getPathshalaChapterHref,
  getPathshalaSectionHref,
} from '@/lib/pathshala-links';
import { StorySceneStage } from '@/components/story/StorySceneStage';

type StoryViewMode = 'story' | 'meaning';

interface StoryEpisodeClientProps {
  episode: StoryEpisode;
  characterStates: StoryCharacterAgeState[];
  previousEpisode?: StoryEpisode;
  nextEpisode?: StoryEpisode;
  standalone?: boolean;
}

interface StoredStoryState {
  episodeId: string;
  sceneIndex: number;
  language: StoryLanguage;
  viewMode: StoryViewMode;
}

const STORY_STORAGE_KEY = 'kanu-story-progress-v1';

export function StoryEpisodeClient({
  episode,
  characterStates,
  previousEpisode,
  nextEpisode,
  standalone = false,
}: StoryEpisodeClientProps) {
  const [language, setLanguage] = useState<StoryLanguage>('en');
  const [viewMode, setViewMode] = useState<StoryViewMode>('story');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [activeGlossary, setActiveGlossary] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpeech, setHasSpeech] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scene = episode.scenes[sceneIndex];
  const sceneCharacterStates = scene.focusCharacterStateIds
    .map((id) => characterStates.find((state) => state.id === id))
    .filter((state): state is StoryCharacterAgeState => !!state);
  const chapterHref = typeof episode.chapterNumber === 'number'
    ? getPathshalaChapterHref('hindu', 'gita', `chapter-${episode.chapterNumber}`)
    : getPathshalaSectionHref('hindu', 'gita');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rawState = window.localStorage.getItem(STORY_STORAGE_KEY);
    if (!rawState) return;

    try {
      const parsed = JSON.parse(rawState) as StoredStoryState;
      if (parsed.episodeId !== episode.id) return;
      setLanguage(parsed.language === 'hi' ? 'hi' : 'en');
      setViewMode(parsed.viewMode === 'meaning' ? 'meaning' : 'story');
      setSceneIndex(Math.min(Math.max(parsed.sceneIndex, 0), episode.scenes.length - 1));
    } catch {
      window.localStorage.removeItem(STORY_STORAGE_KEY);
    }
  }, [episode.id, episode.scenes.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const state: StoredStoryState = {
      episodeId: episode.id,
      sceneIndex,
      language,
      viewMode,
    };

    window.localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(state));
  }, [episode.id, language, sceneIndex, viewMode]);

  useEffect(() => {
    setHasSpeech(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function currentReading() {
    return viewMode === 'story' ? scene.narration[language] : scene.deeperMeaning[language];
  }

  function toggleSpeech() {
    if (!hasSpeech) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentReading());
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = language === 'hi' ? 0.9 : 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function goToScene(nextIndex: number) {
    setSceneIndex(Math.min(Math.max(nextIndex, 0), episode.scenes.length - 1));
    setActiveGlossary(null);
    if (hasSpeech) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }

  const sceneProgress = ((sceneIndex + 1) / episode.scenes.length) * 100;
  const sceneContext = `${episode.title.en} — ${scene.title.en}`;
  const aiPrompts = [
    {
      label: 'Explain this scene',
      description: 'Turn the story moment into a source-aware explanation.',
      href: getAIChatHref(
        `Explain the scene "${scene.title.en}" from ${episode.title.en}. Keep the answer source-aware and clearly separate story retelling from Bhagavad Gita teaching.`,
        sceneContext,
      ),
    },
    {
      label: 'Tell it for a child',
      description: 'Simplify the scene for a younger listener without losing reverence.',
      href: getAIChatHref(
        `Retell "${scene.title.en}" from ${episode.title.en} for a child in warm and simple language. Keep it gentle and dharmic.`,
        sceneContext,
      ),
    },
    {
      label: 'Show deeper meaning',
      description: 'Connect the scene to life practice and chapter themes.',
      href: getAIChatHref(
        `Show the deeper meaning of "${scene.title.en}" from ${episode.title.en}. Include the Bhagavad Gita themes linked to it.`,
        sceneContext,
      ),
    },
    {
      label: 'Track character growth',
      description: 'See how the characters become older, steadier, and wiser.',
      href: getAIChatHref(
        `How do the characters grow through "${scene.title.en}" in ${episode.title.en}? Focus on emotional maturity, duty, and devotion.`,
        sceneContext,
      ),
    },
  ];

  return (
    <div className={`space-y-4 pb-8 fade-in ${standalone ? 'story-standalone-shell' : ''}`}>
      <section className="glass-panel-strong rounded-[1.9rem] px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Link href={standalone ? '/gita-story' : '/library/hindu/gita/story'} className="text-[color:var(--brand-primary)]">
            {standalone ? 'Kanu story app' : 'Story mode'}
          </Link>
          <span>•</span>
          <Link href={chapterHref} className="text-[color:var(--brand-primary)]">
            {episode.chapterNumber ? `Chapter ${episode.chapterNumber}` : 'Gita handoff'}
          </Link>
          <span>•</span>
          <span>{episode.sourceType === 'canonical-companion' ? 'Canonical companion' : 'Editorial retelling'}</span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
              {episode.ageBand}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mt-2">{episode.title[language]}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">{episode.summary[language]}</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-4">{episode.sourceLabel[language]}</p>
          </div>

          <div className="story-toolbar-card">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Language</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`story-toggle-button ${language === 'en' ? 'story-toggle-button-active' : ''}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`story-toggle-button ${language === 'hi' ? 'story-toggle-button-active' : ''}`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Reading layer</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('story')}
                  className={`story-toggle-button ${viewMode === 'story' ? 'story-toggle-button-active' : ''}`}
                >
                  Story
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('meaning')}
                  className={`story-toggle-button ${viewMode === 'meaning' ? 'story-toggle-button-active' : ''}`}
                >
                  Deeper meaning
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSpeech}
              disabled={!hasSpeech}
              className="glass-button-secondary w-full px-4 py-2 rounded-full text-sm font-semibold text-[color:var(--brand-primary)] mt-4 disabled:opacity-50"
            >
              {isSpeaking ? 'Stop narration' : 'Read aloud'}
            </button>
          </div>
        </div>
      </section>

      <div className="glass-panel rounded-[1.8rem] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
            Scene {sceneIndex + 1} of {episode.scenes.length}
          </p>
          <p className="text-xs text-gray-500">{episode.durationMinutes} min story pass</p>
        </div>
        <div className="story-progress-track mt-3">
          <div className="story-progress-fill" style={{ width: `${sceneProgress}%` }} />
        </div>
      </div>

      <StorySceneStage scene={scene} language={language} characterStates={sceneCharacterStates} />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.85fr]">
        <div className="clay-card rounded-[1.8rem] px-5 py-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
                {viewMode === 'story' ? 'Narration' : 'Deeper meaning'}
              </p>
              <p className="text-sm text-gray-500 mt-1">{scene.title[language]}</p>
            </div>
            <span className="clay-pill text-[11px] text-[color:var(--brand-primary)]">{scene.ambientAudio}</span>
          </div>

          <p className="text-base leading-8 text-gray-800 whitespace-pre-wrap">{currentReading()}</p>

          <div className="glass-panel rounded-[1.45rem] px-4 py-4 border border-white/60">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Reflect together</p>
            <p className="text-sm text-gray-700 leading-relaxed mt-2">{scene.reflectionPrompt[language]}</p>
          </div>

          {scene.glossary.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Glossary</p>
              <div className="flex flex-wrap gap-2">
                {scene.glossary.map((item) => {
                  const isOpen = activeGlossary === item.term;
                  return (
                    <button
                      key={item.term}
                      type="button"
                      onClick={() => setActiveGlossary(isOpen ? null : item.term)}
                      className={`story-glossary-chip ${isOpen ? 'story-glossary-chip-active' : ''}`}
                    >
                      {item.term}
                    </button>
                  );
                })}
              </div>
              {activeGlossary && (
                <div className="glass-panel rounded-[1.3rem] px-4 py-3 border border-white/60">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {scene.glossary.find((item) => item.term === activeGlossary)?.definition[language]}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => goToScene(sceneIndex - 1)}
              disabled={sceneIndex === 0}
              className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-[color:var(--brand-primary)] disabled:opacity-50"
            >
              Previous scene
            </button>
            <button
              type="button"
              onClick={() => goToScene(sceneIndex + 1)}
              disabled={sceneIndex === episode.scenes.length - 1}
              className="glass-button-primary px-4 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50"
            >
              Next scene
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-[1.7rem] px-4 py-4 border border-white/60">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Verse anchors</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              Open the linked Bhagavad Gita verses whenever you want the source-backed layer behind this scene.
            </p>
            <div className="grid gap-2 mt-4">
              {scene.verseAnchors.map((anchor) => (
                <div key={`${anchor.chapterNumber}-${anchor.verseNumber}`} className="story-verse-card">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {anchor.label[language]} · Gita {anchor.chapterNumber}.{anchor.verseNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Source-backed verse link</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link href={anchor.href} className="story-inline-link">
                      Open verse
                    </Link>
                    <a href={anchor.officialAudioUrl} target="_blank" rel="noreferrer" className="story-inline-link">
                      Listen
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="clay-card rounded-[1.7rem] px-4 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Grow with the characters</p>
            {sceneCharacterStates.map((state) => (
              <div key={state.id} className="story-growth-card">
                <div>
                  <p className="font-semibold text-gray-900">{state.displayName}</p>
                  <p className="text-xs text-gray-500 mt-1">{state.ageStage}</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{state.descriptor[language]}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-[1.7rem] px-4 py-4 border border-white/60">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">AI study prompts</p>
            <div className="grid gap-2 mt-4">
              {aiPrompts.map((prompt) => (
                <Link key={prompt.label} href={prompt.href} className="story-ai-card">
                  <p className="text-sm font-semibold text-gray-900">{prompt.label}</p>
                  <p className="text-xs text-gray-600 mt-1">{prompt.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[1.8rem] px-5 py-5 border border-white/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Back to verse loop</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              Move between story mode and canonical study whenever you want. The story warms the heart; the chapter and verses hold the formal source layer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={chapterHref} className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-[color:var(--brand-primary)]">
              {episode.chapterNumber ? 'Back to chapter' : 'Open Gita handoff'}
            </Link>
            <Link href={standalone ? '/gita-story' : '/library/hindu/gita/story'} className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-[color:var(--brand-primary)]">
              Episode map
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {previousEpisode ? (
          <Link href={getGitaStoryEpisodeHref(previousEpisode.id, standalone)} className="story-nav-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Previous episode</p>
            <p className="font-semibold text-gray-900 mt-2">{previousEpisode.title.en}</p>
          </Link>
        ) : (
          <div className="story-nav-card opacity-70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Start of journey</p>
            <p className="font-semibold text-gray-900 mt-2">You are at the first episode in this sequence.</p>
          </div>
        )}

        {nextEpisode ? (
          <Link href={getGitaStoryEpisodeHref(nextEpisode.id, standalone)} className="story-nav-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Next episode</p>
            <p className="font-semibold text-gray-900 mt-2">{nextEpisode.title.en}</p>
          </Link>
        ) : (
          <div className="story-nav-card opacity-70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Journey complete</p>
            <p className="font-semibold text-gray-900 mt-2">You have reached the final episode in the current story path.</p>
          </div>
        )}
      </section>
    </div>
  );
}
