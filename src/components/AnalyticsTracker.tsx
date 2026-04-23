import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisit } from '@/api/apiEndpoints';
import { sourceTracker } from '@/lib/utils/sourceTracker';
import { trackPageView } from '@/lib/utils/googleAnalytics';
import { useWebSocketClient } from '@/hooks/useWebSocketClient';
import { ensureVisitorId } from '@/lib/utils/visitorIdentity';

type PendingAnalyticsEvent = {
  key: string;
  payload: {
    type: 'page_view';
    path: string;
    attribution?: ReturnType<typeof sourceTracker.getAttribution>;
    referrer?: string;
  };
};

export function AnalyticsTracker() {
  const location = useLocation();
  const pendingEventRef = useRef<PendingAnalyticsEvent | null>(null);
  const lastSentKeyRef = useRef<string | null>(null);
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const baseWsUrl = import.meta.env.VITE_WS_URL;
  const visitorId = ensureVisitorId();
  const wsUrl = `${protocol}://${baseWsUrl}/ws/visitor-analytics/?vux_id=${encodeURIComponent(visitorId)}`;

  const { sendMessage, isOpen } = useWebSocketClient({
    url: wsUrl,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    dependencies: [visitorId],
  });

  const flushPendingEvent = useCallback(() => {
    if (!pendingEventRef.current) return;
    if (lastSentKeyRef.current === pendingEventRef.current.key) {
      pendingEventRef.current = null;
      return;
    }

    if (sendMessage(pendingEventRef.current.payload)) {
      lastSentKeyRef.current = pendingEventRef.current.key;
      pendingEventRef.current = null;
    }
  }, [sendMessage]);

  useEffect(() => {
    const attribution = sourceTracker.getAttribution();
    const path = `${location.pathname}${location.search}`;
    const key = `${path}|${attribution?.source || 'direct'}|${attribution?.medium || '(none)'}|${attribution?.campaign || ''}`;

    trackPageView(path, attribution);

    const payload: PendingAnalyticsEvent = {
      key,
      payload: {
        type: 'page_view',
        path,
        attribution,
        referrer: document.referrer || undefined,
      },
    };

    pendingEventRef.current = payload;

    if (isOpen && sendMessage(payload.payload)) {
      lastSentKeyRef.current = key;
      pendingEventRef.current = null;
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      if (lastSentKeyRef.current === key) return;
      void logVisit(path, attribution, document.referrer || undefined);
      lastSentKeyRef.current = key;
      pendingEventRef.current = null;
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [isOpen, location.pathname, location.search, sendMessage]);

  useEffect(() => {
    if (!isOpen) return;
    flushPendingEvent();
  }, [flushPendingEvent, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const heartbeatTimer = window.setInterval(() => {
      sendMessage({ type: 'heartbeat' });
    }, 25000);

    return () => {
      window.clearInterval(heartbeatTimer);
    };
  }, [isOpen, sendMessage]);

  return null;
}
