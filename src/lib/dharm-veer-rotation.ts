import { DHARM_VEERS } from './dharm-veer-roster';
import type { DharmVeer } from './dharm-veer-types';

export const TRADITION_META: Record<string, { label: string; labelLocal: string; dharmVeerLocal: string; emoji: string; color: string }> = {
  hindu: { label: 'Sanatan Dharma', labelLocal: 'सनातन धर्म', dharmVeerLocal: 'धर्म वीर', emoji: '🕉️', color: 'rgba(255, 120, 0, 0.12)' },
  sikh: { label: 'Sikhi', labelLocal: 'ਸਿੱਖੀ', dharmVeerLocal: 'ਧਰਮ ਵੀਰ', emoji: '☬', color: 'rgba(0, 100, 255, 0.12)' },
  buddhist: { label: 'Buddha Dhamma', labelLocal: 'बुद्ध धम्म', dharmVeerLocal: 'धर्म वीर', emoji: '☸️', color: 'rgba(255, 200, 0, 0.12)' },
  jain: { label: 'Jain Dharma', labelLocal: 'जैन धर्म', dharmVeerLocal: 'धर्म वीर', emoji: '🤲', color: 'rgba(0, 200, 50, 0.12)' },
  sufi: { label: 'Sufi Path', labelLocal: 'सूफ़ी मार्ग', dharmVeerLocal: 'धर्म वीर', emoji: '🕊️', color: 'rgba(140, 90, 220, 0.12)' },
  tribal: { label: 'Adivasi Wisdom', labelLocal: 'आदिवासी ज्ञान', dharmVeerLocal: 'धर्म वीर', emoji: '🌿', color: 'rgba(60, 160, 90, 0.12)' },
};

export function getDharmVeerOfTheDay(userTradition?: string | null): DharmVeer {
  const epoch = new Date('2024-01-01').getTime();
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dayN = Math.floor((ist.getTime() - epoch) / (1000 * 60 * 60 * 24));
  if (!userTradition) return DHARM_VEERS[dayN % DHARM_VEERS.length];
  const same = DHARM_VEERS.filter((hero) => hero.tradition === userTradition);
  const other = DHARM_VEERS.filter((hero) => hero.tradition !== userTradition);
  const pool = [...same, ...same, ...other];
  return pool[dayN % pool.length];
}

export function selectDharmVeer({ userTradition, historyIds, roster = DHARM_VEERS, festivalTags = [], noRepeatWindow = 14 }: { userTradition?: string | null; historyIds: string[]; roster?: DharmVeer[]; festivalTags?: string[]; noRepeatWindow?: number }): DharmVeer {
  const sameTradition = roster.filter((hero) => hero.tradition === userTradition);
  const otherTradition = roster.filter((hero) => hero.tradition !== userTradition);
  const recentIds = new Set(historyIds.slice(-noRepeatWindow));
  const freshSame = sameTradition.filter((hero) => !recentIds.has(hero.id));
  const freshOther = otherTradition.filter((hero) => !recentIds.has(hero.id));
  if (festivalTags.length > 0) {
    const freshBoosted = [...freshSame, ...freshOther].find((hero) => festivalTags.some((tag) => hero.tags?.includes(tag)));
    if (freshBoosted) return freshBoosted;
  }
  if (freshSame.length > 0) return freshSame[0];
  if (freshOther.length > 0) return freshOther[0];
  if (sameTradition.length > 0) return [...sameTradition].sort((a, b) => historyIds.indexOf(a.id) - historyIds.indexOf(b.id))[0];
  return roster[0];
}
