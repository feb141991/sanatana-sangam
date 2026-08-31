export const DHARM_VEER_RUNWAY = {
  lowAlert: 30,
  healthy: 60,
  target: 90,
} as const;

export function evaluateDharmVeerRunway(approvedCount: number): {
  shouldGenerate: boolean;
  alert: boolean;
} {
  return {
    shouldGenerate: approvedCount < DHARM_VEER_RUNWAY.healthy,
    alert: approvedCount < DHARM_VEER_RUNWAY.lowAlert,
  };
}

export function getQuizJobTerminalState(
  outcome: 'generated' | 'fallback' | 'failed',
  attemptCount: number,
  maxAttempts: number,
): 'generated' | 'fallback' | 'failed' | 'pending' {
  if (outcome !== 'failed') return outcome;
  return attemptCount < maxAttempts ? 'pending' : 'failed';
}
