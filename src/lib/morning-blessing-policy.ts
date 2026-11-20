export const MORNING_BLESSING_DISMISS_PREFIX = 'shoonaya-morning-blessing-dismissed-';

export function isMorningBlessingWindow(date: Date = new Date()): boolean {
  const hour = date.getHours();
  const minute = date.getMinutes();
  // Active from 6:30 AM to 11:00 AM local civil time
  return (hour === 6 && minute >= 30) || (hour >= 7 && hour < 11);
}

export function buildMorningBlessingKey(date: Date = new Date(), timezone?: string): string {
  // Scoped per local civil date
  const iso = date.toISOString().slice(0, 10);
  return `${MORNING_BLESSING_DISMISS_PREFIX}${timezone ? `${timezone}-` : ''}${iso}`;
}

export function buildMorningBlessingMessage(params: {
  tithiName?: string | null;
  cityName?: string | null;
  verseSnippet?: string | null;
}): string {
  const tithiDisplay = params.tithiName ? `Today is ${params.tithiName}` : 'Auspicious morning';
  const cityDisplay = params.cityName ? ` in ${params.cityName}` : '';
  const snippet = params.verseSnippet || 'May your day be filled with peace, virtue, and sacred stillness.';

  return `🙏 Suprabhat! ${tithiDisplay}${cityDisplay}.\n\n"${snippet}"\n\n(Shared from Shoonaya Spiritual Sanctuary: https://www.shoonaya.com/get?utm_source=whatsapp&utm_medium=morning_card&utm_campaign=suprabhat_loop)`;
}
