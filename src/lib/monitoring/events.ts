import { createServerSupabaseClient } from '@/lib/supabase-server';

export type SeverityLevel = 'P0' | 'P1' | 'P2' | 'P3';
export type DomainCategory = 'app' | 'ai' | 'tts' | 'translation' | 'auth' | 'notifications' | 'cron' | 'storage';

export interface MonitoringEvent {
  timestamp: string;
  severity: SeverityLevel;
  domain: DomainCategory;
  route?: string;
  provider?: string;
  model?: string;
  fallback_used?: boolean;
  latency_ms?: number;
  error_code?: string;
  error_message?: string;
  request_id?: string;
  trace_id?: string;
  /** Safe context fields. Do not log PII here. */
  context?: Record<string, string | number | boolean | null>;
}

// Global in-memory sink for events (in production, this would pipe to Datadog/CloudWatch)
export const _eventSink: MonitoringEvent[] = [];
let _flushBuffer: MonitoringEvent[] = [];
let _flushTimeout: NodeJS.Timeout | null = null;

async function flushToSupabase() {
  const batch = [..._flushBuffer];
  _flushBuffer = [];
  
  if (batch.length === 0) return;

  try {
    const supabase = await createServerSupabaseClient();
    // This assumes a 'monitoring_events' table exists. 
    // If it doesn't, this will fail gracefully without crashing the app.
    const { error } = await supabase.from('monitoring_events').insert(batch);
    if (error && error.code !== '42P01') { // Ignore table not found error for now
      console.warn('[Monitoring] Failed to flush to durable backend:', error.message);
    }
  } catch (err) {
    // Fire and forget
  }
}

/**
 * Emit a structured monitoring event.
 */
export function emitEvent(event: Omit<MonitoringEvent, 'timestamp'>): void {
  const fullEvent: MonitoringEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  
  // In a real app, this would be an async fire-and-forget to a logging service.
  // For the monitoring window, we keep a rolling buffer of 1000 events.
  _eventSink.unshift(fullEvent);
  if (_eventSink.length > 1000) {
    _eventSink.pop();
  }

  // Add to durable flush buffer
  _flushBuffer.push(fullEvent);
  if (!_flushTimeout) {
    _flushTimeout = setTimeout(() => {
      _flushTimeout = null;
      flushToSupabase().catch(() => {});
    }, 5000); // Flush every 5 seconds
  }

  // Print P0/P1 to console immediately
  if (event.severity === 'P0' || event.severity === 'P1') {
    console.error(`[${event.severity}] [${event.domain}] ${event.error_message || 'Critical Event'}`, event);
  } else if (event.severity === 'P2') {
    console.warn(`[${event.severity}] [${event.domain}] ${event.error_message || 'Warning Event'}`);
  }
}

/**
 * Helper to emit a standard error event.
 */
export function emitError(
  domain: DomainCategory,
  error: any,
  severity: SeverityLevel = 'P2',
  context?: Partial<MonitoringEvent>
): void {
  const message = error instanceof Error ? error.message : String(error);
  const code = error?.code || error?.status || 'UNKNOWN_ERROR';
  
  emitEvent({
    severity,
    domain,
    error_message: message,
    error_code: String(code),
    ...context,
  });
}
