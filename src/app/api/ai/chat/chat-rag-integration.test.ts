import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  emitEvent: vi.fn(),
  emitError: vi.fn(),
  generateWithProvider: vi.fn(),
  getApiUser: vi.fn(),
  retrieveDharmaChatGrounding: vi.fn(),
  generateSarvamTranslation: vi.fn(),
}));

vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: mocks.getApiUser,
}));
vi.mock('@/lib/monitoring/events', () => ({
  emitEvent: mocks.emitEvent,
  emitError: mocks.emitError,
}));
vi.mock('@/lib/tradition-config', () => ({
  getTraditionMeta: () => ({ label: 'Hindu' }),
}));
vi.mock('@/lib/sacred-time', () => ({
  localSpiritualDate: () => '2026-09-14',
}));
vi.mock('@/lib/seva-tiers', () => ({
  getTierFromScore: () => ({ key: 'seeker' }),
}));
vi.mock('@/lib/seva-perks', () => ({
  SEVA_TIER_PERKS: { seeker: { aiChatLimit: 5 } },
}));
vi.mock('@/lib/ai/providers/inference', () => ({
  generateWithProvider: mocks.generateWithProvider,
}));
vi.mock('@/lib/ai/chat-limits', () => ({
  DAILY_AI_MESSAGE_LIMIT: 20,
}));
vi.mock('@/lib/festivals', () => ({
  getFallbackFestivalCalendar: () => [],
}));
vi.mock('@/lib/ai/retrieval', () => ({
  dharamVeerRetriever: { retrieve: vi.fn() },
  festivalRulesRetriever: { retrieve: vi.fn() },
}));
vi.mock('@/lib/ai/chat-grounding', () => ({
  retrieveDharmaChatGrounding: mocks.retrieveDharmaChatGrounding,
}));
vi.mock('@/lib/ai/providers/sarvam-translate', () => ({
  generateSarvamTranslation: mocks.generateSarvamTranslation,
}));
vi.mock('@/lib/api-security', () => ({
  asBoundedString: (value: unknown, maxLength: number) =>
    typeof value === 'string' && value.trim() && value.length <= maxLength ? value.trim() : null,
  rateLimitByIp: () => null,
  rejectLargeRequest: () => null,
}));
vi.mock('@/lib/ai/chat-intent', () => ({
  classifyChatIntent: () => 'question',
  getConversationalResponse: () => '',
}));

import { POST } from './route';
import { clearRetrievalQueryCache } from '@/lib/ai/query-language';

const originalSarvamApiKey = process.env.SARVAM_API_KEY;

function createSupabaseStub() {
  const profileQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: {
        is_banned: false,
        tradition: 'hindu',
        sampradaya: null,
        city: null,
        country: null,
        seeking: [],
        app_language: 'en',
        meaning_language: 'en',
        transliteration_language: 'en',
        spiritual_level: null,
        timezone: 'Asia/Kolkata',
        seva_score: 0,
        consent_religious_data: true,
      },
    }),
  };
  profileQuery.select.mockReturnValue(profileQuery);
  profileQuery.eq.mockReturnValue(profileQuery);

  const eventQuery = {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };

  return {
    rpc: vi.fn().mockResolvedValue({
      data: { new_count: 1, was_allowed: true },
      error: null,
    }),
    from: vi.fn((table: string) => (table === 'profiles' ? profileQuery : eventQuery)),
  };
}

describe('POST /api/ai/chat RAG integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRetrievalQueryCache();
    process.env.SARVAM_API_KEY = 'test-key';

    mocks.getApiUser.mockResolvedValue({
      user: { id: 'user-1' },
      error: null,
      supabase: createSupabaseStub(),
    });
    mocks.retrieveDharmaChatGrounding.mockResolvedValue({
      isGrounded: true,
      corpus: 'pathshala_gita',
      documents: [{ id: 'gita_2.47', content: 'Source passage', score: 1 }],
      groundingPromptText: 'SOURCE-BACKED TEST PASSAGE',
    });
    mocks.generateWithProvider.mockResolvedValue({
      text: 'Grounded response',
      provider: 'sarvam-hosted',
      modelUsed: 'test-model',
    });
  });

  afterEach(() => {
    if (originalSarvamApiKey === undefined) {
      delete process.env.SARVAM_API_KEY;
    } else {
      process.env.SARVAM_API_KEY = originalSarvamApiKey;
    }
  });

  it('injects retrieved context into the Sarvam prompt and records RAG telemetry', async () => {
    const response = await POST(new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Explain Bhagavad Gita 2.47' }),
    }));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Grounded response');
    expect(mocks.retrieveDharmaChatGrounding).toHaveBeenCalledWith({
      message: 'Explain Bhagavad Gita 2.47',
      tradition: 'hindu',
    });
    expect(mocks.generateWithProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('SOURCE-BACKED TEST PASSAGE'),
        user: 'Explain Bhagavad Gita 2.47',
        maxOutputTokens: 500,
        reasoningEffort: 'none',
      }),
      { providerOverride: 'sarvam-hosted' }
    );
    expect(mocks.emitEvent).toHaveBeenCalledWith(expect.objectContaining({
      route: '/api/ai/chat',
      context: expect.objectContaining({
        rag_grounded: true,
        rag_corpus: 'pathshala_gita',
        chunks_count: 1,
      }),
    }));
  });

  it('injects a fail-closed policy note when a recognized corpus has no approved chunks', async () => {
    mocks.retrieveDharmaChatGrounding.mockResolvedValue({
      isGrounded: false,
      corpus: 'valmiki_ramayana',
      documents: [],
      groundingPromptText: 'APPROVED SOURCE COVERAGE UNAVAILABLE',
    });

    const response = await POST(new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Quote the Valmiki Ramayana on refuge' }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.generateWithProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('APPROVED SOURCE COVERAGE UNAVAILABLE'),
      }),
      { providerOverride: 'sarvam-hosted' }
    );
    expect(mocks.emitEvent).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        rag_grounded: false,
        rag_corpus: 'valmiki_ramayana',
        chunks_count: 0,
      }),
    }));
  });

  it('grounds a Hindi question via its English translation but answers the original message', async () => {
    const hindi = 'गीता में फल की इच्छा के बिना कर्म करने के बारे में क्या कहा गया है?';
    mocks.generateSarvamTranslation.mockResolvedValue('What does the Gita say about performing actions without desiring the fruit?');

    const response = await POST(new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: hindi, language: 'hi' }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.generateSarvamTranslation).toHaveBeenCalledWith('test-key', expect.objectContaining({
      input: hindi,
      source_language_code: 'hi-IN',
      target_language_code: 'en-IN',
    }));
    expect(mocks.retrieveDharmaChatGrounding).toHaveBeenCalledWith({
      message: 'What does the Gita say about performing actions without desiring the fruit?',
      tradition: 'hindu',
    });
    expect(mocks.generateWithProvider).toHaveBeenCalledWith(
      expect.objectContaining({ user: hindi }),
      { providerOverride: 'sarvam-hosted' }
    );
    expect(mocks.emitEvent).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({ rag_query_language: 'hi', rag_query_translated: true, rag_query_fallback: null }),
    }));
  });

  it('falls back to grounding on the original Punjabi text when translation fails', async () => {
    const punjabi = 'ਗੀਤਾ ਵਿੱਚ ਕਰਮ ਬਾਰੇ ਕੀ ਕਿਹਾ ਗਿਆ ਹੈ?';
    mocks.generateSarvamTranslation.mockRejectedValue(new Error('Sarvam Translate API failed with status 503'));

    const response = await POST(new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: punjabi, language: 'pa' }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.retrieveDharmaChatGrounding).toHaveBeenCalledWith({ message: punjabi, tradition: 'hindu' });
    expect(mocks.emitEvent).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({ rag_query_language: 'pa', rag_query_translated: false, rag_query_fallback: 'translation_error' }),
    }));
  });

  it('does not call the translator for English questions', async () => {
    await POST(new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'What is karma?' }),
    }));
    expect(mocks.generateSarvamTranslation).not.toHaveBeenCalled();
  });
});
