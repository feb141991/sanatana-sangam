import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

/** Every non-test TypeScript source under src/, relative paths, skipping generated output and dependencies. */
function sourceFiles(dir = 'src'): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === 'graphify-out' || entry.name === 'node_modules') continue;
      out.push(...sourceFiles(relative));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) && !relative.includes('/__tests__/')) {
      out.push(relative);
    }
  }
  return out;
}

describe('the daily digest stays retired (2026-11-10)', () => {
  it('has no cron, no route and no catalogue entry', () => {
    const config = JSON.parse(read('vercel.json')) as { crons: Array<{ path: string }> };
    expect(config.crons.some((cron) => cron.path.startsWith('/api/digest'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'src/app/api/digest'))).toBe(false);
    expect(read('src/lib/monitoring/cron-telemetry.ts')).not.toContain('/api/digest');
  });

  it('is not produced by any source: nothing outside the delivery policy names the daily_digest type', () => {
    const allowed = new Set(['src/lib/notification-delivery-policy.ts', 'src/types/database.generated.ts']);
    const offenders = sourceFiles().filter((file) => !allowed.has(file) && /daily_digest|daily-digest:/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('refuses a queued digest row at delivery', () => {
    expect(read('src/lib/notification-delivery-policy.ts')).toContain('RETIRED_NOTIFICATION_TYPES: readonly string[] = ["daily_digest"]');
    expect(read('src/lib/notification-delivery-policy.ts')).toContain('notification_type_retired');
  });
});

describe('content generation delivery invariants', () => {

  it('never auto-approves newly generated Dharm Veer prose', () => {
    const source = read('src/app/api/cron/generate-dharm-veer/route.ts');
    expect(source).not.toContain("reviewStatus: 'approved'");
    expect(source).toContain("reviewStatus: 'pending_review'");
  });

  it('runs Dharm Veer weekly and removes broken email and WhatsApp schedules', () => {
    const config = JSON.parse(read('vercel.json')) as { crons: Array<{ path: string; schedule: string }> };
    expect(config.crons.find((cron) => cron.path === '/api/cron/generate-dharm-veer')?.schedule).toBe('0 1 * * 1');
    expect(config.crons.some((cron) => cron.path === '/api/cron/festival-email')).toBe(false);
    expect(config.crons.some((cron) => cron.path === '/api/whatsapp/send-daily')).toBe(false);
  });
});
