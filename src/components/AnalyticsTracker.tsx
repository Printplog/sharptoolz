import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisit } from '@/api/apiEndpoints';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Debounce or just log? 
    // Just log unique paths or every navigation?
    // User wants "website visit to frontend", implying page views.
    logVisit(location.pathname);
  }, [location.pathname]);

  return null;
}
