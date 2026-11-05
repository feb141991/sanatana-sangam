import { createServiceRoleSupabaseClient } from '@/lib/admin';

/**
 * E-mail consent: the region policy and the one server entry point for changing consent
 * (docs/EMAIL_CONSENT_PLAN.md). Every switch is OFF until the person turns it on, in every region. Location never loosens that;
 * it only chooses the wording shown and is recorded as evidence of which region applied.
 */

export type EmailConsentCategory = 'newsletter' | 'festivals';
export type EmailWithdrawCategory = EmailConsentCategory | 'all';
/** Paths a Native request may claim. The unsubscribe link paths are set by /api/unsubscribe only. */
export type EmailConsentClientSource = 'onboarding' | 'settings';
export type EmailConsentSource = EmailConsentClientSource | 'unsubscribe_link' | 'one_click';
export type ConsentRegionSource = 'ip_header' | 'device_region' | 'profile_country';

export const EMAIL_CONSENT_CATEGORIES: readonly EmailConsentCategory[] = ['newsletter', 'festivals'];
export const EMAIL_CONSENT_CLIENT_SOURCES: readonly EmailConsentClientSource[] = ['onboarding', 'settings'];

/** Wording versions the apps can show. A new region-specific text is a new entry here and in the app, with no schema change. */
export const WORDING_VERSIONS = ['eu-uk-v1', 'global-v1'] as const;
export type WordingVersion = (typeof WORDING_VERSIONS)[number];
/** Shown to the EEA, the UK, Switzerland, and wherever the region is not known. */
export const STRICTEST_WORDING_VERSION: WordingVersion = 'eu-uk-v1';

const STRICT_REGIONS: ReadonlySet<string> = new Set([
  // EU
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // rest of the EEA, the UK and Switzerland
  'IS', 'LI', 'NO', 'GB', 'CH',
]);

/** A two-letter uppercase country code, or null. "XX" is the placeholder some providers send for "unknown". */
export function normaliseRegion(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX') return null;
  return code;
}

export function wordingVersionForRegion(region: unknown): WordingVersion {
  const code = normaliseRegion(region);
  if (!code) return STRICTEST_WORDING_VERSION;
  return STRICT_REGIONS.has(code) ? 'eu-uk-v1' : 'global-v1';
}

export function isWordingVersion(value: unknown): value is WordingVersion {
  return typeof value === 'string' && (WORDING_VERSIONS as readonly string[]).includes(value);
}

/** The country Vercel attaches to a request. Read, never stored as an IP address. */
export function readIpCountry(headers: Headers): string | null {
  return normaliseRegion(headers.get('x-vercel-ip-country'));
}

/** The region that applied and where it came from: the request's IP country, then what the device says, then the profile. */
export function deriveConsentRegion(input: {
  ipCountry?: unknown;
  deviceRegion?: unknown;
  profileCountry?: unknown;
}): { region: string | null; source: ConsentRegionSource | null } {
  const ip = normaliseRegion(input.ipCountry);
  if (ip) return { region: ip, source: 'ip_header' };
  const device = normaliseRegion(input.deviceRegion);
  if (device) return { region: device, source: 'device_region' };
  const profile = normaliseRegion(input.profileCountry);
  if (profile) return { region: profile, source: 'profile_country' };
  return { region: null, source: null };
}

export type EmailConsentErrorCode = 'not_found' | 'account_deleting' | 'invalid' | 'unavailable';

/** Carries a code only: never a database message, a column or a query detail. */
export class EmailConsentError extends Error {
  readonly code: EmailConsentErrorCode;
  constructor(code: EmailConsentErrorCode) {
    super(`email_consent_${code}`);
    this.name = 'EmailConsentError';
    this.code = code;
  }
}

export type EmailConsentChange = { changed: boolean; marketing: boolean; newsletter: boolean; festivals: boolean };

export type SetEmailConsentInput = {
  userId: string;
  category: EmailWithdrawCategory;
  granted: boolean;
  source: EmailConsentSource;
  wordingVersion?: WordingVersion | null;
  region?: string | null;
  regionSource?: ConsentRegionSource | null;
};

type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { code?: string } | null }> };

function codeFor(error: { code?: string }): EmailConsentErrorCode {
  if (error.code === 'P0002') return 'not_found';
  if (error.code === '55000') return 'account_deleting';
  if (error.code === '22023') return 'invalid';
  return 'unavailable';
}

function isChange(value: unknown): value is EmailConsentChange {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.changed === 'boolean' && typeof v.marketing === 'boolean' && typeof v.newsletter === 'boolean' && typeof v.festivals === 'boolean';
}

/**
 * Changes e-mail consent for ONE account through the database function that records it. The caller passes the account id it derived
 * itself (a verified session, or an unsubscribe token it resolved): never an id taken from a request body.
 */
export async function setEmailConsent(input: SetEmailConsentInput, client: RpcClient = createServiceRoleSupabaseClient()): Promise<EmailConsentChange> {
  let result: { data: unknown; error: { code?: string } | null };
  try {
    result = await client.rpc('set_email_consent', {
      p_user_id: input.userId,
      p_category: input.category,
      p_granted: input.granted,
      p_source: input.source,
      p_wording_version: input.wordingVersion ?? null,
      p_region: input.region ?? null,
      p_region_source: input.region ? (input.regionSource ?? null) : null,
    });
  } catch {
    throw new EmailConsentError('unavailable');
  }
  if (result.error) throw new EmailConsentError(codeFor(result.error));
  if (!isChange(result.data)) throw new EmailConsentError('unavailable');
  return result.data;
}

export type EmailConsentSummary = { newsletter: boolean; festivals: boolean; lastChangedAt: string | null };

type ReadClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle?: () => PromiseLike<{ data: unknown; error: unknown }>;
        order?: (column: string, options: { ascending: boolean }) => { limit: (n: number) => PromiseLike<{ data: unknown; error: unknown }> };
      };
    };
  };
};

/**
 * What the person has chosen now, and when it last changed. The newsletter counts as ON only when BOTH flags the campaign audience reads
 * are on. A failed read is an error, never "everything off": a screen must not offer to switch on what may already be on.
 */
export async function getEmailConsentSummary(userId: string, client: ReadClient = createServiceRoleSupabaseClient() as unknown as ReadClient): Promise<EmailConsentSummary> {
  const profile = await client.from('profiles').select('marketing_consent, email_newsletter, email_festivals').eq('id', userId).maybeSingle!();
  if (profile.error || !profile.data || typeof profile.data !== 'object') throw new EmailConsentError(profile.error ? 'unavailable' : 'not_found');
  const row = profile.data as { marketing_consent: boolean | null; email_newsletter: boolean | null; email_festivals: boolean | null };

  const history = await client.from('email_consent_events').select('created_at').eq('user_id', userId).order!('created_at', { ascending: false }).limit(1);
  if (history.error || !Array.isArray(history.data)) throw new EmailConsentError('unavailable');
  const latest = history.data[0] as { created_at?: unknown } | undefined;

  return {
    newsletter: row.marketing_consent === true && row.email_newsletter === true,
    festivals: row.email_festivals === true,
    lastChangedAt: typeof latest?.created_at === 'string' ? latest.created_at : null,
  };
}
