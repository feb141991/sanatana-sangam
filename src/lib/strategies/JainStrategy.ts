import { calculatePanchang, type PanchangData } from '@/lib/panchang';
import { CalendarStrategy } from './CalendarStrategy';

export class JainStrategy implements CalendarStrategy {
  name = 'Vira Samvat';

  calculate(date: Date, lat: number, lon: number, timezone?: string): PanchangData {
    const p = calculatePanchang(date, lat, lon, timezone);
    return {
      ...p,
      samvatYear: date.getFullYear() + 527,
      samvatName: 'V.N.S.',
    };
  }

  getLabels() {
    return {
      monthLabel: 'Masa',
      yearLabel: 'Vira Samvat',
      dayLabel: 'Tithi',
    };
  }
}
