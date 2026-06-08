export type LiveDarshanCategory = 'mandir' | 'katha' | 'satsang';
export type LiveDarshanTradition = 'hindu' | 'sikh' | 'jain' | 'buddhist';

export type LiveDarshanInput = {
  id: string;
  title: string;
  location: string;
  schedule: string;
  category: LiveDarshanCategory;
  tradition: LiveDarshanTradition;
  youtube_channel_id: string;
  current_video_id?: string | null;
  is_active?: boolean;
};

export type VideoValidationMeta = {
  title?: string;
  author?: string;
  channelId?: string;
  liveBroadcastContent?: string;
  embeddable?: boolean;
  privacyStatus?: string;
  actualStartTime?: string;
  actualEndTime?: string;
};

export type LiveDarshanValidationResult = {
  ok: boolean;
  errors: string[];
  channelTitle?: string;
  currentVideo?: VideoValidationMeta;
};

const YOUTUBE_CHANNEL_ID = /^UC[a-zA-Z0-9_-]{22}$/;
const YOUTUBE_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

export function isValidYouTubeChannelId(value: string) {
  return YOUTUBE_CHANNEL_ID.test(value.trim());
}

export function isValidYouTubeVideoId(value: string) {
  return YOUTUBE_VIDEO_ID.test(value.trim());
}

async function fetchYouTubeJson(url: string): Promise<unknown> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${body.slice(0, 160) || res.statusText}`.trim());
  }
  return res.json() as Promise<unknown>;
}

type YouTubeVideoItem = {
  snippet?: { channelId?: string; liveBroadcastContent?: string };
  status?: { privacyStatus?: string; embeddable?: boolean };
  liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string };
};

type YouTubeVideoListResponse = {
  items?: YouTubeVideoItem[];
};

type YouTubeOEmbedResponse = {
  title?: string;
  author_name?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export async function fetchYouTubeVideoMeta(videoId: string, apiKey?: string): Promise<VideoValidationMeta> {
  // oEmbed gives us title + author without an API key.
  // When no API key is available we cannot verify privacy/embeddability — caller must
  // treat the result as partial and note it cannot claim full precision.
  const oembedRaw = await fetchYouTubeJson(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
  );
  const oembed = isRecord(oembedRaw) ? (oembedRaw as YouTubeOEmbedResponse) : {};
  const meta: VideoValidationMeta = {
    title: typeof oembed.title === 'string' ? oembed.title : undefined,
    author: typeof oembed.author_name === 'string' ? oembed.author_name : undefined,
  };

  if (apiKey) {
    const raw = await fetchYouTubeJson(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,liveStreamingDetails&id=${videoId}&key=${apiKey}`,
    );
    const response = isRecord(raw) ? (raw as YouTubeVideoListResponse) : {};
    const item = response.items?.[0];
    if (!item) {
      throw new Error('Video not found in YouTube Data API — it may be deleted or private');
    }
    if (!item.snippet) {
      throw new Error('Video metadata missing from YouTube Data API');
    }

    // Privacy check — only public videos should be in live darshan playlists.
    const privacy = item.status?.privacyStatus;
    if (privacy && privacy !== 'public') {
      throw new Error(`Video is not public (privacyStatus: ${privacy})`);
    }

    // Embeddable check — non-embeddable videos cannot be rendered in the player.
    if (item.status?.embeddable === false) {
      throw new Error('Video is not embeddable — it cannot be shown in the app player');
    }

    meta.channelId = item.snippet.channelId;
    meta.liveBroadcastContent = item.snippet.liveBroadcastContent;
    meta.privacyStatus = privacy;
    meta.embeddable = item.status?.embeddable;
    meta.actualStartTime = item.liveStreamingDetails?.actualStartTime;
    meta.actualEndTime = item.liveStreamingDetails?.actualEndTime;
  }

  return meta;
}

export async function fetchYouTubeChannelTitle(channelId: string, apiKey: string): Promise<string> {
  const raw = await fetchYouTubeJson(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`,
  );
  const response = isRecord(raw) ? (raw as { items?: Array<{ snippet?: { title?: string } }> }) : {};
  const title = response.items?.[0]?.snippet?.title;
  if (!title) {
    throw new Error('YouTube channel not found');
  }
  return title;
}

export async function validateLiveDarshanInput(
  input: LiveDarshanInput,
  options: { youtubeApiKey?: string } = {},
): Promise<LiveDarshanValidationResult> {
  const errors: string[] = [];
  const youtubeApiKey = options.youtubeApiKey?.trim();

  if (!input.id?.trim()) errors.push('id is required');
  if (!input.title?.trim()) errors.push('title is required');
  if (!input.location?.trim()) errors.push('location is required');
  if (!input.schedule?.trim()) errors.push('schedule is required');
  if (!isValidYouTubeChannelId(input.youtube_channel_id ?? '')) {
    errors.push('youtube_channel_id must be a valid YouTube channel ID');
  }
  if (input.current_video_id && !isValidYouTubeVideoId(input.current_video_id)) {
    errors.push('current_video_id must be a valid YouTube video ID');
  }
  if (!youtubeApiKey) {
    errors.push('YOUTUBE_API_KEY is required for live darshan validation');
  }
  if (errors.length > 0) return { ok: false, errors };

  let channelTitle = '';
  try {
    channelTitle = await fetchYouTubeChannelTitle(input.youtube_channel_id, youtubeApiKey!);
  } catch (error) {
    errors.push(error instanceof Error ? `youtube_channel_id: ${error.message}` : 'youtube_channel_id validation failed');
  }

  let currentVideo: VideoValidationMeta | undefined;
  if (input.current_video_id) {
    try {
      currentVideo = await fetchYouTubeVideoMeta(input.current_video_id, youtubeApiKey);
      if (currentVideo.channelId && currentVideo.channelId !== input.youtube_channel_id) {
        errors.push('current_video_id does not belong to youtube_channel_id');
      }
    } catch (error) {
      errors.push(error instanceof Error ? `current_video_id: ${error.message}` : 'current_video_id validation failed');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    channelTitle,
    currentVideo,
  };
}
