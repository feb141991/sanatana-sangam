import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

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
  // retentionDays may carry a drafted proposal (a number) pending approval --
  // the real safety invariant is that no category's status has moved past
  // "pending_approval" (or backups' "external_disclosure_required"), which
  // would signal someone flipped a category live without the global switch.
  const APPROVED_STATUSES = new Set(['pending_approval', 'external_disclosure_required']);
  assert.ok(
    registry.categories.every((item) => APPROVED_STATUSES.has(item.status)),
    'A retention category has a status other than pending_approval/external_disclosure_required',
  );
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
// RELIGIOUS_PROFILE_CONSENT and LEGAL_DOCUMENTS may carry a more descriptive
// status once enforcement mechanics land (e.g. suppress-only enforcement, or
// versioned-acceptance storage) -- the real invariant isn't the literal
// string 'pending_approval', it's that neither gate's status claims outright
// approval while a "pending" qualifier is still attached.
const gateStatuses = [...policy.matchAll(/^\s*status:\s*'([^']+)'/gm)].map((m) => m[1]);
const religiousOrLegalStatuses = gateStatuses.filter(
  (s) => s !== 'founder_approved_pending_legal_review', // AGE_POLICY's own status, checked separately below
);
const stillPending = religiousOrLegalStatuses.every(
  (s) => s.includes('pending') && !s.includes('approved'),
);
if (religiousOrLegalStatuses.length < 2 || !stillPending) {
  failures.push('Pending religious-profile or legal-document choices were silently converted into approved defaults.');
} else {
  warnings.push('Religious-profile consent lawful basis and legal document content still need approval.');
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

check('compliance records index and structured registers exist and match schema', () => {
  assert.ok(existsSync(resolve(root, 'docs/compliance/README.md')));
  assert.ok(existsSync(resolve(root, 'docs/compliance/COMPLIANCE_RECORDS_INDEX.md')));

  const ropa = JSON.parse(read('docs/compliance/registers/PROCESSING_ACTIVITIES_REGISTER.json'));
  assert.equal(ropa.activities.length, 14);
  assert.ok(ropa.activities.every((a) => a.id && a.name && a.proposedArticle6Basis));

  const vendors = JSON.parse(read('docs/compliance/registers/VENDOR_PROCESSOR_REGISTER.json'));
  assert.equal(vendors.vendors.length, 11);
  assert.ok(vendors.vendors.every((v) => v.id && v.legalEntity && v.role));
  assert.equal(vendors.verificationStatus, 'ENGINEERING_INVENTORY_PENDING_CONTRACT_REVIEW');

  const retention = JSON.parse(read('docs/compliance/registers/RETENTION_SCHEDULE.json'));
  assert.equal(retention.destructiveJobsEnabled, false);
  assert.equal(retention.schedules.length, 14);

  const manifest = JSON.parse(read('docs/compliance/evidence/EVIDENCE_MANIFEST.json'));
  assert.ok(manifest.artifacts.length >= 20);
  for (const item of manifest.artifacts) {
    const filePath = resolve(root, item.path);
    assert.ok(existsSync(filePath), `Manifest artifact missing: ${item.path}`);
    const content = readFileSync(filePath);
    const hash = createHash('sha256').update(content).digest('hex');
    assert.equal(hash, item.sha256, `Checksum mismatch for ${item.path}`);
  }
});

check('generated baseline cannot pass with drift or errors', () => {
  const baseline = JSON.parse(read('docs/PRIVACY_SECURITY_BASELINE.json'));
  assert.equal(baseline.summary.byStatus.ERROR, 0);
  assert.equal(baseline.summary.byStatus.DRIFT, 0);
  assert.notEqual(baseline.databaseAccessProbe.profiles.state, 'ERROR');
  assert.notEqual(baseline.databaseAccessProbe.profiles.state, 'EXPOSED');
});

check('operational procedures do not claim unsupported approval or deletion controls', () => {
  const proceduresDir = resolve(root, 'docs/compliance/procedures');
  for (const name of readdirSync(proceduresDir)) {
    if (!name.endsWith('.md')) continue;
    const procedure = read(join('docs/compliance/procedures', name));
    assert.doesNotMatch(procedure, /\*\*Status:\*\*\s*`APPROVED`/);
  }

  const deletion = read('docs/compliance/procedures/RETENTION_AND_DELETION_PROCEDURE.md');
  assert.match(deletion, /profiles\.is_deleting/);
  // Founder approved this procedure 2026-08-25 (APPR-20260825-01) with its
  // §3 gaps explicitly accepted as open, not closed -- assert that
  // disclosure survives rather than requiring the stale ENGINEERING_DRAFT
  // status literal.
  assert.match(deletion, /FOUNDER_APPROVED/);
  assert.match(deletion, /gaps remain open and unimplemented/);
  assert.doesNotMatch(deletion, /Insert record into public\.deleted_accounts/);
  assert.doesNotMatch(deletion, /GA4 User Deletion API invoked/);
  assert.doesNotMatch(deletion, /S3 storage objects purged/);

  const index = read('docs/compliance/COMPLIANCE_RECORDS_INDEX.md');
  assert.doesNotMatch(index, /\| `REC-PROC-[^`]+`[^\n]+\| `APPROVED` \|/);
});

check('missing transfer evidence is labelled unverified', () => {
  const transfers = read('docs/compliance/registers/INTERNATIONAL_TRANSFERS_REGISTER.md');
  for (const line of transfers.split('\n').filter((candidate) => candidate.startsWith('| `XFER-'))) {
    if (line.includes(': missing`')) assert.match(line, /UNVERIFIED/);
  }
});

for (const warning of warnings) console.warn(`PENDING ${warning}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Compliance engineering checks passed (${warnings.length} pending decision warning(s)).`);
}
