import { STOTRAM_SUMMARIES, DEITY_META, MOOD_META } from '@/lib/stotrams';
import BrowseClient from './BrowseClient';

export default function BrowsePage() {
  return (
    <BrowseClient
      stotramSummaries={STOTRAM_SUMMARIES}
      deityMeta={DEITY_META}
      moodMeta={MOOD_META}
    />
  );
}
