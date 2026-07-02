import fs from 'fs';
import path from 'path';

const MANIFESTS_DIR = path.join(process.cwd(), 'python/ai_pipeline/corpus/manifests');
const VALID_RIGHTS = new Set([
  'public_domain',
  'rights_cleared',
  'companion_only',
  'catalog_only',
  'restricted_or_pending',
]);

type ManifestEntry = {
  ref?: unknown;
  kanda?: unknown;
  sarga?: unknown;
  shloka?: unknown;
  sanskrit?: unknown;
  translation?: unknown;
  sanskrit_source?: unknown;
  translation_source?: unknown;
  source_url?: unknown;
  rights_status?: unknown;
  review_status?: unknown;
  source_class?: unknown;
  is_pramana_grade?: unknown;
  original_text_status?: unknown;
  translation_status?: unknown;
  activation_status?: unknown;
};

type RamayanaManifest = {
  doc_id?: unknown;
  source_class?: unknown;
  rights_status?: unknown;
  review_status?: unknown;
  is_pramana_grade?: unknown;
  is_live_in_app?: unknown;
  activation_status?: unknown;
  original_text_status?: unknown;
  translation_status?: unknown;
  audio_status?: unknown;
  content?: unknown;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isTrue(value: unknown): boolean {
  return value === true;
}

function isVerifiedPramanaManifest(data: RamayanaManifest): boolean {
  return isTrue(data.is_pramana_grade);
}

function validatePendingEntry(fileName: string, entry: ManifestEntry, index: number): boolean {
  let valid = true;
  const ref = asString(entry.ref);
  const sanskrit = asString(entry.sanskrit);
  const translation = asString(entry.translation);
  const transliteration = asString((entry as { transliteration?: unknown }).transliteration);

  if (!/^\d+\.\d+\.\d+$/.test(ref)) {
    console.error(`[${fileName}] FAILED: pending entry ${index} has invalid canonical ref "${ref}"`);
    valid = false;
  }
  if (!entry.kanda || !entry.sarga || !entry.shloka) {
    console.error(`[${fileName}] FAILED: pending entry ${index} missing kanda/sarga/shloka`);
    valid = false;
  }
  if (!sanskrit || !translation || !transliteration) {
    console.error(`[${fileName}] FAILED: pending entry ${index} missing Sanskrit, transliteration, or translation draft`);
    valid = false;
  }
  if (sanskrit.endsWith('\\') || translation.endsWith('\\') || transliteration.endsWith('\\')) {
    console.error(`[${fileName}] FAILED: pending entry ${index} appears truncated`);
    valid = false;
  }
  if (entry.rights_status !== 'restricted_or_pending') {
    console.error(`[${fileName}] FAILED: pending entry ${index} must use rights_status=restricted_or_pending`);
    valid = false;
  }
  if (entry.review_status === 'verified' || entry.is_pramana_grade === true) {
    console.error(`[${fileName}] FAILED: pending entry ${index} must not claim verified Pramana status`);
    valid = false;
  }

  return valid;
}

function validatePendingManifest(fileName: string, data: RamayanaManifest, entries: ManifestEntry[]): boolean {
  let valid = true;
  const seenRefs = new Set<string>();
  const seenSanskrit = new Map<string, string>();
  const seenTranslation = new Map<string, string>();

  if (data.review_status === 'verified') {
    console.error(`[${fileName}] FAILED: pending Ramayana manifests must not claim review_status=verified`);
    valid = false;
  }
  if (data.rights_status === 'public_domain' || data.rights_status === 'rights_cleared') {
    console.error(`[${fileName}] FAILED: pending Ramayana manifests must not claim cleared rights`);
    valid = false;
  }
  if (isTrue(data.is_live_in_app) && data.activation_status !== 'explicit_only') {
    console.error(`[${fileName}] FAILED: pending Ramayana manifests can be live only with activation_status=explicit_only`);
    valid = false;
  }
  if (data.source_class !== 'curated_lesson') {
    console.error(`[${fileName}] FAILED: source-audit pending Ramayana manifests must use source_class=curated_lesson`);
    valid = false;
  }

  for (const [index, entry] of entries.entries()) {
    valid = validatePendingEntry(fileName, entry, index) && valid;
    const ref = asString(entry.ref);
    const sanskrit = asString(entry.sanskrit);
    const translation = asString(entry.translation);

    if (seenRefs.has(ref)) {
      console.error(`[${fileName}] FAILED: duplicate pending ref ${ref}`);
      valid = false;
    }
    seenRefs.add(ref);

    const priorSanskritRef = seenSanskrit.get(sanskrit);
    if (sanskrit && priorSanskritRef && priorSanskritRef !== ref) {
      console.error(`[${fileName}] FAILED: identical pending Sanskrit reused for ${priorSanskritRef} and ${ref}`);
      valid = false;
    }
    if (sanskrit) seenSanskrit.set(sanskrit, ref);

    const priorTranslationRef = seenTranslation.get(translation);
    if (translation && priorTranslationRef && priorTranslationRef !== ref) {
      console.error(`[${fileName}] FAILED: identical pending translation reused for ${priorTranslationRef} and ${ref}`);
      valid = false;
    }
    if (translation) seenTranslation.set(translation, ref);
  }

  return valid;
}

function validateLegacyScratchManifest(fileName: string, data: RamayanaManifest): boolean {
  let valid = true;

  if (data.review_status === 'verified') {
    console.error(`[${fileName}] FAILED: legacy Ramayana manifests must not claim review_status=verified`);
    valid = false;
  }
  if (data.rights_status === 'public_domain' || data.rights_status === 'rights_cleared') {
    console.error(`[${fileName}] FAILED: legacy Ramayana manifests must not claim cleared rights`);
    valid = false;
  }
  if (isTrue(data.is_pramana_grade)) {
    console.error(`[${fileName}] FAILED: legacy Ramayana manifests must not claim Pramana-grade status`);
    valid = false;
  }
  if (isTrue(data.is_live_in_app)) {
    console.error(`[${fileName}] FAILED: legacy Ramayana manifests must not be live in app`);
    valid = false;
  }

  return valid;
}

function validateVerifiedManifest(fileName: string, data: RamayanaManifest, entries: ManifestEntry[]): boolean {
  let valid = true;
  const seenRefs = new Set<string>();
  const seenSanskrit = new Map<string, string>();
  const seenTranslation = new Map<string, string>();
  const rightsStatus = asString(data.rights_status);

  if (!VALID_RIGHTS.has(rightsStatus)) {
    console.error(`[${fileName}] FAILED: invalid or missing root rights_status`);
    valid = false;
  }
  if (rightsStatus !== 'public_domain' && rightsStatus !== 'rights_cleared') {
    console.error(`[${fileName}] FAILED: verified Pramana manifest requires cleared root rights_status`);
    valid = false;
  }
  if (data.review_status !== 'verified') {
    console.error(`[${fileName}] FAILED: is_pramana_grade=true requires review_status=verified`);
    valid = false;
  }
  if (data.is_live_in_app !== true) {
    console.error(`[${fileName}] FAILED: verified Pramana manifest must declare is_live_in_app=true explicitly`);
    valid = false;
  }

  for (const [index, entry] of entries.entries()) {
    const ref = asString(entry.ref);
    const sanskrit = asString(entry.sanskrit);
    const translation = asString(entry.translation);

    if (!/^\d+\.\d+\.\d+$/.test(ref)) {
      console.error(`[${fileName}] FAILED: entry ${index} has invalid canonical ref "${ref}"`);
      valid = false;
    }
    if (!entry.kanda || !entry.sarga || !entry.shloka) {
      console.error(`[${fileName}] FAILED: entry ${index} missing kanda/sarga/shloka`);
      valid = false;
    }
    if (!sanskrit || !translation) {
      console.error(`[${fileName}] FAILED: entry ${index} missing Sanskrit or translation`);
      valid = false;
    }
    if (!entry.sanskrit_source || !entry.translation_source) {
      console.error(`[${fileName}] FAILED: entry ${index} missing source attribution`);
      valid = false;
    }
    if (!entry.source_url) {
      console.error(`[${fileName}] FAILED: entry ${index} missing source_url`);
      valid = false;
    }
    if (entry.rights_status !== 'public_domain' && entry.rights_status !== 'rights_cleared') {
      console.error(`[${fileName}] FAILED: entry ${index} missing cleared rights_status`);
      valid = false;
    }
    if (entry.review_status !== 'verified' || entry.is_pramana_grade !== true) {
      console.error(`[${fileName}] FAILED: entry ${index} is not individually verified Pramana-grade`);
      valid = false;
    }

    if (seenRefs.has(ref)) {
      console.error(`[${fileName}] FAILED: duplicate ref ${ref}`);
      valid = false;
    }
    seenRefs.add(ref);

    const priorSanskritRef = seenSanskrit.get(sanskrit);
    if (sanskrit && priorSanskritRef && priorSanskritRef !== ref) {
      console.error(`[${fileName}] FAILED: identical Sanskrit reused for ${priorSanskritRef} and ${ref}`);
      valid = false;
    }
    if (sanskrit) seenSanskrit.set(sanskrit, ref);

    const priorTranslationRef = seenTranslation.get(translation);
    if (translation && priorTranslationRef && priorTranslationRef !== ref) {
      console.error(`[${fileName}] FAILED: identical translation reused for ${priorTranslationRef} and ${ref}`);
      valid = false;
    }
    if (translation) seenTranslation.set(translation, ref);
  }

  return valid;
}

function validateManifest(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RamayanaManifest;
  const entries = Array.isArray(data.content) ? data.content as ManifestEntry[] : [];
  const docId = asString(data.doc_id);
  const isValmikiCanonicalLane = fileName.startsWith('valmiki_ramayana_') || docId.startsWith('valmiki_ramayana');

  if (!VALID_RIGHTS.has(asString(data.rights_status))) {
    console.error(`[${fileName}] FAILED: invalid or missing rights_status`);
    return false;
  }

  if (isVerifiedPramanaManifest(data)) {
    return validateVerifiedManifest(fileName, data, entries);
  }

  if (isValmikiCanonicalLane) {
    return validatePendingManifest(fileName, data, entries);
  }

  return validateLegacyScratchManifest(fileName, data);
}

function main() {
  if (!fs.existsSync(MANIFESTS_DIR)) {
    console.log('Manifests directory not found. Nothing to validate.');
    return;
  }

  const files = fs.readdirSync(MANIFESTS_DIR)
    .filter((file) =>
      (file.startsWith('valmiki_ramayana_') || file.startsWith('ramayana_')) &&
      file.endsWith('.json')
    )
    .sort();

  if (files.length === 0) {
    console.log('No Ramayana manifests found to validate.');
    return;
  }

  let allValid = true;
  for (const file of files) {
    if (!validateManifest(path.join(MANIFESTS_DIR, file))) {
      allValid = false;
    }
  }

  if (!allValid) {
    console.error('\nRamayana source validation failed.');
    process.exit(1);
  }

  console.log('\nRamayana source validation passed.');
}

main();
