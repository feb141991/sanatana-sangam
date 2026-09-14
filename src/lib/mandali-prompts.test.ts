import { describe, expect, it } from 'vitest';

import {
  getMandaliPromptDate,
  localizeMandaliPrompt,
  selectMandaliPromptForDate,
  selectMandaliPromptForObservanceOrDate,
  type MandaliPromptText,
} from './mandali-prompts';

const PROMPTS: MandaliPromptText[] = [
  { id: 'c', text_en: 'Third', text_hi: 'तीसरा', text_pa: null },
  { id: 'a', text_en: 'First', text_hi: 'पहला', text_pa: 'ਪਹਿਲਾ' },
  { id: 'b', text_en: 'Second', text_hi: null, text_pa: null },
  { id: 'ekadashi-1', text_en: 'Who is fasting for Ekadashi today?', text_hi: 'आज एकादशी का व्रत कौन रख रहा है?', text_pa: null, observance_tag: 'ekadashi' },
];

describe('Mandali prompt rotation', () => {
  it('uses an explicit UTC date boundary', () => {
    expect(getMandaliPromptDate(new Date('2026-09-14T23:59:59.999Z'))).toBe('2026-09-14');
    expect(getMandaliPromptDate(new Date('2026-09-15T00:00:00.000Z'))).toBe('2026-09-15');
  });

  it('selects deterministically regardless of database row order', () => {
    const date = '2026-09-14';
    expect(selectMandaliPromptForDate(PROMPTS, date)?.id).toBe(
      selectMandaliPromptForDate([...PROMPTS].reverse(), date)?.id,
    );
  });

  it('returns null for an empty pool or invalid date', () => {
    expect(selectMandaliPromptForDate([], '2026-09-14')).toBeNull();
    expect(selectMandaliPromptForDate(PROMPTS, 'invalid')).toBeNull();
  });

  it('uses the viewer language and falls back to English', () => {
    expect(localizeMandaliPrompt(PROMPTS[1], 'hi')).toBe('पहला');
    expect(localizeMandaliPrompt(PROMPTS[1], 'pa')).toBe('ਪਹਿਲਾ');
    expect(localizeMandaliPrompt(PROMPTS[2], 'hi')).toBe('Second');
    expect(localizeMandaliPrompt(PROMPTS[1], 'fr')).toBe('First');
  });

  it('prioritizes matching observance tag when an observance is active', () => {
    const selected = selectMandaliPromptForObservanceOrDate(PROMPTS, '2026-09-14', ['ekadashi']);
    expect(selected?.id).toBe('ekadashi-1');
    expect(selected?.observance_tag).toBe('ekadashi');
  });

  it('falls back to general rotation when no observance matches', () => {
    const selected = selectMandaliPromptForObservanceOrDate(PROMPTS, '2026-09-14', []);
    expect(['a', 'b', 'c']).toContain(selected?.id);
    expect(selected?.observance_tag).toBeUndefined();
  });
});
