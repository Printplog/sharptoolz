import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisit } from '@/api/apiEndpoints';
import { sourceTracker } from '@/lib/utils/sourceTracker';
import { trackPageView } from '@/lib/utils/googleAnalytics';
import { useWebSocketClient } from '@/hooks/useWebSocketClient';
import { ensureVisitorId } from '@/lib/utils/visitorIdentity';
import { useAuthStore } from '@/store/authStore';

type PendingAnalyticsEvent = {
  key: string;
  payload: {
    type: 'page_view';
    path: string;
    attribution?: ReturnType<typeof sourceTracker.getAttribution>;
    referrer?: string;
  };
};

/**
 * AnalyticsTracker handles logging page views via both WebSocket (real-time) 
 * and API fallback (reliability).
 */
export function AnalyticsTracker() {
  const { user } = useAuthStore();
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
    dependencies: [visitorId, user?.pk], // Force reconnect on auth change
  });

  const flushViaApi = useCallback((path: string, attribution: any, referrer: string) => {
    const endpoint = `${import.meta.env.VITE_PUBLIC_API_URL}/analytics/log-visit/`;
    const payload = {
      path,
      attribution,
      referrer,
      visitor_id: visitorId
    };

    // 1. Use sendBeacon if available (most reliable for exit/navigation tracking)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return true;
    }

    // 2. Fallback to fetch with keepalive: true
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Last resort: standard logVisit
      void logVisit(path, attribution, referrer, visitorId);
    });
    
    return true;
  }, [visitorId]);

  const flushPendingEvent = useCallback(() => {
    if (!pendingEventRef.current) return;
    
    // If the socket is open, use it for real-time updates
    if (isOpen && sendMessage(pendingEventRef.current.payload)) {
      lastSentKeyRef.current = pendingEventRef.current.key;
      pendingEventRef.current = null;
      return;
    }

    // If socket is closed/not ready, flush via API immediately
    const { path, attribution, referrer } = pendingEventRef.current.payload;
    if (flushViaApi(path, attribution, referrer || '')) {
      lastSentKeyRef.current = pendingEventRef.current.key;
      pendingEventRef.current = null;
    }
  }, [flushViaApi, isOpen, sendMessage]);

  useEffect(() => {
    sourceTracker.captureSource();
    const attribution = sourceTracker.getAttribution();
    const path = `${location.pathname}${location.search}`;
    const referrer = document.referrer || undefined;
    const key = `${path}|${attribution?.source || 'direct'}|${attribution?.medium || '(none)'}|${attribution?.campaign || ''}`;

    // Update GA immediately
    trackPageView(path, attribution);

    const payload: PendingAnalyticsEvent = {
      key,
      payload: {
        type: 'page_view',
        path,
        attribution,
        referrer,
      },
    };

    pendingEventRef.current = payload;

    // Attempt to flush immediately
    if (isOpen) {
      flushPendingEvent();
    } else {
      // If WS is not ready, we wait a tiny bit to see if it opens, 
      // but otherwise flush to API so we don't lose the landing hit.
      const timer = window.setTimeout(() => {
        if (pendingEventRef.current?.key === key) {
          flushPendingEvent();
        }
      }, 400); // 400ms is enough for a local handshake, but fast enough to catch navigators

      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, isOpen]); // Re-run when WS state changes to flush pending

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
