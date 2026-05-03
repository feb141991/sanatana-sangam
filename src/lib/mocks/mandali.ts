import type { MandaliData, MandaliMemberRow, MandaliProfile } from '@/lib/api/mandali';
import type { EventRsvp, PostCommentWithAuthor, PostWithAuthor } from '@/types/database';

type MandaliState = {
  profile: MandaliProfile;
  posts: PostWithAuthor[];
  comments: PostCommentWithAuthor[];
  rsvps: EventRsvp[];
  members: MandaliMemberRow[];
  blendedPosts: PostWithAuthor[];
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const baseProfile: MandaliProfile = {
  id: 'mock-user',
  created_at: new Date('2026-01-01').toISOString(),
  updated_at: new Date('2026-04-11').toISOString(),
  full_name: 'Prince Sharma',
  username: 'prince',
  avatar_url: null,
  bio: null,
  city: 'London',
  country: 'United Kingdom',
  latitude: null,
  longitude: null,
  sampradaya: 'vaishnava',
  ishta_devata: 'krishna',
  spiritual_level: 'sadhaka',
  kul: null,
  gotra: null,
  kul_devata: null,
  home_town: null,
  shloka_streak: 14,
  last_shloka_date: null,
  languages: [],
  seeking: [],
  seva_score: 120,
  mandali_id: 'mock-mandali-1',
  onesignal_player_id: null,
  country_code: 'GB',
  timezone: 'Europe/London',
  tradition: 'hindu',
  custom_greeting: null,
  app_language: 'en',
  scripture_script: 'original',
  show_transliteration: true,
  meaning_language: 'en',
  wants_festival_reminders: true,
  wants_shloka_reminders: true,
  wants_community_notifications: true,
  wants_family_notifications: true,
  notification_quiet_hours_start: 22,
  notification_quiet_hours_end: 7,
  is_admin: false,
  is_pro: false,
  life_stage: 'grihastha',
  life_stage_locked: false,
  gender_context: 'general',
  date_of_birth: null,
  mandalis: {
    name: 'North London Mandali',
    city: 'London',
    country: 'United Kingdom',
    member_count: 12,
  },
  neighbourhood: 'North London',
};

const baseMembers: MandaliMemberRow[] = [
  {
    id: 'mock-user',
    full_name: 'Prince Sharma',
    username: 'prince',
    avatar_url: null,
    sampradaya: 'vaishnava',
    ishta_devata: 'krishna',
    spiritual_level: 'sadhaka',
    city: 'London',
    seva_score: 120,
  },
  {
    id: 'mandali-friend',
    full_name: 'Meera Patel',
    username: 'meera',
    avatar_url: null,
    sampradaya: 'shaiva',
    ishta_devata: 'shiva',
    spiritual_level: 'jigyasu',
    city: 'London',
    seva_score: 86,
  },
];

const basePosts: PostWithAuthor[] = [
  {
    id: 'post-1',
    created_at: new Date('2026-04-11T09:00:00.000Z').toISOString(),
    updated_at: new Date('2026-04-11T09:00:00.000Z').toISOString(),
    author_id: 'mandali-friend',
    mandali_id: 'mock-mandali-1',
    content: 'Temple hall is confirmed for Sunday satsang. Bring one extra mat if possible.',
    type: 'event',
    upvotes: 4,
    comment_count: 1,
    is_pinned: false,
    event_date: '2026-04-13T10:00:00.000Z',
    event_location: 'Shree Krishna Mandir',
    profiles: {
      full_name: 'Meera Patel',
      username: 'meera',
      avatar_url: null,
      sampradaya: 'shaiva',
      spiritual_level: 'jigyasu',
    },
  },
];

const baseComments: PostCommentWithAuthor[] = [
  {
    id: 'comment-1',
    post_id: 'post-1',
    author_id: 'mock-user',
    body: 'I can bring two mats.',
    parent_id: null,
    created_at: new Date('2026-04-11T10:00:00.000Z').toISOString(),
    profiles: { full_name: 'Prince Sharma', username: 'prince', avatar_url: null },
  },
];

const baseRsvps: EventRsvp[] = [
  {
    id: 'rsvp-1',
    post_id: 'post-1',
    user_id: 'mock-user',
    status: 'going',
    created_at: new Date('2026-04-11T10:05:00.000Z').toISOString(),
    updated_at: new Date('2026-04-11T10:05:00.000Z').toISOString(),
  },
];

const baseBlendedPosts: PostWithAuthor[] = [
  {
    id: 'blended-1',
    created_at: new Date('2026-04-10T09:00:00.000Z').toISOString(),
    updated_at: new Date('2026-04-10T09:00:00.000Z').toISOString(),
    author_id: 'other-mandali',
    mandali_id: 'other-mandali',
    content: 'The wider Sangam reading circle is sharing one shloka reflection tonight.',
    type: 'question',
    upvotes: 7,
    comment_count: 0,
    is_pinned: false,
    event_date: null,
    event_location: null,
    profiles: {
      full_name: 'Raghav',
      username: 'raghav',
      avatar_url: null,
      sampradaya: 'advaita',
      spiritual_level: 'sadhaka',
    },
  },
];

const store = new Map<string, MandaliState>();

function ensureState(userId: string) {
  if (!store.has(userId)) {
    store.set(userId, {
      profile: clone(baseProfile),
      posts: clone(basePosts),
      comments: clone(baseComments),
      rsvps: clone(baseRsvps),
      members: clone(baseMembers),
      blendedPosts: clone(baseBlendedPosts),
    });
  }
  return store.get(userId)!;
}

export async function fetchMockMandaliData(userId: string): Promise<MandaliData> {
  const state = ensureState(userId);
  return clone(state);
}

export async function joinMockMandaliForLocation(userId: string, city: string, country: string) {
  const state = ensureState(userId);
  if (state.profile) {
    state.profile.city = city.trim();
    state.profile.country = country.trim();
    state.profile.mandali_id = 'mock-mandali-1';
    state.profile.mandalis = {
      name: `${city.trim()} Mandali`,
      city: city.trim(),
      country: country.trim(),
      member_count: state.members.length,
    };
  }
  return 'mock-mandali-1';
}

export async function leaveMockMandali(userId: string) {
  const state = ensureState(userId);
  if (state.profile) {
    state.profile.mandali_id = null;
    state.profile.mandalis = null;
  }
}

export async function createMockMandaliPost(userId: string, payload: {
  mandaliId: string;
  content: string;
  postType: 'update' | 'event' | 'question' | 'announcement';
  eventDate?: string;
  eventLoc?: string;
}) {
  const state = ensureState(userId);
  state.posts.unshift({
    id: `post-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author_id: userId,
    mandali_id: payload.mandaliId,
    content: payload.content.trim(),
    type: payload.postType,
    upvotes: 0,
    comment_count: 0,
    is_pinned: false,
    event_date: payload.eventDate || null,
    event_location: payload.eventLoc || null,
    profiles: {
      full_name: 'You',
      username: 'you',
      avatar_url: null,
      sampradaya: 'vaishnava',
      spiritual_level: 'sadhaka',
    },
  });
}

export async function toggleMockMandaliPostUpvote(userId: string, postId: string, isUpvoted: boolean) {
  const state = ensureState(userId);
  const post = state.posts.find((item) => item.id === postId) ?? state.blendedPosts.find((item) => item.id === postId);
  if (post) {
    post.upvotes = Math.max(0, post.upvotes + (isUpvoted ? -1 : 1));
  }
  return !isUpvoted;
}

export async function createMockMandaliComment(userId: string, payload: {
  postId: string;
  body: string;
  parentId?: string | null;
}) {
  const state = ensureState(userId);
  state.comments.push({
    id: `comment-${Date.now()}`,
    post_id: payload.postId,
    author_id: userId,
    body: payload.body.trim(),
    parent_id: payload.parentId ?? null,
    created_at: new Date().toISOString(),
    profiles: { full_name: 'You', username: 'you', avatar_url: null },
  });
}

export async function updateMockMandaliRsvp(userId: string, payload: {
  postId: string;
  status: 'going' | 'interested' | 'not_going';
}) {
  const state = ensureState(userId);
  const existing = state.rsvps.find((item) => item.post_id === payload.postId && item.user_id === userId);
  if (existing) {
    existing.status = payload.status;
    existing.updated_at = new Date().toISOString();
    return;
  }

  state.rsvps.push({
    id: `rsvp-${Date.now()}`,
    post_id: payload.postId,
    user_id: userId,
    status: payload.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
