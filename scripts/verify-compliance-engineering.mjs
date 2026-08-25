import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const nativeRoot = process.env.SHOONAYA_NATIVE_ROOT
  || resolve(root, '../../shoonaya-mobile');
const failures = [];
const warnings = [];

function read(path, base = root) {
  return readFileSync(resolve(base, path), 'utf8');
}

function check(label, fn) {
  try {
    fn();
    console.log(`PASS ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAIL ${label}`);
  }
}

check('profile lock-down migration removes public base-table access', () => {
  const sql = read('supabase/migrations/20260824162430_lock_down_profiles_reads.sql');
  assert.match(sql, /DROP POLICY IF EXISTS "Public profiles are viewable by everyone"/);
  assert.match(sql, /FORCE ROW LEVEL SECURITY/);
  assert.doesNotMatch(sql, /TO\s+anon[\s\S]*ON\s+public\.profiles/i);
});

check('web optional vendors are loaded only by the consent manager', () => {
  const layout = read('src/app/layout.tsx');
  assert.doesNotMatch(layout, /googletagmanager\.com|pagead2\.googlesyndication\.com|OneSignalSDK/);
  assert.match(layout, /WebConsentManager/);
  const consent = read('src/components/privacy/WebConsentManager.tsx');
  assert.match(consent, /preferences\.analytics/);
  assert.match(consent, /preferences\.advertising/);
  assert.match(consent, /preferences\.push/);
});

if (existsSync(nativeRoot)) {
  check('native Firebase Analytics is absent but Firebase Core and notifications remain', () => {
    const pkg = JSON.parse(read('package.json', nativeRoot));
    assert.equal(pkg.dependencies?.['@react-native-firebase/analytics'], undefined);
    assert.ok(pkg.dependencies?.['@react-native-firebase/app']);
    assert.ok(pkg.dependencies?.['expo-notifications']);
  });

  check('native religious-data setting is not default-on', () => {
    const settings = read('app/settings.tsx', nativeRoot);
    assert.match(settings, /consent_religious_data:\s*false/);
    assert.doesNotMatch(settings, /consent_religious_data:\s*true/);
  });

  check('Expo privacy manifest declares collection and no tracking', () => {
    const config = JSON.parse(read('app.json', nativeRoot)).expo;
    assert.equal(config.ios.privacyManifests.NSPrivacyTracking, false);
    assert.ok(config.ios.privacyManifests.NSPrivacyCollectedDataTypes.length > 0);
    assert.equal(
      config.ios.privacyManifests.NSPrivacyCollectedDataTypes.some(
        (item) => item.NSPrivacyCollectedDataType === 'NSPrivacyCollectedDataTypePhoneNumber',
      ),
      false,
      'Native does not currently collect a phone number',
    );
  });
} else {
  warnings.push(`Native repo unavailable at ${nativeRoot}; native checks skipped.`);
}

check('retention registry cannot run destructive jobs', () => {
  const registry = JSON.parse(read('docs/DATA_LIFECYCLE_REGISTRY.json'));
  assert.equal(registry.destructiveJobsEnabled, false);
  assert.ok(registry.categories.every((item) => item.retentionDays === null));
});

check('Mandali UGC writes use authenticated rate-limited routes', () => {
  for (const route of [
    'src/app/api/mandali/posts/route.ts',
    'src/app/api/mandali/comments/route.ts',
    'src/app/api/mandali/report/route.ts',
  ]) {
    const source = read(route);
    assert.match(source, /getApiUser\(request\)/, `${route} does not derive identity from auth`);
    assert.match(source, /rateLimitByIp\(request/, `${route} has no write rate limit`);
    assert.doesNotMatch(source, /body\.(userId|author_id|reported_by)/, `${route} trusts a client identity`);
  }
  const client = read('src/lib/api/mandali.ts');
  assert.doesNotMatch(client, /\.from\(['"](?:posts|post_comments)['"]\)[\s\S]{0,180}\.(?:insert|update|upsert)\(/);
  assert.doesNotMatch(read('src/components/safety/ContentSafetyMenu.tsx'), /\.from\(['"]content_reports['"]\)/);
});

check('public provenance contract fails closed and has a Native entry point', () => {
  assert.match(read('src/app/api/public/sources/route.ts'), /getPublicSourceDisclosures/);
  const disclosure = read('src/lib/public-source-disclosures.ts');
  assert.match(disclosure, /explicitlyPublicDomain/);
  assert.match(disclosure, /rightsLabel:\s*'Public-domain edition'/);
  if (existsSync(nativeRoot)) assert.match(read('app/settings.tsx', nativeRoot), /openLegalUrl\('\/sources'\)/);
});

const policy = read('src/lib/compliance/policy-config.ts');
for (const gate of ['RELIGIOUS_PROFILE_CONSENT', 'AGE_POLICY', 'LEGAL_DOCUMENTS']) {
  if (!policy.includes(gate)) failures.push(`Missing policy decision gate ${gate}`);
}
if ((policy.match(/status:\s*'pending_approval'/g) ?? []).length < 2) {
  failures.push('Pending religious-profile or legal-document choices were silently converted into approved defaults.');
} else {
  warnings.push('Religious-profile consent and legal document versions still need approval.');
}
if (!policy.includes("status: 'founder_approved_pending_legal_review'")) {
  failures.push('Founder-approved age guidance decision is not recorded.');
} else if (!policy.includes('verifiedParentalConsentImplemented: false')) {
  failures.push('Age guidance must not imply verified parental consent.');
} else {
  warnings.push('The non-blocking age-guidance policy still needs launch-market legal review.');
}

check('age guidance is consistent across birth-data and legal surfaces', () => {
  const guidance = read('src/lib/compliance/age-guidance.ts');
  assert.match(guidance, /accountAccess:\s*'allowed_without_age_block'/);
  assert.match(guidance, /verifiedParentalConsentImplemented:\s*false/);
  assert.match(read('src/lib/terms-content.ts'), /AGE_GUIDANCE_POLICY\.terms/);
  assert.match(read('src/lib/privacy-content.ts'), /AGE_GUIDANCE_POLICY\.privacy/);
  for (const surface of [
    'src/app/(main)/onboarding/OnboardingClient.tsx',
    'src/app/(main)/profile/ProfileClient.tsx',
    'src/app/(main)/kundali/KundaliClient.tsx',
    'src/app/(main)/kul/components/KulVanshForm.tsx',
  ]) {
    assert.match(read(surface), /AgeGuidanceNotice/);
  }
});

for (const warning of warnings) console.warn(`PENDING ${warning}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Compliance engineering checks passed (${warnings.length} pending decision warning(s)).`);
}
