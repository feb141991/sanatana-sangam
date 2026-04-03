import { notFound } from 'next/navigation';
import { StoryEpisodeClient } from '@/components/story/StoryEpisodeClient';
import {
  getKanuStoryCharacterStates,
  getKanuStoryEpisode,
  getKanuStoryNeighbors,
} from '@/lib/story/kanu-story';

export default async function GitaStoryEpisodePage({
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
    />
  );
}
