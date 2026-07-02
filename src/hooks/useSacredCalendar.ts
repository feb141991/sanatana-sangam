import { useMemo } from 'react';
import type { PanchangData } from '@/lib/panchang';
import { getTraditionMeta } from '@/lib/tradition-config';
import { CalendarFactory } from '@/lib/strategies/CalendarFactory';

export interface SacredCalendarData extends PanchangData {
  calendarName: string;
  labels: {
    monthLabel: string;
    yearLabel: string;
    dayLabel: string;
  };
}

/**
 * useSacredCalendar Hook
 * 
 * Centralised hook for all sacred timing needs across the platform.
 * Utilises the Strategy Pattern to load the correct calculation engine
 * based on the user's tradition.
 */
export function useSacredCalendar(
  date: Date,
  lat: number,
  lon: number,
  tradition: string = 'hindu'
): SacredCalendarData {
  const meta = useMemo(() => getTraditionMeta(tradition), [tradition]);
  const strategy = useMemo(() => CalendarFactory.getStrategy(meta.calendarType), [meta.calendarType]);

  const data = useMemo(() => {
    const panchang = strategy.calculate(date, lat, lon);
    const labels = strategy.getLabels();

    return {
      ...panchang,
      calendarName: strategy.name,
      labels,
    };
  }, [strategy, date, lat, lon]);

  return data;
}
