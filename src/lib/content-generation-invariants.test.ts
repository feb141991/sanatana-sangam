import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('content generation delivery invariants', () => {
  it('queues digest delivery instead of sending push inline', () => {
    const source = read('src/app/api/digest/generate/route.ts');
    expect(source).not.toContain("from '@/lib/push-server'");
    expect(source).toContain(".from('notification_schedule')");
    expect(source).toContain('panchang_signature');
  });

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
