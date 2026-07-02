import { TierKey } from './seva-tiers';

export interface SevaPerk {
  aiChatLimit: number;
}

export const SEVA_TIER_PERKS: Record<TierKey, SevaPerk> = {
  jigyasu: { aiChatLimit: 5 },
  shishya: { aiChatLimit: 10 },
  sadhak: { aiChatLimit: 25 },
  seva_mitra: { aiChatLimit: 50 },
  tapasvi: { aiChatLimit: 100 },
  rishi: { aiChatLimit: 150 },
  mahatma: { aiChatLimit: 200 },
};
