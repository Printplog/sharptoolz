import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisit } from '@/api/apiEndpoints';
import { sourceTracker } from '@/lib/utils/sourceTracker';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const source = sourceTracker.getSource();
    logVisit(location.pathname, source);
  }, [location.pathname]);

  return null;
}

