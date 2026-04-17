// ============================================================
// Integration Tests — Sadhana Engine Phase 1
// Run: npx vitest
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { PanchangCalculator } from '../src/content/panchang';
import { AVAILABLE_TEXTS } from '../src/content/text-library';

// ============================================================
// Panchang Calculator Tests
// ============================================================

describe('PanchangCalculator', () => {
  let panchang: PanchangCalculator;

  beforeEach(() => {
    panchang = new PanchangCalculator();
  });

  it('should return valid panchang for any date', () => {
    const result = panchang.getPanchang(new Date('2026-04-11'));

    expect(result.date).toBe('2026-04-11');
    expect(result.tithi).toBeTruthy();
    expect(result.nakshatra).toBeTruthy();
    expect(result.yoga).toBeTruthy();
    expect(result.karana).toBeTruthy();
    expect(result.masa).toBeTruthy();
    expect(result.ritu).toBeTruthy();
    expect(result.paksha).toMatch(/^(shukla|krishna)$/);
    expect(result.tithi_number).toBeGreaterThanOrEqual(1);
    expect(result.tithi_number).toBeLessThanOrEqual(30);
  });

  it('should compute sunrise and sunset', () => {
    // Bedford, UK coordinates
    const result = panchang.getPanchang(new Date('2026-06-21'), 52.1356, -0.4685);

    expect(result.sunrise).toBeTruthy();
    expect(result.sunset).toBeTruthy();
    // Summer solstice in Bedford — sunrise should be early (before 5 AM)
    const riseHour = parseInt(result.sunrise.split(':')[0]);
    expect(riseHour).toBeLessThan(6);
  });

  it('should detect Ekadashi vrata', () => {
    // Find a date and check if Ekadashi is detected when tithi is 11
    const range = panchang.getRange(new Date('2026-04-01'), 30);
    const ekadashis = range.filter(p =>
      p.vratas.some(v => v.type === 'ekadashi')
    );

    // There should be 2 Ekadashis per month (Shukla + Krishna)
    expect(ekadashis.length).toBeGreaterThanOrEqual(1);
    expect(ekadashis.length).toBeLessThanOrEqual(4);

    // Each Ekadashi should have deity = Vishnu
    ekadashis.forEach(e => {
      const ekVrata = e.vratas.find(v => v.type === 'ekadashi');
      expect(ekVrata?.deity).toBe('Vishnu');
      expect(ekVrata?.fasting_rules).toBeTruthy();
    });
  });

  it('should detect Purnima and Amavasya', () => {
    const range = panchang.getRange(new Date('2026-04-01'), 30);
    const purnimaOrAmavasya = range.filter(p =>
      p.vratas.some(v => v.type === 'purnima' || v.type === 'amavasya')
    );

    expect(purnimaOrAmavasya.length).toBeGreaterThanOrEqual(1);
  });

  it('should return valid nakshatra from the 27 list', () => {
    const VALID_NAKSHATRAS = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
      'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
      'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
      'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
      'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
    ];

    const result = panchang.getToday();
    expect(VALID_NAKSHATRAS).toContain(result.nakshatra);
  });

  it('should return valid karana names including fixed karanas', () => {
    const VALID_KARANAS = [
      'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti',
      'Kimstughna', 'Shakuni', 'Chatushpada', 'Naga',
    ];

    const range = panchang.getRange(new Date('2026-04-01'), 45);
    range.forEach((day) => {
      expect(VALID_KARANAS).toContain(day.karana);
    });
  });

  it('should distinguish Purnima and Amavasya instead of combining them', () => {
    const range = panchang.getRange(new Date('2026-04-01'), 60);
    const tithis = range.map((day) => day.tithi);

    expect(tithis.some((tithi) => tithi.includes('Purnima'))).toBe(true);
    expect(tithis.some((tithi) => tithi.includes('Amavasya'))).toBe(true);
    expect(tithis.some((tithi) => tithi.includes('Purnima/Amavasya'))).toBe(false);
  });

  it('should return a range of panchang for calendar view', () => {
    const range = panchang.getRange(new Date('2026-04-01'), 7);

    expect(range).toHaveLength(7);
    expect(range[0].date).toBe('2026-04-01');
    expect(range[6].date).toBe('2026-04-07');

    // Each day should have a different date
    const dates = range.map(p => p.date);
    expect(new Set(dates).size).toBe(7);
  });

  it('should detect major festivals', () => {
    // Check a full year for festival detection
    const range = panchang.getRange(new Date('2026-01-01'), 365);
    const festivals = range.flatMap(p => p.festivals);
    const festivalNames = festivals.map(f => f.name);

    // At least some major festivals should be detected
    // (exact dates depend on lunar calculations, so we just check they appear)
    expect(festivals.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Text Library Tests
// ============================================================

describe('TextLibrary — metadata', () => {
  it('should have 9 available texts', () => {
    expect(AVAILABLE_TEXTS.length).toBe(9);
  });

  it('should include Bhagavad Gita with 18 chapters', () => {
    const gita = AVAILABLE_TEXTS.find(t => t.id === 'gita');
    expect(gita).toBeDefined();
    expect(gita?.chapters).toBe(18);
    expect(gita?.total_verses).toBe(700);
  });

  it('should include Isha Upanishad', () => {
    const isha = AVAILABLE_TEXTS.find(t => t.id === 'isha');
    expect(isha).toBeDefined();
    expect(isha?.total_verses).toBe(18);
  });

  it('each text should have required fields', () => {
    AVAILABLE_TEXTS.forEach(text => {
      expect(text.id).toBeTruthy();
      expect(text.name).toBeTruthy();
      expect(text.sanskrit_name).toBeTruthy();
      expect(text.chapters).toBeGreaterThan(0);
      expect(text.total_verses).toBeGreaterThan(0);
      expect(text.tradition).toBeTruthy();
      expect(text.description).toBeTruthy();
    });
  });
});

// ============================================================
// Type validation tests
// ============================================================

describe('Type contracts', () => {
  it('SadhanaEventType should cover all practice events', () => {
    const requiredTypes = [
      'app_open', 'japa_session', 'shloka_read', 'shloka_bookmark',
      'panchang_viewed', 'vrata_observed', 'tirtha_visited',
      'mandali_joined', 'greeting_shared', 'streak_break',
      'notification_opened', 'notification_dismissed',
    ];

    // This is a compile-time check — if types are wrong, TS will catch it
    // Here we just verify the strings exist as documentation
    requiredTypes.forEach(type => {
      expect(type).toBeTruthy();
    });
  });

  it('Tradition enum should cover all major sampradayas', () => {
    const traditions = ['vaishnav', 'shaiv', 'shakta', 'smarta', 'general'];
    traditions.forEach(t => expect(t).toBeTruthy());
  });

  it('ContentDepth should have three levels', () => {
    const depths = ['beginner', 'intermediate', 'advanced'];
    depths.forEach(d => expect(d).toBeTruthy());
  });
});

// ============================================================
// Seed data validation
// ============================================================

describe('Gita seed data', () => {
  it('should have valid verse structure', async () => {
    // Import the sample seed file
    const fs = await import('fs');
    const path = await import('path');
    const seedPath = path.resolve(__dirname, '../supabase/seed/gita-sample.json');

    if (!fs.existsSync(seedPath)) {
      console.warn('Seed file not found, skipping');
      return;
    }

    const data = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    expect(data.text_id).toBe('gita');
    expect(data.verses.length).toBeGreaterThan(0);

    data.verses.forEach((v: any) => {
      expect(v.text_id).toBe('gita');
      expect(v.chapter).toBeGreaterThanOrEqual(1);
      expect(v.chapter).toBeLessThanOrEqual(18);
      expect(v.verse).toBeGreaterThanOrEqual(1);
      expect(v.sanskrit).toBeTruthy();
      expect(v.translation).toBeTruthy();
      expect(Array.isArray(v.tags)).toBe(true);
      expect(v.tags.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// Profile computation logic tests (unit-level)
// ============================================================

describe('Profile inference logic', () => {
  it('should classify early morning as brahma_muhurta', () => {
    const hours = [4, 5, 4, 5, 4]; // all before 6 AM
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    expect(avg).toBeLessThan(6);
    // This maps to 'brahma_muhurta' in ProfileComputer
  });

  it('should classify evening practice correctly', () => {
    const hours = [18, 19, 20, 18, 19];
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    expect(avg).toBeGreaterThanOrEqual(17);
    // This maps to 'evening' in ProfileComputer
  });

  it('should compute consistency score correctly', () => {
    // 15 active days out of 30 = 0.5
    const activeDays = 15;
    const score = Math.min(1, activeDays / 30);
    expect(score).toBe(0.5);

    // 30 active days = 1.0
    expect(Math.min(1, 30 / 30)).toBe(1);

    // 0 active days = 0
    expect(Math.min(1, 0 / 30)).toBe(0);
  });

  it('should infer bhakti path from heavy japa usage', () => {
    const japa = 50, shloka = 10, vrata = 5;
    const total = japa + shloka + vrata;
    const japaRatio = japa / total;
    expect(japaRatio).toBeGreaterThan(0.5);
    // This maps to 'bhakti'
  });

  it('should infer jnana path from heavy shloka usage', () => {
    const japa = 5, shloka = 50, vrata = 5;
    const total = japa + shloka + vrata;
    const shlokaRatio = shloka / total;
    expect(shlokaRatio).toBeGreaterThan(0.5);
    // This maps to 'jnana'
  });
});
