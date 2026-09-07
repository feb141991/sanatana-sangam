import { getTodayShloka } from '@/lib/shlokas';
import { getDailySacredText } from '@/lib/sacred-texts';
import { getSacredTextLabel, getTraditionMeta } from '@/lib/tradition-config';

export type DailySacredTextProfile = {
  tradition?: string | null;
  app_language?: string | null;
  timezone?: string | null;
};

export function buildDailySacredText(profile: DailySacredTextProfile | null, dayIndex: number) {
  const tradition = profile?.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);
  const sacredText = getDailySacredText(tradition, dayIndex);

  if (sacredText) {
    return {
      label: getSacredTextLabel(tradition, profile?.app_language ?? 'en'),
      icon: meta.sacredTextIcon,
      original: sacredText.original,
      transliteration: sacredText.transliteration,
      meaning: sacredText.meaning,
      source: sacredText.source,
      accentColour: meta.accentColour,
      accentLight: meta.accentLight,
    };
  }

  const shloka = getTodayShloka(profile?.timezone ?? undefined);
  return {
    label: getSacredTextLabel(tradition, profile?.app_language ?? 'en'),
    icon: meta.sacredTextIcon,
    original: shloka.sanskrit,
    transliteration: shloka.transliteration ?? '',
    meaning: shloka.meaning,
    source: shloka.source,
    accentColour: meta.accentColour,
    accentLight: meta.accentLight,
  };
}
