import { GITA_AUDIO_TRACKS, getGitaAudioTrack } from '@/lib/gita-audio';
import { getPathshalaTraditionMeta } from '@/lib/library-content';
import GitaRecitationClient from './GitaRecitationClient';

export default async function GitaRecitationPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const params = await searchParams;
  const traditionMeta = getPathshalaTraditionMeta('hindu');
  const highlightedTrack = getGitaAudioTrack(params.chapter);

  return (
    <GitaRecitationClient
      tracks={GITA_AUDIO_TRACKS}
      highlightedChapterId={highlightedTrack?.chapterId}
      traditionLabel={traditionMeta.label}
    />
  );
}
