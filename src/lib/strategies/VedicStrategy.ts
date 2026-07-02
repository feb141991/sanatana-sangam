import { calculatePanchang, type PanchangData } from '@/lib/panchang';
import { CalendarStrategy } from './CalendarStrategy';

export class VedicStrategy implements CalendarStrategy {
  name = 'Vedic Panchang';

  calculate(date: Date, lat: number, lon: number, timezone?: string): PanchangData {
    return calculatePanchang(date, lat, lon, timezone);
  }

  getLabels() {
    return {
      monthLabel: 'Masa',
      yearLabel: 'Samvat',
      dayLabel: 'Tithi',
    };
  }
}
