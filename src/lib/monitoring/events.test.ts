import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== 'monitoring_events') {
        throw new Error(`Unexpected monitoring table: ${table}`);
      }
      return { insert };
    },
  }),
}));

import { _eventSink, emitEvent } from './events';

describe('monitoring event persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
    _eventSink.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buffers RAG telemetry immediately and flushes it to Supabase', async () => {
    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/ai/chat',
      context: {
        rag_grounded: true,
        rag_corpus: 'pathshala_gita',
        chunks_count: 1,
        rag_latency_ms: 12,
      },
    });

    expect(_eventSink).toHaveLength(1);
    expect(_eventSink[0]).toEqual(expect.objectContaining({
      domain: 'ai',
      route: '/api/ai/chat',
      context: expect.objectContaining({ rag_corpus: 'pathshala_gita' }),
    }));

    await vi.advanceTimersByTimeAsync(5_000);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        domain: 'ai',
        route: '/api/ai/chat',
        context: expect.objectContaining({
          rag_grounded: true,
          chunks_count: 1,
        }),
      }),
    ]);
  });
});
