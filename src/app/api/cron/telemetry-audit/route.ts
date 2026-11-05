import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { postSlackOperationalAlert } from '@/lib/slack-alerts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const hours = Math.max(1, Math.min(48, parseInt(url.searchParams.get('hours') || '4', 10)));
  const isTest = url.searchParams.get('test') === 'true';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (isTest) {
    const alertSent = await postSlackOperationalAlert({
      title: 'Telemetry Audit: Vercel Cloud Cron Connectivity Test',
      desc: 'Automated test from /api/cron/telemetry-audit. 24/7 Vercel Cloud Cron and Slack operations alerts are successfully connected.',
      severity: 'P2',
      domain: 'monitoring',
      route: '/api/cron/telemetry-audit',
      href: '/admin/monitoring',
      metadata: { source: 'manual_test_trigger', timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, test: true, alertDispatched: alertSent });
  }

  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  try {
    // 1. Audit Native API Diagnostic Events
    const { data: apiErrors, error: apiErr } = await supabase
      .from('native_api_diagnostic_events')
      .select('endpoint, method, final_status, outcome, duration_ms, received_at')
      .gt('received_at', sinceIso)
      .neq('final_status', 200)
      .order('received_at', { ascending: false })
      .limit(100);

    // 2. Audit Client Crashes
    const { data: clientErrors, error: clientErr } = await supabase
      .from('client_error_events')
      .select('error_name, error_message, route, created_at')
      .gt('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(50);

    // 3. Audit Monitoring Events (P0 / P1 / critical errors)
    const { data: monEvents, error: monErr } = await supabase
      .from('monitoring_events')
      .select('severity, domain, route, error_code, error_message, timestamp')
      .gt('timestamp', sinceIso)
      .in('severity', ['P0', 'P1'])
      .order('timestamp', { ascending: false })
      .limit(50);

    const dbErr = apiErr || clientErr || monErr;
    if (dbErr) {
      const errorMsg = dbErr.message || JSON.stringify(dbErr);
      console.error('[telemetry-audit] Database query error:', errorMsg);
      await postSlackOperationalAlert({
        title: '[P0] Database Query Failure: Telemetry Audit Blocked',
        desc: `Telemetry audit cron was unable to query Supabase tables. Database may be offline, timing out, or PostgREST is failing:\n\`\`\`${errorMsg}\`\`\``,
        severity: 'P0',
        domain: 'monitoring',
        route: '/api/cron/telemetry-audit',
        href: '/admin/monitoring',
        metadata: { error: errorMsg },
      });
      return NextResponse.json({ error: 'Database query failed', details: errorMsg }, { status: 500 });
    }

    const nativeFailures = apiErrors || [];
    const clientCrashes = clientErrors || [];
    const criticalMonEvents = monEvents || [];

    // Categorize server errors (HTTP 5xx) vs client 4xx
    const serverErrors = nativeFailures.filter(
      (e) => (typeof e.final_status === 'number' && e.final_status >= 500) || e.outcome === 'network_timeout'
    );

    const hasCriticalIncidents = serverErrors.length > 0 || clientCrashes.length > 0 || criticalMonEvents.length > 0;

    let alertDispatched = false;

    if (hasCriticalIncidents) {
      const errorHighlights: string[] = [];

      if (serverErrors.length > 0) {
        const grouped = new Map<string, number>();
        for (const err of serverErrors) {
          const k = `${err.method || 'GET'} ${err.endpoint} (HTTP ${err.final_status || 'timeout'})`;
          grouped.set(k, (grouped.get(k) || 0) + 1);
        }
        const top = Array.from(grouped.entries())
          .map(([k, c]) => `• [${c}x] ${k}`)
          .slice(0, 5)
          .join('\n');
        errorHighlights.push(`🚨 *Native Server Failures (5xx / Timeouts):*\n${top}`);
      }

      if (clientCrashes.length > 0) {
        const topCrashes = clientCrashes
          .slice(0, 3)
          .map((c) => `• ${c.error_name} on \`${c.route}\`: ${c.error_message.slice(0, 80)}`)
          .join('\n');
        errorHighlights.push(`💥 *Client UI Crashes:*\n${topCrashes}`);
      }

      if (criticalMonEvents.length > 0) {
        const topMon = criticalMonEvents
          .slice(0, 3)
          .map(
            (m) =>
              `• [${m.severity}] ${m.domain} (${m.route || 'system'}): ${m.error_message?.slice(0, 80) || m.error_code}`
          )
          .join('\n');
        errorHighlights.push(`⚠️ *Critical Operational Events:*\n${topMon}`);
      }

      const severity: 'P0' | 'P1' = serverErrors.length > 0 ? 'P0' : 'P1';

      alertDispatched = await postSlackOperationalAlert({
        title: `Telemetry Audit: ${severity === 'P0' ? 'Critical Outages / Errors' : 'Operational Issues'} Detected`,
        desc: errorHighlights.join('\n\n'),
        severity,
        domain: 'monitoring',
        route: '/api/cron/telemetry-audit',
        href: '/admin/monitoring',
        metadata: {
          windowHours: hours,
          server5xxCount: serverErrors.length,
          totalNativeFailures: nativeFailures.length,
          clientCrashCount: clientCrashes.length,
          criticalMonEventsCount: criticalMonEvents.length,
        },
      });
    }

    // Record audit heartbeat into monitoring_events for durable observability
    try {
      await supabase.from('monitoring_events').insert({
        severity: hasCriticalIncidents ? (serverErrors.length > 0 ? 'P0' : 'P1') : 'P3',
        domain: 'cron',
        route: '/api/cron/telemetry-audit',
        error_code: hasCriticalIncidents ? 'TELEMETRY_ANOMALIES_DETECTED' : 'TELEMETRY_AUDIT_CLEAN',
        error_message: hasCriticalIncidents
          ? `Audit found ${serverErrors.length} 5xx errors, ${clientCrashes.length} crashes, and ${criticalMonEvents.length} critical backend events.`
          : `Telemetry audit clean over last ${hours}h. 0 critical errors found.`,
        context: {
          windowHours: hours,
          alertDispatched,
          totalNativeFailures: nativeFailures.length,
          server5xxCount: serverErrors.length,
          clientCrashCount: clientCrashes.length,
          criticalMonEventsCount: criticalMonEvents.length,
        },
      });
    } catch (insertErr) {
      console.warn('[telemetry-audit] Failed to record heartbeat row:', insertErr);
    }

    return NextResponse.json({
      success: true,
      since: sinceIso,
      windowHours: hours,
      alertDispatched,
      summary: {
        clean: !hasCriticalIncidents,
        nativeFailuresTotal: nativeFailures.length,
        nativeServer5xx: serverErrors.length,
        clientCrashes: clientCrashes.length,
        criticalBackendEvents: criticalMonEvents.length,
      },
    });
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[telemetry-audit] Cron crashed:', errorMsg);
    await postSlackOperationalAlert({
      title: '[P0] Database Connection Failed: Telemetry Audit Crashed',
      desc: `Critical exception during telemetry audit cron execution:\n\`\`\`${errorMsg}\`\`\``,
      severity: 'P0',
      domain: 'monitoring',
      route: '/api/cron/telemetry-audit',
      href: '/admin/monitoring',
      metadata: { error: errorMsg },
    });
    return NextResponse.json({ error: 'Telemetry audit crashed', details: errorMsg }, { status: 500 });
  }
}
