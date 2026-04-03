import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoryEpisodeClient } from '@/components/story/StoryEpisodeClient';
import {
  getKanuStoryCharacterStates,
  getKanuStoryEpisode,
  getKanuStoryNeighbors,
} from '@/lib/story/kanu-story';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ episodeId: string }>;
}): Promise<Metadata> {
  const { episodeId } = await params;
  const episode = getKanuStoryEpisode(episodeId);

  if (!episode) {
    return { title: 'Kanu Story App' };
  }

  return {
    title: `${episode.title.en} | Kanu Story App`,
    description: episode.summary.en,
  };
}

export default async function StandaloneGitaStoryEpisodePage({
  params,
}: {
  params: Promise<{ episodeId: string }>;
}) {
  const { episodeId } = await params;
  const episode = getKanuStoryEpisode(episodeId);

  if (!episode) {
    notFound();
  }

  const { previous, next } = getKanuStoryNeighbors(episodeId);
  const characterStates = getKanuStoryCharacterStates(
    Array.from(new Set(episode.scenes.flatMap((scene) => scene.focusCharacterStateIds))),
  );

  return (
    <StoryEpisodeClient
      episode={episode}
      characterStates={characterStates}
      previousEpisode={previous}
      nextEpisode={next}
      standalone
    />
  );
}
