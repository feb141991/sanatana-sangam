import { NextRequest, NextResponse } from 'next/server';
import { isRealIsoDate } from '@/lib/iso-date';
import { UUID_REGEX } from '@/lib/vrat-observation';
import { localSpiritualDate } from '@/lib/sacred-time';
import {
  resolveRequestProfile,
  resolveSpiritualDateTimezone,
  shiftDate,
  PROFILE_RESOLUTION_PAD_DAYS,
} from '@/lib/calendar/request-profile';
import {
  attachMaterialisationBatches,
  CALENDAR_OCCURRENCE_SELECT,
} from '@/lib/calendar/occurrence-reader';
import { formatOccurrencesToResults } from '@/lib/calendar/observance-formatter';
import { filterObservancesToCalculationLocation } from '@/lib/calendar/response-location';
import { selectFestivalReaderOccurrence } from '@/lib/calendar/festival-reader-selection';
import { ServerTimingCollector } from '@/lib/server-timing';

export const runtime = 'nodejs';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROW_LIMIT = 500;

function isValidIanaTimezone(tz: string): boolean {
  if (!tz || tz.length > 80) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Narrow reader lookup: one definition family, with the same publication/profile/location pipeline as calendar feeds. */
export async function GET(request: NextRequest) {
  const timings = new ServerTimingCollector();
  const headers: Record<string, string> = {
    'Cache-Control': 'private, no-store',
  };

  const params = request.nextUrl.searchParams;
  const slug = params.get('slug') ?? '';
  const occurrenceId = params.get('occurrence_id') ?? undefined;
  const date = params.get('date') ?? undefined;
  const variantKey = params.get('variant_key') ?? undefined;
  const calendarProfileParam = params.get('calendar_profile') ?? undefined;
  const traditionParam = params.get('tradition') ?? undefined;
  const tzParam = params.get('tz') ?? undefined;

  if (
    !SLUG.test(slug) ||
    slug.length > 160 ||
    (occurrenceId !== undefined && !UUID_REGEX.test(occurrenceId)) ||
    (date !== undefined && !isRealIsoDate(date)) ||
    (variantKey !== undefined && !/^[a-zA-Z0-9_.:-]{1,160}$/.test(variantKey)) ||
    (calendarProfileParam !== undefined && !/^[a-z0-9_-]{1,80}$/.test(calendarProfileParam)) ||
    (traditionParam !== undefined && !/^[a-z0-9_-]{1,80}$/.test(traditionParam)) ||
    (tzParam !== undefined && !isValidIanaTimezone(tzParam))
  ) {
    const isDateFailure = date !== undefined && !isRealIsoDate(date);
    headers['Server-Timing'] = timings.toHeaderValue();
    return NextResponse.json(
      {
        error: isDateFailure ? 'Invalid date. Use a real date in YYYY-MM-DD format' : 'Invalid observance target',
        code: isDateFailure ? 'INVALID_DATE' : 'INVALID_VALUE',
      },
      { status: 400, headers },
    );
  }

  try {
    const tradition = traditionParam || 'all';
    const calendarProfile = calendarProfileParam || '';

    const resolved = await timings.measure('profile', 'Profile Resolution', () =>
      resolveRequestProfile(request, { tradition, calendarProfile })
    );

    if (resolved.invalidCredentials) {
      headers['Server-Timing'] = timings.toHeaderValue();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    if (resolved.profileError) {
      headers['Server-Timing'] = timings.toHeaderValue();
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 503, headers });
    }

    const requestedTz = tzParam || 'Asia/Kolkata';
    const timezone = resolveSpiritualDateTimezone(resolved, requestedTz) || requestedTz;
    if (!timezone || !isValidIanaTimezone(timezone)) {
      headers['Server-Timing'] = timings.toHeaderValue();
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 503, headers });
    }

    const client = resolved.supabase;
    const target = { slug, occurrenceId, date, variantKey };
    const emptyResponse = () => {
      headers['Server-Timing'] = timings.toHeaderValue();
      return NextResponse.json(selectFestivalReaderOccurrence([], target), { headers });
    };

    let from = date ?? localSpiritualDate(timezone, 4);
    let to = date ?? shiftDate(from, 370);
    let definitionIds: string[];

    if (occurrenceId) {
      const { data, error } = await timings.measure('occurrence_anchor', 'Occurrence Anchor', () =>
        client
          .from('observance_occurrences')
          .select('definition_id,date,observance_definitions!inner(slug,route_slug)')
          .eq('id', occurrenceId)
          .maybeSingle()
      );
      if (error) throw new Error('occurrence_anchor');
      const def = (data as any)?.observance_definitions;
      const defSlug = Array.isArray(def) ? def[0]?.slug : def?.slug;
      const defRouteSlug = Array.isArray(def) ? def[0]?.route_slug : def?.route_slug;

      if (!data?.definition_id || !isRealIsoDate(data.date) || (defSlug !== slug && defRouteSlug !== slug)) {
        return emptyResponse();
      }
      from = shiftDate(data.date, -PROFILE_RESOLUTION_PAD_DAYS);
      to = shiftDate(data.date, PROFILE_RESOLUTION_PAD_DAYS);
      definitionIds = [String(data.definition_id)];
    } else {
      const { data, error } = await timings.measure('definition_lookup', 'Definition Lookup', () =>
        client
          .from('observance_definitions')
          .select('id')
          .eq('active', true)
          .or(`slug.eq.${slug},route_slug.eq.${slug}`)
      );
      if (error) throw new Error('definition_lookup');
      definitionIds = (data ?? []).map(row => String(row.id));
      if (!definitionIds.length) return emptyResponse();
    }

    const calendarProfiles = Array.from(new Set([resolved.calendarProfile, 'legacy-ujjain']));

    let query = client
      .from('observance_occurrences')
      .select(CALENDAR_OCCURRENCE_SELECT)
      .in('definition_id', definitionIds)
      .in('calendar_profile', calendarProfiles)
      .gte('date', shiftDate(from, -PROFILE_RESOLUTION_PAD_DAYS))
      .lte('date', shiftDate(to, PROFILE_RESOLUTION_PAD_DAYS))
      .eq('observance_definitions.active', true)
      .eq('publication_status', 'published')
      .eq('review_status', 'reviewed')
      .eq('verification_status', 'verified')
      .eq('audit_status', 'completed')
      .neq('final_date_source', 'fallback')
      .order('date', { ascending: true })
      .limit(ROW_LIMIT + 1);

    if (resolved.tradition !== 'all') {
      query = query.in('observance_definitions.tradition', [resolved.tradition, 'all']);
    }

    const { data, error } = await timings.measure('occurrences_query', 'Occurrences Query', () => query);
    if (error || (data?.length ?? 0) > ROW_LIMIT) throw new Error('occurrence_family');

    const rows = await timings.measure('attach_batches', 'Attach Batches', () =>
      attachMaterialisationBatches(data ?? [], undefined, resolved.calendarProfile, resolved.context.effectiveCalculationLocation)
    );

    const results = await timings.measure('formatting', 'Formatting', () =>
      filterObservancesToCalculationLocation(
        formatOccurrencesToResults(
          rows,
          [],
          resolved.tradition,
          resolved.calendarProfile,
          resolved.sampradaya,
          from,
          to,
          resolved.context,
        ),
        resolved.context.effectiveCalculationLocation,
      )
    );

    const selectionResult = await timings.measure('selection', 'Selection', () =>
      selectFestivalReaderOccurrence(results, target)
    );

    headers['Server-Timing'] = timings.toHeaderValue();
    return NextResponse.json(selectionResult, { headers });
  } catch {
    headers['Server-Timing'] = timings.toHeaderValue();
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 503, headers });
  }
}
