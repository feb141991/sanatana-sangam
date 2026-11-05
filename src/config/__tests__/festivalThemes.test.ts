import { describe, expect, it } from 'vitest';
import { resolveHomeHeroTheme } from '../festivalThemes';

describe('resolveHomeHeroTheme - Tradition Awareness', () => {
  it('returns hindu-default for a user with hindu tradition and no festival', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'hindu',
    });
    expect(theme.id).toBe('hindu-default');
    expect(theme.traditions).toContain('hindu');
    expect(theme.heroImage).toBe('/assets/images/heroes/hindu/shiva-default.webp');
  });

  it('never returns a buddhist theme for a hindu user even if a buddhist festival is passed', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'hindu',
      festival: { name: 'Buddha Purnima', tradition: 'buddhist' as any },
    });
    // Should NOT match Buddha Purnima
    expect(theme.id).not.toBe('buddha-purnima');
    expect(theme.traditions).toContain('hindu');
  });

  it('rejects a stale selectedHeroId from another tradition (e.g. buddhist) for a hindu user', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'hindu',
      selectedHeroId: 'buddhist-default',
      lockSelectedHero: true,
    });
    expect(theme.id).toBe('hindu-default');
    expect(theme.traditions).toContain('hindu');
  });

  it('accepts a compatible selectedHeroId matching user tradition', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'hindu',
      selectedHeroId: 'maha-shivaratri',
      lockSelectedHero: true,
    });
    expect(theme.id).toBe('maha-shivaratri');
  });

  it('returns buddhist-default for a buddhist user with no festival', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'buddhist',
    });
    expect(theme.id).toBe('buddhist-default');
    expect(theme.traditions).toContain('buddhist');
  });

  it('returns buddha-purnima when buddha purnima festival matches for a buddhist user', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'buddhist',
      festival: { name: 'Buddha Purnima', tradition: 'buddhist' as any },
    });
    expect(theme.id).toBe('buddha-purnima');
  });

  it('returns sikh-default for a sikh user', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'sikh',
    });
    expect(theme.id).toBe('sikh-default');
    expect(theme.traditions).toContain('sikh');
  });

  it('returns jain-default for a jain user', () => {
    const theme = resolveHomeHeroTheme({
      tradition: 'jain',
    });
    expect(theme.id).toBe('jain-default');
    expect(theme.traditions).toContain('jain');
  });

  it('falls back to global-default when tradition is omitted or universal', () => {
    const theme = resolveHomeHeroTheme({
      tradition: null,
    });
    expect(theme.id).toBe('global-default');
  });
});

