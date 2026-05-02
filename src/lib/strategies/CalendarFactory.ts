import { CalendarStrategy } from './CalendarStrategy';
import { VedicStrategy } from './VedicStrategy';
import { NanakshahiStrategy } from './NanakshahiStrategy';
import { BuddhistStrategy } from './BuddhistStrategy';
import { JainStrategy } from './JainStrategy';

export class CalendarFactory {
  private static strategies: Record<string, CalendarStrategy> = {
    vedic: new VedicStrategy(),
    nanakshahi: new NanakshahiStrategy(),
    buddhist_lunar: new BuddhistStrategy(),
    jain: new JainStrategy(),
    // Default fallback
    gregorian: new VedicStrategy(), 
  };

  static getStrategy(type: string): CalendarStrategy {
    return this.strategies[type] || this.strategies.vedic;
  }
}
