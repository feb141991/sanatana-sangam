import { emitEvent } from './events';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;     // How many consecutive failures before opening
  cooldownMs: number;           // How long to wait before trying again (half-open)
}

export interface CircuitBreakerState {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastFailureReason: string | null;
  lastSuccessTime: number | null;
}

const _breakers = new Map<string, CircuitBreakerState>();

/**
 * Ensures a circuit breaker exists for the given provider/service key.
 */
function getBreaker(key: string): CircuitBreakerState {
  if (!_breakers.has(key)) {
    _breakers.set(key, {
      state: 'CLOSED',
      consecutiveFailures: 0,
      lastFailureTime: null,
      lastFailureReason: null,
      lastSuccessTime: null,
    });
  }
  return _breakers.get(key)!;
}

/**
 * Check if a provider's circuit is open. If it is half-open (cooldown passed),
 * it returns false so a test request can be made.
 */
export function isCircuitOpen(key: string, config: CircuitBreakerConfig): boolean {
  const breaker = getBreaker(key);
  
  if (breaker.state === 'CLOSED') {
    return false;
  }
  
  if (breaker.state === 'OPEN') {
    const now = Date.now();
    if (breaker.lastFailureTime && (now - breaker.lastFailureTime > config.cooldownMs)) {
      breaker.state = 'HALF_OPEN';
      emitEvent({
        severity: 'P2',
        domain: 'ai',
        provider: key,
        error_message: `Circuit breaker transitioned to HALF_OPEN for ${key}`,
        context: { action: 'circuit_half_open' }
      });
      return false; // Allow a test request
    }
    return true; // Still open
  }
  
  // HALF_OPEN
  return false;
}

/**
 * Record a successful request. This closes the circuit and resets failures.
 */
export function recordSuccess(key: string): void {
  const breaker = getBreaker(key);
  breaker.lastSuccessTime = Date.now();
  breaker.consecutiveFailures = 0;
  
  if (breaker.state !== 'CLOSED') {
    breaker.state = 'CLOSED';
    emitEvent({
      severity: 'P2',
      domain: 'ai',
      provider: key,
      error_message: `Circuit breaker CLOSED (recovered) for ${key}`,
      context: { action: 'circuit_closed' }
    });
  }
}

/**
 * Record a failure. If the threshold is reached, open the circuit.
 */
export function recordFailure(key: string, reason: string, config: CircuitBreakerConfig): void {
  const breaker = getBreaker(key);
  breaker.consecutiveFailures += 1;
  breaker.lastFailureTime = Date.now();
  breaker.lastFailureReason = reason;

  if (breaker.state === 'HALF_OPEN' || breaker.consecutiveFailures >= config.failureThreshold) {
    if (breaker.state !== 'OPEN') {
      breaker.state = 'OPEN';
      emitEvent({
        severity: 'P1',
        domain: 'ai',
        provider: key,
        error_message: `Circuit breaker TRIPPED (OPEN) for ${key}. Reason: ${reason}`,
        context: { action: 'circuit_open', failures: breaker.consecutiveFailures }
      });
    }
  }
}

/**
 * Extract all circuit breaker states for the dashboard.
 */
export function getAllCircuitStates(): Record<string, CircuitBreakerState> {
  const result: Record<string, CircuitBreakerState> = {};
  for (const [key, state] of _breakers.entries()) {
    result[key] = { ...state };
  }
  return result;
}
