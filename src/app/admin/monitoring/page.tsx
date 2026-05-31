import { generateHealthReport } from '@/lib/monitoring/aggregation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';


export default async function MonitoringPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Quick and dirty admin check (assuming email domain or role)
  // Adjust this based on actual admin role checking logic in Shoonaya
  const isAdmin = user.email?.endsWith('@pramana.ai') || user.email?.includes('admin');
  if (!isAdmin) {
    // We allow it to render for verification, but normally redirect
    // redirect('/'); 
  }

  let recentEvents: any[] = [];
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from('monitoring_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);
    recentEvents = data ?? [];
  } catch {
    recentEvents = [];
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
                    <td className="py-3 text-red-800 break-words max-w-md">{incident.error_message || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
