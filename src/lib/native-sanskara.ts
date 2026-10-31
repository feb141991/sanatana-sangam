/**
 * The Native contract for the Sanskara tracker: what a client may ask, how it is validated, and how a database refusal is
 * reported. Pure functions only (no I/O), so the whole contract is unit-testable; the route in
 * app/api/native/sanskara/[action]/route.ts adds authentication, rate limiting and the call itself.
 *
 * WHY THIS LAYER EXISTS, AND WHAT IT IS NOT
 *   The database functions (supabase/migrations/20261029160100..20261030100000) already authorise every call: they identify
 *   the caller from the JWT (`auth.uid()`) and decide with `sanskara_can`. This layer does not replace that and cannot:
 *   the user's own client must be able to call the functions, so `authenticated` keeps EXECUTE on them. What the routes add
 *   is what a function cannot: a durable per-user rate limit, a bounded request size, strict input shapes, one stable error
 *   contract, and no database text on the wire. A client that bypasses the routes and calls the functions directly through
 *   PostgREST still gets every authorisation check; it just does not get the rate limit.
 *
 * IDEMPOTENCY
 *   Every write takes a client-generated `requestId` (a UUID). The database stores the first response and returns it,
 *   marked `replayed`, for a retry, so a flaky connection can retry safely. A requestId already used for a DIFFERENT
 *   operation is a 409.
 *
 * NEVER ON THE WIRE
 *   Database error text, SQLSTATE values other than our own `SKxxx` codes, table or column names. A refusal carries a
 *   short fixed sentence and, for our own errors, the machine reason (`sanskara_invalid_name`).
 */
import { isRealIsoDate } from '@/lib/iso-date';
import type { Database } from '@/types/database.generated';

type Functions = Database['public']['Functions'];
type SanskaraFunction = Extract<keyof Functions, `sanskara_${string}`>;
type ArgsOf<K extends SanskaraFunction> = Functions[K]['Args'];

/** Why a request body or query was refused: the first offending field, by its public name. */
export type ParseResult<T> = { ok: true; args: T } | { ok: false; field: string };

type Input = Record<string, unknown>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The hand-over token: 64 random hex characters, single use (contract section 4). */
const CLAIM_TOKEN = /^[0-9a-f]{64}$/i;
/** Free text has its own, tighter limits in the database; this only keeps junk and huge strings out of the request. */
const MAX_TEXT = 2000;

const fail = (field: string): { ok: false; field: string } => ({ ok: false, field });

function uuid(input: Input, key: string): string | null {
  const v = input[key];
  return typeof v === 'string' && UUID.test(v) ? v.toLowerCase() : null;
}
/** undefined or null means "absent"; anything else must be a valid UUID. Returns `undefined` for absent, `false` for invalid. */
function optionalUuid(input: Input, key: string): string | null | false {
  const v = input[key];
  if (v === undefined || v === null) return null;
  return typeof v === 'string' && UUID.test(v) ? v.toLowerCase() : false;
}
function realDate(input: Input, key: string): string | null {
  const v = input[key];
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return isRealIsoDate(t) ? t : null;
}
function optionalDate(input: Input, key: string): string | null | false {
  const v = input[key];
  if (v === undefined || v === null) return null;
  return realDate(input, key) ?? false;
}
/** Trimmed text; an empty or whitespace-only value is "absent" (null); a non-string or an over-long one is invalid (false). */
function optionalText(input: Input, key: string): string | null | false {
  const v = input[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string' || v.length > MAX_TEXT) return false;
  const t = v.trim();
  return t === '' ? null : t;
}
function requiredText(input: Input, key: string): string | null {
  const v = optionalText(input, key);
  return typeof v === 'string' ? v : null;
}
function integer(input: Input, key: string, min: number, max: number): number | null {
  const v = input[key];
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null;
}

/** Refuses an unknown key, so a typo or a smuggled field fails loudly instead of being ignored. */
function onlyKeys(input: Input, allowed: readonly string[]): string | null {
  for (const key of Object.keys(input)) if (!allowed.includes(key)) return key;
  return null;
}

/**
 * The database accepts NULL for these arguments, but the generated argument types (which cannot express a nullable
 * parameter) say `string`. One named, narrow cast instead of one at every call.
 */
const nullableArg = (v: string | null): string => v as unknown as string;

export type SanskaraAction = {
  readonly method: 'GET' | 'POST';
  readonly rpc: SanskaraFunction;
  /** Validates the request (a JSON body for POST, the query string for GET) into exactly the function's arguments. */
  readonly parse: (input: Input) => ParseResult<Record<string, unknown>>;
};

/** Ties an entry to the generated types: a wrong function name or argument name is a compile error here. */
function define<K extends SanskaraFunction>(
  method: 'GET' | 'POST',
  rpc: K,
  allowed: readonly string[],
  build: (input: Input) => ParseResult<ArgsOf<K>>,
): SanskaraAction {
  return {
    method,
    rpc,
    parse: (input) => {
      const extra = onlyKeys(input, allowed);
      if (extra !== null) return fail(extra);
      const result = build(input);
      return result.ok ? { ok: true, args: result.args as Record<string, unknown> } : result;
    },
  };
}

const noArgs = {} as const;

export const SANSKARA_ACTIONS: Readonly<Record<string, SanskaraAction>> = Object.freeze({
  // ── Reads (GET) ──────────────────────────────────────────────────────────────────────────────────────────────────────
  timeline: define('GET', 'sanskara_my_timeline', [], () => ({ ok: true, args: noArgs as ArgsOf<'sanskara_my_timeline'> })),
  dependents: define('GET', 'sanskara_dependents', [], () => ({ ok: true, args: noArgs as ArgsOf<'sanskara_dependents'> })),
  'shared-with-me': define('GET', 'sanskara_shared_with_me', [], () => ({ ok: true, args: noArgs as ArgsOf<'sanskara_shared_with_me'> })),
  reminders: define('GET', 'sanskara_my_reminders', [], () => ({ ok: true, args: noArgs as ArgsOf<'sanskara_my_reminders'> })),
  export: define('GET', 'sanskara_export_mine', [], () => ({ ok: true, args: noArgs as ArgsOf<'sanskara_export_mine'> })),
  access: define('GET', 'sanskara_list_access', ['subject'], (i) => {
    const subject = uuid(i, 'subject');
    return subject ? { ok: true, args: { p_subject: subject } } : fail('subject');
  }),

  // ── Writes (POST, all idempotent on requestId) ───────────────────────────────────────────────────────────────────────
  'create-dependent': define('POST', 'sanskara_create_dependent', ['requestId', 'name', 'birthDate', 'kulFamilyMemberId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const name = requiredText(i, 'name'); if (!name) return fail('name');
    const birthDate = realDate(i, 'birthDate'); if (!birthDate) return fail('birthDate');
    const tree = optionalUuid(i, 'kulFamilyMemberId'); if (tree === false) return fail('kulFamilyMemberId');
    const args: ArgsOf<'sanskara_create_dependent'> = { p_request_id: requestId, p_name: name, p_birth_date: birthDate };
    if (tree !== null) args.p_kul_family_member = tree;
    return { ok: true, args };
  }),
  'set-kul-link': define('POST', 'sanskara_set_kul_link', ['requestId', 'subjectId', 'kulFamilyMemberId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    // Required key: null unlinks. Leaving it out is an error, so an unlink is always deliberate.
    if (!('kulFamilyMemberId' in i)) return fail('kulFamilyMemberId');
    const tree = optionalUuid(i, 'kulFamilyMemberId'); if (tree === false) return fail('kulFamilyMemberId');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject, p_kul_family_member: nullableArg(tree) } };
  }),
  'create-record': define('POST', 'sanskara_create_record', ['requestId', 'subjectId', 'riteKey', 'customTitle', 'plannedDate'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    const rite = requiredText(i, 'riteKey'); if (!rite) return fail('riteKey');
    const title = optionalText(i, 'customTitle'); if (title === false) return fail('customTitle');
    const planned = optionalDate(i, 'plannedDate'); if (planned === false) return fail('plannedDate');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject, p_rite_key: rite, p_custom_title: nullableArg(title), p_planned_date: nullableArg(planned) } };
  }),
  'update-record': define('POST', 'sanskara_update_record', ['requestId', 'recordId', 'customTitle', 'plannedDate', 'expectedVersion'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const record = uuid(i, 'recordId'); if (!record) return fail('recordId');
    const title = optionalText(i, 'customTitle'); if (title === false) return fail('customTitle');
    const planned = optionalDate(i, 'plannedDate'); if (planned === false) return fail('plannedDate');
    const version = integer(i, 'expectedVersion', 0, 1_000_000); if (version === null) return fail('expectedVersion');
    return { ok: true, args: { p_request_id: requestId, p_record: record, p_custom_title: nullableArg(title), p_planned_date: nullableArg(planned), p_expected_version: version } };
  }),
  'save-private': define('POST', 'sanskara_save_private', ['requestId', 'recordId', 'notes', 'location', 'performedBy', 'expectedDueDate', 'expectedVersion'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const record = uuid(i, 'recordId'); if (!record) return fail('recordId');
    const notes = optionalText(i, 'notes'); if (notes === false) return fail('notes');
    const location = optionalText(i, 'location'); if (location === false) return fail('location');
    const by = optionalText(i, 'performedBy'); if (by === false) return fail('performedBy');
    const due = optionalDate(i, 'expectedDueDate'); if (due === false) return fail('expectedDueDate');
    const version = integer(i, 'expectedVersion', 0, 1_000_000); if (version === null) return fail('expectedVersion');
    return { ok: true, args: { p_request_id: requestId, p_record: record, p_notes: nullableArg(notes), p_location: nullableArg(location), p_performed_by: nullableArg(by), p_expected_due_date: nullableArg(due), p_expected_version: version } };
  }),
  'set-completion': define('POST', 'sanskara_set_completion', ['requestId', 'recordId', 'completedDate', 'expectedVersion'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const record = uuid(i, 'recordId'); if (!record) return fail('recordId');
    // Required key: null marks the rite not done. Leaving it out is an error.
    if (!('completedDate' in i)) return fail('completedDate');
    const done = optionalDate(i, 'completedDate'); if (done === false) return fail('completedDate');
    const version = integer(i, 'expectedVersion', 0, 1_000_000); if (version === null) return fail('expectedVersion');
    return { ok: true, args: { p_request_id: requestId, p_record: record, p_completed_date: nullableArg(done), p_expected_version: version } };
  }),
  'delete-record': define('POST', 'sanskara_delete_record', ['requestId', 'recordId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const record = uuid(i, 'recordId'); if (!record) return fail('recordId');
    return { ok: true, args: { p_request_id: requestId, p_record: record } };
  }),
  'delete-dependent': define('POST', 'sanskara_delete_dependent', ['requestId', 'subjectId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject } };
  }),
  'delete-mine': define('POST', 'sanskara_delete_mine', ['requestId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    return { ok: true, args: { p_request_id: requestId } };
  }),
  'add-manager': define('POST', 'sanskara_add_manager', ['requestId', 'subjectId', 'accountId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    const account = uuid(i, 'accountId'); if (!account) return fail('accountId');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject, p_account: account } };
  }),
  'remove-manager': define('POST', 'sanskara_remove_manager', ['requestId', 'subjectId', 'accountId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    const account = uuid(i, 'accountId'); if (!account) return fail('accountId');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject, p_account: account } };
  }),
  'grant-view': define('POST', 'sanskara_grant_view', ['requestId', 'subjectId', 'recordId', 'granteeId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    const record = optionalUuid(i, 'recordId'); if (record === false) return fail('recordId'); // null = the whole timeline
    const grantee = uuid(i, 'granteeId'); if (!grantee) return fail('granteeId');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject, p_record: nullableArg(record), p_grantee: grantee } };
  }),
  'revoke-grant': define('POST', 'sanskara_revoke_grant', ['requestId', 'grantId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const grant = uuid(i, 'grantId'); if (!grant) return fail('grantId');
    return { ok: true, args: { p_request_id: requestId, p_grant: grant } };
  }),
  'start-claim': define('POST', 'sanskara_start_claim', ['requestId', 'subjectId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject } };
  }),
  'cancel-claim': define('POST', 'sanskara_cancel_claim', ['requestId', 'subjectId'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const subject = uuid(i, 'subjectId'); if (!subject) return fail('subjectId');
    return { ok: true, args: { p_request_id: requestId, p_subject: subject } };
  }),
  'accept-claim': define('POST', 'sanskara_accept_claim', ['requestId', 'token'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const token = i.token;
    if (typeof token !== 'string' || !CLAIM_TOKEN.test(token)) return fail('token');
    return { ok: true, args: { p_request_id: requestId, p_token: token.toLowerCase() } };
  }),
  'set-reminder': define('POST', 'sanskara_set_reminder', ['requestId', 'recordId', 'leadDays', 'enabled'], (i) => {
    const requestId = uuid(i, 'requestId'); if (!requestId) return fail('requestId');
    const record = uuid(i, 'recordId'); if (!record) return fail('recordId');
    const lead = integer(i, 'leadDays', 0, 365); if (lead === null) return fail('leadDays');
    if (typeof i.enabled !== 'boolean') return fail('enabled');
    return { ok: true, args: { p_request_id: requestId, p_record: record, p_lead_days: lead, p_enabled: i.enabled } };
  }),
});

export function findSanskaraAction(name: string): SanskaraAction | null {
  return Object.hasOwn(SANSKARA_ACTIONS, name) ? SANSKARA_ACTIONS[name] : null;
}

/** A GET carries its inputs in the query string; this turns it into the same shape a POST body has. */
export function queryToInput(params: URLSearchParams): Input {
  const out: Input = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    out[key] = values.length === 1 ? values[0] : values; // a repeated key becomes an array, which no validator accepts
  }
  return out;
}

// ── Reporting a refusal ─────────────────────────────────────────────────────────────────────────────────────────────────

export type SanskaraFailure = { status: number; error: string; code: string };

/** Our own error reasons are `sanskara_` plus lower-case words. Anything else (including provider text) is never forwarded. */
const OWN_REASON = /^sanskara_[a-z0-9_]{1,60}$/;

/** Exact, reviewed database reason pairs. Unknown reasons use the generic SQLSTATE message. */
export const SANSKARA_REASON_ERRORS: Record<string, string> = {
  "SK409:sanskara_already_exists": "This milestone already exists.",
  "SK422:sanskara_already_has_access": "That person already has access.",
  "SK409:sanskara_already_manager": "That person is already a manager.",
  "SK409:sanskara_already_shared": "This has already been shared with that person.",
  "SK422:sanskara_cannot_share_with_self": "Choose another person to share with.",
  "SK409:sanskara_conflict": "This hand-over conflicts with existing records. Refresh before trying again.",
  "SK403:sanskara_consent_required": "Religious-data consent is needed before this can be used.",
  "SK422:sanskara_due_date_not_allowed": "An expected due date is only available for a prenatal milestone on your own timeline.",
  "SK400:sanskara_invalid_birth_date": "Enter a valid birth date for an eligible child.",
  "SK400:sanskara_invalid_date": "Enter a valid calendar date.",
  "SK400:sanskara_invalid_name": "Enter a valid name.",
  "SK400:sanskara_invalid_reminder": "Check the reminder settings.",
  "SK400:sanskara_invalid_request": "Use a valid request identifier.",
  "SK400:sanskara_invalid_text": "Check the length and format of the private details.",
  "SK400:sanskara_invalid_title": "Enter a valid milestone title.",
  "SK422:sanskara_last_manager": "Add another manager before removing the last manager.",
  "SK422:sanskara_limit_reached": "A limit was reached.",
  "SK422:sanskara_no_date": "Add a planned date before enabling a reminder.",
  "SK401:sanskara_not_authenticated": "Please sign in again.",
  "SK404:sanskara_not_found": "That was not found.",
  "SK422:sanskara_not_in_your_kul": "Choose an eligible member of your Kul.",
  "SK422:sanskara_prenatal_own_timeline_only": "Prenatal milestones belong on your own timeline.",
  "SK422:sanskara_record_completed": "Reminders cannot be enabled for a completed milestone.",
  "SK422:sanskara_reminders_off": "Enable Sanskara reminders in your preferences first.",
  "SK409:sanskara_request_conflict": "That request id was already used for something else.",
  "SK400:sanskara_unknown_rite": "That milestone type is unavailable.",
  "SK409:sanskara_version_conflict": "This was changed elsewhere. Refresh before trying again.",
};

const SK: Record<string, { status: number; error: string }> = {
  SK400: { status: 400, error: 'That request could not be accepted. Please check it and try again.' },
  SK401: { status: 401, error: 'Please sign in again.' },
  SK403: { status: 403, error: 'Religious-data consent is needed before this can be used.' },
  SK404: { status: 404, error: 'That was not found.' },
  SK409: { status: 409, error: 'This conflicts with the current state. Refresh before trying again.' },
  SK422: { status: 422, error: 'This action is not available in the current state.' },
};

/**
 * Maps a Supabase/PostgREST error to a public failure. Only our own SKxxx codes carry meaning; anything else is a generic
 * 503, because a function-not-found or a permission error would reveal how the database is laid out.
 */
export function mapSanskaraError(error: { code?: unknown; message?: unknown } | null | undefined): SanskaraFailure {
  const code = typeof error?.code === 'string' ? error.code : '';
  const known = SK[code];
  if (!known) return { status: 503, error: 'This could not be done right now. Please try again.', code: 'sanskara_unavailable' };
  const message = typeof error?.message === 'string' ? error.message : '';
  return { status: known.status, error: SANSKARA_REASON_ERRORS[`${code}:${message}`] ?? known.error, code: OWN_REASON.test(message) ? message : `sanskara_${code.toLowerCase()}` };
}
