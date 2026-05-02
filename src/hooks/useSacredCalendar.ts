import { useMemo } from 'react';
import { calculatePanchang, type PanchangData } from '@/lib/panchang';

export interface SacredCalendarData extends PanchangData {
  calendarType: 'Vedic' | 'Nanakshahi' | 'Lunar' | 'Vira Samvat';
}

export function useSacredCalendar(
  date: Date,
  lat: number,
  lon: number,
  tradition: string = 'hindu'
): SacredCalendarData {
  const panchang = useMemo(() => calculatePanchang(date, lat, lon), [date, lat, lon]);

  return useMemo(() => {
    let calendarType: SacredCalendarData['calendarType'] = 'Vedic';

    if (tradition === 'sikh') {
      calendarType = 'Nanakshahi';
      // In a full implementation, this would adjust dates according to the Nanakshahi calendar
    } else if (tradition === 'buddhist') {
      calendarType = 'Lunar';
      // Buddhist Lunar calendar logic
    } else if (tradition === 'jain') {
      calendarType = 'Vira Samvat';
      // Jain Vira Samvat calendar logic
    }

    return {
      ...panchang,
      calendarType,
    };
  }, [panchang, tradition]);
}
