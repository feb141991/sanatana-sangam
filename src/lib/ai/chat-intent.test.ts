import { describe, expect, it } from 'vitest';
import { classifyChatIntent, getConversationalResponse } from './chat-intent';

describe('Dharma Mitra conversational intent', () => {
  it.each(['Thank you', 'thanks 🙏', 'धन्यवाद', 'ਆਭਾਰ', 'Jai Jinendra'])('classifies %s without AI generation', (message) => {
    expect(classifyChatIntent(message)).toBe('acknowledgement');
  });

  it('keeps substantive follow-up questions on the AI path', () => {
    expect(classifyChatIntent('Thank you, but how can I practise ahimsa at work?')).toBe('question');
  });

  it('returns tradition- and language-aware acknowledgement copy', () => {
    expect(getConversationalResponse('acknowledgement', 'jain', 'en')).toContain('Jai Jinendra');
    expect(getConversationalResponse('acknowledgement', 'sikh', 'pa')).toContain('ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ');
    expect(getConversationalResponse('acknowledgement', 'buddhist', 'hi')).toContain('नमो बुद्धाय');
  });
});
