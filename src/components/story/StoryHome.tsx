import Link from 'next/link';
import {
  KANU_STORY_ARCS,
  KANU_STORY_PLEDGE,
  getKanuStoryChapterEpisodes,
  getKanuStoryFeaturedEpisodes,
  getKanuStoryEpisodeRuntimeHref,
} from '@/lib/story/kanu-story';
import { getGitaStoryHref, getPathshalaChapterHref, getPathshalaSectionHref } from '@/lib/pathshala-links';

interface StoryHomeProps {
  standalone?: boolean;
}

export function StoryHome({ standalone = false }: StoryHomeProps) {
  const featuredEpisodes = getKanuStoryFeaturedEpisodes();
  const chapterEpisodes = getKanuStoryChapterEpisodes();

  return (
    <div className={`space-y-4 pb-8 fade-in ${standalone ? 'story-standalone-shell' : ''}`}>
      <section className="story-hero-shell rounded-[2rem] p-5 md:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-accent-soft)]">
              Krishna-inspired story companion
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mt-3">
              Kanu: A lively Bhagavad Gita story journey
            </h1>
            <p className="text-sm md:text-base text-white/82 leading-relaxed mt-4">
              {KANU_STORY_PLEDGE.description.en}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                href={getKanuStoryEpisodeRuntimeHref(featuredEpisodes[0]?.id ?? 'gokul-moonlit-promise', standalone)}
                className="story-primary-cta"
              >
                Start with Kanu
              </Link>
              <Link
                href={getPathshalaSectionHref('hindu', 'gita')}
                className="story-secondary-cta"
              >
                Open canonical Gita
              </Link>
              {standalone && (
                <Link href={getGitaStoryHref(false)} className="story-secondary-cta">
                  View inside Pathshala
                </Link>
              )}
            </div>
          </div>

          <div className="story-hero-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-accent-soft)]">
              Trust boundary
            </p>
            <div className="grid gap-2 mt-3 text-sm text-white/85">
              <p>Story retelling: editorial scene-building for orientation.</p>
              <p>Canonical verse: direct Gita source layer with chapter/verse links.</p>
              <p>Meaning: study-friendly explanation tied to the text.</p>
              <p>Reflection: prompts for kids, parents, and elders to carry forward.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {KANU_STORY_ARCS.map((arc) => {
          const episode = featuredEpisodes.find((item) => item.id === arc.featuredEpisodeId);
          if (!episode) return null;

          return (
            <Link
              key={arc.id}
              href={getKanuStoryEpisodeRuntimeHref(episode.id, standalone)}
              className="story-arc-card"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
                {arc.ageBand.en}
              </p>
              <h2 className="font-display text-lg font-bold text-gray-900 mt-3">{arc.title.en}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">{arc.summary.en}</p>
              <div className="flex items-center justify-between gap-3 mt-4">
                <span className="clay-pill text-[11px] text-[color:var(--brand-primary)]">{arc.atmosphere}</span>
                <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open arc →</span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="clay-card rounded-[1.8rem] px-5 py-5 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
              Full chapter story continuum
            </p>
            <h2 className="font-display text-2xl font-bold text-gray-900 mt-2">
              All 18 chapters, with story bridges and verse links
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mt-2 max-w-2xl">
              Each chapter episode gives a cinematic orientation layer, a deeper-meaning layer, and direct paths back to the canonical Bhagavad Gita reading flow.
            </p>
          </div>
          <Link
            href={getPathshalaChapterHref('hindu', 'gita', 'chapter-1')}
            className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-[color:var(--brand-primary)]"
          >
            Open chapter map
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {chapterEpisodes.map((episode) => (
            <Link
              key={episode.id}
              href={getKanuStoryEpisodeRuntimeHref(episode.id, standalone)}
              className="glass-panel rounded-[1.45rem] px-4 py-4 border border-white/65 hover:-translate-y-0.5 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
                    Chapter {episode.chapterNumber}
                  </p>
                  <p className="font-semibold text-gray-900 mt-2">{episode.title.en}</p>
                </div>
                <span className="clay-pill text-[11px] text-[color:var(--brand-primary)]">
                  {episode.durationMinutes} min
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">{episode.summary.en}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
