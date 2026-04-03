import { UPANISHADS_ORIGINAL_DATA } from '@/lib/upanishads-original-data';

export type StudyLayerStatus = 'live' | 'companion' | 'planned';

export interface UpanishadStudyMeta {
  id: string;
  original?: string;
  originalLayerStatus: StudyLayerStatus;
  recitationLayerStatus: StudyLayerStatus;
  companionSourceUrl?: string;
  companionSourceLabel?: string;
}

const MANUAL_LAYER_OVERRIDES: UpanishadStudyMeta[] = [
  {
    id: 'upa-kaushitaki-full',
    originalLayerStatus: 'companion',
    recitationLayerStatus: 'planned',
    companionSourceUrl: 'https://vedicheritage.gov.in/vedicaudit-2023/upanishads/',
    companionSourceLabel: 'Vedic Heritage overview',
  },
];

export const UPANISHAD_STUDY_META: UpanishadStudyMeta[] = [
  ...UPANISHADS_ORIGINAL_DATA,
  ...MANUAL_LAYER_OVERRIDES,
];

export function getUpanishadStudyMeta(id: string): UpanishadStudyMeta | undefined {
  return UPANISHAD_STUDY_META.find((entry) => entry.id === id);
}

export function getUpanishadLayerCounts() {
  const total = UPANISHAD_STUDY_META.length;
  const originalLive = UPANISHAD_STUDY_META.filter((entry) => entry.originalLayerStatus === 'live').length;
  const originalCompanion = UPANISHAD_STUDY_META.filter((entry) => entry.originalLayerStatus === 'companion').length;
  const recitationCompanion = UPANISHAD_STUDY_META.filter((entry) => entry.recitationLayerStatus === 'companion').length;

  return {
    total,
    originalLive,
    originalCompanion,
    recitationCompanion,
  };
}
