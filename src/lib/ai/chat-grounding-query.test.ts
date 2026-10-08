import { beforeEach, describe, expect, it, vi } from 'vitest';

// Which query shape each kind of corpus receives. retrieval is mocked so the test sees
// exactly what retrieveDharmaChatGrounding hands to the retriever.
const { retrieveMock } = vi.hoisted(() => ({ retrieveMock: vi.fn() }));

vi.mock('@/lib/ai/retrieval', () => ({
  dharamVeerRetriever: { retrieve: vi.fn(async () => ({ documents: [] })) },
  festivalRulesRetriever: { retrieve: vi.fn(async () => ({ documents: [] })) },
  retrievePathshalaContext: retrieveMock,
}));
vi.mock('@sangam/pramana-serve', () => ({ hasPendingSourceContent: vi.fn(() => false) }));

import { extractMeaningfulTokens, retrieveDharmaChatGrounding, toDenseQuery } from './chat-grounding';

describe('query shape sent to the retriever', () => {
  beforeEach(() => {
    retrieveMock.mockReset();
    retrieveMock.mockResolvedValue([]);
  });

  it.each([
    ['What do the Upanishads teach about the self and the world around us?', 'pathshala_upanishads'],
  ])('sends the dense corpora the whole question, stopwords included: %s', async (message, corpus) => {
    await retrieveDharmaChatGrounding({ message, tradition: 'hindu' });
    expect(retrieveMock).toHaveBeenCalledTimes(1);
    expect(retrieveMock.mock.calls[0][0]).toMatchObject({ corpus, title: message });
  });

  it('drops the Gita\'s own name from the dense query but keeps the rest of the sentence', async () => {
    const message = 'What does Krishna say about the wavering mind in the Gita?';
    await retrieveDharmaChatGrounding({ message, tradition: 'hindu' });
    const sent = retrieveMock.mock.calls[0][0];
    expect(sent.corpus).toBe('pathshala_gita');
    expect(sent.title).toBe('What does Krishna say about the wavering mind?');
  });

  it.each([
    ['Gita', 'Gita'], // nothing else would be left, so the original is kept
    ['What is the Bhagavad Gita?', 'What is the Bhagavad Gita?'], // only stopwords would be left
    ['Teach me from the Gita 2.47 about work', 'Teach me from 2.47 about work'],
  ])('toDenseQuery(%j) -> %j', (message, expected) => {
    expect(toDenseQuery(message)).toBe(expected);
  });

  it('keeps stripping stopwords for the sparse keyword corpora', async () => {
    const message = 'What does the Dhammapada say about the mind and its training?';
    await retrieveDharmaChatGrounding({ message, tradition: 'hindu' });
    const sent = retrieveMock.mock.calls[0][0];
    expect(sent.corpus).toBe('buddhist_dhamma');
    expect(sent.title).toBe(extractMeaningfulTokens(message).join(' '));
    expect(sent.title).not.toBe(message);
  });

  it('probes the Gita with the whole sentence for a question naming no Dharmic word', async () => {
    const message = 'God accepts a leaf, a flower or water offered with love';
    await retrieveDharmaChatGrounding({ message, tradition: 'hindu' });
    expect(retrieveMock.mock.calls[0][0]).toMatchObject({ corpus: 'pathshala_gita', title: message });
  });

  it('does not search at all for a mundane question when the tradition has no dense corpus', async () => {
    await retrieveDharmaChatGrounding({ message: 'What should I eat for breakfast?', tradition: 'sikh' });
    expect(retrieveMock).not.toHaveBeenCalled();
  });
});
