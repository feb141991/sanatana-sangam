/**
 * Canonical cross-client read contract for multi-day observance series.
 *
 * Backend owns this file. Native receives a byte-identical generated snapshot;
 * clients render these dates and identities but never calculate them.
 */
export const OBSERVANCE_SERIES_CONTRACT_VERSION = '1.0.0';

export type ObservanceSeriesMode =
  | 'daily_journey'
  | 'festival_cluster'
  | 'season'
  | 'recurring_series';

export type ObservanceSeriesStatus =
  | 'upcoming'
  | 'active'
  | 'concluding'
  | 'complete'
  | 'under_review';

export interface ObservanceSeriesSourceReference {
  id?: string;
  sourceName: string;
  textName?: string | null;
  publisher?: string | null;
  edition?: string | null;
  pageOrSection?: string | null;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  tradition?: string | null;
  region?: string | null;
  scholarNotes?: string | null;
  copyrightStatus?: string | null;
  usagePermitted?: string | null;
  url?: string | null;
}

export interface ObservanceSeriesChild {
  /** Null only for an explicitly missing required child; never fabricate an occurrence UUID. */
  occurrenceId: string | null;
  slug: string;
  civilDate: string | null;
  sequence: number;
  title: string;
  routeKind: string | null;
  routeSlug: string | null;
  status: 'resolved' | 'ambiguous' | 'unresolved' | 'under_review' | 'missing';
  diagnostics: string[];
  sourceRefs: ObservanceSeriesSourceReference[];
  editorial?: {
    deityOrTheme?: string | null;
    rituals?: string[];
    colour?: string | null;
    mantraId?: string | null;
  };
}

export interface ObservanceSeries {
  seriesKey: string;
  definitionKey: string;
  mode: ObservanceSeriesMode;
  name: string;
  tradition: string;
  profile: { calendar: string; tradition: string };
  location: { label: string; lat: number; lon: number; tz: string };
  status: ObservanceSeriesStatus;
  startDate: string | null;
  endDate: string | null;
  currentDay: number | null;
  totalDays: number | null;
  children: ObservanceSeriesChild[];
  diagnostics: string[];
  sourceRefs: ObservanceSeriesSourceReference[];
  versions: Record<string, string>;
}
