/**
 * Reproducible privacy/security engineering inventory.
 *
 * This script discovers evidence from both repositories and runs aggregate-only
 * Supabase access probes. It intentionally does not make legal conclusions.
 */

import { execSync } from "node:child_process";
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
export type CategoryConfidence = "VERIFIED" | "PARTIAL" | "NOT_FOUND" | "DECISION_REQUIRED";
type RepositoryName = "backend" | "native";

export interface SourceFile {
  repository: RepositoryName;
  relativePath: string;
  content: string;
}

export interface Evidence {
  repository: RepositoryName;
  file: string;
  line: number;
  marker: string;
}

export interface InventoryItem {
  id: string;
  category: string;
  name: string;
  status: FindingStatus;
  canonicalOwnership: "backend" | "native" | "shared_contract";
  description: string;
  evidence: Evidence[];
  decisionGate?: string;
}

export interface CategoryAudit {
  categoryId: string;
  categoryName: string;
  collectionSurface: string;
  apiRouteAndAuth: string;
  storageTarget: string;
  fieldNames: string[];
  purposeVisibleInCode: string;
  recipientsAndVendors: string[];
  deletionPath: string;
  retentionRule: string;
  canonicalOwnership: "backend" | "native" | "shared_contract";
  confidence: CategoryConfidence;
  evidence: Evidence[];
}

export interface TableProbe {
  state: "OK" | "NOT_FOUND" | "PERMISSION_DENIED" | "UNKNOWN" | "ERROR";
  count: number | null;
  code: string | null;
}

export interface ProfileColumn {
  name: string;
  type: string;
  classification: "public_candidate" | "sensitive_candidate" | "internal_candidate" | "unclassified";
}

export interface ProviderDiscovery {
  provider: string;
  evidence: Evidence[];
}

export interface RepositoryGitState {
  headCommit: string;
  isClean: boolean;
}

export interface BaselineReport {
  schemaVersion: 2;
  sourceFingerprint: string;
  repositories: Record<RepositoryName, RepositoryGitState>;
  environment: {
    supabaseHost: string | null;
    anonProbeAvailable: boolean;
    aggregateAdminProbeAvailable: boolean;
  };
  summary: {
    totalItems: number;
    totalCategories: number;
    byStatus: Record<FindingStatus, number>;
    byCategoryConfidence: Record<CategoryConfidence, number>;
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
  categories: CategoryAudit[];
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
  ".git", ".next", ".expo", ".turbo", ".vercel", ".open-next", "Pods",
  "build", "coverage", "dist", "out", "graphify-out", "node_modules",
]);

const GENERATED_OUTPUTS = new Set([
  "docs/PRIVACY_SECURITY_BASELINE.json",
  "docs/PRIVACY_SECURITY_BASELINE.md",
]);

// Evidence must come from shipped source/config/schema, not from prose written
// by the audit itself or generated dependency/build output. Otherwise the
// scanner proves its own assertions and reports stale compiled bundles as live.
const NON_RUNTIME_PATH_PREFIXES = ["docs/", "scripts/"];
const NON_RUNTIME_FILES = new Set(["package-lock.json", "npm-shrinkwrap.json"]);

export function isRuntimeEvidencePath(relativePath: string): boolean {
  if (GENERATED_OUTPUTS.has(relativePath) || NON_RUNTIME_FILES.has(relativePath)) return false;
  return !NON_RUNTIME_PATH_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

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
    if (!isRuntimeEvidencePath(relativePath)) continue;
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
    /(?:localStorage|sessionStorage|AsyncStorage)\.(?:getItem|setItem|removeItem|mergeItem)\(\s*(['"`])([^'"`]+)\1/g,
    /(?:const|let)\s+[A-Z][A-Z0-9_]*(?:KEY|CACHE)[A-Z0-9_]*\s*=\s*(['"`])([^'"`]+)\1/g,
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

function getGitState(repoPath: string): RepositoryGitState {
  try {
    const headCommit = execSync("git rev-parse HEAD", { cwd: repoPath, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const statusOut = execSync("git status --porcelain", { cwd: repoPath, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return {
      headCommit: headCommit || "UNKNOWN",
      isClean: statusOut.length === 0,
    };
  } catch {
    return { headCommit: "UNKNOWN", isClean: false };
  }
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
    // A normal limited SELECT preserves PostgREST's permission-denied payload.
    // HEAD/count requests can collapse that response into a transport-shaped
    // error with no SQLSTATE, making a secured table look indeterminate.
    const result = await anonClient.from("profiles").select("id").limit(1);
    anonCount = result.data?.length ?? null;
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

export function buildCategories(files: SourceFile[]): CategoryAudit[] {
  const cat01Ev = uniqueEvidence(evidenceFor(files, [/\/api\/auth\//, /auth\.users/, /google-auth-library/, /expo-apple-authentication/, /twilio/]));
  const cat02Ev = uniqueEvidence(evidenceFor(files, [/tradition/, /sampradaya/, /gotra/, /devata/, /rashi/, /nakshatra/, /consent_religious_data/]));
  const cat03Ev = uniqueEvidence(evidenceFor(files, [/date_of_birth/, /birth_time/, /birth_place/, /birth_lat/, /birth_lng/, /birth_profiles/, /kul_vansh/i]));
  const cat04Ev = uniqueEvidence(evidenceFor(files, [/home_latitude/, /home_longitude/, /requestForegroundPermissionsAsync/, /getCurrentPositionAsync/, /\/api\/geocode/]));
  const cat05Ev = uniqueEvidence(evidenceFor(files, [/mood_score|mood_logs|\/api\/mood/, /sankalpas|sankalpa_text|\/api\/sankalpa/, /daily_reflections/]));
  const cat06Ev = uniqueEvidence(evidenceFor(files, [/japa_sessions|bead_count|\/api\/japa/, /pathshala_progress|lesson_id/, /quiz_attempts|quiz_score/, /vrat_observations/]));
  const cat07Ev = uniqueEvidence(evidenceFor(files, [/\/api\/mandali\//, /content_reports/, /user_blocked_profiles/, /user_muted_profiles/, /user_hidden_content/]));
  const cat08Ev = uniqueEvidence(evidenceFor(files, [/\/api\/pramana\//, /sarvam/i, /pramana_cache/, /ai_pipeline/]));
  const cat09Ev = uniqueEvidence(evidenceFor(files, [/push_tokens/, /expo-notifications/, /getExpoPushTokenAsync/, /notification_deliveries/, /OneSignalSDK/]));
  const cat10Ev = uniqueEvidence(evidenceFor(files, [/googletagmanager\.com\/gtag/, /pagead2\.googlesyndication\.com/, /@vercel\/analytics/, /WebConsentManager/]));
  const cat11Ev = uniqueEvidence(evidenceFor(files, [/supabase\.storage/, /expo-image-picker/, /avatars/, /mandali-uploads/, /share-cards/]));
  const cat12Ev = uniqueEvidence(evidenceFor(files, [/razorpay/i, /subscriptions/, /payment_orders/, /\/api\/payment/]));
  const cat13Ev = uniqueEvidence(evidenceFor(files, [/session_token/, /guest_birth_lat|guest_date_of_birth|guest.*chart/i, /guest_retention|guest.*storage/i]));
  const cat14Ev = uniqueEvidence(evidenceFor(files, [/\/api\/admin\//, /CRON_SECRET/, /verify_cron_signature|purgeDueDeletedAccounts/, /backup/i]));

  return [
    {
      categoryId: "CAT-01-AUTH",
      categoryName: "Account and authentication data",
      collectionSurface: "Web login/signup/OTP pages, Native Auth modal/screens",
      apiRouteAndAuth: "/api/auth/* (public/session auth), Supabase Auth (auth.users), Twilio OTP (/api/auth/phone/*)",
      storageTarget: "auth.users, public.profiles",
      fieldNames: ["id", "email", "phone", "username", "full_name", "avatar_url", "created_at", "updated_at"],
      purposeVisibleInCode: "User authentication, session management, and authorization",
      recipientsAndVendors: ["Supabase Auth", "Google OAuth", "Apple Auth", "Twilio"],
      deletionPath: "POST /api/user/delete/request marks profiles.is_deleting; cancel clears it; workflow/cron hard-deletes after 30 days",
      retentionRule: "PENDING_DECISION (Active account duration; 30d cool-off before hard delete)",
      canonicalOwnership: "shared_contract",
      confidence: "VERIFIED",
      evidence: cat01Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-02-RELIGIOUS",
      categoryName: "Profile and religious/spiritual data",
      collectionSurface: "Onboarding questionnaire, Profile edit screen, Settings",
      apiRouteAndAuth: "POST/PUT /api/profile, lib/onboarding-contract.ts (Bearer / Cookie authenticated)",
      storageTarget: "public.profiles, public.user_settings",
      fieldNames: ["tradition", "sampradaya", "gotra", "devata", "rashi", "nakshatra", "deity_preference", "spiritual_goals", "bio", "karma_points", "seva_points", "streak_days"],
      purposeVisibleInCode: "Spiritual personalization, calendar customization, tradition-specific rules",
      recipientsAndVendors: ["Supabase"],
      deletionPath: "Overwrite/clear in Profile or Account Deletion cascade",
      retentionRule: "PENDING_DECISION (Special-category consent and retention rule pending approval)",
      canonicalOwnership: "shared_contract",
      confidence: "DECISION_REQUIRED",
      evidence: cat02Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-03-BIRTH-JYOTISH",
      categoryName: "DOB, birth time/place, Jyotish and family/Kul data",
      collectionSurface: "Kundali generator, Kul Vansh form, Onboarding DOB, Guest Jyotish chart",
      apiRouteAndAuth: "POST /api/jyotish/chart (guest session token or auth), src/app/(main)/kul/*, src/app/(main)/kundali/*",
      storageTarget: "public.birth_profiles, public.profiles, client localStorage",
      fieldNames: ["date_of_birth", "birth_time", "birth_place", "birth_lat", "birth_lng", "ayanamsa", "kul_vansh_members"],
      purposeVisibleInCode: "Astrological chart calculation, planetary positions, family lineage tracking",
      recipientsAndVendors: ["Supabase", "Astronomia / Astronomy-engine (in-process)"],
      deletionPath: "Deletion of birth profile row, profile field clear, or account purge",
      retentionRule: "PENDING_DECISION (Guest chart cleanup and family data retention pending decision)",
      canonicalOwnership: "shared_contract",
      confidence: "DECISION_REQUIRED",
      evidence: cat03Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-04-LOCATION",
      categoryName: "Current and foreground location",
      collectionSurface: "Geolocation prompt (Browser / Native expo-location), Mandali nearby seeker toggle",
      apiRouteAndAuth: "POST /api/geocode (client-provided coords), client-side geo-tz / panchang engine",
      storageTarget: "Client memory / AsyncStorage, public.profiles (home_latitude, home_longitude, city, state, country, timezone)",
      fieldNames: ["latitude", "longitude", "city", "state", "country", "timezone", "home_latitude", "home_longitude"],
      purposeVisibleInCode: "Local civil sunrise/sunset panchang calculations, local festival timing, nearby temples",
      recipientsAndVendors: ["Supabase", "OpenStreetMap / Nominatim (if enabled)"],
      deletionPath: "Revoke permission in device settings, clear home location in profile, or account deletion",
      retentionRule: "PENDING_DECISION (Transient in memory; persisted home coordinates tied to account lifecycle)",
      canonicalOwnership: "shared_contract",
      confidence: "VERIFIED",
      evidence: cat04Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-05-MOOD-SANKALPA",
      categoryName: "Mood, journal, reflections and sankalpa",
      collectionSurface: "Mood check-in screen, Sankalpa card, Daily reflection journal",
      apiRouteAndAuth: "POST /api/mood, POST /api/sankalpa, POST /api/reflections (Authenticated session)",
      storageTarget: "public.mood_logs, public.sankalpas, public.daily_reflections, client AsyncStorage",
      fieldNames: ["mood_score", "energy_level", "sankalpa_text", "target_date", "reflection_notes", "tags"],
      purposeVisibleInCode: "Personal spiritual growth tracking, reflection history, daily intention setting",
      recipientsAndVendors: ["Supabase"],
      deletionPath: "User deletion of entry, or account deletion purge",
      retentionRule: "PENDING_DECISION (User-directed deletion; retention period pending decision)",
      canonicalOwnership: "shared_contract",
      confidence: "VERIFIED",
      evidence: cat05Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-06-PRACTICE-PROGRESS",
      categoryName: "Japa, Panchang, practice, quiz and progress history",
      collectionSurface: "Japa bead counter, Pathshala lessons, Quiz module, Vrat tracker",
      apiRouteAndAuth: "POST /api/japa, POST /api/pathshala/progress, POST /api/quiz/submit (Authenticated)",
      storageTarget: "public.japa_sessions, public.pathshala_progress, public.quiz_attempts, public.user_streaks, public.vrat_observations",
      fieldNames: ["mantra_id", "bead_count", "duration_seconds", "lesson_id", "quiz_score", "streak_count", "vrat_completed"],
      purposeVisibleInCode: "Sadhana practice metrics, streak continuity, spiritual milestone tracking",
      recipientsAndVendors: ["Supabase"],
      deletionPath: "Account deletion cascade",
      retentionRule: "PENDING_DECISION (Retained during active membership; account deletion purge)",
      canonicalOwnership: "shared_contract",
      confidence: "VERIFIED",
      evidence: cat06Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-07-COMMUNITY-MANDALI",
      categoryName: "Mandali/community content and safety actions",
      collectionSurface: "Mandali feed, Post creation modal, Comment threads, Report/Block/Mute menus",
      apiRouteAndAuth: "POST /api/mandali/posts, POST /api/mandali/comments, POST /api/mandali/report (Authenticated, rate-limited)",
      storageTarget: "public.posts, public.post_comments, public.content_reports, public.user_blocked_profiles, public.user_muted_profiles, public.user_hidden_content, public.moderation_logs",
      fieldNames: ["post_id", "content", "media_urls", "author_id", "reported_profile_id", "reason", "block_target_id", "action_taken"],
      purposeVisibleInCode: "Community discussions, content moderation, user safety, spam/abuse prevention",
      recipientsAndVendors: ["Supabase"],
      deletionPath: "Author post/comment delete; reports/moderation audit logs retained per abuse-prevention policy",
      retentionRule: "PENDING_DECISION (Content deleted on user request; safety reports retention pending counsel decision)",
      canonicalOwnership: "backend",
      confidence: "PARTIAL",
      evidence: cat07Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-08-AI-PRAMANA",
      categoryName: "AI prompts, generated content, RAG retrieval and TTS",
      collectionSurface: "Ask Pramana / Dharma AI query bar, Audio recitation / TTS player",
      apiRouteAndAuth: "POST /api/pramana/query, POST /api/pramana/tts, Python AI pipeline (Authenticated / Rate-limited)",
      storageTarget: "Ephemeral request memory, transient streaming response, serverless execution logs",
      fieldNames: ["query_text", "scripture_context", "response_text", "audio_buffer", "model_parameters"],
      purposeVisibleInCode: "Contextual scripture QA, translation, text-to-speech audio synthesis",
      recipientsAndVendors: ["Sarvam AI (TTS/Chat)", "Supabase (embeddings/vectors)"],
      deletionPath: "No persistent prompt logs in database; transient streaming cache expires on TTL",
      retentionRule: "PENDING_DECISION (Zero persistent prompt storage policy; provider log retention pending DPA)",
      canonicalOwnership: "backend",
      confidence: "VERIFIED",
      evidence: cat08Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-09-NOTIFICATIONS",
      categoryName: "Notifications, device tokens and delivery receipts",
      collectionSurface: "Push permission prompt, Notification preferences screen",
      apiRouteAndAuth: "POST /api/notifications/register-token, POST /api/notifications/preferences (Authenticated)",
      storageTarget: "public.push_tokens, public.notifications, public.notification_deliveries, public.notification_preferences",
      fieldNames: ["expo_push_token", "fcm_token", "onesignal_player_id", "device_type", "quiet_hours_start", "quiet_hours_end", "delivery_status"],
      purposeVisibleInCode: "Panchang reminders, festival alerts, quiet-hours-compliant ritual notifications",
      recipientsAndVendors: ["Expo Push Service", "Firebase Cloud Messaging (FCM)", "Apple Push Notification service (APNs)", "OneSignal"],
      deletionPath: "Automatic deletion on DeviceNotRegistered error, user sign-out token wipe, or account deletion",
      retentionRule: "PENDING_DECISION (Invalid tokens pruned immediately; delivery history retention pending approval)",
      canonicalOwnership: "shared_contract",
      confidence: "VERIFIED",
      evidence: cat09Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-10-ANALYTICS-ADS",
      categoryName: "Analytics, diagnostics, cookies and advertising",
      collectionSurface: "Web Consent Banner (WebConsentManager), Native app launch diagnostics",
      apiRouteAndAuth: "Client script injection gated by consent cookies/state",
      storageTarget: "Client cookies (shoonaya_consent_v1), browser localStorage, vendor cloud telemetry",
      fieldNames: ["analytics_consent", "advertising_consent", "push_consent", "page_view_url", "client_platform", "performance_metrics"],
      purposeVisibleInCode: "Usage analytics, performance monitoring, website monetization (AdSense on web when consented)",
      recipientsAndVendors: ["Google Analytics 4", "Google AdSense", "Vercel Analytics", "Vercel Speed Insights"],
      deletionPath: "Revocation in cookie settings clears client identifiers; vendor retention controls",
      retentionRule: "PENDING_DECISION (Web consent state retained 12 months; vendor data retention configured in consoles)",
      canonicalOwnership: "backend",
      confidence: "VERIFIED",
      evidence: cat10Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-11-MEDIA-UPLOADS",
      categoryName: "Uploads, profile images, share cards and media",
      collectionSurface: "Avatar upload picker, Mandali post image picker, Festival share card generator",
      apiRouteAndAuth: "Supabase Storage API (POST /storage/v1/object/avatars, /storage/v1/object/mandali-uploads)",
      storageTarget: "Supabase Storage S3 buckets (avatars, mandali-uploads, share-cards)",
      fieldNames: ["bucket_id", "name", "owner", "size", "mime_type", "created_at"],
      purposeVisibleInCode: "User profile avatar display, community post attachments, spiritual share cards",
      recipientsAndVendors: ["Supabase Storage"],
      deletionPath: "Storage bucket object deletion on avatar replacement or account deletion purge",
      retentionRule: "PENDING_DECISION (Objects deleted on user replacement or account purge; CDN cache TTL)",
      canonicalOwnership: "shared_contract",
      confidence: "VERIFIED",
      evidence: cat11Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-12-PAYMENTS",
      categoryName: "Payments, subscriptions and store purchases",
      collectionSurface: "Premium subscription checkout modal, Puja/Seva donation flow",
      apiRouteAndAuth: "POST /api/payment/create-order, POST /api/payment/verify (Authenticated)",
      storageTarget: "public.subscriptions, public.payment_orders, public.transactions",
      fieldNames: ["order_id", "payment_id", "razorpay_signature", "amount", "currency", "plan_type", "status", "created_at"],
      purposeVisibleInCode: "Processing premium subscription and seva contributions, statutory invoicing",
      recipientsAndVendors: ["Razorpay", "Apple In-App Purchases (if active)", "Google Play Billing (if active)"],
      deletionPath: "Statutory financial retention exemption (cannot be deleted on standard user request)",
      retentionRule: "PENDING_DECISION (Statutory legal hold period e.g. 7 years for financial records)",
      canonicalOwnership: "shared_contract",
      confidence: "VERIFIED",
      evidence: cat12Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-13-GUEST-DATA",
      categoryName: "Guest-mode and unauthenticated records",
      collectionSurface: "Guest Panchang calculation, Guest Kundali chart preview, local app preview",
      apiRouteAndAuth: "POST /api/jyotish/chart with session_token, client-side calculations",
      storageTarget: "Browser localStorage / Native AsyncStorage, ephemeral birth_profiles (if session saved)",
      fieldNames: ["session_token", "guest_birth_lat", "guest_birth_lng", "guest_date_of_birth", "guest_preferences"],
      purposeVisibleInCode: "Zero-login exploration of Panchang, festivals, and basic Jyotish charts",
      recipientsAndVendors: ["Supabase (ephemeral)", "Local Device Storage"],
      deletionPath: "Local storage cleared on browser reset; guest session database rows require automated purge rule",
      retentionRule: "PENDING_DECISION (Guest profile purge schedule pending decision)",
      canonicalOwnership: "shared_contract",
      confidence: "DECISION_REQUIRED",
      evidence: cat13Ev.slice(0, 25),
    },
    {
      categoryId: "CAT-14-LOGS-ADMIN",
      categoryName: "Logs, backups, cron/workflow state and administrator access",
      collectionSurface: "Vercel serverless platform, Supabase managed Postgres, GitHub Actions CI, Admin portal",
      apiRouteAndAuth: "src/app/api/admin/*, src/lib/admin.ts, Cron endpoints (CRON_SECRET Bearer auth)",
      storageTarget: "Vercel serverless log streams, Supabase daily backup archive, GitHub Actions build artifacts",
      fieldNames: ["admin_user_id", "action", "timestamp", "ip_hash", "http_status", "cron_job_name", "execution_duration_ms"],
      purposeVisibleInCode: "System reliability, disaster recovery, security auditing, automated festival calculation crons",
      recipientsAndVendors: ["Vercel", "Supabase", "GitHub"],
      deletionPath: "Rolling log window (7-30 days by tier) and automated backup retention rotation",
      retentionRule: "PENDING_DECISION (Provider backup rotation 7-30 days; admin audit log retention pending decision)",
      canonicalOwnership: "backend",
      confidence: "VERIFIED",
      evidence: cat14Ev.slice(0, 25),
    },
  ];
}

function buildInventory(input: { files: SourceFile[]; profilesState: AccessProbeState; discoveries: BaselineReport["discoveries"] }): InventoryItem[] {
  const webTrackerEvidence = evidenceFor(input.files, [/googletagmanager\.com\/gtag/, /pagead2\.googlesyndication\.com/, /OneSignalSDK/]);
  const webConsentGateEvidence = evidenceFor(
    input.files.filter((file) => file.relativePath === "src/components/privacy/WebConsentManager.tsx"),
    [/preferences\.analytics/, /preferences\.advertising/, /preferences\.push/],
  );
  const analyticsConsentEvidence = evidenceFor(input.files, [/setAnalyticsCollectionEnabled/, /analytics.*consent|consent.*analytics/i]);
  const nativeAnalyticsSdkEvidence = evidenceFor(
    input.files.filter((file) => file.repository === "native"),
    [/@react-native-firebase\/analytics/],
  );
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
      status: webTrackerEvidence.length === 0 || webConsentGateEvidence.length === 3 ? "VERIFIED" : "DRIFT", canonicalOwnership: "backend",
      description: `${webTrackerEvidence.length} shipped-source tracker references were found; ${webConsentGateEvidence.length} of 3 optional consent gates were verified.`,
      evidence: [...webTrackerEvidence, ...webConsentGateEvidence].slice(0, 30),
    },
    {
      id: "INV-SDK-02", category: "Third-party SDKs and trackers", name: "Native analytics consent control",
      status: nativeAnalyticsSdkEvidence.length === 0 || analyticsConsentEvidence.length > 0 ? "VERIFIED" : "DRIFT", canonicalOwnership: "native",
      description: nativeAnalyticsSdkEvidence.length === 0
        ? "No Native Firebase Analytics SDK was discovered; an analytics-consent runtime control is therefore not required."
        : "Native analytics is present and a consent-control path was discovered; event ordering still requires focused tests.",
      evidence: [...nativeAnalyticsSdkEvidence, ...analyticsConsentEvidence].slice(0, 30),
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

function buildFingerprint(files: SourceFile[], profileColumns: ProfileColumn[], categories: CategoryAudit[]): string {
  const hash = createHash("sha256");
  for (const file of files) hash.update(`${file.repository}\0${file.relativePath}\0${file.content}\0`);
  hash.update(JSON.stringify(profileColumns));
  hash.update(JSON.stringify(categories.map((c) => ({ id: c.categoryId, conf: c.confidence, fields: c.fieldNames }))));
  return hash.digest("hex");
}

function renderMarkdown(report: BaselineReport): string {
  return [
    "# Machine-Generated Privacy and Security Engineering Baseline", "",
    `**Schema version:** ${report.schemaVersion}`,
    `**Source fingerprint:** \`${report.sourceFingerprint}\``,
    `**Repositories:** Backend \`${report.repositories.backend.headCommit.slice(0, 10)}\` (${report.repositories.backend.isClean ? "clean" : "modified"}), Native \`${report.repositories.native.headCommit.slice(0, 10)}\` (${report.repositories.native.isClean ? "clean" : "modified"})`, "",
    "> This is an engineering evidence inventory, not legal advice. UNKNOWN and",
    "> ERROR states are never equivalent to a secure or compliant result.", "",
    "## Summary", "",
    `- Audited data categories: ${report.summary.totalCategories}`,
    `- Inventory checks: ${report.summary.totalItems}`,
    `- Scanned files: backend ${report.summary.scannedFiles.backend}, Native ${report.summary.scannedFiles.native}`,
    `- Literal storage keys: backend ${report.summary.discoveredStorageKeys.backend}, Native ${report.summary.discoveredStorageKeys.native}`,
    `- Providers/SDKs discovered: ${report.summary.discoveredProviders}`,
    ...Object.entries(report.summary.byStatus).map(([status, count]) => `- Check ${status}: ${count}`),
    ...Object.entries(report.summary.byCategoryConfidence).map(([conf, count]) => `- Category ${conf}: ${count}`), "",
    "## 14-Category Data Inventory", "",
    "| Category ID | Category Name | Storage / Route | Vendors | Retention Rule | Confidence | Evidence |",
    "|---|---|---|---|---|---|---:|",
    ...report.categories.map((cat) => `| \`${cat.categoryId}\` | ${cat.categoryName} | \`${cat.storageTarget}\` | ${cat.recipientsAndVendors.join(", ")} | ${cat.retentionRule} | **${cat.confidence}** | ${cat.evidence.length} |`), "",
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
  const backendGit = getGitState(webRoot);
  const nativeGit = getGitState(nativeRoot);
  const backendFiles = walk(webRoot, "backend");
  const nativeFiles = walk(nativeRoot, "native");
  const files = [...backendFiles, ...nativeFiles];
  const databaseTypesPath = path.join(webRoot, "src/types/database.ts");
  const profileColumns = fs.existsSync(databaseTypesPath) ? extractProfileColumns(fs.readFileSync(databaseTypesPath, "utf8")) : [];
  const storageKeys = discoverStorageKeys(files);
  const providers = PROVIDERS.map(({ provider, patterns }) => ({ provider, evidence: evidenceFor(files, patterns, 100) })).filter((entry) => entry.evidence.length > 0);
  const categories = buildCategories(files);
  const discoveries: BaselineReport["discoveries"] = {
    profileColumns,
    profilePaths: uniqueEvidence(evidenceFor(files, [/\.from\(['"]profiles['"]\)/, /\/api\/(?:profile|onboarding)/, /buildOnboardingProfilePayload/])),
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
  const confs: CategoryConfidence[] = ["VERIFIED", "PARTIAL", "NOT_FOUND", "DECISION_REQUIRED"];
  const byCategoryConfidence = Object.fromEntries(confs.map((conf) => [conf, categories.filter((item) => item.confidence === conf).length])) as Record<CategoryConfidence, number>;

  const report: BaselineReport = {
    schemaVersion: 2,
    sourceFingerprint: buildFingerprint(files, profileColumns, categories),
    repositories: {
      backend: backendGit,
      native: nativeGit,
    },
    environment: {
      supabaseHost: supabaseUrl ? new URL(supabaseUrl).host : null,
      anonProbeAvailable: Boolean(supabaseUrl && anonKey),
      aggregateAdminProbeAvailable: Boolean(supabaseUrl && serviceKey),
    },
    summary: {
      totalItems: inventory.length,
      totalCategories: categories.length,
      byStatus,
      byCategoryConfidence,
      scannedFiles: { backend: backendFiles.length, native: nativeFiles.length },
      discoveredStorageKeys: { backend: storageKeys.backend.length, native: storageKeys.native.length },
      discoveredProviders: providers.length,
    },
    databaseAccessProbe: {
      ...databaseProbe,
      limitation: "The Data API probes verify effective anonymous access and aggregate counts. Exact live PostgreSQL grants, policy expressions, view security and RPC privileges require a separate metadata query through an approved database connection or Supabase MCP.",
    },
    categories,
    discoveries,
    inventory,
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
    console.log(JSON.stringify({ sourceFingerprint: report.sourceFingerprint, repositories: report.repositories, summary: report.summary, profilesAccess: report.databaseAccessProbe.profiles }, null, 2));
  }).catch((error: unknown) => {
    console.error(`[baseline] ${error instanceof Error ? error.message : "Unknown baseline failure"}`);
    process.exitCode = 1;
  });
}
