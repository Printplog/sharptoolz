
// src/hooks/useWebSocketClient.ts
import { useEffect, useRef, useCallback, useState } from 'react';

type Listener<T> = (data: T) => void;

type UseWebSocketClientOptions<T> = {
  url: string;
  onMessage?: Listener<T>;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  dependencies?: ReadonlyArray<unknown>; // New: dependencies to trigger reconnection
};

export function useWebSocketClient<T = unknown>({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  protocols,
  reconnectAttempts = 3,
  reconnectInterval = 1000,
  dependencies = [], // New
}: UseWebSocketClientOptions<T>) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Store callbacks in refs to avoid dependency issues
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const sendMessage = useCallback((msg: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
      return true;
    } else {
      console.warn('[WS] Cannot send message — socket not open:', msg);
      return false;
    }
  }, []);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    console.log('[WS] Connecting to:', url);
    const ws = new WebSocket(url, protocols);
    socketRef.current = ws;

    ws.addEventListener('open', () => {
      console.log('[WS] Connected:', url);
      reconnectCountRef.current = 0; // Reset reconnect counter on successful connection
      setIsOpen(true);
      onOpenRef.current?.();
    });

    ws.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessageRef.current?.(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    });

    ws.addEventListener('close', (event) => {
      console.warn('[WS] Connection closed. Code:', event.code, 'Reason:', event.reason);
      setIsOpen(false);
      onCloseRef.current?.();

      // Only attempt reconnection if it wasn't a manual close (code 1000)
      if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
        // Don't reconnect while the tab is hidden — the browser may freeze
        // the timer anyway, and reconnect storms from background tabs are a
        // primary source of server-side DB connection pressure.
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }

        reconnectCountRef.current++;
        // True exponential backoff capped at 60s, with ½–1× jitter so a
        // server hiccup doesn't synchronize every client into a thundering herd.
        const MAX = 60_000;
        const base = Math.min(MAX, reconnectInterval * Math.pow(2, reconnectCountRef.current - 1));
        const delay = Math.floor(base * (0.5 + Math.random() * 0.5));
        console.log(`[WS] Attempting reconnection ${reconnectCountRef.current}/${reconnectAttempts} in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    });

    ws.addEventListener('error', (err) => {
      console.error('[WS] Error:', err);
      setIsOpen(false);
      onErrorRef.current?.(err);
    });
  }, [url, protocols, reconnectAttempts, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      console.log('[WS] Cleaning up socket:', url);
      
      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close the socket with code 1000 (normal closure) to prevent reconnection
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting or dependency change');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, ...dependencies]);

  return { sendMessage, connect, isOpen };
}
