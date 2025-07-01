
// src/hooks/useWebSocketClient.ts
import { useEffect, useRef, useCallback } from 'react';

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
}: UseWebSocketClientOptions<T>) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    } else {
      console.warn('[WS] Cannot send message — socket not open:', msg);
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
      onCloseRef.current?.();

      // Only attempt reconnection if it wasn't a manual close (code 1000)
      if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current++;
        console.log(`[WS] Attempting reconnection ${reconnectCountRef.current}/${reconnectAttempts} in ${reconnectInterval}ms`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval * reconnectCountRef.current); // Exponential backoff
      }
    });

    ws.addEventListener('error', (err) => {
      console.error('[WS] Error:', err);
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
        socketRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  return { sendMessage, connect };
}