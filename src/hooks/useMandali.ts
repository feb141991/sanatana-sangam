'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMandaliComment,
  createMandaliPost,
  fetchMandaliData,
  joinMandaliForLocation,
  leaveMandali,
  toggleMandaliPostUpvote,
  updateMandaliRsvp,
  type MandaliData,
} from '@/lib/api/mandali';
import { queryKeys } from '@/lib/query-keys';

export function useMandaliQuery(userId: string, initialData?: MandaliData) {
  return useQuery({
    queryKey: queryKeys.mandali.byUser(userId),
    queryFn: () => fetchMandaliData(userId),
    enabled: Boolean(userId),
    initialData,
  });
}

export function useMandaliMutations(userId: string) {
  const queryClient = useQueryClient();

  async function refreshMandali() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.mandali.byUser(userId) });
  }

  return {
    joinMandali: useMutation({
      mutationFn: ({ city, country }: { city: string; country: string }) => joinMandaliForLocation(userId, city, country),
      onSuccess: refreshMandali,
    }),
    leaveMandali: useMutation({
      mutationFn: () => leaveMandali(userId),
      onSuccess: refreshMandali,
    }),
    submitPost: useMutation({
      mutationFn: (payload: {
        mandaliId: string;
        content: string;
        postType: 'update' | 'event' | 'question' | 'announcement';
        eventDate?: string;
        eventLoc?: string;
      }) => createMandaliPost({ userId, ...payload }),
      onSuccess: refreshMandali,
    }),
    toggleUpvote: useMutation({
      mutationFn: ({ postId, isUpvoted }: { postId: string; isUpvoted: boolean }) =>
        toggleMandaliPostUpvote(postId, userId, isUpvoted),
      onSuccess: refreshMandali,
    }),
    addComment: useMutation({
      mutationFn: (payload: { postId: string; body: string; parentId?: string | null }) =>
        createMandaliComment({ userId, ...payload }),
      onSuccess: refreshMandali,
    }),
    updateRsvp: useMutation({
      mutationFn: (payload: { postId: string; status: 'going' | 'interested' | 'not_going' }) =>
        updateMandaliRsvp({ userId, ...payload }),
      onSuccess: refreshMandali,
    }),
  };
}
