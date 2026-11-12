import { describe, expect, it } from 'vitest';
import { buildSgpcEditionReminder } from './sgpc-edition-reminder';

describe('SGPC edition reminder', () => {
  const edition = { edition: 558, to: '2027-03-13' };
  it('is ok more than 60 days before the edition ends', () => {
    expect(buildSgpcEditionReminder(edition, new Date('2026-11-11T12:00:00Z')).state).toBe('ok');
  });
  it('is due soon on the 60-day boundary', () => {
    const result = buildSgpcEditionReminder(edition, new Date('2027-01-12T12:00:00Z'));
    expect(result.state).toBe('due_soon');
    expect(result.message).toContain('Samvat N+1 starts 14 March');
  });
  it('is overdue after the edition ends', () => {
    expect(buildSgpcEditionReminder(edition, new Date('2027-03-14T12:00:00Z')).state).toBe('overdue');
  });
  it('fails closed with no loaded edition', () => {
    expect(buildSgpcEditionReminder(null).message).toBe('Sikh dates are not shown; ingest the SGPC calendar');
  });
});
