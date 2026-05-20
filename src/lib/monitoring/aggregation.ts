import { _eventSink, MonitoringEvent } from './events';
import { getAllCircuitStates, CircuitBreakerState } from './circuit-breaker';

export interface RouteHealth {
  route: string;
  totalRequests: number;
  errors: number;
  avgLatencyMs: number;
  errorRate: number;
}

export interface ProviderHealth {
  provider: string;
  circuitState: CircuitBreakerState;
  fallbackCount: number;
}

export interface AggregatedHealthReport {
  activeIncidents: MonitoringEvent[];
  routes: RouteHealth[];
  providers: ProviderHealth[];
  ttsCacheHits: number;
  ttsTotal: number;
  lastUpdated: string;
}

/**
 * Generates an aggregated health report from the event sink and circuit breakers.
 * This should be called by the admin monitoring window.
 */
export function generateHealthReport(): AggregatedHealthReport {
  const activeIncidents = _eventSink.filter(e => e.severity === 'P0' || e.severity === 'P1').slice(0, 50);
  
  const routeStats = new Map<string, { count: number; errors: number; totalLatency: number }>();
  let ttsCacheHits = 0;
  let ttsTotal = 0;
  
  const providerFallbacks = new Map<string, number>();

  for (const event of _eventSink) {
    // Route Stats
    if (event.route) {
      if (!routeStats.has(event.route)) {
        routeStats.set(event.route, { count: 0, errors: 0, totalLatency: 0 });
      }
      const stats = routeStats.get(event.route)!;
      stats.count++;
      if (event.severity === 'P0' || event.severity === 'P1' || event.severity === 'P2') {
        stats.errors++;
      }
      if (event.latency_ms) {
        stats.totalLatency += event.latency_ms;
      }
    }
    
    // TTS Cache
    if (event.domain === 'tts') {
      ttsTotal++;
      if (event.context?.status === 'cached') {
        ttsCacheHits++;
      }
    }
    
    // Fallback tracking
    if (event.fallback_used && event.provider) {
      providerFallbacks.set(event.provider, (providerFallbacks.get(event.provider) || 0) + 1);
    }
  }

  const routes: RouteHealth[] = Array.from(routeStats.entries()).map(([route, stats]) => ({
    route,
    totalRequests: stats.count,
    errors: stats.errors,
    avgLatencyMs: stats.count > 0 ? Math.round(stats.totalLatency / stats.count) : 0,
    errorRate: stats.count > 0 ? Number((stats.errors / stats.count).toFixed(2)) : 0,
  }));

  const circuitStates = getAllCircuitStates();
  const providers: ProviderHealth[] = Object.entries(circuitStates).map(([provider, state]) => ({
    provider,
    circuitState: state,
    fallbackCount: providerFallbacks.get(provider) || 0,
  }));

  return {
    activeIncidents,
    routes,
    providers,
    ttsCacheHits,
    ttsTotal,
    lastUpdated: new Date().toISOString(),
  };
}
