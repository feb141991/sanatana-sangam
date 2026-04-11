'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, type ProfileUpdate } from '@/lib/api/profile';
import { queryKeys } from '@/lib/query-keys';
import type { Profile } from '@/types/database';

export function useProfileQuery(userId: string, initialData?: Profile | null) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => fetchProfile(userId),
    enabled: Boolean(userId),
    initialData: initialData ?? undefined,
  });
}

export function useUpdateProfileMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileUpdate) => updateProfile(userId, payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile(userId), profile);
    },
  });
}
