import { fetchProfile as fetchLiveProfile, updateProfile as updateLiveProfile, type ProfileUpdate } from '@/lib/api/profile';
import { fetchMockProfile, updateMockProfile } from '@/lib/mocks/profile';
import { selectRuntimeAdapter } from '@shared-core/runtime/selectRuntimeAdapter';
import type { Profile } from '@/types/database';

type RuntimeProfileApi = {
  fetchProfile: (userId: string) => Promise<Profile>;
  updateProfile: (userId: string, payload: ProfileUpdate) => Promise<Profile>;
};

const profileRuntimeApi = selectRuntimeAdapter<RuntimeProfileApi>({
  live: {
    fetchProfile: fetchLiveProfile,
    updateProfile: updateLiveProfile,
  },
  mock: {
    fetchProfile: fetchMockProfile,
    updateProfile: updateMockProfile,
  },
});

export type { ProfileUpdate } from '@/lib/api/profile';

export async function fetchProfile(userId: string) {
  return profileRuntimeApi.fetchProfile(userId);
}

export async function updateProfile(userId: string, payload: ProfileUpdate) {
  return profileRuntimeApi.updateProfile(userId, payload);
}
