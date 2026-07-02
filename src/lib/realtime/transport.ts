'use client';

import { createClient } from '@/lib/supabase';

export interface RealtimeTransport {
  kind: 'noop' | 'supabase';
  subscribe(channel: string, onMessage: (payload: unknown) => void): () => void;
  emit(channel: string, payload: unknown): void;
  disconnect(): void;
}

function createNoopRealtimeTransport(): RealtimeTransport {
  return {
    kind: 'noop',
    subscribe() {
      return () => {};
    },
    emit() {},
    disconnect() {},
  };
}

function createSupabaseRealtimeTransport(): RealtimeTransport {
  const supabase = createClient();
  const channels: Map<string, ReturnType<typeof supabase.channel>> = new Map();

  return {
    kind: 'supabase',
    subscribe(channel, onMessage) {
      const ch = supabase
        .channel(`transport:${channel}`)
        .on('broadcast', { event: 'message' }, ({ payload }) => onMessage(payload))
        .subscribe();

      channels.set(channel, ch);

      return () => {
        void supabase.removeChannel(ch);
        channels.delete(channel);
      };
    },
    emit(channel, payload) {
      const ch = channels.get(channel);
      if (ch) {
        void ch.send({ type: 'broadcast', event: 'message', payload });
      }
    },
    disconnect() {
      channels.forEach((ch) => void supabase.removeChannel(ch));
      channels.clear();
    },
  };
}

let transportSingleton: RealtimeTransport | null = null;

export function getRealtimeTransport(): RealtimeTransport {
  if (transportSingleton) return transportSingleton;
  transportSingleton = createSupabaseRealtimeTransport();
  return transportSingleton;
}
