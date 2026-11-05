import { describe, expect, it, vi } from 'vitest';

import {
  EmailConsentError,
  STRICTEST_WORDING_VERSION,
  WORDING_VERSIONS,
  deriveConsentRegion,
  getEmailConsentSummary,
  isWordingVersion,
  normaliseRegion,
  readIpCountry,
  setEmailConsent,
  wordingVersionForRegion,
} from './email-consent';

describe('region and wording policy', () => {
  it.each(['DE', 'FR', 'ES', 'IE', 'SE', 'GB', 'CH', 'NO', 'IS', 'LI', 'de', ' gb '])('shows the strictest wording in %s', (region) => {
    expect(wordingVersionForRegion(region)).toBe('eu-uk-v1');
  });

  it.each(['IN', 'US', 'SG', 'AU', 'CA', 'AE', 'in'])('shows the global wording in %s', (region) => {
    expect(wordingVersionForRegion(region)).toBe('global-v1');
  });

  it.each([null, undefined, '', 'XX', 'india', 'I', 'IND', '12', 42, {}])('treats %j as unknown and shows the strictest wording', (region) => {
    expect(wordingVersionForRegion(region)).toBe(STRICTEST_WORDING_VERSION);
  });

  it('covers all 27 EU member states, so a member state cannot silently get the lighter wording', () => {
    const eu = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    expect(eu).toHaveLength(27);
    for (const code of eu) expect(wordingVersionForRegion(code), code).toBe('eu-uk-v1');
  });

  it('knows exactly the wording versions the apps can show', () => {
    expect([...WORDING_VERSIONS].sort()).toEqual(['eu-uk-v1', 'global-v1']);
    expect(isWordingVersion('eu-uk-v1')).toBe(true);
    expect(isWordingVersion('global-v1')).toBe(true);
    for (const bad of ['global-v2', '', 'EU-UK-V1', null, undefined, 1]) expect(isWordingVersion(bad), String(bad)).toBe(false);
  });

  it('normalises a region to a two-letter uppercase code or null', () => {
    expect(normaliseRegion('in')).toBe('IN');
    expect(normaliseRegion(' de ')).toBe('DE');
    for (const bad of ['', 'XX', 'xx', 'india', 'I', '1N', null, undefined, 7]) expect(normaliseRegion(bad), String(bad)).toBeNull();
  });
});

describe('where the region came from', () => {
  it('prefers the request IP country, then the device, then the profile', () => {
    expect(deriveConsentRegion({ ipCountry: 'DE', deviceRegion: 'IN', profileCountry: 'US' })).toEqual({ region: 'DE', source: 'ip_header' });
    expect(deriveConsentRegion({ ipCountry: null, deviceRegion: 'in', profileCountry: 'US' })).toEqual({ region: 'IN', source: 'device_region' });
    expect(deriveConsentRegion({ deviceRegion: 'nope', profileCountry: 'us' })).toEqual({ region: 'US', source: 'profile_country' });
  });

  it('never invents a region: nothing usable means no region and no source', () => {
    expect(deriveConsentRegion({})).toEqual({ region: null, source: null });
    expect(deriveConsentRegion({ ipCountry: 'XX', deviceRegion: '', profileCountry: 'zzz' })).toEqual({ region: null, source: null });
  });

  it('reads the Vercel country header and nothing that looks like an address', () => {
    expect(readIpCountry(new Headers({ 'x-vercel-ip-country': 'IN' }))).toBe('IN');
    expect(readIpCountry(new Headers({ 'x-vercel-ip-country': 'xx' }))).toBeNull();
    expect(readIpCountry(new Headers({ 'x-forwarded-for': '203.0.113.9' }))).toBeNull();
    expect(readIpCountry(new Headers())).toBeNull();
  });
});

describe('setEmailConsent', () => {
  const ok = { data: { changed: true, marketing: true, newsletter: true, festivals: false }, error: null };

  it('calls the database function with exactly the account, category, path and context it was given', async () => {
    const rpc = vi.fn().mockResolvedValue(ok);
    const result = await setEmailConsent({
      userId: 'u1', category: 'newsletter', granted: true, source: 'settings', wordingVersion: 'eu-uk-v1', region: 'DE', regionSource: 'ip_header',
    }, { rpc });
    expect(rpc).toHaveBeenCalledWith('set_email_consent', {
      p_user_id: 'u1', p_category: 'newsletter', p_granted: true, p_source: 'settings',
      p_wording_version: 'eu-uk-v1', p_region: 'DE', p_region_source: 'ip_header',
    });
    expect(result).toEqual({ changed: true, marketing: true, newsletter: true, festivals: false });
  });

  it('sends null for anything not given, and never a region source without a region', async () => {
    const rpc = vi.fn().mockResolvedValue(ok);
    await setEmailConsent({ userId: 'u1', category: 'all', granted: false, source: 'one_click', regionSource: 'ip_header' }, { rpc });
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_wording_version: null, p_region: null, p_region_source: null });
  });

  it.each([
    ['P0002', 'not_found'],
    ['55000', 'account_deleting'],
    ['22023', 'invalid'],
    ['57014', 'unavailable'],
    [undefined, 'unavailable'],
  ])('maps database code %s to %s and carries no database text', async (code, expected) => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code, message: 'relation "profiles" column email_festivals detail' } });
    const error = await setEmailConsent({ userId: 'u1', category: 'festivals', granted: true, source: 'settings' }, { rpc }).catch((e) => e);
    expect(error).toBeInstanceOf(EmailConsentError);
    expect((error as EmailConsentError).code).toBe(expected);
    expect(String(error.message)).not.toMatch(/profiles|column|detail|email_festivals/);
  });

  it('treats a thrown network error and a malformed answer as unavailable, never as success', async () => {
    const thrown = vi.fn().mockRejectedValue(new Error('socket hang up'));
    expect(await setEmailConsent({ userId: 'u1', category: 'festivals', granted: true, source: 'settings' }, { rpc: thrown }).catch((e) => e.code)).toBe('unavailable');
    for (const data of [null, {}, { changed: 'yes', marketing: true, newsletter: true, festivals: true }, { changed: true }, [], 'ok']) {
      const rpc = vi.fn().mockResolvedValue({ data, error: null });
      expect(await setEmailConsent({ userId: 'u1', category: 'festivals', granted: true, source: 'settings' }, { rpc }).catch((e) => e.code), JSON.stringify(data)).toBe('unavailable');
    }
  });
});

function readClient(profile: { data: unknown; error: unknown }, history: { data: unknown; error: unknown }) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => table === 'profiles'
          ? { maybeSingle: async () => profile }
          : { order: () => ({ limit: async () => history }) },
      }),
    }),
  };
}

describe('getEmailConsentSummary', () => {
  it('counts the newsletter as on only when both flags the campaign audience reads are on', async () => {
    const summary = (marketing: boolean | null, newsletter: boolean | null) => getEmailConsentSummary('u1', readClient(
      { data: { marketing_consent: marketing, email_newsletter: newsletter, email_festivals: false }, error: null },
      { data: [], error: null },
    ));
    expect((await summary(true, true)).newsletter).toBe(true);
    expect((await summary(true, false)).newsletter).toBe(false);
    expect((await summary(false, true)).newsletter).toBe(false);
    expect((await summary(null, null)).newsletter).toBe(false);
  });

  it('reports festivals only when explicitly on, and the latest change time when there is one', async () => {
    const on = await getEmailConsentSummary('u1', readClient(
      { data: { marketing_consent: false, email_newsletter: false, email_festivals: true }, error: null },
      { data: [{ created_at: '2026-11-06T01:00:00.000Z' }], error: null },
    ));
    expect(on).toEqual({ newsletter: false, festivals: true, lastChangedAt: '2026-11-06T01:00:00.000Z' });
    const unset = await getEmailConsentSummary('u1', readClient(
      { data: { marketing_consent: null, email_newsletter: null, email_festivals: null }, error: null },
      { data: [], error: null },
    ));
    expect(unset).toEqual({ newsletter: false, festivals: false, lastChangedAt: null });
  });

  it('a failed read is an error, never "everything off"', async () => {
    const failed = { data: null, error: { code: '57014' } };
    expect(await getEmailConsentSummary('u1', readClient(failed, { data: [], error: null })).catch((e) => e.code)).toBe('unavailable');
    expect(await getEmailConsentSummary('u1', readClient(
      { data: { marketing_consent: false, email_newsletter: false, email_festivals: false }, error: null }, failed,
    )).catch((e) => e.code)).toBe('unavailable');
    expect(await getEmailConsentSummary('u1', readClient({ data: null, error: null }, { data: [], error: null })).catch((e) => e.code)).toBe('not_found');
  });
});
