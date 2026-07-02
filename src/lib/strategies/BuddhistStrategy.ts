import { calculatePanchang, type PanchangData } from '@/lib/panchang';
import { CalendarStrategy } from './CalendarStrategy';

export class BuddhistStrategy implements CalendarStrategy {
  name = 'Buddhist Lunar Calendar';

  calculate(date: Date, lat: number, lon: number, timezone?: string): PanchangData {
    const p = calculatePanchang(date, lat, lon, timezone);
    return {
      ...p,
      samvatYear: date.getFullYear() + 544,
      samvatName: 'B.E.',
    };
  }

  getLabels() {
    return {
      monthLabel: 'Month',
      yearLabel: 'Buddhist Era',
      dayLabel: 'Tithi',
    };
  }
}
