export type VerifiedSourcePlatform = 'youtube-channel' | 'youtube-live-video' | 'web-live-page';

export type VerifiedLiveStreamSource = {
  id: string;
  title: string;
  tradition: 'sikh' | 'jain' | 'buddhist';
  platform: VerifiedSourcePlatform;
  sourceUrl: string;
  organization: string;
  verification: 'manual-review' | 'official-live-page';
  appReady: boolean;
  youtubeChannelId?: string;
  fallbackVideoId?: string;
  notes?: string;
};

/**
 * Curated source inventory for future Live Darshan expansion.
 * Additions here are intentionally conservative: official channels or clearly
 * attributable live pages only. This catalog is for sourcing/admin ingestion,
 * not automatic public rendering.
 */
export const VERIFIED_LIVE_STREAM_SOURCES: VerifiedLiveStreamSource[] = [
  {
    id: 'sgpc-official-kirtan',
    title: 'Official SGPC Gurbani Kirtan',
    tradition: 'sikh',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=8GTgg2TmRLQ',
    organization: 'SGPC, Sri Amritsar',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UCYn6UEtQ771a_OWSiNBoG8w',
    fallbackVideoId: '8GTgg2TmRLQ',
    notes: 'Remote author resolves to SGPC, Sri Amritsar. Canonical channel ID resolved from the live video.',
  },
  {
    id: 'takhat-hazur-sahib-live',
    title: 'Takhat Sachkhand Hazur Sahib 24x7',
    tradition: 'sikh',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=YsI5XOB4z7g',
    organization: 'Takhat Sachkhand Hazur Sahib',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UCuerQ47I9Y2qxr4eIopxbYw',
    fallbackVideoId: 'YsI5XOB4z7g',
  },
  {
    id: 'takhat-patna-sahib-live',
    title: 'Takhat Sri Harimandir Ji Patna Sahib',
    tradition: 'sikh',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=2VoKxEz6sSc',
    organization: 'Takhat Sri Harimandir Ji Patna Sahib',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UC3nqw1kd4AK1q9e68YUoLDQ',
    fallbackVideoId: '2VoKxEz6sSc',
  },
  {
    id: 'darbar-surrey-kirtan',
    title: 'Darbar Sri Guru Granth Sahib Ji, Surrey BC',
    tradition: 'sikh',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=YlnQ2apbtuQ',
    organization: 'Darbar Sri Guru Granth Sahib Ji, Surrey BC',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UCZTngRGg1Dc2RKq6DbQLfvw',
    fallbackVideoId: 'YlnQ2apbtuQ',
  },
  {
    id: 'hazoori-ragi-expeder',
    title: 'Hazoori Ragi Gurbani Shabad Kirtan',
    tradition: 'sikh',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=SfkiRiVr3wc',
    organization: 'Expeder Music',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UCcMsjQs6pMLQWbW3ufhz1SQ',
    fallbackVideoId: 'SfkiRiVr3wc',
    notes: 'Real live kirtan source, but not an institutional gurdwara channel.',
  },
  {
    id: 'jinvani-channel-live',
    title: 'Jinvani Channel Live',
    tradition: 'jain',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=7Ulm6UNZ578',
    organization: 'Jinvani Channel',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UCDNNWj0oAFXngcwHAwnwP4w',
    fallbackVideoId: '7Ulm6UNZ578',
  },
  {
    id: 'aadinath-tv-live',
    title: 'Aadinath TV 24x7 Live',
    tradition: 'jain',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=K1rbZLQ2GbQ',
    organization: 'Aadinath Tv Channel',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UCY8r_lukdRi5cK5wjK_O3qw',
    fallbackVideoId: 'K1rbZLQ2GbQ',
  },
  {
    id: 'paras-tv-live',
    title: 'Paras TV Live Stream',
    tradition: 'jain',
    platform: 'youtube-live-video',
    sourceUrl: 'https://www.youtube.com/watch?v=cDzIiI0kvNg',
    organization: 'Paras TV',
    verification: 'manual-review',
    appReady: true,
    youtubeChannelId: 'UC6E1pvhGa55AaZ-svF70ViA',
    fallbackVideoId: 'cDzIiI0kvNg',
  },
  {
    id: 'byodoji-live',
    title: 'Byodoji Temple 24-hour Live',
    tradition: 'buddhist',
    platform: 'web-live-page',
    sourceUrl: 'https://byodoji.online/en/live',
    organization: 'Byodoji Temple',
    verification: 'official-live-page',
    appReady: false,
    youtubeChannelId: 'UCsfGwaUd86SdJJGkUEhel4Q',
    notes: 'Official live page verified. Keep out of public app until direct stream/channel ingestion is confirmed.',
  },
];
