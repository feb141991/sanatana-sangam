'use client';

import { io, type Socket } from 'socket.io-client';

export interface RealtimeTransport {
  kind: 'noop' | 'socket-io';
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

function createSocketIoTransport(url: string): RealtimeTransport {
  let socket: Socket | null = null;

  function getSocket() {
    if (!socket) {
      socket = io(url, {
        autoConnect: true,
        transports: ['websocket'],
      });
    }
    return socket;
  }

  return {
    kind: 'socket-io',
    subscribe(channel, onMessage) {
      const activeSocket = getSocket();
      const handler = (payload: unknown) => onMessage(payload);
      activeSocket.on(channel, handler);
      return () => {
        activeSocket.off(channel, handler);
      };
    },
    emit(channel, payload) {
      getSocket().emit(channel, payload);
    },
    disconnect() {
      socket?.disconnect();
      socket = null;
    },
  };
}

let transportSingleton: RealtimeTransport | null = null;

export function getRealtimeTransport(): RealtimeTransport {
  if (transportSingleton) return transportSingleton;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  transportSingleton = url ? createSocketIoTransport(url) : createNoopRealtimeTransport();
  return transportSingleton;
}
