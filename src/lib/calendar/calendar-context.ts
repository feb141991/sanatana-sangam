/**
 * calendar-context.ts
 *
 * ResolvedCalendarContext builder.
 * Resolves user choices into read-time context object.
 *
 * Governance Rules:
 * 1. Calendar profile MUST NEVER be inferred from GPS/location/timezone.
 * 2. Missing choices remain unknown.
 * 3. "unspecified" uses approved Smarta calculation behavior but remains labelled unspecified.
 * 4. Authentication/profile query failures MUST NOT be treated as guests.
 * 5. Location and timezone MUST remain an atomic pair.
 * 6. Temporary travel mode NEVER mutates calendar profile, tradition profile, or home location.
 */

export type CalendarProfileId =
  | 'north_indian_purnimanta'
  | 'gujarati_amanta'
  | 'marathi_amanta'
  | 'kannada_telugu_amanta'
  | 'kannada_amanta'
  | 'telugu_amanta'
  | 'tamil_solar'
  | 'malayalam_solar'
  | 'bengali_solar'
  | 'odia'
  | 'nepali_bikram'
  | 'global_sanatan'
  | 'nanakshahi'
  | 'legacy-ujjain'
  | 'unknown';

export type MonthSystem = 'purnimanta' | 'amanta' | 'solar' | 'unknown';
export type CalendarEra = 'vikram_north' | 'vikram_gujarat' | 'shaka' | 'kollam' | 'bengali_san' | 'bikram_sambat' | 'nanakshahi' | 'unknown';

export type TraditionProfileId =
  | 'smarta'
  | 'gaudiya_iskcon'
  | 'sri_vaishnava'
  | 'swaminarayan'
  | 'shaiva'
  | 'shakta'
  | 'unspecified'
  | 'sikh'
  | 'jain'
  | 'buddhist'
  | 'all'
  | 'unknown';

export type CalculationMethodProfile = 'smarta' | 'vaishnava_suddha' | 'unknown';
export type EkadashiMethod = 'smarta' | 'vaishnava_suddha' | 'unknown';
export type JanmashtamiMethod = 'smarta_nishita' | 'vaishnava_rohini' | 'unknown';

export interface AtomicObservanceLocation {
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isTravelLocation?: boolean;
  isDivergentFromHome?: boolean;
  homeObservanceLocation?: AtomicObservanceLocation | null;
}

export type LocationSource = 'user_explicit' | 'default_baseline' | 'unknown';

export type ResolutionStatus = 'resolved' | 'guest' | 'invalid_credentials' | 'database_failure';

export interface DisclosureDiagnostics {
  resolutionStatus: ResolutionStatus;
  calendarProfileInferredFromGps: boolean; // MUST ALWAYS BE FALSE per governance
  calendarProfileKnown: boolean;
  traditionKnown: boolean;
  locationKnown: boolean;
  isUnspecifiedLabel: boolean;
  isTravelDivergent: boolean;
  isTravelModeActive: boolean;
  errorMessage?: string;
  notes: string[];
}

export interface ResolvedCalendarContext {
  calendarProfile: CalendarProfileId;
  monthSystem: MonthSystem;
  era: CalendarEra;
  displayedTraditionProfile: TraditionProfileId;
  calculationMethodProfile: CalculationMethodProfile;
  ekadashiMethod: EkadashiMethod;
  janmashtamiMethod: JanmashtamiMethod;
  observanceLocation: AtomicObservanceLocation;
  savedObservanceLocation: AtomicObservanceLocation;
  effectiveCalculationLocation: AtomicObservanceLocation;
  isTravelModeActive: boolean;
  isTravelDivergenceDetected: boolean;
  timezone: string | null;
  locationSource: LocationSource;
  disclosureDiagnostics: DisclosureDiagnostics;
  cacheKey?: string;
}

export interface CalendarSelectionInput {
  calendarProfile?: string | null;
  traditionProfile?: string | null;
  location?: {
    label?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
  } | null;
  travelLocation?: {
    label?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
  } | null;
  confirmTravelLocation?: boolean;
  dateForCacheKey?: string;
  // Auth / session diagnostics flags
  isAuthenticated?: boolean;
  invalidCredentials?: boolean;
  dbError?: Error | string | null;
}

interface CalendarProfileDefinition {
  monthSystem: MonthSystem;
  era: CalendarEra;
}

const CALENDAR_PROFILE_MAP: Record<string, CalendarProfileDefinition> = {
  north_indian_purnimanta: { monthSystem: 'purnimanta', era: 'vikram_north' },
  gujarati_amanta:         { monthSystem: 'amanta',     era: 'vikram_gujarat' },
  marathi_amanta:          { monthSystem: 'amanta',     era: 'shaka' },
  kannada_telugu_amanta:   { monthSystem: 'amanta',     era: 'shaka' },
  kannada_amanta:          { monthSystem: 'amanta',     era: 'shaka' },
  telugu_amanta:           { monthSystem: 'amanta',     era: 'shaka' },
  tamil_solar:             { monthSystem: 'solar',      era: 'unknown' },
  malayalam_solar:         { monthSystem: 'solar',      era: 'kollam' },
  bengali_solar:           { monthSystem: 'solar',      era: 'bengali_san' },
  odia:                    { monthSystem: 'amanta',     era: 'shaka' },
  nepali_bikram:           { monthSystem: 'purnimanta', era: 'bikram_sambat' },
  global_sanatan:          { monthSystem: 'amanta',     era: 'vikram_north' },
  nanakshahi:              { monthSystem: 'solar',      era: 'nanakshahi' },
  'legacy-ujjain':         { monthSystem: 'purnimanta', era: 'vikram_north' },
};

/** Normalizes calendar profile ID, falling back to 'unknown' */
export function normalizeCalendarProfileId(raw?: string | null): CalendarProfileId {
  if (!raw) return 'unknown';
  const clean = raw.trim().toLowerCase();
  if (clean in CALENDAR_PROFILE_MAP) {
    return clean as CalendarProfileId;
  }
  return 'unknown';
}

/** Normalizes tradition profile ID, falling back to 'unknown' */
export function normalizeTraditionProfileId(raw?: string | null): TraditionProfileId {
  if (!raw) return 'unknown';
  const clean = raw.trim().toLowerCase();

  const aliases: Record<string, TraditionProfileId> = {
    hindu: 'unspecified',
    standard: 'unspecified',
    unspecified: 'unspecified',
    smarta: 'smarta',
    gaudiya_iskcon: 'gaudiya_iskcon',
    gaudiya: 'gaudiya_iskcon',
    iskcon: 'gaudiya_iskcon',
    sri_vaishnava: 'sri_vaishnava',
    srivaishnava: 'sri_vaishnava',
    vaishnava: 'sri_vaishnava',
    swaminarayan: 'swaminarayan',
    shaiva: 'shaiva',
    shakta: 'shakta',
    sikh: 'sikh',
    jain: 'jain',
    buddhist: 'buddhist',
    all: 'all',
  };

  return aliases[clean] ?? 'unknown';
}

/** Builds pure deterministic calendar calculation cache key */
export function buildCalendarCacheKey(params: {
  date: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  calendarProfile: string;
  displayedTraditionProfile: string;
  engineVersion?: string;
}): string {
  const latStr = params.latitude != null ? params.latitude.toFixed(4) : 'null';
  const lonStr = params.longitude != null ? params.longitude.toFixed(4) : 'null';
  const tzStr = params.timezone || 'null';
  const calStr = params.calendarProfile || 'unknown';
  const tradStr = params.displayedTraditionProfile || 'unknown';
  const verStr = params.engineVersion || '1.0.0';
  return `${params.date}::coords=${latStr},${lonStr}::tz=${tzStr}::cal=${calStr}::trad=${tradStr}::ver=${verStr}`;
}

/**
 * Pure typed resolver function that converts user selections into a ResolvedCalendarContext.
 */
export function resolveCalendarContext(input: CalendarSelectionInput): ResolvedCalendarContext {
  const notes: string[] = [];

  // Resolution Status Diagnostics
  let resolutionStatus: ResolutionStatus = 'resolved';
  let errorMessage: string | undefined = undefined;

  if (input.dbError) {
    resolutionStatus = 'database_failure';
    errorMessage = typeof input.dbError === 'string' ? input.dbError : input.dbError.message;
    notes.push(`Database failure encountered during profile read: ${errorMessage}`);
  } else if (input.invalidCredentials) {
    resolutionStatus = 'invalid_credentials';
    notes.push('Invalid or expired authentication credentials provided.');
  } else if (input.isAuthenticated === false) {
    resolutionStatus = 'guest';
    notes.push('Guest session: user is unauthenticated.');
  }

  // Rule 1: Calendar profile must NEVER be inferred from GPS / location / timezone
  const calendarProfile = normalizeCalendarProfileId(input.calendarProfile);
  const profileDef = CALENDAR_PROFILE_MAP[calendarProfile];
  const monthSystem: MonthSystem = profileDef ? profileDef.monthSystem : 'unknown';
  const era: CalendarEra = profileDef ? profileDef.era : 'unknown';

  const calendarProfileKnown = calendarProfile !== 'unknown';
  if (!calendarProfileKnown) {
    notes.push('Calendar profile is unspecified or unknown.');
  }

  // Rule 3: Tradition profile resolution
  const displayedTraditionProfile = normalizeTraditionProfileId(input.traditionProfile);
  const traditionKnown = displayedTraditionProfile !== 'unknown';

  let calculationMethodProfile: CalculationMethodProfile = 'unknown';
  let ekadashiMethod: EkadashiMethod = 'unknown';
  let janmashtamiMethod: JanmashtamiMethod = 'unknown';

  if (displayedTraditionProfile === 'smarta' ||
      displayedTraditionProfile === 'shaiva' ||
      displayedTraditionProfile === 'shakta' ||
      displayedTraditionProfile === 'unspecified') {
    calculationMethodProfile = 'smarta';
    ekadashiMethod = 'smarta';
    janmashtamiMethod = 'smarta_nishita';
  } else if (displayedTraditionProfile === 'gaudiya_iskcon' ||
             displayedTraditionProfile === 'sri_vaishnava' ||
             displayedTraditionProfile === 'swaminarayan') {
    calculationMethodProfile = 'vaishnava_suddha';
    ekadashiMethod = 'vaishnava_suddha';
    janmashtamiMethod = 'vaishnava_rohini';
  } else if (displayedTraditionProfile === 'sikh' ||
             displayedTraditionProfile === 'jain' ||
             displayedTraditionProfile === 'buddhist' ||
             displayedTraditionProfile === 'all') {
    calculationMethodProfile = 'smarta';
    ekadashiMethod = 'smarta';
    janmashtamiMethod = 'smarta_nishita';
  }

  // Rule 5: Location and timezone must remain an atomic pair
  const loc = input.location;
  const hasLat = typeof loc?.latitude === 'number' && !isNaN(loc.latitude);
  const hasLon = typeof loc?.longitude === 'number' && !isNaN(loc.longitude);
  const hasTz = typeof loc?.timezone === 'string' && loc.timezone.trim().length > 0;

  let savedObservanceLocation: AtomicObservanceLocation;
  let locationSource: LocationSource = 'unknown';
  let locationKnown = false;

  if (hasLat && hasLon && hasTz) {
    savedObservanceLocation = {
      label: loc?.label?.trim() || null,
      latitude: loc!.latitude!,
      longitude: loc!.longitude!,
      timezone: loc!.timezone!.trim(),
    };
    locationSource = 'user_explicit';
    locationKnown = true;
  } else {
    // Atomic null pair when location details are missing
    savedObservanceLocation = {
      label: null,
      latitude: null,
      longitude: null,
      timezone: null,
    };
    locationSource = 'unknown';
    locationKnown = false;
    notes.push('Observance location and timezone incomplete or missing.');
  }

  // Travel location divergence detection
  const tLoc = input.travelLocation;
  const hasTLat = typeof tLoc?.latitude === 'number' && !isNaN(tLoc.latitude);
  const hasTLon = typeof tLoc?.longitude === 'number' && !isNaN(tLoc.longitude);
  const hasTTz = typeof tLoc?.timezone === 'string' && tLoc.timezone.trim().length > 0;

  let isTravelDivergenceDetected = false;
  let travelObservanceLocation: AtomicObservanceLocation | null = null;

  if (hasTLat && hasTLon && hasTTz) {
    travelObservanceLocation = {
      label: tLoc?.label?.trim() || 'Travel Location',
      latitude: tLoc!.latitude!,
      longitude: tLoc!.longitude!,
      timezone: tLoc!.timezone!.trim(),
      isTravelLocation: true,
      homeObservanceLocation: savedObservanceLocation,
    };

    // Compare with saved home location
    const tzDiff = savedObservanceLocation.timezone !== travelObservanceLocation.timezone;
    const latDiff = (savedObservanceLocation.latitude != null && travelObservanceLocation.latitude != null)
      ? Math.abs(savedObservanceLocation.latitude - travelObservanceLocation.latitude) > 0.05
      : true;
    const lonDiff = (savedObservanceLocation.longitude != null && travelObservanceLocation.longitude != null)
      ? Math.abs(savedObservanceLocation.longitude - travelObservanceLocation.longitude) > 0.05
      : true;

    isTravelDivergenceDetected = tzDiff || latDiff || lonDiff;
  }

  const isTravelModeActive = Boolean(isTravelDivergenceDetected && input.confirmTravelLocation === true);

  if (isTravelDivergenceDetected) {
    if (isTravelModeActive) {
      notes.push('Travel mode active: using temporary travel location for calculations without altering home profile.');
    } else {
      notes.push('Device/travel location divergence detected. Calculation continues using saved observance location until confirmed.');
    }
  }

  const effectiveCalculationLocation: AtomicObservanceLocation = (isTravelModeActive && travelObservanceLocation)
    ? {
        ...travelObservanceLocation,
        isDivergentFromHome: true,
      }
    : savedObservanceLocation;

  const observanceLocation = effectiveCalculationLocation;
  const timezone = effectiveCalculationLocation.timezone;

  const cacheKey = input.dateForCacheKey
    ? buildCalendarCacheKey({
        date: input.dateForCacheKey,
        latitude: effectiveCalculationLocation.latitude,
        longitude: effectiveCalculationLocation.longitude,
        timezone: effectiveCalculationLocation.timezone,
        calendarProfile,
        displayedTraditionProfile,
      })
    : undefined;

  const disclosureDiagnostics: DisclosureDiagnostics = {
    resolutionStatus,
    calendarProfileInferredFromGps: false, // Governance Rule 1 guarantee
    calendarProfileKnown,
    traditionKnown,
    locationKnown,
    isUnspecifiedLabel: displayedTraditionProfile === 'unspecified',
    isTravelDivergent: isTravelDivergenceDetected,
    isTravelModeActive,
    errorMessage,
    notes,
  };

  return {
    calendarProfile,
    monthSystem,
    era,
    displayedTraditionProfile,
    calculationMethodProfile,
    ekadashiMethod,
    janmashtamiMethod,
    observanceLocation,
    savedObservanceLocation,
    effectiveCalculationLocation,
    isTravelModeActive,
    isTravelDivergenceDetected,
    timezone,
    locationSource,
    disclosureDiagnostics,
    cacheKey,
  };
}
