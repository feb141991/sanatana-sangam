import { calculatePanchang, type PanchangData } from '@/lib/panchang';
import { CalendarStrategy } from './CalendarStrategy';

export class NanakshahiStrategy implements CalendarStrategy {
  name = 'Nanakshahi Calendar';

  calculate(date: Date, lat: number, lon: number): PanchangData {
    // Basic implementation: uses the same astronomy but overrides specific fields
    // In a real scenario, this would have its own fixed-date logic.
    const p = calculatePanchang(date, lat, lon);
    
    return {
      ...p,
      // Nanakshahi year starts in 1469 AD (Birth of Guru Nanak)
      samvatYear: date.getFullYear() - 1468, 
      samvatName: 'Nanakshahi',
      // We can override masaName etc. here if we had the Nanakshahi month mapping
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
