import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Founder decision 2026-11-12: one mood check-in a day, not two. Production, 14 days to 2026-11-12: 325 mood pushes
 * (164 evening 'mood' + 161 midday 'mood_checkin'); on 123 of 202 user-days a person received BOTH; only 6 check-ins
 * were completed by 4 people. The evening check-in is kept (4 of 164 followed by a check-in within 24 h against 2 of
 * 161 for midday). The midday producer is retired.
 */
const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')) as { crons: Array<{ path: string }> };

describe('one mood check-in a day', () => {
  it('schedules exactly one mood cron, the evening one', () => {
    const mood = config.crons.filter((cron) => cron.path.startsWith('/api/cron/mood-reminder'));
    expect(mood.map((cron) => cron.path)).toEqual(['/api/cron/mood-reminder-evening']);
  });

  it('keeps no midday mood route or telemetry entry', () => {
    expect(fs.existsSync(path.join(root, 'src/app/api/cron/mood-reminder'))).toBe(false);
    const telemetry = fs.readFileSync(path.join(root, 'src/lib/monitoring/cron-telemetry.ts'), 'utf8');
    expect(telemetry).not.toContain("'/api/cron/mood-reminder'");
    expect(telemetry).not.toContain('mood-reminder-morning');
  });
});
