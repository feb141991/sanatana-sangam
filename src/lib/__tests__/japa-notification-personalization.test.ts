import { describe, expect, it } from 'vitest';
import { buildJapaNotificationGreeting } from '../japa-notification-personalization';
import { applyJapaGreeting, DEFAULT_NOTIFICATION_TEMPLATES, interpolateTemplate } from '../notification-templates';

describe('buildJapaNotificationGreeting', () => {
  it('uses only the first display-name token for English Japa copy', () => {
    expect(buildJapaNotificationGreeting('  Prince   Sharma  ', 'en')).toBe('Hi Prince. ');
  });

  it('preserves non-Latin first names', () => {
    expect(buildJapaNotificationGreeting('आरव शर्मा', 'en')).toBe('Hi आरव. ');
  });

  it('does not personalize non-English or unknown-language profiles', () => {
    expect(buildJapaNotificationGreeting('Prince Sharma', 'hi')).toBe('');
    expect(buildJapaNotificationGreeting('Prince Sharma', 'pa')).toBe('');
    expect(buildJapaNotificationGreeting('Prince Sharma', null)).toBe('');
  });

  it('falls back to generic copy for missing or unsafe names', () => {
    expect(buildJapaNotificationGreeting(null, 'en')).toBe('');
    expect(buildJapaNotificationGreeting('   ', 'en')).toBe('');
    expect(buildJapaNotificationGreeting('prince@example.com', 'en')).toBe('');
    expect(buildJapaNotificationGreeting('***', 'en')).toBe('');
    expect(buildJapaNotificationGreeting(`${'A'.repeat(33)} Sharma`, 'en')).toBe('');
  });

  it('removes control and bidi formatting characters before choosing a name', () => {
    expect(buildJapaNotificationGreeting('Prince\u202e Sharma', 'en')).toBe('Hi Prince. ');
  });

  it('renders the first name in the Japa template and stays grammatical without one', () => {
    const japaTemplate = DEFAULT_NOTIFICATION_TEMPLATES.find((template) => template.id === 'japa:all');
    expect(japaTemplate).toBeDefined();

    expect(interpolateTemplate(japaTemplate!.bodyTemplate, { japaGreeting: 'Hi Prince. ' })).toBe(
      'Hi Prince. Your daily Japa practice awaits. Keep your streak alive 🙏'
    );
    expect(interpolateTemplate(japaTemplate!.bodyTemplate, { japaGreeting: '' })).toBe(
      'Your daily Japa practice awaits. Keep your streak alive 🙏'
    );
  });

  it('personalizes existing admin-authored copy without requiring a migration', () => {
    expect(applyJapaGreeting(
      'Your custom Japa reminder.',
      'Your custom Japa reminder.',
      'Hi Prince. '
    )).toBe('Hi Prince. Your custom Japa reminder.');
    expect(applyJapaGreeting(
      '{{japaGreeting}}Your custom Japa reminder.',
      'Your custom Japa reminder.',
      'Hi Prince. '
    )).toBe('Your custom Japa reminder.');
    expect(applyJapaGreeting('Your custom Japa reminder.', 'Your custom Japa reminder.', '')).toBe(
      'Your custom Japa reminder.'
    );
  });
});
