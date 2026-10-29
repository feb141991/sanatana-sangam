import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Dharma Mitra must give the same answer when the same person asks the same question twice. These tests run the real
 * route with the model replaced by one that deliberately gives a different answer every time it is called.
 */
const mocks = vi.hoisted(() => ({
  generateWithProvider: vi.fn(),
  getApiUser: vi.fn(),
  retrieveDharmaChatGrounding: vi.fn(),
  spiritualDate: vi.fn(() => '2026-10-29'),
  db: { current: null as any, unavailable: false },
}));

vi.mock('@/lib/api-auth', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api-auth')>()), getApiUser: mocks.getApiUser }));
vi.mock('@/lib/monitoring/events', () => ({ emitEvent: vi.fn(), emitError: vi.fn() }));
vi.mock('@/lib/tradition-config', () => ({ getTraditionMeta: () => ({ label: 'Hindu' }) }));
vi.mock('@/lib/sacred-time', () => ({ localSpiritualDate: () => mocks.spiritualDate() }));
vi.mock('@/lib/ai/providers/inference', () => ({
  generateWithProvider: mocks.generateWithProvider,
  getActiveChatModelId: () => 'test-model',
}));
vi.mock('@/lib/ai/chat-limits', () => ({ DAILY_AI_MESSAGE_LIMIT: 20 }));
vi.mock('@/lib/festivals', () => ({ getFallbackFestivalCalendar: () => [] }));
vi.mock('@/lib/ai/retrieval', () => ({ dharamVeerRetriever: { retrieve: vi.fn() }, festivalRulesRetriever: { retrieve: vi.fn() } }));
vi.mock('@/lib/ai/chat-grounding', () => ({ retrieveDharmaChatGrounding: mocks.retrieveDharmaChatGrounding }));
vi.mock('@/lib/ai/providers/sarvam-translate', () => ({ generateSarvamTranslation: vi.fn() }));
vi.mock('@/lib/api-security', () => ({
  asBoundedString: (value: unknown, max: number) => (typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null),
  rateLimitByIp: () => null,
  rejectLargeRequest: () => null,
}));
vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => {
    if (mocks.db.unavailable) throw new Error('no service role in this environment');
    return mocks.db.current;
  },
}));

import { POST } from './route';
import { clearRetrievalQueryCache } from '@/lib/ai/query-language';

/** The remembered-answers table, in memory. */
function memoryTable() {
  const rows: Array<Record<string, any>> = [];
  return {
    rows,
    from() {
      const filters: Array<(r: any) => boolean> = [];
      let op = 'select'; let payload: any; let ignore = false;
      const q: any = {
        select: () => q, delete: () => { op = 'delete'; return q; },
        upsert: (row: any, o: any) => { op = 'upsert'; payload = row; ignore = !!o?.ignoreDuplicates; return q; },
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return q; },
        gt: (c: string, v: any) => { filters.push((r) => r[c] > v); return q; },
        lt: (c: string, v: any) => { filters.push((r) => r[c] < v); return q; },
        maybeSingle: async () => ({ data: rows.find((r) => filters.every((f) => f(r))) ?? null, error: null }),
        then: (resolve: any) => {
          if (op === 'delete') { for (let i = rows.length - 1; i >= 0; i--) if (filters.every((f) => f(rows[i]))) rows.splice(i, 1); }
          if (op === 'upsert' && !(ignore && rows.some((r) => r.user_id === payload.user_id && r.cache_key === payload.cache_key))) rows.push({ ...payload });
          return resolve({ error: null });
        },
      };
      return q;
    },
  };
}

function userClient() {
  const profile = {
    is_banned: false, tradition: 'hindu', sampradaya: null, city: 'London', country: 'UK', seeking: [], app_language: 'en',
    meaning_language: 'en', transliteration_language: 'en', spiritual_level: null, timezone: 'Europe/London', consent_religious_data: true,
  };
  const query: any = { select: () => query, eq: () => query, single: async () => ({ data: profile }), insert: async () => ({ error: null }) };
  return { rpc: vi.fn().mockResolvedValue({ data: { new_count: 1, was_allowed: true }, error: null }), from: () => query };
}

let rpcCalls: () => number;
let sequence = 0;

function ask(message: string, opts: { userId?: string; history?: Array<{ role: 'user' | 'model'; text: string }>; language?: string } = {}) {
  const client = userClient();
  mocks.getApiUser.mockResolvedValue({ user: { id: opts.userId ?? 'user-1' }, error: null, supabase: client });
  rpcCalls = () => client.rpc.mock.calls.length;
  return POST(new NextRequest('http://localhost/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, history: opts.history, language: opts.language }),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  clearRetrievalQueryCache();
  process.env.SARVAM_API_KEY = 'test-key';
  sequence = 0;
  mocks.db.current = memoryTable();
  mocks.db.unavailable = false;
  mocks.spiritualDate.mockReturnValue('2026-10-29');
  mocks.retrieveDharmaChatGrounding.mockResolvedValue({ isGrounded: true, corpus: 'pathshala_gita', documents: [{ id: 'x', content: 'p', score: 1 }], groundingPromptText: 'GROUNDING' });
  // A model that never repeats itself.
  mocks.generateWithProvider.mockImplementation(async () => ({ text: `Answer number ${++sequence}`, provider: 'sarvam-hosted', modelUsed: 'test-model' }));
});

describe('asking the same question twice', () => {
  it('gives the same answer even though the model would have said something different', async () => {
    const first = await (await ask('What does Om mean?')).text();
    const second = await (await ask('What does Om mean?')).text();
    expect(first).toBe('Answer number 1');
    expect(second).toBe(first);
    expect(mocks.generateWithProvider).toHaveBeenCalledTimes(1);
  });

  it('treats capitals, spacing and a question mark as the same question', async () => {
    const a = await (await ask('What does Om mean?')).text();
    const b = await (await ask('  what does OM mean ')).text();
    expect(b).toBe(a);
    expect(mocks.generateWithProvider).toHaveBeenCalledTimes(1);
  });

  it('reuses the first-turn answer when the same question is repeated in the same chat', async () => {
    const question = 'What does Om mean?';
    const first = await (await ask(question)).text();
    mocks.retrieveDharmaChatGrounding.mockClear();
    const repeated = await ask(question, { history: [
      { role: 'user', text: question },
      { role: 'model', text: first },
    ] });

    expect(await repeated.text()).toBe(first);
    expect(repeated.headers.get('X-Dharma-Answer')).toBe('cached');
    expect(rpcCalls()).toBe(0);
    expect(mocks.retrieveDharmaChatGrounding).not.toHaveBeenCalled();
    expect(mocks.generateWithProvider).toHaveBeenCalledTimes(1);
  });

  it('reuses a first-turn answer after unrelated turns while that first turn remains in submitted history', async () => {
    const question = 'What does Om mean?';
    const first = await (await ask(question)).text();
    const otherQuestion = 'Why is daily reflection useful?';
    const otherAnswer = await (await ask(otherQuestion, { history: [
      { role: 'user', text: question },
      { role: 'model', text: first },
    ] })).text();
    const repeated = await ask(question, { history: [
      { role: 'user', text: question },
      { role: 'model', text: first },
      { role: 'user', text: otherQuestion },
      { role: 'model', text: otherAnswer },
    ] });

    expect(await repeated.text()).toBe(first);
    expect(repeated.headers.get('X-Dharma-Answer')).toBe('cached');
    expect(mocks.generateWithProvider).toHaveBeenCalledTimes(2);
  });

  it('does not infer the first turn after it falls outside the server history window', async () => {
    const question = 'What does Om mean?';
    const first = await (await ask(question)).text();
    const history = Array.from({ length: 13 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'model' as const,
      text: `Earlier unrelated turn ${index}`,
    }));
    const repeated = await ask(question, { history: [
      { role: 'user', text: question },
      { role: 'model', text: first },
      ...history,
    ] });

    expect(await repeated.text()).toBe('Answer number 2');
    expect(repeated.headers.get('X-Dharma-Answer')).toBe('generated');
    expect(mocks.generateWithProvider).toHaveBeenCalledTimes(2);
  });

  it('does not reuse a contextual follow-up answer when the same follow-up is asked again later', async () => {
    const firstQuestion = 'What does Om mean?';
    const firstAnswer = await (await ask(firstQuestion)).text();
    const followUp = 'Can you explain that further?';
    const followUpAnswer = await (await ask(followUp, { history: [
      { role: 'user', text: firstQuestion },
      { role: 'model', text: firstAnswer },
    ] })).text();
    const repeatedFollowUp = await ask(followUp, { history: [
      { role: 'user', text: firstQuestion },
      { role: 'model', text: firstAnswer },
      { role: 'user', text: followUp },
      { role: 'model', text: followUpAnswer },
    ] });

    expect(await repeatedFollowUp.text()).toBe('Answer number 3');
    expect(repeatedFollowUp.headers.get('X-Dharma-Answer')).toBe('generated');
    expect(mocks.generateWithProvider).toHaveBeenCalledTimes(3);
  });

  it('says where the answer came from, and the repeat costs no allowance and no retrieval', async () => {
    const generated = await ask('What does Om mean?');
    expect(generated.headers.get('X-Dharma-Answer')).toBe('generated');
    expect(rpcCalls()).toBe(1);
    mocks.retrieveDharmaChatGrounding.mockClear();
    const repeated = await ask('What does Om mean?');
    expect(repeated.headers.get('X-Dharma-Answer')).toBe('cached');
    expect(rpcCalls()).toBe(0);
    expect(mocks.retrieveDharmaChatGrounding).not.toHaveBeenCalled();
  });

  it('asks the model for no sampling randomness', async () => {
    await ask('What does Om mean?');
    expect(mocks.generateWithProvider).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0 }), expect.anything());
  });

  it('does not share an answer between people', async () => {
    const mine = await (await ask('What does Om mean?', { userId: 'user-1' })).text();
    const theirs = await (await ask('What does Om mean?', { userId: 'user-2' })).text();
    expect(theirs).not.toBe(mine);
    expect(mocks.generateWithProvider).toHaveBeenCalledTimes(2);
  });

  it('answers a follow-up on its own, not with the first answer', async () => {
    const first = await (await ask('What does Om mean?')).text();
    const follow = await (await ask('And what are its three parts?', { history: [{ role: 'user', text: 'What does Om mean?' }, { role: 'model', text: first }] })).text();
    expect(follow).not.toBe(first);
  });

  it('asks again when the language changes', async () => {
    const en = await (await ask('What does Om mean?', { language: 'en' })).text();
    const hi = await (await ask('What does Om mean?', { language: 'hi' })).text();
    expect(hi).not.toBe(en);
  });

  it('keeps a timeless answer across days, and refreshes one that depends on today', async () => {
    const timeless = await (await ask('What does Om mean?')).text();
    const dated = await (await ask('When is the next ekadashi?')).text();
    mocks.spiritualDate.mockReturnValue('2026-10-30');
    expect(await (await ask('What does Om mean?')).text()).toBe(timeless);
    expect(await (await ask('When is the next ekadashi?')).text()).not.toBe(dated);
  });

  it('still answers when the memory is unavailable', async () => {
    mocks.db.unavailable = true;
    const first = await ask('What does Om mean?');
    expect(first.status).toBe(200);
    expect(await first.text()).toBe('Answer number 1');
    expect(await (await ask('What does Om mean?')).text()).toBe('Answer number 2');
  });
});

describe('decision questions (a wedding date, a purchase, a launch)', () => {
  it.each([
    'Which date is best for our wedding?',
    'Give me a muhurta for griha pravesh',
    'Is Tuesday a good day to launch my business?',
  ])('"%s" gets one fixed answer, not a generated one', async (question) => {
    const a = await ask(question);
    const textA = await a.text();
    const textB = await (await ask(question)).text();
    expect(a.headers.get('X-Dharma-Answer')).toBe('policy');
    expect(textB).toBe(textA);
    expect(textA).toMatch(/qualified teacher or elder/);
    expect(textA).not.toMatch(/\d/);
    expect(mocks.generateWithProvider).not.toHaveBeenCalled();
    expect(rpcCalls()).toBe(0);
  });

  it('answers in the language the person wrote in', async () => {
    const text = await (await ask('विवाह के लिए कौन सा दिन शुभ है?')).text();
    expect(text).toContain('शुभ दिन');
    expect(mocks.generateWithProvider).not.toHaveBeenCalled();
  });

  it('leaves an ordinary question about the same subject to the model', async () => {
    const text = await (await ask('Explain the meaning of the wedding rituals in a Hindu marriage')).text();
    expect(text).toBe('Answer number 1');
  });
});
