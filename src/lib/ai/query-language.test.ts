import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRetrievalQueryCache, detectQueryLanguage, toRetrievalQuery } from './query-language';

describe('detectQueryLanguage', () => {
  it('detects Devanagari Hindi and Gurmukhi Punjabi', () => {
    expect(detectQueryLanguage('गीता में कर्म के बारे में क्या कहा गया है?')).toBe('hi');
    expect(detectQueryLanguage('ਗੀਤਾ ਵਿੱਚ ਕਰਮ ਬਾਰੇ ਕੀ ਕਿਹਾ ਗਿਆ ਹੈ?')).toBe('pa');
  });

  it('detects romanised Hindi from distinctive function words', () => {
    expect(detectQueryLanguage('Gita mein phal ki ichha ke bina karm karne ke baare mein kya kaha gaya hai?')).toBe('hi-latn');
  });

  it('keeps English, including English with Sanskrit terms, as English', () => {
    expect(detectQueryLanguage('What does the Gita say about karma and dharma?')).toBe('en');
    expect(detectQueryLanguage('Explain Gita 2.47 to me')).toBe('en');
    expect(detectQueryLanguage('How can a man control his mind?')).toBe('en');
    expect(detectQueryLanguage('')).toBe('en');
  });
});

describe('toRetrievalQuery', () => {
  beforeEach(() => clearRetrievalQueryCache());

  it('leaves English untouched without calling the translator', async () => {
    const translate = vi.fn();
    const result = await toRetrievalQuery('What is karma?', { apiKey: 'k', translate });
    expect(result).toEqual({ text: 'What is karma?', language: 'en', translated: false });
    expect(translate).not.toHaveBeenCalled();
  });

  it('translates Hindi and Punjabi to English with the matching source code', async () => {
    const translate = vi.fn(async () => 'What does the Gita say about action?');
    const hindi = await toRetrievalQuery('गीता में कर्म?', { apiKey: 'k', translate });
    expect(hindi).toEqual({ text: 'What does the Gita say about action?', language: 'hi', translated: true });
    expect(translate).toHaveBeenLastCalledWith('k', expect.objectContaining({ source_language_code: 'hi-IN', target_language_code: 'en-IN' }));

    await toRetrievalQuery('ਗੀਤਾ ਵਿੱਚ ਕਰਮ?', { apiKey: 'k', translate });
    expect(translate).toHaveBeenLastCalledWith('k', expect.objectContaining({ source_language_code: 'pa-IN' }));
  });

  it('sends romanised Hindi as Hindi', async () => {
    const translate = vi.fn(async () => 'What is said about action?');
    await toRetrievalQuery('karm ke baare mein kya kaha gaya hai', { apiKey: 'k', translate });
    expect(translate).toHaveBeenCalledWith('k', expect.objectContaining({ source_language_code: 'hi-IN' }));
  });

  it('caches translations so a repeated question is translated once', async () => {
    const translate = vi.fn(async () => 'translated');
    await toRetrievalQuery('गीता में कर्म?', { apiKey: 'k', translate });
    const second = await toRetrievalQuery('गीता में कर्म?', { apiKey: 'k', translate });
    expect(second.translated).toBe(true);
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('falls back to the original text on error, timeout, empty output or missing key', async () => {
    const failing = vi.fn(async () => { throw new Error('503'); });
    expect(await toRetrievalQuery('गीता?', { apiKey: 'k', translate: failing }))
      .toEqual({ text: 'गीता?', language: 'hi', translated: false, fallbackReason: 'translation_error' });

    const slow = vi.fn(() => new Promise<string>((resolve) => setTimeout(() => resolve('late'), 50)));
    expect(await toRetrievalQuery('ਗੀਤਾ?', { apiKey: 'k', translate: slow, timeoutMs: 5 }))
      .toEqual({ text: 'ਗੀਤਾ?', language: 'pa', translated: false, fallbackReason: 'timeout' });

    const empty = vi.fn(async () => '   ');
    expect((await toRetrievalQuery('मन?', { apiKey: 'k', translate: empty })).fallbackReason).toBe('empty_translation');

    expect((await toRetrievalQuery('मन?', { apiKey: undefined })).fallbackReason).toBe('missing_api_key');
  });
});
