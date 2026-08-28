import { createAdminClient } from '@/lib/supabase-admin';
import { emitEvent, type MonitoringEvent } from '@/lib/monitoring/events';

export type CronCategory = 'reminders' | 'calendar' | 'ai' | 'maintenance';

export interface CronDefinition {
  id: string;
  name: string;
  route: string;
  schedule: string;
  scheduleHuman: string;
  category: CronCategory;
  description: string;
  method: 'GET' | 'POST';
}

export interface CronExecutionTelemetry {
  id?: string;
  route: string;
  timestamp: string;
  statusCode: number;
  durationMs: number;
  status: 'healthy' | 'error' | 'warning' | 'untriggered';
  errorMessage?: string | null;
  errorCode?: string | null;
  payloadSummary?: Record<string, unknown> | null;
  triggeredBy: 'vercel_cron' | 'admin_manual';
}

export interface HourlyBucket24h {
  hourLabel: string;
  hourUtc: number;
  startIso: string;
  count: number;
  errorCount: number;
  status: "healthy" | "error" | "none";
  avgDurationMs: number;
}

export interface CronStatusSummary extends CronDefinition {
  lastExecution: CronExecutionTelemetry | null;
  recentExecutions: CronExecutionTelemetry[];
  successRate24h: number;
  totalRuns24h: number;
  successfulRuns24h: number;
  failedRuns24h: number;
  hourlyBreakdown24h: HourlyBucket24h[];
}

export const CRON_CATALOGUE: CronDefinition[] = [
  // ── 1. Devotional & Sadhana Reminders ──
  {
    id: 'brahma-muhurta',
    name: 'Brahma Muhurta Reminder',
    route: '/api/cron/brahma-muhurta',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily at 03:00 UTC (Early Morning)',
    category: 'reminders',
    description: 'Notifies seekers in their local Brahma Muhurta window before sunrise.',
    method: 'GET',
  },
  {
    id: 'nitya-reminder',
    name: 'Nitya Karma (Morning)',
    route: '/api/cron/nitya-reminder',
    schedule: '0 4 * * *',
    scheduleHuman: 'Daily at 04:00 UTC',
    category: 'reminders',
    description: 'Morning daily practice and prayer reminder for active seekers.',
    method: 'GET',
  },
  {
    id: 'vrat-reminder',
    name: 'Vrat & Fasting Reminder',
    route: '/api/cron/vrat-reminder',
    schedule: '30 4 * * *',
    scheduleHuman: 'Daily at 04:30 UTC',
    category: 'reminders',
    description: 'Occurrence-backed notifications for upcoming Ekadashi, Pradosh, and vrats.',
    method: 'GET',
  },
  {
    id: 'tithi-reminder',
    name: 'Tithi & Auspicious Times',
    route: '/api/cron/tithi-reminder',
    schedule: '0 5 * * *',
    scheduleHuman: 'Daily at 05:00 UTC',
    category: 'reminders',
    description: 'Notifies devotees about key tithi transitions and auspicious timings.',
    method: 'GET',
  },
  {
    id: 'festival-reminder',
    name: 'Festival Reminder',
    route: '/api/cron/festival-reminder',
    schedule: '30 5 * * *',
    scheduleHuman: 'Daily at 05:30 UTC',
    category: 'reminders',
    description: 'Upcoming major & regional festival notifications with tradition filtering.',
    method: 'GET',
  },
  {
    id: 'shloka-reminder',
    name: 'Daily Shloka Reminder',
    route: '/api/cron/shloka-reminder',
    schedule: '0 6 * * *',
    scheduleHuman: 'Daily at 06:00 UTC',
    category: 'reminders',
    description: 'Daily sacred shloka contemplation notification.',
    method: 'GET',
  },
  {
    id: 'nitya-reminder-madhyahn',
    name: 'Nitya Karma (Madhyahn / Midday)',
    route: '/api/cron/nitya-reminder-madhyahn',
    schedule: '30 6 * * *',
    scheduleHuman: 'Daily at 06:30 UTC',
    category: 'reminders',
    description: 'Midday practice and contemplative pause nudge.',
    method: 'GET',
  },
  {
    id: 'guided-plan-reminder',
    name: 'Guided Sadhana Plan Nudge',
    route: '/api/cron/guided-plan-reminder',
    schedule: '0 7 * * *',
    scheduleHuman: 'Daily at 07:00 UTC',
    category: 'reminders',
    description: 'Day-N progress nudge for users actively enrolled in a structured plan.',
    method: 'GET',
  },
  {
    id: 'sattvic-reminder',
    name: 'Sattvic Zen Breath Reminder',
    route: '/api/cron/sattvic-reminder',
    schedule: '0 11 * * *',
    scheduleHuman: 'Daily at 11:00 UTC',
    category: 'reminders',
    description: 'Mindful breathing and grounding practice notification.',
    method: 'GET',
  },
  {
    id: 'aarti-notify-evening',
    name: 'Evening Aarti Notification',
    route: '/api/cron/aarti-notify?slot=evening',
    schedule: '30 12 * * *',
    scheduleHuman: 'Daily at 12:30 UTC',
    category: 'reminders',
    description: 'Evening temple aarti broadcast notifications.',
    method: 'GET',
  },
  {
    id: 'nitya-reminder-sandhya',
    name: 'Nitya Karma (Sandhya / Dusk)',
    route: '/api/cron/nitya-reminder-sandhya',
    schedule: '0 13 * * *',
    scheduleHuman: 'Daily at 13:00 UTC',
    category: 'reminders',
    description: 'Evening Sandhyavandanam / sunset reflection reminder.',
    method: 'GET',
  },
  {
    id: 'mood-reminder-evening',
    name: 'Evening Reflection & Mood Check-in',
    route: '/api/cron/mood-reminder-evening',
    schedule: '30 14 * * *',
    scheduleHuman: 'Daily at 14:30 UTC',
    category: 'reminders',
    description: 'Evening emotional and spiritual grounding check-in.',
    method: 'GET',
  },
  {
    id: 'aarti-notify-morning',
    name: 'Morning Aarti Notification',
    route: '/api/cron/aarti-notify?slot=morning',
    schedule: '30 22 * * *',
    scheduleHuman: 'Daily at 22:30 UTC',
    category: 'reminders',
    description: 'Early morning live darshan and aarti notification.',
    method: 'GET',
  },
  {
    id: 'japa-reminder',
    name: 'Japa Mala Reminder',
    route: '/api/cron/japa-reminder',
    schedule: '0 2 * * *',
    scheduleHuman: 'Daily at 02:00 UTC',
    category: 'reminders',
    description: 'Daily mantra chanting & Japa commitment reminder.',
    method: 'GET',
  },
  {
    id: 'sankalpa-checkin',
    name: 'Sankalpa Check-in',
    route: '/api/cron/sankalpa-checkin',
    schedule: '30 1 * * *',
    scheduleHuman: 'Daily at 01:30 UTC',
    category: 'reminders',
    description: 'Progress check-in for seekers with active spiritual vows.',
    method: 'GET',
  },
  {
    id: 'pitru-paksha-reminder',
    name: 'Pitru Paksha Reminder',
    route: '/api/cron/pitru-paksha-reminder',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily at 03:00 UTC',
    category: 'reminders',
    description: 'Seasonal remembrance reminders during Pitru Paksha period.',
    method: 'GET',
  },
  {
    id: 'sanskar-milestone',
    name: 'Sanskar Milestone Reminder',
    route: '/api/cron/sanskar-milestone',
    schedule: '0 6 * * *',
    scheduleHuman: 'Daily at 06:00 UTC',
    category: 'reminders',
    description: 'Milestone achievements and seva progression nudges.',
    method: 'GET',
  },
  {
    id: 'mood-reminder-morning',
    name: 'Morning Mood Reminder',
    route: '/api/cron/mood-reminder',
    schedule: '30 3 * * *',
    scheduleHuman: 'Daily at 03:30 UTC',
    category: 'reminders',
    description: 'Morning emotional readiness and mindset check-in.',
    method: 'GET',
  },
  {
    id: 'whatsapp-daily',
    name: 'WhatsApp Daily Panchang & Shloka',
    route: '/api/whatsapp/send-daily',
    schedule: '0 6 * * *',
    scheduleHuman: 'Daily at 06:00 UTC',
    category: 'reminders',
    description: 'Delivers daily spiritual digest to opted-in WhatsApp subscribers.',
    method: 'GET',
  },
  {
    id: 'festival-email',
    name: 'Festival Email Digest',
    route: '/api/cron/festival-email',
    schedule: '0 7 * * *',
    scheduleHuman: 'Daily at 07:00 UTC',
    category: 'reminders',
    description: 'Sends festival email newsletter digest to subscribed devotees.',
    method: 'GET',
  },

  // ── 2. Panchang & Calendar Engine ──
  {
    id: 'materialize-occurrences',
    name: 'Materialize Calendar Occurrences',
    route: '/api/cron/materialize-occurrences',
    schedule: '0 2 * * *',
    scheduleHuman: 'Daily at 02:00 UTC',
    category: 'calendar',
    description: 'Precomputes 90-day dynamic calendar observance occurrences.',
    method: 'GET',
  },
  {
    id: 'warm-calendar-governance',
    name: 'Warm Calendar Diagnostics',
    route: '/api/cron/warm-calendar-governance-diagnostics',
    schedule: '45 1 * * *',
    scheduleHuman: 'Daily at 01:45 UTC',
    category: 'calendar',
    description: 'Warms calendar governance caches and runs integrity checks on observance tables.',
    method: 'GET',
  },
  {
    id: 'panchang-revalidate',
    name: 'Panchang Edge Revalidation',
    route: '/api/cron/panchang-revalidate',
    schedule: '31 18 * * *',
    scheduleHuman: 'Daily at 18:31 UTC',
    category: 'calendar',
    description: 'Revalidates cached astronomical Panchang calculations for tomorrow.',
    method: 'GET',
  },
  {
    id: 'calendar-health',
    name: 'Monthly Calendar Health Audit',
    route: '/api/cron/calendar-health',
    schedule: '0 9 1 * *',
    scheduleHuman: '1st of every month at 09:00 UTC',
    category: 'calendar',
    description: 'Deep audit of upcoming month astronomical data, leap months, and sampradaya dates.',
    method: 'GET',
  },
  {
    id: 'verify-festival-dates',
    name: 'Verify Festival Dates & Overrides',
    route: '/api/cron/verify-festival-dates',
    schedule: '0 8 5 * *',
    scheduleHuman: '5th of every month at 08:00 UTC',
    category: 'calendar',
    description: 'Cross-verifies council overrides and high-confidence materialised festivals.',
    method: 'GET',
  },

  // ── 3. AI & Content Generation ──
  {
    id: 'generate-daily-quiz',
    name: 'Generate Daily Quiz',
    route: '/api/quiz/generate-daily',
    schedule: '15 0 * * *',
    scheduleHuman: 'Daily at 00:15 UTC',
    category: 'ai',
    description: 'Pre-generates daily multiple-choice spiritual quizzes across traditions.',
    method: 'GET',
  },
  {
    id: 'generate-dharm-veer',
    name: 'Generate Dharm Veer Challenge',
    route: '/api/cron/generate-dharm-veer',
    schedule: '0 1 * * *',
    scheduleHuman: 'Daily at 01:00 UTC',
    category: 'ai',
    description: 'Creates daily ethical dilemma scenarios and reflective choices.',
    method: 'GET',
  },
  {
    id: 'digest-generate',
    name: 'Generate Daily Seeker Digest',
    route: '/api/digest/generate',
    schedule: '0 23 * * *',
    scheduleHuman: 'Daily at 23:00 UTC',
    category: 'ai',
    description: 'Synthesizes tomorrow’s personalised morning reflection digest for active users.',
    method: 'GET',
  },

  // ── 4. System Maintenance & Cleanup ──
  {
    id: 'reset-leaderboard',
    name: 'Reset Seva Leaderboard',
    route: '/api/cron/reset-leaderboard',
    schedule: '30 0 * * *',
    scheduleHuman: 'Daily at 00:30 UTC',
    category: 'maintenance',
    description: 'Calculates karma ranks and resets daily leaderboards.',
    method: 'GET',
  },
  {
    id: 'weekly-summary',
    name: 'Weekly Sadhana Summary',
    route: '/api/cron/weekly-summary',
    schedule: '0 1 * * 0',
    scheduleHuman: 'Every Sunday at 01:00 UTC',
    category: 'maintenance',
    description: 'Generates weekly practice summaries, streak badges, and milestone insights.',
    method: 'GET',
  },
  {
    id: 'sync-live-darshans',
    name: 'Sync Live Darshan Streams',
    route: '/api/cron/sync-live-darshans',
    schedule: '0 5 * * *',
    scheduleHuman: 'Daily at 05:00 UTC',
    category: 'maintenance',
    description: 'Verifies active YouTube streams and RTMP health for partnered temples.',
    method: 'GET',
  },
  {
    id: 'check-live-darshans',
    name: 'Check Darshan Heartbeat',
    route: '/api/cron/check-live-darshans',
    schedule: '30 5 * * *',
    scheduleHuman: 'Daily at 05:30 UTC',
    category: 'maintenance',
    description: 'Heartbeat probe on live feeds, marking offline streams automatically.',
    method: 'GET',
  },
  {
    id: 'push-receipt-check',
    name: 'Expo Push Receipt Auditor',
    route: '/api/cron/push-receipt-check',
    schedule: '20 10 * * *',
    scheduleHuman: 'Daily at 10:20 UTC',
    category: 'maintenance',
    description: 'Audits delivery receipts from Expo push and prunes dead device tokens.',
    method: 'GET',
  },
  {
    id: 'purge-deleted-accounts',
    name: 'Purge Deleted Accounts (GDPR/DPDP)',
    route: '/api/cron/purge-deleted-accounts',
    schedule: '15 9 * * *',
    scheduleHuman: 'Daily at 09:15 UTC',
    category: 'maintenance',
    description: 'Permanently purges soft-deleted user data after 30-day statutory cooling window.',
    method: 'GET',
  },
  {
    id: 'journal-anniversary',
    name: 'Journal Anniversary Check',
    route: '/api/cron/journal-anniversary',
    schedule: '0 8 * * *',
    scheduleHuman: 'Daily at 08:00 UTC',
    category: 'maintenance',
    description: 'Surfaces past journal reflections for contemplative review.',
    method: 'GET',
  },
];

export async function recordCronTelemetry(params: {
  route: string;
  statusCode: number;
  durationMs: number;
  error?: unknown;
  responseData?: unknown;
  triggeredBy?: "vercel_cron" | "admin_manual";
}): Promise<void> {
  const { route, statusCode, durationMs, error, responseData, triggeredBy = "vercel_cron" } = params;

  const isOk = statusCode >= 200 && statusCode < 300;
  const severity: "P0" | "P1" | "P2" | "P3" = isOk ? "P3" : statusCode >= 500 ? "P1" : "P2";
  const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : (statusCode >= 400 ? `HTTP ${statusCode}` : undefined);

  let safeContext: Record<string, string | number | boolean | null> = {
    status_code: statusCode,
    duration_ms: durationMs,
    triggered_by: triggeredBy,
  };

  if (responseData && typeof responseData === "object") {
    try {
      const respObj = responseData as Record<string, unknown>;
      if ("sent" in respObj && typeof respObj.sent === "number") safeContext.sent_count = respObj.sent;
      if ("inserted" in respObj && typeof respObj.inserted === "number") safeContext.inserted_count = respObj.inserted;
      if ("push_targets" in respObj && typeof respObj.push_targets === "number") safeContext.push_targets = respObj.push_targets;
      if ("message" in respObj && typeof respObj.message === "string") safeContext.response_message = respObj.message.slice(0, 200);
      if ("error" in respObj && typeof respObj.error === "string") safeContext.response_error = respObj.error.slice(0, 200);
    } catch {
      // ignore
    }
  }

  const now = new Date().toISOString();
  const eventPayload = {
    timestamp: now,
    domain: "cron" as const,
    severity,
    route,
    latency_ms: durationMs,
    error_code: isOk ? undefined : String(statusCode),
    error_message: errorMessage,
    context: safeContext,
  };

  // Immediate durable insert to Supabase so that status matrix reflects changes instantly
  try {
    const supabase = createAdminClient() as any;
    await supabase.from("monitoring_events").insert([eventPayload]);
  } catch (err) {
    console.warn("[Cron Telemetry] Immediate insert warning:", err);
  }

  emitEvent(eventPayload);
}

export async function fetchCronStatusMatrix(): Promise<CronStatusSummary[]> {
  const supabase = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: eventsData } = await supabase
    .from('monitoring_events')
    .select('id, timestamp, route, latency_ms, error_code, error_message, severity, context')
    .eq('domain', 'cron')
    .order('timestamp', { ascending: false })
    .limit(1000);

  const events = (eventsData ?? []) as Array<MonitoringEvent & { id?: string }>;
  const eventsByRoute = new Map<string, Array<MonitoringEvent & { id?: string }>>();

  for (const event of events) {
    if (!event.route) continue;
    const base = event.route.split('?')[0];
    const list = eventsByRoute.get(base) ?? [];
    list.push(event);
    eventsByRoute.set(base, list);
    if (event.route !== base) {
      const exact = eventsByRoute.get(event.route) ?? [];
      exact.push(event);
      eventsByRoute.set(event.route, exact);
    }
  }

  return CRON_CATALOGUE.map((cron) => {
    const cronEvents = eventsByRoute.get(cron.route) || eventsByRoute.get(cron.route.split('?')[0]) || [];
    
    const recentExecutions: CronExecutionTelemetry[] = cronEvents.slice(0, 10).map((e) => {
      const statusCode = Number(e.context?.status_code ?? (e.severity === 'P3' ? 200 : Number(e.error_code) || 500));
      const isOk = statusCode >= 200 && statusCode < 300;
      return {
        id: e.id,
        route: cron.route,
        timestamp: e.timestamp,
        statusCode,
        durationMs: e.latency_ms ?? Number(e.context?.duration_ms ?? 0),
        status: isOk ? 'healthy' : statusCode >= 500 ? 'error' : 'warning',
        errorMessage: e.error_message ?? (typeof e.context?.response_error === 'string' ? e.context.response_error : null),
        errorCode: e.error_code ?? null,
        payloadSummary: e.context as Record<string, unknown>,
        triggeredBy: (e.context?.triggered_by as 'vercel_cron' | 'admin_manual') || 'vercel_cron',
      };
    });

    const lastExecution = recentExecutions[0] ?? null;
    const last24hRuns = cronEvents.filter((e) => e.timestamp >= twentyFourHoursAgo);
    const totalRuns24h = last24hRuns.length;
    const successfulRuns24h = last24hRuns.filter((e) => {
      const code = Number(e.context?.status_code ?? (e.severity === 'P3' ? 200 : 500));
      return code >= 200 && code < 300;
    }).length;
    const failedRuns24h = totalRuns24h - successfulRuns24h;

    const successRate24h = totalRuns24h > 0 ? Math.round((successfulRuns24h / totalRuns24h) * 100) : 100;

    // Generate 24 hourly buckets (from 23 hours ago to current hour)
    const nowMs = Date.now();
    const hourlyBreakdown24h: HourlyBucket24h[] = [];
    for (let i = 23; i >= 0; i--) {
      const startMs = nowMs - (i + 1) * 3600 * 1000;
      const endMs = nowMs - i * 3600 * 1000;
      const startIso = new Date(startMs).toISOString();
      const endIso = new Date(endMs).toISOString();
      const hourDate = new Date(endMs);
      const hourUtc = hourDate.getUTCHours();
      const hourLabel = `${String(hourUtc).padStart(2, '0')}:00`;

      const bucketEvents = cronEvents.filter((e) => e.timestamp >= startIso && e.timestamp < endIso);
      const count = bucketEvents.length;
      let errorCount = 0;
      let totalDuration = 0;

      for (const e of bucketEvents) {
        const code = Number(e.context?.status_code ?? (e.severity === 'P3' ? 200 : 500));
        if (code < 200 || code >= 300) errorCount++;
        totalDuration += (e.latency_ms ?? Number(e.context?.duration_ms ?? 0));
      }

      const status: 'healthy' | 'error' | 'none' = count === 0 ? 'none' : errorCount > 0 ? 'error' : 'healthy';
      const avgDurationMs = count > 0 ? Math.round(totalDuration / count) : 0;

      hourlyBreakdown24h.push({
        hourLabel,
        hourUtc,
        startIso,
        count,
        errorCount,
        status,
        avgDurationMs,
      });
    }

    return {
      ...cron,
      lastExecution,
      recentExecutions,
      successRate24h,
      totalRuns24h,
      successfulRuns24h,
      failedRuns24h,
      hourlyBreakdown24h,
    };
  });
}
