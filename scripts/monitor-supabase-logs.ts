#!/usr/bin/env node

/**
 * Supabase Log Auditor & Monitor
 *
 * Usage:
 *   npx tsx scripts/monitor-supabase-logs.ts [path-to-logs.json]
 *   npx tsx scripts/monitor-supabase-logs.ts --watch [optional-path]
 *
 * Analyzes Supabase Postgres & Edge logs, clusters errors, filters out benign dashboard probes,
 * and surfaces actionable database defects.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

interface LogEntry {
  id?: string;
  timestamp?: string;
  time?: string;
  status?: string;
  level?: string;
  event_message?: string;
  message?: string;
  pathname?: string;
  method?: string;
}

interface ClusteredError {
  category: 'CRITICAL' | 'INFRASTRUCTURE' | 'BENIGN_NOISE';
  title: string;
  description: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  sample: string;
}

const DEFAULT_PATH = path.resolve(process.env.HOME || '', 'Downloads', 'supabase_logs.json');

async function checkLiveBackendTelemetry(hours = 4) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log('ℹ️  Skipping live DB telemetry check (missing SUPABASE_SERVICE_ROLE_KEY in env).\n');
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  console.log(`\n===============================================================`);
  console.log(`🌐 Live Backend & API Telemetry (Last ${hours} Hours, since ${sinceIso})`);
  console.log(`===============================================================\n`);

  // 1. Native API Diagnostic Events
  const { data: apiErrors } = await supabase
    .from('native_api_diagnostic_events')
    .select('endpoint, final_status, outcome, duration_ms, server_request_id, received_at')
    .gt('received_at', sinceIso)
    .neq('final_status', 200)
    .order('received_at', { ascending: false })
    .limit(50);

  if (!apiErrors || apiErrors.length === 0) {
    console.log('✅ Native API Status: Clean (0 non-200 responses)');
  } else {
    console.log(`🚨 Native API Failures (${apiErrors.length} events):`);
    const endpointMap: Record<string, number> = {};
    for (const ev of apiErrors) {
      const key = `${ev.endpoint} (HTTP ${ev.final_status || 'timeout'} - ${ev.outcome})`;
      endpointMap[key] = (endpointMap[key] || 0) + 1;
    }
    for (const [k, count] of Object.entries(endpointMap)) {
      console.log(`  • [${count}x] ${k}`);
    }
  }

  // 2. Client Crash Events
  const { data: clientErrors } = await supabase
    .from('client_error_events')
    .select('error_message, route, created_at')
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!clientErrors || clientErrors.length === 0) {
    console.log('✅ Client UI Crashes: Clean (0 unhandled client exceptions)');
  } else {
    console.log(`🚨 Client UI Exceptions (${clientErrors.length} events):`);
    for (const ce of clientErrors.slice(0, 5)) {
      console.log(`  • [${ce.created_at}] route=${ce.route}: ${ce.error_message?.slice(0, 80)}`);
    }
  }

  // 3. Backend Monitoring Events
  const { data: monErrors } = await supabase
    .from('monitoring_events')
    .select('domain, event_name, error_message, timestamp')
    .gt('timestamp', sinceIso)
    .eq('status', 'error')
    .order('timestamp', { ascending: false })
    .limit(20);

  if (!monErrors || monErrors.length === 0) {
    console.log('✅ Backend / AI Sinks: Clean (0 errors)');
  } else {
    console.log(`🚨 Backend Monitoring Errors (${monErrors.length} events):`);
    for (const me of monErrors.slice(0, 5)) {
      console.log(`  • [${me.timestamp}] domain=${me.domain} event=${me.event_name}: ${me.error_message?.slice(0, 80)}`);
    }
  }

  console.log(`\n===============================================================\n`);
}

function classifyLogMessage(msg: string): { category: 'CRITICAL' | 'INFRASTRUCTURE' | 'BENIGN_NOISE'; title: string; description: string } {
  if (msg.includes('violates foreign key constraint')) {
    const match = msg.match(/constraint "([^"]+)"/);
    const constraint = match ? match[1] : 'foreign_key';
    return {
      category: 'CRITICAL',
      title: `Foreign Key Violation (${constraint})`,
      description: 'An INSERT or UPDATE referenced a parent ID that does not exist in the foreign table.',
    };
  }

  if (msg.includes('canceling statement due to statement timeout')) {
    return {
      category: 'INFRASTRUCTURE',
      title: 'PostgreSQL Statement Timeout (SQLSTATE 57014)',
      description: 'Query exceeded maximum execution time during high I/O burst or checkpoint lock.',
    };
  }

  if (msg.includes('522') || msg.includes('504')) {
    return {
      category: 'INFRASTRUCTURE',
      title: 'Cloudflare / Edge Gateway Timeout (522/504)',
      description: 'Edge proxy could not reach database backend within timeout limit.',
    };
  }

  if (msg.includes('duplicate key value violates unique constraint "buckets_pkey"')) {
    return {
      category: 'BENIGN_NOISE',
      title: 'Storage Bucket Duplicate Key',
      description: 'Storage init tried to create an already-existing bucket. Harmless.',
    };
  }

  if (msg.includes('column') && msg.includes('does not exist')) {
    const match = msg.match(/column ([^\s]+) does not exist/);
    const colName = match ? match[1] : 'unknown';

    // Dashboard probe tables (global catalog tables that don't have user_id / author_id)
    const dashboardProbeTables = [
      'festivals', 'observance_definitions', 'observance_occurrences',
      'observance_materialisation_manifests', 'observance_materialisation_batches',
      'observance_review_queue', 'dharm_veers', 'dharm_veer_generation_log',
      'calendar_profiles', 'tradition_profiles', 'golden_fixtures',
      'calendar_integrity_findings', 'client_error_events', 'waitlist',
      'email_outbox', 'email_suppressions', 'email_provider_events',
      'mandalis', 'mandali_prompts', 'posts', 'post_polls', 'post_poll_options',
      'post_comments', 'forum_threads', 'forum_replies', 'content_reports',
      'public_profiles', 'kuls'
    ];

    const isDashboardProbe = dashboardProbeTables.some(t => colName.startsWith(`${t}.`));

    if (isDashboardProbe) {
      return {
        category: 'BENIGN_NOISE',
        title: `Dashboard Probe (${colName})`,
        description: 'Supabase Studio Auth UI queried candidate column across catalog tables.',
      };
    }

    return {
      category: 'CRITICAL',
      title: `Missing Column Reference (${colName})`,
      description: 'Application code or function referenced a column not present in PostgreSQL schema.',
    };
  }

  if (msg.includes('cannot execute CREATE TABLE in a read-only transaction')) {
    return {
      category: 'BENIGN_NOISE',
      title: 'Read-only Pool DDL Rejection',
      description: 'DDL was sent to read-only replica connection pool.',
    };
  }

  return {
    category: 'CRITICAL',
    title: msg.slice(0, 80),
    description: 'Uncategorized database exception or error.',
  };
}

export function parseAndAnalyzeLogs(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Error: File not found: ${filePath}`);
    console.error(`Please provide a valid path or export logs to ${DEFAULT_PATH}\n`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let entries: LogEntry[] = [];
  try {
    const parsed = JSON.parse(raw);
    entries = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    entries = raw.trim().split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean) as LogEntry[];
  }

  console.log(`\n===============================================================`);
  console.log(`📊 Supabase Log Audit: ${path.basename(filePath)} (${entries.length} total entries)`);
  console.log(`===============================================================\n`);

  const clusters: Record<string, ClusteredError> = {};

  for (const entry of entries) {
    const msg = entry.event_message || entry.message || '';
    if (!msg) continue;

    const classification = classifyLogMessage(msg);
    const key = `${classification.category}:${classification.title}`;
    const timestamp = entry.timestamp || entry.time || entry.date || 'unknown';

    if (!clusters[key]) {
      clusters[key] = {
        category: classification.category,
        title: classification.title,
        description: classification.description,
        count: 0,
        firstSeen: timestamp,
        lastSeen: timestamp,
        sample: msg,
      };
    }

    clusters[key].count++;
    if (timestamp < clusters[key].firstSeen) clusters[key].firstSeen = timestamp;
    if (timestamp > clusters[key].lastSeen) clusters[key].lastSeen = timestamp;
  }

  const criticals = Object.values(clusters).filter(c => c.category === 'CRITICAL');
  const infra = Object.values(clusters).filter(c => c.category === 'INFRASTRUCTURE');
  const benign = Object.values(clusters).filter(c => c.category === 'BENIGN_NOISE');

  console.log(`🚨 CRITICAL ISSUES (${criticals.reduce((acc, c) => acc + c.count, 0)} events):`);
  if (criticals.length === 0) {
    console.log('  ✅ None detected! No fatal RPC or schema mismatch errors.\n');
  } else {
    for (const c of criticals.sort((a, b) => b.count - a.count)) {
      console.log(`  • [${c.count}x] ${c.title}`);
      console.log(`    ↳ Detail: ${c.description}`);
      console.log(`    ↳ Range:  ${c.firstSeen} → ${c.lastSeen}`);
    }
    console.log();
  }

  console.log(`⚡ INFRASTRUCTURE / TIMEOUTS (${infra.reduce((acc, c) => acc + c.count, 0)} events):`);
  if (infra.length === 0) {
    console.log('  ✅ No statement or edge timeouts.\n');
  } else {
    for (const c of infra.sort((a, b) => b.count - a.count)) {
      console.log(`  • [${c.count}x] ${c.title}`);
      console.log(`    ↳ Detail: ${c.description}`);
      console.log(`    ↳ Range:  ${c.firstSeen} → ${c.lastSeen}`);
    }
    console.log();
  }

  console.log(`ℹ️  BENIGN NOISE / DASHBOARD PROBES (${benign.reduce((acc, c) => acc + c.count, 0)} events):`);
  for (const c of benign.sort((a, b) => b.count - a.count)) {
    console.log(`  • [${c.count}x] ${c.title} (${c.description})`);
  }
  console.log(`\n===============================================================\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');
  const checkLive = args.includes('--live') || !args.find(a => !a.startsWith('--'));
  const targetPath = args.find(a => !a.startsWith('--')) || (fs.existsSync(DEFAULT_PATH) ? DEFAULT_PATH : null);

  if (targetPath) {
    parseAndAnalyzeLogs(targetPath);
  } else {
    console.log(`ℹ️  No log export file found at ${DEFAULT_PATH}.`);
  }

  if (checkLive) {
    await checkLiveBackendTelemetry(4);
  }

  if (isWatch && targetPath) {
    console.log(`👀 Watching for updates to ${targetPath}... (Press Ctrl+C to stop)`);
    fs.watchFile(targetPath, { interval: 2000 }, async (curr, prev) => {
      if (curr.mtimeMs !== prev.mtimeMs) {
        console.log(`\n🔄 Log file updated! Re-running analysis...`);
        parseAndAnalyzeLogs(targetPath);
        if (checkLive) await checkLiveBackendTelemetry(4);
      }
    });
  }
}

main().catch(console.error);
