export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VratObservationPayload {
  occurrence_id: string;
}

export function buildVratObservationPayload(params: {
  occurrenceId?: string | null;
}): VratObservationPayload {
  const occId = params.occurrenceId?.trim();
  if (!occId || !UUID_REGEX.test(occId)) {
    throw new Error("Valid canonical occurrence_id UUID is required");
  }
  return { occurrence_id: occId };
}

export interface ObservationEligibleOccurrence {
  id?: string | null;
  civilDate?: string | null;
  date?: string | null;
  status?: string | null;
  isPrimary?: boolean;
}

export function isEligibleToObserveToday(params: {
  occurrence: ObservationEligibleOccurrence | null | undefined;
  canonicalTodayDate: string | null | undefined;
}): boolean {
  if (!params.occurrence?.id || !params.canonicalTodayDate) {
    return false;
  }
  if (!UUID_REGEX.test(params.occurrence.id)) {
    return false;
  }
  // Exactly positive resolved status required
  if (params.occurrence.status !== "resolved") {
    return false;
  }
  // Exactly primary variant required
  if (params.occurrence.isPrimary !== true) {
    return false;
  }
  const occurrenceDate = params.occurrence.civilDate ?? params.occurrence.date;
  if (!occurrenceDate || occurrenceDate !== params.canonicalTodayDate) {
    return false;
  }
  return true;
}
