'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { WSServerMessage, WSClientMessage } from '@soulpair/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WSServerMessage[]>([]);
  const listenersRef = useRef<Map<string, Set<(msg: WSServerMessage) => void>>>(new Map());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[WS] Connected to Soulpair');
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSServerMessage = JSON.parse(event.data);
        setMessages(prev => [...prev.slice(-100), msg]); // Keep last 100

        // Notify listeners
        const typeListeners = listenersRef.current.get(msg.type);
        if (typeListeners) {
          typeListeners.forEach(cb => cb(msg));
        }

        // Notify wildcard listeners
        const allListeners = listenersRef.current.get('*');
        if (allListeners) {
          allListeners.forEach(cb => cb(msg));
        }
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  const send = useCallback((msg: WSClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback((type: string, callback: (msg: WSServerMessage) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(callback);

    return () => {
      listenersRef.current.get(type)?.delete(callback);
    };
  }, []);

  const auth = useCallback((walletAddress: string, signature: string, role: 'agent' | 'viewer' = 'viewer') => {
    send({ type: 'auth', walletAddress, signature, role });
  }, [send]);

  const subscribeDashboard = useCallback(() => {
    send({ type: 'subscribe_dashboard' });
  }, [send]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, messages, send, subscribe, auth, subscribeDashboard };
}
