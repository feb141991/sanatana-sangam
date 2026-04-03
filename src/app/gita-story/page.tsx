import type { Metadata } from 'next';
import { StoryHome } from '@/components/story/StoryHome';

export const metadata: Metadata = {
  title: 'Kanu Story App',
  description: 'A Krishna-inspired Bhagavad Gita story journey with chapter story bridges and source-linked verse study.',
};

export default function StandaloneGitaStoryHomePage() {
  return <StoryHome standalone />;
}
