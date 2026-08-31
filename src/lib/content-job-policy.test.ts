import { describe, expect, it } from 'vitest';

import {
  DHARM_VEER_RUNWAY,
  evaluateDharmVeerRunway,
  getQuizJobTerminalState,
} from '@/lib/content-job-policy';

describe('content job policy', () => {
  it('generates only below the approved Dharm Veer runway', () => {
    expect(evaluateDharmVeerRunway(DHARM_VEER_RUNWAY.healthy)).toEqual({ shouldGenerate: false, alert: false });
    expect(evaluateDharmVeerRunway(DHARM_VEER_RUNWAY.healthy - 1).shouldGenerate).toBe(true);
    expect(evaluateDharmVeerRunway(DHARM_VEER_RUNWAY.lowAlert - 1).alert).toBe(true);
  });

  it('retries quiz failures only while attempts remain', () => {
    expect(getQuizJobTerminalState('failed', 1, 3)).toBe('pending');
    expect(getQuizJobTerminalState('failed', 3, 3)).toBe('failed');
    expect(getQuizJobTerminalState('fallback', 1, 3)).toBe('fallback');
  });
});
