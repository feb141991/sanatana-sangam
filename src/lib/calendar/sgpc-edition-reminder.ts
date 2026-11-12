export type SgpcReminderState = 'ok' | 'due_soon' | 'overdue';

export type SgpcEditionReminder = {
  state: SgpcReminderState;
  latestEdition: number | null;
  latestEditionEnds: string | null;
  message: string;
  sourceUrl: string;
  guidePath: string;
};

const SOURCE_URL = 'https://sgpc.net/nanakshahi-calendar/';
const GUIDE_PATH = '/docs/sources/SGPC_EDITION_INGESTION.md';
const DAY_MS = 86_400_000;

export function buildSgpcEditionReminder(
  latest: { edition: number; to: string } | null,
  now = new Date(),
): SgpcEditionReminder {
  if (!latest) {
    return { state: 'overdue', latestEdition: null, latestEditionEnds: null,
      message: 'Sikh dates are not shown; ingest the SGPC calendar', sourceUrl: SOURCE_URL, guidePath: GUIDE_PATH };
  }
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const end = new Date(`${latest.to}T00:00:00Z`).getTime();
  const daysRemaining = Math.floor((end - today) / DAY_MS);
  const state: SgpcReminderState = daysRemaining < 0 ? 'overdue' : daysRemaining <= 60 ? 'due_soon' : 'ok';
  const message = state === 'ok'
    ? `Samvat ${latest.edition} is loaded through ${latest.to}.`
    : state === 'due_soon'
      ? 'Samvat N+1 starts 14 March; ingest the SGPC calendar'
      : 'Sikh dates are not shown; ingest Samvat N+1';
  return { state, latestEdition: latest.edition, latestEditionEnds: latest.to, message, sourceUrl: SOURCE_URL, guidePath: GUIDE_PATH };
}
