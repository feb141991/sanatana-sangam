/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Pitru Paksha — 16-day ancestor-remembrance period
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pitru Paksha ("fortnight of ancestors") falls in the dark fortnight of
 * Bhadrapada, when the Sun is in Virgo. During this period — concluded by
 * Mahalaya Amavasya — Hindus perform Shraddha rituals, offer Pinda daan, and
 * pray for departed ancestors to attain peace.
 *
 * 2026 dates: September 19 (Mahalaya Pratipada) → October 4 (Mahalaya Amavasya)
 *
 * The detection is date-range based (not astronomy-computed) for predictability.
 * A new constant should be added each year alongside the festival calendar refresh.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface PitruPakshaDay {
  /** YYYY-MM-DD — same as today's date when we're in the period */
  date: string;
  /** Day number within the fortnight (1 = Pratipada, 15/16 = Mahalaya Amavasya) */
  day: number;
  /** Total days in this year's Pitru Paksha window */
  totalDays: number;
  /** True only on Mahalaya Amavasya — the most auspicious day */
  isMahalaya: boolean;
  /** Tithi name for this day (approximate) */
  tithiName: string;
}

/** Pitru Paksha windows by year — add each year when calendar is refreshed */
const PITRU_PAKSHA_WINDOWS: Array<{
  year: number;
  start: string; // inclusive, YYYY-MM-DD
  end:   string; // inclusive (Mahalaya Amavasya)
}> = [
  { year: 2026, start: '2026-09-19', end: '2026-10-04' },
];

/** Approximate tithi names for each day of the fortnight */
const TITHI_NAMES = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Mahalaya Amavasya',
  'Mahalaya Amavasya', // 16-day fallback
];

/**
 * Returns Pitru Paksha context if the given date falls within the period,
 * null otherwise.
 */
export function getPitruPakshaDay(date: Date = new Date()): PitruPakshaDay | null {
  const iso = date.toISOString().split('T')[0];

  for (const window of PITRU_PAKSHA_WINDOWS) {
    if (iso >= window.start && iso <= window.end) {
      const startMs = new Date(window.start).getTime();
      const endMs   = new Date(window.end).getTime();
      const dayMs   = 1000 * 60 * 60 * 24;
      const totalDays = Math.round((endMs - startMs) / dayMs) + 1;
      const day       = Math.round((new Date(iso).getTime() - startMs) / dayMs) + 1;
      const isMahalaya = iso === window.end;

      return {
        date:       iso,
        day,
        totalDays,
        isMahalaya,
        tithiName:  TITHI_NAMES[Math.min(day - 1, TITHI_NAMES.length - 1)],
      };
    }
  }

  return null;
}

/** Returns true if today is within any Pitru Paksha window. */
export function isInPitruPaksha(date: Date = new Date()): boolean {
  return getPitruPakshaDay(date) !== null;
}

/** Banner copy for each day (rotates through ancestor-focused themes). */
export function getPitruPakshaBannerCopy(info: PitruPakshaDay): { title: string; subtitle: string } {
  if (info.isMahalaya) {
    return {
      title:    'Mahalaya Amavasya',
      subtitle: 'The most auspicious day of Pitru Paksha — offer tarpan and Pinda daan to all ancestors today.',
    };
  }

  const copies: Array<{ title: string; subtitle: string }> = [
    {
      title:    `Pitru Paksha — Day ${info.day}`,
      subtitle: 'The ancestors are near. Offer water (tarpan) at sunrise today in their memory.',
    },
    {
      title:    `${info.tithiName} of Pitru Paksha`,
      subtitle: 'Cook a simple, saatvik meal today. Offer the first portion to a crow — believed to carry it to the ancestors.',
    },
    {
      title:    'Remember Your Lineage',
      subtitle: 'Light a lamp (diya) tonight for those who came before you. Their blessings protect the family.',
    },
    {
      title:    'Shraaddha Practice',
      subtitle: 'Donate food, clothing, or money in the name of your ancestors today. Their peace is your peace.',
    },
    {
      title:    `Day ${info.day} of Pitru Paksha`,
      subtitle: 'Chant "Om Pitru Devaya Namaha" 108 times. Invite peace for departed souls across all generations.',
    },
    {
      title:    'Pitru Tarpan',
      subtitle: 'Place water mixed with sesame seeds (til) in your palms at sunrise and offer it southward — the direction of the ancestors.',
    },
    {
      title:    'The Fortnight of Gratitude',
      subtitle: 'Whatever you have inherited — strength, values, love — carries the fingerprints of ancestors. Honour that today.',
    },
  ];

  // Rotate by day so each day gets a distinct copy
  return copies[(info.day - 1) % copies.length];
}
