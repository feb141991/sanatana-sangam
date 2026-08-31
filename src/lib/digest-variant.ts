import type { PanchangInfo } from '@/lib/panchang';

export function buildDigestPanchangSignature(panchang: PanchangInfo): string {
  return [
    panchang.tithi,
    panchang.tithiName,
    panchang.paksha,
    panchang.nakshatra ?? 'unknown',
    panchang.weekday,
  ].join('|');
}
