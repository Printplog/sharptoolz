import { useCallback, useEffect, useRef, useState } from "react";
import type { SupportTypingEvent } from "@/types";

const TYPING_TIMEOUT_MS = 5500;
const EMIT_THROTTLE_MS = 2400;
const EMIT_IDLE_STOP_MS = 3000;

export type TypingIndicatorState = {
  active: boolean;
  name: string;
};

/**
 * Tracks live incoming customer typing state per support ticket with automatic expiry.
 */
export function useSupportTypingState() {
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const timersRef = useRef<Map<string, number>>(new Map());

  const clearTicketTyping = useCallback((ticketId?: string) => {
    if (!ticketId) return;
    const existing = timersRef.current.get(ticketId);
    if (existing !== undefined) {
      window.clearTimeout(existing);
      timersRef.current.delete(ticketId);
    }
    setTypingMap((prev) => {
      if (!(ticketId in prev)) return prev;
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
  }, []);

  const handleTypingEvent = useCallback(
    (event: SupportTypingEvent) => {
      if (!event.ticket_id || event.sender !== "customer") return;
      if (!event.is_typing) {
        clearTicketTyping(event.ticket_id);
        return;
      }

      const existing = timersRef.current.get(event.ticket_id);
      if (existing !== undefined) {
        window.clearTimeout(existing);
      }

      const name = (event.sender_name || "").trim() || "Customer";
      setTypingMap((prev) => (prev[event.ticket_id] === name ? prev : { ...prev, [event.ticket_id]: name }));

      const timeoutId = window.setTimeout(() => {
        timersRef.current.delete(event.ticket_id);
        setTypingMap((prev) => {
          if (!(event.ticket_id in prev)) return prev;
          const next = { ...prev };
          delete next[event.ticket_id];
          return next;
        });
      }, TYPING_TIMEOUT_MS);
      timersRef.current.set(event.ticket_id, timeoutId);
    },
    [clearTicketTyping],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, []);

  const getCustomerTyping = useCallback(
    (ticketId?: string | null): TypingIndicatorState => {
      if (!ticketId || !(ticketId in typingMap)) {
        return { active: false, name: "" };
      }
      return { active: true, name: typingMap[ticketId] };
    },
    [typingMap],
  );

  return {
    typingMap,
    handleTypingEvent,
    clearTicketTyping,
    getCustomerTyping,
  };
}

/**
 * Throttles outgoing typing pings (`is_typing: true`) and automatically emits
 * `is_typing: false` after idle pause, input clear, send, blur, or unmount.
 */
export function useTypingEmitter(
  emit: (isTyping: boolean) => void,
  enabled: boolean,
  resetKey?: string | null,
) {
  const emitRef = useRef(emit);
  const isTypingRef = useRef(false);
  const lastPingRef = useRef(0);
  const stopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    emitRef.current = emit;
  }, [emit]);

  const stopTyping = useCallback(() => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      lastPingRef.current = 0;
      emitRef.current(false);
    }
  }, []);

  const notifyTyping = useCallback(
    (hasText: boolean) => {
      if (!enabled) return;
      if (!hasText) {
        stopTyping();
        return;
      }

      const now = Date.now();
      if (!isTypingRef.current || now - lastPingRef.current >= EMIT_THROTTLE_MS) {
        isTypingRef.current = true;
        lastPingRef.current = now;
        emitRef.current(true);
      }

      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current);
      }
      stopTimerRef.current = window.setTimeout(() => {
        stopTimerRef.current = null;
        if (isTypingRef.current) {
          isTypingRef.current = false;
          lastPingRef.current = 0;
          emitRef.current(false);
        }
      }, EMIT_IDLE_STOP_MS);
    },
    [enabled, stopTyping],
  );

  useEffect(() => {
    return () => {
      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitRef.current(false);
      }
    };
  }, [enabled, resetKey]);

  return { notifyTyping, stopTyping };
}
