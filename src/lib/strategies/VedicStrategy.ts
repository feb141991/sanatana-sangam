import { calculatePanchang, type PanchangData } from '@/lib/panchang';
import { CalendarStrategy } from './CalendarStrategy';

export class VedicStrategy implements CalendarStrategy {
  name = 'Vedic Panchang';

  calculate(date: Date, lat: number, lon: number): PanchangData {
    // For Vedic, we use our existing astronomy-backed calculation engine.
    return calculatePanchang(date, lat, lon);
  }

  getLabels() {
    return {
      monthLabel: 'Masa',
      yearLabel: 'Samvat',
      dayLabel: 'Tithi',
    };
  }
}
