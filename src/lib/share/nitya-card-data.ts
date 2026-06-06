import { getTraditionMeta } from '@/lib/tradition-config';
import {
  generateNityaShareCard,
  TRADITION_SHARE_QUOTES,
  type NityaCardType,
  type NityaShareCardData,
} from '@/lib/share/generate-share-image';

export type NityaShareStats = {
  activeDays?: number;
  bestStreak?: number;
  completionRate?: number;
  consistencyScore?: number;
  dow?: number[];
  fullMorningDays?: number;
  lastWeekActive?: number;
  milestoneLabel?: string;
  peakHourLabel?: string;
  stepsCompletedToday?: number;
  streak?: number;
  thisWeekActive?: number;
};

export const TRADITION_QUOTE_SOURCES: Record<string, string[]> = {
  hindu: ['Bhagavad Gita 2.50', 'Bhagavad Gita 3.35', 'Amritabindu Upanishad', 'Sarve Bhavantu Sukhinah', 'Chandogya Upanishad', 'Brihadaranyaka Upanishad'],
  sikh: ['Guru Granth Sahib', 'Guru Granth Sahib', 'Guru Granth Sahib', 'Ardas tradition'],
  buddhist: ['Dhammapada', 'Dhammapada', 'Mahaparinibbana Sutta', 'Zen teaching'],
  jain: ['Tattvartha Sutra', 'Jain maxim', 'Namokar Mantra', 'Jain maxim'],
};

const NITYA_MILESTONES: Record<string, Array<{ at: number; label: string }>> = {
  hindu: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Shishya' },
    { at: 21, label: 'Sadhu' },
    { at: 40, label: 'Tapasvi' },
    { at: 108, label: 'Rishi' },
  ],
  sikh: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Sewak' },
    { at: 21, label: 'Gurmukh' },
    { at: 40, label: 'Khalsa' },
    { at: 108, label: 'Gursikh' },
  ],
  buddhist: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Kalyana-mitta' },
    { at: 21, label: 'Ariyasavaka' },
    { at: 40, label: 'Sotapanna' },
    { at: 108, label: 'Arahat' },
  ],
  jain: [
    { at: 0, label: 'Seeker' },
    { at: 7, label: 'Shravak' },
    { at: 21, label: 'Muni-path' },
    { at: 40, label: 'Vrati' },
    { at: 108, label: 'Mahasadhak' },
  ],
};

export function resolveNityaMilestoneLabel(tradition: string, streak: number) {
  const milestones = NITYA_MILESTONES[tradition] ?? NITYA_MILESTONES.hindu;
  return milestones.reduce((best, item) => item.at <= streak ? item : best, milestones[0]).label;
}

function baseData(tradition: string, userName: string, milestoneLabel?: string): NityaShareCardData {
  const meta = getTraditionMeta(tradition);
  return {
    tradition,
    accentColor: meta.accentColour,
    symbol: meta.symbol,
    userName,
    milestoneLabel: milestoneLabel ?? 'Seeker',
  };
}

export function getNityaShareQuote(tradition: string, streak: number) {
  const quotes = TRADITION_SHARE_QUOTES[tradition] ?? TRADITION_SHARE_QUOTES.hindu;
  const sources = TRADITION_QUOTE_SOURCES[tradition] ?? TRADITION_QUOTE_SOURCES.hindu;
  const index = streak % quotes.length;
  return {
    quote: quotes[index],
    quoteSource: sources[index] ?? undefined,
  };
}

export function buildNityaMilestoneCardData({
  stats,
  tradition,
  userName,
}: {
  stats: NityaShareStats;
  tradition: string;
  userName: string;
}): NityaShareCardData {
  return {
    ...baseData(tradition, userName, stats.milestoneLabel),
    streak: stats.streak ?? 0,
    bestStreak: stats.bestStreak ?? stats.streak ?? 0,
  };
}

export function buildNityaMorningCardData({
  stats,
  tradition,
  userName,
  todayTithi,
}: {
  stats: NityaShareStats;
  tradition: string;
  userName: string;
  todayTithi?: string;
}): NityaShareCardData {
  return {
    ...baseData(tradition, userName, stats.milestoneLabel),
    stepsCompletedToday: stats.stepsCompletedToday ?? 0,
    totalSteps: 7,
    todayTithi,
  };
}

export function buildNityaQuoteCardData({
  stats,
  tradition,
  userName,
}: {
  stats: NityaShareStats;
  tradition: string;
  userName: string;
}): NityaShareCardData {
  const streak = stats.streak ?? 0;
  return {
    ...baseData(tradition, userName, stats.milestoneLabel),
    ...getNityaShareQuote(tradition, streak),
    streak,
    completionRate: stats.completionRate,
  };
}

export function buildNityaMonthlyCardData({
  stats,
  tradition,
  userName,
  month,
}: {
  stats: NityaShareStats;
  tradition: string;
  userName: string;
  month: string;
}): NityaShareCardData {
  return {
    ...baseData(tradition, userName, stats.milestoneLabel),
    activeDays: stats.activeDays ?? 0,
    fullMorningDays: stats.fullMorningDays ?? 0,
    consistencyScore: stats.consistencyScore ?? 0,
    peakHourLabel: stats.peakHourLabel,
    dowData: stats.dow,
    month,
  };
}

export function buildNityaShareCardData({
  type,
  stats,
  tradition,
  userName,
  todayTithi,
  month,
}: {
  type: NityaCardType;
  stats: NityaShareStats;
  tradition: string;
  userName: string;
  todayTithi?: string;
  month: string;
}): NityaShareCardData {
  switch (type) {
    case 'streak_milestone':
      return buildNityaMilestoneCardData({ stats, tradition, userName });
    case 'week_summary':
      return {
        ...baseData(tradition, userName, stats.milestoneLabel),
        thisWeekActive: stats.thisWeekActive ?? 0,
        lastWeekActive: stats.lastWeekActive ?? 0,
        dowData: stats.dow,
      };
    case 'morning_complete':
      return buildNityaMorningCardData({ stats, tradition, userName, todayTithi });
    case 'sadhana_quote':
      return buildNityaQuoteCardData({ stats, tradition, userName });
    case 'monthly_report':
      return buildNityaMonthlyCardData({ stats, tradition, userName, month });
  }
}

export async function shareNityaCardImage({
  type,
  data,
  fileName,
  shareText,
  shareUrl,
}: {
  type: NityaCardType;
  data: NityaShareCardData;
  fileName: string;
  /** Optional text to include alongside the image in native share sheet */
  shareText?: string;
  /** Optional URL to include in native share (e.g. invite link) */
  shareUrl?: string;
}) {
  const blob = await generateNityaShareCard(type, data);
  if (!blob) throw new Error('card_generation_failed');

  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Shoonaya Nitya Karma',
        text: shareText ?? 'My Nitya Karma practice',
        url: shareUrl,
        files: [file],
      });
    } catch (err: any) {
      // AbortError = user dismissed the native share sheet — treat as neutral, not failure
      if (err?.name === 'AbortError') return;
      throw err;
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
