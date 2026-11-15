import type { DharmVeer } from './dharm-veer-types';

export function pickDharmVeerLocalizedText(english: string | undefined, hindi: string | undefined, punjabi: string | undefined, contentLanguage: 'hi' | 'pa'): string | undefined {
  if (contentLanguage === 'pa') return punjabi || hindi || english;
  return hindi || english;
}

export type DharmVeerQuote = { text: string; attribution: string };

export function pickDharmVeerQuote(hero: { quote?: Partial<DharmVeerQuote>; quoteLocal?: Partial<DharmVeerQuote>; quotePa?: Partial<DharmVeerQuote> }, contentLanguage: 'en' | 'hi' | 'pa'): DharmVeerQuote | null {
  const complete = (q: Partial<DharmVeerQuote> | undefined): q is DharmVeerQuote => !!q && typeof q.text === 'string' && q.text.trim().length > 0 && typeof q.attribution === 'string' && q.attribution.trim().length > 0;
  const localized = contentLanguage === 'pa' ? hero.quotePa : contentLanguage === 'hi' ? hero.quoteLocal : undefined;
  if (complete(localized)) return { text: localized.text.trim(), attribution: localized.attribution.trim() };
  if (complete(hero.quote)) return { text: hero.quote.text.trim(), attribution: hero.quote.attribution.trim() };
  return null;
}
