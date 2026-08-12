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

export type CalendarProfileId = string;

export type MonthSystem = 'purnimanta' | 'amanta' | 'solar' | 'unknown';
export type CalendarEra = 'vikram_north' | 'vikram_gujarat' | 'shaka' | 'kollam' | 'bengali_san' | 'bikram_sambat' | 'nanakshahi' | 'unknown';

export type TraditionProfileId = string;

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
  ekadashiMethod?: EkadashiMethod | null;
  calendarProfileDefinition?: CalendarProfileDefinition | null;
  traditionProfileDefinition?: TraditionProfileDefinition | null;
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
  supportsTravelRecalculation?: boolean;
  dateForCacheKey?: string;
  // Auth / session diagnostics flags
  isAuthenticated?: boolean;
  invalidCredentials?: boolean;
  dbError?: Error | string | null;
}

export interface CalendarProfileDefinition {
  slug: string;
  monthSystem: MonthSystem;
  era: CalendarEra;
}

export interface TraditionProfileDefinition {
  slug: string;
  ekadashiMethod: EkadashiMethod;
  janmashtamiMethod: JanmashtamiMethod;
}

function normalizeSlug(raw?: string | null): string | null {
  const clean = raw?.trim().toLowerCase();
  return clean || null;
}

/** Normalizes calendar profile ID, falling back to 'unknown' */
export function normalizeCalendarProfileId(
  raw?: string | null,
  definition?: CalendarProfileDefinition | null,
): CalendarProfileId {
  const clean = normalizeSlug(raw);
  return clean && normalizeSlug(definition?.slug) === clean ? clean : 'unknown';
}

/** Normalizes tradition profile ID, falling back to 'unknown' */
export function normalizeTraditionProfileId(
  raw?: string | null,
  definition?: TraditionProfileDefinition | null,
): TraditionProfileId {
  const clean = normalizeSlug(raw);
  return clean && normalizeSlug(definition?.slug) === clean ? clean : 'unknown';
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
  const calendarProfile = normalizeCalendarProfileId(
    input.calendarProfile,
    input.calendarProfileDefinition,
  );
  const profileDef = calendarProfile === 'unknown' ? null : input.calendarProfileDefinition;
  const monthSystem: MonthSystem = profileDef?.monthSystem ?? 'unknown';
  const era: CalendarEra = profileDef?.era ?? 'unknown';

  const calendarProfileKnown = calendarProfile !== 'unknown';
  if (!calendarProfileKnown) {
    notes.push('Calendar profile is unspecified or unknown.');
  }

  // Rule 3: Tradition profile resolution
  const displayedTraditionProfile = normalizeTraditionProfileId(
    input.traditionProfile,
    input.traditionProfileDefinition,
  );
  const traditionKnown = displayedTraditionProfile !== 'unknown';

  const traditionDef = traditionKnown ? input.traditionProfileDefinition : null;
  const ekadashiMethod: EkadashiMethod = input.ekadashiMethod ?? traditionDef?.ekadashiMethod ?? 'unknown';
  const janmashtamiMethod: JanmashtamiMethod = traditionDef?.janmashtamiMethod ?? 'unknown';
  const calculationMethodProfile: CalculationMethodProfile = ekadashiMethod;

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

  const travelRecalculationSupported = input.supportsTravelRecalculation === true;
  const isTravelModeActive = Boolean(
    travelRecalculationSupported &&
    isTravelDivergenceDetected &&
    input.confirmTravelLocation === true,
  );

  if (isTravelDivergenceDetected) {
    if (isTravelModeActive) {
      notes.push('Travel mode active: using temporary travel location for calculations without altering home profile.');
    } else if (input.confirmTravelLocation === true && !travelRecalculationSupported) {
      notes.push('Travel recalculation is unavailable until location-qualified observances are materialised; saved observance location remains active.');
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
