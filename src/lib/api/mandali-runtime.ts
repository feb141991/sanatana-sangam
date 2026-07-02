import {
  createMandaliComment as createLiveMandaliComment,
  createMandaliPost as createLiveMandaliPost,
  fetchMandaliData as fetchLiveMandaliData,
  joinMandaliForLocation as joinLiveMandaliForLocation,
  leaveMandali as leaveLiveMandali,
  toggleMandaliPostUpvote as toggleLiveMandaliPostUpvote,
  updateMandaliRsvp as updateLiveMandaliRsvp,
} from '@/lib/api/mandali';
import type { MandaliData } from '@/lib/api/mandali';
import {
  createMockMandaliComment,
  createMockMandaliPost,
  fetchMockMandaliData,
  joinMockMandaliForLocation,
  leaveMockMandali,
  toggleMockMandaliPostUpvote,
  updateMockMandaliRsvp,
} from '@/lib/mocks/mandali';
import { selectRuntimeAdapter } from '@shared-core/runtime/selectRuntimeAdapter';

export type { MandaliData, MandaliMemberRow, MandaliProfile } from '@/lib/api/mandali';

type RuntimeMandaliApi = {
  fetchMandaliData: (userId: string) => Promise<MandaliData>;
  joinMandaliForLocation: (userId: string, city: string, country: string) => Promise<string>;
  leaveMandali: (userId: string) => Promise<void>;
  createMandaliPost: (payload: {
    userId: string;
    mandaliId: string;
    content: string;
    postType: 'update' | 'event' | 'question' | 'announcement';
    eventDate?: string;
    eventLoc?: string;
  }) => Promise<void>;
  toggleMandaliPostUpvote: (postId: string, userId: string, isUpvoted: boolean) => Promise<boolean>;
  createMandaliComment: (payload: {
    postId: string;
    userId: string;
    body: string;
    parentId?: string | null;
  }) => Promise<void>;
  updateMandaliRsvp: (payload: {
    postId: string;
    userId: string;
    status: 'going' | 'interested' | 'not_going';
  }) => Promise<void>;
};

const mandaliRuntimeApi = selectRuntimeAdapter<RuntimeMandaliApi>({
  live: {
    fetchMandaliData: fetchLiveMandaliData,
    joinMandaliForLocation: joinLiveMandaliForLocation,
    leaveMandali: leaveLiveMandali,
    createMandaliPost: createLiveMandaliPost,
    toggleMandaliPostUpvote: toggleLiveMandaliPostUpvote,
    createMandaliComment: createLiveMandaliComment,
    updateMandaliRsvp: updateLiveMandaliRsvp,
  },
  mock: {
    fetchMandaliData: fetchMockMandaliData,
    joinMandaliForLocation: joinMockMandaliForLocation,
    leaveMandali: leaveMockMandali,
    createMandaliPost: (payload) => createMockMandaliPost(payload.userId, payload),
    toggleMandaliPostUpvote: (postId, userId, isUpvoted) => toggleMockMandaliPostUpvote(userId, postId, isUpvoted),
    createMandaliComment: (payload) => createMockMandaliComment(payload.userId, payload),
    updateMandaliRsvp: (payload) => updateMockMandaliRsvp(payload.userId, payload),
  },
});

export async function fetchMandaliData(userId: string): Promise<MandaliData> {
  return mandaliRuntimeApi.fetchMandaliData(userId);
}

export async function joinMandaliForLocation(userId: string, city: string, country: string) {
  return mandaliRuntimeApi.joinMandaliForLocation(userId, city, country);
}

export async function leaveMandali(userId: string) {
  return mandaliRuntimeApi.leaveMandali(userId);
}

export async function createMandaliPost(payload: {
  userId: string;
  mandaliId: string;
  content: string;
  postType: 'update' | 'event' | 'question' | 'announcement';
  eventDate?: string;
  eventLoc?: string;
}) {
  return mandaliRuntimeApi.createMandaliPost(payload);
}

export async function toggleMandaliPostUpvote(postId: string, userId: string, isUpvoted: boolean) {
  return mandaliRuntimeApi.toggleMandaliPostUpvote(postId, userId, isUpvoted);
}

export async function createMandaliComment(payload: {
  postId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}) {
  return mandaliRuntimeApi.createMandaliComment(payload);
}

export async function updateMandaliRsvp(payload: {
  postId: string;
  userId: string;
  status: 'going' | 'interested' | 'not_going';
}) {
  return mandaliRuntimeApi.updateMandaliRsvp(payload);
}
