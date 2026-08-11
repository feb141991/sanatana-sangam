/**
 * calendar-context.ts
 *
 * Pure, typed resolver that transforms stored user choices into a read-time
 * ResolvedCalendarContext.
 *
 * GOVERNANCE RULES:
 * 1. Calendar profile must NEVER be inferred from GPS/timezone.
 * 2. Missing choices remain 'unknown'.
 * 3. 'unspecified' tradition profile uses approved Smarta calculation behavior
 *    (calculationMethodProfile: 'smarta', ekadashiMethod: 'smarta', janmashtamiMethod: 'smarta_nishita')
 *    but MUST remain labelled 'unspecified' in displayedTraditionProfile.
 * 4. Authentication / database query failures must NOT be treated as guest sessions.
 * 5. Location and timezone must remain an atomic pair.
 * 6. Pure calculation metadata resolution only — does NOT compute dates or touch UI.
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
  | 'unknown';

export type MonthSystem = 'amanta' | 'purnimanta' | 'solar' | 'unknown';

export type CalendarEra =
  | 'vikram_north'
  | 'vikram_gujarat'
  | 'shaka'
  | 'kollam'
  | 'bengali_san'
  | 'bikram_sambat'
  | 'nanakshahi'
  | 'unknown';

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
  timezone: string | null;
  locationSource: LocationSource;
  disclosureDiagnostics: DisclosureDiagnostics;
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
};

/**
 * Normalizes input calendar profile string ID.
 */
export function normalizeCalendarProfileId(raw?: string | null): CalendarProfileId {
  if (!raw) return 'unknown';
  const clean = raw.trim().toLowerCase().replace(/-/g, '_');
  if (clean in CALENDAR_PROFILE_MAP) {
    return clean as CalendarProfileId;
  }
  return 'unknown';
}

/**
 * Normalizes input tradition profile string ID.
 */
export function normalizeTraditionProfileId(raw?: string | null): TraditionProfileId {
  if (!raw) return 'unknown';
  const clean = raw.trim().toLowerCase().replace(/-/g, '_');
  if (clean === 'gaudiya' || clean === 'gaudiya_iskcon') return 'gaudiya_iskcon';
  if (clean === 'smarta') return 'smarta';
  if (clean === 'sri_vaishnava' || clean === 'srivaishnava') return 'sri_vaishnava';
  if (clean === 'swaminarayan') return 'swaminarayan';
  if (clean === 'shaiva') return 'shaiva';
  if (clean === 'shakta') return 'shakta';
  if (clean === 'unspecified') return 'unspecified';
  if (clean === 'sikh') return 'sikh';
  if (clean === 'jain') return 'jain';
  if (clean === 'buddhist') return 'buddhist';
  if (clean === 'all') return 'all';
  return 'unknown';
}

/**
 * Resolves stored user choices and query context into a pure ResolvedCalendarContext.
 */
export function resolveCalendarContext(input: CalendarSelectionInput): ResolvedCalendarContext {
  const notes: string[] = [];

  // Determine Resolution Status
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
    // Unspecified uses approved Smarta calculation behavior
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

  let observanceLocation: AtomicObservanceLocation;
  let timezone: string | null = null;
  let locationSource: LocationSource = 'unknown';
  let locationKnown = false;

  if (hasLat && hasLon && hasTz) {
    observanceLocation = {
      label: loc?.label?.trim() || null,
      latitude: loc!.latitude!,
      longitude: loc!.longitude!,
      timezone: loc!.timezone!.trim(),
    };
    timezone = observanceLocation.timezone;
    locationSource = 'user_explicit';
    locationKnown = true;
  } else {
    // Atomic null pair when location details are missing
    observanceLocation = {
      label: null,
      latitude: null,
      longitude: null,
      timezone: null,
    };
    timezone = null;
    locationSource = 'unknown';
    locationKnown = false;
    notes.push('Observance location and timezone incomplete or missing.');
  }

  const disclosureDiagnostics: DisclosureDiagnostics = {
    resolutionStatus,
    calendarProfileInferredFromGps: false, // Governance Rule 1 guarantee
    calendarProfileKnown,
    traditionKnown,
    locationKnown,
    isUnspecifiedLabel: displayedTraditionProfile === 'unspecified',
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
    timezone,
    locationSource,
    disclosureDiagnostics,
  };
}
