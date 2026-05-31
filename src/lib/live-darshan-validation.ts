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

async function fetchYouTubeJson(url: string) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${body.slice(0, 160) || res.statusText}`.trim());
  }
  return res.json() as Promise<any>;
}

export async function fetchYouTubeVideoMeta(videoId: string, apiKey?: string): Promise<VideoValidationMeta> {
  const oembed = await fetchYouTubeJson(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
  const meta: VideoValidationMeta = {
    title: oembed.title,
    author: oembed.author_name,
  };

  if (apiKey) {
    const json = await fetchYouTubeJson(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
    );
    const item = json?.items?.[0];
    if (!item?.snippet) {
      throw new Error('Video metadata missing from YouTube Data API');
    }
    meta.channelId = item.snippet.channelId;
    meta.liveBroadcastContent = item.snippet.liveBroadcastContent;
  }

  return meta;
}

export async function fetchYouTubeChannelTitle(channelId: string, apiKey: string): Promise<string> {
  const json = await fetchYouTubeJson(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`,
  );
  const item = json?.items?.[0];
  if (!item?.snippet?.title) {
    throw new Error('YouTube channel not found');
  }
  return item.snippet.title as string;
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
