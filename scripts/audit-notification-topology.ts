import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

type Classification =
  | 'direct_send_legacy'
  | 'scheduled_queue_producer'
  | 'hybrid_direct_and_queue'
  | 'transactional_event'
  | 'admin_or_test'
  | 'delivery_worker';

type Producer = {
  route: string;
  sourceFile: string;
  classification: Classification;
  schedule: string | null;
  callsPushDirectly: boolean;
  readsSchedule: boolean;
  writesSchedule: boolean;
  writesBell: boolean;
  preferenceColumns: string[];
  notificationKeyLiterals: string[];
};

type SettingsReference = { column: string; nativeReferenced: boolean; webReferenced: boolean; note: string };
type OverlapHypothesis = {
  id: string;
  producerRoutes: string[];
  rationale: string;
  allRoutesDiscovered: boolean;
  status: 'requires_runtime_candidate_probe';
};
type MigrationEvidence = {
  migrationFile: string;
  repositoryStatus: 'present';
  productionStatus: 'not_verified_by_source_scan';
};
type LiveTableEvidence = { reachable: boolean; count: number | null; error: string | null };
type LiveDatabaseEvidence = {
  attempted: boolean;
  verified: boolean;
  reason: string | null;
  tables: Record<string, LiveTableEvidence>;
};
type AuditDocument = {
  sourceFingerprint: string;
  schemaVersion: string;
  ownership: { canonicalRepository: string; nativeRepositoryAudited: boolean };
  summary: {
    totalRoutes: number;
    directPushCallers: number;
    queueWriters: number;
    byClassification: Record<string, number>;
    preferenceReferences: number;
  };
  producers: Producer[];
  overlapHypotheses: OverlapHypothesis[];
  settingsExposure: SettingsReference[];
  migrations: MigrationEvidence[];
  liveDatabase: LiveDatabaseEvidence;
};

const BACKEND_ROOT = path.resolve(__dirname, '..');
const NATIVE_ROOT = path.resolve(BACKEND_ROOT, '../../shoonaya-mobile');
const API_ROOT = path.join(BACKEND_ROOT, 'src/app/api');
const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/notifications');
loadEnv({ path: path.join(BACKEND_ROOT, '.env.local'), quiet: true });

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function routeForFile(file: string): string {
  return `/${path.relative(path.join(BACKEND_ROOT, 'src/app'), path.dirname(file)).split(path.sep).join('/')}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function sourceFingerprint(): string {
  const files = [
    ...walk(API_ROOT).filter((file) => file.endsWith(`${path.sep}route.ts`)),
    path.join(BACKEND_ROOT, 'vercel.json'),
    path.join(NATIVE_ROOT, 'app/settings.tsx'),
  ].filter((file) => fs.existsSync(file)).sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(path.relative(BACKEND_ROOT, file));
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function matches(content: string, expression: RegExp): string[] {
  return unique([...content.matchAll(expression)].map((match) => match[1]).filter(Boolean));
}

function writesTable(content: string, table: string): boolean {
  const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `\\.from\\(\\s*['"]${escapedTable}['"]\\s*\\)[\\s\\S]{0,600}?\\.(?:insert|upsert)\\s*\\(`,
  ).test(content);
}

function classify(route: string, direct: boolean, readsSchedule: boolean, queued: boolean): Classification {
  if (route === '/api/cron/notification-dispatch' || (direct && readsSchedule && !queued)) return 'delivery_worker';
  if (route.startsWith('/api/admin/')) return 'admin_or_test';
  if (!route.startsWith('/api/cron/') && !route.startsWith('/api/digest/')) return 'transactional_event';
  if (direct && queued) return 'hybrid_direct_and_queue';
  return queued ? 'scheduled_queue_producer' : 'direct_send_legacy';
}

function readVercelSchedules(): Map<string, string> {
  const config = JSON.parse(fs.readFileSync(path.join(BACKEND_ROOT, 'vercel.json'), 'utf8')) as {
    crons?: Array<{ path: string; schedule: string }>;
  };
  return new Map((config.crons ?? []).map((cron) => [cron.path.split('?')[0], cron.schedule]));
}

function discoverProducers(): Producer[] {
  const schedules = readVercelSchedules();
  return walk(API_ROOT)
    .filter((file) => file.endsWith(`${path.sep}route.ts`))
    .flatMap((file): Producer[] => {
      const content = fs.readFileSync(file, 'utf8');
      const callsPushDirectly = /\bsendPushNotification\s*\(/.test(content);
      const readsSchedule = /\.from\(\s*['"]notification_schedule['"]\s*\)/.test(content);
      const writesSchedule = writesTable(content, 'notification_schedule');
      if (!callsPushDirectly && !writesSchedule) return [];

      const route = routeForFile(file);
      const preferenceColumns = matches(
        content,
        /\b((?:wants_[a-z0-9_]+|[a-z0-9_]+_reminder_enabled))\b/g,
      );
      const notificationKeyLiterals = matches(
        content,
        /[`'"]([^`'"]*(?:notification|festival|vrat|tithi|nitya|japa|mood|sattvic|sankalpa|journal|sanskar|broadcast|milestone)[^`'"]*:[^`'"]*)[`'"]/gi,
      ).filter((value) => value.length <= 160);

      return [{
        route,
        sourceFile: path.relative(BACKEND_ROOT, file),
        classification: classify(route, callsPushDirectly, readsSchedule, writesSchedule),
        schedule: schedules.get(route) ?? null,
        callsPushDirectly,
        readsSchedule,
        writesSchedule,
        writesBell: writesTable(content, 'notifications'),
        preferenceColumns,
        notificationKeyLiterals,
      }];
    })
    .sort((a, b) => a.route.localeCompare(b.route));
}

function settingsExposure(preferences: string[]): SettingsReference[] {
  const nativeText = walk(NATIVE_ROOT)
    .filter((file) => /\.(?:ts|tsx)$/.test(file) && !file.includes(`${path.sep}node_modules${path.sep}`))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  const webText = walk(path.join(BACKEND_ROOT, 'src'))
    .filter((file) => /\.(?:ts|tsx)$/.test(file))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  return preferences.map((column) => ({
    column,
    nativeReferenced: nativeText.includes(column),
    webReferenced: webText.includes(column),
    note: 'Reference detection is not proof that a user-facing toggle exists; Prompt 4 must trace each settings control.',
  }));
}

function migrationEvidence(): MigrationEvidence[] {
  const migrationDir = path.join(BACKEND_ROOT, 'supabase/migrations');
  const names = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir) : [];
  return names
    .filter((name) => /notification|push_token|onesignal/i.test(name))
    .sort()
    .map((migrationFile) => ({
      migrationFile,
      repositoryStatus: 'present',
      productionStatus: 'not_verified_by_source_scan',
    }));
}

async function liveDatabaseEvidence(): Promise<LiveDatabaseEvidence> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { attempted: false, verified: false, reason: 'Supabase environment variables were not supplied to this command.', tables: {} };
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const tables: Record<string, { reachable: boolean; count: number | null; error: string | null }> = {};
  for (const table of ['notification_schedule', 'notifications', 'push_tokens', 'notification_dispatch_events', 'push_token_events']) {
    const result = await db.from(table).select('*', { count: 'exact', head: true });
    tables[table] = { reachable: !result.error, count: result.count ?? null, error: result.error?.message ?? null };
  }
  return {
    attempted: true,
    verified: Object.values(tables).every((result) => result.reachable),
    reason: null,
    tables,
  };
}

function overlapHypotheses(routes: Set<string>): OverlapHypothesis[] {
  const hypotheses = [
    {
      id: 'competing_schedule_delivery_workers',
      producerRoutes: ['/api/cron/notification-dispatch', '/api/cron/sanskar-milestone'],
      rationale: 'Two push-sending workers read the shared notification_schedule queue; the Sanskar worker query is not restricted to Sanskar rows.',
    },
    {
      id: 'occurrence_vrat_vs_tithi',
      producerRoutes: ['/api/cron/vrat-reminder', '/api/cron/tithi-reminder'],
      rationale: 'Occurrence-backed Ekadashi/Purnima/Amavasya vrats and generic tithi alerts use independent key namespaces.',
    },
    {
      id: 'morning_routine_budget',
      producerRoutes: ['/api/cron/brahma-muhurta', '/api/cron/japa-reminder', '/api/cron/nitya-reminder'],
      rationale: 'Independent early-day routines have no shared per-user cadence arbitration.',
    },
    {
      id: 'evening_routine_budget',
      producerRoutes: ['/api/cron/shloka-reminder', '/api/cron/mood-reminder-evening', '/api/cron/sattvic-reminder', '/api/cron/nitya-reminder-sandhya'],
      rationale: 'Independent evening routines have no shared per-user cadence arbitration.',
    },
  ];
  return hypotheses.map((item) => ({
    ...item,
    allRoutesDiscovered: item.producerRoutes.every((route) => routes.has(route)),
    status: 'requires_runtime_candidate_probe',
  }));
}

function markdown(document: AuditDocument): string {
  const counts = Object.entries(document.summary.byClassification)
    .map(([classification, count]) => `| \`${classification}\` | ${count} |`)
    .join('\n');
  const producers = document.producers.map((producer: Producer) =>
    `| \`${producer.route}\` | \`${producer.classification}\` | ${producer.schedule ? `\`${producer.schedule}\`` : 'not in vercel.json'} | ${producer.callsPushDirectly ? 'yes' : 'no'} | ${producer.writesSchedule ? 'yes' : 'no'} | ${producer.preferenceColumns.map((p) => `\`${p}\``).join(', ') || 'none detected'} |`,
  ).join('\n');
  const overlaps = document.overlapHypotheses.map((item) =>
    `| \`${item.id}\` | ${item.allRoutesDiscovered ? 'routes present' : 'route missing'} | \`${item.status}\` | ${item.rationale} |`,
  ).join('\n');

  return `# Notification topology audit\n\n> Generated by \`npm run audit:notifications\`. Producer counts and schedules are source-derived. Semantic overlaps are hypotheses until a runtime candidate probe proves them.\n\n## Summary\n\n- Route-level producers/workers discovered: **${document.summary.totalRoutes}**\n- Direct push callers: **${document.summary.directPushCallers}**\n- Queue writers: **${document.summary.queueWriters}**\n- Live database queried: **${document.liveDatabase.attempted ? 'yes' : 'no'}**\n- Live table reachability verified: **${document.liveDatabase.verified ? 'yes' : 'no'}**\n\n| Classification | Count |\n| --- | ---: |\n${counts}\n\n## Route inventory\n\n| Route | Classification | Vercel schedule | Direct push | Queue write | Preference references |\n| --- | --- | --- | --- | --- | --- |\n${producers}\n\n## Semantic overlap hypotheses\n\nThese are review targets, not machine-proven duplicate deliveries. Prompt 2 must generate same-user/same-local-date candidates and prove suppression behavior.\n\n| Hypothesis | Static route evidence | Status | Rationale |\n| --- | --- | --- | --- |\n${overlaps}\n\n## Settings references\n\nReference detection is intentionally weaker than UI exposure. Prompt 4 must trace the actual controls.\n\n${document.settingsExposure.map((item) => `- \`${item.column}\`: Native reference ${item.nativeReferenced ? 'found' : 'not found'}; Web reference ${item.webReferenced ? 'found' : 'not found'}.`).join('\n')}\n\n## Migration evidence\n\nMigration files are repository evidence only. They are not labelled applied to production by this scan.\n\n${document.migrations.map((item) => `- \`${item.migrationFile}\`: repository present; production not verified by source scan.`).join('\n')}\n\n## Live database evidence\n\n\`\`\`json\n${JSON.stringify(document.liveDatabase, null, 2)}\n\`\`\`\n`;
}

export async function runNotificationTopologyAudit() {
  const producers = discoverProducers();
  const byClassification = producers.reduce<Record<string, number>>((counts, producer) => {
    counts[producer.classification] = (counts[producer.classification] ?? 0) + 1;
    return counts;
  }, {});
  const preferences = unique(producers.flatMap((producer) => producer.preferenceColumns));
  const liveDatabase = await liveDatabaseEvidence();
  const document: AuditDocument = {
    sourceFingerprint: sourceFingerprint(),
    schemaVersion: '2.0.0',
    ownership: { canonicalRepository: 'Sanatan Sangam/Shoonaya', nativeRepositoryAudited: fs.existsSync(NATIVE_ROOT) },
    summary: {
      totalRoutes: producers.length,
      directPushCallers: producers.filter((producer) => producer.callsPushDirectly).length,
      queueWriters: producers.filter((producer) => producer.writesSchedule).length,
      byClassification,
      preferenceReferences: preferences.length,
    },
    producers,
    overlapHypotheses: overlapHypotheses(new Set(producers.map((producer) => producer.route))),
    settingsExposure: settingsExposure(preferences),
    migrations: migrationEvidence(),
    liveDatabase,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'NOTIFICATION_TOPOLOGY.json'), `${JSON.stringify(document, null, 2)}\n`);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'NOTIFICATION_TOPOLOGY.md'), markdown(document));
  process.stdout.write(`${JSON.stringify(document.summary)}\n`);
  return document;
}

if (require.main === module) {
  runNotificationTopologyAudit().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
