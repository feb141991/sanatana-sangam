/**
 * Reproducible privacy/security engineering inventory.
 *
 * This script discovers evidence from both repositories and runs aggregate-only
 * Supabase access probes. It intentionally does not make legal conclusions.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

config({ path: ".env.local" });

export type FindingStatus =
  | "VERIFIED"
  | "NOT_FOUND"
  | "DRIFT"
  | "NEEDS_POLICY_DECISION"
  | "UNKNOWN"
  | "ERROR";

export type AccessProbeState = "EXPOSED" | "SECURED" | "UNKNOWN" | "ERROR";
type RepositoryName = "backend" | "native";

interface SourceFile {
  repository: RepositoryName;
  relativePath: string;
  content: string;
}

interface Evidence {
  repository: RepositoryName;
  file: string;
  line: number;
  marker: string;
}

interface InventoryItem {
  id: string;
  category: string;
  name: string;
  status: FindingStatus;
  canonicalOwnership: "backend" | "native" | "shared_contract";
  description: string;
  evidence: Evidence[];
  decisionGate?: string;
}

interface TableProbe {
  state: "OK" | "NOT_FOUND" | "PERMISSION_DENIED" | "UNKNOWN" | "ERROR";
  count: number | null;
  code: string | null;
}

interface ProfileColumn {
  name: string;
  type: string;
  classification: "public_candidate" | "sensitive_candidate" | "internal_candidate" | "unclassified";
}

interface ProviderDiscovery {
  provider: string;
  evidence: Evidence[];
}

interface BaselineReport {
  schemaVersion: 2;
  sourceFingerprint: string;
  environment: {
    supabaseHost: string | null;
    anonProbeAvailable: boolean;
    aggregateAdminProbeAvailable: boolean;
  };
  summary: {
    totalItems: number;
    byStatus: Record<FindingStatus, number>;
    scannedFiles: Record<RepositoryName, number>;
    discoveredStorageKeys: Record<RepositoryName, number>;
    discoveredProviders: number;
  };
  databaseAccessProbe: {
    profiles: {
      state: AccessProbeState;
      anonymousCount: number | null;
      administrativeCount: number | null;
      errorCode: string | null;
      explanation: string;
    };
    tableCounts: Record<string, TableProbe>;
    limitation: string;
  };
  discoveries: {
    profileColumns: ProfileColumn[];
    profilePaths: Evidence[];
    storageKeys: Record<RepositoryName, Array<{ key: string; evidence: Evidence[] }>>;
    providers: ProviderDiscovery[];
    dobAndLocationPaths: Evidence[];
    termsAndConsentPaths: Evidence[];
    ugcSafetyPaths: Evidence[];
    deletionAndExportPaths: Evidence[];
  };
  inventory: InventoryItem[];
}

const TEXT_EXTENSIONS = new Set([
  ".cjs", ".gradle", ".js", ".json", ".jsx", ".md", ".mjs", ".plist",
  ".properties", ".sql", ".toml", ".ts", ".tsx", ".xcprivacy", ".yaml", ".yml",
]);

const IGNORED_DIRECTORIES = new Set([
  ".git", ".next", ".expo", ".turbo", "Pods", "build", "coverage", "dist",
  "graphify-out", "node_modules",
]);

const GENERATED_OUTPUTS = new Set([
  "docs/PRIVACY_SECURITY_BASELINE.json",
  "docs/PRIVACY_SECURITY_BASELINE.md",
]);

const SENSITIVE_PROFILE_FIELD = /(?:date_of_birth|birth|latitude|longitude|tradition|sampradaya|gotra|devata|gender|ban_reason|onesignal|unsubscribe|deletion|consent|timezone|home_|neighbourhood)/i;
const INTERNAL_PROFILE_FIELD = /(?:is_admin|is_banned|subscription|entitlement|karma|seva|streak|reminder|notification|is_deleting)/i;
const PUBLIC_PROFILE_FIELD = /^(?:username|avatar_url|bio)$/;

const PROVIDERS: Array<{ provider: string; patterns: RegExp[] }> = [
  { provider: "Supabase", patterns: [/@supabase\//, /createClient\(/] },
  { provider: "Google Analytics 4", patterns: [/googletagmanager\.com\/gtag/, /G-[A-Z0-9]{6,}/] },
  { provider: "Google AdSense", patterns: [/pagead2\.googlesyndication\.com/, /ca-pub-/] },
  { provider: "OneSignal", patterns: [/OneSignalSDK/, /onesignal/i] },
  { provider: "Firebase Analytics", patterns: [/@react-native-firebase\/analytics/, /setAnalyticsCollectionEnabled/] },
  { provider: "Expo Notifications", patterns: [/expo-notifications/, /getExpoPushTokenAsync/] },
  { provider: "Razorpay", patterns: [/razorpay/i] },
  { provider: "Twilio", patterns: [/twilio/i] },
  { provider: "Sarvam AI", patterns: [/sarvam/i] },
  { provider: "Vercel Analytics", patterns: [/@vercel\/analytics/] },
  { provider: "Vercel Speed Insights", patterns: [/@vercel\/speed-insights/] },
];

function walk(root: string, repository: RepositoryName, current = root): SourceFile[] {
  if (!fs.existsSync(current)) return [];
  const entries = fs.readdirSync(current, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));
  const files: SourceFile[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(root, repository, absolute));
      continue;
    }
    if (!entry.isFile() || !TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;
    const relativePath = path.relative(root, absolute).split(path.sep).join("/");
    if (GENERATED_OUTPUTS.has(relativePath)) continue;
    if (fs.statSync(absolute).size > 2_000_000) continue;
    files.push({
      repository,
      relativePath,
      content: fs.readFileSync(absolute, "utf8"),
    });
  }
  return files;
}

function evidenceFor(files: SourceFile[], patterns: RegExp[], limit = 200): Evidence[] {
  const evidence: Evidence[] = [];
  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    for (let index = 0; index < lines.length && evidence.length < limit; index += 1) {
      const pattern = patterns.find((candidate) => {
        candidate.lastIndex = 0;
        return candidate.test(lines[index]);
      });
      if (!pattern) continue;
      evidence.push({ repository: file.repository, file: file.relativePath, line: index + 1, marker: pattern.source });
    }
  }
  return evidence;
}

function uniqueEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    const key = `${item.repository}:${item.file}:${item.line}:${item.marker}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function discoverStorageKeys(files: SourceFile[]): Record<RepositoryName, Array<{ key: string; evidence: Evidence[] }>> {
  const byRepository: Record<RepositoryName, Map<string, Evidence[]>> = { backend: new Map(), native: new Map() };
  const patterns = [
    /(?:localStorage|sessionStorage|AsyncStorage)\.(?:getItem|setItem|removeItem|mergeItem)\(\s*(["'`])([^"'`]+)\1/g,
    /(?:const|let)\s+[A-Z][A-Z0-9_]*(?:KEY|CACHE)[A-Z0-9_]*\s*=\s*(["'`])([^"'`]+)\1/g,
  ];
  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          const key = match[2];
          if (!key || key.includes("${")) continue;
          const existing = byRepository[file.repository].get(key) ?? [];
          existing.push({ repository: file.repository, file: file.relativePath, line: index + 1, marker: "storage_key" });
          byRepository[file.repository].set(key, existing);
        }
      }
    });
  }
  return {
    backend: [...byRepository.backend.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, evidence]) => ({ key, evidence })),
    native: [...byRepository.native.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, evidence]) => ({ key, evidence })),
  };
}

export function classifyAccessProbe(input: {
  adminCount: number | null;
  anonCount: number | null;
  anonError: Pick<PostgrestError, "code" | "message"> | null;
  anonCredentialsAvailable: boolean;
}): { state: AccessProbeState; errorCode: string | null; explanation: string } {
  if (!input.anonCredentialsAvailable) {
    return { state: "UNKNOWN", errorCode: null, explanation: "Anonymous credentials were unavailable; no security conclusion was made." };
  }
  if (input.anonError) {
    if (input.anonError.code === "42501" || /permission denied/i.test(input.anonError.message)) {
      return { state: "SECURED", errorCode: input.anonError.code, explanation: "The anonymous role was explicitly denied access." };
    }
    return { state: "ERROR", errorCode: input.anonError.code || null, explanation: "The anonymous probe failed for a reason other than an explicit permission denial." };
  }
  if ((input.anonCount ?? 0) > 0) {
    return { state: "EXPOSED", errorCode: null, explanation: "An unauthenticated query could count rows while selecting sensitive columns." };
  }
  if ((input.adminCount ?? 0) > 0 && input.anonCount === 0) {
    return { state: "SECURED", errorCode: null, explanation: "Rows exist, but the anonymous role could not observe any of them." };
  }
  return { state: "UNKNOWN", errorCode: null, explanation: "An empty or unavailable table cannot prove whether anonymous access is securely denied." };
}

export function classifyTableProbe(count: number | null, error: Pick<PostgrestError, "code" | "message"> | null, available: boolean): TableProbe {
  if (!available) return { state: "UNKNOWN", count: null, code: null };
  if (!error) return { state: "OK", count, code: null };
  if (error.code === "42P01" || /does not exist|schema cache/i.test(error.message)) return { state: "NOT_FOUND", count: null, code: error.code || null };
  if (error.code === "42501" || /permission denied/i.test(error.message)) return { state: "PERMISSION_DENIED", count: null, code: error.code || null };
  return { state: "ERROR", count: null, code: error.code || null };
}

export function extractProfileColumns(databaseTypes: string): ProfileColumn[] {
  const tableStart = databaseTypes.indexOf("      profiles: {");
  if (tableStart < 0) return [];
  const rowStart = databaseTypes.indexOf("        Row: {", tableStart);
  const insertStart = databaseTypes.indexOf("        Insert:", rowStart);
  if (rowStart < 0 || insertStart < 0) return [];
  const columns: ProfileColumn[] = [];
  for (const line of databaseTypes.slice(rowStart, insertStart).split(/\r?\n/)) {
    const match = line.match(/^\s{10}([a-zA-Z0-9_]+)(?:\?)?:\s*(.+);$/);
    if (!match) continue;
    const name = match[1];
    const classification: ProfileColumn["classification"] = PUBLIC_PROFILE_FIELD.test(name)
      ? "public_candidate"
      : SENSITIVE_PROFILE_FIELD.test(name)
        ? "sensitive_candidate"
        : INTERNAL_PROFILE_FIELD.test(name)
          ? "internal_candidate"
          : "unclassified";
    columns.push({ name, type: match[2], classification });
  }
  return columns.sort((left, right) => left.name.localeCompare(right.name));
}

async function probeDatabase(supabaseUrl: string, anonKey: string, serviceKey: string) {
  const anonAvailable = Boolean(supabaseUrl && anonKey);
  const adminAvailable = Boolean(supabaseUrl && serviceKey);
  const adminClient = adminAvailable ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }) : null;
  const anonClient = anonAvailable ? createClient(supabaseUrl, anonKey, { auth: { persistSession: false } }) : null;
  let adminProfilesCount: number | null = null;
  if (adminClient) {
    const result = await adminClient.from("profiles").select("id", { count: "exact", head: true });
    if (!result.error) adminProfilesCount = result.count;
  }
  let anonCount: number | null = null;
  let anonError: PostgrestError | null = null;
  if (anonClient) {
    const result = await anonClient.from("profiles").select("id,date_of_birth,tradition,sampradaya,gotra,home_latitude,home_longitude", { count: "exact", head: true });
    anonCount = result.count;
    anonError = result.error;
  }
  const access = classifyAccessProbe({ adminCount: adminProfilesCount, anonCount, anonError, anonCredentialsAvailable: anonAvailable });
  const tables = [
    "profiles", "birth_profiles", "posts", "post_comments", "content_reports",
    "user_blocked_profiles", "user_muted_profiles", "user_hidden_content",
    "deleted_accounts", "golden_fixtures", "calendar_governance_diagnostics_cache",
    "user_settings", "consent_records", "terms_acceptances",
  ];
  const tableCounts: Record<string, TableProbe> = {};
  for (const table of tables) {
    if (!adminClient) {
      tableCounts[table] = classifyTableProbe(null, null, false);
      continue;
    }
    const result = await adminClient.from(table).select("*", { count: "exact", head: true });
    tableCounts[table] = classifyTableProbe(result.count, result.error, true);
  }
  return {
    profiles: {
      state: access.state,
      anonymousCount: anonCount,
      administrativeCount: adminProfilesCount,
      errorCode: access.errorCode,
      explanation: access.explanation,
    },
    tableCounts,
  };
}

function statusFromEvidence(evidence: Evidence[]): FindingStatus {
  return evidence.length > 0 ? "VERIFIED" : "NOT_FOUND";
}

function buildInventory(input: { files: SourceFile[]; profilesState: AccessProbeState; discoveries: BaselineReport["discoveries"] }): InventoryItem[] {
  const webTrackerEvidence = evidenceFor(input.files, [/googletagmanager\.com\/gtag/, /pagead2\.googlesyndication\.com/, /OneSignalSDK/]);
  const analyticsConsentEvidence = evidenceFor(input.files, [/setAnalyticsCollectionEnabled/, /analytics.*consent|consent.*analytics/i]);
  const ageGateEvidence = evidenceFor(input.files, [/minimumAge|ageGate|parentalConsent|parental_consent/i]);
  const termsReceiptEvidence = evidenceFor(input.files, [/terms_version|termsVersion|terms_acceptances|accepted_at/i]);
  const religiousConsentEvidence = evidenceFor(input.files, [/consent_religious_data/]);
  const supportEvidence = evidenceFor(input.files, [/support@shoonaya|\/support|contact.*support/i]);
  const guestRetentionEvidence = evidenceFor(input.files, [/birth_profiles.*delete|delete.*birth_profiles|guest.*retention|retention.*guest/i]);
  return [
    {
      id: "INV-PROF-01", category: "Sensitive profile access", name: "Anonymous profiles access probe",
      status: input.profilesState === "EXPOSED" ? "DRIFT" : input.profilesState === "SECURED" ? "VERIFIED" : input.profilesState,
      canonicalOwnership: "backend", description: `Aggregate anonymous access probe result: ${input.profilesState}.`,
      evidence: input.discoveries.profilePaths.slice(0, 20),
    },
    {
      id: "INV-PROF-02", category: "Sensitive profile access", name: "Profile read and write paths",
      status: statusFromEvidence(input.discoveries.profilePaths), canonicalOwnership: "shared_contract",
      description: `${input.discoveries.profilePaths.length} source locations reference profile data paths.`, evidence: input.discoveries.profilePaths.slice(0, 30),
    },
    {
      id: "INV-SDK-01", category: "Third-party SDKs and trackers", name: "Web tracker initialization",
      status: webTrackerEvidence.length > 0 ? "DRIFT" : "VERIFIED", canonicalOwnership: "backend",
      description: `${webTrackerEvidence.length} source locations initialize or configure GA4, AdSense or OneSignal. Consent enforcement requires separate verification.`, evidence: webTrackerEvidence.slice(0, 30),
    },
    {
      id: "INV-SDK-02", category: "Third-party SDKs and trackers", name: "Native analytics consent control",
      status: analyticsConsentEvidence.length > 0 ? "VERIFIED" : "DRIFT", canonicalOwnership: "native",
      description: "Checks whether analytics collection and an analytics consent path both exist; event ordering still requires focused tests.", evidence: analyticsConsentEvidence.slice(0, 30),
    },
    {
      id: "INV-CACHE-01", category: "Client storage and identity", name: "Discovered browser and native storage keys",
      status: (input.discoveries.storageKeys.backend.length + input.discoveries.storageKeys.native.length) > 0 ? "VERIFIED" : "NOT_FOUND", canonicalOwnership: "shared_contract",
      description: `${input.discoveries.storageKeys.backend.length} backend/PWA and ${input.discoveries.storageKeys.native.length} Native literal storage keys were discovered. Dynamic keys require manual review.`,
      evidence: [...input.discoveries.storageKeys.backend, ...input.discoveries.storageKeys.native].flatMap((entry) => entry.evidence).slice(0, 30),
    },
    {
      id: "INV-AGE-01", category: "DOB, birth and location", name: "Centralized age-policy enforcement",
      status: ageGateEvidence.length > 0 ? "VERIFIED" : "NEEDS_POLICY_DECISION", canonicalOwnership: "backend",
      description: `${input.discoveries.dobAndLocationPaths.length} DOB/location source locations were discovered. Threshold and parental-consent semantics require approved policy.`,
      evidence: [...ageGateEvidence, ...input.discoveries.dobAndLocationPaths].slice(0, 30),
      decisionGate: ageGateEvidence.length > 0 ? undefined : "Approve markets, age thresholds and parental-consent behavior before enforcement.",
    },
    {
      id: "INV-TERMS-01", category: "Terms and consent", name: "Versioned Terms acceptance receipts",
      status: termsReceiptEvidence.length > 0 ? "VERIFIED" : "DRIFT", canonicalOwnership: "backend",
      description: "Checks for a durable Terms version and acceptance timestamp contract.", evidence: termsReceiptEvidence.slice(0, 30),
    },
    {
      id: "INV-CONSENT-01", category: "Terms and consent", name: "Religious-profile consent",
      status: religiousConsentEvidence.length > 0 ? "NEEDS_POLICY_DECISION" : "NOT_FOUND", canonicalOwnership: "shared_contract",
      description: "A consent field exists, but enforcement, historical state and withdrawal semantics require contract review.", evidence: religiousConsentEvidence.slice(0, 30),
      decisionGate: "Approve covered fields, decline behavior, withdrawal behavior and consent version before implementation.",
    },
    {
      id: "INV-UGC-01", category: "UGC safety", name: "Mandali safety paths", status: statusFromEvidence(input.discoveries.ugcSafetyPaths),
      canonicalOwnership: "backend", description: `${input.discoveries.ugcSafetyPaths.length} report/block/mute/hide/moderation source locations were discovered.`, evidence: input.discoveries.ugcSafetyPaths.slice(0, 30),
    },
    {
      id: "INV-UGC-02", category: "UGC safety", name: "Published support path", status: supportEvidence.length > 0 ? "VERIFIED" : "NEEDS_POLICY_DECISION",
      canonicalOwnership: "shared_contract", description: "Checks for a user-visible support/contact path; operational response ownership still requires confirmation.", evidence: supportEvidence.slice(0, 30),
      decisionGate: supportEvidence.length > 0 ? undefined : "Approve the published support contact and response owner.",
    },
    {
      id: "INV-LIFE-01", category: "Data lifecycle", name: "Account deletion and export paths", status: statusFromEvidence(input.discoveries.deletionAndExportPaths),
      canonicalOwnership: "backend", description: `${input.discoveries.deletionAndExportPaths.length} deletion/export source locations were discovered. Completeness requires cascade tests.`, evidence: input.discoveries.deletionAndExportPaths.slice(0, 30),
    },
    {
      id: "INV-LIFE-02", category: "Data lifecycle", name: "Guest birth-profile retention", status: guestRetentionEvidence.length > 0 ? "VERIFIED" : "NEEDS_POLICY_DECISION",
      canonicalOwnership: "backend", description: "Checks for an implemented guest birth-profile retention path.", evidence: guestRetentionEvidence.slice(0, 30),
      decisionGate: guestRetentionEvidence.length > 0 ? undefined : "Approve retention period and deletion exceptions before implementing cleanup.",
    },
  ];
}

function buildFingerprint(files: SourceFile[], profileColumns: ProfileColumn[]): string {
  const hash = createHash("sha256");
  for (const file of files) hash.update(`${file.repository}\0${file.relativePath}\0${file.content}\0`);
  hash.update(JSON.stringify(profileColumns));
  return hash.digest("hex");
}

function renderMarkdown(report: BaselineReport): string {
  return [
    "# Machine-Generated Privacy and Security Engineering Baseline", "",
    `**Schema version:** ${report.schemaVersion}`,
    `**Source fingerprint:** \`${report.sourceFingerprint}\``, "",
    "> This is an engineering evidence inventory, not legal advice. UNKNOWN and",
    "> ERROR states are never equivalent to a secure or compliant result.", "",
    "## Summary", "",
    `- Inventory checks: ${report.summary.totalItems}`,
    `- Scanned files: backend ${report.summary.scannedFiles.backend}, Native ${report.summary.scannedFiles.native}`,
    `- Literal storage keys: backend ${report.summary.discoveredStorageKeys.backend}, Native ${report.summary.discoveredStorageKeys.native}`,
    `- Providers/SDKs discovered: ${report.summary.discoveredProviders}`,
    ...Object.entries(report.summary.byStatus).map(([status, count]) => `- ${status}: ${count}`), "",
    "## Database Access Probe", "",
    `- Profiles state: **${report.databaseAccessProbe.profiles.state}**`,
    `- Anonymous row count: ${report.databaseAccessProbe.profiles.anonymousCount ?? "unavailable"}`,
    `- Administrative row count: ${report.databaseAccessProbe.profiles.administrativeCount ?? "unavailable"}`,
    `- Explanation: ${report.databaseAccessProbe.profiles.explanation}`,
    `- Limitation: ${report.databaseAccessProbe.limitation}`, "",
    "## Inventory Checks", "",
    "| ID | Status | Category | Check | Evidence |", "|---|---|---|---|---:|",
    ...report.inventory.map((item) => `| ${item.id} | ${item.status} | ${item.category} | ${item.name} | ${item.evidence.length} |`), "",
    "## Profile Contract", "", `Generated types expose ${report.discoveries.profileColumns.length} profile columns:`, "",
    "| Column | Type | Engineering classification |", "|---|---|---|",
    ...report.discoveries.profileColumns.map((column) => `| \`${column.name}\` | \`${column.type.replace(/\|/g, "\\|")}\` | ${column.classification} |`), "",
    "## Providers And SDKs", "",
    ...report.discoveries.providers.map((provider) => `- ${provider.provider}: ${provider.evidence.length} evidence locations`), "",
    "## Decision Gates", "",
    ...report.inventory.filter((item) => item.decisionGate).map((item) => `- ${item.id}: ${item.decisionGate}`), "",
    "## Reproduction", "", "```bash", "npm run baseline:privacy", "npm run test:baseline:privacy", "```", "",
  ].join("\n");
}

export async function generateBaseline(options?: { webRoot?: string; nativeRoot?: string; write?: boolean }): Promise<BaselineReport> {
  const webRoot = options?.webRoot ?? process.cwd();
  const nativeRoot = options?.nativeRoot ?? process.env.SHOONAYA_NATIVE_ROOT ?? path.resolve(webRoot, "..", "..", "shoonaya-mobile");
  const backendFiles = walk(webRoot, "backend");
  const nativeFiles = walk(nativeRoot, "native");
  const files = [...backendFiles, ...nativeFiles];
  const databaseTypesPath = path.join(webRoot, "src/types/database.ts");
  const profileColumns = fs.existsSync(databaseTypesPath) ? extractProfileColumns(fs.readFileSync(databaseTypesPath, "utf8")) : [];
  const storageKeys = discoverStorageKeys(files);
  const providers = PROVIDERS.map(({ provider, patterns }) => ({ provider, evidence: evidenceFor(files, patterns, 100) })).filter((entry) => entry.evidence.length > 0);
  const discoveries: BaselineReport["discoveries"] = {
    profileColumns,
    profilePaths: uniqueEvidence(evidenceFor(files, [/\.from\(["']profiles["']\)/, /\/api\/(?:profile|onboarding)/, /buildOnboardingProfilePayload/])),
    storageKeys,
    providers,
    dobAndLocationPaths: uniqueEvidence(evidenceFor(files, [/date_of_birth/, /birth_(?:lat|lng|time|place)/, /home_(?:latitude|longitude)/, /requestForegroundPermissionsAsync/])),
    termsAndConsentPaths: uniqueEvidence(evidenceFor(files, [/terms/i, /privacy/i, /consent_religious_data/])),
    ugcSafetyPaths: uniqueEvidence(evidenceFor(files, [/content_reports/, /user_blocked_profiles/, /user_muted_profiles/, /user_hidden_content/, /moderation/i])),
    deletionAndExportPaths: uniqueEvidence(evidenceFor(files, [/deletion_requested_at/, /purgeDueDeletedAccounts/, /\/api\/user\/export/, /deleteUser\(/])),
  };
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const databaseProbe = await probeDatabase(supabaseUrl, anonKey, serviceKey);
  const inventory = buildInventory({ files, profilesState: databaseProbe.profiles.state, discoveries });
  const statuses: FindingStatus[] = ["VERIFIED", "NOT_FOUND", "DRIFT", "NEEDS_POLICY_DECISION", "UNKNOWN", "ERROR"];
  const byStatus = Object.fromEntries(statuses.map((status) => [status, inventory.filter((item) => item.status === status).length])) as Record<FindingStatus, number>;
  const report: BaselineReport = {
    schemaVersion: 2,
    sourceFingerprint: buildFingerprint(files, profileColumns),
    environment: {
      supabaseHost: supabaseUrl ? new URL(supabaseUrl).host : null,
      anonProbeAvailable: Boolean(supabaseUrl && anonKey),
      aggregateAdminProbeAvailable: Boolean(supabaseUrl && serviceKey),
    },
    summary: {
      totalItems: inventory.length, byStatus,
      scannedFiles: { backend: backendFiles.length, native: nativeFiles.length },
      discoveredStorageKeys: { backend: storageKeys.backend.length, native: storageKeys.native.length },
      discoveredProviders: providers.length,
    },
    databaseAccessProbe: {
      ...databaseProbe,
      limitation: "The Data API probes verify effective anonymous access and aggregate counts. Exact live PostgreSQL grants, policy expressions, view security and RPC privileges require a separate metadata query through an approved database connection or Supabase MCP.",
    },
    discoveries, inventory,
  };
  if (options?.write !== false) {
    fs.writeFileSync(path.join(webRoot, "docs/PRIVACY_SECURITY_BASELINE.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(webRoot, "docs/PRIVACY_SECURITY_BASELINE.md"), renderMarkdown(report), "utf8");
  }
  return report;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  generateBaseline().then((report) => {
    console.log(JSON.stringify({ sourceFingerprint: report.sourceFingerprint, summary: report.summary, profilesAccess: report.databaseAccessProbe.profiles }, null, 2));
  }).catch((error: unknown) => {
    console.error(`[baseline] ${error instanceof Error ? error.message : "Unknown baseline failure"}`);
    process.exitCode = 1;
  });
}
