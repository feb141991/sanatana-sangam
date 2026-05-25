import { calculatePanchang, type PanchangData } from '@/lib/panchang';
import { CalendarStrategy } from './CalendarStrategy';

export class NanakshahiStrategy implements CalendarStrategy {
  name = 'Nanakshahi Calendar';

  calculate(date: Date, lat: number, lon: number, timezone?: string): PanchangData {
    const p = calculatePanchang(date, lat, lon, timezone);
    return {
      ...p,
      // Nanakshahi year starts in 1469 AD (Birth of Guru Nanak)
      samvatYear: date.getFullYear() - 1468,
      samvatName: 'Nanakshahi',
    };
  }

  getLabels() {
    return {
      monthLabel: 'Mahina',
      yearLabel: 'Nanakshahi Era',
      dayLabel: 'Date',
    };
  }
}
