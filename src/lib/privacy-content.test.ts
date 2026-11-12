import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PRIVACY_DATA, PRIVACY_VERSION } from './privacy-content';

// Origin: 2026-11-12 privacy audit. The policy named only some processors generically, never mentioned Google AdSense although the
// cookie banner offers an advertising choice, and gave one anonymous address for the grievance officer and the UK/EU contact. These
// tests keep the policy and the product in step: every outside service the code calls with personal data is named, the cookie
// banner's two choices are both explained, and the displayed date follows the version.

const text = JSON.stringify(PRIVACY_DATA);
const section = (title: string) => {
  const all = [...PRIVACY_DATA.global, ...PRIVACY_DATA.appendices.flatMap((a) => a.sections)];
  const found = all.find((s) => s.title === title);
  expect(found, `section "${title}"`).toBeTruthy();
  return found!.content.join(' ');
};

describe('privacy policy content', () => {
  it('names every outside service that receives personal data', () => {
    for (const name of ['Supabase', 'Vercel', 'Expo', 'Firebase Cloud Messaging', 'Sarvam AI', 'Bhashini', 'Resend', 'Geoapify', 'OpenStreetMap Nominatim', 'Overpass', 'Slack', 'Google Analytics', 'Google AdSense']) {
      expect(text, name).toContain(name);
    }
  });

  it('does not name services that were retired (WhatsApp sending and Twilio, removed 2026-11-12; OneSignal)', () => {
    for (const name of ['Twilio', 'WhatsApp', 'OneSignal']) expect(text, name).not.toContain(name);
  });

  it('every outside host the place-search code can call belongs to a named service', async () => {
    const { API } = await import("./config");
    const mirrors: readonly string[] = API.OVERPASS.MIRRORS;
    expect(mirrors.length).toBeGreaterThan(0);
    for (const url of mirrors) expect(url, 'a map mirror outside the reviewed list').toMatch(/^https:\/\/(overpass\.openstreetmap\.fr|overpass\.kumi\.systems|overpass-api\.de)\//);
  });

  it('explains both cookie choices and says there is no advertising in the app', () => {
    const measurement = section('Diagnostics and Product Measurement');
    expect(measurement).toMatch(/Website analytics:/);
    expect(measurement).toMatch(/Advertising: on shoonaya\.com only/);
    expect(measurement).toMatch(/no advertising inside the app/);
  });

  it('says where the data is stored', () => {
    expect(section('Data Sharing')).toMatch(/Ireland/);
  });

  it('names a person for the grievance and data-protection contacts', () => {
    expect(section('DPDP Act Compliance')).toMatch(/Grievance Officer, Prince Sharma, at info@shoonaya\.com/);
    expect(section('Data Protection Officer')).toMatch(/Prince Sharma, at info@shoonaya\.com/);
  });

  it('shows a "Last Updated" date that matches the version recorded on every acceptance', () => {
    const date = new Date(`${PRIVACY_VERSION}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    const client = readFileSync(join(process.cwd(), 'src/app/privacy/PrivacyClient.tsx'), 'utf8');
    expect(client).toContain(`Last Updated: ${date}`);
  });
});
