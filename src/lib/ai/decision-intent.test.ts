import { describe, expect, it } from 'vitest';
import { classifyDecisionIntent, getDecisionResponse } from './decision-intent';

describe('classifyDecisionIntent: questions people act on', () => {
  it.each([
    ['Which date is best for our wedding?', 'marriage'],
    ['Can you suggest a good day for my engagement?', 'marriage'],
    ['should we fix the marriage date in March?', 'marriage'],
    ['Give me a muhurta for griha pravesh', 'home'],
    ['What is the best day to buy a house?', 'home'],
    ['Is Tuesday a good day to launch my business?', 'business'],
    ['when should I open my shop? tell me an auspicious time', 'business'],
    ['Give me a shubh muhurat', 'muhurta'],
    ['Suggest an auspicious date for the naming ceremony', 'travel_or_start'],
    ['विवाह के लिए कौन सा दिन शुभ है?', 'marriage'],
    ['गृह प्रवेश का मुहूर्त बताइए', 'home'],
    ['दुकान खोलने की सही तिथि बताओ', 'business'],
    ['ਵਿਆਹ ਲਈ ਕਿਹੜਾ ਦਿਨ ਸ਼ੁਭ ਹੈ?', 'marriage'],
    ['ਘਰ ਦੇ ਮੁਹੂਰਤ ਬਾਰੇ ਦੱਸੋ', 'home'],
  ])('%s', (message, topic) => {
    expect(classifyDecisionIntent(message)).toBe(topic);
  });
});

describe('classifyDecisionIntent: ordinary questions are left to the model', () => {
  it.each([
    'What is a muhurta?',
    'What does the word vivah mean?',
    'Explain the meaning of the wedding rituals in a Hindu marriage',
    'What is the significance of the seven steps in a marriage ceremony?',
    'Tell me about Bhagavad Gita 2.47',
    'How do I start a daily japa practice?',
    'Why is Diwali celebrated?',
    'What is the importance of griha pravesh?',
    'मुहूर्त क्या होता है?',
    'ਮੁਹੂਰਤ ਕੀ ਹੁੰਦਾ ਹੈ?',
    '',
  ])('%s', (message) => {
    expect(classifyDecisionIntent(message)).toBeNull();
  });
});

describe('getDecisionResponse', () => {
  it('is the same text every time, per language', () => {
    for (const lang of ['en', 'hi', 'pa', null, 'fr']) {
      expect(getDecisionResponse(lang)).toBe(getDecisionResponse(lang));
    }
    expect(getDecisionResponse('hi')).not.toBe(getDecisionResponse('en'));
    expect(getDecisionResponse('pa')).not.toBe(getDecisionResponse('en'));
    expect(getDecisionResponse('fr')).toBe(getDecisionResponse('en'));
  });

  it('says what Shoonaya shows, sends the decision to a qualified person, and gives no date, time or doctrine', () => {
    for (const lang of ['en', 'hi', 'pa']) {
      const text = getDecisionResponse(lang);
      expect(text).toContain('Shoonaya');
      expect(text).not.toMatch(/\d/);
      expect(text).not.toMatch(/pandit|ਪੰਡਿਤ|पंडित|कुंडली|ਕੁੰਡਲੀ/i);
    }
    expect(getDecisionResponse('en')).toMatch(/qualified teacher or elder/);
  });
});
