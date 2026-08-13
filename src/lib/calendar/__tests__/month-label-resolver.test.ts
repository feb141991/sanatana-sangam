import { describe, it, expect } from 'vitest';
import { resolveMonthLabelForDate, resolveMonthLabelForProfile } from '../month-label-resolver';

describe('month-label-resolver', () => {
  describe('docs/calendar-profiles.md §1.2 Maha Shivaratri Worked Example', () => {
    it('returns Magha under Amanta and Phalguna under Purnimanta for Krishna Chaturdashi before Magha amavasya (2026-02-15)', () => {
      const civilDate = '2026-02-15'; // 2026 Maha Shivaratri date

      const amantaRes = resolveMonthLabelForDate(civilDate, 'amanta');
      const purnimantaRes = resolveMonthLabelForDate(civilDate, 'purnimanta');

      expect(amantaRes).not.toBeNull();
      expect(purnimantaRes).not.toBeNull();

      expect(amantaRes?.monthName).toBe('Magha');
      expect(amantaRes?.paksha).toBe('krishna');

      expect(purnimantaRes?.monthName).toBe('Phalguna');
      expect(purnimantaRes?.paksha).toBe('krishna');

      // Profile resolution test for Maha Shivaratri rule (which declares amanta / Magha)
      const shivaratriRule = {
        corrected_lunar_masa_name: 'Magha',
        corrected_month_system: 'amanta',
        lunar_tithi_index: 28,
      };

      const amantaProfileRes = resolveMonthLabelForProfile(civilDate, shivaratriRule, 'amanta');
      const purnimantaProfileRes = resolveMonthLabelForProfile(civilDate, shivaratriRule, 'purnimanta');

      expect(amantaProfileRes?.monthName).toBe('Magha');
      expect(amantaProfileRes?.monthSystem).toBe('amanta');
      expect(amantaProfileRes?.isDivergentFromRuleDefault).toBe(false);

      expect(purnimantaProfileRes?.monthName).toBe('Phalguna');
      expect(purnimantaProfileRes?.monthSystem).toBe('purnimanta');
      expect(purnimantaProfileRes?.isDivergentFromRuleDefault).toBe(true);
    });
  });

  describe('Real Krishna-paksha rules from rules.json', () => {
    it('(b.1) Karva Chauth (Krishna Chaturthi): Kartika under Purnimanta, Ashwin under Amanta (2026-10-29)', () => {
      const civilDate = '2026-10-29'; // 2026 Karva Chauth date (Kartika Krishna Chaturthi)
      const karvaChauthRule = {
        corrected_lunar_masa_name: 'Kartika',
        corrected_month_system: 'purnimanta',
        lunar_tithi_index: 19,
      };

      const purnimantaRes = resolveMonthLabelForProfile(civilDate, karvaChauthRule, 'purnimanta');
      const amantaRes = resolveMonthLabelForProfile(civilDate, karvaChauthRule, 'amanta');

      expect(purnimantaRes?.monthName).toBe('Kartika');
      expect(purnimantaRes?.isDivergentFromRuleDefault).toBe(false);

      expect(amantaRes?.monthName).toBe('Ashwin');
      expect(amantaRes?.isDivergentFromRuleDefault).toBe(true);
    });

    it('(b.2) Diwali (Krishna Amavasya): Kartika under Purnimanta, Ashwin under Amanta (2026-11-08)', () => {
      const civilDate = '2026-11-08'; // 2026 Diwali date (Kartika Krishna Amavasya)
      const diwaliRule = {
        corrected_lunar_masa_name: 'Kartika',
        corrected_month_system: 'purnimanta',
        lunar_tithi_index: 29,
      };

      const purnimantaRes = resolveMonthLabelForProfile(civilDate, diwaliRule, 'purnimanta');
      const amantaRes = resolveMonthLabelForProfile(civilDate, diwaliRule, 'amanta');

      expect(purnimantaRes?.monthName).toBe('Kartika');
      expect(purnimantaRes?.isDivergentFromRuleDefault).toBe(false);

      expect(amantaRes?.monthName).toBe('Ashwin');
      expect(amantaRes?.isDivergentFromRuleDefault).toBe(true);
    });
  });

  describe('Shukla-paksha rules (Conversion Law Assertion)', () => {
    it('(c) Ram Navami (Shukla Navami): Chaitra under BOTH Amanta and Purnimanta (2026-03-27)', () => {
      const civilDate = '2026-03-27'; // 2026 Ram Navami date (Chaitra Shukla Navami)
      const ramNavamiRule = {
        corrected_lunar_masa_name: 'Chaitra',
        corrected_month_system: 'amanta',
        lunar_tithi_index: 9,
      };

      const amantaRes = resolveMonthLabelForProfile(civilDate, ramNavamiRule, 'amanta');
      const purnimantaRes = resolveMonthLabelForProfile(civilDate, ramNavamiRule, 'purnimanta');

      expect(amantaRes?.monthName).toBe('Chaitra');
      expect(purnimantaRes?.monthName).toBe('Chaitra');
      expect(amantaRes?.monthName).toBe(purnimantaRes?.monthName); // Conversion law assertion: Shukla paksha is IDENTICAL

      // Regression: divergence must reflect the ACTUAL LABEL, not merely
      // that the viewing system differs from the rule's own declared
      // system. The rule's own default is amanta; a purnimanta-profile
      // viewer sees the SAME name ("Chaitra") and must NOT get a "Profile
      // Convention" divergence badge for a label that hasn't changed.
      expect(amantaRes?.isDivergentFromRuleDefault).toBe(false);
      expect(purnimantaRes?.isDivergentFromRuleDefault).toBe(false);
    });
  });
});
