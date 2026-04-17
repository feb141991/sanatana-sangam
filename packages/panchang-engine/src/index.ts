export type PrecisionEngineMode = 'fallback' | 'swiss-ephemeris';
export type PrecisionStatus = 'planned' | 'configured' | 'validated';

export interface PanchangTransitionWindow {
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  source: 'estimated' | 'precise';
}

export interface PrecisePanchangDay {
  date: string;
  timezone: string;
  latitude: number;
  longitude: number;
  sunriseAt: string;
  sunsetAt: string;
  tithi: PanchangTransitionWindow;
  nakshatra: PanchangTransitionWindow;
  yoga: PanchangTransitionWindow;
  karana: PanchangTransitionWindow | null;
  rahuKaal: PanchangTransitionWindow | null;
  abhijitMuhurat: PanchangTransitionWindow | null;
  methodLabel: string;
  validationStatus: PrecisionStatus;
}

export interface PanchangEngineConfig {
  mode: PrecisionEngineMode;
  ephemerisPath?: string;
  ayanamsha?: 'lahiri' | 'raman' | 'krishnamurti';
  licenseMode?: 'agpl' | 'professional' | 'undecided';
  debug?: boolean;
}

export interface PrecisePanchangQuery {
  date: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface PanchangPrecisionEngine {
  getDay(query: PrecisePanchangQuery): Promise<PrecisePanchangDay>;
}

class PlannedPanchangPrecisionEngine implements PanchangPrecisionEngine {
  constructor(private readonly config: PanchangEngineConfig) {}

  async getDay(query: PrecisePanchangQuery): Promise<PrecisePanchangDay> {
    if (this.config.mode === 'swiss-ephemeris' && this.config.licenseMode === 'undecided') {
      throw new Error('Swiss Ephemeris mode requires an explicit license decision before activation.');
    }

    throw new Error('High-precision Panchang engine is scaffolded but not yet wired to Swiss Ephemeris.');
  }
}

export function createPanchangEngine(config: PanchangEngineConfig): PanchangPrecisionEngine {
  return new PlannedPanchangPrecisionEngine(config);
}
