export const dynamic = 'force-dynamic';

import { generateHealthReport } from '@/lib/monitoring/aggregation';
import type { MonitoringEvent } from '@/lib/monitoring/events';
import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import { resolveContentReport } from './actions';

interface Props {
  searchParams?: Promise<{ aiReportStatus?: string }>;
}

/** Columns rendered in the AI Content Reports section. */
interface ContentReport {
  id: string;
  status: string;
  reason: string;
  metadata: Record<string, unknown> | null;
  reported_by: string | null;
  created_at: string;
}

export default async function MonitoringPage({ searchParams }: Props) {
  // Middleware (src/middleware.ts) enforces HMAC-cookie auth on all /admin/* routes
  // and redirects unauthenticated visitors to /admin/login — no redundant check needed here.
  const resolvedSearchParams = await searchParams;

  let recentEvents: MonitoringEvent[] = [];
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from('monitoring_events')
      .select('timestamp, severity, domain, route, provider, model, fallback_used, latency_ms, error_code, error_message, request_id, trace_id, context')
      .order('timestamp', { ascending: false })
      .limit(500);
    recentEvents = (data ?? []) as MonitoringEvent[];
  } catch {
    recentEvents = [];
  }

  const aiReportStatus = resolvedSearchParams?.aiReportStatus ?? 'pending';

  let aiReportsQuery = createAdminClient()
    .from('content_reports')
    .select('id, status, reason, metadata, reported_by, created_at')
    .eq('content_type', 'ai_chat_response')
    .order('created_at', { ascending: false })
    .limit(100);

  if (aiReportStatus !== 'all') {
    aiReportsQuery = aiReportsQuery.eq('status', aiReportStatus);
  }

  let aiReports: ContentReport[] = [];
  try {
    const { data } = await aiReportsQuery;
    aiReports = (data ?? []) as ContentReport[];
  } catch (err) {
    console.error('Failed to fetch AI reports', err);
  }

  const report = generateHealthReport(recentEvents);

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Operational Monitoring Window</h1>
        <p className="text-sm text-gray-500">Last updated: {new Date(report.lastUpdated).toLocaleString()}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Provider Health */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">AI / Provider Health</h2>
          {report.providers.length === 0 ? (
            <p className="text-sm text-gray-500">No circuit breaker data available yet.</p>
          ) : (
            <div className="space-y-4">
              {report.providers.map(p => (
                <div key={p.provider} className="flex flex-col p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{p.provider}</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      p.circuitState.state === 'CLOSED' ? 'bg-green-100 text-green-700' :
                      p.circuitState.state === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.circuitState.state}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>Failures: {p.circuitState.consecutiveFailures}</span>
                    <span>Fallbacks triggered: {p.fallbackCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Config Drift Analysis */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Configuration Drift</h2>
          {report.driftWarnings.length === 0 ? (
            <div className="p-4 bg-green-50 text-green-800 rounded-md">
              ✅ Environment configuration is stable.
            </div>
          ) : (
            <div className="space-y-4">
              {report.driftWarnings.map((warning, idx) => (
                <div key={idx} className={`p-4 rounded-md border-l-4 ${warning.severity === 'P1' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                  <p className="font-bold text-sm mb-1">{warning.issue}</p>
                  <p className="text-sm text-gray-600">Action: {warning.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Route Health */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Route Health & TTS Cache</h2>
          <div className="mb-6 p-4 bg-blue-50 text-blue-900 rounded-md flex justify-between items-center">
            <span className="font-medium">TTS Cache Hits</span>
            <span className="text-lg font-bold">{report.ttsCacheHits} / {report.ttsTotal}</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2">Route</th>
                <th className="pb-2 text-right">Reqs</th>
                <th className="pb-2 text-right">Err%</th>
                <th className="pb-2 text-right">Latency</th>
              </tr>
            </thead>
            <tbody>
              {report.routes.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-gray-500">No route data.</td></tr>
              ) : (
                report.routes.map(r => (
                  <tr key={r.route} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-700">{r.route}</td>
                    <td className="py-3 text-right">{r.totalRequests}</td>
                    <td className="py-3 text-right font-bold" style={{ color: r.errorRate > 0.1 ? 'red' : 'inherit' }}>
                      {(r.errorRate * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 text-right">{r.avgLatencyMs}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* Active Incidents & Fallback Timeline */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-semibold mb-4 text-red-700 flex items-center">
          <span className="mr-2">🚨</span> Active Incidents & Fallbacks (P0/P1)
        </h2>
        {report.activeIncidents.length === 0 ? (
          <p className="text-sm text-gray-500">No critical incidents in the current window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Domain</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {report.activeIncidents.map((incident, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 text-gray-500">{new Date(incident.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 font-medium">{incident.domain}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${incident.severity === 'P0' ? 'bg-red-200 text-red-900' : 'bg-orange-200 text-orange-900'}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="py-3 text-red-800 break-words max-w-md">{incident.error_message ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AI Content Reports & Moderation — content_reports WHERE status = 'pending' */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="mr-2">🤖</span> AI Content Reports
            <span className="ml-2 text-sm font-normal text-gray-400">(content_reports · status=pending)</span>
          </h2>
          <div className="flex gap-2">
            <Link
              href="?aiReportStatus=pending"
              className={`px-3 py-1 text-sm rounded-md transition-colors ${aiReportStatus === 'pending' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              New / Pending
            </Link>
            <Link
              href="?aiReportStatus=all"
              className={`px-3 py-1 text-sm rounded-md transition-colors ${aiReportStatus === 'all' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All Reports
            </Link>
          </div>
        </div>

        {aiReports.length === 0 ? (
          <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md">No {aiReportStatus} reports found.</p>
        ) : (
          <div className="space-y-4">
            {aiReports.map(r => {
              const meta = (r.metadata ?? {}) as Record<string, string>;
              const userPrompt = meta.user_prompt ?? 'N/A';
              const aiText = meta.ai_text ?? 'N/A';

              return (
                <div key={r.id} className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 font-mono" title="Reporter ID">
                        ID: {r.reported_by?.slice(0, 8) ?? '—'}…
                      </span>
                      <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    {r.status === 'pending' && (
                      <form action={resolveContentReport.bind(null, r.id)}>
                        <button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors font-medium">
                          Mark Resolved
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Reason</p>
                      <p className="text-red-700 bg-red-50 p-2 rounded inline-block">{r.reason}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Context</p>
                      <p className="text-gray-600 text-xs mb-1">
                        <span className="font-medium">Prompt:</span>{' '}
                        {userPrompt.length > 80 ? userPrompt.slice(0, 80) + '…' : userPrompt}
                      </p>
                      <p className="text-gray-600 text-xs">
                        <span className="font-medium">AI Res:</span>{' '}
                        {aiText.length > 150 ? aiText.slice(0, 150) + '…' : aiText}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
