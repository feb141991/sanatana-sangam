import { describe, expect, it, vi } from 'vitest';
import {
  CHAT_ANSWER_TTL_MS,
  buildAnswerCacheKey,
  fingerprintText,
  isDateRelative,
  normalizeQuestionText,
  readCachedAnswer,
  rememberAnswer,
  type AnswerKeyInput,
} from './chat-answer-cache';

const base: AnswerKeyInput = {
  userId: 'user-1',
  conversation: 'What does Om mean?',
  language: 'en',
  meaningLanguage: 'en',
  transliterationLanguage: 'en',
  tradition: 'hindu',
  rank: 'seeker',
  sampradaya: null,
  city: 'London',
  country: 'UK',
  seeking: ['peace', 'focus'],
  spiritualDate: '2026-10-29',
  promptFingerprint: fingerprintText('prompt v1'),
  corpusVersion: '2026-10-29',
  model: 'sarvam-105b-conversations',
};
const key = (over: Partial<AnswerKeyInput> = {}) => buildAnswerCacheKey({ ...base, ...over });

describe('normalizeQuestionText', () => {
  it('ignores case, spacing and trailing punctuation, and nothing that changes the meaning', () => {
    expect(normalizeQuestionText('  What does   OM mean?? ')).toBe('what does om mean');
    expect(normalizeQuestionText('What does Om mean?')).toBe(normalizeQuestionText('what does om mean'));
    expect(normalizeQuestionText('मुहूर्त क्या होता है?')).toBe('मुहूर्त क्या होता है');
    expect(normalizeQuestionText('What does Om mean')).not.toBe(normalizeQuestionText('What does Aum mean'));
  });
});

describe('isDateRelative', () => {
  it('is true when the answer depends on today, in three languages', () => {
    for (const q of ['When is the next ekadashi?', 'what is today\'s tithi', 'Any vrat this week', 'aaj kya hai', 'आज कौन सा व्रत है', 'ਅੱਜ ਕਿਹੜਾ ਦਿਨ ਹੈ']) {
      expect(isDateRelative(q), q).toBe(true);
    }
  });
  it('is false for a timeless question', () => {
    for (const q of ['What does Om mean?', 'Explain Bhagavad Gita 2.47', 'ॐ का अर्थ क्या है']) expect(isDateRelative(q), q).toBe(false);
  });
});

describe('buildAnswerCacheKey', () => {
  it('is the same for the same person, question and context, however the question is typed', () => {
    expect(key()).toBe(key());
    expect(key({ conversation: '  what does OM mean ' })).toBe(key());
    expect(key({ seeking: ['focus', 'peace'] })).toBe(key({ seeking: ['peace', 'focus'] }));
    expect(key()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes with everything that can change the answer', () => {
    const k = key();
    const variants: Array<Partial<AnswerKeyInput>> = [
      { userId: 'user-2' }, { conversation: 'What does Aum mean?' }, { language: 'hi' }, { meaningLanguage: 'hi' },
      { transliterationLanguage: 'hi' }, { tradition: 'sikh' }, { rank: 'sadhak' }, { sampradaya: 'vaishnava' },
      { city: 'Leeds' }, { country: 'IN' }, { seeking: ['peace'] }, { promptFingerprint: fingerprintText('prompt v2') },
      { corpusVersion: '2026-11-15' }, { model: 'another-model' },
    ];
    for (const v of variants) expect(key(v), JSON.stringify(v)).not.toBe(k);
  });

  it('includes today only for a question that depends on it', () => {
    expect(key({ spiritualDate: '2026-10-30' })).toBe(key());
    const when = { conversation: 'When is the next ekadashi?' };
    expect(key({ ...when, spiritualDate: '2026-10-30' })).not.toBe(key({ ...when, spiritualDate: '2026-10-29' }));
  });

  it('includes the earlier turns, so a follow-up is not mistaken for a first question', () => {
    expect(key({ conversation: 'User: tell me about Om\nAssistant: Om is...\nUser: and its parts?' })).not.toBe(key({ conversation: 'and its parts?' }));
  });
});

/** An in-memory stand-in for the table, with the few query methods the module uses. */
function fakeDb(opts: { failRead?: boolean; failWrite?: boolean } = {}) {
  const rows: Array<Record<string, any>> = [];
  const db = {
    rows,
    from() {
      const filters: Array<(r: any) => boolean> = [];
      let op: 'select' | 'delete' | 'upsert' = 'select';
      let payload: any;
      let ignoreDup = false;
      const q: any = {
        select: () => q,
        delete: () => { op = 'delete'; return q; },
        upsert: (row: any, o: any) => { op = 'upsert'; payload = row; ignoreDup = !!o?.ignoreDuplicates; return q; },
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return q; },
        gt: (c: string, v: any) => { filters.push((r) => r[c] > v); return q; },
        lt: (c: string, v: any) => { filters.push((r) => r[c] < v); return q; },
        maybeSingle: async () => {
          if (opts.failRead) return { data: null, error: { code: 'XX000' } };
          return { data: rows.find((r) => filters.every((f) => f(r))) ?? null, error: null };
        },
        then: (resolve: (v: any) => any) => {
          if (op === 'delete') { for (let i = rows.length - 1; i >= 0; i--) if (filters.every((f) => f(rows[i]))) rows.splice(i, 1); return resolve({ error: null }); }
          if (op === 'upsert') {
            if (opts.failWrite) return resolve({ error: { code: 'XX000' } });
            const dup = rows.find((r) => r.user_id === payload.user_id && r.cache_key === payload.cache_key);
            if (!dup || !ignoreDup) rows.push({ ...payload });
            return resolve({ error: null });
          }
          return resolve({ error: null });
        },
      };
      return q;
    },
  };
  return db;
}
const remember = (db: any, answer: string, now = new Date('2026-10-29T10:00:00Z')) =>
  rememberAnswer(db, { userId: 'user-1', key: 'k'.repeat(64), answer, provider: 'sarvam-hosted', model: 'm', promptFingerprint: 'p', corpusVersion: 'c' }, now);

describe('remembering an answer', () => {
  it('gives the first answer back the second time', async () => {
    const db = fakeDb();
    const first = await remember(db, 'Om is the primordial sound.');
    expect(first.answer).toBe('Om is the primordial sound.');
    const again = await readCachedAnswer(db, 'user-1', 'k'.repeat(64), new Date('2026-10-29T11:00:00Z'));
    expect(again?.answer).toBe('Om is the primordial sound.');
  });

  it('first writer wins: a second, different answer for the same key is replaced by the remembered one', async () => {
    const db = fakeDb();
    await remember(db, 'First answer.');
    const second = await remember(db, 'A different answer.');
    expect(second.answer).toBe('First answer.');
    expect(db.rows).toHaveLength(1);
  });

  it('is scoped to the person: another user never gets it', async () => {
    const db = fakeDb();
    await remember(db, 'Private answer.');
    expect(await readCachedAnswer(db, 'user-2', 'k'.repeat(64), new Date('2026-10-29T11:00:00Z'))).toBeNull();
  });

  it('expires after the retention period, and an expired row does not block a fresh answer', async () => {
    const db = fakeDb();
    await remember(db, 'Old answer.', new Date('2026-10-01T10:00:00Z'));
    const later = new Date(new Date('2026-10-01T10:00:00Z').getTime() + CHAT_ANSWER_TTL_MS + 1000);
    expect(await readCachedAnswer(db, 'user-1', 'k'.repeat(64), later)).toBeNull();
    const fresh = await remember(db, 'New answer.', later);
    expect(fresh.answer).toBe('New answer.');
    expect(db.rows).toHaveLength(1);
  });

  it('stores only hashes and answers: the question text never reaches the table', async () => {
    const db = fakeDb();
    await remember(db, 'An answer.');
    expect(Object.keys(db.rows[0]).sort()).toEqual(['answer', 'cache_key', 'corpus_version', 'created_at', 'expires_at', 'model', 'prompt_fingerprint', 'provider', 'user_id']);
  });

  it('never fails the chat: a broken read is a miss, a broken write still returns the generated answer', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await readCachedAnswer(fakeDb({ failRead: true }), 'user-1', 'k'.repeat(64))).toBeNull();
    expect((await remember(fakeDb({ failWrite: true }), 'Still answered.')).answer).toBe('Still answered.');
    expect((await rememberAnswer({ from: () => { throw new Error('down'); } }, { userId: 'u', key: 'k', answer: 'x', provider: null, model: null, promptFingerprint: 'p', corpusVersion: 'c' })).answer).toBe('x');
    warn.mockRestore();
  });

  it('does not remember an empty or oversized answer', async () => {
    const db = fakeDb();
    expect((await remember(db, '   ')).answer).toBe('   ');
    expect((await remember(db, 'x'.repeat(8001))).answer.length).toBe(8001);
    expect(db.rows).toHaveLength(0);
  });
});
